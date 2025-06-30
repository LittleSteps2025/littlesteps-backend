import pool from '../../config/db.js';

export const getParentByEmail = async (email) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND role = $2', 
            [email, 'parent']
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching parent:', error);
        throw error;
    }
};

export const createParent = async (userData) => {
    try {
        const { name, email, password, phone_number } = userData;
        
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, password, 'parent', phone_number]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error creating parent:', error);
        throw error;
    }
};

// Admin adds parent with OTP generation
export const addParentByAdmin = async (parentData) => {
    try {
        const { name, email, phone_number } = parentData;
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP expiry to 15 minutes from now
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        
        const result = await pool.query(
            `INSERT INTO users (name, email, phone_number, role, otp, otp_expiry, registration_status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, email, phone_number, 'parent', otp, otpExpiry, 'otp_sent']
        );
        
        return { parent: result.rows[0], otp };
    } catch (error) {
        console.error('Error adding parent by admin:', error);
        throw error;
    }
};

// Verify email exists in database (for sign-up step)
export const verifyParentEmail = async (email) => {
    try {
        const result = await pool.query(
            'SELECT user_id, name, email, registration_status FROM users WHERE email = $1 AND role = $2',
            [email, 'parent']
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error verifying parent email:', error);
        throw error;
    }
};

// Verify OTP and update password
export const verifyOtpAndSetPassword = async (email, otp, password) => {
    try {
        // Check if OTP is valid and not expired
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND role = $2 AND otp = $3 AND otp_expiry > NOW()',
            [email, 'parent', otp]
        );
        
        if (result.rows.length === 0) {
            return { success: false, message: 'Invalid or expired OTP' };
        }
        
        const parent = result.rows[0];
        
        // Update password and clear OTP
        await pool.query(
            `UPDATE users 
             SET password = $1, otp = NULL, otp_expiry = NULL, registration_status = $2 
             WHERE email = $3`,
            [password, 'verified', email]
        );
        
        return { success: true, parent };
    } catch (error) {
        console.error('Error verifying OTP and setting password:', error);
        throw error;
    }
};

// Complete Firebase registration
export const completeFirebaseRegistration = async (email, firebaseUid) => {
    try {
        const result = await pool.query(
            `UPDATE users 
             SET firebase_uid = $1, verified = true, registration_status = $2 
             WHERE email = $3 AND role = $4 
             RETURNING *`,
            [firebaseUid, 'completed', email, 'parent']
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error completing Firebase registration:', error);
        throw error;
    }
};

// Get parent by Firebase UID
export const getParentByFirebaseUid = async (firebaseUid) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE firebase_uid = $1 AND role = $2',
            [firebaseUid, 'parent']
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching parent by Firebase UID:', error);
        throw error;
    }
};