import pool from '../config/db.js';
import crypto from 'crypto';

// Verification Token Functions
export const generateVerificationToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

export const getVerificationToken = async (email, token) => {
  const result = await pool.query(
    'SELECT p.token FROM parent p JOIN "user" u ON p.user_id = u.user_id WHERE u.email = $1',
    [email]
  );

  console.log('Query result:', result.rows[0]);

  if (result.rows.length === 0) {
    console.log('No user found with email:', email);
    return false;
  }

  const dbToken = result.rows[0].token;

  console.log('DB Token:', dbToken, typeof dbToken);
  console.log('Input Token:', token, typeof token);

  // Convert both to strings for comparison
  if (String(dbToken) === String(token)) {
    console.log('Token is valid for email:', email);
    return true;
  } else {
    console.log('Token is invalid or expired for email:', email);
    return false;
  }
};

export const markEmailAsVerified = async (email, hashedPassword) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // First get the user_id
    const userResult = await client.query(
      'SELECT user_id FROM "user" WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Update parent table with password and verified status
    await client.query(
      'UPDATE parent SET verified = true, password = $1 WHERE user_id = $2',
      [hashedPassword, userId]
    );
    
    await client.query('COMMIT');
    console.log(`Email ${email} marked as verified`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// User CRUD Functions
export const checkEmailExists = async (email) => {
  const result = await pool.query(
    `SELECT u.*, p.password, p.verified, p.token 
     FROM "user" u 
     LEFT JOIN parent p ON u.user_id = p.user_id 
     WHERE u.email = $1`,
    [email]
  );
  console.log('Checking email:', email, 'Result:', result.rows);
  return result.rows[0];
};

export const createUserService = async (userData) => {
  const { nic, name, address, email, phone, image, role = 'parent' } = userData;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert into user table
    const userResult = await client.query(
      `INSERT INTO "user" (nic, name, address, email, phone, image, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') RETURNING *`,
      [nic, name, address, email, phone, image, role]
    );
    
    const newUser = userResult.rows[0];
    
    // If role is parent, create parent record
    if (role === 'parent') {
      const token = generateVerificationToken();
      await client.query(
        'INSERT INTO parent (user_id, token, verified) VALUES ($1, $2, false)',
        [newUser.user_id, token]
      );
    }
    
    await client.query('COMMIT');
    return newUser;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getUserByIdService = async (id) => {
  const result = await pool.query(
    `SELECT u.*, p.verified, p.token 
     FROM "user" u 
     LEFT JOIN parent p ON u.user_id = p.user_id 
     WHERE u.user_id = $1`,
    [id]
  );
  return result.rows[0];
};

export const getAllUsersService = async () => {
  const result = await pool.query(
    `SELECT u.*, p.verified, p.token 
     FROM "user" u 
     LEFT JOIN parent p ON u.user_id = p.user_id 
     ORDER BY u.created_at DESC`
  );
  return result.rows;
};

// Fixed updateUserService to handle all fields dynamically
export const updateUserService = async (email, userData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get user_id first
    const userResult = await client.query(
      'SELECT user_id FROM "user" WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return null;
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Build dynamic SQL query for user table
    const userFields = [];
    const userValues = [];
    let paramIndex = 1;

    // Add user fields dynamically
    if (userData.nic !== undefined) {
      userFields.push(`nic = $${paramIndex}`);
      userValues.push(userData.nic);
      paramIndex++;
    }
    
    if (userData.name !== undefined) {
      userFields.push(`name = $${paramIndex}`);
      userValues.push(userData.name);
      paramIndex++;
    }
    
    if (userData.address !== undefined) {
      userFields.push(`address = $${paramIndex}`);
      userValues.push(userData.address);
      paramIndex++;
    }
    
    if (userData.email !== undefined) {
      userFields.push(`email = $${paramIndex}`);
      userValues.push(userData.email);
      paramIndex++;
    }
    
    if (userData.phone !== undefined) {
      userFields.push(`phone = $${paramIndex}`);
      userValues.push(userData.phone);
      paramIndex++;
    }
    
    if (userData.image !== undefined) {
      userFields.push(`image = $${paramIndex}`);
      userValues.push(userData.image);
      paramIndex++;
    }
    
    if (userData.role !== undefined) {
      userFields.push(`role = $${paramIndex}`);
      userValues.push(userData.role);
      paramIndex++;
    }
    
    if (userData.status !== undefined) {
      userFields.push(`status = $${paramIndex}`);
      userValues.push(userData.status);
      paramIndex++;
    }

    // Update user table if there are fields to update
    if (userFields.length > 0) {
      userValues.push(userId);
      const userWhereParam = `$${paramIndex}`;
      const userQuery = `UPDATE "user" SET ${userFields.join(', ')} WHERE user_id = ${userWhereParam} RETURNING *`;
      
      console.log('User update query:', userQuery);
      console.log('User update values:', userValues);
      
      await client.query(userQuery, userValues);
    }

    // Update parent table if password or verified status is provided
    if (userData.password !== undefined || userData.verified !== undefined) {
      const parentFields = [];
      const parentValues = [];
      let parentParamIndex = 1;

      if (userData.password !== undefined) {
        parentFields.push(`password = $${parentParamIndex}`);
        parentValues.push(userData.password);
        parentParamIndex++;
      }
      
      if (userData.verified !== undefined) {
        parentFields.push(`verified = $${parentParamIndex}`);
        parentValues.push(userData.verified);
        parentParamIndex++;
      }

      if (parentFields.length > 0) {
        parentValues.push(userId);
        const parentWhereParam = `$${parentParamIndex}`;
        const parentQuery = `UPDATE parent SET ${parentFields.join(', ')} WHERE user_id = ${parentWhereParam}`;
        
        console.log('Parent update query:', parentQuery);
        console.log('Parent update values:', parentValues);
        
        await client.query(parentQuery, parentValues);
      }
    }

    // Get updated user data
    const updatedResult = await client.query(
      `SELECT u.*, p.verified, p.token 
       FROM "user" u 
       LEFT JOIN parent p ON u.user_id = p.user_id 
       WHERE u.user_id = $1`,
      [userId]
    );
    
    await client.query('COMMIT');
    return updatedResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteUserService = async (id) => {
  const result = await pool.query(
    'DELETE FROM "user" WHERE user_id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

// Additional helper functions for parent registration

export const saveVerificationToken = async (email, token) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get user_id
    const userResult = await client.query(
      'SELECT user_id FROM "user" WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Update or insert token in parent table
    await client.query(
      'UPDATE parent SET token = $1 WHERE user_id = $2',
      [token, userId]
    );
    
    await client.query('COMMIT');
    console.log(`Verification token saved for email: ${email}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getParentByEmail = async (email) => {
  const result = await pool.query(
    `SELECT u.*, p.parent_id, p.password, p.verified, p.token
     FROM "user" u 
     JOIN parent p ON u.user_id = p.user_id 
     WHERE u.email = $1 AND u.role = 'parent'`,
    [email]
  );
  return result.rows[0];
};

export const updateParentPassword = async (email, hashedPassword) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get user_id
    const userResult = await client.query(
      'SELECT user_id FROM "user" WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Update parent password
    await client.query(
      'UPDATE parent SET password = $1 WHERE user_id = $2',
      [hashedPassword, userId]
    );
    
    await client.query('COMMIT');
    console.log(`Password updated for email: ${email}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Check if parent exists by email (for login purposes)
export const checkParentExists = async (email) => {
  const result = await pool.query(
    `SELECT u.*, p.parent_id, p.password, p.verified, p.token
     FROM "user" u 
     JOIN parent p ON u.user_id = p.user_id 
     WHERE u.email = $1 AND u.role = 'parent' AND u.status = 'active'`,
    [email]
  );
  console.log('Checking parent email:', email, 'Result:', result.rows.length > 0);
  return result.rows[0];
};