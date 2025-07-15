import pool from '../../config/db.js';

export const getMealRecordsByChildAndDate = async (child_id, date) => {
  const query = `
    SELECT * FROM report 
    WHERE child_id = $1 AND DATE(create_date) = $2
    ORDER BY create_date DESC
  `;
  const { rows } = await pool.query(query, [child_id, date]);
  return rows;
};

export const getAllMealRecordsByDate = async (date) => {
  const query = `
    SELECT * FROM report 
    WHERE DATE(create_date) = $1
    ORDER BY child_id, create_date DESC
  `;
  const { rows } = await pool.query(query, [date]);
  return rows;
};