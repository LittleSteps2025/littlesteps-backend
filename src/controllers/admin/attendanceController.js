import {
  getAttendanceByDate,
  getAttendanceHistory,
  getAttendanceStats,
  createOrUpdateAttendance,
  getAttendanceById,
  deleteAttendance,
  getAttendanceSummary,
  getAttendanceByDateRange
} from '../../models/admin/attendanceModel.js';

/**
 * @route GET /api/admin/attendance
 * @desc Get attendance records (by date, week, or month)
 * @access Admin
 */
export const getAttendance = async (req, res) => {
  try {
    const { date, view, startDate, endDate } = req.query;

    // If view is weekly or monthly, calculate date range
    if (view === 'weekly' || view === 'monthly') {
      const baseDate = date ? new Date(date) : new Date();
      let calculatedStartDate, calculatedEndDate;

      if (view === 'weekly') {
        // Get start of week (Sunday)
        const dayOfWeek = baseDate.getDay();
        calculatedStartDate = new Date(baseDate);
        calculatedStartDate.setDate(baseDate.getDate() - dayOfWeek);
        
        // Get end of week (Saturday)
        calculatedEndDate = new Date(calculatedStartDate);
        calculatedEndDate.setDate(calculatedStartDate.getDate() + 6);
      } else if (view === 'monthly') {
        // Get first day of month
        calculatedStartDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        
        // Get last day of month
        calculatedEndDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
      }

      const startDateStr = calculatedStartDate.toISOString().split('T')[0];
      const endDateStr = calculatedEndDate.toISOString().split('T')[0];

      const attendance = await getAttendanceByDateRange(startDateStr, endDateStr);
      
      return res.status(200).json({
        success: true,
        message: `Attendance records from ${startDateStr} to ${endDateStr}`,
        data: attendance,
        dateRange: {
          startDate: startDateStr,
          endDate: endDateStr
        }
      });
    }

    // If specific date range provided
    if (startDate && endDate) {
      const attendance = await getAttendanceByDateRange(startDate, endDate);
      
      return res.status(200).json({
        success: true,
        message: `Attendance records from ${startDate} to ${endDate}`,
        data: attendance
      });
    }

    // If specific date provided
    if (date) {
      const attendance = await getAttendanceByDate(date);
      
      return res.status(200).json({
        success: true,
        message: `Attendance records for ${date}`,
        data: attendance
      });
    }

    // Default: Get recent attendance (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const defaultStartDate = weekAgo.toISOString().split('T')[0];
    const defaultEndDate = today.toISOString().split('T')[0];

    const summary = await getAttendanceSummary(defaultStartDate, defaultEndDate);

    return res.status(200).json({
      success: true,
      message: 'Attendance summary for last 7 days',
      data: summary
    });
  } catch (error) {
    console.error('Error in getAttendance controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

/**
 * @route GET /api/admin/attendance/history
 * @desc Get attendance history with pagination
 * @access Admin
 */
export const getAttendanceHistoryController = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const date = req.query.date || null;

    const history = await getAttendanceHistory(limit, offset, date);

    return res.status(200).json({
      success: true,
      message: date 
        ? `Attendance history for ${date} retrieved successfully`
        : 'Attendance history retrieved successfully',
      data: history,
      pagination: {
        limit,
        offset,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Error in getAttendanceHistoryController:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history',
      error: error.message
    });
  }
};

/**
 * @route GET /api/admin/attendance/stats
 * @desc Get attendance statistics for a date
 * @access Admin
 */
export const getAttendanceStatsController = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const stats = await getAttendanceStats(date);

    return res.status(200).json({
      success: true,
      message: `Statistics for ${date}`,
      data: {
        totalPresent: parseInt(stats.total_present) || 0,
        totalAbsent: parseInt(stats.total_absent) || 0,
        totalChildren: parseInt(stats.total_children) || 0,
        totalRecords: parseInt(stats.total_records) || 0
      }
    });
  } catch (error) {
    console.error('Error in getAttendanceStatsController:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics',
      error: error.message
    });
  }
};

/**
 * @route GET /api/admin/attendance/:id
 * @desc Get single attendance record by ID
 * @access Admin
 */
export const getAttendanceByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await getAttendanceById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance record retrieved successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error in getAttendanceByIdController:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance record',
      error: error.message
    });
  }
};

/**
 * @route POST /api/admin/attendance
 * @desc Create or update attendance record
 * @access Admin
 */
export const createAttendance = async (req, res) => {
  try {
    const {
      child_id,
      teacher_id,
      date,
      check_in_time,
      check_out_time,
      checkout_person,
      notes,
      day_summery,
      progress,
      status
    } = req.body;

    // Validation
    if (!child_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Child ID and date are required'
      });
    }

    const attendanceData = {
      child_id,
      teacher_id: teacher_id || null,
      date,
      arrived_time: check_in_time || null,
      checkout_time: check_out_time || null,
      checkout_person: checkout_person || null,
      special_note: notes || null,
      day_summery: day_summery || null,
      progress: progress || 0,
      status: status || 'present'
    };

    const attendance = await createOrUpdateAttendance(attendanceData);

    return res.status(201).json({
      success: true,
      message: 'Attendance record saved successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error in createAttendance controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save attendance record',
      error: error.message
    });
  }
};

/**
 * @route PUT /api/admin/attendance/:id
 * @desc Update attendance record
 * @access Admin
 */
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      teacher_id,
      check_in_time,
      check_out_time,
      checkout_person,
      notes,
      day_summery,
      progress
    } = req.body;

    // First check if record exists
    const existing = await getAttendanceById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const attendanceData = {
      child_id: existing.child_id,
      teacher_id: teacher_id || existing.teacher_id,
      date: existing.date,
      arrived_time: check_in_time || existing.check_in_time,
      checkout_time: check_out_time || existing.check_out_time,
      checkout_person: checkout_person || existing.checkout_person,
      special_note: notes || existing.notes,
      day_summery: day_summery || existing.day_summery,
      progress: progress !== undefined ? progress : existing.progress
    };

    const attendance = await createOrUpdateAttendance(attendanceData);

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error in updateAttendance controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update attendance record',
      error: error.message
    });
  }
};

/**
 * @route DELETE /api/admin/attendance/:id
 * @desc Delete attendance record
 * @access Admin
 */
export const deleteAttendanceController = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if record exists
    const existing = await getAttendanceById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await deleteAttendance(id);

    return res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteAttendanceController:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message
    });
  }
};

/**
 * @route GET /api/admin/attendance/summary
 * @desc Get attendance summary for date range
 * @access Admin
 */
export const getAttendanceSummaryController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const summary = await getAttendanceSummary(startDate, endDate);

    return res.status(200).json({
      success: true,
      message: `Attendance summary from ${startDate} to ${endDate}`,
      data: summary
    });
  } catch (error) {
    console.error('Error in getAttendanceSummaryController:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary',
      error: error.message
    });
  }
};

export default {
  getAttendance,
  getAttendanceHistoryController,
  getAttendanceStatsController,
  getAttendanceByIdController,
  createAttendance,
  updateAttendance,
  deleteAttendanceController,
  getAttendanceSummaryController
};
