import pool from "../config/db.js";

const announcementModel = {
  // Get all announcements
  async getAll() {
    const query = "SELECT * FROM announcement ORDER BY created_at DESC";
    const { rows } = await pool.query(query);
    // Normalize date field to YYYY-MM-DD string to avoid timezone conversion issues
    const normalized = rows.map((r) => ({
      ...r,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
    }));
    return normalized;
  },

  // Get single announcement by ID
  async getById(id) {
    const query = "SELECT * FROM announcement WHERE ann_id = $1";
    const { rows } = await pool.query(query, [id]);
    const row = rows[0];
    if (!row) return row;
    return {
      ...row,
      date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
    };
  },

  // Create new announcement
  async create({
    title,
    date,
    time,
    details,
    attachment,
    audience,
    session_id,
    user_id,
  }) {
    const query = `
      INSERT INTO announcement 
        (title, date, time, details, attachment, audience, session_id, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      title,
      date,
      time,
      details,
      attachment,
      audience,
      session_id,
      user_id,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Update announcement
  async update(
    id,
    { title, date, time, details, attachment, audience, session_id }
  ) {
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
    const values = [
      title,
      date,
      time,
      details,
      attachment,
      audience,
      session_id,
      id,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Delete announcement
  async delete(id) {
    const query = "DELETE FROM announcement WHERE ann_id = $1 RETURNING *";
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },
};

// Get all announcements (with author info and published_by object)
export const getAllAnnouncements = async () => {
  const result = await pool.query(
    `SELECT 
       a.ann_id,
       a.title,
       a.details,
       TO_CHAR(a.date, 'YYYY-MM-DD') as date,
       TO_CHAR(a.time, 'HH24:MI') as time,
       a.attachment,
       a.audience,
       a.session_id,
       a.user_id,
       a.created_at,
       a.status,
       u.name AS author_name, 
       u.email AS author_email,
       u.role AS author_role,
       jsonb_build_object(
         'id', u.user_id,
         'name', u.name,
         'role', u.role
       ) as published_by
     FROM announcement a
     LEFT JOIN "user" u ON a.user_id = u.user_id
     ORDER BY a.created_at DESC`
  );
  return result.rows;
};

// Get a single announcement by ID
export const getAnnouncementById = async (ann_id) => {
  const result = await pool.query(
    `SELECT 
       a.ann_id,
       a.title,
       a.details,
       TO_CHAR(a.date, 'YYYY-MM-DD') as date,
       TO_CHAR(a.time, 'HH24:MI') as time,
       a.attachment,
       a.audience,
       a.session_id,
       a.user_id,
       a.created_at,
       a.status,
       u.name AS author_name, 
       u.email AS author_email,
       u.role AS author_role,
       jsonb_build_object(
         'id', u.user_id,
         'name', u.name,
         'role', u.role
       ) as published_by
     FROM announcement a
     LEFT JOIN "user" u ON a.user_id = u.user_id
     WHERE a.ann_id = $1`,
    [ann_id]
  );
  return result.rows[0];
};

// Valid audience values based on frontend mapping:
// 1 = "All", 2 = "Teachers", 3 = "Parents"
const validAudiences = [1, 2, 3];

// Modified updateAnnouncement function to match database schema
export const updateAnnouncement = async (
  ann_id,
  { title, details, status, audience, time = null, attachment = null }
) => {
  if (!validAudiences.includes(audience)) {
    throw new Error(
      "Invalid audience value. Must be 1 (All), 2 (Teachers), or 3 (Parents)"
    );
  }

  const result = await pool.query(
    `UPDATE announcement SET
     title = $1, details = $2, status = $3, audience = $4, time = $5, attachment = $6
     WHERE ann_id = $7 
     RETURNING 
       ann_id,
       title,
       details,
       TO_CHAR(date, 'YYYY-MM-DD') as date,
       TO_CHAR(time, 'HH24:MI') as time,
       attachment,
       audience,
       session_id,
       user_id,
       created_at,
       status`,
    [title, details, status, audience, time, attachment, ann_id]
  );
  return result.rows[0];
};

// Create a new announcement
export const createAnnouncement = async (announcementData) => {
  const { audience } = announcementData;

  if (!validAudiences.includes(audience)) {
    throw new Error(
      "Invalid audience value. Must be 1 (All), 2 (Teachers), or 3 (Parents)"
    );
  }

  const result = await announcementModel.create(announcementData);
  
  // Format date and time in response
  return {
    ...result,
    date: result.date instanceof Date 
      ? result.date.toISOString().split('T')[0] 
      : result.date,
    time: typeof result.time === 'string' 
      ? result.time.slice(0, 5) 
      : result.time
  };
};

// Delete announcement
export const deleteAnnouncement = async (ann_id) => {
  return await announcementModel.delete(ann_id);
};

export default announcementModel;