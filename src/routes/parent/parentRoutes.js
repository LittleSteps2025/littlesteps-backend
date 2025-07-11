import express from 'express';
// Import your parent controller here, e.g.:
 import * as parentController from '../../controllers/parent/parentController.js';

const router = express.Router();

// Example routes (uncomment and adjust as needed):
router.get('/', parentController.getAll);
router.get('/:id', parentController.getById);
router.post('/', parentController.create);
router.put('/:id', parentController.update);
router.delete('/:id', parentController.delete);

export default router;
