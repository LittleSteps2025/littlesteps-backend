// File: routes/child/childRoutes.js
import express from 'express';
import childController from '../../controllers/child/childController.js';

const router = express.Router();

router.get('/', childController.getAll);
router.get('/:id', childController.getById);
router.post('/', childController.create);
router.put('/:id', childController.update);
router.delete('/:id', childController.delete);
router.post('/check-parent-nic', childController.checkVerifiedParent); // New route for checking parent by NIC
export default router;
