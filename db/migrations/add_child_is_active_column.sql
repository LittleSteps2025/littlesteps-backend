-- Migration: Add is_active column to child table
-- Purpose: Allow soft-deletion/disabling of children instead of hard deletion
-- Date: 2025-10-19

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'child' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE child 
        ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
        
        RAISE NOTICE 'Column is_active added to child table';
    ELSE
        RAISE NOTICE 'Column is_active already exists in child table';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist (for tracking when status changes)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'child' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE child 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        RAISE NOTICE 'Column updated_at added to child table';
    ELSE
        RAISE NOTICE 'Column updated_at already exists in child table';
    END IF;
END $$;

-- Create an index on is_active for faster queries
CREATE INDEX IF NOT EXISTS idx_child_is_active ON child(is_active);

-- Set all existing children to active (if column was just added)
UPDATE child SET is_active = true WHERE is_active IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN child.is_active IS 'Indicates whether the child is active (enabled) or disabled. Disabled children are hidden from most queries but data is preserved.';
COMMENT ON COLUMN child.updated_at IS 'Timestamp of last update to the child record';
