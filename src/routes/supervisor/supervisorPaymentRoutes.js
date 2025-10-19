import express from "express";
import {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  getPaymentStats,
  getMonthlyRevenue,
} from "../../controllers/supervisor/supervisorPaymentController.js";
import { verifySupervisorToken } from "../../controllers/supervisorController.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifySupervisorToken);

// Get all payments with optional filters
router.get("/", getPayments);

// Get payment statistics
router.get("/stats", getPaymentStats);

// Get monthly revenue data
router.get("/monthly-revenue", getMonthlyRevenue);

// Get a specific payment by ID
router.get("/:id", getPaymentById);

// Create a new payment
router.post("/", createPayment);

// Update a payment
router.put("/:id", updatePayment);

export default router;
