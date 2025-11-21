#!/usr/bin/env tsx

/**
 * Find video URL by filename in the database
 */

import { prisma } from "../lib/prisma";

async function findVideoUrl() {
  try {
    const filename = "A_cinematic__Blender_style_animated_sequence_inside_a_handcrafted_miniature_world__The_scene_begins_%204K.mp4";
    
    console.log("🔍 Searching for video...\n");
    
    const video = await prisma.video.findFirst({
      where: {
        file_name: {
          contains: filename.replace('%', ''),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    
    if (!video) {
      console.log("❌ Video not found in database");
      console.log("\n💡 Try searching all videos:");
      const allVideos = await prisma.video.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          blob_url: true,
          file_name: true,
        },
      });
      console.log("\nRecent videos:");
      allVideos.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.file_name}`);
        console.log(`      URL: ${v.blob_url}\n`);
      });
      return;
    }
    
    console.log("✅ Found video!\n");
    console.log(`   Title: ${video.title}`);
    console.log(`   File: ${video.file_name}`);
    console.log(`\n📋 Blob URL:`);
    console.log(`   ${video.blob_url}\n`);
    
    // Try to copy to clipboard
    try {
      const { execSync } = require("child_process");
      if (process.platform === "darwin") {
        execSync(`echo "${video.blob_url}" | pbcopy`);
        console.log("📋 URL copied to clipboard!\n");
      }
    } catch (e) {
      // Clipboard copy failed, that's okay
    }
    
    return video.blob_url;
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("DATABASE_URL")) {
      console.error("\n💡 Make sure DATABASE_URL is set in .env.local");
    }
    process.exit(1);
  }
}

findVideoUrl().catch(console.error);
