import dashboardModel from '../models/dashboardModel.js';

class DashboardController {
  /**
   * Get all dashboard statistics
   * GET /api/dashboard/stats
   */
  async getDashboardStats(req, res) {
    try {
      console.log('📊 Fetching dashboard statistics...');
      
      const stats = await dashboardModel.getAllDashboardStats();
      
      console.log('✅ Dashboard stats fetched successfully');
      
      res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message
      });
    }
  }

  /**
   * Get total children count
   * GET /api/dashboard/children/count
   */
  async getChildrenCount(req, res) {
    try {
      const count = await dashboardModel.getTotalChildren();
      
      res.status(200).json({
        success: true,
        data: { totalChildren: count }
      });
    } catch (error) {
      console.error('Error fetching children count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch children count',
        error: error.message
      });
    }
  }

  /**
   * Get active parents count
   * GET /api/dashboard/parents/count
   */
  async getParentsCount(req, res) {
    try {
      const count = await dashboardModel.getActiveParents();
      
      res.status(200).json({
        success: true,
        data: { activeParents: count }
      });
    } catch (error) {
      console.error('Error fetching parents count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch parents count',
        error: error.message
      });
    }
  }

  /**
   * Get active teachers count
   * GET /api/dashboard/teachers/count
   */
  async getTeachersCount(req, res) {
    try {
      const count = await dashboardModel.getActiveTeachers();
      
      res.status(200).json({
        success: true,
        data: { activeTeachers: count }
      });
    } catch (error) {
      console.error('Error fetching teachers count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teachers count',
        error: error.message
      });
    }
  }

  /**
   * Get upcoming events
   * GET /api/dashboard/events/upcoming
   */
  async getUpcomingEvents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 4;
      const events = await dashboardModel.getUpcomingEvents(limit);
      
      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming events',
        error: error.message
      });
    }
  }

  /**
   * Get pending complaints count
   * GET /api/dashboard/complaints/pending
   */
  async getPendingComplaints(req, res) {
    try {
      const count = await dashboardModel.getPendingComplaints();
      
      res.status(200).json({
        success: true,
        data: { pendingComplaints: count }
      });
    } catch (error) {
      console.error('Error fetching pending complaints:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending complaints',
        error: error.message
      });
    }
  }

  /**
   * Get children by age group
   * GET /api/dashboard/children/by-age
   */
  async getChildrenByAgeGroup(req, res) {
    try {
      const data = await dashboardModel.getChildrenByAgeGroup();
      
      res.status(200).json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Error fetching children by age group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch children by age group',
        error: error.message
      });
    }
  }

  /**
   * Get children by group/class
   * GET /api/dashboard/children/by-group
   */
  async getChildrenByGroup(req, res) {
    try {
      const data = await dashboardModel.getChildrenByGroup();
      
      res.status(200).json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Error fetching children by group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch children by group',
        error: error.message
      });
    }
  }

  /**
   * Get stats by period (today, week, month)
   * GET /api/dashboard/stats/period?period=today|week|month
   */
  async getStatsByPeriod(req, res) {
    try {
      const period = req.query.period || 'today';
      
      if (!['today', 'week', 'month'].includes(period)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid period. Use: today, week, or month'
        });
      }

      const stats = await dashboardModel.getStatsByPeriod(period);
      
      res.status(200).json({
        success: true,
        data: stats,
        period: period
      });
    } catch (error) {
      console.error('Error fetching stats by period:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stats by period',
        error: error.message
      });
    }
  }

  /**
   * Get chart data for graphs
   * GET /api/dashboard/charts?period=week|month
   */
  async getChartData(req, res) {
    try {
      const period = req.query.period || 'week';
      
      if (!['week', 'month'].includes(period)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid period. Use: week or month'
        });
      }

      const chartData = await dashboardModel.getChartData(period);
      
      res.status(200).json({
        success: true,
        data: chartData,
        period: period
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chart data',
        error: error.message
      });
    }
  }
}

export default new DashboardController();
