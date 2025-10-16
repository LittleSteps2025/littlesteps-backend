import pool from '../config/db.js';

class SubscriptionModel {
  static async create(data) {
    const { 
      name, 
      type, 
      duration, 
      days, 
      price, 
      services, 
      status = 'active' 
    } = data;
    
    const query = `
      INSERT INTO subscriptions (
        name, 
        type, 
        duration, 
        days, 
        price, 
        services, 
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING plan_id, name, type, duration, days, price, services, status, created_at, updated_at`;
    
    const result = await pool.query(query, [
      name, 
      type, 
      duration, 
      days, 
      price, 
      services, 
      status
    ]);
    return result.rows[0];
  }

  static async findAll(filter = {}) {
    try {
      console.log('Starting findAll with filter:', filter);
      
      let query = `
        SELECT 
          plan_id, 
          name, 
          type, 
          duration, 
          days, 
          price, 
          services, 
          status, 
          created_at, 
          updated_at
        FROM subscriptions`;
      const params = [];
      
      if (filter.status && filter.status !== 'all') {
        query += ' WHERE status = $1';
        params.push(filter.status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      console.log('Executing query:', query);
      console.log('With params:', params);
      
      const result = await pool.query(query, params);
      console.log('Query result:', result.rows);
      
      return result.rows;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error; // Re-throw to be handled by the controller
    }
  }

  static async findById(planId) {
    const query = `
      SELECT 
        plan_id, 
        name, 
        type, 
        duration, 
        days, 
        price, 
        services, 
        status, 
        created_at, 
        updated_at
      FROM subscriptions 
      WHERE plan_id = $1`;
    const result = await pool.query(query, [planId]);
    return result.rows[0];
  }

  static async update(planId, data) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    values.push(planId);
    const query = `
      UPDATE subscriptions 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE plan_id = $${paramCount}
      RETURNING plan_id, name, type, duration, days, price, services, status, created_at, updated_at`;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(planId) {
    const query = `
      DELETE FROM subscriptions 
      WHERE plan_id = $1 
      RETURNING plan_id, name, type, duration, days, price, services, status, created_at, updated_at`;
    const result = await pool.query(query, [planId]);
    return result.rows[0];
  }
}

export default SubscriptionModel;