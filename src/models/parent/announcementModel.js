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
