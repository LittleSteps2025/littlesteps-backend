import pool from '../config/db.js';

class MeetingModel {
  // Get all meetings with child and parent information (only supervisor meetings)
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
      WHERE m.recipient = 'supervisor'
      ORDER BY m.meeting_date DESC, m.meeting_time DESC
    `;
    
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error fetching supervisor meetings:', error);
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

  // Get meetings by child ID and recipient
  async findByChildIdAndRecipient(child_id, recipient) {
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
      WHERE m.child_id = $1 AND m.recipient = $2
      ORDER BY m.meeting_date DESC, m.meeting_time DESC
    `;
    
    try {
      const { rows } = await pool.query(query, [child_id, recipient]);
      return rows;
    } catch (error) {
      console.error('Error fetching meetings by child ID and recipient:', error);
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
    const { child_id, recipient, meeting_date, meeting_time, reason, response = null, status = 'pending' } = meetingData;
    
    const query = `
      INSERT INTO meeting (child_id, recipient, meeting_date, meeting_time, reason, response, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    try {
      const { rows } = await pool.query(query, [
        child_id, recipient, meeting_date, meeting_time, reason, response, status
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
    
    const updateQuery = `
      UPDATE meeting 
      SET meeting_date = $1, meeting_time = $2, reason = $3, response = $4
      WHERE meeting_id = $5
      RETURNING meeting_id
    `;
    
    try {
      const { rows } = await pool.query(updateQuery, [
        meeting_date, meeting_time, reason, response, meeting_id
      ]);
      
      // Fetch the complete meeting data with joins
      return await this.findById(meeting_id);
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  }

  // Update meeting response only
  async updateResponse(meeting_id, response) {
    const updateQuery = `
      UPDATE meeting 
      SET response = $1, updated_at = CURRENT_TIMESTAMP
      WHERE meeting_id = $2
      RETURNING meeting_id
    `;
    
    try {
      const { rows } = await pool.query(updateQuery, [response || null, meeting_id]);
      if (rows.length === 0) {
        throw new Error('No meeting found with the provided ID');
      }
      
      // Fetch the complete meeting data with joins
      return await this.findById(meeting_id);
    } catch (error) {
      console.error('Error updating meeting response:', error);
      throw error;
    }
  }

  // Update meeting status only
  async updateStatus(meeting_id, status) {
    const updateQuery = `
      UPDATE meeting 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE meeting_id = $2
      RETURNING meeting_id
    `;
    
    try {
      console.log('=== MODEL: updateStatus ===');
      console.log('Meeting ID:', meeting_id);
      console.log('Status:', status);
      console.log('Query:', updateQuery);
      
      const { rows } = await pool.query(updateQuery, [status, meeting_id]);
      console.log('Update query result rows:', rows);
      
      if (rows.length === 0) {
        console.log('No meeting found with ID:', meeting_id);
        throw new Error('No meeting found with the provided ID');
      }
      
      // Fetch the complete meeting data with joins
      console.log('Fetching updated meeting data...');
      const updatedMeeting = await this.findById(meeting_id);
      console.log('Updated meeting data:', updatedMeeting);
      return updatedMeeting;
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw error;
    }
  }

  // Reschedule meeting (only date and time)
  async reschedule(meeting_id, meeting_date, meeting_time, response = null) {
    const updateQuery = `
      UPDATE meeting 
      SET meeting_date = $1, meeting_time = $2, response = COALESCE($3, response), updated_at = CURRENT_TIMESTAMP
      WHERE meeting_id = $4
      RETURNING meeting_id
    `;
    
    try {
      const { rows } = await pool.query(updateQuery, [meeting_date, meeting_time, response, meeting_id]);
      if (rows.length === 0) {
        throw new Error('No meeting found with the provided ID');
      }
      
      // Fetch the complete meeting data with joins
      return await this.findById(meeting_id);
    } catch (error) {
      console.error('Error rescheduling meeting:', error);
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

  // Search supervisor meetings with filters
  async searchSupervisorMeetings(searchTerm, response = null, dateFrom = null, dateTo = null) {
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
      WHERE m.recipient = 'supervisor'
    `;
    
    const params = [];
    let paramIndex = 1;

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
      console.error('Error searching supervisor meetings:', error);
      throw error;
    }
  }
}

export default new MeetingModel();