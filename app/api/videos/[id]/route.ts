import { NextRequest, NextResponse } from "next/server";
import { deleteVideo, getVideoById, updateVideo } from "@/lib/db";
import { del } from "@vercel/blob";

// DELETE a video
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400 }
      );
    }

    // Get video to retrieve blob URL
    const video = await getVideoById(id);

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    console.log(`Deleting video ID ${id}: ${video.title}`);
    console.log(`Blob URL: ${video.blob_url}`);

    // Delete from Vercel Blob
    let blobDeleted = false;
    try {
      if (video.blob_url) {
        // Try multiple approaches to delete the blob
        try {
          // First, try with the full URL
          await del(video.blob_url, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          blobDeleted = true;
          console.log("Blob deleted successfully (using full URL)");
        } catch (urlError) {
          // If that fails, try extracting the pathname
          try {
            const urlObj = new URL(video.blob_url);
            const pathname = urlObj.pathname.substring(1); // Remove leading slash
            
            console.log(`Attempting to delete blob with pathname: ${pathname}`);
            
            await del(pathname, {
              token: process.env.BLOB_READ_WRITE_TOKEN,
            });
            blobDeleted = true;
            console.log("Blob deleted successfully (using pathname)");
          } catch (pathError) {
            // If both fail, log but continue
            console.warn("Could not delete blob, but continuing with database deletion");
            console.error("URL deletion error:", urlError instanceof Error ? urlError.message : String(urlError));
            console.error("Pathname deletion error:", pathError instanceof Error ? pathError.message : String(pathError));
          }
        }
      }
    } catch (blobError) {
      console.error("Error deleting blob:", blobError);
      console.error("Blob error details:", blobError instanceof Error ? blobError.message : String(blobError));
      // Continue with database deletion even if blob deletion fails
      // The blob might not exist, might have been deleted already, or might be in a different format
      // This is not a fatal error - we still want to delete from the database
    }

    // Delete from database
    try {
      const deleted = await deleteVideo(id);

      if (!deleted) {
        console.error(`deleteVideo returned false for video ID ${id}`);
        return NextResponse.json(
          { 
            error: "Failed to delete video from database",
            details: "Database deletion returned false"
          },
          { status: 500 }
        );
      }
      
      console.log(`Video ${id} successfully deleted from database`);
    } catch (dbError: any) {
      console.error("Database deletion error:", dbError);
      console.error("Error type:", dbError?.constructor?.name);
      console.error("Error message:", dbError instanceof Error ? dbError.message : String(dbError));
      console.error("Error code:", dbError?.code);
      console.error("Error meta:", dbError?.meta);
      
      // Check if it's a "record not found" error (which is actually fine - video already deleted)
      if (dbError?.code === 'P2025' || dbError?.message?.includes('Record to delete does not exist')) {
        console.log(`Video ${id} not found in database (may have been already deleted)`);
        return NextResponse.json({ 
          success: true,
          blobDeleted,
          message: "Video not found in database (may have been already deleted)"
        });
      }
      
      return NextResponse.json(
        { 
          error: "Failed to delete video from database",
          details: dbError instanceof Error ? dbError.message : String(dbError),
          errorCode: dbError?.code,
          errorMeta: dbError?.meta
        },
        { status: 500 }
      );
    }

    console.log(`Video ${id} deleted successfully (blob: ${blobDeleted ? 'yes' : 'skipped'})`);
    return NextResponse.json({ 
      success: true,
      blobDeleted,
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    return NextResponse.json(
      { 
        error: "Failed to delete video",
        details: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name || typeof error
      },
      { status: 500 }
    );
  }
}

// GET a single video
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400 }
      );
    }

    const video = await getVideoById(id);

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}

// PATCH update a video
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, category, display_date, is_visible } = body;

    console.log(`Updating video ID ${id}:`, { title, description, category, display_date, is_visible });

    try {
      const video = await updateVideo(id, {
        title,
        description,
        category,
        display_date,
        is_visible,
      });

      if (!video) {
        console.error(`Video ${id} not found for update`);
        return NextResponse.json(
          { error: "Video not found or update failed" },
          { status: 404 }
        );
      }

      console.log(`Video ${id} updated successfully`);
      return NextResponse.json({ video });
    } catch (updateError: any) {
      console.error("Update error:", updateError);
      console.error("Error type:", updateError?.constructor?.name);
      console.error("Error message:", updateError instanceof Error ? updateError.message : String(updateError));
      console.error("Error code:", updateError?.code);
      console.error("Error meta:", updateError?.meta);
      
      return NextResponse.json(
        { 
          error: "Failed to update video",
          details: updateError instanceof Error ? updateError.message : String(updateError),
          errorCode: updateError?.code,
          errorMeta: updateError?.meta
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating video:", error);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    return NextResponse.json(
      { 
        error: "Failed to update video",
        details: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name || typeof error
      },
      { status: 500 }
    );
  }
}

