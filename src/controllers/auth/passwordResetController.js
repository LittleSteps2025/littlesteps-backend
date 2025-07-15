import {
  generateVerificationCode,
  generateResetToken,
  storeVerificationCode,
  getValidVerificationCode,
  incrementVerificationAttempts,
  markCodeAsUsed,
  storeResetToken,
  getValidResetToken,
  markTokenAsUsed,
  checkParentEmailExists,
  updateParentPassword,
  getRateLimitInfo,
  verifyCode
} from '../../models/auth/passwordResetModel.js';

import {
  sendVerificationCodeEmail,
  sendPasswordResetSuccessEmail
} from '../../services/emailService.js';

// Rate limiting constants
const MAX_ATTEMPTS_PER_HOUR = 3;
const MAX_CODE_ATTEMPTS = 3;

// POST /auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email exists and is a parent user
    const parentUser = await checkParentEmailExists(email);
    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: 'Email not found or not a parent user. Only parent users can use this password reset feature.'
      });
    }

    // Rate limiting - check if user has exceeded max attempts in the last hour
    const attemptCount = await getRateLimitInfo(email);
    if (attemptCount >= MAX_ATTEMPTS_PER_HOUR) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset attempts. Please try again in an hour.'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Store hashed verification code in database
    const storedCode = await storeVerificationCode(email, verificationCode);

    // Send email with verification code
    try {
      await sendVerificationCodeEmail(email, verificationCode, parentUser.name || 'Parent');
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // For development/testing: Log the verification code to console
      console.log('🔐 DEVELOPMENT MODE: Verification code for', email, ':', verificationCode);
      console.log('📧 Email sending failed, but code has been generated. Use the code above for testing.');
      
      // Still return success for testing purposes (remove this in production)
      // return res.status(500).json({
      //   success: false,
      //   message: 'Failed to send verification email. Please try again.'
      // });
    }

    // Log the action
    console.log(`Password reset initiated for email: ${email}, Code ID: ${storedCode.id}`);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// POST /auth/verify-reset-code
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Validation
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Validate code format (4 digits)
    if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code format. Code must be 4 digits.'
      });
    }

    // Check if email exists and is a parent user
    const parentUser = await checkParentEmailExists(email);
    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: 'Email not found or not a parent user'
      });
    }

    // Get the latest valid verification code for this email
    const storedCodeData = await getValidVerificationCode(email);
    if (!storedCodeData) {
      return res.status(401).json({
        success: false,
        message: 'No valid verification code found or code has expired'
      });
    }

    // Check if max attempts reached
    if (storedCodeData.attempts >= MAX_CODE_ATTEMPTS) {
      return res.status(401).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.'
      });
    }

    // Verify the code
    const isValidCode = await verifyCode(code, storedCodeData.code_hash);
    
    if (!isValidCode) {
      // Increment failed attempts
      const updatedAttempts = await incrementVerificationAttempts(storedCodeData.id);
      
      const remainingAttempts = MAX_CODE_ATTEMPTS - updatedAttempts.attempts;
      
      if (remainingAttempts <= 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid code. Maximum attempts exceeded. Please request a new code.'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
      });
    }

    // Code is valid - mark it as used
    await markCodeAsUsed(storedCodeData.id);

    // Generate reset token
    const resetToken = generateResetToken();
    const storedToken = await storeResetToken(email, resetToken);

    // Log the action
    console.log(`Code verified for email: ${email}, Token ID: ${storedToken.id}`);

    res.status(200).json({
      success: true,
      message: 'Code verified successfully',
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// POST /auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    // Validation
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if email exists and is a parent user
    const parentUser = await checkParentEmailExists(email);
    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: 'Email not found or not a parent user'
      });
    }

    // Verify reset token
    const tokenData = await getValidResetToken(email, resetToken);
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update user password
    const updatedParent = await updateParentPassword(email, newPassword);

    // Mark reset token as used
    await markTokenAsUsed(tokenData.id);

    // Send success notification email (optional - don't fail if this fails)
    try {
      await sendPasswordResetSuccessEmail(email, parentUser.name || 'Parent');
    } catch (emailError) {
      console.error('Success email failed:', emailError);
      // Continue execution - this is just a notification
    }

    // Log the action
    console.log(`Password reset completed for email: ${email}, Parent ID: ${updatedParent.parent_id}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /auth/reset-status (Optional - for debugging/admin purposes)
export const getResetStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Get current active codes and tokens (for debugging)
    const activeCode = await getValidVerificationCode(email);
    const attemptCount = await getRateLimitInfo(email);

    res.status(200).json({
      success: true,
      data: {
        email,
        hasActiveCode: !!activeCode,
        codeAttempts: activeCode ? activeCode.attempts : 0,
        totalAttemptsInLastHour: attemptCount,
        rateLimitReached: attemptCount >= MAX_ATTEMPTS_PER_HOUR
      }
    });

  } catch (error) {
    console.error('Get reset status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
