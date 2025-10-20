import express from 'express';
import authenticateUser from '../../middlewares/firebaseAuthMiddleware.js';
import { getAppointments,respondToAppointment,updateAppointmentStatus } from '../../controllers/teacher/appointmentsController.js';

const router = express.Router();



router.get('/view', authenticateUser, getAppointments);
router.post("/respond/:id", authenticateUser, respondToAppointment);
router.put("/status/:id", authenticateUser, updateAppointmentStatus);

export default router;






