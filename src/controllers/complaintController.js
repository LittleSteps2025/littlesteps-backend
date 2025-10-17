import complaintModel from '../models/complaintModel.js';

// Get all complaints
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await complaintModel.findAll();
    
    res.status(200).json({
      success: true,
      data: complaints,
      message: 'Complaints retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints',
      error: error.message
    });
  }
};

// Get complaint by ID
export const getComplaintById = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const complaint = await complaintModel.findById(complaint_id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: complaint,
      message: 'Complaint retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting complaint by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint',
      error: error.message
    });
  }
};

// Get complaints by child ID
export const getComplaintsByChildId = async (req, res) => {
  try {
    const { child_id } = req.params;
    const complaints = await complaintModel.findByChildId(child_id);
    
    res.status(200).json({
      success: true,
      data: complaints,
      message: 'Child complaints retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting complaints by child ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve child complaints',
      error: error.message
    });
  }
};

// Get complaints by recipient
export const getComplaintsByRecipient = async (req, res) => {
  try {
    const { recipient } = req.params;
    const complaints = await complaintModel.findByRecipient(recipient);
    
    res.status(200).json({
      success: true,
      data: complaints,
      message: 'Recipient complaints retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting complaints by recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recipient complaints',
      error: error.message
    });
  }
};

// Create new complaint
export const createComplaint = async (req, res) => {
  try {
    const { date, subject, recipient, description, status, action, child_id } = req.body;
    
    // Validate required fields
    if (!date || !subject || !recipient || !description || !child_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: date, subject, recipient, description, child_id'
      });
    }
    
    // Validate recipient
    if (!['teacher', 'supervisor'].includes(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'Recipient must be either "teacher" or "supervisor"'
      });
    }
    
    const complaintData = {
      date,
      subject,
      recipient,
      description,
      status: status || 'Pending',
      action: action || null,
      child_id
    };
    
    const newComplaint = await complaintModel.create(complaintData);
    
    res.status(201).json({
      success: true,
      data: newComplaint,
      message: 'Complaint created successfully'
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create complaint',
      error: error.message
    });
  }
};

// Update complaint
export const updateComplaint = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const { date, subject, recipient, description, status, action } = req.body;
    
    // Validate required fields
    if (!date || !subject || !recipient || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: date, subject, recipient, description'
      });
    }
    
    const complaintData = {
      date,
      subject,
      recipient,
      description,
      status: status || 'Pending',
      action: action || null
    };
    
    const updatedComplaint = await complaintModel.update(complaint_id, complaintData);
    
    if (!updatedComplaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedComplaint,
      message: 'Complaint updated successfully'
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint',
      error: error.message
    });
  }
};

// Update complaint status only
export const updateComplaintStatus = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const { status } = req.body;
    
    console.log(`Received status update request for complaint ${complaint_id}:`, { status });
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const updatedComplaint = await complaintModel.updateStatus(complaint_id, status);
    
    if (!updatedComplaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    console.log(`Status updated successfully for complaint ${complaint_id}`);
    
    res.status(200).json({
      success: true,
      data: updatedComplaint,
      message: 'Complaint status updated successfully'
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status',
      error: error.message
    });
  }
};

// Update complaint action only
export const updateComplaintAction = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const { action } = req.body;
    
    console.log(`Received action update request for complaint ${complaint_id}:`, { action });
    
    // Allow empty action (to clear it)
    if (action === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Action field is required (can be empty string)'
      });
    }
    
    const updatedComplaint = await complaintModel.updateAction(complaint_id, action);
    
    if (!updatedComplaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    console.log(`Action updated successfully for complaint ${complaint_id}`);
    
    res.status(200).json({
      success: true,
      data: updatedComplaint,
      message: 'Complaint action updated successfully'
    });
  } catch (error) {
    console.error('Error updating complaint action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint action',
      error: error.message
    });
  }
};

// Delete complaint
export const deleteComplaint = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const deletedComplaint = await complaintModel.remove(complaint_id);
    
    if (!deletedComplaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: deletedComplaint,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint',
      error: error.message
    });
  }
};

// Search complaints with filters
export const searchComplaints = async (req, res) => {
  try {
    const { searchTerm, recipient, status, dateFrom, dateTo } = req.query;
    
    const complaints = await complaintModel.search(searchTerm, recipient, status, dateFrom, dateTo);
    
    res.status(200).json({
      success: true,
      data: complaints,
      message: 'Complaints search completed successfully'
    });
  } catch (error) {
    console.error('Error searching complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search complaints',
      error: error.message
    });
  }
};
