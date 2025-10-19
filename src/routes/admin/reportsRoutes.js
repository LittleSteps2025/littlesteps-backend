import express from 'express';
import * as reportsController from '../../controllers/admin/reportsController.js';

const router = express.Router();

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
