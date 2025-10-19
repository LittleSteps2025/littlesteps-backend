import pool from "../../config/db.js";
import { v4 as uuidv4 } from 'uuid';

// Generate admin report
export const generateReport = async (reportData) => {
  const { name, type, format, file_path, file_size, user_id } = reportData;
  
  // Generate admin report ID with timestamp
  const timestamp = Date.now();
  const admin_report_id = `ARPT-${timestamp}`;
  
  const result = await pool.query(
    `INSERT INTO admin_reports (admin_report_id, name, type, format, file_path, file_size, user_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
     RETURNING *`,
    [admin_report_id, name, type, format, file_path, file_size, user_id]
  );
  
  return result.rows[0];
};

// Get report history with pagination
export const getReportHistory = async (limit = 10, offset = 0, user_id = null) => {
  let query = `
    SELECT 
      ar.admin_report_id,
      ar.name,
      ar.type,
      ar.format,
      ar.file_path,
      ar.file_size,
      ar.created_at,
      u.name as generated_by,
      u.user_id
    FROM admin_reports ar
    LEFT JOIN "user" u ON ar.user_id = u.user_id
  `;
  
  const params = [];
  
  if (user_id) {
    query += ` WHERE ar.user_id = $1`;
    params.push(user_id);
  }
  
  query += ` ORDER BY ar.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  return result.rows.map(row => ({
    admin_report_id: row.admin_report_id,
    name: row.name,
    type: row.type,
    format: row.format,
    file_path: row.file_path,
    size: formatFileSize(row.file_size),
    created_at: row.created_at,
    generated_by: row.generated_by,
    user_id: row.user_id
  }));
};

// Get report by admin_report_id
export const getReportById = async (admin_report_id) => {
  const result = await pool.query(
    `SELECT 
      ar.admin_report_id,
      ar.name,
      ar.type,
      ar.format,
      ar.file_path,
      ar.file_size,
      ar.created_at,
      u.name as generated_by
    FROM admin_reports ar
    LEFT JOIN "user" u ON ar.user_id = u.user_id
    WHERE ar.admin_report_id = $1`,
    [admin_report_id]
  );
  
  return result.rows[0] || null;
};

// Delete report
export const deleteReport = async (admin_report_id) => {
  const result = await pool.query(
    `DELETE FROM admin_reports WHERE admin_report_id = $1 RETURNING *`,
    [admin_report_id]
  );
  
  return result.rows[0];
};

// Get quick stats for MIS
export const getQuickStats = async () => {
  // Get current enrollment
  const enrollmentResult = await pool.query(
    'SELECT COUNT(*) as count FROM child'
  );
  
  // Get monthly attendance average
  const attendanceResult = await pool.query(
    `SELECT 
      COALESCE(
        ROUND(
          (COUNT(DISTINCT r.child_id)::DECIMAL / NULLIF((SELECT COUNT(*) FROM child), 0)) * 100, 
          2
        ), 
        0
      ) as avg_attendance
    FROM report r
    WHERE DATE(r.create_date) >= DATE_TRUNC('month', CURRENT_DATE)
      AND DATE(r.create_date) <= CURRENT_DATE`
  );
  
  // Get monthly revenue
  const revenueResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM payments
     WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
     AND (status = 'completed' OR paid_at IS NOT NULL)`
  );
  
  // Get staff count
  const staffResult = await pool.query(
    `SELECT COUNT(*) as count
     FROM "user"
     WHERE role IN ('teacher', 'supervisor')`
  );
  
  return {
    currentEnrollment: parseInt(enrollmentResult.rows[0].count) || 0,
    monthlyAttendanceAvg: parseFloat(attendanceResult.rows[0].avg_attendance) || 0,
    revenueThisMonth: parseFloat(revenueResult.rows[0].total) || 0,
    staffCount: parseInt(staffResult.rows[0].count) || 0
  };
};

