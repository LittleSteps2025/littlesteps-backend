// controllers/teacher/announcementController.js
import AnnouncementModel from "../../models/teacher/aModel.js";

// 🌸 Get all announcements
export const getAllAnnouncements = async (req, res, next) => {
  try {
    const announcements = await AnnouncementModel.getAllAnnouncements();
    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
};

// 🌹 Get announcement by ID
export const getAnnouncementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await AnnouncementModel.getAnnouncementById(id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.status(200).json(announcement);
  } catch (error) {
    console.error("Error fetching announcement by ID:", error);
    res.status(500).json({ error: "Failed to fetch announcement" });
  }
};
