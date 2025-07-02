import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';

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

    // Database lookup - find parent by email
    const query = 'SELECT * FROM parents WHERE email = $1';
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
        id: parent.id,
        email: parent.email,
        role: 'parent'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Success response - exclude password from response
    const { password: _, ...parentData } = parent;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: parentData.id,
          email: parentData.email,
          name: parentData.name,
          phone: parentData.phone,
          children: parentData.children,
          verified: parentData.verified,
          created_at: parentData.created_at,
          updated_at: parentData.updated_at
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
