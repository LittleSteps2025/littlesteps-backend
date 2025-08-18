import express from 'express';
import announcementController from '../controllers/announcementController.js';

const router = express.Router();

// GET all announcements
router.get('/', announcementController.getAll);

// GET single announcement
router.get('/:id', announcementController.getOne);

// POST create new announcement
router.post('/', announcementController.create);

// PUT update announcement (full update)
router.put('/:id', announcementController.update);

// DELETE announcement
router.delete('/:id', announcementController.delete);

export default router;