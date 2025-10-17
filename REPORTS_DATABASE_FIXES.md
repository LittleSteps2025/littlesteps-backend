# Reports System - Database Column Fixes

## Date: October 17, 2025

## Issue
Reports were failing to generate with errors about non-existent database columns and tables.

## Root Causes

### 1. Child Table Column Names
- **Issue**: Used `c.date_of_birth` but actual column is `dob`
- **Issue**: Used `c.address` but this column doesn't exist in child table
- **Issue**: Used `c.medical_conditions` but actual column is `mr` (medical records)

### 2. Complaints Table Name
- **Issue**: Queries used `complaint` but actual table name is `complaints` (plural)
- **Impact**: Affected dashboard activities, complaints reports, parent reports, and MIS reports

## Fixes Applied

### Files Modified

#### 1. `src/models/admin/reportsModel.js`
- **Children Report**: 
  - Changed `c.date_of_birth` → `TO_CHAR(c.dob, 'YYYY-MM-DD') as date_of_birth`
  - Removed `c.address` from queries (not in child table)
  - Removed `c.medical_conditions` (column is `mr` but not needed in reports)

- **Complaints Report**: 
  - Changed all `FROM complaint` → `FROM complaints`
  - Changed all `JOIN complaint` → `JOIN complaints`
  
- **Parents Report**: 
  - Changed `LEFT JOIN complaint comp` → `LEFT JOIN complaints comp`
  
- **MIS Report**: 
  - Changed `FROM complaint` → `FROM complaints`

#### 2. `src/models/admin/dashboardModel.js`
- **Recent Activities Query**: 
  - Changed `FROM complaint c` → `FROM complaints c`

## Testing

After these fixes:
1. Server starts successfully without errors
2. All report types should now query correct table and column names
3. Dashboard activities should load without errors

## Actual Child Table Columns
Based on the codebase analysis:
- `child_id` - Primary key
- `parent_id` - Foreign key
- `name` - Child's name
- `age` - Age
- `gender` - Gender
- `dob` - Date of birth (use TO_CHAR for formatting)
- `group_id` - Foreign key to group table
- `package_id` - Foreign key to package table
- `image` - Photo
- `bc` - Birth certificate
- `blood_type` - Blood type
- `mr` - Medical records
- `allergies` - Allergies information
- `created_at` - Enrollment date

## Next Steps

1. Test each report type to ensure data is returned correctly
2. Verify the admin_reports table has been created (run migration if needed)
3. Test report PDF and CSV generation
4. Verify dashboard statistics and activities display correctly

## Migration Required

If the `admin_reports` table doesn't exist yet, run:
```sql
CREATE TABLE IF NOT EXISTS admin_reports (
  admin_report_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  format VARCHAR(20) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_reports_type ON admin_reports(type);
CREATE INDEX IF NOT EXISTS idx_admin_reports_created_at ON admin_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_reports_user_id ON admin_reports(user_id);
```

## Status
✅ All database column/table name mismatches fixed
✅ Server running successfully
✅ Ready for testing report generation
