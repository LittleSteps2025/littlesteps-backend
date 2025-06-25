import express from 'express';
import { createUser, deleteUser, getAllUsers, getUserById, updateUser } from '../controllers/userController.js';
import validateUser from '../middlewares/inputValidator.js';

const router = express.Router();

router.post('/user',validateUser , createUser);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id',validateUser, updateUser);
router.delete('/users/:id', deleteUser);


export default router;