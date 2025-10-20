import * as ReportsModel from "../../models/admin/reportsModel.js";
import PDFDocument from 'pdfkit';
import { createObjectCsvStringifier } from 'csv-writer';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../../../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Generate report
export const generateReport = async (req, res) => {
  try {
    const { reportType, dateRange, format, groupBy, detailLevel } = req.body;
    // Use user_id from auth if available, otherwise use default (1 = system/admin)
    const user_id = req.user?.user_id || 1;

    if (!reportType || !dateRange || !format) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reportType, dateRange, format'
      });
    }

    const { start, end } = dateRange;

    // Get report data based on type
    let reportData;
    let reportName;

    switch (reportType) {
      case 'children':
        reportData = await ReportsModel.getChildrenReportData(start, end, detailLevel);
        reportName = `Child Details Report (${detailLevel || 'all'})`;
        break;
      case 'attendance':
        reportData = await ReportsModel.getAttendanceReportData(start, end, groupBy);
        reportName = `Attendance Report (${groupBy || 'daily'})`;
        break;
      case 'subscriptions':
        reportData = await ReportsModel.getSubscriptionsReportData(start, end, detailLevel);
        reportName = `Subscriptions Report (${detailLevel || 'all'})`;
        break;
      case 'payments':
        reportData = await ReportsModel.getPaymentsReportData(start, end, detailLevel);
        reportName = `Payment Management Report (${detailLevel || 'summary'})`;
        break;
      case 'complaints':
        reportData = await ReportsModel.getComplaintsReportData(start, end, detailLevel);
        reportName = `Complaints Report (${detailLevel || 'all'})`;
        break;
      case 'announcements':
        reportData = await ReportsModel.getAnnouncementsReportData(start, end, detailLevel);
        reportName = `Announcements Report (${detailLevel || 'all'})`;
        break;
      case 'staff':
        reportData = await ReportsModel.getStaffReportData(start, end, detailLevel);
        reportName = `Staff Report (${detailLevel || 'all'})`;
        break;
      case 'parents':
        reportData = await ReportsModel.getParentsReportData(start, end, detailLevel);
        reportName = `Parents Report (${detailLevel || 'all'})`;
        break;
      case 'mis':
        reportData = await ReportsModel.getMISReportData(start, end);
        reportName = 'MIS Summary Report';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Generate file based on format
    let file_path;
    let file_size;

    if (format === 'pdf') {
      const result = await generatePDFReport(reportData, reportName, start, end, reportType);
      file_path = result.file_path;
      file_size = result.file_size;
    } else if (format === 'csv') {
      const result = await generateCSVReport(reportData, reportName, reportType);
      file_path = result.file_path;
      file_size = result.file_size;
    } else if (format === 'excel') {
      // For now, use CSV format (you can add Excel library later)
      const result = await generateCSVReport(reportData, reportName, reportType);
      file_path = result.file_path;
      file_size = result.file_size;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: pdf, csv, excel'
      });
    }

    // Save report metadata to database
    const report = await ReportsModel.generateReport({
      name: reportName,
      type: reportType,
      format: format,
      file_path: file_path,
      file_size: file_size,
      user_id: user_id
    });

    // Generate download URL
    const download_url = `${req.protocol}://${req.get('host')}/api/admin/reports/download/${report.admin_report_id}`;

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: {
        admin_report_id: report.admin_report_id,
        name: report.name,
        type: report.type,
        format: report.format,
        download_url: download_url,
        created_at: report.created_at
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

// Get report history
export const getReportHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const user_id = req.query.user_id || null;

    const reports = await ReportsModel.getReportHistory(limit, offset, user_id);

    // Add download URLs
    const reportsWithUrls = reports.map(report => ({
      ...report,
      download_url: `${req.protocol}://${req.get('host')}/api/admin/reports/download/${report.admin_report_id}`
    }));

    res.json({
      success: true,
      message: 'Report history retrieved successfully',
      data: reportsWithUrls
    });
  } catch (error) {
    console.error('Error fetching report history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report history',
      error: error.message
    });
  }
};

