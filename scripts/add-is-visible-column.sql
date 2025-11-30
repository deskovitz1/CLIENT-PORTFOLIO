-- Add is_visible column to videos table if it doesn't exist
-- This is the single source of truth for video visibility

-- Add the column (PostgreSQL syntax)
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add an index for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_is_visible ON videos(is_visible);

-- Update any existing NULL values to true (visible by default)
UPDATE videos SET is_visible = true WHERE is_visible IS NULL;
