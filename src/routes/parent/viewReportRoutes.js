import express from 'express';
import { getDailyRecordByChildAndDate, getAllDailyRecordsByDate } from '../../controllers/parent/viewReportController.js';

const router = express.Router();

router.get('/', getDailyRecordByChildAndDate);
router.get('/all', getAllDailyRecordsByDate);

export default router;
