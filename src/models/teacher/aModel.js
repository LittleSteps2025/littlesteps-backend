// models/teacher/announcementModel.js
import pool from "../../config/db.js";

const AnnouncementModel = {
  // 🌸 Get all announcements
  async getAllAnnouncements() {
    const query = `
      SELECT 
        title,
        details,
        date,
        time
      FROM announcement
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // 🌹 Get a specific announcement by ID
  async getAnnouncementById(id) {
    const query = `
      SELECT 
        announcement_id,
        title,
        message,
        created_at,
        created_by
      FROM announcement
      WHERE announcement_id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
};

export default AnnouncementModel;
