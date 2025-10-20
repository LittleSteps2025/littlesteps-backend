import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import errorHandler from "./middlewares/errorHandler.js";

// Core Routes
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Teacher Routes
import teacherRoutes from "./routes/teacherRoutes.js";
import reportRoutes from "./routes/teacher/reportRoutes.js";
import teacherChildRoutes from "./routes/teacher/childRoutes.js";
import eventRoutesTeacher from "./routes/teacher/eventRoutes.js";
import appointmentsRoutes from "./routes/teacher/appointmentsRoutes.js";
import eventTeacherRoutes from "./routes/teacher/eventRoutes.js";
import profileRoutes from "./routes/teacher/profileRoutes.js";
import childTeacherRoutes from "./routes/teacher/childRoutes.js";
import announcemnents from "./routes/teacher/aRoutes.js";

// Parent Routes
import parentRoutes from "./routes/parent/parentRoutes.js";
import dailyRecordRoutes from "./routes/parent/dailyRecordRoutes.js";
import childrenRoutes from "./routes/parent/childrenRoutes.js";
import viewReportRoutes from "./routes/parent/viewReportRoutes.js";
import healthRecordRoutes from "./routes/parent/healthRecordRoutes.js";
import childRoutes from "./routes/child/childRoutes.js"; // Child routes
import eventRoutes from "./routes/eventRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js"; // ✅ Meeting routes
import guardianRoutes from "./routes/teacher/guardianRoutes.js"; // ✅ Guardian routes
import complaintRoutes from "./routes/complaintRoutes.js"; // ✅ Complaint routes
import supervisorReportRoutes from "./routes/supervisorReportRoutes.js"; // ✅ Supervisor Report routes
import dashboardRoutes from "./routes/dashboardRoutes.js"; // ✅ Dashboard route
import meetingParentRoutes from "./routes/parent/meetingRoutes.js";
import complaintParentRoutes from "./routes/parent/complaintRoutes.js";
import guardiansRoutes from "./routes/parent/guardiansRoutes.js";

// Teacher Routes

// Supervisor Routes
import supervisorRoutes from "./routes/supervisorRoutes.js";
import childSupervisorRoutes from "./routes/child/childRoutes.js";
import supervisorEventRoutes from "./routes/eventRoutes.js";
import announcementsRoutes from "./routes/announcementsRoute.js";
import appointmentRoutes from "./routes/appointmentRoute.js";
import supervisorPaymentRoutes from "./routes/supervisor/supervisorPaymentRoutes.js";

// Payment Routes

// Admin Routes

// Payment & Admin Routes
import paymentRoutes from "./routes/payment/paymentRoute.js";
import adminPaymentRoutes from "./routes/payment/adminPaymentRoute.js";
import adminDashboardRoutes from "./routes/admin/dashboardRoutes.js";
import adminReportsRoutes from "./routes/admin/reportsRoutes.js";
import adminAttendanceRoutes from "./routes/admin/attendanceRoutes.js";

// import adminAttendanceRoutes from './routes/admin/attendanceRoutes.js';
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use("/api/teachers", teacherRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/guardians", guardianRoutes);
app.use("/api/teachers/child", teacherChildRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/child", childRoutes);
app.use("/api/announcements", announcemnents);

// Core Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);

// Teacher Routes
app.use("/api/teacher", teacherRoutes);
app.use("/api/teacher/reports", reportRoutes);
app.use("/api/teacher/guardians", guardianRoutes);
app.use("/api/teacher/children", teacherChildRoutes);
app.use("/api/teacher/events", eventRoutesTeacher);
app.use("/api/teacher/appointments", appointmentsRoutes);
app.use("/api/teachers/child", childTeacherRoutes);

// Parent Routes
app.use("/api/parent", parentRoutes);
app.use("/api/parent/daily-records", dailyRecordRoutes);
app.use("/api/parent/announcements", announcementRoutes);
app.use("/api/parent/children", childrenRoutes);
app.use("/api/parent/reports", viewReportRoutes);
app.use("/api/parent/health", healthRecordRoutes);
app.use("/api/parent/meetings", meetingParentRoutes);
app.use("/api/parent/complaints", complaintParentRoutes);
app.use("/api/parent/guardians", guardiansRoutes);

// Supervisor Routes
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/supervisor/children", childSupervisorRoutes);
app.use("/api/supervisor/events", supervisorEventRoutes);
app.use("/api/announcements", announcementsRoutes); //chathumini
app.use("/api/appointments", appointmentRoutes);
app.use("/api/supervisor/payments", supervisorPaymentRoutes);
app.use("/api/supervisor-reports", supervisorReportRoutes);

// Dashboard Routes
app.use("/api/dashboard", dashboardRoutes);

// Payment Routes
app.use("/api/payment", paymentRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);

// Admin Dashboard Routes
app.use("/api/admin/dashboard", adminDashboardRoutes);

// Admin Reports Routes
app.use("/api/admin/reports", adminReportsRoutes);

// Admin Attendance Routes
app.use("/api/admin/attendance", adminAttendanceRoutes);

// Admin Complaints Routes
app.use("/api/admin/complaints", complaintRoutes);

app.use("/api/meetings", meetingRoutes);
app.use("/api/complaints", complaintRoutes);

// Subscription Routes
console.log("Mounting subscription routes...");
app.use(
  "/api/subscriptions",
  (req, res, next) => {
    console.log("Incoming request to subscriptions:", {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    });
    next();
  },
  subscriptionRoutes
);
console.log("Subscription routes mounted.");

// Admin Routes
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/reports", adminReportsRoutes);
// app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);

// Payment & Subscription Routes
app.use("/api/payments", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api/teacherprofile', profileRoutes);
app.use("/api/appointments",appointmentsRoutes)

// Error handling middleware
app.use(errorHandler);

// Database health check route
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database()");
    res.json({
      status: "success",
      message: "Database connection successful",
      database: result.rows[0].current_database,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💻 Health check: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
});
