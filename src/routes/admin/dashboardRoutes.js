import express from 'express';
import {
  getDashboardStats,
  getRecentActivities
} from '../../controllers/admin/dashboardController.js';
import {
  getAnalytics,
  getAttendanceTrends,
  getRevenueTrends,
  getPaymentStatus,
  getComplaintStats
} from '../../controllers/admin/dashboardAnalyticsController.js';

const router = express.Router();

// Dashboard routes
router.get('/stats', getDashboardStats);           // GET /api/admin/dashboard/stats
router.get('/activities', getRecentActivities);    // GET /api/admin/dashboard/activities

// Analytics routes (no authentication required)
router.get('/analytics', getAnalytics);            // GET /api/admin/dashboard/analytics
router.get('/analytics/attendance', getAttendanceTrends);  // GET /api/admin/dashboard/analytics/attendance
router.get('/analytics/revenue', getRevenueTrends);        // GET /api/admin/dashboard/analytics/revenue
router.get('/analytics/payments', getPaymentStatus);       // GET /api/admin/dashboard/analytics/payments
router.get('/analytics/complaints', getComplaintStats);    // GET /api/admin/dashboard/analytics/complaints

export default router;
