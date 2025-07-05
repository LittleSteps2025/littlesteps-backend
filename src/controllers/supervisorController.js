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

export const supervisorAuth = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, email, password, nic, address, phone, image, cv } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if email already exists in database
    const emailCheck = await client.query(
      'SELECT email FROM "user" WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists in database'
      });
    }

    // Create user in Firebase first
    const firebaseUser = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: false,
      disabled: false
    });

    console.log('✅ Firebase user created:', firebaseUser.uid);

    // Insert user into PostgreSQL user table
    const userResult = await client.query(
      `INSERT INTO "user" (nic, name, address, email, phone, image, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        nic || null,
        name,
        address || null,
        email,
        phone || null,
        image || null,
        'supervisor', // Always supervisor for this endpoint
        'active'
      ]
    );

    const dbUser = userResult.rows[0];
    console.log('✅ Database user created:', dbUser.user_id);

    // Insert supervisor-specific data
    await client.query(
      'INSERT INTO supervisor (user_id, cv) VALUES ($1, $2)',
      [dbUser.user_id, cv || null]
    );

    console.log('✅ Supervisor record created');

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Supervisor account created successfully',
      user: {
        id: dbUser.user_id,
        firebaseUid: firebaseUser.uid,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        created_at: dbUser.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Supervisor signup error:', error);
    
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

    res.status(500).json({
      success: false,
      message: 'Account creation failed',
      error: error.message
    });
  } finally {
    client.release();
  }
};

export const supervisorLogin = async (req, res) => {
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
      `SELECT u.*, s.sup_id, s.cv 
       FROM "user" u 
       LEFT JOIN supervisor s ON u.user_id = s.user_id 
       WHERE u.email = $1 AND u.role IN ('supervisor', 'admin') AND u.status = 'active'`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or account inactive'
      });
    }

    const dbUser = userResult.rows[0];

    // Verify user exists in Firebase and get Firebase user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
    } catch (firebaseError) {
      console.error('Firebase user not found:', firebaseError);
      return res.status(404).json({
        success: false,
        message: 'User not found in authentication system'
      });
    }

    // Check if Firebase user is disabled
    if (firebaseUser.disabled) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // Create a custom token for the user (Firebase handles password verification on client)
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid, {
      role: dbUser.role,
      userId: dbUser.user_id,
      email: dbUser.email
    });

    res.json({
      success: true,
      message: 'Login verification successful',
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
        cv: dbUser.cv || null
      },
      customToken: customToken
    });

  } catch (error) {
    console.error('❌ Supervisor login error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Admin signup function - admins are stored only in user table
export const adminAuth = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, email, password, nic, address, phone, image } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if email already exists in database
    const emailCheck = await client.query(
      'SELECT email FROM "user" WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists in database'
      });
    }

    // Create user in Firebase first
    const firebaseUser = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: false,
      disabled: false
    });

    console.log('✅ Firebase admin user created:', firebaseUser.uid);

    // Insert admin into PostgreSQL user table (no separate admin table)
    const userResult = await client.query(
      `INSERT INTO "user" (nic, name, address, email, phone, image, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        nic || null,
        name,
        address || null,
        email,
        phone || null,
        image || null,
        'admin', // Admin role
        'active'
      ]
    );

    const dbUser = userResult.rows[0];
    console.log('✅ Database admin user created:', dbUser.user_id);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: dbUser.user_id,
        firebaseUid: firebaseUser.uid,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        created_at: dbUser.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Admin signup error:', error);
    
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

    res.status(500).json({
      success: false,
      message: 'Admin account creation failed',
      error: error.message
    });
  } finally {
    client.release();
  }
};