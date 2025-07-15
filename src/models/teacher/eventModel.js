import pool from '../../config/db.js'; // adjust path if needed

const EventModel = {
  getAllEvents: async () => {
    const result = await pool.query('SELECT topic, description, date, time, venue FROM event ORDER BY date DESC');
    return result.rows;
  }
,


  getEventById: async (eventId) => {
    const [rows] = await pool.query(
      'SELECT topic, description, date, time, venue FROM event WHERE id = ?',
      [eventId]
    );
    return rows[0];
  },
};

export default EventModel;
