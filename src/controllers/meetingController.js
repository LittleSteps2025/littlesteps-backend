import meetingModel from '../models/meetingModel.js';

// Get all meetings
export const getAllMeetings = async (req, res) => {
  try {
    const meetings = await meetingModel.findAll();
    
    res.status(200).json({
      success: true,
      data: meetings,
      message: 'Meetings retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve meetings',
      error: error.message
    });
  }
};

// Get meeting by ID
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

// Get meetings by child ID
export const getMeetingsByChildId = async (req, res) => {
  try {
    const { child_id } = req.params;
    const meetings = await meetingModel.findByChildId(child_id);
    
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

// Get meetings by recipient
export const getMeetingsByRecipient = async (req, res) => {
  try {
    const { recipient } = req.params;
    const meetings = await meetingModel.findByRecipient(recipient);
    
    res.status(200).json({
      success: true,
      data: meetings,
      message: 'Recipient meetings retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting meetings by recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recipient meetings',
      error: error.message
    });
  }
};

// Create new meeting
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
    
    // Validate recipient
    if (!['teacher', 'supervisor'].includes(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'Recipient must be either "teacher" or "supervisor"'
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
      message: 'Meeting created successfully'
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

// Update meeting (supervisor can only update date, time, and reason)
export const updateMeeting = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const { meeting_date, meeting_time, reason, response } = req.body;
    
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
      response: response || null
    };
    
    const updatedMeeting = await meetingModel.update(meeting_id, meetingData);
    
    if (!updatedMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedMeeting,
      message: 'Meeting updated successfully'
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

// Update meeting response only
export const updateMeetingResponse = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const { response } = req.body;
    
    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response is required'
      });
    }
    
    const updatedMeeting = await meetingModel.updateResponse(meeting_id, response);
    
    if (!updatedMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedMeeting,
      message: 'Meeting response updated successfully'
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

// Delete meeting
export const deleteMeeting = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const deletedMeeting = await meetingModel.remove(meeting_id);
    
    if (!deletedMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: deletedMeeting,
      message: 'Meeting deleted successfully'
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

// Search meetings with filters
export const searchMeetings = async (req, res) => {
  try {
    const { searchTerm, recipient, response, dateFrom, dateTo } = req.query;
    
    const meetings = await meetingModel.search(searchTerm, recipient, response, dateFrom, dateTo);
    
    res.status(200).json({
      success: true,
      data: meetings,
      message: 'Meetings search completed successfully'
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
