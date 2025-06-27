import express from 'express';
import { getGuardiansByChildId } from '../controllers/guardianController.js'; // or reportController if you put it there

const router = express.Router();

// This means GET /guardians/:childId will call getGuardiansByChildId
router.get('/:childId', getGuardiansByChildId);

export default router;
