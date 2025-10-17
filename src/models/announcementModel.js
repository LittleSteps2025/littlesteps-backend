import pool from '../config/db.js';

// audience: 1=supervisor, 2=teacher, 3=parent, 4=supervisor & teacher, 5=teacher & parent
const validAudiences = [1, 2, 3, 4, 5];

// Modified createAnnouncement function to match database schema
export const createAnnouncement = async ({
  title,
  details,
  status = 'draft',
  audience,
  user_id,
  session_id = null,
  date = null,
  time = null,
  attachment = null
}) => {
  if (!validAudiences.includes(audience)) {
    throw new Error('Invalid audience value. Must be 1=supervisor, 2=teacher, 3=parent, 4=supervisor & teacher, 5=teacher & parent');
  }

  // Use provided date or current date
  const announcementDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const result = await pool.query(
    `INSERT INTO announcement 
     (title, details, status, audience, user_id, session_id, date, time, attachment, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING *`,
    [title, details, status, audience, user_id, session_id, announcementDate, time, attachment]
  );
  return result.rows[0];
};

// Get all announcements (with author info and published_by object)
export const getAllAnnouncements = async () => {
  const result = await pool.query(
    `SELECT 
       a.*,
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
       a.*,
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

// Modified updateAnnouncement function to match database schema
export const updateAnnouncement = async (ann_id, {
  title,
  details,
  status,
  audience,
  time = null,
  attachment = null
}) => {
  if (!validAudiences.includes(audience)) {
    throw new Error('Invalid audience value. Must be 1=supervisor, 2=teacher, 3=parent, 4=supervisor & teacher, 5=teacher & parent');
  }

  const result = await pool.query(
    `UPDATE announcement SET
     title = $1, details = $2, status = $3, audience = $4, time = $5, attachment = $6
     WHERE ann_id = $7 RETURNING *`,
    [title, details, status, audience, time, attachment, ann_id]
  );
  return result.rows[0];
};

// Delete an announcement by ID
export const deleteAnnouncement = async (ann_id) => {
  const result = await pool.query(
    `DELETE FROM announcement WHERE ann_id = $1 RETURNING *`,
    [ann_id]
  );
  return result.rows[0];
};