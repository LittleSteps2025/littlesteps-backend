import express from 'express';
import { createMeetingRequest, getMeetingsByChild, getMeetingsForRecipient, respondToMeeting } from '../../controllers/parent/meetingController.js';

const router = express.Router();

// Parent creates a meeting request
router.post('/meeting', createMeetingRequest);

// Get meetings for a specific child
router.get('/meeting/child/:childId', getMeetingsByChild);

// Get meetings for a recipient (teacher/supervisor) - optional query ?recipient_id=
router.get('/meeting/recipient/:recipient', getMeetingsForRecipient);

// Recipient responds to a meeting (teacher/supervisor)
router.put('/meeting/respond', respondToMeeting);

export default router;
