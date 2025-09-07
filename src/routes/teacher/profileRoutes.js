import express from 'express';
import authenticateUser from '../../middlewares/firebaseAuthMiddleware.js';
import { getUserProfileById,updateUserProfile } from '../../controllers/teacher/profileController.js';



const router = express.Router();



router.get('/view', authenticateUser, getUserProfileById);

router.put('/edit', authenticateUser, updateUserProfile);








export default router;