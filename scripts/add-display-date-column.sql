-- Migration: Add display_date column to videos table
-- Run this in your Vercel Postgres SQL Editor or via CLI

-- Add display_date column if it doesn't exist
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS display_date TIMESTAMP;

-- Add index for faster sorting
CREATE INDEX IF NOT EXISTS idx_videos_display_date ON videos(display_date DESC NULLS LAST);

-- Add is_visible column if it doesn't exist (for visibility feature)
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_videos_is_visible ON videos(is_visible);



