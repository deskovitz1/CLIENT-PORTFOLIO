/**
 * INTRO VIDEO CONFIGURATION
 * 
 * Two-stage intro flow:
 * 1. SPLASH_VIDEO_URL - Small logo video that auto-plays immediately
 * 2. ENTER_VIDEO_URL - Full-screen enter video with "CLICK TO ENTER" overlay
 * 
 * ⚠️ CRITICAL: BOTH VIDEO URLS ARE PERMANENT AND SHOULD NEVER BE CHANGED
 * - SPLASH_VIDEO_URL: The spinning tent intro video (never changed)
 * - ENTER_VIDEO_URL: The "click to enter" video (never changed)
 * 
 * DO NOT modify these URLs unless explicitly requested by the user.
 * These are the correct, working URLs that have been in use since the beginning.
 * 
 * To change videos (only if explicitly requested):
 * 1. Upload your new video to Vercel Blob Storage via the admin panel
 * 2. Copy the public blob URL
 * 3. Replace the URL below with your new video URL
 */

// Small splash logo video (plays first, auto-plays, small size)
// Spinning tent video
// ⚠️ PERMANENT URL - DO NOT CHANGE THIS
// This URL has never been changed and should remain as-is:
// https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/CIRCUS%20TENT%20INTRO%20VID.mp4
export const SPLASH_VIDEO_URL =
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/CIRCUS%20TENT%20INTRO%20VID.mp4";

// Enter video (plays second, full-screen, requires click to enter)
// "Click to enter" video
// ⚠️ PERMANENT URL - DO NOT CHANGE THIS
// This URL has never been changed and should remain as-is:
// https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/FINAL%20INTRO%20viD.mp4
export const ENTER_VIDEO_URL =
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/FINAL%20INTRO%20viD.mp4";

// Legacy alias for backwards compatibility
export const DOOR_VIDEO_URL = ENTER_VIDEO_URL;

/**
 * Optional: If you want to filter this intro video out of the regular video grid,
 * update the INTRO_VIDEO_FILENAME in lib/db.ts to match your video's filename.
 * 
 * Current filename pattern: "FINAL INTRO viD"
 */
