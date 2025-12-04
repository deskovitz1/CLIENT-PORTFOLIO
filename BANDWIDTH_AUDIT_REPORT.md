# Bandwidth Audit Report - Video Loading Safety

## Summary
This document details all video loading behavior and ensures bandwidth-safe practices across the entire codebase.

## Video Loading Locations & Behavior

### 1. Menu Page (Spinning Wheel) - `/app/menu/page.tsx`

**Wheel Slices:**
- **Location:** Lines 630-703
- **Behavior:** ✅ SAFE - Uses ONLY image thumbnails (`<img>` tags with `thumbnail_url`)
- **No video elements:** Slices never use `<video>` tags
- **Bandwidth impact:** Only small thumbnail images (JPG/PNG/WebP) are downloaded per slice
- **When loaded:** Thumbnails load lazily with `loading="lazy"` attribute

**CRT TV Player:**
- **Location:** Lines 752-800
- **Behavior:** ✅ SAFE - Video src is set ONLY when user clicks play button
- **Preload:** `preload="none"` - no video bytes downloaded until play() is called
- **During spin:** Video src is cleared (`setCrtVideoSrc(null)`) to prevent loading during animation
- **After spin:** Video src remains null until user explicitly clicks play button
- **Bandwidth impact:** Only ONE full video file downloaded per user selection

**Key Safety Features:**
- Line 259-271: Video src reset only happens when `!isSpinning` - prevents changes during animation
- Line 274-296: `handleCrtPlay()` checks `isSpinning` and only sets src on explicit user click
- Line 301-310: `spinWheel()` clears video src at start of spin

### 2. Video Homepage - `/components/video-homepage.tsx`

**Featured Video:**
- **Location:** Lines 320-351
- **Behavior:** ✅ SAFE - Uses `preload="none"`, loads only on user click
- **Removed:** Aggressive preloading logic (lines 993-1003 commented out)
- **Bandwidth impact:** No video download until user clicks to play

**Grid Videos:**
- **Location:** Lines 735-765
- **Behavior:** ✅ SAFE - Uses `preload="none"`, loads only on user click
- **Poster:** Uses `thumbnail_url` as poster image
- **Bandwidth impact:** Only thumbnail images loaded, videos load on click

### 3. Video Player Modal - `/components/video-player.tsx`

**Location:** Lines 283-299
- **Behavior:** ✅ SAFE - Uses `preload="none"`
- **Auto-play:** Only after modal opens (user already committed to watching)
- **Bandwidth impact:** One video file per modal open

### 4. Splash/Intro Page - `/app/page.tsx`

**Splash Video (Spinning Tent):**
- **Location:** Lines 186-195
- **Behavior:** ⚠️ MODERATE - Uses `preload="metadata"` and `autoPlay` (intentional for intro UX)
- **Bandwidth impact:** Full video downloads for intro experience (acceptable for intro flow)

**Enter Video (Clouds):**
- **Location:** Lines 205-247
- **Behavior:** ✅ SAFE - Uses `preload="metadata"`, full video only loads when user clicks play
- **Preload video:** Changed from `preload="auto"` + `load()` to `preload="metadata"` only
- **Bandwidth impact:** Metadata only until user clicks "CLICK TO ENTER"

**Key Fix:** Removed aggressive preloading (line 25-26) that was calling `preload="auto"` and `load()`

### 5. Recent Work Page - `/components/recent-work-page.tsx`

**Location:** Lines 49-59
- **Behavior:** ✅ FIXED - Changed from `preload="auto"` to `preload="metadata"`
- **Bandwidth impact:** Reduced from full video download to metadata only

## API Routes - Caching Headers

### `/app/api/videos/route.ts`
- **Location:** Line 30-32
- **Added:** `Cache-Control: public, max-age=31536000, immutable`
- **Impact:** Video metadata responses cached for 1 year (Blob URLs are immutable)

### `/app/api/intro-video/route.ts`
- **Location:** Line 15-17
- **Added:** `Cache-Control: public, max-age=31536000, immutable`
- **Impact:** Intro video metadata cached for 1 year

## When Videos Are Actually Downloaded

### Normal Page Visit + One Spin:
1. **Thumbnails:** Small image files (JPG/PNG/WebP) for each video slice (~50-200KB each)
2. **Selected Video:** ONE full video file ONLY when user clicks play button
3. **Total bandwidth:** ~1-5MB thumbnails + 1 video file (50-500MB depending on video)

### What Does NOT Download:
- ❌ No full videos for wheel slices (only thumbnails)
- ❌ No videos during spin animation (src is cleared)
- ❌ No videos until user clicks play button
- ❌ No featured video preloading (removed aggressive load())
- ❌ No multiple videos loading simultaneously

## Dev/Preview Safety Guards

**Location:** `/app/menu/page.tsx` line 68
- Added `isDev` check for development/preview environments
- Can be used to disable heavy features during development

## Blob URL Usage

All videos use direct Blob URLs (`blob_url` or `video_url` from database):
- ✅ No API proxy - direct CDN access
- ✅ Immutable URLs - safe for aggressive caching
- ✅ Browser caching works naturally

## Summary of Changes

1. ✅ Removed aggressive preloading from splash page (`preload="auto"` → `preload="metadata"`)
2. ✅ Removed featured video preloading (`videoEl.load()` removed)
3. ✅ Ensured CRT TV only loads video when spin stops AND user clicks play
4. ✅ Added caching headers to API routes (1 year cache)
5. ✅ Changed recent-work-page from `preload="auto"` to `preload="metadata"`
6. ✅ Added bandwidth safety comments throughout codebase
7. ✅ Verified wheel slices use only thumbnails (no `<video>` elements)

## Expected Bandwidth Per User Session

**Menu Page Visit:**
- Thumbnails: ~1-5MB (all slices)
- Selected video: 50-500MB (only when user clicks play)
- **Total:** ~51-505MB per session

**Videos Page Visit:**
- Thumbnails: ~100-500KB per video thumbnail
- Selected video: 50-500MB (only when user clicks to play)
- **Total:** ~1-10MB thumbnails + 1 video file

This is a massive reduction from the previous ~800GB/day spike, which was likely caused by:
- Aggressive preloading downloading all videos
- Videos loading during spin animations
- No caching headers causing repeated downloads
- Featured video preloading downloading videos that were never watched



