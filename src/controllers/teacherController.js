import admin from "firebase-admin";
import credentials from "../../firebaseServiceAccount.json" with { type: 'json' };
import pool from '../config/db.js';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(credentials)
  });
  console.log('🔥 Firebase initialized successfully');
}

export const teacherAuth = async (req, res) => {
  console.log('🎯 Teacher registration endpoint called');
  console.log('📝 Request body:', req.body);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('✅ Database transaction started');
    
    const { name, email, password, nic, address, phone, image, cv, group_id } = req.body;

    // Validate input
    if (!name || !email || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate NIC if provided
    if (nic && (typeof nic !== 'number' || nic <= 0)) {
      console.log('❌ Validation failed: Invalid NIC format');
      return res.status(400).json({
        success: false,
        message: 'NIC must be a valid positive number'
      });
    }

    console.log('✅ Input validation passed');

    // Check if email already exists in database
    console.log('🔍 Checking if email exists:', email);
    const emailCheck = await client.query(
      'SELECT email FROM "user" WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      console.log('❌ Email already exists in database');
      return res.status(400).json({
        success: false,
        message: 'Email already exists in database'
      });
    }

    console.log('✅ Email is unique, proceeding with Firebase user creation');

    // Create user in Firebase first
    console.log('🔥 Creating Firebase user...');
    const firebaseUser = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: false,
      disabled: false
    });

    console.log('✅ Firebase teacher created:', firebaseUser.uid);

    // Insert user into PostgreSQL user table
    console.log('💾 Inserting user into PostgreSQL...');
    const userResult = await client.query(
      `INSERT INTO "user" (nic, name, address, email, phone, image, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        nic || 999999999, // Use a default NIC if not provided (you might want to make this field nullable in DB)
        name,
        address || null,
        email,
        phone || null,
        image || null,
        'teacher', // Always teacher for this endpoint
        'active'
      ]
    );

    const dbUser = userResult.rows[0];
    console.log('✅ Database user created:', dbUser.user_id);

    // Insert teacher-specific data
    console.log('👨‍🏫 Creating teacher record...');
    const teacherResult = await client.query(
      'INSERT INTO teacher (user_id, cv, group_id) VALUES ($1, $2, $3) RETURNING teacher_id',
      [dbUser.user_id, cv || null, group_id || null]
    );

    const teacherId = teacherResult.rows[0].teacher_id;
    console.log('✅ Teacher record created with ID:', teacherId);

    // If group_id is provided, update the group table to assign this teacher
    if (group_id) {
      // Check what position is available in the group
      const groupCheck = await client.query(
        'SELECT main_teacher_id, co_teacher_id FROM "group" WHERE group_id = $1',
        [group_id]
      );

      if (groupCheck.rows.length > 0) {
        const group = groupCheck.rows[0];
        
        if (group.main_teacher_id === null) {
          // Assign as main teacher
          await client.query(
            'UPDATE "group" SET main_teacher_id = $1 WHERE group_id = $2',
            [teacherId, group_id]
          );
          console.log('✅ Teacher assigned as main teacher to group:', group_id);
        } else if (group.co_teacher_id === null) {
          // Assign as co-teacher
          await client.query(
            'UPDATE "group" SET co_teacher_id = $1 WHERE group_id = $2',
            [teacherId, group_id]
          );
          console.log('✅ Teacher assigned as co-teacher to group:', group_id);
        } else {
          // Group is full, remove group_id from teacher record
          await client.query(
            'UPDATE teacher SET group_id = NULL WHERE teacher_id = $1',
            [teacherId]
          );
          console.log('⚠️ Group is full, teacher not assigned to group');
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Teacher account created successfully',
      user: {
        id: dbUser.user_id,
        firebaseUid: firebaseUser.uid,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        nic: dbUser.nic,
        address: dbUser.address,
        phone: dbUser.phone,
        image: dbUser.image,
        cv: cv || null,
        group_id: group_id || null,
        status: dbUser.status,
        created_at: dbUser.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Teacher signup error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle Firebase specific errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists in Firebase'
      });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Handle database errors
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Handle table doesn't exist error
    if (error.code === '42P01') {
      console.error('❌ Database table does not exist:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Database schema error - missing tables'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Teacher account creation failed',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get all teachers
export const getAllTeachers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.nic,
        u.name,
        u.address,
        u.email,
        u.phone,
        u.image,
        u.role,
        u.status,
        u.created_at,
        t.teacher_id,
        t.cv,
        t.group_id,
        g.name as group_name
       FROM "user" u
       INNER JOIN teacher t ON u.user_id = t.user_id
       LEFT JOIN "group" g ON t.group_id = g.group_id
       WHERE u.role = 'teacher' AND u.status = 'active'
       ORDER BY u.created_at DESC`
    );

    const teachers = result.rows.map(teacher => ({
      id: teacher.user_id,
      teacher_id: teacher.teacher_id,
      name: teacher.name,
      email: teacher.email,
      nic: teacher.nic,
      address: teacher.address,
      phone: teacher.phone,
      image: teacher.image,
      cv: teacher.cv,
      group_id: teacher.group_id,
      group_name: teacher.group_name,
      role: teacher.role,
      status: teacher.status,
      created_at: teacher.created_at
    }));

    res.json({
      success: true,
      teachers: teachers,
      count: teachers.length
    });

  } catch (error) {
    console.error('❌ Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
};

// Search teachers
export const searchTeachers = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.trim() === '') {
      return getAllTeachers(req, res);
    }

    const searchTerm = `%${search.toLowerCase()}%`;
    
    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.nic,
        u.name,
        u.address,
        u.email,
        u.phone,
        u.image,
        u.role,
        u.status,
        u.created_at,
        t.teacher_id,
        t.cv,
        t.group_id,
        g.name as group_name
       FROM "user" u
       INNER JOIN teacher t ON u.user_id = t.user_id
       LEFT JOIN "group" g ON t.group_id = g.group_id
       WHERE u.role = 'teacher' 
       AND u.status = 'active'
       AND (
         LOWER(u.name) LIKE $1 OR
         LOWER(u.email) LIKE $1 OR
         CAST(u.phone AS TEXT) LIKE $1 OR
         CAST(u.nic AS TEXT) LIKE $1 OR
         LOWER(g.name) LIKE $1
       )
       ORDER BY u.created_at DESC`,
      [searchTerm]
    );

    const teachers = result.rows.map(teacher => ({
      id: teacher.user_id,
      teacher_id: teacher.teacher_id,
      name: teacher.name,
      email: teacher.email,
      nic: teacher.nic,
      address: teacher.address,
      phone: teacher.phone,
      image: teacher.image,
      cv: teacher.cv,
      group_id: teacher.group_id,
      group_name: teacher.group_name,
      role: teacher.role,
      status: teacher.status,
      created_at: teacher.created_at
    }));

    res.json({
      success: true,
      teachers: teachers,
      count: teachers.length,
      searchTerm: search
    });

  } catch (error) {
    console.error('❌ Search teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search teachers',
      error: error.message
    });
  }
};

// Get teacher by ID
export const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.nic,
        u.name,
        u.address,
        u.email,
        u.phone,
        u.image,
        u.role,
        u.status,
        u.created_at,
        t.teacher_id,
        t.cv,
        t.group_id,
        g.name as group_name
       FROM "user" u
       INNER JOIN teacher t ON u.user_id = t.user_id
       LEFT JOIN "group" g ON t.group_id = g.group_id
       WHERE u.user_id = $1 AND u.role = 'teacher'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const teacher = result.rows[0];
    const teacherData = {
      id: teacher.user_id,
      teacher_id: teacher.teacher_id,
      name: teacher.name,
      email: teacher.email,
      nic: teacher.nic,
      address: teacher.address,
      phone: teacher.phone,
      image: teacher.image,
      cv: teacher.cv,
      group_id: teacher.group_id,
      group_name: teacher.group_name,
      role: teacher.role,
      status: teacher.status,
      created_at: teacher.created_at
    };

    res.json({
      success: true,
      teacher: teacherData
    });

  } catch (error) {
    console.error('❌ Get teacher by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher',
      error: error.message
    });
  }
};

// Get available groups (groups with null main_teacher_id or co_teacher_id)
export const getAvailableGroups = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        group_id,
        name,
        age_category,
        main_teacher_id,
        co_teacher_id,
        CASE 
          WHEN main_teacher_id IS NULL THEN 'main_teacher'
          WHEN co_teacher_id IS NULL THEN 'co_teacher'
          ELSE 'full'
        END as available_position
       FROM "group"
       WHERE main_teacher_id IS NULL OR co_teacher_id IS NULL
       ORDER BY name ASC`
    );

    const availableGroups = result.rows.map(group => ({
      group_id: group.group_id,
      name: group.name,
      age_category: group.age_category,
      available_position: group.available_position,
      main_teacher_id: group.main_teacher_id,
      co_teacher_id: group.co_teacher_id
    }));

    res.json({
      success: true,
      groups: availableGroups,
      count: availableGroups.length
    });

  } catch (error) {
    console.error('❌ Get available groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available groups',
      error: error.message
    });
  }
};

