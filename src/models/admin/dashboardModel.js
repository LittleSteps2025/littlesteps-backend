import pool from "../../config/db.js";

// Get total number of children
export const getTotalChildren = async () => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM child'
  );
  return parseInt(result.rows[0].count) || 0;
};

// Get active parents count
export const getActiveParents = async () => {
  const result = await pool.query(
    `SELECT COUNT(DISTINCT email) as count 
     FROM "user" 
     WHERE role = 'parent'`
  );
  return parseInt(result.rows[0].count) || 0;
};

// Get active teachers count
export const getActiveTeachers = async () => {
  const result = await pool.query(
    `SELECT COUNT(*) as count 
     FROM "user" 
     WHERE role = 'teacher'`
  );
  return parseInt(result.rows[0].count) || 0;
};

// Get active supervisors count
export const getActiveSupervisors = async () => {
  const result = await pool.query(
    `SELECT COUNT(*) as count 
     FROM "user" 
     WHERE role = 'supervisor'`
  );
  return parseInt(result.rows[0].count) || 0;
};

// Get today's check-ins from report table
export const getTodayCheckIns = async () => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM report 
       WHERE DATE(create_date) = CURRENT_DATE`
    );
    return parseInt(result.rows[0].count) || 0;
  } catch (error) {
    // If report table doesn't exist or error occurs, return 0
    console.log('Report table not found or error occurred:', error.message);
    return 0;
  }
};

// Get monthly revenue from payments
export const getMonthlyRevenue = async () => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM payments 
     WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
     AND (status = 'completed' OR paid_at IS NOT NULL)`
  );
  return parseFloat(result.rows[0].total) || 0;
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  const stats = {
    totalChildren: await getTotalChildren(),
    activeParents: await getActiveParents(),
    activeTeachers: await getActiveTeachers(),
    activeSupervisors: await getActiveSupervisors(),
    todayCheckIns: await getTodayCheckIns(),
    monthlyRevenue: await getMonthlyRevenue()
  };
  return stats;
};

// Get recent activities
export const getRecentActivities = async (limit = 10) => {
  try {
    // Combine activities from multiple sources
    const result = await pool.query(
      `
      (
        SELECT 
          r.report_id as activity_id,
          r.teacher_id::text as user_id,
          t.name as user_name,
          'submitted report' as activity_type,
          'report' as type,
          r.create_date as timestamp,
          CONCAT('Report submitted for child ID: ', r.child_id::text) as description
        FROM report r
        LEFT JOIN "user" t ON r.teacher_id = t.user_id
        WHERE r.create_date >= CURRENT_DATE - INTERVAL '7 days'
      )
      UNION ALL
      (
        SELECT 
          p.id as activity_id,
          p.parent_email as user_id,
          u.name as user_name,
          'made payment' as activity_type,
          'payment' as type,
          p.created_at as timestamp,
          CONCAT('Payment of LKR ', p.amount::text) as description
        FROM payments p
        LEFT JOIN "user" u ON p.parent_email = u.email
        WHERE p.created_at >= CURRENT_DATE - INTERVAL '7 days'
      )
      UNION ALL
      (
        SELECT 
          c.complaint_id as activity_id,
          c.parent_email as user_id,
          u.name as user_name,
          'submitted complaint' as activity_type,
          'complaint' as type,
          c.created_at as timestamp,
          c.complaint_type as description
        FROM complaints c
        LEFT JOIN "user" u ON c.parent_email = u.email
        WHERE c.created_at >= CURRENT_DATE - INTERVAL '7 days'
      )
      UNION ALL
      (
        SELECT 
          a.ann_id as activity_id,
          a.user_id::text as user_id,
          u.name as user_name,
          'created announcement' as activity_type,
          'announcement' as type,
          a.created_at as timestamp,
          a.title as description
        FROM announcement a
        LEFT JOIN "user" u ON a.user_id = u.user_id
        WHERE a.created_at >= CURRENT_DATE - INTERVAL '7 days'
      )
      UNION ALL
      (
        SELECT 
          child_id as activity_id,
          'system' as user_id,
          name as user_name,
          'registered child' as activity_type,
          'registration' as type,
          COALESCE(created_at, CURRENT_TIMESTAMP) as timestamp,
          CONCAT('Child ', name, ' registered') as description
        FROM child
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          OR created_at IS NULL
      )
      ORDER BY timestamp DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(row => ({
      id: row.activity_id,
      activity_id: row.activity_id,
      user_id: row.user_id,
      user: row.user_name || 'Unknown User',
      user_name: row.user_name || 'Unknown User',
      action: row.activity_type,
      activity_type: row.activity_type,
      type: row.type,
      timestamp: row.timestamp,
      description: row.description
    }));
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    // Return mock data if query fails
    return [];
  }
};
