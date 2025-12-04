#!/usr/bin/env node
/**
 * Fix video visibility - set all videos to visible=true
 * 
 * Usage:
 *   npm run fix-visibility
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { prisma } from "../lib/prisma";

async function fixVisibility() {
  try {
    console.log("🔍 Checking videos in database...\n");

    // Get all videos
    const videos = await prisma.video.findMany({
      select: {
        id: true,
        title: true,
        is_visible: true,
      },
    });

    console.log(`Found ${videos.length} video(s) in database\n`);

    if (videos.length === 0) {
      console.log("No videos found. Run 'npm run import-blob-videos' first.");
      return;
    }

    // Update all videos to be visible
    const result = await prisma.$executeRawUnsafe(`
      UPDATE videos 
      SET is_visible = true, updated_at = NOW()
      WHERE is_visible IS NULL OR is_visible = false
    `);

    console.log(`✅ Updated ${result} video(s) to be visible\n`);

    // Verify
    const visibleCount = await prisma.video.count({
      where: { is_visible: true },
    });

    console.log(`📊 Summary:`);
    console.log(`   Total videos: ${videos.length}`);
    console.log(`   Visible videos: ${visibleCount}`);
    console.log(`\n✨ Done! Your videos should now appear on the website.`);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    
    // If is_visible column doesn't exist, that's okay - videos will show anyway
    if (error instanceof Error && error.message.includes("is_visible")) {
      console.log("\n💡 Note: is_visible column doesn't exist. Videos should still be visible.");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixVisibility().catch(console.error);



