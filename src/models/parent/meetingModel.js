import pool from '../../config/db.js';

// Insert a new meeting request
export const insertMeeting = async ({ child_id, recipient, meeting_date, meeting_time, reason }) => {
  const q = `
    INSERT INTO meeting (child_id, recipient, meeting_date, meeting_time, reason)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING meeting_id, child_id, recipient, meeting_date, meeting_time, reason, response
  `;
  const { rows } = await pool.query(q, [child_id, recipient, meeting_date, meeting_time, reason]);
  return rows[0];
};

// Get all meetings for a given child
export const findMeetingsByChild = async (childId) => {
  const q = `
    SELECT meeting_id, child_id, recipient, meeting_date, meeting_time, reason, response
    FROM meeting
    WHERE child_id = $1
    ORDER BY meeting_date DESC, meeting_time DESC
  `;
  const { rows } = await pool.query(q, [childId]);
  return rows;
};

// Get meetings for a recipient type (teacher|supervisor)
export const findMeetingsByRecipient = async (recipient) => {
  const q = `
    SELECT meeting_id, child_id, recipient, meeting_date, meeting_time, reason, response
    FROM meeting
    WHERE recipient = $1
    ORDER BY meeting_id DESC
  `;
  const { rows } = await pool.query(q, [recipient]);
  return rows;
};

export const getMeetingById = async (meetingId) => {
  const q = `
    SELECT meeting_id, child_id, recipient, meeting_date, meeting_time, reason, response
    FROM meeting
    WHERE meeting_id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(q, [meetingId]);
  return rows[0] || null;
};

// Update response (used by teacher/supervisor to respond)
export const updateMeetingResponse = async ({ meeting_id, response }) => {
  const q = `
    UPDATE meeting
    SET response = $2
    WHERE meeting_id = $1
    RETURNING meeting_id, child_id, recipient, meeting_date, meeting_time, reason, response
  `;
  const { rows } = await pool.query(q, [meeting_id, response]);
  return rows[0] || null;
};
