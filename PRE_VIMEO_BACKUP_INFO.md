# Pre-Vimeo Backup Information

## Backup Created
This backup was created before migrating the video player system from Vercel Blob Storage to Vimeo.

## Backup Location
The backup is located in the parent directory:
```
../v0-v37-rebuild-main-PRE-VIMEO-BACKUP-[TIMESTAMP]/
```

## What's Included
- Complete codebase snapshot
- All configuration files
- Database schema
- API routes
- Components
- All video-related code using Vercel Blob Storage

## Current State (Pre-Vimeo)
- Videos stored in: Vercel Blob Storage
- Video player: Native HTML5 `<video>` elements
- Thumbnails: Custom uploads to Vercel Blob
- Admin features: Full CRUD operations for videos

## Permanent Video URLs (DO NOT CHANGE)
- Splash Video: `https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/CIRCUS%20TENT%20INTRO%20VID.mp4`
- Enter Video: `https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/FINAL%20INTRO%20viD.mp4`

## To Restore This Backup
1. Stop the current server
2. Copy the backup directory back to `v0-v37-rebuild-main`
3. Restore environment variables
4. Restart the server

## Notes
- This backup represents the working state before Vimeo integration
- All bandwidth optimizations are included
- All admin features are functional
- Video URLs are documented in `app/config/intro.ts` and `PERMANENT_CONFIG.md`



