import pool from '../../config/db.js';

//insert new complaint or feedback
export const insertComplaint = async ({ date, subject, recipient, description, child_id }) => {
    const query = `
        INSERT INTO complaints (date, subject, recipient, description, child_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [date, subject, recipient, description, child_id]);
    return rows[0];
};