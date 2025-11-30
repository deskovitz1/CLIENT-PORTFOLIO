import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Enforce BLOB_READ_WRITE_TOKEN is set - fail loudly if missing
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN missing – uploads disabled. Set BLOB_READ_WRITE_TOKEN in environment variables.');
}

// POST - Upload file directly to Blob (server-side)
// This route handles the file upload server-side to avoid client-side limitations
export async function POST(request: NextRequest) {
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

    console.log("Uploading file to Blob:", filename, "Size:", file.size);

    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set");
      return NextResponse.json(
        { 
          error: "Blob storage not configured",
          details: "BLOB_READ_WRITE_TOKEN environment variable is missing"
        },
        { status: 500 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type || "video/mp4",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log("File uploaded successfully:", blob.url);

    return NextResponse.json({ 
      blobUrl: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    console.error("Error details:", error instanceof Error ? error.stack : String(error));
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

