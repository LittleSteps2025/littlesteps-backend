import * as DashboardAnalyticsModel from '../../models/admin/dashboardAnalyticsModel.js';

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    const { period = 'this-month' } = req.query;

    // Validate period parameter
    const validPeriods = ['this-week', 'this-month', 'last-month', 'this-year'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter. Use: this-week, this-month, last-month, or this-year'
      });
    }

    // Fetch all analytics data
    const analyticsData = await DashboardAnalyticsModel.getAllAnalytics(period);

    res.json({
      success: true,
      message: 'Analytics data retrieved successfully',
      data: analyticsData
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
};

// Get attendance trends only
export const getAttendanceTrends = async (req, res) => {
  try {
    const { period = 'this-month' } = req.query;
    
    let startDate, endDate = new Date();
    
    switch (period) {
      case 'this-week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last-month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 2);
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'this-year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'this-month':
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const trends = await DashboardAnalyticsModel.getAttendanceTrends(startDate, endDate);

    res.json({
      success: true,
      message: 'Attendance trends retrieved successfully',
      data: trends
    });
  } catch (error) {
    console.error('Error fetching attendance trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance trends',
      error: error.message
    });
  }
};

// Get revenue trends only
export const getRevenueTrends = async (req, res) => {
  try {
    const { period = 'this-month' } = req.query;
    
    let startDate, endDate = new Date();
    
    switch (period) {
      case 'this-week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last-month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 2);
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'this-year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'this-month':
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const trends = await DashboardAnalyticsModel.getRevenueTrends(startDate, endDate);

    res.json({
      success: true,
      message: 'Revenue trends retrieved successfully',
      data: trends
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trends',
      error: error.message
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const status = await DashboardAnalyticsModel.getPaymentStatus();

    res.json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: status
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
};

// Get complaint statistics
export const getComplaintStats = async (req, res) => {
  try {
    const stats = await DashboardAnalyticsModel.getComplaintStats();

    res.json({
      success: true,
      message: 'Complaint statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching complaint stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint statistics',
      error: error.message
    });
  }
};
