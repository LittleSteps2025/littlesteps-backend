import pool from "../../config/db.js";

// Get all payments with optional filters (admin)
export const getAllPayments = async (filters = {}) => {
  const {
    startDate,
    endDate,
    status,
    parent_email,
    child_id,
    order_id
  } = filters;

  let query = `
    SELECT 
      p.id as payment_id,
      p.order_id,
      p.child_id,
      p.parent_email as parent_id,
      p.amount,
      p.currency,
      p.status as method,
      p.created_at,
      p.paid_at,
      '' as package_id,
      '' as month,
      p.order_id as transaction_ref,
      '' as notes,
      CASE 
        WHEN p.status = 'completed' OR p.paid_at IS NOT NULL THEN 'paid'
        ELSE 'unpaid'
      END as status,
      parent.name as parent_name,
      child.name as child_name
    FROM payments p
    LEFT JOIN "user" parent ON p.parent_email = parent.email
    LEFT JOIN child ON p.child_id = child.child_id
    WHERE 1=1
  `;
  
  const values = [];
  let valueIndex = 1;

  if (startDate) {
    query += ` AND p.created_at >= $${valueIndex}`;
    values.push(startDate);
    valueIndex++;
  }

  if (endDate) {
    query += ` AND p.created_at <= $${valueIndex}`;
    values.push(endDate);
    valueIndex++;
  }

  if (status) {
    query += ` AND p.status = $${valueIndex}`;
    values.push(status);
    valueIndex++;
  }

  if (parent_email) {
    query += ` AND p.parent_email = $${valueIndex}`;
    values.push(parent_email);
    valueIndex++;
  }

  if (child_id) {
    query += ` AND p.child_id = $${valueIndex}`;
    values.push(child_id);
    valueIndex++;
  }

  if (order_id) {
    query += ` AND p.order_id = $${valueIndex}`;
    values.push(order_id);
    valueIndex++;
  }

  query += ' ORDER BY p.created_at DESC';

  const result = await pool.query(query, values);
  return result.rows;
};

// Get payment by ID (admin)
export const getPaymentById = async (payment_id) => {
  const result = await pool.query(
    `SELECT 
      p.id as payment_id,
      p.order_id,
      p.child_id,
      p.parent_email as parent_id,
      p.amount,
      p.currency,
      p.status as method,
      p.created_at,
      p.paid_at,
      '' as package_id,
      '' as month,
      p.order_id as transaction_ref,
      '' as notes,
      CASE 
        WHEN p.status = 'completed' OR p.paid_at IS NOT NULL THEN 'paid'
        ELSE 'unpaid'
      END as status,
      parent.name as parent_name,
      child.name as child_name
    FROM payments p
    LEFT JOIN "user" parent ON p.parent_email = parent.email
    LEFT JOIN child ON p.child_id = child.child_id
    WHERE p.id = $1`,
    [payment_id]
  );
  return result.rows[0];
};

// Get payment statistics (admin)
export const getPaymentStats = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_payments,
      SUM(amount) as total_amount,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments
    FROM payments
  `);
  return result.rows[0];
};

// Update payment status (admin)
export const updatePaymentStatus = async (payment_id, status) => {
  const result = await pool.query(
    `UPDATE payments 
     SET status = $1, 
         paid_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE paid_at END
     WHERE id = $2
     RETURNING *`,
    [status, payment_id]
  );
  return result.rows[0];
};
