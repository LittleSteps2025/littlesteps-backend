import pool from '../../config/db.js';

// Get attendance trends with proper check-ins and check-outs
export const getAttendanceTrends = async (startDate, endDate) => {
  try {
    // Generate date series for the last 30 days to ensure we have all days
    const query = `
      WITH date_series AS (
        SELECT 
          generate_series(
            DATE_TRUNC('day', $1::date),
            DATE_TRUNC('day', $2::date),
            '1 day'::interval
          )::date as date
      ),
      attendance_data AS (
        SELECT 
          DATE(r.create_date) as date,
          COUNT(DISTINCT CASE 
            WHEN EXTRACT(HOUR FROM r.create_date) < 12 THEN r.child_id 
          END) as check_ins,
          COUNT(DISTINCT CASE 
            WHEN EXTRACT(HOUR FROM r.create_date) >= 12 THEN r.child_id 
          END) as check_outs
        FROM report r
        WHERE r.create_date >= $1::date AND r.create_date <= $2::date
        GROUP BY DATE(r.create_date)
      )
      SELECT 
        TO_CHAR(ds.date, 'Mon DD') as date,
        COALESCE(ad.check_ins, 0)::integer as "checkIns",
        COALESCE(ad.check_outs, 0)::integer as "checkOuts"
      FROM date_series ds
      LEFT JOIN attendance_data ad ON ds.date = ad.date
      ORDER BY ds.date DESC
      LIMIT 30
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching attendance trends:', error);
    return [];
  }
};

// Get revenue trends (last 6 months)
export const getRevenueTrends = async (startDate, endDate) => {
  try {
    const query = `
      WITH monthly_revenue AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', p.created_at), 'Mon') as month,
          DATE_TRUNC('month', p.created_at) as month_date,
          SUM(CASE 
            WHEN p.status = 'completed' OR p.paid_at IS NOT NULL 
            THEN p.amount 
            ELSE 0 
          END)::numeric as revenue,
          0::numeric as expenses
        FROM payments p
        WHERE p.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          AND p.created_at < DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
        GROUP BY DATE_TRUNC('month', p.created_at)
      )
      SELECT 
        month,
        revenue,
        expenses,
        (revenue - expenses) as profit
      FROM monthly_revenue
      ORDER BY month_date DESC
      LIMIT 6
    `;
    const result = await pool.query(query);
    return result.rows.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    return [];
  }
};

// Get enrollment data (last 6 months)
export const getEnrollmentData = async (startDate, endDate) => {
  try {
    const query = `
      WITH monthly_enrollment AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', c.created_at), 'Mon') as month,
          DATE_TRUNC('month', c.created_at) as month_date,
          COUNT(*)::integer as enrolled
        FROM child c
        WHERE c.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
          AND c.created_at < DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
        GROUP BY DATE_TRUNC('month', c.created_at)
      ),
      all_months AS (
        SELECT 
          generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months'),
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          ) as month_date
      ),
      total_active AS (
        SELECT COUNT(*)::integer as active FROM child
      )
      SELECT 
        TO_CHAR(am.month_date, 'Mon') as month,
        COALESCE(me.enrolled, 0) as enrolled,
        0 as withdrawn,
        ta.active
      FROM all_months am
      CROSS JOIN total_active ta
      LEFT JOIN monthly_enrollment me ON am.month_date = me.month_date
      ORDER BY am.month_date ASC
    `;
    const result = await pool.query(query);
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
        COUNT(CASE 
          WHEN status = 'completed' OR paid_at IS NOT NULL 
          THEN 1 
        END)::integer as paid,
        COUNT(CASE 
          WHEN status = 'pending' AND created_at >= CURRENT_DATE - INTERVAL '30 days' 
          THEN 1 
        END)::integer as unpaid,
        COUNT(CASE 
          WHEN status = 'pending' AND created_at < CURRENT_DATE - INTERVAL '30 days' 
          THEN 1 
        END)::integer as overdue,
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
        COUNT(CASE WHEN status = 'Pending' THEN 1 END)::integer as pending,
        COUNT(CASE WHEN status = 'Solved' THEN 1 END)::integer as resolved,
        COUNT(CASE WHEN status = 'Investigating' THEN 1 END)::integer as "inProgress",
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
        s.name as "planName",
        COUNT(c.child_id)::integer as count,
        COALESCE(SUM(s.price::numeric), 0) as revenue
      FROM subscriptions s
      LEFT JOIN child c ON s.plan_id = c.package_id
      WHERE s.status = 'active'
      GROUP BY s.plan_id, s.name
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
    // Since report table doesn't have time-based check-in, return hourly distribution based on created_at
    const query = `
      WITH hourly_data AS (
        SELECT 
          EXTRACT(HOUR FROM create_date) as hour_num,
          COUNT(*) as count
        FROM report
        WHERE create_date >= $1 AND create_date <= $2
        GROUP BY EXTRACT(HOUR FROM create_date)
      )
      SELECT 
        CASE 
          WHEN hour_num = 0 THEN '12:00 AM'
          WHEN hour_num < 12 THEN LPAD(hour_num::text, 2, '0') || ':00 AM'
          WHEN hour_num = 12 THEN '12:00 PM'
          ELSE LPAD((hour_num - 12)::text, 2, '0') || ':00 PM'
        END as hour,
        count::integer
      FROM hourly_data
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
        startDate.setMonth(0, 1); // January 1st of current year
        break;
      case 'this-month':
      default:
        startDate = new Date();
        startDate.setDate(1); // First day of current month
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
