import pkg from "pg";
import dotenv from "dotenv";

const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
  (err, res) => {
    if (err) {
      console.error("Error:", err);
    } else {
      console.log(
        "Tables:",
        res.rows.map((r) => r.table_name)
      );
    }
    pool.end();
  }
);
