import express from 'express';
import * as reportsController from '../../controllers/admin/reportsController.js';

const router = express.Router();

// Direct download endpoints for each report type
router.get('/children/download', reportsController.downloadChildrenReport);
router.get('/attendance/download', reportsController.downloadAttendanceReport);
router.get('/subscriptions/download', reportsController.downloadSubscriptionsReport);
router.get('/payments/download', reportsController.downloadPaymentsReport);
router.get('/complaints/download', reportsController.downloadComplaintsReport);
router.get('/announcements/download', reportsController.downloadAnnouncementsReport);
router.get('/staff/download', reportsController.downloadStaffReport);
router.get('/parents/download', reportsController.downloadParentsReport);

// Generate a new report
router.post('/generate', reportsController.generateReport);

// Get report history with pagination
router.get('/history', reportsController.getReportHistory);

// Download a specific report by admin_report_id
router.get('/download/:adminReportId', reportsController.downloadReport);

// Get quick stats for MIS
router.get('/quick-stats', reportsController.getQuickStats);

// Export all data
router.post('/export-all', reportsController.exportAllData);

export default router;
