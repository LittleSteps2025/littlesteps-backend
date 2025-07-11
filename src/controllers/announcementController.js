import * as AnnouncementModel from '../models/announcementModel.js';

// Create a new announcement
export const create = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    
    const { title, details, status, audience, date, user_id } = req.body;

    // Validate required fields
    if (!title || !details || !audience) {
      return res.status(400).json({
        status: 400,
        message: 'Missing required fields: title, details, and audience are required'
      });
    }

    // Convert audience to number if it's a string
    const audienceNum = Number(audience);
    
    // Convert user_id to number if it's a string
    const userIdNum = user_id ? Number(user_id) : (req.user?.user_id || 1);

    const announcementData = {
      title,
      details,
      status: status || 'draft',
      audience: audienceNum,
      user_id: userIdNum,
      date: date || new Date().toISOString().split('T')[0],
      session_id: null,
      time: null,
      attachment: null // Handle file uploads separately if needed
    };

    console.log('Announcement data:', announcementData); // Debug log

    const announcement = await AnnouncementModel.createAnnouncement(announcementData);
    
    res.status(201).json({
      status: 201,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to create announcement',
      error: error.message
    });
  }
};

// Get all announcements
export const getAll = async (req, res) => {
  try {
    const announcements = await AnnouncementModel.getAllAnnouncements();
    res.status(200).json({
      status: 200,
      message: 'Announcements fetched successfully',
      data: announcements
    });
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
};

// Get a single announcement by ID
export const getById = async (req, res) => {
  try {
    const announcement = await AnnouncementModel.getAnnouncementById(req.params.ann_id);
    if (!announcement) {
      return res.status(404).json({
        status: 404,
        message: 'Announcement not found'
      });
    }
    res.status(200).json({
      status: 200,
      message: 'Announcement fetched successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Get announcement by ID error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to fetch announcement',
      error: error.message
    });
  }
};

// Update an announcement by ID
export const update = async (req, res) => {
  try {
    console.log('Update request body:', req.body); // Debug log
    console.log('Update announcement ID:', req.params.ann_id); // Debug log
    
    const { title, details, status, audience } = req.body;

    // Validate required fields
    if (!title || !details || !audience) {
      return res.status(400).json({
        status: 400,
        message: 'Missing required fields: title, details, and audience are required'
      });
    }

    // Convert audience to number if it's a string
    const audienceNum = Number(audience);

    const updateData = {
      title,
      details,
      status: status || 'draft',
      audience: audienceNum,
      time: null,
      attachment: null // Handle file uploads separately if needed
    };

    console.log('Update data:', updateData); // Debug log

    const updated = await AnnouncementModel.updateAnnouncement(req.params.ann_id, updateData);
    
    if (!updated) {
      return res.status(404).json({
        status: 404,
        message: 'Announcement not found'
      });
    }
    
    res.status(200).json({
      status: 200,
      message: 'Announcement updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to update announcement',
      error: error.message
    });
  }
};

// Delete an announcement by ID
export const remove = async (req, res) => {
  try {
    const deleted = await AnnouncementModel.deleteAnnouncement(req.params.ann_id);
    if (!deleted) {
      return res.status(404).json({
        status: 404,
        message: 'Announcement not found'
      });
    }
    res.status(200).json({
      status: 200,
      message: 'Announcement deleted successfully',
      data: deleted
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to delete announcement',
      error: error.message
    });
  }
};