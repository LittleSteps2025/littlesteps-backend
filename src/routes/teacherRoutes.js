import express from 'express';
import { teacherAuth, getAllTeachers, searchTeachers, getTeacherById, getAvailableGroups, teacherLogin } from '../controllers/teacherController.js';

const router = express.Router();

// Teacher registration
router.post('/teacherRegister', teacherAuth);

// Get all teachers
router.get('/teachers', getAllTeachers);

// Search teachers
router.get('/teachers/search', searchTeachers);

// Get teacher by ID
router.get('/teachers/:id', getTeacherById);

// Get available groups for teacher assignment
router.get('/available-groups', getAvailableGroups);

router.post('/teacherLogin', teacherLogin);

export default router;