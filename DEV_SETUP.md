# Development Setup Guide

This project uses **Prisma Postgres** (Prisma Cloud) for the database. All schema changes must be synced using Prisma commands, not manual SQL.

## Prisma Schema Management

### Adding or Modifying Database Columns

When you modify the `prisma/schema.prisma` file (e.g., adding `display_date`), you must sync the changes to the database:

```bash
# 1. Push schema changes to Prisma Postgres database
npm run db:push

# 2. Regenerate Prisma Client to match the new schema
npm run db:generate
```

**Important:** Always run both commands after schema changes. The `db:push` command syncs your schema to the database, and `db:generate` updates the TypeScript types.

### Common Prisma Commands

```bash
# Push schema changes to database (use this for schema changes)
npm run db:push

# Generate Prisma Client (updates TypeScript types)
npm run db:generate

# Open Prisma Studio (visual database browser)
npm run db:studio

# Create a migration (for production workflows)
npm run db:migrate
```

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Sync Prisma schema to database:**
   ```bash
   npm run db:push
   npm run db:generate
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

Ensure `.env.local` contains:
- `DATABASE_URL` - Your Prisma Postgres connection string
- `BLOB_READ_WRITE_TOKEN` or `CIRCUS_READ_WRITE_TOKEN` - Vercel Blob storage token
- `ADMIN_PASSWORD` - Password for admin access (optional)

## Troubleshooting

### "Column does not exist" errors

If you see errors about missing columns (e.g., `display_date`):

1. **Check `prisma/schema.prisma`** - Ensure the column is defined in the model
2. **Run `npm run db:push`** - This syncs the schema to the database
3. **Run `npm run db:generate`** - This updates TypeScript types
4. **Restart dev server** - `npm run dev`

### Schema out of sync

If Prisma complains about schema mismatches:

```bash
# Reset and push schema (⚠️ WARNING: This may delete data in development)
npx prisma db push --force-reset

# Or just push changes
npm run db:push
npm run db:generate
```

## Notes

- **Never use manual SQL migrations** - Use `prisma db push` instead
- **Always run `db:generate` after `db:push`** - This ensures TypeScript types match the database
- **Schema changes are immediate** - `db:push` applies changes directly to the database (great for development)



