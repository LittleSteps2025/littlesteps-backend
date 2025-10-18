import express from "express";
import {
  teacherAuth,
  getAllTeachers,
  searchTeachers,
  getTeacherById,
  getAvailableGroups,
  teacherLogin,
  updateTeacher,
  deleteTeacher,
} from "../controllers/teacherController.js";

const router = express.Router();

// Teacher registration
router.post("/teacherRegister", teacherAuth);

// Get all teachers
router.get("/teachers", getAllTeachers);

// Search teachers
router.get("/teachers/search", searchTeachers);

// Get teacher by ID
router.get("/teachers/:id", getTeacherById);

// Update teacher
router.put("/teachers/:id", updateTeacher);

// Delete teacher
router.delete("/teachers/:id", deleteTeacher);

// Get available groups for teacher assignment
router.get("/available-groups", getAvailableGroups);

router.post("/teacherLogin", teacherLogin);

export default router;
