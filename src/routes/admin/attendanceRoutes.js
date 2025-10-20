import express from 'express';
import {
  getAttendance,
  getAttendanceHistoryController,
  getAttendanceStatsController,
  getAttendanceByIdController,
  createAttendance,
  updateAttendance,
  deleteAttendanceController,
  getAttendanceSummaryController
} from '../../controllers/admin/attendanceController.js';
import childModel from '../../models/child/childModel.js';
import pool from '../../config/db.js';

const router = express.Router();

/**
 * @route GET /api/admin/children
 * @desc Get all children for attendance management
 * @access Admin
 */
router.get('/children', async (req, res) => {
  try {
    const children = await childModel.findAll();
    
    const formattedChildren = children.map(child => ({
      child_id: child.child_id,
      id: child.child_id,
      name: child.name,
      child_name: child.name,
      age: child.age,
      gender: child.gender,
      dob: child.dob,
      group_id: child.group_id,
      group_name: child.group_name,
      classroom: child.group_name,
      image: child.image,
      photo_url: child.image,
      photo: child.image,
      blood_type: child.blood_type,
      allergies: child.allergies,
      parent_name: child.parent_name,
      parent_email: child.parent_email,
      parent_phone: child.parent_phone,
      package_id: child.package_id,
      package_name: child.package_name
    }));

    return res.status(200).json({
      success: true,
      message: 'Children retrieved successfully',
      data: formattedChildren
    });
  } catch (error) {
    console.error('Error fetching children:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch children',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Get all staff (teachers and supervisors) for attendance management
 * @access Admin
 */
router.get('/users', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.image,
        u.address,
        u.nic,
        u.status
      FROM "user" u
      WHERE u.role IN ('teacher', 'supervisor')
      AND u.status = 'active'
      ORDER BY u.role, u.name ASC
    `;
    
    const result = await pool.query(query);
    
    const formattedUsers = result.rows.map(user => ({
      user_id: user.user_id,
      id: user.user_id,
      name: user.name,
      full_name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      image: user.image,
      photo_url: user.image,
      avatar: user.image,
      address: user.address,
      nic: user.nic,
      status: user.status
    }));

    return res.status(200).json({
      success: true,
      message: 'Staff retrieved successfully',
      data: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/attendance
 * @desc Get attendance records (by date or summary)
 * @query date - Optional date in YYYY-MM-DD format
 * @access Admin
 */
router.get('/', getAttendance);

/**
 * @route GET /api/admin/attendance/history
 * @desc Get attendance history with pagination
 * @query limit - Number of records (default: 50)
 * @query offset - Offset for pagination (default: 0)
 * @access Admin
 */
router.get('/history', getAttendanceHistoryController);

/**
 * @route GET /api/admin/attendance/stats
 * @desc Get attendance statistics for a specific date
 * @query date - Date in YYYY-MM-DD format (required)
 * @access Admin
 */
router.get('/stats', getAttendanceStatsController);

/**
 * @route GET /api/admin/attendance/summary
 * @desc Get attendance summary for date range
 * @query startDate - Start date in YYYY-MM-DD format (required)
 * @query endDate - End date in YYYY-MM-DD format (required)
 * @access Admin
 */
router.get('/summary', getAttendanceSummaryController);

/**
 * @route GET /api/admin/attendance/:id
 * @desc Get single attendance record by ID
 * @access Admin
 */
router.get('/:id', getAttendanceByIdController);

/**
 * @route POST /api/admin/attendance
 * @desc Create or update attendance record
 * @body child_id, teacher_id, date, check_in_time, check_out_time, notes, etc.
 * @access Admin
 */
router.post('/', createAttendance);

/**
 * @route PUT /api/admin/attendance/:id
 * @desc Update attendance record
 * @body teacher_id, check_in_time, check_out_time, notes, etc.
 * @access Admin
 */
router.put('/:id', updateAttendance);

/**
 * @route DELETE /api/admin/attendance/:id
 * @desc Delete attendance record
 * @access Admin
 */
router.delete('/:id', deleteAttendanceController);

export default router;