// Get children report data
export const getChildrenReportData = async (startDate, endDate, detailLevel = 'all') => {
  let query = '';
  
  switch (detailLevel) {
    case 'active':
      query = `
        SELECT 
          c.child_id,
          c.name,
          c.age,
          TO_CHAR(c.dob, 'YYYY-MM-DD') as date_of_birth,
          g.name as group_name,
          p.name as package_name,
          COALESCE(c.created_at, CURRENT_DATE) as enrollment_date
        FROM child c
        LEFT JOIN "group" g ON c.group_id = g.group_id
        LEFT JOIN "package" p ON c.package_id = p.package_id
        WHERE COALESCE(c.created_at, CURRENT_DATE) <= $2
        ORDER BY c.name
      `;
      break;
      
    case 'withParents':
      query = `
        SELECT 
          c.child_id,
          c.name as child_name,
          c.age,
          TO_CHAR(c.dob, 'YYYY-MM-DD') as date_of_birth,
          g.name as group_name,
          p.name as package_name,
          u.name as parent_name,
          u.email as parent_email,
          u.phone as parent_phone
        FROM child c
        LEFT JOIN "group" g ON c.group_id = g.group_id
        LEFT JOIN "package" p ON c.package_id = p.package_id
        LEFT JOIN parent pr ON c.child_id = pr.child_id
        LEFT JOIN "user" u ON pr.parent_email = u.email
        WHERE COALESCE(c.created_at, CURRENT_DATE) BETWEEN $1 AND $2
        ORDER BY c.name
      `;
      break;
      
    case 'all':
    default:
      query = `
        SELECT 
          c.child_id,
          c.name,
          c.age,
          TO_CHAR(c.dob, 'YYYY-MM-DD') as date_of_birth,
          c.allergies,
          g.name as group_name,
          p.name as package_name,
          COALESCE(c.created_at, CURRENT_DATE) as enrollment_date,
          (SELECT COUNT(*) FROM report r WHERE r.child_id = c.child_id) as total_reports
        FROM child c
        LEFT JOIN "group" g ON c.group_id = g.group_id
        LEFT JOIN "package" p ON c.package_id = p.package_id
        WHERE COALESCE(c.created_at, CURRENT_DATE) <= $2
        ORDER BY c.name
      `;
  }
  
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows;
};

// Get attendance report data
export const getAttendanceReportData = async (startDate, endDate, groupBy = 'daily') => {
  let query = '';
  
  switch (groupBy) {
    case 'child':
      query = `
        SELECT 
          c.child_id,
          c.name as child_name,
          c.age,
          g.name as group_name,
          COUNT(r.report_id) as total_checkins,
          MIN(r.create_date) as first_checkin,
          MAX(r.create_date) as last_checkin,
          ROUND(COUNT(r.report_id)::DECIMAL / 
            NULLIF(DATE_PART('day', $2::date - $1::date) + 1, 0) * 100, 2) as attendance_rate
        FROM child c
        LEFT JOIN "group" g ON c.group_id = g.group_id
        LEFT JOIN report r ON c.child_id = r.child_id 
          AND DATE(r.create_date) BETWEEN $1 AND $2
        GROUP BY c.child_id, c.name, c.age, g.name
        ORDER BY c.name
      `;
      break;
      
    case 'week':
      query = `
        SELECT 
          DATE_TRUNC('week', r.create_date) as week_start,
          COUNT(DISTINCT r.child_id) as unique_children,
          COUNT(r.report_id) as total_checkins,
          ROUND(AVG(COUNT(r.report_id)) OVER (), 2) as avg_checkins
        FROM report r
        WHERE DATE(r.create_date) BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('week', r.create_date)
        ORDER BY week_start DESC
      `;
      break;
      
    case 'month':
      query = `
        SELECT 
          DATE_TRUNC('month', r.create_date) as month,
          COUNT(DISTINCT r.child_id) as unique_children,
          COUNT(r.report_id) as total_checkins,
          COUNT(DISTINCT DATE(r.create_date)) as active_days
        FROM report r
        WHERE DATE(r.create_date) BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('month', r.create_date)
        ORDER BY month DESC
      `;
      break;
      
    case 'daily':
    default:
      query = `
        SELECT 
          DATE(r.create_date) as date,
          TO_CHAR(r.create_date, 'Day') as day_of_week,
          COUNT(DISTINCT r.child_id) as unique_children,
          COUNT(r.report_id) as total_checkins,
          (SELECT COUNT(*) FROM child) as total_enrolled,
          ROUND((COUNT(DISTINCT r.child_id)::DECIMAL / NULLIF((SELECT COUNT(*) FROM child), 0)) * 100, 2) as attendance_percentage
        FROM report r
        WHERE DATE(r.create_date) BETWEEN $1 AND $2
        GROUP BY DATE(r.create_date)
        ORDER BY date DESC
      `;
  }
  
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows;
};

