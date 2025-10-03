import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';
import { getVerifiedParentByEmail } from '../../models/parent/parentModel.js';

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

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

    // Database lookup - get parent data first
    const parentQuery = `
      SELECT u.*, p.parent_id, p.password, p.verified, p.token
      FROM "user" u 
      JOIN parent p ON u.user_id = p.user_id
      WHERE u.email = $1 AND u.role = 'parent'
    `;
    const result = await pool.query(parentQuery, [email]);

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

    // Fetch all children for this parent
    const childrenQuery = `
      SELECT child_id, name, age, gender, dob, group_id, image, blood_type, created_at
      FROM child 
      WHERE parent_id = $1
      ORDER BY created_at ASC
    `;
    const childrenResult = await pool.query(childrenQuery, [parent.parent_id]);
    
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
        children: childrenResult.rows, // Children as array
        childrenCount: childrenResult.rows.length,
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

export const checkVerifiedParent = async (req, res, next) => {
  console.log('Checking if parent is verified:', req.body);
  try{
    const {email} = req.body;
    const query = await getVerifiedParentByEmail(email);

    if(query){
      return handleResponse(res, 200, 'Parent is verified', {verified: true});
    } else {
      return handleResponse(res, 403, 'Parent is not verified', {verified: false});
    }
  }catch (error) {
    console.error('Error checking verified parent:', error);
    return handleResponse(res, 500, 'Server error', {error: 'SERVER_ERROR'});
  }
};

