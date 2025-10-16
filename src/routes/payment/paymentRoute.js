import express from "express";

import {
  notify, 
  create, 
  paymentSuccess, 
  paymentCancel, 
  getHistory, 
  getParentPaymentHistory
} from "../../controllers/payment/paymentController.js";

import {
  getAllPayments,
  getPaymentById
} from "../../controllers/payment/adminPaymentController.js";

const router = express.Router();

// Admin routes
router.get("/", getAllPayments);
router.get("/:id", getPaymentById);

// Regular payment routes
router.post("/notify", notify);
router.post("/create", create);
router.get("/success", paymentSuccess);
router.get("/cancel", paymentCancel);
router.get("/history/:child_id", getHistory);
router.get("/parent-history/:parent_email", getParentPaymentHistory);

export default router;
