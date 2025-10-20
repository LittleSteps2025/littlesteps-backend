import express from "express";
import {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintStats,
} from "../../controllers/parent/complaintController.js";
import authenticateUser from "../../middlewares/firebaseAuthMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes except POST
router.use((req, res, next) => {
  if (req.method === "POST") {
    return next(); // Skip authentication for POST requests
  }
  return authenticateUser(req, res, next);
});

// Get all complaints with optional filters
router.get("/", getComplaints);

// Get complaint statistics
router.get("/stats", getComplaintStats);

// Get a specific complaint by ID
router.get("/:id", getComplaintById);

// Create a new complaint (no authentication required)
router.post("/", createComplaint);

// Update a complaint
router.put("/:id", updateComplaint);

// Delete a complaint
router.delete("/:id", deleteComplaint);

export default router;