// Get subscriptions report data
export const getSubscriptionsReportData = async (startDate, endDate, detailLevel = 'all') => {
  let query = '';
  
  switch (detailLevel) {
    case 'active':
      query = `
        SELECT 
          plan_id,
          name,
          type,
          duration,
          days,
          price,
          services,
          status,
          created_at,
          updated_at
        FROM subscriptions
        WHERE status = 'active'
        ORDER BY created_at DESC
      `;
      break;
      
    case 'expired':
      query = `
        SELECT 
          plan_id,
          name,
          type,
          duration,
          price,
          status,
          created_at,
          updated_at
        FROM subscriptions
        WHERE status = 'inactive'
        ORDER BY updated_at DESC
      `;
      break;
      
    case 'all':
    default:
      query = `
        SELECT 
          s.plan_id,
          s.name,
          s.type,
          s.duration,
          s.days,
          s.price,
          s.services,
          s.status,
          s.created_at,
          s.updated_at,
          COUNT(DISTINCT c.child_id) as enrolled_children
        FROM subscriptions s
        LEFT JOIN child c ON c.package_id = s.plan_id
        GROUP BY s.plan_id, s.name, s.type, s.duration, s.days, s.price, s.services, s.status, s.created_at, s.updated_at
        ORDER BY s.created_at DESC
      `;
  }
  
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows;
};

