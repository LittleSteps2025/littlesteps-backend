import pool from '../../config/db.js';

/**
 * Get attendance records for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of attendance records
 */
export const getAttendanceByDate = async (date) => {
  try {
    const query = `
      SELECT 
        r.report_id as attendance_id,
        r.child_id,
        r.create_date as date,
        TO_CHAR(r.arrived_time, 'HH24:MI') as check_in_time,
        TO_CHAR(r.checkout_time, 'HH24:MI') as check_out_time,
        r.checkout_person,
        r.special_note as notes,
        r.day_summery,
        r.progress,
        CASE 
          WHEN r.arrived_time IS NOT NULL THEN 'present'
          ELSE 'absent'
        END as status,
        c.name as child_name,
        c.age,
        c.gender,
        c.group_id,
        c.image as photo_url,
        u.name as teacher_name,
        r.teacher_id
      FROM report r
      INNER JOIN child c ON r.child_id = c.child_id
      LEFT JOIN "user" u ON r.teacher_id = u.user_id
      WHERE r.create_date = $1
      ORDER BY c.name ASC
    `;

    const result = await pool.query(query, [date]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    throw error;
  }
};

/**
 * Get attendance history with pagination
 * @param {number} limit - Number of records to fetch
 * @param {number} offset - Offset for pagination
 * @param {string} date - Optional date filter in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of attendance records
 */
export const getAttendanceHistory = async (limit = 50, offset = 0, date = null) => {
  try {
    let query = `
      SELECT 
        r.report_id as attendance_id,
        r.child_id,
        r.create_date as date,
        TO_CHAR(r.arrived_time, 'HH24:MI') as check_in_time,
        TO_CHAR(r.checkout_time, 'HH24:MI') as check_out_time,
        r.checkout_person,
        r.special_note as notes,
        r.day_summery,
        r.progress,
        CASE 
          WHEN r.arrived_time IS NOT NULL THEN 'present'
          ELSE 'absent'
        END as status,
        c.name as child_name,
        c.age,
        c.gender,
        c.group_id,
        c.image as photo_url,
        u.name as teacher_name,
        r.teacher_id
      FROM report r
      INNER JOIN child c ON r.child_id = c.child_id
      LEFT JOIN "user" u ON r.teacher_id = u.user_id
    `;

    const params = [];
    let paramCount = 0;

    // Add date filter if provided
    if (date) {
      query += ` WHERE r.create_date = $${++paramCount}`;
      params.push(date);
    }

    query += ` ORDER BY r.create_date DESC, c.name ASC`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    throw error;
  }
};

/**
 * Get attendance statistics for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Statistics object
 */
export const getAttendanceStats = async (date) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN r.arrived_time IS NOT NULL THEN 1 END) as total_present,
        COUNT(CASE WHEN r.arrived_time IS NULL THEN 1 END) as total_absent,
        (SELECT COUNT(*) FROM child WHERE child.child_id IN (SELECT child_id FROM report WHERE create_date = $1)) as total_children
      FROM report r
      WHERE r.create_date = $1
    `;

    const result = await pool.query(query, [date]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    throw error;
  }
};

/**
 * Create or update attendance record
 * @param {Object} attendanceData - Attendance data
 * @returns {Promise<Object>} Created/updated attendance record
 */
export const createOrUpdateAttendance = async (attendanceData) => {
  const {
    child_id,
    teacher_id,
    date,
    arrived_time,
    checkout_time,
    checkout_person,
    special_note,
    day_summery,
    progress,
    status
  } = attendanceData;

  try {
    // Check if record exists for this child and date
    const checkQuery = `
      SELECT report_id FROM report 
      WHERE child_id = $1 AND create_date = $2
    `;
    const checkResult = await pool.query(checkQuery, [child_id, date]);

    if (checkResult.rows.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE report 
        SET 
          teacher_id = COALESCE($1, teacher_id),
          arrived_time = COALESCE($2, arrived_time),
          checkout_time = COALESCE($3, checkout_time),
          checkout_person = COALESCE($4, checkout_person),
          special_note = COALESCE($5, special_note),
          day_summery = COALESCE($6, day_summery),
          progress = COALESCE($7, progress)
        WHERE report_id = $8
        RETURNING 
          report_id as attendance_id,
          child_id,
          create_date as date,
          TO_CHAR(arrived_time, 'HH24:MI') as check_in_time,
          TO_CHAR(checkout_time, 'HH24:MI') as check_out_time,
          checkout_person,
          special_note as notes,
          day_summery,
          progress,
          CASE 
            WHEN arrived_time IS NOT NULL THEN 'present'
            ELSE 'absent'
          END as status
      `;

      const result = await pool.query(updateQuery, [
        teacher_id,
        arrived_time,
        checkout_time,
        checkout_person,
        special_note,
        day_summery,
        progress,
        checkResult.rows[0].report_id
      ]);

      return result.rows[0];
    } else {
      // Create new record
      const insertQuery = `
        INSERT INTO report (
          child_id,
          teacher_id,
          create_date,
          arrived_time,
          checkout_time,
          checkout_person,
          special_note,
          day_summery,
          progress
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING 
          report_id as attendance_id,
          child_id,
          create_date as date,
          TO_CHAR(arrived_time, 'HH24:MI') as check_in_time,
          TO_CHAR(checkout_time, 'HH24:MI') as check_out_time,
          checkout_person,
          special_note as notes,
          day_summery,
          progress,
          CASE 
            WHEN arrived_time IS NOT NULL THEN 'present'
            ELSE 'absent'
          END as status
      `;

      const result = await pool.query(insertQuery, [
        child_id,
        teacher_id || null,
        date,
        arrived_time || null,
        checkout_time || null,
        checkout_person || null,
        special_note || null,
        day_summery || null,
        progress || 0
      ]);

      return result.rows[0];
    }
  } catch (error) {
    console.error('Error creating/updating attendance:', error);
    throw error;
  }
};

