import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

// Helper function to format time
function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

// POST - Upload file directly to Blob (server-side)
// This route handles the file upload server-side to avoid client-side limitations
export async function POST(request: NextRequest) {
  const uploadStartTime = Date.now();
  const startTime = new Date().toLocaleTimeString();
  let lastProgressUpdate = Date.now();
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    const fileSize = file.size;
    const fileSizeFormatted = formatFileSize(fileSize);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    console.log("\n📤 [UPLOAD START] " + "=".repeat(60));
    console.log(`   File: ${filename}`);
    console.log(`   Size: ${fileSizeFormatted} (${fileSizeMB} MB)`);
    console.log(`   Type: ${file.type || "video/mp4"}`);
    console.log(`   Started: ${startTime}`);
    console.log("   " + "-".repeat(58));
    console.log(`   📥 Receiving file from client...`);

    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("❌ BLOB_READ_WRITE_TOKEN is not set");
      return NextResponse.json(
        { 
          error: "Blob storage not configured",
          details: "BLOB_READ_WRITE_TOKEN environment variable is missing"
        },
        { status: 500 }
      );
    }

    // Convert File to Buffer with progress tracking
    const bufferStartTime = Date.now();
    console.log(`   ⏳ Reading ${fileSizeMB} MB into buffer...`);
    
    // Track buffer reading progress (simulated since we can't track arrayBuffer() progress)
    const buffer = Buffer.from(await file.arrayBuffer());
    const bufferTime = (Date.now() - bufferStartTime) / 1000;
    const bufferSpeed = fileSize / bufferTime;
    
    console.log(`   ✓ Buffer created: ${fileSizeMB} MB in ${bufferTime.toFixed(2)}s (${formatFileSize(bufferSpeed)}/s)`);
    console.log(`   📤 Uploading ${fileSizeMB} MB to Vercel Blob storage...`);
    
    // Upload to Vercel Blob with live progress updates
    const blobStartTime = Date.now();
    let progressInterval: NodeJS.Timeout | null = null;
    let lastUpdateTime = blobStartTime;
    let bytesUploadedEstimate = 0;
    
    // Show live progress updates every 1 second
    progressInterval = setInterval(() => {
      const elapsed = (Date.now() - blobStartTime) / 1000;
      const currentTime = new Date().toLocaleTimeString();
      
      // Estimate progress (we can't get real progress from Vercel Blob API)
      // Show elapsed time and file size being uploaded
      const elapsedFormatted = elapsed < 60 
        ? `${elapsed.toFixed(1)}s` 
        : `${Math.floor(elapsed / 60)}m ${(elapsed % 60).toFixed(0)}s`;
      
      process.stdout.write(`\r   ⏳ [${currentTime}] Uploading ${fileSizeMB} MB... ${elapsedFormatted} elapsed`);
    }, 1000);
    
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type || "video/mp4",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (progressInterval) {
      clearInterval(progressInterval);
      // Clear the progress line
      process.stdout.write('\r' + ' '.repeat(100) + '\r');
    }

    const blobTime = (Date.now() - blobStartTime) / 1000;
    const totalTime = (Date.now() - uploadStartTime) / 1000;
    const uploadSpeed = fileSize / blobTime; // bytes per second
    const uploadSpeedFormatted = formatFileSize(uploadSpeed) + "/s";

    // Clear the progress line and show completion
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    
    console.log("   " + "-".repeat(58));
    console.log(`   ✅ Upload completed successfully!`);
    console.log(`   📊 Upload Statistics:`);
    console.log(`      ✅ ${fileSizeMB} MB uploaded`);
    console.log(`      ⏱️  Upload time: ${formatTime(blobTime)}`);
    console.log(`      🚀 Upload speed: ${uploadSpeedFormatted}`);
    console.log(`      📦 Total time: ${formatTime(totalTime)}`);
    console.log(`      🔗 Blob URL: ${blob.url.substring(0, 60)}...`);
    console.log(`   Completed: ${new Date().toLocaleTimeString()}`);
    console.log("📤 [UPLOAD END] " + "=".repeat(60) + "\n");

    return NextResponse.json({ 
      blobUrl: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    const totalTime = (Date.now() - uploadStartTime) / 1000;
    console.error("\n❌ [UPLOAD ERROR] " + "=".repeat(60));
    console.error(`   File: ${filename || "unknown"}`);
    console.error(`   Failed after: ${formatTime(totalTime)}`);
    console.error(`   Error:`, error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(`   Stack:`, error.stack);
    }
    console.error("❌ [UPLOAD ERROR END] " + "=".repeat(60) + "\n");
    
    return NextResponse.json(
      { 
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET handler removed - use POST with FormData instead