// Download report
export const downloadReport = async (req, res) => {
  try {
    const { adminReportId } = req.params;

    const report = await ReportsModel.getReportById(adminReportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const filePath = path.join(reportsDir, path.basename(report.file_path));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', getContentType(report.format));
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(report.file_path)}"`);
    res.setHeader('Content-Length', report.file_size);

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report',
      error: error.message
    });
  }
};

// Get quick stats
export const getQuickStats = async (req, res) => {
  try {
    const stats = await ReportsModel.getQuickStats();

    res.json({
      success: true,
      message: 'Quick stats retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick stats',
      error: error.message
    });
  }
};

// Export all data
export const exportAllData = async (req, res) => {
  try {
    const { format } = req.body;
    // Use user_id from auth if available, otherwise use default (1 = system/admin)
    const user_id = req.user?.user_id || 1;

    // Get all data types
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];

    console.log('Exporting all data from', startDate, 'to', endDate);

    const children = await ReportsModel.getChildrenReportData(startDate, endDate, 'all');
    const attendance = await ReportsModel.getAttendanceReportData(startDate, endDate, 'daily');
    const subscriptions = await ReportsModel.getSubscriptionsReportData(startDate, endDate, 'all');
    const payments = await ReportsModel.getPaymentsReportData(startDate, endDate, 'detailed');
    const complaints = await ReportsModel.getComplaintsReportData(startDate, endDate, 'all');
    const announcements = await ReportsModel.getAnnouncementsReportData(startDate, endDate, 'all');
    const staff = await ReportsModel.getStaffReportData(startDate, endDate, 'all');
    const parents = await ReportsModel.getParentsReportData(startDate, endDate, 'all');
    const mis = await ReportsModel.getMISReportData(startDate, endDate);

    const allData = {
      children,
      attendance,
      subscriptions,
      payments,
      complaints,
      announcements,
      staff,
      parents,
      mis
    };

    // Generate comprehensive CSV
    const timestamp = Date.now();
    const fileName = `export_all_data_${timestamp}.csv`;
    const filePath = path.join(reportsDir, fileName);

    // Create comprehensive summary CSV
    const csvContent = `Little Steps Management System - Complete Data Export\n` +
      `Export Date: ${new Date().toISOString()}\n` +
      `Period: ${startDate} to ${endDate}\n\n` +
      `Export Type,Data Count,Status\n` +
      `Children Records,${children.length},Exported\n` +
      `Attendance Records,${attendance.length},Exported\n` +
      `Subscription Plans,${subscriptions.length},Exported\n` +
      `Payment Transactions,${payments.length},Exported\n` +
      `Complaints,${complaints.complaints?.length || 0},Exported\n` +
      `Announcements,${announcements.length},Exported\n` +
      `Staff Members,${staff.length},Exported\n` +
      `Parent Accounts,${parents.length},Exported\n` +
      `MIS Summary,1,Exported\n\n` +
      `Total Records Exported: ${children.length + attendance.length + subscriptions.length + payments.length + (complaints.complaints?.length || 0) + announcements.length + staff.length + parents.length + 1}\n`;

    fs.writeFileSync(filePath, csvContent);
    const file_size = fs.statSync(filePath).size;

    // Save to database
    const report = await ReportsModel.generateReport({
      name: 'Complete Data Export',
      type: 'export_all',
      format: 'csv',
      file_path: fileName,
      file_size: file_size,
      user_id: user_id
    });

    const download_url = `${req.protocol}://${req.get('host')}/api/admin/reports/download/${report.admin_report_id}`;

    res.status(201).json({
      success: true,
      message: 'Data export completed successfully',
      data: {
        admin_report_id: report.admin_report_id,
        download_url: download_url
      }
    });
  } catch (error) {
    console.error('Error exporting all data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
};

// Helper function to generate PDF report
const generatePDFReport = async (data, title, startDate, endDate, reportType) => {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = Date.now();
      const fileName = `report_${reportType}_${timestamp}.pdf`;
      const filePath = path.join(reportsDir, fileName);

      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Add header
      doc.fontSize(22).fillColor('#4f46e5').text(title, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#666').text(`Period: ${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, { align: 'center' });
      doc.moveDown();
      
      // Add separator line
      doc.strokeColor('#4f46e5').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Add data based on report type
      doc.fontSize(12).fillColor('#000');
      
      if (Array.isArray(data)) {
        doc.text(`Total Records: ${data.length}`, { underline: true });
        doc.moveDown(0.5);
        
        // Display first 50 records in PDF
        data.slice(0, 50).forEach((item, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }
          doc.fontSize(10).text(`${index + 1}. ${JSON.stringify(item)}`, { width: 500 });
          doc.moveDown(0.3);
        });
        
        if (data.length > 50) {
          doc.fontSize(10).fillColor('#666').text(`... and ${data.length - 50} more records`, { align: 'center' });
        }
      } else if (typeof data === 'object') {
        doc.fontSize(10).text(JSON.stringify(data, null, 2), { width: 500 });
      }

      // Add footer
      doc.fontSize(8).fillColor('#999').text(
        'Little Steps Daycare Management System',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();

      writeStream.on('finish', () => {
        const file_size = fs.statSync(filePath).size;
        resolve({ file_path: fileName, file_size });
      });

      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Helper to format date for display
const formatDateDisplay = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to generate CSV report
const generateCSVReport = async (data, title, reportType) => {
  const timestamp = Date.now();
  const fileName = `report_${reportType}_${timestamp}.csv`;
  const filePath = path.join(reportsDir, fileName);

  let csvContent = `${title}\n`;
  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Handle different data structures
  if (reportType === 'complaints' && data.complaints) {
    // Complaints have nested structure
    csvContent += 'Summary\n';
    if (data.summary && data.summary.length > 0) {
      const summaryHeaders = Object.keys(data.summary[0]).join(',');
      csvContent += summaryHeaders + '\n';
      data.summary.forEach(row => {
        const values = Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',');
        csvContent += values + '\n';
      });
    }
    
    csvContent += '\n\nDetailed Complaints\n';
    if (data.complaints.length > 0) {
      const headers = Object.keys(data.complaints[0]).join(',');
      csvContent += headers + '\n';
      data.complaints.forEach(row => {
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return '';
          const strVal = String(val);
          return strVal.includes(',') || strVal.includes('\n') ? `"${strVal.replace(/"/g, '""')}"` : strVal;
        }).join(',');
        csvContent += values + '\n';
      });
    }
  } else if (reportType === 'mis' && typeof data === 'object') {
    // MIS report has complex nested structure
    csvContent += 'Management Information System Summary\n\n';
    csvContent += JSON.stringify(data, null, 2);
  } else if (Array.isArray(data)) {
    // Standard array data
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      csvContent += headers + '\n';
      
      data.forEach(row => {
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return '';
          const strVal = String(val);
          // Handle special cases like arrays
          if (Array.isArray(val)) return `"${val.join('; ')}"`;
          // Escape commas and quotes
          return strVal.includes(',') || strVal.includes('\n') ? `"${strVal.replace(/"/g, '""')}"` : strVal;
        }).join(',');
        csvContent += values + '\n';
      });
      
      csvContent += `\n\nTotal Records: ${data.length}\n`;
    } else {
      csvContent += 'No data available for the selected period\n';
    }
  } else if (typeof data === 'object') {
    // Object data (like summaries)
    csvContent += 'Summary Data\n';
    Object.entries(data).forEach(([key, value]) => {
      csvContent += `${key},${value}\n`;
    });
  }

  fs.writeFileSync(filePath, csvContent, 'utf8');
  const file_size = fs.statSync(filePath).size;

  return { file_path: fileName, file_size };
};

