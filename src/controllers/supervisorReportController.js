import supervisorReportModel from '../models/supervisorReportModel.js';

// Get all supervisor reports (dynamically generate for last 12 months)
export const getAllReports = async (req, res) => {
  try {
    const reports = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Generate reports for the last 12 months
    for (let i = 0; i < 12; i++) {
      let month = currentMonth - i;
      let year = currentYear;

      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      try {
        const monthlyData = await supervisorReportModel.getMonthlyData(month, year);
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[month - 1];

        reports.push({
          report_id: `${year}-${month}`,
          report_name: `Monthly Summary Report - ${monthName} ${year}`,
          report_type: 'monthly_summary',
          month: month,
          year: year,
          generated_date: new Date().toISOString(),
          generated_by: null,
          generated_by_name: 'System',
          report_data: monthlyData,
          status: 'completed',
          pdf_path: null
        });
      } catch (error) {
        console.error(`Error generating report for ${month}/${year}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      data: reports,
      message: 'Supervisor reports retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting supervisor reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supervisor reports',
      error: error.message
    });
  }
};

// Get report by ID (month-year format like "2025-10")
export const getReportById = async (req, res) => {
  try {
    const { report_id } = req.params;
    
    // Parse report_id format: "year-month"
    const [year, month] = report_id.split('-').map(Number);
    
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format. Expected format: YYYY-M'
      });
    }

    const monthlyData = await supervisorReportModel.getMonthlyData(month, year);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[month - 1];

    const report = {
      report_id: `${year}-${month}`,
      report_name: `Monthly Summary Report - ${monthName} ${year}`,
      report_type: 'monthly_summary',
      month: month,
      year: year,
      generated_date: new Date().toISOString(),
      generated_by: null,
      generated_by_name: 'System',
      report_data: monthlyData,
      status: 'completed',
      pdf_path: null
    };
    
    res.status(200).json({
      success: true,
      data: report,
      message: 'Supervisor report retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting supervisor report by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supervisor report',
      error: error.message
    });
  }
};

// Get reports by month and year
export const getReportsByMonthYear = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    if (parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12'
      });
    }

    const monthlyData = await supervisorReportModel.getMonthlyData(parsedMonth, parsedYear);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[parsedMonth - 1];

    const report = {
      report_id: `${parsedYear}-${parsedMonth}`,
      report_name: `Monthly Summary Report - ${monthName} ${parsedYear}`,
      report_type: 'monthly_summary',
      month: parsedMonth,
      year: parsedYear,
      generated_date: new Date().toISOString(),
      generated_by: null,
      generated_by_name: 'System',
      report_data: monthlyData,
      status: 'completed',
      pdf_path: null
    };
    
    res.status(200).json({
      success: true,
      data: [report],
      message: 'Supervisor reports retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting supervisor reports by month/year:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supervisor reports',
      error: error.message
    });
  }
};

// Generate monthly summary report (no longer saves to database)
export const generateMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    // Validate required fields
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    // Validate month (1-12)
    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12'
      });
    }
    
    // Get monthly data
    console.log(`Generating monthly report for ${month}/${year}...`);
    const monthlyData = await supervisorReportModel.getMonthlyData(month, year);
    
    // Create month name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[month - 1];
    
    const newReport = {
      report_id: `${year}-${month}`,
      report_name: `Monthly Summary Report - ${monthName} ${year}`,
      report_type: 'monthly_summary',
      month: parseInt(month),
      year: parseInt(year),
      generated_date: new Date().toISOString(),
      generated_by: null,
      generated_by_name: 'System',
      report_data: monthlyData,
      status: 'completed',
      pdf_path: null
    };
    
    res.status(201).json({
      success: true,
      data: newReport,
      message: 'Monthly report generated successfully'
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report',
      error: error.message
    });
  }
};

// Get monthly data (preview without saving)
export const getMonthlyData = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    // Validate month (1-12)
    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12'
      });
    }
    
    const monthlyData = await supervisorReportModel.getMonthlyData(parseInt(month), parseInt(year));
    
    res.status(200).json({
      success: true,
      data: monthlyData,
      message: 'Monthly data retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting monthly data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly data',
      error: error.message
    });
  }
};

// Delete report (not applicable for dynamic reports)
export const deleteReport = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Reports are generated dynamically and cannot be deleted'
    });
  } catch (error) {
    console.error('Error deleting supervisor report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supervisor report',
      error: error.message
    });
  }
};

// Update report PDF path (not applicable for dynamic reports)
export const updateReportPdf = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'PDF generation for dynamic reports coming soon'
    });
  } catch (error) {
    console.error('Error updating report PDF path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report PDF path',
      error: error.message
    });
  }
};
