import pool from "../../config/db.js";

const AppointmentModel = {
  getAppointmentsByUserId: async (userId) => {
    const query = `
     SELECT 
        m.meeting_id AS id,
        m.meeting_date AS meetingDate,
        m.meeting_time AS meetingTime,
        m.reason,
        m.response,
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
    ORDER BY m.meeting_date DESC, m.meeting_time DESC`;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  },
};


export default AppointmentModel;
