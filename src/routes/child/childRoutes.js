import express from 'express';
import childController from '../../controllers/child/childController.js';

const router = express.Router();

router.get('/', childController.getAllChildren);
router.post('/', childController.addChild);

export default router;