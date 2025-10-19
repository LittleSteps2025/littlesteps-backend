import db from '../config/db.js';

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
      await db.query(query);
      console.log('✅ supervisor_reports table created or verified');
    } catch (error) {
      console.error('Error creating supervisor_reports table:', error);
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
      LEFT JOIN users u ON sr.generated_by = u.user_id
      ORDER BY sr.generated_date DESC
    `;
    
    try {
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Error finding all supervisor reports:', error);
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
      LEFT JOIN users u ON sr.generated_by = u.user_id
      WHERE sr.report_id = ?
    `;
    
    try {
      const [rows] = await db.query(query, [reportId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding supervisor report by ID:', error);
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
      LEFT JOIN users u ON sr.generated_by = u.user_id
      WHERE sr.month = ? AND sr.year = ?
      ORDER BY sr.generated_date DESC
    `;
    
    try {
      const [rows] = await db.query(query, [month, year]);
      return rows;
    } catch (error) {
      console.error('Error finding supervisor reports by month/year:', error);
      throw error;
    }
  },

  // Create new report
  async create(reportData) {
    const query = `
      INSERT INTO supervisor_reports 
      (report_name, report_type, month, year, generated_by, report_data, pdf_path, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.query(query, [
        reportData.report_name,
        reportData.report_type || 'monthly_summary',
        reportData.month,
        reportData.year,
        reportData.generated_by,
        JSON.stringify(reportData.report_data),
        reportData.pdf_path || null,
        reportData.status || 'completed'
      ]);
      
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating supervisor report:', error);
      throw error;
    }
  },

  // Update report status and PDF path
  async updateStatus(reportId, status, pdfPath = null) {
    const query = `
      UPDATE supervisor_reports 
      SET status = ?, pdf_path = ?
      WHERE report_id = ?
    `;
    
    try {
      await db.query(query, [status, pdfPath, reportId]);
      return await this.findById(reportId);
    } catch (error) {
      console.error('Error updating supervisor report status:', error);
      throw error;
    }
  },

  // Delete report
  async remove(reportId) {
    const query = 'DELETE FROM supervisor_reports WHERE report_id = ?';
    
    try {
      const report = await this.findById(reportId);
      if (!report) return null;
      
      await db.query(query, [reportId]);
      return report;
    } catch (error) {
      console.error('Error deleting supervisor report:', error);
      throw error;
    }
  },

  // Get monthly summary data
  async getMonthlyData(month, year) {
    try {
      // Calculate date range for the month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      console.log(`Fetching data for ${startDate} to ${endDate}`);

      // Get new children admitted in the month
      const newChildrenQuery = `
        SELECT COUNT(*) as count
        FROM children
        WHERE DATE(created_at) BETWEEN $1 AND $2
      `;
      const newChildrenResult = await db.query(newChildrenQuery, [startDate, endDate]);

      // Get total children count
      const totalChildrenQuery = `SELECT COUNT(*) as total FROM children`;
      const totalChildrenResult = await db.query(totalChildrenQuery);

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
      const complaintsResult = await db.query(complaintsQuery, [startDate, endDate]);

      // Get meetings/appointments for the month with status breakdown
      const meetingsQuery = `
        SELECT 
          COUNT(*) as total_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
        FROM meetings
        WHERE DATE(meeting_date) BETWEEN $1 AND $2
      `;
      const meetingsResult = await db.query(meetingsQuery, [startDate, endDate]);

      // Calculate average attendance (mock data - replace with actual attendance table if available)
      const averageAttendance = 85; // Placeholder

      const newChildren = newChildrenResult.rows[0];
      const totalChildren = totalChildrenResult.rows[0];
      const complaints = complaintsResult.rows[0];
      const meetings = meetingsResult.rows[0];

      return {
        period: {
          month,
          year,
          startDate,
          endDate
        },
        children: {
          newAdmissions: parseInt(newChildren?.count) || 0,
          totalEnrolled: parseInt(totalChildren?.total) || 0
        },
        complaints: {
          total: parseInt(complaints?.total_count) || 0,
          pending: parseInt(complaints?.pending_count) || 0,
          inProgress: parseInt(complaints?.in_progress_count) || 0,
          solved: parseInt(complaints?.solved_count) || 0,
          closed: parseInt(complaints?.closed_count) || 0
        },
        meetings: {
          total: parseInt(meetings?.total_count) || 0,
          pending: parseInt(meetings?.pending_count) || 0,
          confirmed: parseInt(meetings?.confirmed_count) || 0,
          cancelled: parseInt(meetings?.cancelled_count) || 0
        },
        attendance: {
          averageRate: averageAttendance,
          totalStudents: parseInt(totalChildren?.total) || 0
        }
      };
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      throw error;
    }
  }
};

export default supervisorReportModel;
