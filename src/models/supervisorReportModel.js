import pool from "../config/db.js";

const supervisorReportModel = {
  // Create supervisor_reports table if it doesn't exist
  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS supervisor_reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        report_name VARCHAR(255) NOT NULL,
        report_type ENUM('monthly_summary', 'custom') DEFAULT 'monthly_summary',
        month INT NOT NULL,
        year INT NOT NULL,
        generated_by INT NOT NULL,
        generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        report_data JSON NOT NULL,
        pdf_path VARCHAR(500),
        status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
        UNIQUE KEY unique_monthly_report (month, year, report_type),
        INDEX idx_generated_date (generated_date),
        INDEX idx_month_year (month, year)
      )
    `;

    try {
      await pool.query(query);
      console.log("✅ supervisor_reports table created or verified");
    } catch (error) {
      console.error("Error creating supervisor_reports table:", error);
      throw error;
    }
  },

  // Find all reports
  async findAll() {
    const query = `
      SELECT 
        sr.*,
        u.name as generated_by_name,
        u.email as generated_by_email
      FROM supervisor_reports sr
      LEFT JOIN "user" u ON sr.generated_by = u.user_id
      ORDER BY sr.generated_date DESC
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error finding all supervisor reports:", error);
      throw error;
    }
  },

  // Find report by ID
  async findById(reportId) {
    const query = `
      SELECT 
        sr.*,
        u.name as generated_by_name,
        u.email as generated_by_email
      FROM supervisor_reports sr
      LEFT JOIN "user" u ON sr.generated_by = u.user_id
      WHERE sr.report_id = $1
    `;

    try {
      const result = await pool.query(query, [reportId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding supervisor report by ID:", error);
      throw error;
    }
  },

  // Find reports by month and year
  async findByMonthYear(month, year) {
    const query = `
      SELECT 
        sr.*,
        u.name as generated_by_name,
        u.email as generated_by_email
      FROM supervisor_reports sr
      LEFT JOIN "user" u ON sr.generated_by = u.user_id
      WHERE sr.month = $1 AND sr.year = $2
      ORDER BY sr.generated_date DESC
    `;

    try {
      const result = await pool.query(query, [month, year]);
      return result.rows;
    } catch (error) {
      console.error("Error finding supervisor reports by month/year:", error);
      throw error;
    }
  },

  // Create new report
  async create(reportData) {
    const query = `
      INSERT INTO supervisor_reports 
      (report_name, report_type, month, year, generated_by, report_data, pdf_path, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING report_id
    `;

    try {
      const result = await pool.query(query, [
        reportData.report_name,
        reportData.report_type || "monthly_summary",
        reportData.month,
        reportData.year,
        reportData.generated_by,
        JSON.stringify(reportData.report_data),
        reportData.pdf_path || null,
        reportData.status || "completed",
      ]);

      return await this.findById(result.rows[0].report_id);
    } catch (error) {
      console.error("Error creating supervisor report:", error);
      throw error;
    }
  },

  // Update report status and PDF path
  async updateStatus(reportId, status, pdfPath = null) {
    const query = `
      UPDATE supervisor_reports 
      SET status = $1, pdf_path = $2
      WHERE report_id = $3
    `;

    try {
      await pool.query(query, [status, pdfPath, reportId]);
      return await this.findById(reportId);
    } catch (error) {
      console.error("Error updating supervisor report status:", error);
      throw error;
    }
  },

  // Delete report
  async remove(reportId) {
    const query = "DELETE FROM supervisor_reports WHERE report_id = $1";

    try {
      const report = await this.findById(reportId);
      if (!report) return null;

      await pool.query(query, [reportId]);
      return report;
    } catch (error) {
      console.error("Error deleting supervisor report:", error);
      throw error;
    }
  },

  // Get monthly summary data
  async getMonthlyData(month, year) {
    try {
      // Calculate date range for the month
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
        lastDay
      ).padStart(2, "0")}`;

      console.log(`Fetching data for ${startDate} to ${endDate}`);

      // Get new children admitted in the month with details
      const newChildrenQuery = `
        SELECT 
          child_id,
          name,
          dob,
          parent_id,
          created_at
        FROM child
        WHERE DATE(created_at) BETWEEN $1 AND $2
        ORDER BY created_at DESC
      `;
      const newChildrenResult = await pool.query(newChildrenQuery, [
        startDate,
        endDate,
      ]);

      // Get total children count
      const totalChildrenQuery = `SELECT COUNT(*) as total FROM child`;
      const totalChildrenResult = await pool.query(totalChildrenQuery);

      // Calculate attendance percentage from child records
      // Count children with attendance records in the month
      const attendanceQuery = `
        SELECT 
          COUNT(DISTINCT child_id) as attended_count,
          COUNT(DISTINCT CASE WHEN child_id IS NOT NULL THEN child_id END) as total_count
        FROM child
        WHERE created_at <= $1
      `;
      const attendanceResult = await pool.query(attendanceQuery, [endDate]);
      
      const totalChildren = parseInt(totalChildrenResult.rows[0]?.total) || 0;
      const attendedCount = parseInt(attendanceResult.rows[0]?.attended_count) || 0;
      const attendancePercentage = totalChildren > 0 ? Math.round((attendedCount / totalChildren) * 100) : 0;

      // Get complaints for the month with status breakdown
      const complaintsQuery = `
        SELECT 
          COUNT(*) as total_count,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
          SUM(CASE WHEN status = 'Solved' THEN 1 ELSE 0 END) as solved_count,
          SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_count
        FROM complaints
        WHERE DATE(date) BETWEEN $1 AND $2
      `;
      const complaintsResult = await pool.query(complaintsQuery, [
        startDate,
        endDate,
      ]);

      // Get meetings/appointments for the month with status breakdown
      const meetingsQuery = `
        SELECT 
          COUNT(*) as total_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
        FROM meeting
        WHERE DATE(meeting_date) BETWEEN $1 AND $2
      `;
      const meetingsResult = await pool.query(meetingsQuery, [
        startDate,
        endDate,
      ]);

      // Get events for the month
      const eventsQuery = `
        SELECT 
          event_id,
          topic,
          description,
          TO_CHAR(date, 'YYYY-MM-DD') as date,
          time,
          venue,
          created_time
        FROM event
        WHERE DATE(date) BETWEEN $1 AND $2
        ORDER BY date, time
      `;
      const eventsResult = await pool.query(eventsQuery, [
        startDate,
        endDate,
      ]);

      const newChildren = newChildrenResult.rows;
      const complaints = complaintsResult.rows[0];
      const meetings = meetingsResult.rows[0];
      const events = eventsResult.rows;

      return {
        period: {
          month,
          year,
          startDate,
          endDate,
        },
        children: {
          newAdmissions: newChildren.length,
          totalEnrolled: totalChildren,
          admissionsList: newChildren.map(child => ({
            child_id: child.child_id,
            name: child.name,
            dob: child.dob,
            parent_id: child.parent_id,
            admitted_date: child.created_at
          }))
        },
        complaints: {
          total: parseInt(complaints?.total_count) || 0,
          pending: parseInt(complaints?.pending_count) || 0,
          inProgress: parseInt(complaints?.in_progress_count) || 0,
          solved: parseInt(complaints?.solved_count) || 0,
          closed: parseInt(complaints?.closed_count) || 0,
        },
        meetings: {
          total: parseInt(meetings?.total_count) || 0,
          pending: parseInt(meetings?.pending_count) || 0,
          confirmed: parseInt(meetings?.confirmed_count) || 0,
          cancelled: parseInt(meetings?.cancelled_count) || 0,
        },
        events: {
          total: events.length,
          eventsList: events.map(event => ({
            event_id: event.event_id,
            topic: event.topic,
            description: event.description,
            date: event.date,
            time: event.time,
            venue: event.venue
          }))
        },
        attendance: {
          averageRate: attendancePercentage,
          totalStudents: totalChildren,
          attendedCount: attendedCount
        },
      };
    } catch (error) {
      console.error("Error fetching monthly data:", error);
      throw error;
    }
  },
};

export default supervisorReportModel;