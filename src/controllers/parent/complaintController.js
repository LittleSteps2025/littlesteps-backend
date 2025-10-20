import ComplaintModel from '../../models/parent/complaintModel.js';
import ChildModel from '../../models/teacher/childModel.js';

export const getComplaints = async (req, res) => {
  try {
    console.log('getComplaints called with query:', req.query);
    console.log('Request headers:', req.headers);
    
    const {
      status,
      child_id,
      date_from,
      date_to
    } = req.query;

    const filters = {
      status: status || 'all',
      child_id: child_id || undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined
    };

    console.log('Fetching complaints with filters:', filters);
    const complaints = await ComplaintModel.findAll(filters);
    console.log('Found complaints:', complaints);

    res.status(200).json({
      success: true,
      message: 'Complaints retrieved successfully',
      data: complaints
    });
  } catch (error) {
    console.error('Error in getComplaints:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving complaints',
      error: error.message
    });
  }
};

export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await ComplaintModel.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint retrieved successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error in getComplaintById:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving complaint',
      error: error.message
    });
  }
};

export const createComplaint = async (req, res) => {
  try {
    const {
      child_id,
      subject,
      recipient,
      description,
      date
    } = req.body;

    // Validation
    if (!child_id || !subject || !recipient || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate child_id
    const child = await ChildModel.getChildById(Number(child_id));
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Create complaint
    const complaint = await ComplaintModel.create({
      child_id: Number(child_id),
      subject,
      recipient,
      description,
      date: date || new Date(),
      status: 'Pending'  // Updated to match status enum
    });

    res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error in createComplaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating complaint',
      error: error.message
    });
  }
};

export const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate status if provided
    if (updates.status && !['Pending', 'Investigating', 'Solved'].includes(updates.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be "Pending", "Investigating", or "Solved"'
      });
    }

    // If solving complaint, require action text
    if (updates.status === 'Solved' && !updates.action) {
      return res.status(400).json({
        success: false,
        message: 'Resolution details are required when solving a complaint'
      });
    }

    const complaint = await ComplaintModel.update(id, updates);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error in updateComplaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating complaint',
      error: error.message
    });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await ComplaintModel.delete(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error in deleteComplaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting complaint',
      error: error.message
    });
  }
};

export const getComplaintStats = async (req, res) => {
  try {
    const stats = await ComplaintModel.getComplaintStats();
    
    res.status(200).json({
      success: true,
      message: 'Complaint statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error in getComplaintStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving complaint statistics',
      error: error.message
    });
  }
};