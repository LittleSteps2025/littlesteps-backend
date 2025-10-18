
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
// 
// import announcementModel from '../models/announcementModel.js';

// const announcementController = {
//   // Get all announcements
//   async getAll(req, res, next) {
//     try {
//       const announcements = await announcementModel.getAll();
//       res.json(announcements);
//     } catch (error) {
//       next(error);
//     }
//   },

//   // Get single announcement
//   async getOne(req, res, next) {
//     try {
//       const { id } = req.params;
//       const announcement = await announcementModel.getById(id);
      
//       if (!announcement) {
//         return res.status(404).json({ message: 'Announcement not found' });
//       }
      
//       res.json(announcement);
//     } catch (error) {
//       next(error);
//     }
//   },

//   // Create announcement
//   async create(req, res, next) {
//     try {
//       const { 
//         title, 
//         date = new Date().toISOString().split('T')[0],
//         time = new Date().toTimeString().split(' ')[0],
//         details, 
//         attachment, 
//         audience, 
//         user_id 
//       } = req.body;
      
//       // Get session_id from authenticated user if supervisor
//       const session_id = req.user?.role === 'supervisor' ? req.user.session_id : null;
  
//       if (!title || !details || !audience || !user_id) {
//         return res.status(400).json({ 
//           message: 'Title, details, audience, and user_id are required' 
//         });
//       }
  
//       const newAnnouncement = await announcementModel.create({ 
//         title, 
//         date,
//         time,
//         details, 
//         attachment, 
//         audience, 
//         session_id, // Pass the session_id
//         user_id 
// >>>>>>> dev-web
      });
      
//       res.status(201).json(newAnnouncement);
//     } catch (error) {
//       next(error);
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
// 
//   },

//   // Update announcement
//   async update(req, res, next) {
//     try {
//       const { id } = req.params;
//       const { 
//         title, 
//         date, 
//         time, 
//         details, 
//         attachment, 
//         audience, 
//         session_id 
//       } = req.body;

//       if (!title || !details || !audience) {
//         return res.status(400).json({ 
//           message: 'Title, details, and audience are required' 
//         });
//       }

//       // Pass undefined for date/time if not present, so model uses current
//       const updatedAnnouncement = await announcementModel.update(id, { 
//         title, 
//         date: date || undefined,
//         time: time || undefined,
//         details, 
//         attachment, 
//         audience, 
//         session_id 
// >>>>>>> dev-web
      });
    }
      
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

export default announcementController;
