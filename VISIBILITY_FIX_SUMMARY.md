# Visibility System Fix - Summary

## What Was Wrong

The codebase was using **two different visibility systems** simultaneously:

1. **Admin page** was setting `category = "__HIDDEN__"` (a workaround)
2. **Public page** was filtering by `is_visible` boolean OR `category != "__HIDDEN__"`

This caused a mismatch:
- Admin changed one field (`category`)
- Public page filtered by a different field (`is_visible`)
- Result: Either everything was hidden or nothing changed

## The Fix

Unified everything to use **ONE boolean field: `visible`** as the single source of truth.

### Changes Made

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Changed `is_visible Boolean?` → `visible Boolean @default(true)` (NOT NULL)
   - Added index on `visible` for faster queries

2. **Database Migration** (`scripts/migrate-visibility.sql`)
   - Adds `visible` column if missing
   - Migrates existing `category = "__HIDDEN__"` → `visible = false`
   - Sets all other videos to `visible = true`
   - Makes column NOT NULL

3. **Visibility API** (`app/api/videos/[id]/visibility/route.ts`)
   - **ONLY** updates `visible` boolean
   - Removed all `category = "__HIDDEN__"` workaround logic
   - Clean, simple update

4. **Database Query** (`lib/db.ts`)
   - `getVideos()` now filters by `visible = true` only
   - Removed complex OR conditions with category checks
   - Single, clear filter: `where: { visible: true }`

5. **Admin Page** (`app/admin/page.tsx`)
   - Uses `video.visible` boolean (not `is_visible` or category)
   - Toggle button sends `{ visible: !video.visible }`
   - UI displays based on `video.visible` only

6. **Public Pages**
   - All pages filter by `visible = true` only
   - Removed category workaround checks
   - Client-side filters also use `visible` boolean

7. **Blob Sync** (`app/api/videos/sync-blob/route.ts`)
   - Sets `visible = true` for new videos (default)
   - **Never touches** `visible` for existing videos
   - Admin UI owns visibility, sync doesn't override it

## How to Apply

1. **Run the migration script** to add `visible` column and migrate data:
   ```sql
   -- Run scripts/migrate-visibility.sql against your database
   ```

2. **Regenerate Prisma client**:
   ```bash
   pnpm prisma generate
   ```

3. **Restart your dev server**

## Testing

1. **Admin page**: Hide a video → `visible` becomes `false`
2. **Public page**: Only videos with `visible = true` appear
3. **Toggle**: Hide/Show in admin immediately affects public page

## Result

- ✅ Single source of truth: `visible` boolean
- ✅ Admin and public pages use the same field
- ✅ No more category workaround
- ✅ Clean, maintainable code

