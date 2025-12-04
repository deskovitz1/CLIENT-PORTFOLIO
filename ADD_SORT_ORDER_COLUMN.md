# Add sort_order Column Manually

If automatic column creation fails, run this SQL manually:

## Option 1: Vercel Postgres SQL Editor (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Storage** → **Postgres** → **SQL Editor**
4. Run this SQL:

```sql
ALTER TABLE videos ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
```

## Option 2: Using Prisma

```bash
npm run db:push
npm run db:generate
```

## Option 3: Direct SQL (if you have database access)

```sql
ALTER TABLE videos ADD COLUMN sort_order INTEGER DEFAULT 0;
```

After running the SQL, try reordering videos again.



