import {
  checkEmailExists,
  generateVerificationToken,
  saveVerificationToken,
  getVerificationToken,
  markEmailAsVerified,
  createUserService,
  getUserByIdService,
  getAllUsersService,
  updateUserService,
  deleteUserService
} from "../models/userModel.js";

import bcrypt from 'bcrypt';
import Joi from 'joi';

// Email configuration
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

// Fixed validation schema - all fields are optional for updates
const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  verified: Joi.boolean().optional()
}).min(1); // At least one field must be provided

// Validation middleware
// const validateUpdateUser = (req, res, next) => {
//   const { error } = updateUserSchema.validate(req.body);
//   if (error) {
//     return handleResponse(res, 400, error.details[0].message);
//   }
//   next();
// };

// Email Verification Controllers
export const checkEmail = async (req, res) => {
  console.log('Checking email:', req.body);
  try {
    const { email } = req.body;
    const user = await checkEmailExists(email);

    if (!user) {
      console.log(`Email not found in database: ${email}`);
      return handleResponse(res, 404, 'Email not found. Please contact admin to register your email.', { exists: false });
    }

    // Email exists in database
    console.log(`Email found in database: ${email}`);
    handleResponse(res, 200, 'Email found. Please enter your verification token.', { 
      exists: true,
      verified: user.verified 
    });

  } catch (error) {
    console.error('Check email error:', error);
    handleResponse(res, 500, 'Server error', error.message);
  }
};

export const verifyToken = async (req, res) => {
  console.log('Verifying token:', req.body);
  try {
    const { email, token, password } = req.body;
    
    // First verify the token matches the email
    const verification = await getVerificationToken(email, token);
    console.log('Verification result:', verification);
    
    if (verification === true) {
      console.log(`Token verified successfully for email: ${email}`);
      
      // If password is provided, hash it and update the user
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await updateUserService(email, {
          password: hashedPassword,
          verified: true
        });
        console.log(`Password updated and user verified for email: ${email}`);
        return handleResponse(res, 200, 'Email verified and password set successfully');
      } else {
        // Just mark as verified without password update
        await markEmailAsVerified(email);
        return handleResponse(res, 200, 'Email verified successfully');
      }
    } else {
      console.log(`Invalid or expired token for email: ${email}`);
      return handleResponse(res, 400, 'Invalid or expired token');
    }

  } catch (error) {
    console.error('Verify token error:', error);
    handleResponse(res, 500, 'Server error', error.message);
  }
};

// User CRUD Controllers
export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await checkEmailExists(email);

    if (existingUser) {
      return handleResponse(res, 400, 'Email already registered');
    }

    const newUser = await createUserService({ name, email, password });
    handleResponse(res, 201, 'User created successfully', newUser);

  } catch (error) {
    handleResponse(res, 500, 'Server error', error.message);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    handleResponse(res, 200, 'Users fetched successfully', users);
  } catch (error) {
    handleResponse(res, 500, 'Server error', error.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    if (!user) {
      return handleResponse(res, 404, 'User not found');
    }
    handleResponse(res, 200, 'User fetched successfully', user);
  } catch (error) {
    handleResponse(res, 500, 'Server error', error.message);
  }
};

export const updateUser = async (req, res) => {
  console.log('Updating user:', req.body);
  console.log('User email:', req.params.email);
  
  try {
    const { email } = req.params;
    const updateData = {};

    // Validate request body
    const { error } = updateUserSchema.validate(req.body);
    if (error) {
      return handleResponse(res, 400, error.details[0].message);
    }

    // Build update object only with provided fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.verified !== undefined) updateData.verified = req.body.verified;
    
    if (req.body.password) {
      // Validate password strength
      if (req.body.password.length < 6) {
        return handleResponse(res, 400, 'Password must be at least 6 characters long');
      }
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await updateUserService(email, updateData);

    if (updatedUser) {
      // Remove password from response for security
      const { password: _, ...userResponse } = updatedUser;
      handleResponse(res, 200, 'User updated successfully', userResponse);
    } else {
      handleResponse(res, 404, 'User not found');
    }
  } catch (error) {
    console.error('Update user error:', error);
    handleResponse(res, 500, 'Server error', error.message);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await deleteUserService(req.params.id);
    if (!deletedUser) {
      return handleResponse(res, 404, 'User not found');
    }
    handleResponse(res, 200, 'User deleted successfully', deletedUser);
  } catch (error) {
    handleResponse(res, 500, 'Server error', error.message);
  }
};