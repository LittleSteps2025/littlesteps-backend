// File: routes/child/childRoutes.js
import express from 'express';
import childController from '../../controllers/child/childController.js';

const router = express.Router();

// IMPORTANT: More specific routes must come BEFORE parameterized routes
router.get('/packages', childController.getPackages);
router.get('/groups', childController.getGroups); // Move this BEFORE /:id
router.post('/check-parent-nic', childController.checkVerifiedParent); // Specific routes first
router.get('/', childController.getAll);
router.get('/:id', childController.getById); // Parameterized routes last
router.post('/', childController.create);
router.put('/:id', childController.update);
router.delete('/:id', childController.delete);
export default router;
