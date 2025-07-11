import pool from '../../config/db.js';
import bcrypt from 'bcrypt';


  // Create a new parent
  export const createParent = async (parentData) => {
    const { email, password, name } = parentData;
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO parent (email, password, name, verified)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, verified, created_at, updated_at;
    `;
    
    try {
      const result = await pool.query(query, [email, hashedPassword, name, false]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating parent:', error);
      throw error;
    }
  }

  // Find parent by email
  export const findByEmail = async (email) => {
    const query = 'SELECT * FROM parent WHERE email = $1';
    
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding parent by email:', error);
      throw error;
    }
  }

  // Find parent by ID
  export const findById = async (id) => {
    const query = 'SELECT id, email, name, verified, created_at, updated_at FROM parent WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding parent by ID:', error);
      throw error;
    }
  }

  // Update parent verification status
  export const updateVerificationStatus = async (id, verified = true) => {
    const query = `
      UPDATE parent 
      SET verified = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, email, name, verified, updated_at;
    `;
    
    try {
      const result = await pool.query(query, [verified, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw error;
    }
  }

  // Update parent password
  export const updatePassword = async (id, newPassword) => {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE parent 
      SET password = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, email, name, updated_at;
    `;
    
    try {
      const result = await pool.query(query, [hashedPassword, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // Delete parent
  export const deleteParent = async (id) => {
    const query = 'DELETE FROM parent WHERE id = $1 RETURNING id, email, name;';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting parent:', error);
      throw error;
    }
  }

  // Get all parents (admin function)
  export const getAllParents = async () => {
    const query = 'SELECT id, email, name, verified, created_at, updated_at FROM parent ORDER BY created_at DESC';
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all parents:', error);
      throw error;
    }
  }

  export const getVerifiedParentByEmail = async (email) => {
    try {
      // First, get the user_id from the user table
      const userQuery = 'SELECT user_id FROM "user" WHERE email = $1 AND role = $2';
      const userResult = await pool.query(userQuery, [email, 'parent']);
      
      if (userResult.rows.length === 0) {
        return false; // User not found or not a parent
      }
      
      const userId = userResult.rows[0].user_id;
      
      // Then, check if the parent is verified
      const verificationQuery = 'SELECT verified FROM parent WHERE user_id = $1';
      const verificationResult = await pool.query(verificationQuery, [userId]);

      if (verificationResult.rows.length === 0 || verificationResult.rows[0].verified === false) {
        return false; // Parent record not found or not verified
      }
      
      return verificationResult.rows[0].verified === true;
    } catch (error) {
      console.error('Error getting verified parent by email:', error);
      throw error;
    }
  }

