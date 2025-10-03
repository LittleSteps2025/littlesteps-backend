import express from 'express';
import * as parentController from '../../controllers/parent/parentController.js';

const router = express.Router();

// Authentication routes
router.post('/login', parentController.parentLogin);
router.post('/verify', parentController.checkVerifiedParent);

// Protected routes middleware
router.use(parentController.verifyParentToken);

export default router;
