import express from 'express';  
import { createComplaint } from '../../controllers/parent/complaintController.js';

const router = express.Router();

router.post('/complaints', createComplaint);

export default router;