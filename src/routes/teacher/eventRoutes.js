import express from 'express';
import { getAllEvents, getEventById } from '../../controllers/teacher/eventController.js';

const router = express.Router();

router.get('/', getAllEvents);
router.get('/events/:eventId', getEventById); // optional

export default router;
