
import announcementModel from '../models/announcementModel.js';

const announcementController = {
  // Get all announcements
  async getAll(req, res, next) {
    try {
      const announcements = await announcementModel.getAll();
      res.json(announcements);
    } catch (error) {
      next(error);
    }
  },

  // Get single announcement
  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const announcement = await announcementModel.getById(id);
      
      if (!announcement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
      
      res.json(announcement);
    } catch (error) {
      next(error);
    }
  },

  // Create announcement
  async create(req, res, next) {
    try {
      const { 
        title, 
        date = new Date().toISOString().split('T')[0],
        time = new Date().toTimeString().split(' ')[0],
        details, 
        attachment, 
        audience, 
        user_id 
      } = req.body;
      
      // Get session_id from authenticated user if supervisor
      const session_id = req.user?.role === 'supervisor' ? req.user.session_id : null;
  
      if (!title || !details || !audience || !user_id) {
        return res.status(400).json({ 
          message: 'Title, details, audience, and user_id are required' 
        });
      }
  
      const newAnnouncement = await announcementModel.create({ 
        title, 
        date,
        time,
        details, 
        attachment, 
        audience, 
        session_id, // Pass the session_id
        user_id 
      });
      
      res.status(201).json(newAnnouncement);
    } catch (error) {
      next(error);
    }
  },

  // Update announcement
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        title, 
        date, 
        time, 
        details, 
        attachment, 
        audience, 
        session_id 
      } = req.body;

      if (!title || !details || !audience) {
        return res.status(400).json({ 
          message: 'Title, details, and audience are required' 
        });
      }

      // Pass undefined for date/time if not present, so model uses current
      const updatedAnnouncement = await announcementModel.update(id, { 
        title, 
        date: date || undefined,
        time: time || undefined,
        details, 
        attachment, 
        audience, 
        session_id 
      });
      
      if (!updatedAnnouncement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }

      res.json(updatedAnnouncement);
    } catch (error) {
      next(error);
    }
  },

  // Delete announcement
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deletedAnnouncement = await announcementModel.delete(id);
      
      if (!deletedAnnouncement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }

      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

export default announcementController;

