import {
  checkEmailExists,
  checkParentExists,
  generateVerificationToken,
  saveVerificationToken,
  getVerificationToken,
  markEmailAsVerified,
  createUserService,
  getUserByIdService,
  getAllUsersService,
  updateUserService,
  deleteUserService,
  getParentByEmail,
  updateParentPassword
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

// Fixed validation schema - updated for new database structure
const updateUserSchema = Joi.object({
  nic: Joi.number().integer().optional(),
  name: Joi.string().optional(),
  address: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.number().integer().optional(),
  image: Joi.string().optional(),
  role: Joi.string().valid('parent', 'teacher', 'supervisor', 'admin').optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  password: Joi.string().min(6).optional(),
  verified: Joi.boolean().optional()
}).min(1); // At least one field must be provided

const createUserSchema = Joi.object({
  nic: Joi.number().integer().required(),
  name: Joi.string().required(),
  address: Joi.string().optional(),
  email: Joi.string().email().required(),
  phone: Joi.number().integer().optional(),
  image: Joi.string().optional(),
  role: Joi.string().valid('parent', 'teacher', 'supervisor', 'admin').optional()
});

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

    if (!user || !user.email) {
      console.log(`Email not registered: ${email}`);
      return handleResponse(res, 404, 'Email not registered');
    }

    handleResponse(res, 200, 'Email is registered');

  } catch (error) {
    handleResponse(res, 500, 'Server error', error.message);
  }
};

export const verifyToken = async (req, res) => {
  console.log('Verifying token:', req.body);
  try {
    const { email, token, password } = req.body;
    const verification = await getVerificationToken(email, token);
    console.log('Verification result:', verification);
    
    if (verification === false) {
      console.log(`Invalid or expired token for email: ${email}`);
      return handleResponse(res, 400, 'Invalid or expired token');
    }
    // When creating a user with password
    const hashedPassword = await bcrypt.hash(password, 12); // 12 salt rounds
    await markEmailAsVerified(email, hashedPassword);
    handleResponse(res, 200, 'Email verified successfully');

  } catch (error) {
    handleResponse(res, 500, 'Server error', error.message);
  }
};

// User CRUD Controllers
export const createUser = async (req, res) => {
  try {
    const { error } = createUserSchema.validate(req.body);
    if (error) {
      return handleResponse(res, 400, error.details[0].message);
    }

    const { nic, name, address, email, phone, image, role } = req.body;
    const existingUser = await checkEmailExists(email);

    if (existingUser) {
      return handleResponse(res, 400, 'Email already registered');
    }

    const newUser = await createUserService({ 
      nic, name, address, email, phone, image, role 
    });
    
    // Remove sensitive data from response
    const { password, token, ...userResponse } = newUser;
    handleResponse(res, 201, 'User created successfully', userResponse);

  } catch (error) {
    handleResponse(res, 500, 'Server error', error.message);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    // Remove sensitive data from response
    const safeUsers = users.map(user => {
      const { password, token, ...safeUser } = user;
      return safeUser;
    });
    handleResponse(res, 200, 'Users fetched successfully', safeUsers);
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
    
    // Remove sensitive data from response
    const { password, token, ...safeUser } = user;
    handleResponse(res, 200, 'User fetched successfully', safeUser);
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
    if (req.body.nic !== undefined) updateData.nic = req.body.nic;
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.image !== undefined) updateData.image = req.body.image;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.verified !== undefined) updateData.verified = req.body.verified;
    
    if (req.body.password) {
      // Validate password strength
      if (req.body.password.length < 6) {
        return handleResponse(res, 400, 'Password must be at least 6 characters long');
      }
      updateData.password = await bcrypt.hash(req.body.password, 12);
    }

    const updatedUser = await updateUserService(email, updateData);

    if (updatedUser) {
      // Remove sensitive data from response
      const { password: _, token: __, ...userResponse } = updatedUser;
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