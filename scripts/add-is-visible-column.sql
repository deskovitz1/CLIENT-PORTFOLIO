-- Add is_visible column to videos table
-- This allows hiding videos from the website without deleting them

ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_videos_is_visible ON videos(is_visible);

-- Update existing videos to be visible by default
UPDATE videos SET is_visible = true WHERE is_visible IS NULL;

