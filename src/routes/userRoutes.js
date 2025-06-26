import express from 'express';
import bcrypt from 'bcrypt';
import {
  checkEmail,
  verifyToken,
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { updateUserService } from '../models/userModel.js';
import validateUser from '../middlewares/inputValidator.js';

const router = express.Router();

// Email verification routes
router.post('/users/check-email/', checkEmail);
router.post('/users/verify-token', verifyToken);

// Complete signup after verification
router.post('/users/complete-signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user with the real password and mark as verified
    await updateUserService(email, {
      password: hashedPassword,
      name: name || email.split('@')[0],
      verified: true
    });
    
    res.status(200).json({
      status: 200,
      message: 'Account created successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Server error',
      error: error.message
    });
  }
});


// User CRUD routes
router.post('/users', validateUser, createUser);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
// Note: Using email as parameter for updates, make sure this matches your needs
router.put('/users/:email', updateUser); // Removed validateUser middleware as validation is done in controller
router.delete('/users/:id', deleteUser);


export default router;