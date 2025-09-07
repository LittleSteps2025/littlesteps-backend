import pool from '../../config/db.js';

export const getMedicalRecordsByChild = async (childId) => {
  const query = `
    SELECT child_id, record_date, type, title, description
    FROM medical_records
    WHERE child_id = $1
    ORDER BY record_date DESC
  `;
  const { rows } = await pool.query(query, [childId]);
  return rows;
};

export const getChildMedicalInfo = async (childId) => {
  const query = `
    SELECT child_id, blood_type, allergies, medical_info
    FROM child
    WHERE child_id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [childId]);
  return rows[0] || null;
};

// Update child medical info
export const updateChildMedicalInfo = async (childId, { blood_type, allergies, medical_info }) => {
  const query = `
    UPDATE child 
    SET blood_type = $2, allergies = $3, medical_info = $4
    WHERE child_id = $1
    RETURNING child_id, blood_type, allergies, medical_info
  `;
  const { rows } = await pool.query(query, [childId, blood_type, allergies, medical_info]);
  return rows[0] || null;
};

// Get single record by child_id + record_date
export const getRecordByChildAndDate = async (childId, recordDate) => {
  const q = `
    SELECT child_id, record_date, type, title, description
    FROM medical_records
    WHERE child_id = $1 AND record_date::date = $2::date
    LIMIT 1
  `;
  const dateOnly = recordDate.split('T')[0]; 
  const { rows } = await pool.query(q, [childId, dateOnly]);
  return rows[0] || null;
};

// Insert record
export const insertMedicalRecord = async ({ child_id, record_date, type, title, description }) => {
  const q = `
    INSERT INTO medical_records (child_id, record_date, type, title, description)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING child_id, record_date, type, title, description
  `;
  const { rows } = await pool.query(q, [child_id, record_date, type, title, description]);
  return rows[0];
};

// Update record
export const updateMedicalRecordByChildAndDate = async ({ child_id, record_date, type, title, description }) => {
  const q = `
    UPDATE medical_records
    SET type = $3, title = $4, description = $5
    WHERE child_id = $1 AND record_date::date = $2::date
    RETURNING child_id, record_date, type, title, description
  `;
  const dateOnly = record_date.split('T')[0];
  const { rows } = await pool.query(q, [child_id, dateOnly, type, title, description]);
  return rows[0] || null;
};