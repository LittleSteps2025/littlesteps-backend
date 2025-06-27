// src/routes/parent/dailyRecordRoutes.js
import express from 'express';
import dailyRecordController from '../../controllers/parent/dailyRecordController.js';
// import { addDailyRecord } from '../../controllers/parent/dailyRecordController.js';

const router = express.Router();

router.post('/parent/daily-records', dailyRecordController.createDailyRecord);

export default router;
