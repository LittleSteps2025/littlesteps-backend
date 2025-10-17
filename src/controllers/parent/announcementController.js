import { getAnnouncementsForParents } from '../../models/parent/announcementModel.js';

const announcementController = {
  async getParentAnnouncements(req, res) {
    try {
      const announcements = await getAnnouncementsForParents();
      res.status(200).json(announcements);
    } catch (error) {
      console.error('Error fetching parent announcements:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export default announcementController;
