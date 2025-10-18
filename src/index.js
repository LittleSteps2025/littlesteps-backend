<<<<<<< HEAD
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js'; // User routes
import reportRoutes from './routes/teacher/reportRoutes.js'; // ✅ Report routes
import supervisorRoutes from './routes/supervisorRoutes.js'; // ✅ Supervisor and Admin routes
import errorHandler from './middlewares/errorHandler.js';

// Core Routes
import authRoutes from './routes/authRoutes.js';
=======
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import errorHandler from "./middlewares/errorHandler.js";

// Core Routes
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
>>>>>>> f256611878e4df0f399180bea03882a493b64168

// Teacher Routes
import teacherChildRoutes from './routes/teacher/childRoutes.js';
<<<<<<< HEAD
import eventRoutesChathumini from './routes/teacher/eventRoutes.js';
import appointmentsRoutes from './routes/teacher/appointmentsRoutes.js';
=======
import eventRoutes from './routes/teacher/eventRoutes.js';
import profileRoutes from './routes/teacher/profileRoutes.js';
import childRoutes from './routes/teacher/childRoutes.js';


// Parent Routes

import parentRoutes from './routes/parent/parentRoutes.js';
import dailyRecordRoutes from './routes/parent/dailyRecordRoutes.js';
import announcementRoutes from './routes/parent/announcementRoutes.js';
import childrenRoutes from './routes/parent/childrenRoutes.js';
import viewReportRoutes from './routes/parent/viewReportRoutes.js';
import healthRecordRoutes from './routes/parent/healthRecordRoutes.js';
import meetingRoutes from './routes/parent/meetingRoutes.js';
import complaintRoutes from './routes/parent/complaintRoutes.js';
import guardiansRoutes from './routes/parent/guardiansRoutes.js';


// Teacher Routes
import appointmentsRoutes from "./routes/teacher/appointmentsRoutes.js";
>>>>>>> f256611878e4df0f399180bea03882a493b64168

// Parent Routes

import teacherRoutes from './routes/teacherRoutes.js'; // ✅ Teacher routes
import parentRoutes from './routes/parent/parentRoutes.js';
import dailyRecordRoutes from './routes/parent/dailyRecordRoutes.js';
import childRoutes from './routes/child/childRoutes.js'; // Child routes
import eventRoutes from './routes/eventRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js'; // ✅ Meeting routes
import guardianRoutes from './routes/teacher/guardianRoutes.js'; // ✅ Guardian routes
import complaintRoutes from './routes/complaintRoutes.js'; // ✅ Complaint routes
import supervisorReportRoutes from './routes/supervisorReportRoutes.js'; // ✅ Supervisor Report routes
import dashboardRoutes from './routes/dashboardRoutes.js'; // ✅ Dashboard route
// Supervisor Routes
<<<<<<< HEAD
import supervisorRoutes from './routes/supervisorRoutes.js';
import childSupervisorRoutes from './routes/child/childRoutes.js';
import supervisorEventRoutes from './routes/eventRoutes.js';
import announcementsRoutes from './routes/announcementsRoute.js';
import appointmentRoutes from './routes/appointmentRoute.js';
import supervisorPaymentRoutes from './routes/supervisor/supervisorPaymentRoutes.js';
=======
import supervisorRoutes from "./routes/supervisorRoutes.js";
import childSupervisorRoutes from "./routes/child/childRoutes.js";
import supervisorEventRoutes from "./routes/eventRoutes.js";
import announcementsRoutes from "./routes/announcementsRoute.js";
>>>>>>> f256611878e4df0f399180bea03882a493b64168

// Payment Routes
import paymentRoutes from "./routes/payment/paymentRoute.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());

<<<<<<< HEAD


// Core Routes
app.use('/api/auth', authRoutes);

// Teacher Routes
app.use('/api/teachers/child', teacherChildRoutes);
app.use('/api/events', eventRoutesChathumini); //chathumini
app.use('/api/appointments', appointmentsRoutes);

// Parent Routes
=======
// Core Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", notificationRoutes);

// Teacher Routes

app.use('/api/teachers', teacherRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/teachers/child', teacherChildRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/child', childRoutes);


// Parent Routes

app.use('/api/parents', parentRoutes);
>>>>>>> f256611878e4df0f399180bea03882a493b64168
app.use('/api/daily-records', dailyRecordRoutes);
app.use('/api/parent/announcements', announcementRoutes);
app.use('/api/parent/children', childrenRoutes);
app.use('/api/parent/reports', viewReportRoutes);
<<<<<<< HEAD
app.use('/api/parent/health', healthRecordRoutes);
app.use('/api/parent/meeting', meetingRoutes);
app.use('/api/parent/complaint', complaintRoutes);

// Supervisor Routes
app.use('/api/supervisors/child', childSupervisorRoutes);
app.use('/api/supervisor/events', supervisorEventRoutes);
app.use('/api/announcements', announcementsRoutes);//chathumini
app.use('/api/appointments', appointmentRoutes);
app.use('/api/supervisor/payments', supervisorPaymentRoutes);
=======
app.use('/api/parent/guardians', guardiansRoutes);


// Supervisor Routes
app.use("/api/supervisors", supervisorRoutes);
app.use("/api/supervisors/child", childSupervisorRoutes);
app.use("/api/supervisor/events", supervisorEventRoutes);
app.use("/api/announcements", announcementsRoutes);

// Additional Parent Routes
app.use("/api/parent/health", healthRecordRoutes);
app.use("/api/parent/meeting", meetingRoutes);
app.use("/api/parent/complaint", complaintRoutes);

// Appointment Routes

app.use('/api/appointments', appointmentsRoutes);
app.use('/api/teacherprofile', profileRoutes);
>>>>>>> f256611878e4df0f399180bea03882a493b64168

// Payment Routes
app.use("/api/payment", paymentRoutes);

//Routes

// app.use('/api', dailyRecordRoutes);

//Error handling middleware 
// app.use(errorHandler)
// //create table before starting the server
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
//Testing POSTGRES connection

// Routes
app.use('/api/users', userRoutes); // Example: http://localhost:3001/api/users
app.use('/api/reports', reportRoutes); // ✅ Example: http://localhost:3001/api/reports
app.use('/api/guardians', guardianRoutes); // ✅ Example: http://localhost:3001/api/guardians
app.use('/api/supervisors', supervisorRoutes); // ✅ Supervisor and Admin routes
app.use('/api/teachers', teacherRoutes); // ✅ Teacher routes (same as supervisor)
app.use('/api/parents', parentRoutes);
app.use('/api', dailyRecordRoutes);
app.use('/api/child', childRoutes); // Child routes
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/meetings', meetingRoutes); // ✅ Meeting routes
app.use('/api/complaints', complaintRoutes); // ✅ Complaint routes
app.use('/api/supervisor-reports', supervisorReportRoutes); // ✅ Supervisor Report routes
app.use('/api/dashboard', dashboardRoutes); // ✅ Dashboard routes - NEW

// Error handling middleware
app.use(errorHandler);

// Create tables before starting the server
// createUserTable();

// PostgreSQL test route

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database()");
    res.send(`The database name is: ${result.rows[0].current_database}`);
  } catch (error) {
    res.status(500).send("Database connection failed.");
  }
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
