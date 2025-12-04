# How to Add display_date Column Manually

If the automatic migration failed, follow these steps to add the column manually:

## Option 1: Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Open Postgres Database**
   - Click **Storage** → **Postgres**
   - Click on your database

3. **Open SQL Editor**
   - Click the **SQL Editor** tab
   - Click **New Query**

4. **Run This SQL:**
   ```sql
   ALTER TABLE videos 
   ADD COLUMN IF NOT EXISTS display_date TIMESTAMP;
   
   CREATE INDEX IF NOT EXISTS idx_videos_display_date 
   ON videos(display_date DESC NULLS LAST);
   ```

5. **Click "Run"**
   - You should see "Success" message
   - The column is now added!

## Option 2: Using Vercel CLI

```bash
# Make sure you're in your project directory
cd /path/to/your/project

# Link to your Vercel project (if not already linked)
vercel link

# Run the SQL migration
vercel db execute --sql "ALTER TABLE videos ADD COLUMN IF NOT EXISTS display_date TIMESTAMP;"
vercel db execute --sql "CREATE INDEX IF NOT EXISTS idx_videos_display_date ON videos(display_date DESC NULLS LAST);"
```

## Option 3: Direct Database Connection

If you have direct database access:

```bash
# Connect to your Postgres database
psql $DATABASE_URL

# Run the SQL
ALTER TABLE videos ADD COLUMN IF NOT EXISTS display_date TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_videos_display_date ON videos(display_date DESC NULLS LAST);
```

## Verify It Worked

After running the migration, try saving a video date again. The warning should disappear and dates should save correctly.

## Troubleshooting

**If you get "column already exists" error:**
- The column is already added! You can ignore this error.

**If you get "permission denied" error:**
- Make sure you're using the correct database connection
- Check that your Vercel project has the right permissions

**If the column still doesn't work:**
- Refresh your browser
- Check the browser console for any errors
- Verify the column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'display_date';`



