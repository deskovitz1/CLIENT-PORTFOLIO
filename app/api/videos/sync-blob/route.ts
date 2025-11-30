import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// POST - Sync videos from Blob Storage to database
export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Blob storage not configured" },
        { status: 500 }
      );
    }

    console.log("Syncing videos from Blob Storage...");

    // List all blobs
    const { blobs } = await list({
      limit: 1000,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`Found ${blobs.length} file(s) in Blob Storage`);

    if (blobs.length === 0) {
      return NextResponse.json({ 
        imported: 0, 
        skipped: 0, 
        errors: 0,
        message: "No files found in Blob Storage"
      });
    }

    // Filter for video files
    const videoExtensions = [".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"];
    const videoBlobs = blobs.filter((blob) => {
      const extension = blob.pathname.toLowerCase().substring(blob.pathname.lastIndexOf("."));
      return videoExtensions.includes(extension);
    });

    console.log(`Found ${videoBlobs.length} video file(s)`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const blob of videoBlobs) {
      try {
        // Extract filename from pathname
        const fileName = blob.pathname.split("/").pop() || blob.pathname;
        
        // Check if video already exists in database (using raw query to avoid schema issues)
        const { prisma } = await import("@/lib/prisma");
        const existing = await prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id FROM videos 
          WHERE blob_url = ${blob.url} 
             OR video_url = ${blob.url} 
             OR file_name = ${fileName}
          LIMIT 1
        `.catch(() => []);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        // Extract title from filename
        const title = fileName
          .replace(/\.[^/.]+$/, "") // Remove extension
          .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
          .replace(/%20/g, " ") // Replace URL-encoded spaces
          .trim();

        // Create video record using raw SQL to avoid schema issues
        // IMPORTANT: Do not set visible - let the default (true) apply
        // Sync NEVER touches visibility of existing videos
        const result = await prisma.$queryRaw<Array<{ id: number }>>`
          INSERT INTO videos (title, description, category, video_url, blob_url, file_name, file_size, duration, created_at, updated_at)
          VALUES (${title || fileName}, NULL, NULL, ${blob.url}, ${blob.url}, ${fileName}, ${blob.size ? BigInt(blob.size) : null}, NULL, NOW(), NOW())
          RETURNING id
        `.catch(async (error) => {
          // If display_date column exists, include it (but still don't set visible - use default)
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

        imported++;
      } catch (error) {
        console.error(`Error importing ${blob.pathname}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors,
      total: videoBlobs.length,
      message: `Imported ${imported} new video(s), skipped ${skipped} existing video(s)`
    });
  } catch (error) {
    console.error("Error syncing videos:", error);
    return NextResponse.json(
      { 
        error: "Failed to sync videos from blob storage",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

