import express from 'express';
import authenticateUser from '../../middlewares/firebaseAuthMiddleware.js';
import { getAppointments,respondToAppointment } from '../../controllers/teacher/appointmentsController.js';

const router = express.Router();



router.get('/view', authenticateUser, getAppointments);
router.post("/respond/:id", authenticateUser, respondToAppointment);


export default router;






