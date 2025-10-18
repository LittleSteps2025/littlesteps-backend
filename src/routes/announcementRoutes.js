import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/announcementController.js";

const router = express.Router();

// GET all announcements
router.get("/", getAll);

// GET single announcement
router.get("/:id", getById);

// POST create new announcement
router.post("/", create);

// PUT update announcement (full update)
router.put("/:id", update);

// DELETE announcement
router.delete("/:id", remove);

export default router;
