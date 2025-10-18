import pool from '../config/db.js';

const announcementModel = {
  // Get all announcements
  async getAll() {
    const query = 'SELECT * FROM announcement ORDER BY created_at DESC';
    const { rows } = await pool.query(query);
    return rows;
  },

  // Get single announcement by ID
  async getById(id) {
    const query = 'SELECT * FROM announcement WHERE ann_id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  // Create new announcement
  async create({ title, date, time, details, attachment, audience, session_id, user_id }) {
    const query = `
      INSERT INTO announcement 
        (title, date, time, details, attachment, audience, session_id, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [title, date, time, details, attachment, audience, session_id, user_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Update announcement
  async update(id, { title, date, time, details, attachment, audience, session_id }) {
    const query = `
      UPDATE announcement
      SET 
        title = $1,
        date = $2,
        time = $3,
        details = $4,
        attachment = $5,
        audience = $6,
        session_id = $7
      WHERE ann_id = $8
      RETURNING *
    `;
    const values = [title, date, time, details, attachment, audience, session_id, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Delete announcement
  async delete(id) {
    const query = 'DELETE FROM announcement WHERE ann_id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
};

export default announcementModel;