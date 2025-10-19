import pool from '../../config/db.js';

export const getAnnouncementsForParents = async () => {
  const query = `
    SELECT ann_id, title, date, time, details, attachment, user_id, created_at
    FROM announcement
    WHERE audience IN ('3', '5')
    ORDER BY date DESC, time DESC
  `;
  const { rows } = await pool.query(query);
  const normalized = rows.map((r) => ({
    ...r,
    date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
  }));
  return normalized;
};

export const findMeetingsByChild = async (childId) => {
  const q = `
    SELECT meeting_id, child_id, recipient, meeting_date, meeting_time, reason, response, status
    FROM meeting
    WHERE child_id = $1
    ORDER BY meeting_date DESC, meeting_time DESC
  `;
  const { rows } = await pool.query(q, [childId]);
  return rows;
};

export const getEventsForParents = async () => {
  const query = `
    SELECT event_id, topic, description, venue, date, time, user_id, created_time
    FROM event
    ORDER BY date DESC, time DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

