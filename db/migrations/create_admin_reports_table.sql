-- Create admin_reports table for report generation and tracking
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_reports_type ON admin_reports(type);
CREATE INDEX IF NOT EXISTS idx_admin_reports_created_at ON admin_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_reports_user_id ON admin_reports(user_id);

-- Add comment to table
COMMENT ON TABLE admin_reports IS 'Stores metadata for generated admin reports including attendance, financial, enrollment, staff activity, and incident reports';

-- Add comments to columns
COMMENT ON COLUMN admin_reports.admin_report_id IS 'Unique identifier with format ARPT-{timestamp}';
COMMENT ON COLUMN admin_reports.name IS 'Human-readable name of the report';
COMMENT ON COLUMN admin_reports.type IS 'Report type: attendance, financial, enrollment, staff, incidents, mis, export_all';
COMMENT ON COLUMN admin_reports.format IS 'File format: pdf, csv, excel';
COMMENT ON COLUMN admin_reports.file_path IS 'Relative path to the generated file';
COMMENT ON COLUMN admin_reports.file_size IS 'File size in bytes';
COMMENT ON COLUMN admin_reports.user_id IS 'User who generated the report';
COMMENT ON COLUMN admin_reports.created_at IS 'Timestamp when the report was generated';
