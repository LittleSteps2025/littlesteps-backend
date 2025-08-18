import pool from '../config/db.js';

const eventModel = {
  async getAll() {
    const query = 'SELECT * FROM event ORDER BY date, time';
    const { rows } = await pool.query(query);
    return rows;
  },

  async getById(eventId) {
    const query = 'SELECT * FROM event WHERE event_id = $1';
    const { rows } = await pool.query(query, [eventId]);
    return rows[0];
  },

  async create({ user_id, image, date, time, description, topic, venue }) {
    const query = `
      INSERT INTO event 
        (user_id, image, date, time, description, topic, venue)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [user_id, image, date, time, description, topic, venue];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async update(eventId, { image, date, time, description, topic, venue }) {
    const query = `
      UPDATE event
      SET 
        image = COALESCE($1, image),
        date = COALESCE($2, date),
        time = COALESCE($3, time),
        description = COALESCE($4, description),
        topic = COALESCE($5, topic),
        venue = COALESCE($6, venue)
      WHERE event_id = $7
      RETURNING *
    `;
    const values = [image, date, time, description, topic, venue, eventId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async delete(eventId) {
    const query = 'DELETE FROM event WHERE event_id = $1 RETURNING *';
    const { rows } = await pool.query(query, [eventId]);
    return rows[0];
  }
};

export default eventModel;