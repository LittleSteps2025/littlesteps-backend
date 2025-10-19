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

async function checkPayments() {
  try {
    // Check payments table
    const paymentsResult = await pool.query(
      "SELECT COUNT(*) as count FROM payments"
    );
    console.log("Payments table count:", paymentsResult.rows[0].count);

    // Check payment table
    const paymentResult = await pool.query(
      "SELECT COUNT(*) as count FROM payment"
    );
    console.log("Payment table count:", paymentResult.rows[0].count);

    // Check columns in payments table
    const paymentsColumns = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'payments'"
    );
    console.log(
      "Payments table columns:",
      paymentsColumns.rows.map((r) => r.column_name)
    );

    // Check columns in payment table
    const paymentColumns = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'payment'"
    );
    console.log(
      "Payment table columns:",
      paymentColumns.rows.map((r) => r.column_name)
    );

    // Check recent payments
    const recentPayments = await pool.query(
      "SELECT * FROM payments ORDER BY created_at DESC LIMIT 5"
    );
    console.log("Recent payments:", recentPayments.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

checkPayments();
