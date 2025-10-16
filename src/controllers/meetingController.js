import meetingModel from '../models/meetingModel.js';

// Get all meetings for supervisor only
export const getAllMeetings = async (req, res) => {
  try {
    const meetings = await meetingModel.findByRecipient('supervisor');
    
    res.status(200).json({
      success: true,
      data: meetings,
      message: 'Supervisor meetings retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting supervisor meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supervisor meetings',
      error: error.message
    });
  }
};

// Get meeting by ID (only if it belongs to supervisor)
export const getMeetingById = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const meeting = await meetingModel.findById(meeting_id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    // Check if meeting belongs to supervisor
    if (meeting.recipient !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This meeting does not belong to supervisor'
      });
    }
    
    res.status(200).json({
      success: true,
      data: meeting,
      message: 'Meeting retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting meeting by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve meeting',
      error: error.message
    });
  }
};

// Get meetings by child ID (only supervisor meetings)
export const getMeetingsByChildId = async (req, res) => {
  try {
    const { child_id } = req.params;
    const meetings = await meetingModel.findByChildIdAndRecipient(child_id, 'supervisor');
    
    res.status(200).json({
      success: true,
      data: meetings,
      message: 'Child meetings retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting meetings by child ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve child meetings',
      error: error.message
    });
  }
};

// Get meetings by recipient (only supervisor can access supervisor meetings)
export const getMeetingsByRecipient = async (req, res) => {
  try {
    const { recipient } = req.params;
    
    // Only allow supervisor to access supervisor meetings
    if (recipient !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only retrieve supervisor meetings'
      });
    }
    
    const meetings = await meetingModel.findByRecipient(recipient);
    
    res.status(200).json({
      success: true,
      data: meetings,
      message: 'Supervisor meetings retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting meetings by recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supervisor meetings',
      error: error.message
    });
  }
};

// Create new meeting (only for supervisor)
export const createMeeting = async (req, res) => {
  try {
    const { child_id, recipient, meeting_date, meeting_time, reason, response } = req.body;
    
    // Validate required fields
    if (!child_id || !recipient || !meeting_date || !meeting_time || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: child_id, recipient, meeting_date, meeting_time, reason'
      });
    }
    
    // Validate recipient - only allow supervisor meetings
    if (recipient !== 'supervisor') {
      return res.status(400).json({
        success: false,
        message: 'Recipient must be "supervisor"'
      });
    }
    
    const meetingData = {
      child_id,
      recipient,
      meeting_date,
      meeting_time,
      reason,
      response: response || null
    };
    
    const newMeeting = await meetingModel.create(meetingData);
    
    res.status(201).json({
      success: true,
      data: newMeeting,
      message: 'Supervisor meeting created successfully'
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting',
      error: error.message
    });
  }
};

// Update meeting (supervisor can only update supervisor meetings)
export const updateMeeting = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const { meeting_date, meeting_time, reason, response } = req.body;
    
    // First check if meeting exists and belongs to supervisor
    const existingMeeting = await meetingModel.findById(meeting_id);
    if (!existingMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    if (existingMeeting.recipient !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only update supervisor meetings'
      });
    }
    
    // Validate required fields
    if (!meeting_date || !meeting_time || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: meeting_date, meeting_time, reason'
      });
    }
    
    const meetingData = {
      meeting_date,
      meeting_time,
      reason,
      response: response || existingMeeting.response
    };
    
    const updatedMeeting = await meetingModel.update(meeting_id, meetingData);
    
    res.status(200).json({
      success: true,
      data: updatedMeeting,
      message: 'Supervisor meeting updated successfully'
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      error: error.message
    });
  }
};

// Reschedule meeting (only date and time)
export const rescheduleMeeting = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const { meeting_date, meeting_time, response } = req.body;
    
    // First check if meeting exists and belongs to supervisor
    const existingMeeting = await meetingModel.findById(meeting_id);
    if (!existingMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    if (existingMeeting.recipient !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only reschedule supervisor meetings'
      });
    }
    
    // Validate required fields for rescheduling
    if (!meeting_date || !meeting_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: meeting_date, meeting_time'
      });
    }
    
    const updatedMeeting = await meetingModel.reschedule(meeting_id, meeting_date, meeting_time, response);
    
    res.status(200).json({
      success: true,
      data: updatedMeeting,
      message: 'Supervisor meeting rescheduled successfully'
    });
  } catch (error) {
    console.error('Error rescheduling meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule meeting',
      error: error.message
    });
  }
};

// Update meeting response only (for supervisor meetings)
export const updateMeetingResponse = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const { response } = req.body;
    
    // Validate response field exists (can be empty string for deletion)
    if (response === undefined || response === null) {
      return res.status(400).json({
        success: false,
        message: 'Response field is required'
      });
    }
    
    // First check if meeting exists and belongs to supervisor
    const existingMeeting = await meetingModel.findById(meeting_id);
    if (!existingMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    if (existingMeeting.recipient !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only update supervisor meetings'
      });
    }
    
    // Allow empty string for deletion, trim non-empty responses
    const cleanResponse = response && typeof response === 'string' ? response.trim() : '';
    const updatedMeeting = await meetingModel.updateResponse(meeting_id, cleanResponse || null);
    
    if (!updatedMeeting) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update meeting response in database'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedMeeting,
      message: cleanResponse ? 'Meeting response updated successfully' : 'Meeting response deleted successfully'
    });
  } catch (error) {
    console.error('Error updating meeting response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting response',
      error: error.message
    });
  }
};

// Delete meeting (only supervisor meetings)
export const deleteMeeting = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    
    // First check if meeting exists and belongs to supervisor
    const existingMeeting = await meetingModel.findById(meeting_id);
    if (!existingMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    if (existingMeeting.recipient !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only delete supervisor meetings'
      });
    }
    
    const deletedMeeting = await meetingModel.remove(meeting_id);
    
    res.status(200).json({
      success: true,
      data: deletedMeeting,
      message: 'Supervisor meeting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meeting',
      error: error.message
    });
  }
};

// Search meetings with filters (only supervisor meetings)
export const searchMeetings = async (req, res) => {
  try {
    const { searchTerm, response, dateFrom, dateTo } = req.query;
    
    // Only search for supervisor meetings
    const meetings = await meetingModel.searchSupervisorMeetings(searchTerm, response, dateFrom, dateTo);
    
    res.status(200).json({
      success: true,
      data: meetings,
      message: 'Supervisor meetings search completed successfully'
    });
  } catch (error) {
    console.error('Error searching meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search meetings',
      error: error.message
    });
  }
};