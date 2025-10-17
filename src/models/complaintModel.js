import pool from '../config/db.js';

class ComplaintModel {
  // Get all complaints with child and parent information
  async findAll() {
    const query = `
      SELECT 
        c.*,
        ch.name as child_name,
        ch.age as child_age,
        ch.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM complaints c
      JOIN child ch ON c.child_id = ch.child_id
      JOIN parent p ON ch.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      ORDER BY c.date DESC
    `;
    
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }
  }

  // Get complaint by ID with full details
  async findById(complaint_id) {
    const query = `
      SELECT 
        c.*,
        ch.name as child_name,
        ch.age as child_age,
        ch.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM complaints c
      JOIN child ch ON c.child_id = ch.child_id
      JOIN parent p ON ch.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE c.complaint_id = $1
    `;
    
    try {
      const { rows } = await pool.query(query, [complaint_id]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching complaint by ID:', error);
      throw error;
    }
  }

  // Get complaints by child ID
  async findByChildId(child_id) {
    const query = `
      SELECT 
        c.*,
        ch.name as child_name,
        ch.age as child_age,
        ch.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM complaints c
      JOIN child ch ON c.child_id = ch.child_id
      JOIN parent p ON ch.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE c.child_id = $1
      ORDER BY c.date DESC
    `;
    
    try {
      const { rows } = await pool.query(query, [child_id]);
      return rows;
    } catch (error) {
      console.error('Error fetching complaints by child ID:', error);
      throw error;
    }
  }

  // Get complaints by recipient (teacher or supervisor)
  async findByRecipient(recipient) {
    const query = `
      SELECT 
        c.*,
        ch.name as child_name,
        ch.age as child_age,
        ch.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM complaints c
      JOIN child ch ON c.child_id = ch.child_id
      JOIN parent p ON ch.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE c.recipient = $1
      ORDER BY c.date DESC
    `;
    
    try {
      console.log(`Fetching complaints for recipient: ${recipient}`);
      const { rows } = await pool.query(query, [recipient]);
      console.log(`Found ${rows.length} complaints for recipient: ${recipient}`);
      return rows;
    } catch (error) {
      console.error('Error fetching complaints by recipient:', error);
      throw error;
    }
  }

  // Create new complaint
  async create(complaintData) {
    const { date, subject, recipient, description, status, action, child_id } = complaintData;
    
    const query = `
      INSERT INTO complaints (date, subject, recipient, description, status, action, child_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    try {
      const { rows } = await pool.query(query, [
        date, subject, recipient, description, status, action, child_id
      ]);
      return rows[0];
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  }

  // Update complaint
  async update(complaint_id, complaintData) {
    const { date, subject, recipient, description, status, action } = complaintData;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Disable trigger for this transaction
      await client.query('ALTER TABLE complaints DISABLE TRIGGER update_complaints_updated_at;');
      
      const query = `
        UPDATE complaints 
        SET date = $1, subject = $2, recipient = $3, description = $4, status = $5, action = $6
        WHERE complaint_id = $7
        RETURNING *
      `;
      
      const { rows } = await client.query(query, [
        date, subject, recipient, description, status, action, complaint_id
      ]);
      
      // Re-enable trigger
      await client.query('ALTER TABLE complaints ENABLE TRIGGER update_complaints_updated_at;');
      
      await client.query('COMMIT');
      
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      // Make sure to re-enable trigger even if error occurs
      await client.query('ALTER TABLE complaints ENABLE TRIGGER update_complaints_updated_at;').catch(() => {});
      console.error('Error updating complaint:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update complaint status only
  async updateStatus(complaint_id, status) {
    const client = await pool.connect();
    
    try {
      console.log(`Updating complaint ${complaint_id} status to: ${status}`);
      
      await client.query('BEGIN');
      
      // Disable trigger for this transaction
      await client.query('ALTER TABLE complaints DISABLE TRIGGER update_complaints_updated_at;');
      
      const query = `
        UPDATE complaints 
        SET status = $1
        WHERE complaint_id = $2
        RETURNING *
      `;
      
      const { rows } = await client.query(query, [status, complaint_id]);
      
      // Re-enable trigger
      await client.query('ALTER TABLE complaints ENABLE TRIGGER update_complaints_updated_at;');
      
      await client.query('COMMIT');
      
      if (rows[0]) {
        console.log(`Status updated successfully for complaint ${complaint_id}`);
        // Return full complaint details with child and parent info
        const fullComplaint = await this.findById(complaint_id);
        console.log(`Retrieved full complaint details:`, fullComplaint);
        return fullComplaint;
      }
      
      console.log(`No complaint found with id ${complaint_id}`);
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      // Make sure to re-enable trigger even if error occurs
      await client.query('ALTER TABLE complaints ENABLE TRIGGER update_complaints_updated_at;').catch(() => {});
      console.error('Error updating complaint status:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update complaint action only
  async updateAction(complaint_id, action) {
    const client = await pool.connect();
    
    try {
      console.log(`Updating complaint ${complaint_id} action to:`, action);
      
      await client.query('BEGIN');
      
      // Disable trigger for this transaction
      await client.query('ALTER TABLE complaints DISABLE TRIGGER update_complaints_updated_at;');
      
      const query = `
        UPDATE complaints 
        SET action = $1
        WHERE complaint_id = $2
        RETURNING *
      `;
      
      const { rows } = await client.query(query, [action, complaint_id]);
      
      // Re-enable trigger
      await client.query('ALTER TABLE complaints ENABLE TRIGGER update_complaints_updated_at;');
      
      await client.query('COMMIT');
      
      if (rows[0]) {
        console.log(`Action updated successfully for complaint ${complaint_id}`);
        // Return full complaint details with child and parent info
        const fullComplaint = await this.findById(complaint_id);
        console.log(`Retrieved full complaint details:`, fullComplaint);
        return fullComplaint;
      }
      
      console.log(`No complaint found with id ${complaint_id}`);
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      // Make sure to re-enable trigger even if error occurs
      await client.query('ALTER TABLE complaints ENABLE TRIGGER update_complaints_updated_at;').catch(() => {});
      console.error('Error updating complaint action:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete complaint
  async remove(complaint_id) {
    const query = 'DELETE FROM complaints WHERE complaint_id = $1 RETURNING *';
    
    try {
      const { rows } = await pool.query(query, [complaint_id]);
      return rows[0];
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  }

  // Search complaints with filters
  async search(searchTerm, recipient = null, status = null, dateFrom = null, dateTo = null) {
    let query = `
      SELECT 
        c.*,
        ch.name as child_name,
        ch.age as child_age,
        ch.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM complaints c
      JOIN child ch ON c.child_id = ch.child_id
      JOIN parent p ON ch.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (recipient && recipient !== 'All' && recipient !== 'All Recipients') {
      query += ` AND c.recipient = $${paramIndex}`;
      params.push(recipient);
      paramIndex++;
    }

    if (status && status !== 'All Status') {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND c.date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND c.date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (searchTerm) {
      query += ` AND (
        ch.name ILIKE $${paramIndex} OR 
        u.name ILIKE $${paramIndex} OR 
        c.subject ILIKE $${paramIndex} OR
        c.description ILIKE $${paramIndex} OR
        c.status ILIKE $${paramIndex}
      )`;
      params.push(`%${searchTerm}%`);
    }

    query += ` ORDER BY c.date DESC`;

    try {
      const { rows } = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error searching complaints:', error);
      throw error;
    }
  }
}

export default new ComplaintModel();
