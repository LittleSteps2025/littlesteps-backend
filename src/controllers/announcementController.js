import * as AnnouncementModel from '../models/announcementModel.js';

// Create a new announcement
export const create = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Content-Type:', req.get('Content-Type'));

    const { title, details, status, audience, date, time, attachment } = req.body;

    // Validate required fields
    if (!title || !details || !audience) {
      return res.status(400).json({
        status: 400,
        message: 'Missing required fields: title, details, and audience are required'
      });
    }

    // Convert audience to number if it's a string
    const audienceNum = Number(audience);

    // Get user_id from authenticated user context
    const userIdNum = req.user?.user_id || 14; // Fallback for development

    // Accept null values for date and time
    const announcementDate = date || null;
    const announcementTime = time || null;
    const announcementAttachment = attachment || null;

    const announcementData = {
      title,
      details,
      status: status || 'draft',
      audience: audienceNum,
      user_id: userIdNum,
      date: announcementDate,
      session_id: null,
      time: announcementTime,
      attachment: announcementAttachment
    };

    console.log('Announcement data:', announcementData);

    const announcement = await AnnouncementModel.createAnnouncement(announcementData);
    
    res.status(201).json({
      status: 201,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Full error object:', error);
    console.error('Error stack:', error.stack);
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
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Update request body:', req.body);
    console.log('Update announcement ID:', req.params.ann_id);

    const { title, details, status, audience, time, attachment } = req.body;

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
      time: time || null,
      attachment: attachment || null
    };

    console.log('Update data:', updateData);

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
    console.error('Full error object:', error);
    console.error('Error stack:', error.stack);
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