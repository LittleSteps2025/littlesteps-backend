import express from 'express';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Main dashboard stats endpoint - returns all stats in one call
router.get('/stats', dashboardController.getDashboardStats);

// Individual stat endpoints (optional, for granular access)
router.get('/children/count', dashboardController.getChildrenCount);
router.get('/parents/count', dashboardController.getParentsCount);
router.get('/teachers/count', dashboardController.getTeachersCount);
router.get('/events/upcoming', dashboardController.getUpcomingEvents);
router.get('/complaints/pending', dashboardController.getPendingComplaints);
router.get('/children/by-age', dashboardController.getChildrenByAgeGroup);
router.get('/children/by-group', dashboardController.getChildrenByGroup);

export default router;