/**
 * Get attendance record by ID
 * @param {number} attendanceId - Attendance record ID
 * @returns {Promise<Object>} Attendance record
 */
export const getAttendanceById = async (attendanceId) => {
  try {
    const query = `
      SELECT 
        r.report_id as attendance_id,
        r.child_id,
        r.create_date as date,
        TO_CHAR(r.arrived_time, 'HH24:MI') as check_in_time,
        TO_CHAR(r.checkout_time, 'HH24:MI') as check_out_time,
        r.checkout_person,
        r.special_note as notes,
        r.day_summery,
        r.progress,
        CASE 
          WHEN r.arrived_time IS NOT NULL THEN 'present'
          ELSE 'absent'
        END as status,
        c.name as child_name,
        c.age,
        c.gender,
        c.group_id,
        c.image as photo_url,
        u.name as teacher_name,
        r.teacher_id
      FROM report r
      INNER JOIN child c ON r.child_id = c.child_id
      LEFT JOIN "user" u ON r.teacher_id = u.user_id
      WHERE r.report_id = $1
    `;

    const result = await pool.query(query, [attendanceId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching attendance by ID:', error);
    throw error;
  }
};

/**
 * Delete attendance record
 * @param {number} attendanceId - Attendance record ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAttendance = async (attendanceId) => {
  try {
    const query = `DELETE FROM report WHERE report_id = $1`;
    await pool.query(query, [attendanceId]);
    return true;
  } catch (error) {
    console.error('Error deleting attendance:', error);
    throw error;
  }
};

/**
 * Get attendance summary for date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Array>} Summary data
 */
export const getAttendanceSummary = async (startDate, endDate) => {
  try {
    const query = `
      SELECT 
        r.create_date as date,
        COUNT(*) as total_records,
        COUNT(CASE WHEN r.arrived_time IS NOT NULL THEN 1 END) as total_present,
        COUNT(CASE WHEN r.arrived_time IS NULL THEN 1 END) as total_absent
      FROM report r
      WHERE r.create_date BETWEEN $1 AND $2
      GROUP BY r.create_date
      ORDER BY r.create_date DESC
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    throw error;
  }
};

/**
 * Get attendance for date range (week/month view)
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Array>} Array of attendance records
 */
export const getAttendanceByDateRange = async (startDate, endDate) => {
  try {
    const query = `
      SELECT 
        r.report_id as attendance_id,
        r.child_id,
        r.create_date as date,
        TO_CHAR(r.arrived_time, 'HH24:MI') as check_in_time,
        TO_CHAR(r.checkout_time, 'HH24:MI') as check_out_time,
        r.checkout_person,
        r.special_note as notes,
        r.day_summery,
        r.progress,
        CASE 
          WHEN r.arrived_time IS NOT NULL THEN 'present'
          ELSE 'absent'
        END as status,
        c.name as child_name,
        c.age,
        c.gender,
        c.group_id,
        c.image as photo_url,
        u.name as teacher_name,
        r.teacher_id
      FROM report r
      INNER JOIN child c ON r.child_id = c.child_id
      LEFT JOIN "user" u ON r.teacher_id = u.user_id
      WHERE r.create_date BETWEEN $1 AND $2
      ORDER BY r.create_date DESC, c.name ASC
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching attendance by date range:', error);
    throw error;
  }
};

export default {
  getAttendanceByDate,
  getAttendanceHistory,
  getAttendanceStats,
  createOrUpdateAttendance,
  getAttendanceById,
  deleteAttendance,
  getAttendanceSummary,
  getAttendanceByDateRange
};
