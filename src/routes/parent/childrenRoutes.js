import express from 'express';
import { childrenDetails } from '../../controllers/parent/ChildrenController.js';


const router = express.Router();

router.get('/details/:id', childrenDetails);

export default router;