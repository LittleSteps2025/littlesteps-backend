import pool from '../../config/db.js';
import bcrypt from 'bcrypt';

class ParentModel {

  // Create a new parent
  static async createParent(parentData) {
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
  static async findByEmail(email) {
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
  static async findById(id) {
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
  static async updateVerificationStatus(id, verified = true) {
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
  static async updatePassword(id, newPassword) {
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
  static async deleteParent(id) {
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
  static async getAllParents() {
    const query = 'SELECT id, email, name, verified, created_at, updated_at FROM parent ORDER BY created_at DESC';
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all parents:', error);
      throw error;
    }
  }
}

export default ParentModel;
