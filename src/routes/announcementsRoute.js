import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/announcementController.js";

const router = express.Router();

// Create a new announcement
router.post("/", create);

// Get all announcements
router.get("/", getAll);

// Get a single announcement by ID
router.get("/:ann_id", getById);

// Update an announcement by ID
router.put("/:ann_id", update);

// Delete an announcement by ID
router.delete("/:ann_id", remove);

export default router;
