import pool from "../../config/db.js";

export const getPaymentsHistory = async (child_id) => {
  const result = await pool.query(
    `SELECT *
     FROM payments
     WHERE child_id = $1
     ORDER BY created_at DESC`,
    [child_id]
  );
  return result.rows;
}

export const getParentPaymentsHistory = async (parent_email) => {
    const result = await pool.query(
            `SELECT *
             FROM payments
             WHERE parent_email = $1
             ORDER BY created_at DESC`,
            [parent_email]
        );
    return result.rows;       
}