import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js'; // User routes
import reportRoutes from './routes/teacher/reportRoutes.js'; // ✅ Report routes (corrected path)
import errorHandler from './middlewares/errorHandler.js';

// import createPasswordResetTables from './data/createPasswordResetTables.js';
import parentRoutes from './routes/parentRoutes.js'; // ✅ Parent authentication routes
import dailyRecordRoutes from './routes/parent/dailyRecordRoutes.js';
import authRoutes from './routes/authRoutes.js'; // ✅ Auth routes for password reset
import teacherRoutes from './routes/teacherRoutes.js'; // ✅ Teacher routes
import announcementRoutes from './routes/parent/announcementRoutes.js'; // Parent announcement routes

import guardianRoutes from './routes/teacher/guardianRoutes.js'; // ✅ Guardian routes
import eventRoutes from './routes/teacher/eventRoutes.js'; // Example: http://localhost:3001/api/events
import childrenRoutes from './routes/parent/childrenRoutes.js'; // Children routes
import supervisorRoutes from './routes/supervisorRoutes.js'; // Supervisor routes
// import teacherRoutes from './routes/teacherRoutes.js'; // Example: http://localhost:3001/api/teachers
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
// createUserTable();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
//Testing POSTGRES connection

// Routes
app.use('/api/users', userRoutes); // Example: http://localhost:3001/api/users
app.use('/api/reports', reportRoutes); // ✅ Example: http://localhost:3001/api/reports
app.use('/api/guardians', guardianRoutes); // ✅ Example: http://localhost:3001/api/guardians

app.use('/api/auth', authRoutes); // ✅ Password reset endpoints: /api/auth/forgot-password, etc.
app.use('/api/parents', parentRoutes); // ✅ Parent authentication routes
app.use('/api', dailyRecordRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/children', childrenRoutes); 
app.use('/api/teachers', teacherRoutes); // Example: http://localhost:3001/api/teachers

app.use('/api/supervisors', supervisorRoutes);
// app.use('/api/teachers', teacherRoutes); // ✅ Teacher routes (same as supervisor)

app.use('/api/announcements', announcementRoutes);


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
