import pool from '../config/db.js';

class MeetingModel {
  // Get all meetings with child and parent information
  async findAll() {
    const query = `
      SELECT 
        m.*,
        c.name as child_name,
        c.age as child_age,
        c.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM meeting m
      JOIN child c ON m.child_id = c.child_id
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      ORDER BY m.meeting_date DESC, m.meeting_time DESC
    `;
    
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      throw error;
    }
  }

  // Get meeting by ID with full details
  async findById(meeting_id) {
    const query = `
      SELECT 
        m.*,
        c.name as child_name,
        c.age as child_age,
        c.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM meeting m
      JOIN child c ON m.child_id = c.child_id
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE m.meeting_id = $1
    `;
    
    try {
      const { rows } = await pool.query(query, [meeting_id]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching meeting by ID:', error);
      throw error;
    }
  }

  // Get meetings by child ID
  async findByChildId(child_id) {
    const query = `
      SELECT 
        m.*,
        c.name as child_name,
        c.age as child_age,
        c.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM meeting m
      JOIN child c ON m.child_id = c.child_id
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE m.child_id = $1
      ORDER BY m.meeting_date DESC, m.meeting_time DESC
    `;
    
    try {
      const { rows } = await pool.query(query, [child_id]);
      return rows;
    } catch (error) {
      console.error('Error fetching meetings by child ID:', error);
      throw error;
    }
  }

  // Get meetings by recipient (teacher or supervisor)
  async findByRecipient(recipient) {
    const query = `
      SELECT 
        m.*,
        c.name as child_name,
        c.age as child_age,
        c.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM meeting m
      JOIN child c ON m.child_id = c.child_id
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE m.recipient = $1
      ORDER BY m.meeting_date DESC, m.meeting_time DESC
    `;
    
    try {
      const { rows } = await pool.query(query, [recipient]);
      return rows;
    } catch (error) {
      console.error('Error fetching meetings by recipient:', error);
      throw error;
    }
  }

  // Create new meeting
  async create(meetingData) {
    const { child_id, recipient, meeting_date, meeting_time, reason, response = null } = meetingData;
    
    const query = `
      INSERT INTO meeting (child_id, recipient, meeting_date, meeting_time, reason, response)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    try {
      const { rows } = await pool.query(query, [
        child_id, recipient, meeting_date, meeting_time, reason, response
      ]);
      return rows[0];
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  // Update meeting
  async update(meeting_id, meetingData) {
    const { meeting_date, meeting_time, reason, response } = meetingData;
    
    const query = `
      UPDATE meeting 
      SET meeting_date = $1, meeting_time = $2, reason = $3, response = $4
      WHERE meeting_id = $5
      RETURNING *
    `;
    
    try {
      const { rows } = await pool.query(query, [
        meeting_date, meeting_time, reason, response, meeting_id
      ]);
      return rows[0];
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  }

  // Update meeting response only
  async updateResponse(meeting_id, response) {
    const query = `
      UPDATE meeting 
      SET response = $1
      WHERE meeting_id = $2
      RETURNING *
    `;
    
    try {
      const { rows } = await pool.query(query, [response, meeting_id]);
      return rows[0];
    } catch (error) {
      console.error('Error updating meeting response:', error);
      throw error;
    }
  }

  // Delete meeting
  async remove(meeting_id) {
    const query = 'DELETE FROM meeting WHERE meeting_id = $1 RETURNING *';
    
    try {
      const { rows } = await pool.query(query, [meeting_id]);
      return rows[0];
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }

  // Search meetings with filters
  async search(searchTerm, recipient = null, response = null, dateFrom = null, dateTo = null) {
    let query = `
      SELECT 
        m.*,
        c.name as child_name,
        c.age as child_age,
        c.gender as child_gender,
        p.parent_id,
        u.name as parent_name,
        u.email as parent_email,
        u.phone as parent_phone,
        u.address as parent_address
      FROM meeting m
      JOIN child c ON m.child_id = c.child_id
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (recipient && recipient !== 'All') {
      query += ` AND m.recipient = $${paramIndex}`;
      params.push(recipient);
      paramIndex++;
    }

    if (response && response !== 'All Status') {
      query += ` AND (
        CASE 
          WHEN $${paramIndex} = 'Pending' THEN (m.response IS NULL OR m.response = '' OR m.response ILIKE '%pending%')
          WHEN $${paramIndex} = 'Confirmed' THEN m.response ILIKE '%confirmed%'
          WHEN $${paramIndex} = 'Cancelled' THEN m.response ILIKE '%cancelled%'
          ELSE true
        END
      )`;
      params.push(response);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND m.meeting_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND m.meeting_date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    if (searchTerm) {
      query += ` AND (
        c.name ILIKE $${paramIndex} OR 
        u.name ILIKE $${paramIndex} OR 
        m.reason ILIKE $${paramIndex} OR
        m.response ILIKE $${paramIndex}
      )`;
      params.push(`%${searchTerm}%`);
    }

    query += ` ORDER BY m.meeting_date DESC, m.meeting_time DESC`;

    try {
      const { rows } = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error searching meetings:', error);
      throw error;
    }
  }
}

export default new MeetingModel();
