import bcrypt from 'bcrypt';
import Joi from 'joi';
import { 
    getParentByEmail, 
    addParentByAdmin, 
    verifyParentEmail, 
    verifyOtpAndSetPassword,
    completeFirebaseRegistration,
    getParentByFirebaseUid
} from '../../models/parent/parentModel.js';
import { sendOtpEmail, sendWelcomeEmail } from '../../services/emailService.js';
import { pool } from '../../config/db.js';
import admin from '../../config/firebaseAdmin.js';

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

// ===== ADMIN FUNCTIONS =====

// Step 1: Admin adds parent information
export const addParentByAdminController = async (req, res) => {
    try {
        // Validation schema
        const schema = Joi.object({
            name: Joi.string().min(2).max(100).required(),
            email: Joi.string().email().required(),
            phone_number: Joi.string().pattern(/^[0-9+\-\s()]{10,15}$/).required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleResponse(res, 400, error.details[0].message);
        }

        const { name, email, phone_number } = value;

        // Check if parent already exists
        const existingParent = await getParentByEmail(email);
        if (existingParent) {
            return handleResponse(res, 409, "Parent with this email already exists");
        }

        // Add parent and generate OTP
        const { parent, otp } = await addParentByAdmin({ name, email, phone_number });

        // Send OTP email
        try {
            await sendOtpEmail(email, otp, name);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // Even if email fails, we continue as parent is added
            return handleResponse(res, 201, "Parent added but failed to send OTP email. Please try manual notification.", {
                parentId: parent.user_id,
                email: parent.email,
                name: parent.name,
                otp: otp // Include OTP in response for manual sharing
            });
        }

        handleResponse(res, 201, "Parent added successfully and OTP sent via email", {
            parentId: parent.user_id,
            email: parent.email,
            name: parent.name,
            status: parent.registration_status
        });

    } catch (error) {
        console.error('Error adding parent by admin:', error);
        handleResponse(res, 500, "Server error", error.message);
    }
};

// ===== PARENT SIGN-UP FUNCTIONS =====

// Step 4: Verify email exists (parent starts sign-up)
export const verifyEmailForSignup = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleResponse(res, 400, error.details[0].message);
        }

        const { email } = value;
        
        const parent = await verifyParentEmail(email);
        
        if (!parent) {
            return handleResponse(res, 404, "Email not found. Please contact the daycare administrator.");
        }

        if (parent.registration_status === 'completed') {
            return handleResponse(res, 400, "Account already registered. Please use the login page.");
        }

        handleResponse(res, 200, "Email verified. You can proceed with registration.", {
            email: parent.email,
            name: parent.name,
            canProceed: true
        });

    } catch (error) {
        console.error('Error verifying email for signup:', error);
        handleResponse(res, 500, "Server error", error.message);
    }
};

// Step 6: Verify OTP and set password
export const verifyOtpAndRegister = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            otp: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
            password: Joi.string().min(6).required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleResponse(res, 400, error.details[0].message);
        }

        const { email, otp, password } = value;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Verify OTP and set password
        const result = await verifyOtpAndSetPassword(email, otp, hashedPassword);

        if (!result.success) {
            return handleResponse(res, 400, result.message);
        }

        handleResponse(res, 200, "OTP verified successfully. You can now create your Firebase account.", {
            email: result.parent.email,
            name: result.parent.name,
            verified: true
        });

    } catch (error) {
        console.error('Error verifying OTP and registering:', error);
        handleResponse(res, 500, "Server error", error.message);
    }
};

