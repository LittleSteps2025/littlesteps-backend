import pool from '../../config/db.js';

// Get attendance trends
export const getAttendanceTrends = async (startDate, endDate) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(r.create_date, 'YYYY-MM-DD') as date,
        COUNT(DISTINCT CASE WHEN r.check_in IS NOT NULL THEN r.child_id END) as "checkIns",
        COUNT(DISTINCT CASE WHEN r.check_out IS NOT NULL THEN r.child_id END) as "checkOuts"
      FROM report r
      WHERE r.create_date >= $1 AND r.create_date <= $2
      GROUP BY TO_CHAR(r.create_date, 'YYYY-MM-DD')
      ORDER BY date DESC
      LIMIT 10
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching attendance trends:', error);
    return [];
  }
};

// Get revenue trends
export const getRevenueTrends = async (startDate, endDate) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(p.created_at, 'Mon YYYY') as month,
        SUM(p.amount::numeric) as revenue,
        0 as expenses,
        SUM(p.amount::numeric) as profit
      FROM payments p
      WHERE p.created_at >= $1 AND p.created_at <= $2
        AND p.status = 'paid'
      GROUP BY TO_CHAR(p.created_at, 'Mon YYYY'), DATE_TRUNC('month', p.created_at)
      ORDER BY DATE_TRUNC('month', p.created_at) DESC
      LIMIT 6
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    return [];
  }
};

// Get enrollment data
export const getEnrollmentData = async (startDate, endDate) => {
  try {
    const query = `
      WITH monthly_stats AS (
        SELECT 
          TO_CHAR(c.created_at, 'Mon YYYY') as month,
          DATE_TRUNC('month', c.created_at) as month_date,
          COUNT(*) as enrolled,
          0 as withdrawn
        FROM child c
        WHERE c.created_at >= $1 AND c.created_at <= $2
        GROUP BY TO_CHAR(c.created_at, 'Mon YYYY'), DATE_TRUNC('month', c.created_at)
      ),
      active_count AS (
        SELECT COUNT(*) as total_active FROM child
      )
      SELECT 
        ms.month,
        ms.enrolled,
        ms.withdrawn,
        ac.total_active as active
      FROM monthly_stats ms
      CROSS JOIN active_count ac
      ORDER BY ms.month_date DESC
      LIMIT 6
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching enrollment data:', error);
    return [];
  }
};

// Get payment status
export const getPaymentStatus = async () => {
  try {
    const query = `
      SELECT 
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::integer as paid,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::integer as unpaid,
        COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END)::integer as overdue,
        COUNT(*)::integer as total
      FROM payments
    `;
    const result = await pool.query(query);
    return result.rows[0] || { paid: 0, unpaid: 0, overdue: 0, total: 0 };
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return { paid: 0, unpaid: 0, overdue: 0, total: 0 };
  }
};

// Get complaint statistics
export const getComplaintStats = async () => {
  try {
    const query = `
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::integer as pending,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END)::integer as resolved,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::integer as "inProgress",
        COUNT(*)::integer as total
      FROM complaints
    `;
    const result = await pool.query(query);
    return result.rows[0] || { pending: 0, resolved: 0, inProgress: 0, total: 0 };
  } catch (error) {
    console.error('Error fetching complaint stats:', error);
    return { pending: 0, resolved: 0, inProgress: 0, total: 0 };
  }
};

// Get subscription breakdown
export const getSubscriptionBreakdown = async () => {
  try {
    const query = `
      SELECT 
        p.name as "planName",
        COUNT(s.subscription_id)::integer as count,
        COALESCE(SUM(p.price::numeric), 0) as revenue
      FROM subscriptions s
      JOIN "package" p ON s.plan_id = p.package_id
      WHERE s.status = 'active'
      GROUP BY p.package_id, p.name
      ORDER BY revenue DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching subscription breakdown:', error);
    return [];
  }
};

// Get staff performance
export const getStaffPerformance = async (startDate, endDate) => {
  try {
    const query = `
      SELECT 
        u.name as "staffName",
        u.role,
        COUNT(r.report_id)::integer as "activitiesCount",
        COALESCE(4.5, 0) as rating
      FROM "user" u
      LEFT JOIN report r ON u.user_id = r.teacher_id 
        AND r.create_date >= $1 AND r.create_date <= $2
      WHERE u.role IN ('teacher', 'supervisor')
      GROUP BY u.user_id, u.name, u.role
      ORDER BY "activitiesCount" DESC
      LIMIT 10
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    return [];
  }
};

// Get peak hours
export const getPeakHours = async (startDate, endDate) => {
  try {
    const query = `
      WITH check_in_hours AS (
        SELECT 
          TO_CHAR(check_in, 'HH12:00 AM') as hour,
          EXTRACT(HOUR FROM check_in) as hour_num,
          COUNT(*) as count
        FROM report
        WHERE create_date >= $1 AND create_date <= $2
          AND check_in IS NOT NULL
        GROUP BY TO_CHAR(check_in, 'HH12:00 AM'), EXTRACT(HOUR FROM check_in)
      )
      SELECT 
        CASE 
          WHEN hour LIKE '%12:%' AND hour LIKE '%AM%' THEN REPLACE(hour, '12:', '12:') 
          WHEN hour LIKE '%AM%' THEN REPLACE(hour, 'AM', 'AM')
          WHEN hour LIKE '%12:%' AND hour LIKE '%PM%' THEN REPLACE(hour, '12:', '12:')
          ELSE REPLACE(hour, 'AM', 'PM')
        END as hour,
        count::integer
      FROM check_in_hours
      ORDER BY count DESC
      LIMIT 8
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching peak hours:', error);
    return [];
  }
};

// Get all analytics data
export const getAllAnalytics = async (period = 'this-month') => {
  try {
    // Calculate date range based on period
    let startDate, endDate = new Date();
    
    switch (period) {
      case 'this-week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last-month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 2);
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'this-year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'this-month':
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // Fetch all analytics in parallel
    const [
      attendanceTrends,
      revenueTrends,
      enrollmentData,
      paymentStatus,
      complaintStats,
      subscriptionBreakdown,
      staffPerformance,
      peakHours
    ] = await Promise.all([
      getAttendanceTrends(startDate, endDate),
      getRevenueTrends(startDate, endDate),
      getEnrollmentData(startDate, endDate),
      getPaymentStatus(),
      getComplaintStats(),
      getSubscriptionBreakdown(),
      getStaffPerformance(startDate, endDate),
      getPeakHours(startDate, endDate)
    ]);

    return {
      attendanceTrends,
      revenueTrends,
      enrollmentData,
      paymentStatus,
      complaintStats,
      subscriptionBreakdown,
      staffPerformance,
      peakHours
    };
  } catch (error) {
    console.error('Error fetching all analytics:', error);
    throw error;
  }
};
