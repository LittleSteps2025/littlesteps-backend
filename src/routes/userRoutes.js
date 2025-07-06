import express from 'express';
import {
  checkEmail,
  verifyToken,
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import validateUser from '../middlewares/inputValidator.js';

const router = express.Router();

// Email verification routes
router.post('/check-email/', checkEmail);
router.post('/verify-token', verifyToken);

// User CRUD routes
router.post('/users', validateUser, createUser);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
// Note: Using email as parameter for updates, make sure this matches your needs
router.put('/users/:email', updateUser); // Removed validateUser middleware as validation is done in controller
router.delete('/users/:id', deleteUser);

export default router;