import express from "express";
import {
  getAllPayments,
  getPaymentById,
  getPaymentStats,
  updatePaymentStatus
} from "../../controllers/payment/adminPaymentController.js";

const router = express.Router();

// Admin payment routes
router.get("/", getAllPayments);                    // GET /api/admin/payments
router.get("/stats", getPaymentStats);              // GET /api/admin/payments/stats
router.get("/:id", getPaymentById);                 // GET /api/admin/payments/:id
router.put("/:id/status", updatePaymentStatus);     // PUT /api/admin/payments/:id/status

export default router;
