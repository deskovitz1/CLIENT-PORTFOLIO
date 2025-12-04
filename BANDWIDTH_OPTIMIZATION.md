# Bandwidth Optimization Summary

This document outlines the changes made to minimize Fast Origin Transfer costs by ensuring videos are only loaded when users explicitly choose to play them.

## ✅ Changes Implemented

### 1. Wheel Slices - Thumbnails Only ✅
**File:** `app/menu/page.tsx`

- **Before:** Wheel slices could potentially load video files
- **After:** Wheel slices use **only** `<img>` tags with `thumbnail_url`
- **Result:** No video bytes downloaded when viewing/spinning the wheel
- **Code:** Lines 648-641 show slices use `thumbnailUrl` with fallback placeholder, no `<video>` elements

### 2. CRT TV - Lazy-Load Video on Play ✅
**File:** `app/menu/page.tsx`

- **Before:** CRT TV had `src` set immediately and `autoPlay={selectedVideoIndex != null}`, causing immediate video download
- **After:** 
  - CRT shows thumbnail initially (even after spin stops)
  - Video `src` is set to `null` until user clicks play button
  - Play button overlay appears on thumbnail
  - Video loads only when user explicitly clicks play
  - Uses `preload="none"` on video element
- **Result:** No video bytes downloaded until user clicks play
- **Code:** Lines 697-731 show thumbnail-first approach with play button, lines 774-789 show lazy-loaded video element

### 3. Video Player Modal - Lazy-Load on Open ✅
**File:** `components/video-player.tsx`

- **Before:** Video player had `src` set immediately, `autoPlay`, and `preload="auto"`
- **After:**
  - Video `src` is set to `null` initially
  - `src` is set only when modal opens (`isOpen === true`)
  - Uses `preload="none"` instead of `preload="auto"`
  - Shows thumbnail/poster while loading
  - Auto-plays when ready (user already opened modal)
- **Result:** No video bytes downloaded until user opens the video player modal
- **Code:** Lines 44-60 show lazy-loading logic, lines 252-270 show conditional rendering

### 4. Video Homepage - No Eager Loading ✅
**File:** `components/video-homepage.tsx`

- **Before:** Featured videos used `preload="auto"`, regular videos used `preload="metadata"`, aggressive hover loading
- **After:**
  - All videos use `preload="none"`
  - Removed aggressive `onMouseEnter` loading logic
  - Videos load only when user explicitly clicks to play
  - Removed `onTouchStart` auto-loading
- **Result:** No video bytes downloaded until user clicks to play
- **Code:** Lines 320 and 758 show `preload="none"`, lines 335-366 show click-only loading

### 5. Splash/Intro Page - Reduced Preload ✅
**File:** `app/page.tsx`

- **Before:** All videos used `preload="auto"`
- **After:** Changed to `preload="metadata"` to reduce initial bandwidth
- **Note:** Intro videos still autoplay (intentional for intro experience), but load less aggressively
- **Result:** Reduced initial bandwidth for intro videos
- **Code:** Lines 155, 170, 210 show `preload="metadata"`

### 6. Direct Blob URLs - No API Proxies ✅
**Verified:** All video URLs use direct Blob URLs from Vercel Blob Storage

- **Pattern:** `https://...blob.vercel-storage.com/...`
- **No API routes:** No `/api/video` or `/api/stream` routes that proxy video bytes
- **Code:** All video `src` attributes use `video.video_url || video.blob_url` (direct URLs)

## 📊 Expected Impact

### Before Optimization:
- **Wheel page load:** Downloads thumbnails + potentially all video files
- **CRT TV:** Downloads full video file immediately when video is selected
- **Video homepage:** Downloads video metadata/files on hover
- **Video player:** Downloads full video file when modal opens

### After Optimization:
- **Wheel page load:** Downloads **only thumbnails** (typically < 100KB total)
- **CRT TV:** Downloads **only thumbnail** until user clicks play
- **Video homepage:** Downloads **nothing** until user clicks to play
- **Video player:** Downloads video **only when modal opens** (user intent confirmed)

## 🎯 Key Principles Applied

1. **Thumbnails First:** Always show thumbnails, never load video until explicit play action
2. **Lazy Loading:** Video `src` is `null` until user explicitly requests playback
3. **preload="none":** All video elements use `preload="none"` to prevent eager loading
4. **Direct URLs:** All videos use direct Blob CDN URLs (no API proxies)
5. **User Intent:** Videos load only when user explicitly chooses to watch (click play, open modal)

## 🔍 Verification

To verify these optimizations are working:

1. **Open browser DevTools → Network tab**
2. **Filter by "Media"**
3. **Visit `/menu` page:**
   - Should see only thumbnail image requests (`.jpg`, `.png`, etc.)
   - Should see **NO** `.mp4` or video file requests
4. **Spin the wheel:**
   - Should see thumbnail requests updating
   - Should see **NO** video file requests
5. **Click play on CRT TV:**
   - **NOW** you should see the video file request
   - This is the only time video bytes are downloaded

## 📝 Notes

- **Intro/Splash videos:** Still use `preload="metadata"` and autoplay (intentional for intro experience)
- **Thumbnail fallbacks:** If `thumbnail_url` is missing, shows neutral gray placeholder (no video loading)
- **Mobile optimization:** Same lazy-loading behavior applies on mobile devices

## 🚀 Result

**Bandwidth usage should be drastically reduced:**
- Page loads: ~90-95% reduction (thumbnails only)
- Wheel spinning: ~100% reduction (no video loading)
- Video playback: Only when user explicitly plays (as intended)



