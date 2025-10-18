import * as AdminPaymentModel from '../../models/payment/adminPaymentModel.js';

// Get all payments (admin endpoint)
export const getAllPayments = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      parent_email: req.query.parent_email,
      child_id: req.query.child_id,
      order_id: req.query.order_id
    };

    const payments = await AdminPaymentModel.getAllPayments(filters);

    res.status(200).json({
      success: true,
      message: "Payments retrieved successfully",
      data: payments
    });
  } catch (err) {
    console.error('Error in getAllPayments:', err);
    res.status(500).json({
      success: false,
      message: "Error retrieving payments",
      error: err.message
    });
  }
};

// Get payment by ID (admin endpoint)
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await AdminPaymentModel.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment retrieved successfully",
      data: payment
    });
  } catch (err) {
    console.error('Error in getPaymentById:', err);
    res.status(500).json({
      success: false,
      message: "Error retrieving payment",
      error: err.message
    });
  }
};

// Get payment statistics (admin endpoint)
export const getPaymentStats = async (req, res) => {
  try {
    const stats = await AdminPaymentModel.getPaymentStats();

    res.status(200).json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: stats
    });
  } catch (err) {
    console.error('Error in getPaymentStats:', err);
    res.status(500).json({
      success: false,
      message: "Error retrieving payment statistics",
      error: err.message
    });
  }
};

// Update payment status (admin endpoint)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'pending', 'completed', or 'failed'"
      });
    }

    const payment = await AdminPaymentModel.updatePaymentStatus(id, status);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: payment
    });
  } catch (err) {
    console.error('Error in updatePaymentStatus:', err);
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: err.message
    });
  }
};