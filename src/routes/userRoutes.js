import express from 'express';
import {
  checkEmail,
  verifyToken,
  createUser,
  getUserById,
  getAllUsers,
  getAllUsersRaw, // Importing the new controller function
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import validateUser from '../middlewares/inputValidator.js';


const router = express.Router();

// Email verification routes
router.post('/check-email/', checkEmail);
router.post('/verify-token', verifyToken);

// User CRUD routes
router.post('/getEveryone', getAllUsersRaw); // Using validateUser middleware for signup
router.post('/users', validateUser, createUser);
router.get('/users', getAllUsers);
router.get('/users/raw', getAllUsersRaw); // Added raw users route
router.get('/users/:id', getUserById);
// Note: Using email as parameter for updates, make sure this matches your needs
router.put('/users/:email', updateUser); // Removed validateUser middleware as validation is done in controller
router.delete('/users/:id', deleteUser);


// Add minimal /api/users route for compatibility
import { Router as MinimalRouter } from 'express';
import { getAllUsers as getAllUsersMinimal } from '../controllers/userController.js';

const minimalRouter = MinimalRouter();
minimalRouter.get('/api/users', getAllUsersMinimal);
export { minimalRouter };

export default router;
