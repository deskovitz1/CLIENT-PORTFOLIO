# Localhost Development Setup

## ✅ Server Status

Your development server should now be running at: **http://localhost:3000**

## Quick Start

### 1. Start the Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

### 2. Access Your Application

- **Homepage**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Recent Work**: http://localhost:3000/recent-work

## Environment Variables for Local Development

For local development, you need to create a `.env.local` file with your credentials:

### Create `.env.local` file:

```bash
# In the project root directory
touch .env.local
```

### Add these variables:

```env
# Vercel Blob Storage Token
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_actual_token_here

# Vercel Postgres Connection Strings
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_postgres_prisma_url_here
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url_here
```

### How to Get the Values:

1. **BLOB_READ_WRITE_TOKEN**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Your Project → Storage → Blob
   - Settings → Tokens
   - Copy the token

2. **Postgres URLs**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Your Project → Storage → Postgres
   - Settings → Connection String
   - Copy the URLs

**OR** use Vercel CLI:
```bash
vercel env pull .env.local
```

## Verify Setup

After creating `.env.local`, verify everything is configured:

```bash
pnpm verify-env
```

## Troubleshooting

### Server Won't Start

1. **Check if port 3000 is in use**:
   ```bash
   lsof -ti:3000
   ```
   If something is running, kill it:
   ```bash
   kill -9 $(lsof -ti:3000)
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   pnpm dev
   ```

### Environment Variables Not Working

1. **Make sure `.env.local` exists** in the project root
2. **Restart the dev server** after adding variables
3. **Check variable names** are exactly correct (case-sensitive)
4. **Run verification**: `pnpm verify-env`

### Database Connection Issues

- Verify Postgres database exists in Vercel
- Check `POSTGRES_URL` is correct
- Ensure database is in the same region
- Run migration: See `lib/db/schema.sql`

### Blob Storage Issues

- Verify blob store exists in Vercel
- Check `BLOB_READ_WRITE_TOKEN` is correct
- Ensure token hasn't expired

## Common Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Verify environment
pnpm verify-env

# Check Vercel env vars
pnpm check-vercel-env
```

## Next Steps

1. ✅ Server is running at http://localhost:3000
2. ✅ Create `.env.local` with your credentials
3. ✅ Run `pnpm verify-env` to check configuration
4. ✅ Test video upload in admin panel
5. ✅ Verify videos appear on homepage

---

**Note**: The `.env.local` file is gitignored and won't be committed to GitHub. This is correct for security!