// Helper function to get content type
const getContentType = (format) => {
  const types = {
    pdf: 'application/pdf',
    csv: 'text/csv',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return types[format] || 'application/octet-stream';
};

// Helper function to generate Excel file
const generateExcelReport = async (data, reportName, reportType) => {
  const timestamp = Date.now();
  const fileName = `report_${reportType}_${timestamp}.xlsx`;
  const filePath = path.join(reportsDir, fileName);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportName);

  // Set worksheet properties
  worksheet.properties.defaultRowHeight = 20;

  if (Array.isArray(data) && data.length > 0) {
    // Get headers from first item
    const headers = Object.keys(data[0]);
    
    // Add header row with styling
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Set column widths
    headers.forEach((header, index) => {
      const column = worksheet.getColumn(index + 1);
      column.width = Math.max(15, header.length + 5);
    });

    // Add data rows
    data.forEach((row) => {
      const values = headers.map(header => {
        const val = row[header];
        // Format dates
        if (val instanceof Date) {
          return val.toISOString().split('T')[0];
        }
        // Handle null/undefined
        if (val === null || val === undefined) {
          return '';
        }
        return val;
      });
      worksheet.addRow(values);
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

  } else if (typeof data === 'object') {
    // Handle object data (summaries)
    worksheet.addRow(['Key', 'Value']);
    Object.entries(data).forEach(([key, value]) => {
      worksheet.addRow([key, value]);
    });
  } else {
    worksheet.addRow(['No data available']);
  }

  // Save workbook
  await workbook.xlsx.writeFile(filePath);
  const file_size = fs.statSync(filePath).size;

  return { file_path: fileName, file_size, filePath };
};

// Direct download endpoints for each report type
export const downloadChildrenReport = async (req, res) => {
  try {
    const data = await ReportsModel.getChildrenReportData(
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0],
      'all'
    );

    const result = await generateExcelReport(data, 'Children Report', 'children');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="children-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      // Clean up file after sending
      fs.unlinkSync(result.filePath);
    });
  } catch (error) {
    console.error('Error generating children report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating children report',
      error: error.message
    });
  }
};

