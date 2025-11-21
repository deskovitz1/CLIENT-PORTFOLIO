/**
 * INTRO VIDEO CONFIGURATION
 * 
 * Two-stage intro flow:
 * 1. SPLASH_VIDEO_URL - Small logo video that auto-plays immediately
 * 2. DOOR_VIDEO_URL - Full-screen door video with "CLICK TO ENTER" overlay
 * 
 * To change videos:
 * 1. Upload your new video to Vercel Blob Storage via the admin panel
 * 2. Copy the public blob URL
 * 3. Replace the URL below with your new video URL
 */

// Small splash logo video (plays first, auto-plays, small size)
export const SPLASH_VIDEO_URL =
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/mp4%20circus%20logo-8YUWo7f9uTD2Nc4t14hdsuiOfYgAQe.mp4";

// Door video (plays second, full-screen, requires click to enter)
export const DOOR_VIDEO_URL =
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/WEBSITE%20VID%20heaven-AWUizYkbCMdKlrVjljXN7xO2lEwd45.mp4";

/**
 * Optional: If you want to filter this intro video out of the regular video grid,
 * update the INTRO_VIDEO_FILENAME in lib/db.ts to match your video's filename.
 * 
 * Current filename pattern: "WEBSITE VID heaven"
 */
