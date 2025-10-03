import pool from '../config/db.js';

class AppointmentModel {
  async findAllBySupervisor() {
    const query = `
      SELECT * FROM meeting
      WHERE recipient = 'supervisor'
      ORDER BY meeting_date DESC, meeting_time DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async create(appointment) {
    const { child_id, meeting_date, meeting_time, reason } = appointment;

    const query = `
      INSERT INTO meeting (child_id, recipient, meeting_date, meeting_time, reason, response)
      VALUES ($1, 'supervisor', $2, $3, $4, NULL)
      RETURNING *
    `;
    const values = [child_id, meeting_date, meeting_time, reason];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

export default new AppointmentModel();
