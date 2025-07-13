import pool from '../../config/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Generate a random 4-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Generate a secure reset token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash verification code
export const hashCode = async (code) => {
  const saltRounds = 12;
  return await bcrypt.hash(code, saltRounds);
};

// Verify code against hash
export const verifyCode = async (code, hash) => {
  return await bcrypt.compare(code, hash);
};

// Store verification code in database
export const storeVerificationCode = async (email, code) => {
  const hashedCode = await hashCode(code);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
  
  const query = `
    INSERT INTO reset_codes (email, code_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, email, created_at, expires_at;
  `;
  
  try {
    const result = await pool.query(query, [email, hashedCode, expiresAt]);
    return result.rows[0];
  } catch (error) {
    console.error('Error storing verification code:', error);
    throw error;
  }
};

// Get valid verification code for email
export const getValidVerificationCode = async (email) => {
  const query = `
    SELECT id, email, code_hash, created_at, expires_at, attempts
    FROM reset_codes 
    WHERE email = $1 
      AND used = false 
      AND expires_at > CURRENT_TIMESTAMP
      AND attempts < 3
    ORDER BY created_at DESC 
    LIMIT 1;
  `;
  
  try {
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting verification code:', error);
    throw error;
  }
};

// Increment verification attempts
export const incrementVerificationAttempts = async (codeId) => {
  const query = `
    UPDATE reset_codes 
    SET attempts = attempts + 1 
    WHERE id = $1 
    RETURNING attempts;
  `;
  
  try {
    const result = await pool.query(query, [codeId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error incrementing verification attempts:', error);
    throw error;
  }
};

// Mark verification code as used
export const markCodeAsUsed = async (codeId) => {
  const query = `
    UPDATE reset_codes 
    SET used = true 
    WHERE id = $1 
    RETURNING id, email;
  `;
  
  try {
    const result = await pool.query(query, [codeId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error marking code as used:', error);
    throw error;
  }
};

// Store reset token
export const storeResetToken = async (email, token) => {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
  
  const query = `
    INSERT INTO reset_tokens (email, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, email, token, created_at, expires_at;
  `;
  
  try {
    const result = await pool.query(query, [email, token, expiresAt]);
    return result.rows[0];
  } catch (error) {
    console.error('Error storing reset token:', error);
    throw error;
  }
};

// Get valid reset token
export const getValidResetToken = async (email, token) => {
  const query = `
    SELECT id, email, token, created_at, expires_at
    FROM reset_tokens 
    WHERE email = $1 
      AND token = $2 
      AND used = false 
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC 
    LIMIT 1;
  `;
  
  try {
    const result = await pool.query(query, [email, token]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting reset token:', error);
    throw error;
  }
};

// Mark reset token as used
export const markTokenAsUsed = async (tokenId) => {
  const query = `
    UPDATE reset_tokens 
    SET used = true 
    WHERE id = $1 
    RETURNING id, email;
  `;
  
  try {
    const result = await pool.query(query, [tokenId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error marking token as used:', error);
    throw error;
  }
};

// Check if email exists and is a parent user
export const checkParentEmailExists = async (email) => {
  const query = `
    SELECT u.user_id, u.email, u.name, p.parent_id, p.verified 
    FROM "user" u 
    JOIN parent p ON u.user_id = p.user_id 
    WHERE u.email = $1 AND u.role = 'parent'
  `;
  
  try {
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error checking parent email existence:', error);
    throw error;
  }
};

// Update parent password only
export const updateParentPassword = async (email, newPassword) => {
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get parent info
    const parentResult = await client.query(`
      SELECT u.user_id, u.name, p.parent_id 
      FROM "user" u 
      JOIN parent p ON u.user_id = p.user_id 
      WHERE u.email = $1 AND u.role = 'parent'
    `, [email]);
    
    if (parentResult.rows.length === 0) {
      throw new Error('Parent user not found');
    }
    
    const { user_id, name, parent_id } = parentResult.rows[0];
    
    // Update parent password
    await client.query(
      'UPDATE parent SET password = $1 WHERE parent_id = $2',
      [hashedPassword, parent_id]
    );
    
    await client.query('COMMIT');
    return { user_id, parent_id, email, name };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating parent password:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Clean up expired codes and tokens
export const cleanupExpiredEntries = async () => {
  try {
    const codeQuery = 'DELETE FROM reset_codes WHERE expires_at < CURRENT_TIMESTAMP';
    const tokenQuery = 'DELETE FROM reset_tokens WHERE expires_at < CURRENT_TIMESTAMP';
    
    const [codeResult, tokenResult] = await Promise.all([
      pool.query(codeQuery),
      pool.query(tokenQuery)
    ]);
    
    return {
      deletedCodes: codeResult.rowCount,
      deletedTokens: tokenResult.rowCount
    };
  } catch (error) {
    console.error('Error cleaning up expired entries:', error);
    throw error;
  }
};

// Get rate limiting info for email
export const getRateLimitInfo = async (email) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const query = `
    SELECT COUNT(*) as attempt_count
    FROM reset_codes 
    WHERE email = $1 
      AND created_at > $2;
  `;
  
  try {
    const result = await pool.query(query, [email, oneHourAgo]);
    return parseInt(result.rows[0].attempt_count);
  } catch (error) {
    console.error('Error getting rate limit info:', error);
    throw error;
  }
};
