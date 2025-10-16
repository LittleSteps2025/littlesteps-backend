import express from "express";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import pool from "../config/db.js";

const router = express.Router();

// Initialize Firebase Admin (should already be initialized in teacherController.js)
if (!admin.apps.length) {
  const credentials = JSON.parse(
    readFileSync("./firebaseServiceAccount.json", "utf8")
  );
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

// Send FCM notification
router.post("/send-notification", async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "Token, title, and body are required",
      });
    }

    // Convert all data values to strings (FCM requirement)
    const stringifiedData = {};
    if (data) {
      Object.keys(data).forEach((key) => {
        stringifiedData[key] = String(data[key]);
      });
    }

    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: stringifiedData,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    console.log("Sending FCM notification:", {
      title,
      body,
      token: token.substring(0, 20) + "...",
      data: stringifiedData,
    });

    const response = await admin.messaging().send(message);

    console.log("FCM notification sent successfully:", response);

    res.json({
      success: true,
      message: "Notification sent successfully",
      messageId: response,
    });
  } catch (error) {
    console.error("Error sending FCM notification:", error);

    // Handle specific FCM errors
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or unregistered FCM token",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
});

// Update user FCM token
router.post("/update-fcm-token", async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        message: "User ID and FCM token are required",
      });
    }

    // Check if fcm_token column exists, if not, we'll need to add it
    const updateResult = await pool.query(
      'UPDATE "user" SET fcm_token = $1 WHERE user_id = $2 RETURNING *',
      [fcmToken, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("FCM token updated for user:", userId);
    res.json({
      success: true,
      message: "FCM token updated successfully",
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);

    // If the column doesn't exist, try to add it
    if (error.code === "42703") {
      // undefined_column
      try {
        await pool.query(
          'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS fcm_token TEXT'
        );
        console.log("Added fcm_token column to user table");

        // Retry the update
        const updateResult = await pool.query(
          'UPDATE "user" SET fcm_token = $1 WHERE user_id = $2 RETURNING *',
          [req.body.fcmToken, req.body.userId]
        );

        return res.json({
          success: true,
          message: "FCM token updated successfully (column added)",
        });
      } catch (alterError) {
        console.error("Error adding fcm_token column:", alterError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to update FCM token",
      error: error.message,
    });
  }
});

export default router;
