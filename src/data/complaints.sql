-- Create complaints table if it doesn't exist
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    subject VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Investigating', 'Solved')),
    action TEXT,
    child_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Foreign key relationships
    FOREIGN KEY (child_id) REFERENCES children(child_id)
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_child_id ON complaints(child_id);
CREATE INDEX IF NOT EXISTS idx_complaints_date ON complaints(date);

-- Trigger to update the updated_at timestamp
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;

CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();