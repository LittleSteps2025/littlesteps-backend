import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js'; // Importing user routes
import errorHandler from './middlewares/errorHandler.js';
import createUserTable from './data/createUserTable.js';
import dailyRecordRoutes from './routes/parent/dailyRecordRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

//Middleware
app.use(express.json());
app.use(cors());

//Routes
app.use('/api', userRoutes); // Using user routes
app.use('/api', dailyRecordRoutes);

//Error handling middleware 
app.use(errorHandler)
//create table before starting the server
createUserTable();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
//Testing POSTGRES connection
app.get("/", async (req, res) => {
    console.log("Start");
    const result =await pool.query('SELECT current_database()');
    console.log("End");
    res.send(`The database name is: ${result.rows[0].current_database}`);
});
//Server running
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});