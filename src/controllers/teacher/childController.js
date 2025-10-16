// controllers/teacher/childController.js

import ChildModel from "../../models/teacher/childModel.js";
import pool from "../../config/db.js"; // For raw SQL queries

// ✅ 1. Get All Children (optionally filtered by group, package, month)
export const getAllChildren = async (req, res, next) => {
  try {
    const { group = "all", pkg = "all", month } = req.query;
    const children = await ChildModel.getFilteredChildren(group, pkg, month);
    res.status(200).json(children);
  } catch (error) {
    next(error);
  }
};

// ✅ 2. Get a Specific Child by ID (with parent details)
export const getChildById = async (req, res, next) => {
  const { childId } = req.params;
  try {
    const child = await ChildModel.getChildById(childId);
    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }
    res.status(200).json(child);
  } catch (error) {
    next(error);
  }
};

// ✅ 3. Get All Packages
export const getAllPackages = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT name FROM package ORDER BY name");
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// ✅ 4. Get All Groups
export const getAllGroups = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT name FROM "group" ORDER BY name');
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// ✅ 6. Get All Children with Parent Details (for list view)
export const getChildrenWithParents = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, c.name, c.age, c.gender, c.group, c.contact_no,
        p.name AS parent_name, p.phone AS parent_phone, p.relationship
      FROM children c
      JOIN parents p ON c.parent_id = p.id
      ORDER BY c.name
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// ✅ Get parent's FCM token for a child
export const getParentFCMToken = async (req, res, next) => {
  const { childId } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT u.fcm_token
      FROM child c
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE c.child_id = $1
    `,
      [childId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Child or parent not found" });
    }

    const fcmToken = result.rows[0].fcm_token;
    res.status(200).json({ fcm_token: fcmToken });
  } catch (error) {
    next(error);
  }
};

export const saveEmergencyNote = async (req, res) => {
  const { childId } = req.params;
  const { emergency_notes } = req.body;
  const userId = req.user.userId; // from authenticateUser middleware

  if (!emergency_notes) {
    return res.status(400).json({ message: "Emergency notes required" });
  }

  try {
    // Find teacher_id from user_id
    const teacherRes = await pool.query(
      "SELECT teacher_id FROM teacher WHERE user_id = $1",
      [userId]
    );

    if (teacherRes.rows.length === 0) {
      return res.status(403).json({ message: "Teacher not found" });
    }

    const teacherId = teacherRes.rows[0].teacher_id;

    // Insert new note into emergencyNote table only
    await pool.query(
      'INSERT INTO "emergencyNote" (child_id, teacher_id, note) VALUES ($1, $2, $3)',
      [childId, teacherId, emergency_notes]
    );

    res.json({ message: "Emergency note saved successfully" });
  } catch (error) {
    console.error("Error saving emergency note:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const submitReport = async (req, res) => {
  const { report_id } = req.params;
  const {
    statusUpdates,
    checkoutPerson,
    checkoutTime,
    progress,
    dailySummary,
  } = req.body;
  const userId = req.user.userId; // from authenticateUser middleware

  if (!checkoutPerson || !checkoutTime) {
    return res
      .status(400)
      .json({ message: "Checkout person and time are required" });
  }

  try {
    // Find teacher_id (or user role ID) from user_id
    const teacherRes = await pool.query(
      "SELECT teacher_id FROM teacher WHERE user_id = $1",
      [userId]
    );

    if (teacherRes.rows.length === 0) {
      return res.status(403).json({ message: "Teacher not found" });
    }

    const teacherId = teacherRes.rows[0].teacher_id;

    // Example: update report table with submitted data
    await pool.query(
      `UPDATE report 
       SET 
         status_updates = $1,
         checkout_person = $2,
         checkout_time = $3,
         progress = $4,
         daily_summary = $5,
         teacher_id = $6,
         submitted_at = NOW()
       WHERE report_id = $7`,
      [
        statusUpdates,
        checkoutPerson,
        checkoutTime,
        progress,
        dailySummary,
        teacherId,
        report_id,
      ]
    );

    res.json({ message: "Report submitted successfully" });
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
