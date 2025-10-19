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

async function checkReports() {
  try {
    // Check today's reports
    const todayReports = await pool.query(
      "SELECT COUNT(*) as count FROM report WHERE DATE(create_date) = CURRENT_DATE"
    );
    console.log("Today's reports count:", todayReports.rows[0].count);

    // Check report table columns
    const reportColumns = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'report'"
    );
    console.log(
      "Report table columns:",
      reportColumns.rows.map((r) => r.column_name)
    );

    // Check recent reports
    const recentReports = await pool.query(
      "SELECT * FROM report ORDER BY create_date DESC LIMIT 5"
    );
    console.log("Recent reports:", recentReports.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

checkReports();
