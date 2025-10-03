import { insertMeeting, findMeetingsByChild, findMeetingsByRecipient, updateMeetingResponse } from '../../models/parent/meetingModel.js';
import ChildModel from '../../models/child/childModel.js';
import pool from '../../config/db.js';

// Create meeting request (parent-facing)
export const createMeetingRequest = async (req, res) => {
  try {
    const { child_id, recipient,  meeting_date, meeting_time, reason } = req.body || {};
    if (!child_id || !recipient || !meeting_date || !meeting_time || !reason) {
      return res.status(400).json({ success: false, message: 'child_id, recipient, meeting_date, meeting_time and reason are required' });
    }

    // validate recipient
    if (!['teacher', 'supervisor'].includes(recipient)) {
      return res.status(400).json({ success: false, message: 'recipient must be either "teacher" or "supervisor"' });
    }

    // ensure child exists
    const child = await ChildModel.findById(Number(child_id));
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    // insert
    const created = await insertMeeting({ child_id: Number(child_id), recipient, meeting_date, meeting_time, reason });
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('createMeetingRequest error', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
};

// Get meetings for a child (public to parent)
export const getMeetingsByChild = async (req, res) => {
  try {
    const raw = req.params.childId || req.query.child_id;
    if (!raw) return res.status(400).json({ success: false, message: 'childId is required' });
    const childId = Number(raw);
    if (Number.isNaN(childId)) return res.status(400).json({ success: false, message: 'Invalid childId' });

    const meetings = await findMeetingsByChild(childId);
    return res.json({ success: true, data: meetings });
  } catch (err) {
    console.error('getMeetingsByChild error', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
};

// Get meetings for recipient (teacher/supervisor)
export const getMeetingsForRecipient = async (req, res) => {
  try {
    const recipient = req.params.recipient; // 'teacher' or 'supervisor'
    if (!recipient || !['teacher', 'supervisor'].includes(recipient)) return res.status(400).json({ success: false, message: 'Invalid recipient' });

    const meetings = await findMeetingsByRecipient(recipient);
    return res.json({ success: true, data: meetings });
  } catch (err) {
    console.error('getMeetingsForRecipient error', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
};

// Respond to a meeting (teacher/supervisor)
export const respondToMeeting = async (req, res) => {
  try {
    const { meeting_id, response, status } = req.body || {};
    if (!meeting_id || !status) return res.status(400).json({ success: false, message: 'meeting_id and status are required' });
    // simple status validation
    if (!['accepted', 'declined', 'pending'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const updated = await updateMeetingResponse({ meeting_id: Number(meeting_id), response: response || null, status });
    if (!updated) return res.status(404).json({ success: false, message: 'Meeting not found' });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('respondToMeeting error', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
};
