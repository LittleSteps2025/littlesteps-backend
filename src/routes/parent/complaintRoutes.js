import express from 'express';
import {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintStats
} from '../../controllers/parent/complaintController.js';
import authenticateUser from '../../middlewares/firebaseAuthMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Get all complaints with optional filters
router.get('/', getComplaints);

// Get complaint statistics
router.get('/stats', getComplaintStats);

// Get a specific complaint by ID
router.get('/:id', getComplaintById);

// Create a new complaint
router.post('/', createComplaint);

// Update a complaint
router.put('/:id', updateComplaint);

// Delete a complaint
router.delete('/:id', deleteComplaint);

export default router;