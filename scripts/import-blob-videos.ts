#!/usr/bin/env node
/**
 * Import videos from Vercel Blob Storage into the database
 * 
 * This script:
 * 1. Lists all videos in your Vercel Blob storage
 * 2. For each video, creates a database record if it doesn't exist
 * 
 * Usage:
 *   pnpm tsx scripts/import-blob-videos.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { list } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function importBlobVideos() {
  try {
    // Check for required environment variables
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("❌ BLOB_READ_WRITE_TOKEN environment variable is not set");
      console.error("\n💡 Make sure .env.local contains:");
      console.error("   BLOB_READ_WRITE_TOKEN=your_token_here\n");
      process.exit(1);
    }

    console.log("📦 Fetching videos from Vercel Blob Storage...\n");

    // List all blobs
    const { blobs } = await list({
      limit: 1000, // Adjust if you have more videos
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`Found ${blobs.length} file(s) in Blob Storage\n`);

    if (blobs.length === 0) {
      console.log("No files found in Blob Storage.");
      return;
    }

    // Filter for video files
    const videoExtensions = [".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"];
    const videoBlobs = blobs.filter((blob) => {
      const extension = blob.pathname.toLowerCase().substring(blob.pathname.lastIndexOf("."));
      return videoExtensions.includes(extension);
    });

    console.log(`Found ${videoBlobs.length} video file(s)\n`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const blob of videoBlobs) {
      try {
        // Extract filename from pathname
        const fileName = blob.pathname.split("/").pop() || blob.pathname;
        
        // Check if video already exists in database (using raw query to avoid schema issues)
        const existing = await prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id FROM videos 
          WHERE blob_url = ${blob.url} 
             OR video_url = ${blob.url} 
             OR file_name = ${fileName}
          LIMIT 1
        `.catch(() => []);

        if (existing && existing.length > 0) {
          console.log(`⏭️  Skipped (already exists): ${blob.pathname}`);
          skipped++;
          continue;
        }
        
        // Try to extract a title from filename (remove extension, replace dashes/underscores with spaces)
        const title = fileName
          .replace(/\.[^/.]+$/, "") // Remove extension
          .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
          .replace(/%20/g, " ") // Replace URL-encoded spaces
          .trim();

        // Create video record using raw SQL to avoid schema issues
        const result = await prisma.$queryRaw<Array<{ id: number }>>`
          INSERT INTO videos (title, description, category, video_url, blob_url, file_name, file_size, duration, created_at, updated_at)
          VALUES (${title || fileName}, NULL, NULL, ${blob.url}, ${blob.url}, ${fileName}, ${blob.size ? BigInt(blob.size) : null}, NULL, NOW(), NOW())
          RETURNING id
        `.catch(async (error) => {
          // If display_date column exists, try with it
          if (error.message?.includes("display_date")) {
            return await prisma.$queryRaw<Array<{ id: number }>>`
              INSERT INTO videos (title, description, category, video_url, blob_url, file_name, file_size, duration, display_date, created_at, updated_at)
              VALUES (${title || fileName}, NULL, NULL, ${blob.url}, ${blob.url}, ${fileName}, ${blob.size ? BigInt(blob.size) : null}, NULL, NULL, NOW(), NOW())
              RETURNING id
            `;
          }
          throw error;
        });

        const videoId = result[0]?.id;
        if (!videoId) {
          throw new Error("Failed to get video ID after insert");
        }

        console.log(`✅ Imported: ${title} (ID: ${videoId})`);
        imported++;
      } catch (error) {
        console.error(`❌ Error importing ${blob.pathname}:`, error instanceof Error ? error.message : String(error));
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✨ Done! Your videos should now appear on the website.`);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importBlobVideos().catch(console.error);

