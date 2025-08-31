import express from 'express';
import {
  getAllMeetings,
  getMeetingById,
  getMeetingsByChildId,
  getMeetingsByRecipient,
  createMeeting,
  updateMeeting,
  updateMeetingResponse,
  deleteMeeting,
  searchMeetings
} from '../controllers/meetingController.js';

const router = express.Router();

// Get all meetings
router.get('/', getAllMeetings);

// Search meetings with filters
router.get('/search', searchMeetings);

// Get meeting by ID
router.get('/:meeting_id', getMeetingById);

// Get meetings by child ID
router.get('/child/:child_id', getMeetingsByChildId);

// Get meetings by recipient (teacher or supervisor)
router.get('/recipient/:recipient', getMeetingsByRecipient);

// Create new meeting
router.post('/', createMeeting);

// Update meeting (supervisor can only update date, time, and reason)
router.put('/:meeting_id', updateMeeting);

// Update meeting response only
router.patch('/:meeting_id/response', updateMeetingResponse);

// Delete meeting
router.delete('/:meeting_id', deleteMeeting);

export default router;
