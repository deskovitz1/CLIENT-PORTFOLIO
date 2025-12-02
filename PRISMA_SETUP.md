# Prisma Postgres Setup Checklist

## ✅ Quick Fix for `display_date` Column

If you're seeing errors about `display_date` column not existing, follow these steps:

### 1. Install dependencies (if needed)
```bash
npm install
```

### 2. Push Prisma schema to database
```bash
npm run db:push
```

This command syncs your `prisma/schema.prisma` file to the Prisma Postgres database. It will:
- Add the `display_date` column if it's missing
- Create the index on `display_date`
- Update any other schema changes

### 3. Generate Prisma Client
```bash
npm run db:generate
```

This updates the TypeScript types to match your schema.

### 4. Restart dev server
```bash
npm run dev
```

## ✅ Verification

After running the commands above:

1. **Check the terminal output** - `db:push` should show:
   ```
   ✔ Generated Prisma Client
   ✔ Database synchronized
   ```

2. **Test in the app:**
   - Go to `/videos` page
   - Edit a video
   - Set a date in "Display Date" field
   - Click Save
   - Date should save successfully ✅

3. **Check sorting:**
   - Videos with dates should appear first
   - Sorted by date (most recent first)

## 📝 Schema Verification

Your `prisma/schema.prisma` should have:

```prisma
model Video {
  // ... other fields ...
  display_date DateTime? @db.Timestamp
  // ... other fields ...
  
  @@index([display_date(sort: Desc)])
}
```

If it's missing, add it and run `npm run db:push` again.

## 🔧 Troubleshooting

### "Column does not exist" error persists

1. **Verify schema file:**
   ```bash
   cat prisma/schema.prisma | grep display_date
   ```
   Should show: `display_date DateTime? @db.Timestamp`

2. **Force push schema:**
   ```bash
   npx prisma db push --force-reset
   ```
   ⚠️ **Warning:** This resets the database. Only use in development!

3. **Check Prisma Client is generated:**
   ```bash
   npm run db:generate
   ```

### Schema out of sync

If Prisma complains about schema mismatches:

```bash
# Reset and sync (development only)
npx prisma db push --force-reset
npm run db:generate
```

## 📚 Additional Commands

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio

# View current schema status
npx prisma db pull

# Create a migration (for production)
npm run db:migrate
```


