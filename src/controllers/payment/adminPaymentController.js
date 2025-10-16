import * as PaymentModel from '../../models/payment/paymentModel.js';

// Get all payments (admin endpoint)
export const getAllPayments = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      method: req.query.method,
      parent_id: req.query.parent_id,
      child_id: req.query.child_id,
      package_id: req.query.package_id,
      order_id: req.query.order_id,
      transaction_ref: req.query.transaction_ref
    };

    const payments = await PaymentModel.getAllPayments(filters);

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

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await PaymentModel.getPaymentById(id);

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