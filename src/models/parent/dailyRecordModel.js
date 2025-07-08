// src/models/dailyRecordModel.js
import pool from '../../config/db.js';

export const createDailyRecord = async (data) => {
  const {
   breakfirst, morning_snack, lunch, evening_snack, medicine, special_note, child_id = 1,create_date
  } = data;

  const query = `
    INSERT INTO report (
      breakfirst, morning_snack, lunch, evening_snack, medicine, special_note, "child_id",create_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7 , $8)
    RETURNING *`;

  const values = [
    breakfirst, morning_snack, lunch, evening_snack, medicine, special_note, child_id,create_date
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createDailyRecord model:', error);
    throw new Error('Failed to create daily record in the database.'); // Re-throw a custom error
  }
};

