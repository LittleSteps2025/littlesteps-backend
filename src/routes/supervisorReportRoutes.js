import express from 'express';
import {
  getAllReports,
  getReportById,
  getReportsByMonthYear,
  generateMonthlyReport,
  getMonthlyData,
  deleteReport,
  updateReportPdf
} from '../controllers/supervisorReportController.js';

const router = express.Router();

// Get all supervisor reports
router.get('/', getAllReports);

// Get report by ID
router.get('/:report_id', getReportById);

// Get reports by month and year
router.get('/month/:month/year/:year', getReportsByMonthYear);

// Get monthly data preview (without saving as report)
router.get('/preview/:month/:year', getMonthlyData);

// Generate new monthly summary report
router.post('/generate', generateMonthlyReport);

// Update report PDF path
router.patch('/:report_id/pdf', updateReportPdf);

// Delete report
router.delete('/:report_id', deleteReport);

export default router;