export const downloadAttendanceReport = async (req, res) => {
  try {
    // Import the attendance model dynamically
    const attendanceModule = await import('../../models/admin/attendanceModel.js');
    const { getAttendanceHistory } = attendanceModule;
    
    // Get all attendance records (no limit, use a high number)
    const attendanceData = await getAttendanceHistory(10000, 0, null);

    if (!attendanceData || attendanceData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found'
      });
    }

    const result = await generateExcelReport(attendanceData, 'Attendance Records', 'attendance');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-records-${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      fs.unlinkSync(result.filePath);
    });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating attendance report',
      error: error.message
    });
  }
};

export const downloadSubscriptionsReport = async (req, res) => {
  try {
    // Import the subscription model dynamically
    const subscriptionModule = await import('../../models/subscriptionModel.js');
    const SubscriptionModel = subscriptionModule.default;
    
    // Get all subscriptions
    const subscriptionsData = await SubscriptionModel.findAll({});

    if (!subscriptionsData || subscriptionsData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subscription records found'
      });
    }

    const result = await generateExcelReport(subscriptionsData, 'Subscription Plans', 'subscriptions');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="subscriptions-${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      fs.unlinkSync(result.filePath);
    });
  } catch (error) {
    console.error('Error generating subscriptions report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating subscriptions report',
      error: error.message
    });
  }
};

export const downloadPaymentsReport = async (req, res) => {
  try {
    // Import the admin payment model dynamically
    const adminPaymentModule = await import('../../models/payment/adminPaymentModel.js');
    const { getAllPayments } = adminPaymentModule;
    
    // Get all payments (no filters)
    const paymentsData = await getAllPayments({});

    if (!paymentsData || paymentsData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No payment records found'
      });
    }

    const result = await generateExcelReport(paymentsData, 'Payment Records', 'payments');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="payments-records-${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      fs.unlinkSync(result.filePath);
    });
  } catch (error) {
    console.error('Error generating payments report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating payments report',
      error: error.message
    });
  }
};

