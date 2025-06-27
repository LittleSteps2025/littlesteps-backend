// src/models/dailyRecordModel.js
import pool from '../../config/db.js';

export const createDailyRecord = async (data) => {
  const {
    breakfast, tea_time, lunch, snack_time, medicine, special_notes, childId = 1,created_date
  } = data;

  const query = `
    INSERT INTO report (
      breakfast, tea_time, lunch, snack_time, medicine, special_notes, "childId",created_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7 , $8)
    RETURNING *`;

  const values = [
    breakfast, tea_time, lunch, snack_time, medicine, special_notes, childId,created_date
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createDailyRecord model:', error);
    throw new Error('Failed to create daily record in the database.'); // Re-throw a custom error
  }
};

