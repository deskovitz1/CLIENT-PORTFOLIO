-- Migration script: Convert category="__HIDDEN__" to visible=false
-- This is a one-time migration to move from the category hack to the visible boolean

-- Step 1: Add visible column if it doesn't exist (with default true)
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_visible ON videos(visible);

-- Step 3: Migrate existing data: set visible=false for videos with category="__HIDDEN__"
UPDATE videos 
SET visible = false 
WHERE category = '__HIDDEN__';

-- Step 4: Ensure all other videos are visible=true (in case of NULLs)
UPDATE videos 
SET visible = true 
WHERE visible IS NULL OR (category IS NULL OR category != '__HIDDEN__');

-- Step 5: Make column NOT NULL (after setting all values)
ALTER TABLE videos 
ALTER COLUMN visible SET NOT NULL;

-- Step 6: Set default for future inserts
ALTER TABLE videos 
ALTER COLUMN visible SET DEFAULT true;

-- Note: After this migration, category="__HIDDEN__" should be cleared or ignored for visibility
-- The visible boolean is now the single source of truth

