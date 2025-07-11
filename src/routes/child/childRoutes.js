import express from 'express';
import childController from '../../controllers/child/childController.js';

const router = express.Router();

router.get('/', childController.getAll); // Retrieve all children
router.get('/:id', childController.getById); // Retrieve child by id
router.post('/', childController.create); // Create child
router.put('/:id', childController.update); // Update child
router.delete('/:id', childController.delete); // Delete child

export default router;