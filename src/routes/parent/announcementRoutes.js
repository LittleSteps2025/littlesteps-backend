

import express from 'express';
import announcementController from '../../controllers/parent/announcementController.js';

const router = express.Router();
// GET /api/announcements/parents
router.get('/parent', announcementController.getParentAnnouncements);

export default router;
