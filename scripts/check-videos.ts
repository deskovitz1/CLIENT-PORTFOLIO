#!/usr/bin/env node
/**
 * Check videos in database
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { prisma } from "../lib/prisma";

async function checkVideos() {
  try {
    console.log("🔍 Checking videos in database...\n");

    // Try simple query first
    const count = await prisma.video.count();
    console.log(`Total videos in database: ${count}\n`);

    if (count === 0) {
      console.log("❌ No videos found in database!");
      console.log("\n💡 Run: npm run import-blob-videos");
      return;
    }

    // Get first 10 videos
    const videos = await prisma.video.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        is_visible: true,
        blob_url: true,
      },
    });

    console.log(`Found ${videos.length} video(s):\n`);
    videos.forEach((v) => {
      console.log(`  ID: ${v.id}`);
      console.log(`  Title: ${v.title}`);
      console.log(`  Visible: ${v.is_visible ?? "null (defaults to true)"}`);
      console.log(`  URL: ${v.blob_url.substring(0, 60)}...`);
      console.log("");
    });

    // Check visibility
    const visibleCount = await prisma.video.count({
      where: { is_visible: true },
    });
    const nullVisibleCount = await prisma.video.count({
      where: { is_visible: null },
    });
    const falseVisibleCount = await prisma.video.count({
      where: { is_visible: false },
    });

    console.log(`\n📊 Visibility breakdown:`);
    console.log(`  Visible (true): ${visibleCount}`);
    console.log(`  Null (defaults to visible): ${nullVisibleCount}`);
    console.log(`  Hidden (false): ${falseVisibleCount}`);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("\nStack:", error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideos().catch(console.error);



