import pool from "../../config/db.js";

class ComplaintModel {
  static async create(data) {
    const {
      child_id,
      subject,
      recipient,
      description,
      date,
      status = "Pending",
      action,
    } = data;

    const query = `
      INSERT INTO complaints (
        child_id,
        subject,
        recipient,
        description,
        date,
        status,
        action
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        complaint_id,
        child_id,
        subject,
        recipient,
        description,
        date,
        status,
        action`;

    try {
      const result = await pool.query(query, [
        child_id,
        subject,
        recipient,
        description,
        date,
        status,
        action,
      ]);

      return result.rows[0];
    } catch (error) {
      console.error("Error creating complaint:", error);
      throw error;
    }
  }

  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          c.complaint_id,
          c.child_id,
          c.subject,
          c.recipient,
          c.description,
          c.date,
          c.status,
          c.action,
          c.created_at,
          c.updated_at,
          ch.first_name as child_first_name,
          ch.last_name as child_last_name,
          COALESCE(u.first_name, '') as recipient_first_name,
          COALESCE(u.last_name, '') as recipient_last_name
        FROM complaints c
        LEFT JOIN children ch ON c.child_id = ch.child_id
        LEFT JOIN users u ON c.recipient = u.user_id
        WHERE 1=1`;

      const values = [];
      let paramCount = 1;

      if (filters.status && filters.status !== "all") {
        query += ` AND c.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      if (filters.child_id) {
        query += ` AND c.child_id = $${paramCount}`;
        values.push(filters.child_id);
        paramCount++;
      }

      if (filters.date_from) {
        query += ` AND c.date >= $${paramCount}`;
        values.push(filters.date_from);
        paramCount++;
      }

      if (filters.date_to) {
        query += ` AND c.date <= $${paramCount}`;
        values.push(filters.date_to);
        paramCount++;
      }

      query += " ORDER BY c.date DESC";

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error finding complaints:", error);
      throw error;
    }
  }

  static async findById(complaintId) {
    try {
      const query = `
        SELECT 
          c.complaint_id,
          c.child_id,
          c.subject,
          c.recipient,
          c.description,
          c.date,
          c.status,
          c.action,
          c.created_at,
          c.updated_at,
          ch.first_name as child_first_name,
          ch.last_name as child_last_name,
          COALESCE(u.first_name, '') as recipient_first_name,
          COALESCE(u.last_name, '') as recipient_last_name
        FROM complaints c
        LEFT JOIN children ch ON c.child_id = ch.child_id
        LEFT JOIN users u ON c.recipient = u.user_id
        WHERE c.complaint_id = $1`;

      const result = await pool.query(query, [complaintId]);
      return result.rows[0];
    } catch (error) {
      console.error("Error finding complaint:", error);
      throw error;
    }
  }

  static async update(complaintId, data) {
    try {
      const allowedUpdates = [
        "subject",
        "recipient",
        "description",
        "status",
        "action",
      ];
      const updates = [];
      const values = [];
      let paramCount = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (allowedUpdates.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (updates.length === 0) return null;

      values.push(complaintId);
      const query = `
        UPDATE complaints 
        SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP 
        WHERE complaint_id = $${paramCount}
        RETURNING 
          complaint_id,
          child_id,
          subject,
          recipient,
          description,
          date,
          status,
          action,
          created_at,
          updated_at`;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating complaint:", error);
      throw error;
    }
  }

  static async delete(complaintId) {
    try {
      const query = `
        DELETE FROM complaints 
        WHERE complaint_id = $1 
        RETURNING *`;

      const result = await pool.query(query, [complaintId]);
      return result.rows[0];
    } catch (error) {
      console.error("Error deleting complaint:", error);
      throw error;
    }
  }

  static async getComplaintStats() {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count
        FROM complaints
        GROUP BY status`;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error getting complaint stats:", error);
      throw error;
    }
  }
}

export default ComplaintModel;
