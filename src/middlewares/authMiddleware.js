import pool from '../config/db.js';

// Simple authentication middleware that works with stored user data
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // For now, let's extract user info from the request body or headers
    // In a production app, you'd want to decode and verify a proper JWT token
    const token = authHeader.split(' ')[1];
    
    // Since we don't have proper JWT tokens, let's get user email from headers
    // This is a temporary solution - in production, you should use proper JWT
    const userEmail = req.headers['x-user-email'];
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'User identification required'
      });
    }

    // Get user details from database
    const userResult = await pool.query(
      'SELECT * FROM "user" WHERE email = $1 AND status = $2',
      [userEmail, 'active']
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const user = userResult.rows[0];

    // Add user info to request object
    req.user = {
      userId: user.user_id,
      email: user.email,
      role: user.role
    };

    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check if user has supervisor or admin role
export const requireSupervisorOrAdmin = (req, res, next) => {
  if (!req.user || !['supervisor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Supervisor or admin role required.'
    });
  }
  next();
};
