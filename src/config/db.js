import pkg from 'pg';
import dotenv from "dotenv"
const { Pool } = pkg;

dotenv.config()


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.on('connect', () => {
    console.log('Connected to the database');
});

export default pool;





// import pg from 'pg';
// import dotenv from 'dotenv';
// dotenv.config();

// const pool = new pg.Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });

// export default pool;



//  import pkg from 'pg';
// import dotenv from "dotenv";
// const { Pool } = pkg;

// dotenv.config();

// const pool = new Pool({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: Number(process.env.DB_PORT),  // ensure this is a number
//     ssl: {
//       rejectUnauthorized: false,  // allow self-signed certificates
//     },
// });

// pool.on('connect', () => {
//     console.log('Connected to the database');
// });

// export default pool;
