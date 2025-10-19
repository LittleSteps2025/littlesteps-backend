import SubscriptionModel from '../models/subscriptionModel.js';

export const createSubscription = async (req, res) => {
  try {
    const {
      name,
      type,
      duration,
      days,
      price,
      services,
      status
    } = req.body;

    // Validation
    if (!name || !type || !duration || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate type
    if (!['weekly', 'monthly', 'yearly'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription type'
      });
    }

    // Validate duration
    if (!['full-day', 'half-day', 'morning', 'afternoon', 'custom'].includes(duration)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid duration type'
      });
    }

    // Validate days array
    if (!Array.isArray(days)) {
      return res.status(400).json({
        success: false,
        message: 'Days must be an array'
      });
    }

    // Validate services array
    if (!Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: 'Services must be an array'
      });
    }

    const subscription = await SubscriptionModel.create({
      name,
      type,
      duration,
      days,
      price: Number(price),
      services,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating subscription'
    });
  }
};

export const getSubscriptions = async (req, res) => {
  try {
    console.log('Fetching subscriptions with query:', req.query);
    const { status = 'all' } = req.query;
    
    console.log('About to call SubscriptionModel.findAll');
    const subscriptions = await SubscriptionModel.findAll({ status });
    console.log('Fetched subscriptions:', subscriptions);
    
    res.status(200).json({
      success: true,
      message: 'Subscription plans retrieved successfully',
      data: subscriptions || [] // Ensure we always return an array
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    // Log the full error details
    console.error('Full error:', {
      message: error.message,
      stack: error.stack,
      details: error
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions: ' + error.message
    });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      duration,
      days,
      price,
      services,
      status
    } = req.body;

    // Require at least one field to be updated
    if (!name && !type && !duration && !days && !price && !services && !status) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }

    // For status changes, require other fields to ensure it's coming from the popup
    if (status && Object.keys(req.body).length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Status can only be updated along with other subscription details'
      });
    }

    // Validate type if provided
    if (type && !['weekly', 'monthly', 'yearly'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription type'
      });
    }

    // Validate duration if provided
    if (duration && !['full-day', 'half-day', 'morning', 'afternoon', 'custom'].includes(duration)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid duration type'
      });
    }

    // Validate days array if provided
    if (days && !Array.isArray(days)) {
      return res.status(400).json({
        success: false,
        message: 'Days must be an array'
      });
    }

    // Validate services array if provided
    if (services && !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: 'Services must be an array'
      });
    }

    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be either "active" or "inactive"'
      });
    }

    const subscription = await SubscriptionModel.update(id, {
      name,
      type,
      duration,
      days,
      price: price !== undefined ? Number(price) : undefined,
      services,
      status
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating subscription'
    });
  }
};

export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await SubscriptionModel.delete(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription plan deleted successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting subscription'
    });
  }
};