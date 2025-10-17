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
import appointmentsRoutes from './routes/teacher/appointmentsRoutes.js';

// Supervisor Routes
import supervisorRoutes from './routes/supervisorRoutes.js';
import childSupervisorRoutes from './routes/child/childRoutes.js';
import supervisorEventRoutes from './routes/eventRoutes.js';
import announcementsRoutes from './routes/announcementsRoute.js';

// Payment Routes
import paymentRoutes from './routes/payment/paymentRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());


// Core Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Teacher Routes
app.use('/api/teachers', teacherRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/teachers/child', teacherChildRoutes);
app.use('/api/events', eventRoutes);

// Parent Routes
app.use('/api/parents', parentRoutes);
app.use('/api/daily-records', dailyRecordRoutes);
app.use('/api/parent/announcements', announcementRoutes);
app.use('/api/parent/children', childrenRoutes);
app.use('/api/parent/reports', viewReportRoutes);
app.use('/api/parent/guardians', guardiansRoutes);

// Supervisor Routes
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/supervisors/child', childSupervisorRoutes);
app.use('/api/supervisor/events', supervisorEventRoutes);
app.use('/api/announcements', announcementsRoutes);

// Additional Parent Routes
app.use('/api/parent/health', healthRecordRoutes);
app.use('/api/parent/meeting', meetingRoutes);
app.use('/api/parent/complaint', complaintRoutes);

// Appointment Routes
app.use('/api/appointments', appointmentsRoutes);

// Payment Routes
app.use('/api/payment', paymentRoutes);

// Error handling middleware
app.use(errorHandler);

// Create password reset tables
// createPasswordResetTables();

// PostgreSQL test route

app.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database()');
    res.send(`The database name is: ${result.rows[0].current_database}`);
  } catch (error) {
    res.status(500).send('Database connection failed.');
  }
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
