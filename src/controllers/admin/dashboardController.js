import * as DashboardModel from '../../models/admin/dashboardModel.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await DashboardModel.getDashboardStats();

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await DashboardModel.getRecentActivities(limit);

    res.status(200).json({
      success: true,
      message: 'Recent activities retrieved successfully',
      data: activities
    });
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};
