import pool from '../config/db.js';
import crypto from 'crypto';

// Verification Token Functions
export const generateVerificationToken = () => {
  // Generate a 4-digit token for easier user input
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const saveVerificationToken = async (email, token) => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiration
  await pool.query(
    'INSERT INTO verification_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
    [email, token, expiresAt]
  );
};

export const getVerificationToken = async (email, token) => {
  const result = await pool.query(
    'SELECT token FROM users WHERE email = $1',
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

export const markEmailAsVerified = async (email) => {
  await pool.query(
    'UPDATE users SET verified = true WHERE email = $1',
    [email]
  );
  console.log(`Email ${email} marked as verified`);
};

// User CRUD Functions
export const checkEmailExists = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  console.log('Checking email:', email, 'Result:', result.rows);
  return result.rows[0];
};

export const createUserService = async (userData) => {
  const { name, email, password, role = 'parent', token } = userData;
  const result = await pool.query(
    'INSERT INTO users (name, email, password, verified, role, token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, email, password, false, role, token]
  );
  return result.rows[0];
};

export const getUserByIdService = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const getAllUsersService = async () => {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
};

// Fixed updateUserService to handle all fields dynamically
export const updateUserService = async (email, userData) => {
  // Build dynamic SQL query based on provided fields
  const fields = [];
  const values = [];
  let paramIndex = 1;

  // Add fields dynamically
  if (userData.name !== undefined) {
    fields.push(`name = $${paramIndex}`);
    values.push(userData.name);
    paramIndex++;
  }
  
  if (userData.email !== undefined) {
    fields.push(`email = $${paramIndex}`);
    values.push(userData.email);
    paramIndex++;
  }
  
  if (userData.password !== undefined) {
    fields.push(`password = $${paramIndex}`);
    values.push(userData.password);
    paramIndex++;
  }
  
  if (userData.verified !== undefined) {
    fields.push(`verified = $${paramIndex}`);
    values.push(userData.verified);
    paramIndex++;
  }

  // If no fields to update, return null
  if (fields.length === 0) {
    return null;
  }

  // Add email to WHERE clause
  values.push(email);
  const whereParam = `$${paramIndex}`;

  const query = `UPDATE users SET ${fields.join(', ')} WHERE email = ${whereParam} RETURNING *`;
  
  console.log('Update query:', query);
  console.log('Update values:', values);

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteUserService = async (id) => {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};