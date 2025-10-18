import SupervisorPaymentModel from '../../models/supervisor/supervisorPaymentModel.js';

export const getPayments = async (req, res) => {
  try {
    const payments = await SupervisorPaymentModel.findAll(req.query);
    res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: payments
    });
  } catch (error) {
    console.error('Error in getPayments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: error.message
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await SupervisorPaymentModel.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error in getPaymentById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment',
      error: error.message
    });
  }
};

export const createPayment = async (req, res) => {
  try {
    const payment = await SupervisorPaymentModel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error in createPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const payment = await SupervisorPaymentModel.update(req.params.id, req.body);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error in updatePayment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
};

export const getPaymentStats = async (req, res) => {
  try {
    const stats = await SupervisorPaymentModel.getPaymentStats();
    res.status(200).json({
      success: true,
      message: 'Payment statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error in getPaymentStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment statistics',
      error: error.message
    });
  }
};

export const getMonthlyRevenue = async (req, res) => {
  try {
    const revenue = await SupervisorPaymentModel.getMonthlyRevenue();
    res.status(200).json({
      success: true,
      message: 'Monthly revenue retrieved successfully',
      data: revenue
    });
  } catch (error) {
    console.error('Error in getMonthlyRevenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly revenue',
      error: error.message
    });
  }
};
