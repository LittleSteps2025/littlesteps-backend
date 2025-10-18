import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import errorHandler from './middlewares/errorHandler.js';

// Core Routes
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Teacher Routes
import teacherRoutes from './routes/teacherRoutes.js';
import reportRoutes from './routes/teacher/reportRoutes.js';
import guardianRoutes from './routes/teacher/guardianRoutes.js';
import teacherChildRoutes from './routes/teacher/childRoutes.js';
import eventRoutes from './routes/teacher/eventRoutes.js';
import appointmentsRoutes from './routes/teacher/appointmentsRoutes.js';

// Parent Routes
import parentRoutes from './routes/parent/parentRoutes.js';
import dailyRecordRoutes from './routes/parent/dailyRecordRoutes.js';
import announcementRoutes from './routes/parent/announcementRoutes.js';
import childrenRoutes from './routes/parent/childrenRoutes.js';
import viewReportRoutes from './routes/parent/viewReportRoutes.js';
import healthRecordRoutes from './routes/parent/healthRecordRoutes.js';
import meetingRoutes from './routes/parent/meetingRoutes.js';
import complaintRoutes from './routes/parent/complaintRoutes.js';

// Supervisor Routes
import supervisorRoutes from './routes/supervisor/supervisorRoutes.js';  // changed path
import childSupervisorRoutes from './routes/supervisor/childRoutes.js';  // changed path
import supervisorEventRoutes from './routes/supervisor/eventRoutes.js';  // changed path
import announcementsRoutes from './routes/supervisor/announcementsRoute.js';  // changed path

// Payment & Admin Routes
import paymentRoutes from './routes/payment/paymentRoute.js';
import adminPaymentRoutes from './routes/payment/adminPaymentRoute.js';
import adminDashboardRoutes from './routes/admin/dashboardRoutes.js';
import adminReportsRoutes from './routes/admin/reportsRoutes.js';
import adminAttendanceRoutes from './routes/admin/attendanceRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';

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

// Core Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Teacher Routes
app.use('/api/teacher', teacherRoutes);
app.use('/api/teacher/reports', reportRoutes);
app.use('/api/teacher/guardians', guardianRoutes);
app.use('/api/teacher/children', teacherChildRoutes);
app.use('/api/teacher/events', eventRoutes);
app.use('/api/teacher/appointments', appointmentsRoutes);

// Parent Routes
app.use('/api/parent', parentRoutes);
app.use('/api/parent/daily-records', dailyRecordRoutes);
app.use('/api/parent/announcements', announcementRoutes);
app.use('/api/parent/children', childrenRoutes);
app.use('/api/parent/reports', viewReportRoutes);
app.use('/api/parent/health', healthRecordRoutes);
app.use('/api/parent/meetings', meetingRoutes);
app.use('/api/parent/complaints', complaintRoutes);

// Supervisor Routes
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/supervisor/children', childSupervisorRoutes);
app.use('/api/supervisor/events', supervisorEventRoutes);
app.use('/api/supervisor/announcements', announcementsRoutes);

// Admin Routes
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);

// Payment & Subscription Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Error handling middleware
app.use(errorHandler);

// Database health check route
app.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database()');
    res.json({
      status: 'success',
      message: 'Database connection successful',
      database: result.rows[0].current_database
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💻 Health check: http://localhost:${PORT}`);
});