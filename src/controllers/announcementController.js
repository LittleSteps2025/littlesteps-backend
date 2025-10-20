import * as AnnouncementModel from "../models/announcementModel.js";

// Create a new announcement or event
export const create = async (req, res) => {
  try {
    console.log("Request body:", req.body); // ✅ Add this
    console.log("Request files:", req.files); // ✅ Add this
    console.log("Content-Type:", req.get("Content-Type")); // ✅ Add this

    // Your existing code below:
    const { title, details, status, audience, date, time, type, topic, venue, attachment } = req.body;

    // Validate required fields
    if (!title || !details || !audience) {
      return res.status(400).json({
        status: 400,
        message:
          "Missing required fields: title, details, and audience are required",
      });
    }

    // Convert audience to number if it's a string
    const audienceNum = Number(audience);

    // Always get user_id from authenticated user context
    const userIdNum = req.user?.user_id || 14; // Use 1 as a fallback for development

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

      // Use provided date or default to today's date in YYYY-MM-DD format
      const announcementDate = date || new Date().toISOString().split('T')[0];
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
      
      // Ensure date is returned in YYYY-MM-DD format
      const responseData = {
        ...announcement,
        date: announcement.date instanceof Date 
          ? announcement.date.toISOString().split('T')[0] 
          : announcement.date,
        type: 'announcement'
      };
      
      return res.status(201).json({
        status: 201,
        message: 'Announcement created successfully',
        data: responseData
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
    console.log('=== Starting getAll announcements ===');
    
    // Fetch announcements
    const announcements = await AnnouncementModel.getAllAnnouncements();
    console.log(`Fetched ${announcements.length} announcements`);
    
    // Debug: Log first announcement to check audience value
    if (announcements.length > 0) {
      console.log('Sample announcement:', JSON.stringify(announcements[0], null, 2));
    }
    
    // Map announcements with type field
    const mappedAnnouncements = announcements.map(ann => ({
      ann_id: ann.ann_id,
      title: ann.title,
      details: ann.details,
      date: ann.date,
      time: ann.time,
      audience: parseInt(ann.audience, 10), // Convert to integer (1, 2, or 3)
      status: ann.status,
      type: 'announcement',
      created_at: ann.created_at,
      updated_at: ann.updated_at,
      attachment: ann.attachment,
      session_id: ann.session_id,
      user_id: ann.user_id,
      published_by: ann.published_by
    }));
    
    // Try to fetch events, but don't fail if event model has issues
    let mappedEvents = [];
    try {
      const eventModule = await import('../models/eventModel.js');
      const eventModel = eventModule.default;
      const events = await eventModel.getAll();
      console.log(`Fetched ${events.length} events`);
      
      // Map events with type field (use event_id as ann_id for consistency)
      mappedEvents = events.map(evt => ({
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
    } catch (eventError) {
      console.error('Error fetching events (continuing without them):', eventError.message);
    }
    
    // Combine and sort by created_at
    const combined = [...mappedAnnouncements, ...mappedEvents].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    console.log(`Returning ${combined.length} total items`);
    
    res.status(200).json({
      status: 200,
      message: 'Announcements and events fetched successfully',
      data: combined
    });
  } catch (error) {
    console.error("Get all announcements error:", error);
    console.error("Error stack:", error.stack);
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
    const announcement = await AnnouncementModel.getAnnouncementById(
      req.params.ann_id
    );
    if (!announcement) {
      return res.status(404).json({
        status: 404,
        message: "Announcement not found",
      });
    }
    res.status(200).json({
      status: 200,
      message: "Announcement fetched successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Get announcement by ID error:", error);
    res.status(500).json({
      status: 500,
      message: "Failed to fetch announcement",
      error: error.message,
    });
  }
};

// Update an announcement or event by ID
export const update = async (req, res) => {
  try {
    console.log("Request body:", req.body); // ✅ Add this
    console.log("Request files:", req.files); // ✅ Add this
    console.log("Content-Type:", req.get("Content-Type")); // ✅ Add this
    console.log("Update request body:", req.body); // Your existing log
    console.log("Update announcement ID:", req.params.ann_id); // Your existing log

    const { title, details, status, audience, time } = req.body;

    // Validate required fields
    if (!title || !details || !audience) {
      return res.status(400).json({
        status: 400,
        message:
          "Missing required fields: title, details, and audience are required",
      });
    }

    // Convert audience to number if it's a string
    const audienceNum = Number(audience);

    const updateData = {
      title,
      details,
      status: status || "draft",
      audience: audienceNum,
      time: time || null,
      attachment: null, // Handle file uploads separately if needed
    };

    console.log("Update data:", updateData); // Debug log

    const updated = await AnnouncementModel.updateAnnouncement(
      req.params.ann_id,
      updateData
    );

    if (!updated) {
      return res.status(404).json({
        status: 404,
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Announcement updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Full error object:", error); // ✅ Add this
    console.error("Error stack:", error.stack); // ✅ Add this
    console.error("Update announcement error:", error); // Your existing log
    res.status(500).json({
      status: 500,
      message: "Failed to update announcement",
      error: error.message,
    });
  }
};

// Delete an announcement by ID
export const remove = async (req, res) => {
  try {
    const deleted = await AnnouncementModel.deleteAnnouncement(
      req.params.ann_id
    );
    if (!deleted) {
      return res.status(404).json({
        status: 404,
        message: "Announcement not found",
      });
    }
    res.status(200).json({
      status: 200,
      message: "Announcement deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({
      status: 500,
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};