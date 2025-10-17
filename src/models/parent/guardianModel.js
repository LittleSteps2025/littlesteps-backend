import pool from '../../config/db.js';

export const insertGuardian = async ({ name, nic, relationship, phone, email, address, parent_id }) => {
  const query = `
    INSERT INTO guardian (name, nic, relationship, phone, email, address, parent_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const values = [name, nic, relationship, phone, email, address, parent_id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getGuardiansByParent = async (parent_id) => {
  const query = `
    SELECT *
    FROM guardian
    WHERE parent_id = $1
    ORDER BY name ASC;
  `;
  const { rows } = await pool.query(query, [parent_id]);
  return rows;
};