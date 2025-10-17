# Admin Reports API Documentation

## Overview
The Admin Reports API provides comprehensive reporting capabilities for the Little Steps daycare management system. It supports generating various types of reports including attendance, financial, enrollment, staff activity, and incident reports.

## Database Changes
- **Table Name**: `admin_reports` (changed from `reports`)
- **Primary Key**: `admin_report_id` (changed from `report_id`)
- **ID Format**: `ARPT-{timestamp}` (changed from `RPT-{timestamp}`)

## API Endpoints

### 1. Generate Report
**POST** `/api/admin/reports/generate`

Generate a new report based on specified parameters.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reportType": "attendance",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "format": "pdf",
  "groupBy": "daily",      // Optional: for attendance reports
  "detailLevel": "summary" // Optional: for financial reports
}
```

**Report Types:**
- `attendance` - Daily check-ins/check-outs with timestamps
- `financial` - Revenue, payments, and outstanding balances
- `enrollment` - Current and historical enrollment statistics
- `staff` - Teacher and supervisor activities
- `incidents` - Recorded incidents and complaints
- `mis` - Management Information System summary

**Formats:**
- `pdf` - PDF Document
- `csv` - CSV Spreadsheet
- `excel` - Excel Workbook

**Attendance Report Options (groupBy):**
- `daily` - Daily summary
- `child` - By child
- `classroom` - By classroom
- `period` - By time period

**Financial Report Options (detailLevel):**
- `summary` - Summary view
- `detailed` - Detailed transactions
- `outstanding` - Outstanding balances
- `methods` - Payment methods breakdown

**Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "admin_report_id": "ARPT-1729180800000",
    "name": "Attendance Report (daily)",
    "type": "attendance",
    "format": "pdf",
    "download_url": "http://localhost:5001/api/admin/reports/download/ARPT-1729180800000",
    "created_at": "2025-10-17T12:00:00.000Z"
  }
}
```

---

### 2. Get Report History
**GET** `/api/admin/reports/history`

Retrieve a list of previously generated reports.

**Query Parameters:**
- `limit` (optional, default: 10) - Number of reports to return
- `offset` (optional, default: 0) - Pagination offset
- `user_id` (optional) - Filter by user who generated the report

**Example:**
```
GET /api/admin/reports/history?limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "message": "Report history retrieved successfully",
  "data": [
    {
      "admin_report_id": "ARPT-1729180800000",
      "name": "Attendance Report (daily)",
      "type": "attendance",
      "format": "pdf",
      "file_path": "report_attendance_1729180800000.pdf",
      "size": "245 KB",
      "created_at": "2025-10-17T12:00:00.000Z",
      "generated_by": "Admin User",
      "user_id": 1,
      "download_url": "http://localhost:5001/api/admin/reports/download/ARPT-1729180800000"
    }
  ]
}
```

---

### 3. Download Report
**GET** `/api/admin/reports/download/:adminReportId`

Download a specific report file.

**Parameters:**
- `adminReportId` - The admin report ID (e.g., ARPT-1729180800000)

**Example:**
```
GET /api/admin/reports/download/ARPT-1729180800000
```

**Response:**
- Returns the file as a binary stream with appropriate Content-Type headers
- Content-Disposition header includes filename

**Headers in Response:**
```
Content-Type: application/pdf (or text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
Content-Disposition: attachment; filename="report_attendance_1729180800000.pdf"
Content-Length: 251392
```

---

### 4. Get Quick Stats
**GET** `/api/admin/reports/quick-stats`

Get quick statistics for the MIS dashboard.

**Response:**
```json
{
  "success": true,
  "message": "Quick stats retrieved successfully",
  "data": {
    "currentEnrollment": 45,
    "monthlyAttendanceAvg": 87.5,
    "revenueThisMonth": 125000.00,
    "staffCount": 12
  }
}
```

---

### 5. Export All Data
**POST** `/api/admin/reports/export-all`

Export all system data in a comprehensive archive.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "format": "zip"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data export completed successfully",
  "data": {
    "admin_report_id": "ARPT-1729180900000",
    "download_url": "http://localhost:5001/api/admin/reports/download/ARPT-1729180900000"
  }
}
```

---

## Report Data Structures

### Attendance Report Data
```javascript
// groupBy: 'daily'
[
  {
    date: '2025-10-17',
    unique_children: 42,
    total_checkins: 45
  }
]

// groupBy: 'child'
[
  {
    child_id: 1,
    child_name: 'John Doe',
    total_checkins: 15,
    first_checkin: '2025-10-01T08:00:00',
    last_checkin: '2025-10-17T08:15:00'
  }
]

