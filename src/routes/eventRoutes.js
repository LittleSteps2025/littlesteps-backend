import express from 'express';
import eventController from '../controllers/eventController.js';

const router = express.Router();

// GET all events
router.get('/', eventController.getAll);

// GET single event
router.get('/:id', eventController.getOne);

// POST create new event
router.post('/', eventController.create);

// PUT update event
router.put('/:id', eventController.update);

// DELETE event
router.delete('/:id', eventController.delete);

export default router;
