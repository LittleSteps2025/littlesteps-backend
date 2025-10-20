import pool from "../../config/db.js";

const AppointmentModel = {
  // Fetch appointments for a teacher
  getAppointmentsByUserId: async (userId) => {
    const query = `
      SELECT 
        m.meeting_id AS id,
        m.meeting_date AS meetingDate,
        m.meeting_time AS meetingTime,
        m.reason,
        m.response,
        m.status,
        c.child_id,
        c.name AS childName,
        g.name,
        u.name AS teacherName
      FROM meeting m
      JOIN child c 
        ON m.child_id = c.child_id
      JOIN "group" g 
        ON g.group_id = c.group_id
      JOIN teacher t 
        ON (g.main_teacher_id = t.teacher_id OR g.co_teacher_id = t.teacher_id)
      JOIN "user" u 
        ON u.user_id = t.user_id
      WHERE u.user_id = $1
        AND m.recipient = 'teacher'
      ORDER BY m.meeting_date DESC, m.meeting_time DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  // Update response by appointment ID and teacher (user)
  updateResponse: async (appointmentId, userId, response) => {
    const query = `
      UPDATE meeting m
      SET response = $1,
          status = '1'
      FROM child c
      JOIN "group" g ON g.group_id = c.group_id
      JOIN teacher t ON (g.main_teacher_id = t.teacher_id OR g.co_teacher_id = t.teacher_id)
      JOIN "user" u ON u.user_id = t.user_id
      WHERE m.meeting_id = $2
        AND m.child_id = c.child_id
        AND u.user_id = $3
        AND m.recipient = 'teacher'
      RETURNING m.meeting_id
    `;
    const result = await pool.query(query, [response, appointmentId, userId]);
    return result.rowCount > 0;
  },

  // Update status by appointment ID
  updateStatus: async (appointmentId, status) => {
    const query = `
      UPDATE meeting
      SET status = $1
      WHERE meeting_id = $2
      RETURNING meeting_id
    `;
    const result = await pool.query(query, [status, appointmentId]);
    return result.rowCount > 0;
  },
};

export default AppointmentModel;
