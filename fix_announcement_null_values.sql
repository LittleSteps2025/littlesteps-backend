-- Check current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'announcement'
ORDER BY ordinal_position;

-- If date and time columns don't accept NULL, run these ALTER TABLE commands:

-- Make date column accept NULL values
ALTER TABLE announcement 
ALTER COLUMN date DROP NOT NULL;

-- Make time column accept NULL values
ALTER TABLE announcement 
ALTER COLUMN time DROP NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'announcement'
AND column_name IN ('date', 'time');

-- Optional: If you want to set existing non-null values to null (be careful with this!)
-- UPDATE announcement SET date = NULL WHERE date IS NOT NULL;
-- UPDATE announcement SET time = NULL WHERE time IS NOT NULL;
