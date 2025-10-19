import pool from '../../config/db.js';

export const insertGuardian = async ({ name, nic, relationship, phone, email, address, parent_id, image = null }) => {
  const query = `
    INSERT INTO guardian (name, nic, relationship, phone, email, address, parent_id, image)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [name, nic, relationship, phone, email, address, parent_id, image];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getGuardiansByParent = async (parent_id) => {
  const query = `
    SELECT guardian_id, name, nic, relationship, phone, email, address, parent_id, image
    FROM guardian
    WHERE parent_id = $1
    ORDER BY name ASC;
  `;
  const { rows } = await pool.query(query, [parent_id]);
  return rows;
};

export const deleteGuardianById = async (guardian_id) => {
  const query = `DELETE FROM guardian WHERE guardian_id = $1 RETURNING *;`;
  const { rows } = await pool.query(query, [guardian_id]);
  return rows[0];
};