// Get payments report data
export const getPaymentsReportData = async (startDate, endDate, detailLevel = 'summary') => {
  let query = '';
  
  switch (detailLevel) {
    case 'detailed':
      query = `
        SELECT 
          p.id as payment_id,
          p.parent_email,
          u.name as parent_name,
          c.name as child_name,
          p.amount,
          CASE 
            WHEN p.status = 'completed' OR p.paid_at IS NOT NULL THEN 'paid'
            WHEN p.status = 'pending' THEN 'unpaid'
            ELSE p.status
          END as payment_status,
          p.payment_method,
          p.description,
          p.created_at,
          p.paid_at,
          CASE 
            WHEN p.paid_at IS NOT NULL THEN EXTRACT(DAY FROM p.paid_at - p.created_at)
            ELSE EXTRACT(DAY FROM CURRENT_DATE - p.created_at)
          END as days_to_payment
        FROM payments p
        LEFT JOIN "user" u ON p.parent_email = u.email
        LEFT JOIN parent pr ON p.parent_email = pr.parent_email
        LEFT JOIN child c ON pr.child_id = c.child_id
        WHERE DATE(p.created_at) BETWEEN $1 AND $2
        ORDER BY p.created_at DESC
      `;
      break;
      
    case 'unpaid':
      query = `
        SELECT 
          p.id as payment_id,
          p.parent_email,
          u.name as parent_name,
          c.name as child_name,
          p.amount,
          p.status,
          p.created_at,
          EXTRACT(DAY FROM CURRENT_DATE - p.created_at) as days_overdue
        FROM payments p
        LEFT JOIN "user" u ON p.parent_email = u.email
        LEFT JOIN parent pr ON p.parent_email = pr.parent_email
        LEFT JOIN child c ON pr.child_id = c.child_id
        WHERE p.status = 'pending'
        AND DATE(p.created_at) BETWEEN $1 AND $2
        ORDER BY days_overdue DESC
      `;
      break;
      
    case 'methods':
      query = `
        SELECT 
          COALESCE(p.payment_method, 'Not Specified') as payment_method,
          COUNT(*) as transaction_count,
          SUM(p.amount) as total_amount,
          AVG(p.amount) as average_amount,
          COUNT(CASE WHEN p.status = 'completed' OR p.paid_at IS NOT NULL THEN 1 END) as successful_count
        FROM payments p
        WHERE DATE(p.created_at) BETWEEN $1 AND $2
        GROUP BY p.payment_method
        ORDER BY total_amount DESC
      `;
      break;
      
    case 'summary':
    default:
      query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'completed' OR paid_at IS NOT NULL THEN amount ELSE 0 END) as total_paid,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_unpaid,
          COUNT(CASE WHEN status = 'completed' OR paid_at IS NOT NULL THEN 1 END) as paid_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as unpaid_count,
          AVG(amount) as average_transaction,
          MAX(amount) as highest_payment,
          MIN(amount) as lowest_payment
        FROM payments
        WHERE DATE(created_at) BETWEEN $1 AND $2
      `;
  }
  
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows;
};

// Get complaints report data
export const getComplaintsReportData = async (startDate, endDate, detailLevel = 'all') => {
  let query = '';
  const params = [startDate, endDate];
  
  switch (detailLevel) {
    case 'pending':
      query = `
        SELECT 
          c.complaint_id,
          c.parent_email,
          u.name as parent_name,
          c.complaint_type,
          c.complaint as description,
          c.status,
          c.created_at,
          EXTRACT(DAY FROM CURRENT_DATE - c.created_at) as days_pending
        FROM complaints c
        LEFT JOIN "user" u ON c.parent_email = u.email
        WHERE c.status = 'pending'
        AND DATE(c.created_at) BETWEEN $1 AND $2
        ORDER BY c.created_at ASC
      `;
      break;
      
    case 'resolved':
      query = `
        SELECT 
          c.complaint_id,
          c.parent_email,
          u.name as parent_name,
          c.complaint_type,
          c.complaint as description,
          c.status,
          c.created_at
        FROM complaints c
        LEFT JOIN "user" u ON c.parent_email = u.email
        WHERE c.status = 'resolved'
        AND DATE(c.created_at) BETWEEN $1 AND $2
        ORDER BY c.created_at DESC
      `;
      break;
      
    case 'inProgress':
      query = `
        SELECT 
          c.complaint_id,
          c.parent_email,
          u.name as parent_name,
          c.complaint_type,
          c.complaint as description,
          c.status,
          c.created_at,
          EXTRACT(DAY FROM CURRENT_DATE - c.created_at) as days_in_progress
        FROM complaints c
        LEFT JOIN "user" u ON c.parent_email = u.email
        WHERE c.status = 'in_progress'
        AND DATE(c.created_at) BETWEEN $1 AND $2
        ORDER BY c.created_at ASC
      `;
      break;
      
    case 'all':
    default:
      query = `
        SELECT 
          c.complaint_id,
          c.parent_email,
          u.name as parent_name,
          c.complaint_type,
          c.complaint as description,
          c.status,
          c.created_at,
          CASE 
            WHEN c.status = 'resolved' THEN 'Resolved'
            WHEN c.status = 'in_progress' THEN 'In Progress'
            ELSE 'Pending'
          END as status_label
        FROM complaints c
        LEFT JOIN "user" u ON c.parent_email = u.email
        WHERE DATE(c.created_at) BETWEEN $1 AND $2
        ORDER BY c.created_at DESC
      `;
  }
  
  const result = await pool.query(query, params);
  
  // Get summary statistics
  const summaryQuery = `
    SELECT 
      complaint_type,
      COUNT(*) as count,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count
    FROM complaints
    WHERE DATE(created_at) BETWEEN $1 AND $2
    GROUP BY complaint_type
    ORDER BY count DESC
  `;
  
  const summaryResult = await pool.query(summaryQuery, params);
  
  return {
    complaints: result.rows,
    summary: summaryResult.rows
  };
};

// Get announcements report data
export const getAnnouncementsReportData = async (startDate, endDate, detailLevel = 'all') => {
  let query = '';
  const params = [startDate, endDate];
  
  switch (detailLevel) {
    case 'general':
      query = `
        SELECT 
          a.ann_id,
          a.title,
          a.content,
          a.user_id,
          u.name as published_by,
          u.role as publisher_role,
          a.created_at,
          a.published_date,
          a.published_time
        FROM announcement a
        LEFT JOIN "user" u ON a.user_id = u.user_id
        WHERE DATE(a.created_at) BETWEEN $1 AND $2
        AND a.title NOT LIKE '%Event%'
        AND a.title NOT LIKE '%Urgent%'
        ORDER BY a.created_at DESC
      `;
      break;
      
    case 'event':
      query = `
        SELECT 
          a.ann_id,
          a.title,
          a.content,
          a.user_id,
          u.name as published_by,
          a.created_at,
          a.published_date,
          a.published_time
        FROM announcement a
        LEFT JOIN "user" u ON a.user_id = u.user_id
        WHERE DATE(a.created_at) BETWEEN $1 AND $2
        AND (a.title LIKE '%Event%' OR a.content LIKE '%event%')
        ORDER BY a.published_date DESC
      `;
      break;
      
    case 'urgent':
      query = `
        SELECT 
          a.ann_id,
          a.title,
          a.content,
          a.user_id,
          u.name as published_by,
          a.created_at,
          a.published_date,
          a.published_time
        FROM announcement a
        LEFT JOIN "user" u ON a.user_id = u.user_id
        WHERE DATE(a.created_at) BETWEEN $1 AND $2
        AND (a.title LIKE '%Urgent%' OR a.title LIKE '%Important%')
        ORDER BY a.created_at DESC
      `;
      break;
      
    case 'all':
    default:
      query = `
        SELECT 
          a.ann_id,
          a.title,
          a.content,
          a.user_id,
          u.name as published_by,
          u.role as publisher_role,
          a.created_at,
          a.published_date,
          a.published_time,
          LENGTH(a.content) as content_length
        FROM announcement a
        LEFT JOIN "user" u ON a.user_id = u.user_id
        WHERE DATE(a.created_at) BETWEEN $1 AND $2
        ORDER BY a.created_at DESC
      `;
  }
  
  const result = await pool.query(query, params);
  return result.rows;
};

// Get staff report data
export const getStaffReportData = async (startDate, endDate, detailLevel = 'all') => {
  let query = '';
  const params = [startDate, endDate];
  
  switch (detailLevel) {
    case 'teachers':
      query = `
        SELECT 
          u.user_id,
          u.name,
          u.email,
          u.phone,
          u.role,
          COUNT(DISTINCT r.report_id) as reports_submitted,
          COUNT(DISTINCT a.ann_id) as announcements_created,
          MAX(r.create_date) as last_report_date,
          (SELECT COUNT(DISTINCT c.child_id) 
           FROM child c 
           JOIN "group" g ON c.group_id = g.group_id 
           JOIN teacher t ON g.main_teacher_id = t.teacher_id 
           WHERE t.user_id = u.user_id) as children_count
        FROM "user" u
        LEFT JOIN report r ON u.user_id = r.teacher_id 
          AND DATE(r.create_date) BETWEEN $1 AND $2
        LEFT JOIN announcement a ON u.user_id = a.user_id 
          AND DATE(a.created_at) BETWEEN $1 AND $2
        WHERE u.role = 'teacher'
        GROUP BY u.user_id, u.name, u.email, u.phone, u.role
        ORDER BY u.name
      `;
      break;
      
    case 'supervisors':
      query = `
        SELECT 
          u.user_id,
          u.name,
          u.email,
          u.phone,
          u.role,
          COUNT(DISTINCT a.ann_id) as announcements_created,
          MAX(a.created_at) as last_announcement_date
        FROM "user" u
        LEFT JOIN announcement a ON u.user_id = a.user_id 
          AND DATE(a.created_at) BETWEEN $1 AND $2
        WHERE u.role = 'supervisor'
        GROUP BY u.user_id, u.name, u.email, u.phone, u.role
        ORDER BY u.name
      `;
      break;
      
    case 'admin':
      query = `
        SELECT 
          u.user_id,
          u.name,
          u.email,
          u.phone,
          u.role,
          COUNT(DISTINCT a.ann_id) as announcements_created,
          COUNT(DISTINCT ar.admin_report_id) as reports_generated
        FROM "user" u
        LEFT JOIN announcement a ON u.user_id = a.user_id 
          AND DATE(a.created_at) BETWEEN $1 AND $2
        LEFT JOIN admin_reports ar ON u.user_id = ar.user_id 
          AND DATE(ar.created_at) BETWEEN $1 AND $2
        WHERE u.role = 'admin'
        GROUP BY u.user_id, u.name, u.email, u.phone, u.role
        ORDER BY u.name
      `;
      break;
      
    case 'all':
    default:
      query = `
        SELECT 
          u.user_id,
          u.name,
          u.email,
          u.phone,
          u.role,
          COUNT(DISTINCT r.report_id) as reports_submitted,
          COUNT(DISTINCT a.ann_id) as announcements_created,
          MAX(COALESCE(r.create_date, a.created_at)) as last_activity,
          CASE 
            WHEN MAX(COALESCE(r.create_date, a.created_at)) >= CURRENT_DATE - INTERVAL '7 days' THEN 'Active'
            WHEN MAX(COALESCE(r.create_date, a.created_at)) >= CURRENT_DATE - INTERVAL '30 days' THEN 'Moderate'
            ELSE 'Inactive'
          END as activity_level
        FROM "user" u
        LEFT JOIN report r ON u.user_id = r.teacher_id 
          AND DATE(r.create_date) BETWEEN $1 AND $2
        LEFT JOIN announcement a ON u.user_id = a.user_id 
          AND DATE(a.created_at) BETWEEN $1 AND $2
        WHERE u.role IN ('teacher', 'supervisor', 'admin')
        GROUP BY u.user_id, u.name, u.email, u.phone, u.role
        ORDER BY u.role, u.name
      `;
  }
  
  const result = await pool.query(query, params);
  return result.rows;
};

// Get parents report data
export const getParentsReportData = async (startDate, endDate, detailLevel = 'all') => {
  let query = '';
  const params = [startDate, endDate];
  
  switch (detailLevel) {
    case 'withChildren':
      query = `
        SELECT 
          u.user_id,
          u.name as parent_name,
          u.email,
          u.phone,
          c.child_id,
          c.name as child_name,
          c.age as child_age,
          g.name as child_group,
          p.name as child_package
        FROM "user" u
        JOIN parent pr ON u.email = pr.parent_email
        JOIN child c ON pr.child_id = c.child_id
        LEFT JOIN "group" g ON c.group_id = g.group_id
        LEFT JOIN "package" p ON c.package_id = p.package_id
        WHERE u.role = 'parent'
        ORDER BY u.name, c.name
      `;
      break;
      
    case 'withPayments':
      query = `
        SELECT 
          u.user_id,
          u.name as parent_name,
          u.email,
          u.phone,
          COUNT(DISTINCT c.child_id) as children_count,
          COUNT(py.id) as total_payments,
          SUM(CASE WHEN py.status = 'completed' OR py.paid_at IS NOT NULL THEN py.amount ELSE 0 END) as total_paid,
          SUM(CASE WHEN py.status = 'pending' THEN py.amount ELSE 0 END) as total_unpaid,
          CASE 
            WHEN SUM(CASE WHEN py.status = 'pending' THEN 1 ELSE 0 END) > 0 THEN 'Has Pending'
            WHEN COUNT(py.id) > 0 THEN 'All Paid'
            ELSE 'No Payments'
          END as payment_status
        FROM "user" u
        LEFT JOIN parent pr ON u.email = pr.parent_email
        LEFT JOIN child c ON pr.child_id = c.child_id
        LEFT JOIN payments py ON u.email = py.parent_email
          AND DATE(py.created_at) BETWEEN $1 AND $2
        WHERE u.role = 'parent'
        GROUP BY u.user_id, u.name, u.email, u.phone
        ORDER BY u.name
      `;
      break;
      
    case 'complete':
      query = `
        SELECT 
          u.user_id,
          u.name as parent_name,
          u.email,
          u.phone,
          COUNT(DISTINCT c.child_id) as children_count,
          STRING_AGG(DISTINCT c.name, ', ') as children_names,
          COUNT(py.id) as total_payments,
          SUM(CASE WHEN py.status = 'completed' OR py.paid_at IS NOT NULL THEN py.amount ELSE 0 END) as total_paid,
          SUM(CASE WHEN py.status = 'pending' THEN py.amount ELSE 0 END) as total_unpaid,
          COUNT(DISTINCT comp.complaint_id) as total_complaints,
          MAX(comp.created_at) as last_complaint_date
        FROM "user" u
        LEFT JOIN parent pr ON u.email = pr.parent_email
        LEFT JOIN child c ON pr.child_id = c.child_id
        LEFT JOIN payments py ON u.email = py.parent_email
        LEFT JOIN complaints comp ON u.email = comp.parent_email
          AND DATE(comp.created_at) BETWEEN $1 AND $2
        WHERE u.role = 'parent'
        GROUP BY u.user_id, u.name, u.email, u.phone
        ORDER BY u.name
      `;
      break;
      
    case 'all':
    default:
      query = `
        SELECT 
          u.user_id,
          u.name as parent_name,
          u.email,
          u.phone,
          COUNT(DISTINCT c.child_id) as children_count,
          STRING_AGG(DISTINCT c.name, ', ') as children_names
        FROM "user" u
        LEFT JOIN parent pr ON u.email = pr.parent_email
        LEFT JOIN child c ON pr.child_id = c.child_id
        WHERE u.role = 'parent'
        GROUP BY u.user_id, u.name, u.email, u.phone
        ORDER BY u.name
      `;
  }
  
  const result = await pool.query(query, params);
  return result.rows;
};

// Get MIS summary report data
export const getMISReportData = async (startDate, endDate) => {
  // Get comprehensive statistics
  const stats = await getQuickStats();
  
  // Get children data
  const childrenData = await pool.query(`
    SELECT 
      COUNT(*) as total_children,
      AVG(age) as average_age,
      COUNT(DISTINCT group_id) as active_groups
    FROM child
  `);
  
  // Get attendance summary
  const attendanceData = await pool.query(`
    SELECT 
      DATE(r.create_date) as date,
      COUNT(DISTINCT r.child_id) as unique_children,
      COUNT(r.report_id) as total_checkins
    FROM report r
    WHERE DATE(r.create_date) BETWEEN $1 AND $2
    GROUP BY DATE(r.create_date)
    ORDER BY date DESC
    LIMIT 30
  `, [startDate, endDate]);
  
  // Get financial summary
  const financialData = await pool.query(`
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN status = 'completed' OR paid_at IS NOT NULL THEN amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
      AVG(amount) as average_transaction
    FROM payments
    WHERE DATE(created_at) BETWEEN $1 AND $2
  `, [startDate, endDate]);
  
  // Get complaints summary
  const complaintsData = await pool.query(`
    SELECT 
      COUNT(*) as total_complaints,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
    FROM complaints
    WHERE DATE(created_at) BETWEEN $1 AND $2
  `, [startDate, endDate]);
  
  // Get staff summary
  const staffData = await pool.query(`
    SELECT 
      role,
      COUNT(*) as count
    FROM "user"
    WHERE role IN ('teacher', 'supervisor', 'admin')
    GROUP BY role
  `);
  
  // Get subscription summary
  const subscriptionData = await pool.query(`
    SELECT 
      COUNT(*) as total_plans,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_plans,
      SUM(CASE WHEN status = 'active' THEN price::numeric ELSE 0 END) as total_active_value
    FROM subscriptions
  `);
  
  return {
    overview: {
      ...stats,
      report_period: {
        start: startDate,
        end: endDate
      }
    },
    children: childrenData.rows[0],
    attendance: {
      daily: attendanceData.rows,
      summary: {
        total_days: attendanceData.rows.length,
        avg_daily_attendance: attendanceData.rows.length > 0 
          ? Math.round(attendanceData.rows.reduce((sum, row) => sum + parseInt(row.unique_children), 0) / attendanceData.rows.length)
          : 0
      }
    },
    financial: financialData.rows[0],
    complaints: complaintsData.rows[0],
    staff: staffData.rows,
    subscriptions: subscriptionData.rows[0]
  };
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default {
  generateReport,
  getReportHistory,
  getReportById,
  deleteReport,
  getQuickStats,
  getChildrenReportData,
  getAttendanceReportData,
  getSubscriptionsReportData,
  getPaymentsReportData,
  getComplaintsReportData,
  getAnnouncementsReportData,
  getStaffReportData,
  getParentsReportData,
  getMISReportData
};
