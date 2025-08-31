import express from 'express';
import {
  getAllComplaints, getComplaintById, getComplaintsByChildId, getComplaintsByRecipient,
  createComplaint, updateComplaint, updateComplaintStatus, updateComplaintAction, deleteComplaint, searchComplaints
} from '../controllers/complaintController.js';

const router = express.Router();

router.get('/', getAllComplaints);
router.get('/search', searchComplaints);
router.get('/:complaint_id', getComplaintById);
router.get('/child/:child_id', getComplaintsByChildId);
router.get('/recipient/:recipient', getComplaintsByRecipient);
router.post('/', createComplaint);
router.put('/:complaint_id', updateComplaint);
router.patch('/:complaint_id/status', updateComplaintStatus);
router.patch('/:complaint_id/action', updateComplaintAction);
router.delete('/:complaint_id', deleteComplaint);

export default router;
