import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';
import ParentModel from '../../models/parent/parentModel.js';   

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const parentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Database lookup - join user and parent tables
    const query = `
      SELECT u.*, p.parent_id, p.password, p.verified, p.token
      FROM "user" u 
      JOIN parent p ON u.user_id = p.user_id 
      WHERE u.email = $1 AND u.role = 'parent'
    `;
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found',
        error: 'PARENT_NOT_FOUND'
      });
    }

    const parent = result.rows[0];

    // Check if account is verified
    if (!parent.verified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify your email first.',
        error: 'ACCOUNT_NOT_VERIFIED'
      });
    }

    // Check if password exists (account setup completed)
    if (!parent.password) {
      return res.status(403).json({
        success: false,
        message: 'Account setup not completed. Please complete your registration.',
        error: 'ACCOUNT_SETUP_INCOMPLETE'
      });
    }

    // Password verification
    const isPasswordValid = await bcrypt.compare(password, parent.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        error: 'INVALID_PASSWORD'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: parent.user_id,
        parentId: parent.parent_id,
        email: parent.email,
        role: parent.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Success response - exclude password and token from response
    const { password: _, token: __, ...parentData } = parent;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: parentData.user_id,
          parentId: parentData.parent_id,
          email: parentData.email,
          name: parentData.name,
          phone: parentData.phone,
          address: parentData.address,
          image: parentData.image,
          verified: parentData.verified,
          status: parentData.status,
          created_at: parentData.created_at
        },
        token,
        tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      }
    });

  } catch (error) {
    console.error('Parent login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
};



export const verifyParentToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.parent = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN'
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const query = `
      SELECT u.*, p.parent_id, p.password, p.verified, p.token
      FROM "user" u 
      JOIN parent p ON u.user_id = p.user_id 
      WHERE u.role = 'parent'
    `;
    const result = await pool.query(query);

    const parents = result.rows.map(parent => {
      const { password, token, ...parentData } = parent;
      return parentData;
    });

    res.status(200).json({
      success: true,
      data: parents
    });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
};

export const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT u.*, p.parent_id, p.password, p.verified, p.token
      FROM "user" u 
      JOIN parent p ON u.user_id = p.user_id 
      WHERE u.role = 'parent' AND p.parent_id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found',
        error: 'PARENT_NOT_FOUND'
      });
    }

    const parent = result.rows[0];
    const { password, token, ...parentData } = parent;

    res.status(200).json({
      success: true,
      data: parentData
    });
  } catch (error) {
    console.error('Error fetching parent by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
};

export const create = async (req, res) => {
  const { email, password, name, phone, address } = req.body;

  try {
    // Check if parent already exists
    const existingParentQuery = `
      SELECT u.*, p.parent_id
      FROM "user" u 
      JOIN parent p ON u.user_id = p.user_id 
      WHERE u.email = $1 AND u.role = 'parent'
    `;
    const existingParent = await pool.query(existingParentQuery, [email]);

    if (existingParent.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Parent with this email already exists',
        error: 'PARENT_EXISTS'
      });
    }

    // Create new parent
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserQuery = `
      INSERT INTO "user" (email, password, role, name, phone, address)
      VALUES ($1, $2, 'parent', $3, $4, $5)
      RETURNING user_id, email, role, name, phone, address
    `;
    const newUserResult = await pool.query(newUserQuery, [email, hashedPassword, name, phone, address]);

    const newUser = newUserResult.rows[0];

    // Create parent record
    const newParentQuery = `
      INSERT INTO parent (user_id)
      VALUES ($1)
      RETURNING parent_id
    `;
    const newParentResult = await pool.query(newParentQuery, [newUser.user_id]);

    const newParent = newParentResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Parent created successfully',
      data: {
        user: {
          id: newUser.user_id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone,
          address: newUser.address
        },
        parentId: newParent.parent_id
      }
    });
  } catch (error) {
    console.error('Error creating parent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { email, password, name, phone, address } = req.body;

  try {
    // Check if parent exists
    const parentQuery = `
      SELECT u.*, p.parent_id
      FROM "user" u 
      JOIN parent p ON u.user_id = p.user_id 
      WHERE p.parent_id = $1
    `;
    const parentResult = await pool.query(parentQuery, [id]);

    if (parentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found',
        error: 'PARENT_NOT_FOUND'
      });
    }

    const parent = parentResult.rows[0];

    // Update user and parent information
    const hashedPassword = password ? await bcrypt.hash(password, 10) : parent.password;
    const updateUserQuery = `
      UPDATE "user"
      SET email = $1, password = $2, name = $3, phone = $4, address = $5
      WHERE user_id = $6
    `;
    await pool.query(updateUserQuery, [email, hashedPassword, name, phone, address, parent.user_id]);

    res.status(200).json({
      success: true,
      message: 'Parent updated successfully'
    });
  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
};

export const deleteParent = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if parent exists
    const parentQuery = `
      SELECT u.*, p.parent_id
      FROM "user" u 
      JOIN parent p ON u.user_id = p.user_id 
      WHERE p.parent_id = $1
    `;
    const parentResult = await pool.query(parentQuery, [id]);

    if (parentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found',
        error: 'PARENT_NOT_FOUND'
      });
    }

    // Delete parent record
    const deleteParentQuery = `
      DELETE FROM parent
      WHERE parent_id = $1
    `;
    await pool.query(deleteParentQuery, [id]);

    // Delete user account
    const deleteUserQuery = `
      DELETE FROM "user"
      WHERE user_id = $1
    `;
    await pool.query(deleteUserQuery, [parentResult.rows[0].user_id]);

    res.status(200).json({
      success: true,
      message: 'Parent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting parent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
};
