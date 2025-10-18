import {
  getAnnouncementsForParents,
  findMeetingsByChild,
  getEventsForParents,
} from "../../models/parent/announcementModel.js";

const announcementController = {
  async getParentAnnouncements(req, res) {
    try {
      const announcements = await getAnnouncementsForParents();
      res.status(200).json(announcements);
    } catch (error) {
      console.error("Error fetching parent announcements:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async getEvents(req, res) {
    try {
      const events = await getEventsForParents();
      res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching events:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

export const getMeetingsByChild = async (req, res) => {
  try {
    const raw = req.params.childId || req.query.child_id;
    if (!raw)
      return res
        .status(400)
        .json({ success: false, message: "childId is required" });
    const childId = Number(raw);
    if (Number.isNaN(childId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid childId" });

    const meetings = await findMeetingsByChild(childId);
    return res.json({ success: true, data: meetings });
  } catch (err) {
    console.error("getMeetingsByChild error", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: err.message,
      });
  }
};

export default announcementController;
