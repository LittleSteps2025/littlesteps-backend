import express from 'express';
import authenticateUser from '../../middlewares/firebaseAuthMiddleware.js';
import { getAppointments } from '../../controllers/teacher/appointmentsController.js';

const router = express.Router();



router.get('/view', authenticateUser, getAppointments);



export default router;






