import express from 'express';
import AppointmentController from '../controllers/appointmentController.js';

const router = express.Router();

// GET all supervisor appointments
router.get('/', AppointmentController.getAppointments);

// POST create new supervisor appointment
router.post('/', AppointmentController.createAppointment);

export default router;
