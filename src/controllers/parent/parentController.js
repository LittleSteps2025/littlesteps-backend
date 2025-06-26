import bcrypt from 'bcrypt';
import Joi from 'joi';
import { getParentByEmail } from '../../models/parent/parentModel.js';

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

export const parentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get parent by email
        const parent = await getParentByEmail(email);
        
        if (!parent) {
            return handleResponse(res, 404, "Parent not found");
        }
        
        // Check if parent is verified
        if (!parent.verified) {
            return handleResponse(res, 400, "Account not verified");
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
}