export const downloadComplaintsReport = async (req, res) => {
  try {
    // Import the complaint model dynamically
    const complaintModule = await import('../../models/parent/complaintModel.js');
    const ComplaintModel = complaintModule.default;
    
    // Get all complaints
    const complaintsData = await ComplaintModel.findAll({});

    if (!complaintsData || complaintsData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No complaint records found'
      });
    }

    const result = await generateExcelReport(complaintsData, 'Complaints Records', 'complaints');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="complaints-${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      fs.unlinkSync(result.filePath);
    });
  } catch (error) {
    console.error('Error generating complaints report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating complaints report',
      error: error.message
    });
  }
};

export const downloadAnnouncementsReport = async (req, res) => {
  try {
    // Import the announcement and event models dynamically
    const announcementModule = await import('../../models/announcementModel.js');
    const { getAllAnnouncements } = announcementModule;
    
    const eventModule = await import('../../models/eventModel.js');
    const eventModel = eventModule.default;
    
    // Get all announcements and events
    const announcementsData = await getAllAnnouncements();
    const eventsData = await eventModel.getAll();
    
    // Combine announcements and events
    // Mark each record with its type
    const combinedData = [
      ...announcementsData.map(ann => ({
        type: 'Announcement',
        title: ann.title || '',
        details: ann.details || '',
        topic: '',
        venue: '',
        date: ann.date || '',
        time: ann.time || '',
        status: ann.status || '',
        audience: ann.audience || '',
        author_name: ann.author_name || '',
        created_at: ann.created_at || ''
      })),
      ...eventsData.map(evt => ({
        type: 'Event',
        title: evt.topic || '',
        details: evt.description || '',
        topic: evt.topic || '',
        venue: evt.venue || '',
        date: evt.date || '',
        time: evt.time || '',
        status: '',
        audience: '',
        author_name: '',
        created_at: evt.created_time || ''
      }))
    ];

    if (!combinedData || combinedData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No announcement or event records found'
      });
    }

    const result = await generateExcelReport(combinedData, 'Announcements & Events', 'announcements');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="announcements-events-${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      fs.unlinkSync(result.filePath);
    });
  } catch (error) {
    console.error('Error generating announcements report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating announcements report',
      error: error.message
    });
  }
};

export const downloadStaffReport = async (req, res) => {
  try {
    // Import the user model dynamically
    const userModule = await import('../../models/userModel.js');
    const { getAllUsersService } = userModule;
    
    // Get all users and filter for staff (teachers, supervisors)
    const allUsers = await getAllUsersService();
    const staffData = allUsers.filter(user => 
      user.role === 'teacher' || user.role === 'supervisor' || user.role === 'admin'
    );

    if (!staffData || staffData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No staff records found'
      });
    }

    const result = await generateExcelReport(staffData, 'Staff Members', 'staff');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="staff-${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      fs.unlinkSync(result.filePath);
    });
  } catch (error) {
    console.error('Error generating staff report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating staff report',
      error: error.message
    });
  }
};

export const downloadParentsReport = async (req, res) => {
  try {
    // Import the user model dynamically
    const userModule = await import('../../models/userModel.js');
    const { getAllUsersService } = userModule;
    
    // Get all users and filter for parents
    const allUsers = await getAllUsersService();
    const parentsData = allUsers.filter(user => user.role === 'parent');

    if (!parentsData || parentsData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No parent records found'
      });
    }

    const result = await generateExcelReport(parentsData, 'Parents', 'parents');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="parents-${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      fs.unlinkSync(result.filePath);
    });
  } catch (error) {
    console.error('Error generating parents report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating parents report',
      error: error.message
    });
  }
};

export default {
  generateReport,
  getReportHistory,
  downloadReport,
  getQuickStats,
  exportAllData,
  downloadChildrenReport,
  downloadAttendanceReport,
  downloadSubscriptionsReport,
  downloadPaymentsReport,
  downloadComplaintsReport,
  downloadAnnouncementsReport,
  downloadStaffReport,
  downloadParentsReport
};
