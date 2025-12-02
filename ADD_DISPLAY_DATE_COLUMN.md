# Add display_date Column to Database

## Quick Fix - Run This SQL

The `display_date` column is missing from your database. Run this SQL to add it:

### Option 1: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Storage** → **Postgres**
4. Click on your database
5. Click **SQL Editor** tab
6. Paste this SQL:

```sql
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS display_date TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_videos_display_date ON videos(display_date DESC NULLS LAST);
```

7. Click **Run**
8. You should see "Success" message
9. Try saving a date again - it should work now!

### Option 2: Using Vercel CLI

```bash
cd /Users/dylaneskovitz/Developer/v0-v37-rebuild-main
vercel db execute scripts/add-display-date-column.sql
```

### Verify It Worked

After running the SQL:
1. Try editing a video and setting a date
2. Click Save
3. The date should save and the video should move to the correct position based on date
4. Videos should sort with most recent dates at the top