export const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // First, get user details from PostgreSQL
    const userResult = await pool.query(
      `SELECT u.*, t.teacher_id, t.cv, t.group_id
       FROM "user" u 
       LEFT JOIN teacher t ON u.user_id = t.user_id 
       WHERE u.email = $1 AND u.role IN ('teacher', 'supervisor') AND u.status = 'active'`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const dbUser = userResult.rows[0];

    // Verify password using Firebase Auth REST API
    // You need to add your Firebase Web API Key to .env file
    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    
    if (!firebaseApiKey) {
      console.error('FIREBASE_API_KEY not found in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    try {
      // Use Firebase Web API to verify password
      const firebaseResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      });

      const firebaseData = await firebaseResponse.json();

      if (!firebaseResponse.ok) {
        console.error('Firebase auth failed:', firebaseData);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Get Firebase user details using Admin SDK
      const firebaseUser = await admin.auth().getUser(firebaseData.localId);
      
      // Check if Firebase user is disabled
      if (firebaseUser.disabled) {
        return res.status(403).json({
          success: false,
          message: 'Account is disabled'
        });
      }

      // Create a custom token for the user (password has been verified)
      const customToken = await admin.auth().createCustomToken(firebaseUser.uid, {
        role: dbUser.role,
        userId: dbUser.user_id,
        email: dbUser.email
      });

      console.log(`✅ Login successful for ${email} (${dbUser.role})`);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: dbUser.user_id,
          firebaseUid: firebaseUser.uid,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          nic: dbUser.nic,
          address: dbUser.address,
          phone: dbUser.phone,
          image: dbUser.image,
          status: dbUser.status,
          created_at: dbUser.created_at,
          // Include supervisor-specific data if it exists
          sup_id: dbUser.sup_id || null,
          cv: dbUser.cv || null,
          group_id: dbUser.group_id || null
        },
        customToken: customToken
      });

    } catch (authError) {
      console.error('Firebase authentication failed:', authError);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

  } catch (error) {
    console.error('❌ Supervisor login error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};