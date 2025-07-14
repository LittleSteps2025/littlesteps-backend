import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getResetStatus
} from '../controllers/auth/passwordResetController.js';

const router = express.Router();

// Rate limiting middleware for password reset endpoints
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiting for verification attempts
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 verification attempts per windowMs
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset flow endpoints
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-reset-code', verificationLimiter, verifyResetCode);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Optional status endpoint for debugging (remove in production)
router.get('/reset-status', getResetStatus);

export default router;
