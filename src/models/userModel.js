import pool from '../config/db.js';
import crypto from 'crypto';

// Generate a random verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

// Check if the token matches the one stored for the parent's email
export const getVerificationToken = async (email, token) => {
  const result = await pool.query(
    `SELECT p.token 
     FROM parent p 
     JOIN "user" u ON p.user_id = u.user_id 
     WHERE u.email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    console.log('No user found with email:', email);
    return false;
  }

  const dbToken = result.rows[0].token;

  if (String(dbToken) === String(token)) {
    console.log('Token is valid for email:', email);
    return true;
  } else {
    console.log('Token is invalid or expired for email:', email);
    return false;
  }
};

// Mark parent's email as verified and update password
export const markEmailAsVerified = async (email, hashedPassword) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get user_id for email
    const userResult = await client.query(
      `SELECT user_id FROM "user" WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userId = userResult.rows[0].user_id;

    // Update parent table with verified status and hashed password
    await client.query(
      `UPDATE parent SET verified = true, password = $1 WHERE user_id = $2`,
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

// Check if email exists in the user table, joining parent data if applicable
export const checkEmailExists = async (email) => {
  const result = await pool.query(
    `SELECT u.*, p.password, p.verified, p.token 
     FROM "user" u 
     LEFT JOIN parent p ON u.user_id = p.user_id 
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0]; // returns undefined if not found
};

// Create a new user, and if role is parent, create a parent record with token
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

    // If user is a parent, create parent record with verification token
    if (role === 'parent') {
      const token = generateVerificationToken();
      await client.query(
        `INSERT INTO parent (user_id, token, verified) VALUES ($1, $2, false)`,
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

// Get user by ID with parent verification info if applicable
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

// Get all users including role-specific info
// export const getAllUsersService = async () => {
//   const result = await pool.query(`
//     SELECT 
//       u.user_id AS id,
//       u.nic,
//       u.name,
//       u.address,
//       u.email,
//       u.phone,
//       u.image,
//       u.role,
//       u.status,
//       u.created_at,
//       COALESCE(p.verified, false) AS parent_verified,
//       COALESCE(t.subjects, '') AS teacher_subjects,
//       COALESCE(s.department, '') AS supervisor_department
//     FROM "user" u
//     LEFT JOIN parent p ON u.user_id = p.user_id
//     LEFT JOIN teacher t ON u.user_id = t.user_id
//     LEFT JOIN supervisor s ON u.user_id = s.user_id
//     ORDER BY u.created_at DESC
//   `);
//   return result.rows;
// };
export const getAllUsersService = async () => {
  const result = await pool.query(
    `SELECT u.*, p.verified, p.token 
     FROM "user" u 
     LEFT JOIN parent p ON u.user_id = p.user_id 
     ORDER BY u.created_at DESC`
  );
  return result.rows;
};

// Optionally, if you have a database view
export const getAllUsersView = async () => {
  const result = await pool.query('SELECT * FROM user_parent_view ORDER BY created_at DESC');
  return result.rows;
};

// A simpler list for basic views
export const getAllUsersSimple = async () => {
  const result = await pool.query(
    `SELECT user_id AS id, name, email, role, status, created_at FROM "user" ORDER BY created_at DESC`
  );
  return result.rows;
};

// Update user dynamically by email (handles user and parent tables)
export const updateUserService = async (email, userData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get user_id first
    const userResult = await client.query(
      `SELECT user_id FROM "user" WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const userId = userResult.rows[0].user_id;

    // Build dynamic update for user table
    const userFields = [];
    const userValues = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(userData)) {
      if (['password', 'verified'].includes(key)) continue; // handled separately

      userFields.push(`${key} = $${paramIndex}`);
      userValues.push(value);
      paramIndex++;
    }

    if (userFields.length > 0) {
      userValues.push(userId);
      const userQuery = `UPDATE "user" SET ${userFields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`;
      await client.query(userQuery, userValues);
    }

    // Update parent table if needed
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
        const parentQuery = `UPDATE parent SET ${parentFields.join(', ')} WHERE user_id = $${parentParamIndex}`;
        await client.query(parentQuery, parentValues);
      }
    }

    // Return updated user info
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

// Delete user by id
export const deleteUserService = async (id) => {
  const result = await pool.query(
    `DELETE FROM "user" WHERE user_id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

// Save or update verification token for a parent email
export const saveVerificationToken = async (email, token) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get user_id
    const userResult = await client.query(
      `SELECT user_id FROM "user" WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userId = userResult.rows[0].user_id;

    // Update token in parent table
    await client.query(
      `UPDATE parent SET token = $1 WHERE user_id = $2`,
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

// Get parent details by email (only if role = parent)
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

// Update parent's password securely
export const updateParentPassword = async (email, hashedPassword) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get user_id
    const userResult = await client.query(
      `SELECT user_id FROM "user" WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userId = userResult.rows[0].user_id;

    // Update password in parent table
    await client.query(
      `UPDATE parent SET password = $1 WHERE user_id = $2`,
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

// Check if a parent exists by email and status active (for login)
export const checkParentExists = async (email) => {
  const result = await pool.query(
    `SELECT u.*, p.parent_id, p.password, p.verified, p.token
     FROM "user" u 
     JOIN parent p ON u.user_id = p.user_id 
     WHERE u.email = $1 AND u.role = 'parent' AND u.status = 'active'`,
    [email]
  );
  return result.rows[0];
};
