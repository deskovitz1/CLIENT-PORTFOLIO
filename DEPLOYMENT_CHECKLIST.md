# 🚀 Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Status
- [x] All changes committed and pushed to GitHub
- [x] Admin mode implemented and tested
- [x] Upload functionality working
- [x] Edit/Delete functionality working
- [x] Database functions using raw SQL (schema-safe)

### 🔐 Environment Variables Required on Vercel

Make sure these are set in **Vercel Dashboard → Your Project → Settings → Environment Variables**:

#### Required Variables:
```
ADMIN_PASSWORD=welcometothecircus
BLOB_READ_WRITE_TOKEN=your_blob_token_here
DATABASE_URL=your_postgres_connection_string
POSTGRES_URL=your_postgres_connection_string
```

#### Optional Variables (if using Prisma Accelerate):
```
POSTGRES_PRISMA_URL=your_prisma_url
POSTGRES_URL_NON_POOLING=your_non_pooling_url
```

### 📦 Build Configuration

- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next` (default)
- **Install Command**: `pnpm install` (or `npm install`)

### 🗄️ Database Setup

1. **Prisma Schema**: `prisma/schema.prisma` is configured
2. **Postinstall**: `prisma generate` runs automatically after install
3. **Database Columns**: Code handles missing columns gracefully (raw SQL fallbacks)

### 🔑 Admin Mode

- **Keyboard Shortcut**: `Cmd+Shift+A` (Mac) / `Ctrl+Shift+A` (Windows/Linux)
- **Password**: Set via `ADMIN_PASSWORD` environment variable
- **Session**: Resets on each page load (requires re-authentication)

### 📝 Important Notes

1. **Admin Password**: Must be set in Vercel environment variables
2. **Database**: Ensure Postgres database is connected and accessible
3. **Blob Storage**: Ensure Blob storage token has read/write permissions
4. **Build**: Prisma client will be generated during build process

### 🧪 Post-Deployment Testing

After deployment, test:
1. [ ] Site loads correctly
2. [ ] Videos display properly
3. [ ] Admin mode works (Cmd+Shift+A → enter password)
4. [ ] Upload functionality works
5. [ ] Edit/Delete functionality works
6. [ ] Admin UI appears/disappears correctly

### 🐛 Troubleshooting

**If admin mode doesn't work:**
- Check `ADMIN_PASSWORD` is set in Vercel environment variables
- Restart deployment after adding environment variables

**If uploads fail:**
- Verify `BLOB_READ_WRITE_TOKEN` is correct
- Check Blob storage permissions

**If database errors occur:**
- Verify `DATABASE_URL` and `POSTGRES_URL` are set
- Check database connection in Vercel dashboard

### 📚 Key Files

- `app/layout.tsx` - Root layout with AdminProvider
- `contexts/AdminContext.tsx` - Admin state management
- `components/AdminShortcutListener.tsx` - Keyboard shortcut handler
- `components/AdminBadge.tsx` - Admin indicator
- `app/api/admin/login/route.ts` - Admin authentication
- `lib/db.ts` - Database functions (raw SQL for reliability)
- `components/video-homepage.tsx` - Main video page with admin UI

### 🔄 Deployment Steps

1. **Push to GitHub** (if not already done):
   ```bash
   git push origin main
   ```

2. **Set Environment Variables in Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables listed above

3. **Deploy**:
   - Vercel will auto-deploy on push to main branch
   - Or manually trigger deployment from Vercel dashboard

4. **Verify**:
   - Check build logs for any errors
   - Test admin mode after deployment
   - Test upload functionality

---

**Last Updated**: Ready for deployment
**Status**: ✅ All systems ready

