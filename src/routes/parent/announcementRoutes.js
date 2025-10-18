

import express from 'express';
import announcementController, {getMeetingsByChild} from '../../controllers/parent/announcementController.js';

const router = express.Router();
// GET /api/announcements/parents
router.get('/parent', announcementController.getParentAnnouncements);

router.get('/meeting/child/:childId', getMeetingsByChild);

export default router;
