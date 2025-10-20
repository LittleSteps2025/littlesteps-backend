import express from 'express';
import {
  createSubscription,
  getSubscriptions,
  updateSubscription,
  deleteSubscription
} from '../controllers/subscriptionController.js';

const router = express.Router();

// Subscription routes
router.post('/', createSubscription);
router.get('/', getSubscriptions);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);

export default router;