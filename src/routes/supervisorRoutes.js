import express from 'express';
import { supervisorAuth, supervisorLogin, adminAuth } from '../controllers/supervisorController.js';

const router = express.Router();

// Supervisor routes
router.post('/supervisorSignup', supervisorAuth);
router.post('/supervisorLogin', supervisorLogin);

// Admin routes (admins stored only in user table)
router.post('/adminSignup', adminAuth);
// Admin login uses the same supervisorLogin function since logic is the same

export default router;