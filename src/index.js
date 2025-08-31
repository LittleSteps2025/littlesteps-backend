import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js'; // User routes
import reportRoutes from './routes/teacher/reportRoutes.js'; // ✅ Report routes
import supervisorRoutes from './routes/supervisorRoutes.js'; // ✅ Supervisor and Admin routes
import errorHandler from './middlewares/errorHandler.js';
import teacherRoutes from './routes/teacherRoutes.js'; // ✅ Teacher routes
import parentRoutes from './routes/parent/parentRoutes.js';
import dailyRecordRoutes from './routes/parent/dailyRecordRoutes.js';
import childRoutes from './routes/child/childRoutes.js'; // Child routes
import eventRoutes from './routes/eventRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js'; // ✅ Meeting routes
import guardianRoutes from './routes/teacher/guardianRoutes.js'; // ✅ Guardian routes
import complaintRoutes from './routes/complaintRoutes.js'; // ✅ Complaint routes



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());


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
// Error handling middleware
app.use(errorHandler);

// Create tables before starting the server
// createUserTable();

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