// Step 7: Complete Firebase registration
export const completeFirebaseRegistrationController = async (req, res) => {
    try {
        const { idToken } = req.body;
        
        if (!idToken) {
            return handleResponse(res, 400, "Firebase ID token is required");
        }

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, uid, email_verified } = decodedToken;

        if (!email_verified) {
            return handleResponse(res, 400, "Email not verified in Firebase");
        }

        // Complete registration in database
        const parent = await completeFirebaseRegistration(email, uid);

        if (!parent) {
            return handleResponse(res, 404, "Parent not found or not eligible for completion");
        }

        // Send welcome email
        try {
            await sendWelcomeEmail(email, parent.name);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Continue even if welcome email fails
        }

        handleResponse(res, 200, "Registration completed successfully! Welcome to LittleSteps.", {
            parentId: parent.user_id,
            email: parent.email,
            name: parent.name,
            firebaseUid: uid,
            verified: true,
            status: parent.registration_status
        });

    } catch (error) {
        console.error('Error completing Firebase registration:', error);
        if (error.code === 'auth/id-token-expired') {
            return handleResponse(res, 401, "Token expired");
        }
        if (error.code === 'auth/invalid-id-token') {
            return handleResponse(res, 401, "Invalid token");
        }
        handleResponse(res, 500, "Server error", error.message);
    }
};

// ===== LOGIN FUNCTIONS =====

// Firebase-based login
export const parentFirebaseLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        
        if (!idToken) {
            return handleResponse(res, 400, "Firebase ID token is required");
        }
        
        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, uid } = decodedToken;
        
        // Get parent by email or Firebase UID
        let parent = await getParentByEmail(email) || await getParentByFirebaseUid(uid);
        
        if (!parent) {
            return handleResponse(res, 404, "Parent not found");
        }
        
        // Check if parent registration is completed
        if (parent.registration_status !== 'completed') {
            return handleResponse(res, 400, "Account registration not completed. Please complete the sign-up process.");
        }
        
        // Update Firebase UID if not set
        if (!parent.firebase_uid) {
            await pool.query(
                "UPDATE users SET firebase_uid = $1 WHERE email = $2",
                [uid, email]
            );
        }
        
        handleResponse(res, 200, "Login successful", {
            parentId: parent.user_id,
            email: parent.email,
            name: parent.name,
            firebaseUid: uid,
            verified: parent.verified
        });
        
    } catch (error) {
        console.error('Error during Firebase parent login:', error);
        if (error.code === 'auth/id-token-expired') {
            return handleResponse(res, 401, "Token expired");
        }
        if (error.code === 'auth/invalid-id-token') {
            return handleResponse(res, 401, "Invalid token");
        }
        handleResponse(res, 500, "Server error", error.message);
    }
};

// Traditional login (keep for backward compatibility)
export const parentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get parent by email
        const parent = await getParentByEmail(email);
        
        if (!parent) {
            return handleResponse(res, 404, "Parent not found");
        }
        
        // Check if registration is completed
        if (parent.registration_status !== 'completed') {
            return handleResponse(res, 400, "Account registration not completed");
        }
        
        // Compare password
        const isMatch = await bcrypt.compare(password, parent.password);
        
        if (isMatch) {
            handleResponse(res, 200, "Login successful", {
                parentId: parent.user_id,
                email: parent.email,
                name: parent.name
            });
        } else {
            handleResponse(res, 400, "Invalid password");
        }
        
    } catch (error) {
        console.error('Error during parent login:', error);
        handleResponse(res, 500, "Server error", error.message);
    }
};

// ===== UTILITY FUNCTIONS =====

// Resend OTP
export const resendOtp = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return handleResponse(res, 400, error.details[0].message);
        }

        const { email } = value;
        
        const parent = await getParentByEmail(email);
        
        if (!parent) {
            return handleResponse(res, 404, "Parent not found");
        }

        if (parent.registration_status === 'completed') {
            return handleResponse(res, 400, "Account already registered");
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

        // Update OTP in database
        await pool.query(
            'UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3',
            [otp, otpExpiry, email]
        );

        // Send OTP email
        await sendOtpEmail(email, otp, parent.name);

        handleResponse(res, 200, "OTP resent successfully", {
            email: parent.email,
            message: "Please check your email for the new OTP"
        });

    } catch (error) {
        console.error('Error resending OTP:', error);
        handleResponse(res, 500, "Server error", error.message);
    }
};