import pool from "../../config/db.js";

// Get all payments with optional filters
export const getAllPayments = async (filters = {}) => {
  const {
    startDate,
    endDate,
    method,
    parent_id,
    child_id,
    package_id,
    order_id,
    transaction_ref
  } = filters;

  let query = `
    SELECT 
      payment_id,
      amount,
      created_at,
      parent_id,
      child_id,
      package_id,
      month,
      method,
      transaction_ref,
      notes,
      order_id
    FROM payments
    WHERE 1=1
  `;
  
  const values = [];
  let valueIndex = 1;

  if (startDate) {
    query += ` AND created_at >= $${valueIndex}`;
    values.push(startDate);
    valueIndex++;
  }

  if (endDate) {
    query += ` AND created_at <= $${valueIndex}`;
    values.push(endDate);
    valueIndex++;
  }

  if (method) {
    query += ` AND method = $${valueIndex}`;
    values.push(method);
    valueIndex++;
  }

  if (parent_id) {
    query += ` AND parent_id = $${valueIndex}`;
    values.push(parent_id);
    valueIndex++;
  }

  if (child_id) {
    query += ` AND child_id = $${valueIndex}`;
    values.push(child_id);
    valueIndex++;
  }

  if (package_id) {
    query += ` AND package_id = $${valueIndex}`;
    values.push(package_id);
    valueIndex++;
  }

  if (order_id) {
    query += ` AND order_id = $${valueIndex}`;
    values.push(order_id);
    valueIndex++;
  }

  if (transaction_ref) {
    query += ` AND transaction_ref = $${valueIndex}`;
    values.push(transaction_ref);
    valueIndex++;
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, values);
  return result.rows;
}

export const getPaymentById = async (payment_id) => {
  const result = await pool.query(
    `SELECT 
      payment_id,
      amount,
      created_at,
      parent_id,
      child_id,
      package_id,
      month,
      method,
      transaction_ref,
      notes,
      order_id
    FROM payments 
    WHERE payment_id = $1`,
    [payment_id]
  );
  return result.rows[0];
}

export const getPaymentsHistory = async (child_id) => {
  const result = await pool.query(
    `SELECT *
     FROM payments
     WHERE child_id = $1
     ORDER BY created_at DESC`,
    [child_id]
  );
  return result.rows;
}

export const getParentPaymentsHistory = async (parent_email) => {
    const result = await pool.query(
            `SELECT *
             FROM payments
             WHERE parent_email = $1
             ORDER BY created_at DESC`,
            [parent_email]
        );
    return result.rows;       
}