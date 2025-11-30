import { NextRequest, NextResponse } from "next/server";
import { createVideo } from "@/lib/db";

// POST - Save video metadata after client-side Blob upload
// The file is already uploaded directly to Blob storage by the client
export async function POST(request: NextRequest) {
  const saveStartTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      blobUrl, 
      blobPath,
      title, 
      description, 
      category, 
      display_date,
      file_name,
      file_size 
    } = body;

    console.log("\n💾 [SAVE METADATA] " + "=".repeat(60));
    console.log(`   Title: ${title}`);
    console.log(`   File: ${file_name || "unknown"}`);
    console.log(`   Category: ${category || "none"}`);
    console.log(`   Blob URL: ${blobUrl?.substring(0, 60)}...`);

    if (!blobUrl) {
      console.error("❌ No blob URL provided");
      return NextResponse.json(
        { error: "Blob URL is required" },
        { status: 400 }
      );
    }

    if (!title) {
      console.error("❌ No title provided");
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    console.log("   ⏳ Creating video record in database...");
    // Create video record in database
    const video = await createVideo({
      title,
      description: description || undefined,
      category: category || undefined,
      video_url: blobUrl,
      blob_url: blobUrl,
      file_name: file_name || "uploaded-video",
      file_size: file_size || null,
      display_date: display_date || undefined,
    });

    const saveTime = (Date.now() - saveStartTime) / 1000;
    console.log(`   ✓ Video saved successfully!`);
    console.log(`   📊 Video ID: ${video.id}`);
    console.log(`   ⏱️  Save time: ${saveTime.toFixed(2)}s`);
    console.log("💾 [SAVE METADATA END] " + "=".repeat(60) + "\n");

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    const saveTime = (Date.now() - saveStartTime) / 1000;
    console.error("\n❌ [SAVE METADATA ERROR] " + "=".repeat(60));
    console.error(`   Failed after: ${saveTime.toFixed(2)}s`);
    console.error(`   Error type:`, error?.constructor?.name);
    console.error(`   Error message:`, error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(`   Stack:`, error.stack);
    }
    console.error("❌ [SAVE METADATA ERROR END] " + "=".repeat(60) + "\n");
  
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
  
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
        errorType: error?.constructor?.name || typeof error
      },
      { status: 500 }
    );
  }
}

