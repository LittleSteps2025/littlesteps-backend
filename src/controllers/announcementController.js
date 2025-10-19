
import * as AnnouncementModel from '../models/announcementModel.js';

// Create a new announcement or event
export const create = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Content-Type:', req.get('Content-Type'));

    const { title, details, status, audience, date, time, attachment, type, topic, venue } = req.body;

    // Get user_id from authenticated user context
    const userIdNum = req.user?.user_id || 14; // Fallback for development

    // Check if this is an event or announcement
    if (type === 'event') {
      // Import event model
      const eventModule = await import('../models/eventModel.js');
      const eventModel = eventModule.default;
      
      // Validate event required fields
      if (!title || !details || !date || !time) {
        return res.status(400).json({
          status: 400,
          message: 'Missing required fields for event: title, details, date, and time are required'
        });
      }

      const eventData = {
        user_id: userIdNum,
        topic: topic || title,
        description: details,
        venue: venue || '',
        date,
        time,
        image: attachment || null
      };

      console.log('Event data:', eventData);
      const event = await eventModel.create(eventData);
      
      return res.status(201).json({
        status: 201,
        message: 'Event created successfully',
        data: {
          ann_id: `event_${event.event_id}`,
          event_id: event.event_id,
          title: event.topic,
          details: event.description,
          topic: event.topic,
          venue: event.venue,
          date: event.date,
          time: event.time,
          type: 'event',
          created_at: event.created_time,
          attachment: event.image,
          user_id: event.user_id
        }
      });
    } else {
      // Handle announcement creation (existing logic)
      // Validate required fields
      if (!title || !details || !audience) {
        return res.status(400).json({
          status: 400,
          message: 'Missing required fields: title, details, and audience are required'
        });
      }

      // Convert audience to number if it's a string
      const audienceNum = Number(audience);

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
      
      return res.status(201).json({
        status: 201,
        message: 'Announcement created successfully',
        data: {
          ...announcement,
          type: 'announcement'
        }
      });
    }
  } catch (error) {
    console.error('Full error object:', error);
    console.error('Error stack:', error.stack);
    console.error('Create announcement/event error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to create announcement/event',
      error: error.message
    });
  }
};

// Get all announcements and events
export const getAll = async (req, res) => {
  try {
    // Import event model dynamically
    const eventModule = await import('../models/eventModel.js');
    const eventModel = eventModule.default;
    
    // Fetch both announcements and events
    const announcements = await AnnouncementModel.getAllAnnouncements();
    const events = await eventModel.getAll();
    
    // Map announcements with type field
    const mappedAnnouncements = announcements.map(ann => ({
      ann_id: ann.ann_id,
      title: ann.title,
      details: ann.details,
      date: ann.date,
      time: ann.time,
      audience: ann.audience,
      status: ann.status,
      type: 'announcement',
      created_at: ann.created_at,
      updated_at: ann.updated_at,
      attachment: ann.attachment,
      session_id: ann.session_id,
      user_id: ann.user_id,
      published_by: ann.published_by
    }));
    
    // Map events with type field (use event_id as ann_id for consistency)
    const mappedEvents = events.map(evt => ({
      ann_id: `event_${evt.event_id}`, // Prefix to avoid ID conflicts
      event_id: evt.event_id,
      title: evt.topic || evt.description?.substring(0, 50),
      details: evt.description,
      topic: evt.topic,
      venue: evt.venue,
      date: evt.date,
      time: evt.time,
      audience: 1, // Default to 'All' for events
      status: 'published',
      type: 'event',
      created_at: evt.created_time,
      updated_at: evt.created_time,
      attachment: evt.image,
      session_id: null,
      user_id: evt.user_id,
      published_by: null
    }));
    
    // Combine and sort by created_at
    const combined = [...mappedAnnouncements, ...mappedEvents].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    res.status(200).json({
      status: 200,
      message: 'Announcements and events fetched successfully',
      data: combined
    });
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to fetch announcements and events',
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

// Update an announcement or event by ID
export const update = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Update request body:', req.body);
    console.log('Update announcement ID:', req.params.ann_id);

    const { title, details, status, audience, time, date, attachment, type, topic, venue } = req.body;
    const itemId = req.params.ann_id;

    // Check if this is an event (ID starts with 'event_' or type is 'event')
    if (itemId.startsWith('event_') || type === 'event') {
      // Import event model
      const eventModule = await import('../models/eventModel.js');
      const eventModel = eventModule.default;
      
      // Extract actual event_id
      const eventId = itemId.startsWith('event_') ? itemId.replace('event_', '') : itemId;
      
      // Validate event required fields
      if (!title || !details) {
        return res.status(400).json({
          status: 400,
          message: 'Missing required fields for event: title and details are required'
        });
      }

      const eventUpdateData = {
        topic: topic || title,
        description: details,
        venue: venue || '',
        date: date || null,
        time: time || null,
        image: attachment || null
      };

      console.log('Event update data:', eventUpdateData);
      const updated = await eventModel.update(eventId, eventUpdateData);

      if (!updated) {
        return res.status(404).json({
          status: 404,
          message: 'Event not found'
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Event updated successfully',
        data: {
          ann_id: `event_${updated.event_id}`,
          event_id: updated.event_id,
          title: updated.topic,
          details: updated.description,
          topic: updated.topic,
          venue: updated.venue,
          date: updated.date,
          time: updated.time,
          type: 'event',
          attachment: updated.image
        }
      });
    } else {
      // Handle announcement update (existing logic)
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

      const updated = await AnnouncementModel.updateAnnouncement(itemId, updateData);

      if (!updated) {
        return res.status(404).json({
          status: 404,
          message: 'Announcement not found'
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Announcement updated successfully',
        data: {
          ...updated,
          type: 'announcement'
        }
      });
      
//       res.status(201).json(newAnnouncement);
//     } catch (error) {
//       next(error);
    }
  } catch (error) {
    console.error('Full error object:', error);
    console.error('Error stack:', error.stack);
    console.error('Update announcement/event error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to update announcement/event',
      error: error.message
    });

  }
};

// Delete an announcement or event by ID
export const remove = async (req, res) => {
  try {
    const itemId = req.params.ann_id;
    
    // Check if this is an event (ID starts with 'event_')
    if (itemId.startsWith('event_')) {
      // Import event model
      const eventModule = await import('../models/eventModel.js');
      const eventModel = eventModule.default;
      
      // Extract actual event_id
      const eventId = itemId.replace('event_', '');
      
      const deleted = await eventModel.delete(eventId);
      if (!deleted) {
        return res.status(404).json({
          status: 404,
          message: 'Event not found'
        });
      }
      
      return res.status(200).json({
        status: 200,
        message: 'Event deleted successfully',
        data: deleted
      });
    } else {
      // Handle announcement deletion (existing logic)
      const deleted = await AnnouncementModel.deleteAnnouncement(itemId);
      if (!deleted) {
        return res.status(404).json({
          status: 404,
          message: 'Announcement not found'
        });
      }
      
      return res.status(200).json({
        status: 200,
        message: 'Announcement deleted successfully',
        data: deleted
      });
    }
  } catch (error) {
    console.error('Delete announcement/event error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to delete announcement/event',
      error: error.message
    });
  }
};