// groupBy: 'classroom'
[
  {
    group_id: 1,
    classroom_name: 'Sunshines',
    total_checkins: 120,
    unique_children: 15
  }
]
```

### Financial Report Data
```javascript
// detailLevel: 'summary'
[
  {
    total_transactions: 50,
    total_revenue: 125000.00,
    pending_amount: 15000.00,
    completed_count: 45,
    pending_count: 5,
    average_transaction: 2500.00
  }
]

// detailLevel: 'detailed'
[
  {
    payment_id: 1,
    parent_email: 'parent@example.com',
    parent_name: 'Jane Smith',
    amount: 5000.00,
    status: 'completed',
    payment_method: 'card',
    created_at: '2025-10-01T10:00:00',
    paid_at: '2025-10-01T10:05:00'
  }
]
```

### Enrollment Report Data
```javascript
{
  summary: {
    total_children: 45,
    new_enrollments: 5,
    average_age: 3.5,
    active_classrooms: 3
  },
  by_classroom: [
    {
      classroom_name: 'Sunshines',
      child_count: 15
    }
  ]
}
```

### Staff Activity Report Data
```javascript
[
  {
    user_id: 1,
    name: 'Teacher Name',
    role: 'teacher',
    reports_submitted: 25,
    announcements_created: 5,
    last_activity: '2025-10-17T14:30:00'
  }
]
```

### Incidents Report Data
```javascript
{
  incidents: [
    {
      complaint_id: 1,
      parent_email: 'parent@example.com',
      parent_name: 'Jane Smith',
      complaint_type: 'behavior',
      complaint: 'Description of incident',
      status: 'resolved',
      created_at: '2025-10-15T11:00:00'
    }
  ],
  summary: [
    {
      complaint_type: 'behavior',
      count: 3,
      resolved_count: 2
    }
  ]
}
```

---

## File Storage
Generated reports are stored in: `{project_root}/reports/`

File naming convention:
- `report_{type}_{timestamp}.{format}`
- Example: `report_attendance_1729180800000.pdf`

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: reportType, dateRange, format"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Report not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to generate report",
  "error": "Detailed error message"
}
```

---

## Frontend Integration Notes

### Key Changes from Previous Implementation:
1. **URL Parameter**: Changed from `:reportId` to `:adminReportId`
2. **ID Field**: Use `admin_report_id` instead of `report_id`
3. **Table Name**: Backend queries `admin_reports` table
4. **ID Generation**: IDs now use `ARPT-` prefix instead of `RPT-`

### Frontend Download Function Example:
```typescript
const handleDownloadReport = async (adminReportId: string) => {
  const token = getStoredToken();
  const response = await fetch(
    `${API_BASE_URL}/api/admin/reports/download/${adminReportId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${adminReportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
```

---

## Dependencies Required

Add to `package.json`:
```json
{
  "dependencies": {
    "pdfkit": "^0.14.0",
    "csv-writer": "^1.6.0"
  }
}
```

Install with:
```bash
npm install pdfkit csv-writer
```

---

## Testing

### Test Report Generation:
```bash
curl -X POST http://localhost:5001/api/admin/reports/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "attendance",
    "dateRange": {
      "start": "2025-10-01",
      "end": "2025-10-17"
    },
    "format": "pdf",
    "groupBy": "daily"
  }'
```

### Test Report History:
```bash
curl -X GET "http://localhost:5001/api/admin/reports/history?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Quick Stats:
```bash
curl -X GET http://localhost:5001/api/admin/reports/quick-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Migration Steps

1. **Create the table:**
   ```bash
   psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f db/migrations/create_admin_reports_table.sql
   ```

2. **Install dependencies:**
   ```bash
   npm install pdfkit csv-writer
   ```

3. **Create reports directory:**
   ```bash
   mkdir reports
   ```

4. **Restart server:**
   ```bash
   npm start
   ```

---

## Security Considerations

- All endpoints require authentication via Bearer token
- File paths are sanitized to prevent directory traversal attacks
- User IDs are validated against authenticated user
- Report downloads are restricted to authenticated users
- File size limits should be implemented for large exports

---

## Future Enhancements

1. Excel file generation using `exceljs` library
2. Report scheduling and automated generation
3. Email delivery of reports
4. Report templates and customization
5. Data filtering and advanced query options
6. Report sharing and permissions
7. Archive and cleanup of old reports
8. Compression for large exports
