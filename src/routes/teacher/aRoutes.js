// routes/teacher/announcementRoutes.js
import express from "express";
import { getAllAnnouncements, getAnnouncementById } from "../../controllers/teacher/aController.js";

const router = express.Router();

router.get("/", getAllAnnouncements);
router.get("/:id", getAnnouncementById);

export default router;
