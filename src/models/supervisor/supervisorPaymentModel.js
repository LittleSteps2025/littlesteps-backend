import pool from '../../config/db.js';

class SupervisorPaymentModel {
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          p.payment_id,
          p.amount,
          p.created_at,
          p.parent_id,
          p.child_id,
          p.package_id,
          p.month,
          p.method,
          p.status,
          p.transaction_ref,
          p.notes,
          p.order_id,
          pr.first_name as parent_first_name,
          pr.last_name as parent_last_name,
          c.first_name as child_first_name,
          c.last_name as child_last_name,
          pkg.name as package_name
        FROM payments p
        LEFT JOIN parents pr ON p.parent_id = pr.parent_id
        LEFT JOIN children c ON p.child_id = c.child_id
        LEFT JOIN packages pkg ON p.package_id = pkg.package_id
        WHERE 1=1`;
      
      console.log('Checking if payments table exists...');
      // Check if the payments table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'payments'
        );
      `);
      console.log('Table check result:', tableCheck.rows[0]);

      // If table doesn't exist, create it
      if (!tableCheck.rows[0].exists) {
        console.log('Payments table does not exist. Creating it...');
        const fs = await import('fs');
        const path = await import('path');
        const sqlPath = path.join(process.cwd(), 'src', 'data', 'payments.sql');
        const createTableSQL = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(createTableSQL);
        console.log('Payments table created successfully');
      }

      // Check table structure
      console.log('Checking payments table structure...');
      const tableStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'payments';
      `);
      console.log('Table structure:', tableStructure.rows);
      
      // Count total records
      console.log('Counting total payment records...');
      const countQuery = await pool.query('SELECT COUNT(*) FROM payments;');
      console.log('Total payment records:', countQuery.rows[0].count);
      
      // Insert some test data if table is empty
      if (countQuery.rows[0].count === '0') {
        console.log('No payment records found. Inserting test data...');
        await pool.query(`
          INSERT INTO payments (amount, parent_id, child_id, month, method, status, notes)
          SELECT 
            random() * 1000 + 500,  -- Random amount between 500 and 1500
            p.parent_id,
            c.child_id,
            to_char(CURRENT_DATE - (interval '1 month' * floor(random() * 3)), 'YYYY-MM'),
            CASE floor(random() * 3)
              WHEN 0 THEN 'Cash'
              WHEN 1 THEN 'Card'
              ELSE 'Online'
            END,
            CASE WHEN random() < 0.7 THEN 'Paid' ELSE 'Pending' END,
            'Test payment record'
          FROM 
            parents p
            JOIN children c ON c.parent_id = p.parent_id
          LIMIT 5;
        `);
        console.log('Test data inserted');
      }

      const values = [];
      let paramCount = 1;

      if (filters.status) {
        query += ` AND p.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      if (filters.month) {
        query += ` AND p.month = $${paramCount}`;
        values.push(filters.month);
        paramCount++;
      }

      if (filters.parent_id) {
        query += ` AND p.parent_id = $${paramCount}`;
        values.push(filters.parent_id);
        paramCount++;
      }

      if (filters.date_from) {
        query += ` AND p.created_at >= $${paramCount}`;
        values.push(filters.date_from);
        paramCount++;
      }

      if (filters.date_to) {
        query += ` AND p.created_at <= $${paramCount}`;
        values.push(filters.date_to);
        paramCount++;
      }

      query += ' ORDER BY p.created_at DESC';

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error in findAll payments:', error);
      throw error;
    }
  }

  static async findById(paymentId) {
    try {
      const query = `
        SELECT 
          p.payment_id,
          p.amount,
          p.created_at,
          p.parent_id,
          p.child_id,
          p.package_id,
          p.month,
          p.method,
          p.status,
          p.transaction_ref,
          p.notes,
          p.order_id,
          pr.first_name as parent_first_name,
          pr.last_name as parent_last_name,
          c.first_name as child_first_name,
          c.last_name as child_last_name,
          pkg.name as package_name
        FROM payments p
        LEFT JOIN parents pr ON p.parent_id = pr.parent_id
        LEFT JOIN children c ON p.child_id = c.child_id
        LEFT JOIN packages pkg ON p.package_id = pkg.package_id
        WHERE p.payment_id = $1`;

      const result = await pool.query(query, [paymentId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in findById payment:', error);
      throw error;
    }
  }

  static async create(data) {
    const {
      amount,
      parent_id,
      child_id,
      package_id,
      month,
      method,
      status = 'Pending',
      transaction_ref,
      notes,
      order_id
    } = data;

    try {
      const query = `
        INSERT INTO payments (
          amount,
          parent_id,
          child_id,
          package_id,
          month,
          method,
          status,
          transaction_ref,
          notes,
          order_id,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        RETURNING *`;

      const values = [
        amount,
        parent_id,
        child_id,
        package_id,
        month,
        method,
        status,
        transaction_ref,
        notes,
        order_id
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in create payment:', error);
      throw error;
    }
  }

  static async update(paymentId, data) {
    try {
      const allowedUpdates = [
        'amount',
        'status',
        'method',
        'transaction_ref',
        'notes'
      ];
      const updates = [];
      const values = [];
      let paramCount = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (allowedUpdates.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (updates.length === 0) return null;

      values.push(paymentId);
      const query = `
        UPDATE payments 
        SET ${updates.join(', ')}
        WHERE payment_id = $${paramCount}
        RETURNING *`;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in update payment:', error);
      throw error;
    }
  }

  static async getPaymentStats() {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM payments
        GROUP BY status`;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in getPaymentStats:', error);
      throw error;
    }
  }

  static async getMonthlyRevenue() {
    try {
      const query = `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM(amount) as revenue,
          COUNT(*) as payment_count
        FROM payments
        WHERE status = 'Paid'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 12`;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in getMonthlyRevenue:', error);
      throw error;
    }
  }
}

export default SupervisorPaymentModel;
