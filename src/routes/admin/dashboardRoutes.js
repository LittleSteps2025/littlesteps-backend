import express from 'express';
import {
  getDashboardStats,
  getRecentActivities
} from '../../controllers/admin/dashboardController.js';

const router = express.Router();

// Dashboard routes
router.get('/stats', getDashboardStats);           // GET /api/admin/dashboard/stats
router.get('/activities', getRecentActivities);    // GET /api/admin/dashboard/activities

export default router;
