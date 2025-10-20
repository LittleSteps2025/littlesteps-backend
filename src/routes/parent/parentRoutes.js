import express from "express";
import * as parentController from "../../controllers/parent/parentController.js";
import announcementController, {
  getMeetingsByChild,
} from "../../controllers/parent/announcementController.js";

const router = express.Router();

// Authentication routes
router.post("/login", parentController.parentLogin);
router.post("/verify", parentController.checkVerifiedParent);

// Events route (no auth required for now)
router.get("/events", announcementController.getEvents);

// Announcements and meetings (no auth for now)
router.get(
  "/announcements/parent",
  announcementController.getParentAnnouncements
);
router.get("/announcements/meeting/child/:childId", getMeetingsByChild);

// Protected routes middleware
// router.use(parentController.verifyParentToken);

export default router;
