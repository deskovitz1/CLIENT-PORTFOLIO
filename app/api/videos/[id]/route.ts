import { NextRequest, NextResponse } from "next/server";
import { getVideoById } from "@/lib/db";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// DELETE a video
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { error: 'Invalid id', details: params.id },
        { status: 400 },
      );
    }

    // Get video first to check if it exists and get blob URL
    const video = await prisma.video.findUnique({
      where: { id },
      select: { id: true, blob_url: true, title: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 },
      );
    }

    // Try to delete from Vercel Blob (non-blocking - continue even if this fails)
    let blobDeleted = false;
    if (video.blob_url) {
      try {
        await del(video.blob_url, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        blobDeleted = true;
      } catch (blobError) {
        // Log but don't fail - blob might not exist or be in different format
        console.warn('Could not delete blob, continuing with database deletion:', blobError);
      }
    }

    // Delete from database using raw SQL to avoid schema mismatch issues
    try {
      await prisma.video.delete({
        where: { id },
      });
    } catch (deleteError: any) {
      // If Prisma delete fails due to schema mismatch, use raw SQL
      const errorMsg = deleteError?.message?.toLowerCase() || String(deleteError).toLowerCase();
      if (errorMsg.includes('column') || errorMsg.includes('does not exist') || errorMsg.includes('display_date')) {
        console.warn('Prisma delete failed due to schema mismatch, using raw SQL');
        await prisma.$executeRaw`DELETE FROM videos WHERE id = ${id}`;
      } else {
        throw deleteError;
      }
    }

    return NextResponse.json({ 
      success: true, 
      video: { id: video.id, title: video.title },
      blobDeleted,
    });
  } catch (err: any) {
    console.error('DELETE /api/videos/[id] error', err);
    return NextResponse.json(
      {
        error: 'Failed to delete video',
        details: err?.message || String(err),
      },
      { status: 500 },
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

    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { error: 'Invalid id', details: params.id },
        { status: 400 },
      );
    }

    const body = await request.json();
    const data: any = {};

    if (typeof body.title === 'string') data.title = body.title;
    if (typeof body.description === 'string') data.description = body.description;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided' },
        { status: 400 },
      );
    }

    // Try Prisma update first
    let video;
    try {
      video = await prisma.video.update({
        where: { id },
        data,
      });
    } catch (prismaError: any) {
      // If Prisma update fails due to schema mismatch, use raw SQL
      const errorMsg = prismaError?.message?.toLowerCase() || String(prismaError).toLowerCase();
      if (errorMsg.includes('column') || errorMsg.includes('does not exist') || errorMsg.includes('unknown argument')) {
        console.warn('Prisma update failed due to schema mismatch, using raw SQL');
        
        // Build SET clause for raw SQL with proper escaping
        const setParts: string[] = [];
        
        if (typeof body.title === 'string') {
          // Escape single quotes in title
          const escapedTitle = body.title.replace(/'/g, "''");
          setParts.push(`title = '${escapedTitle}'`);
        }
        
        if (typeof body.description === 'string') {
          // Escape single quotes in description
          const escapedDesc = body.description.replace(/'/g, "''");
          setParts.push(`description = '${escapedDesc}'`);
        } else if (body.description === null || body.description === '') {
          setParts.push(`description = NULL`);
        }
        
        if (setParts.length === 0) {
          return NextResponse.json(
            { error: 'No valid fields provided' },
            { status: 400 },
          );
        }
        
        // Add updated_at
        setParts.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // Execute raw SQL update (using template literal with proper escaping)
        await prisma.$executeRawUnsafe(
          `UPDATE videos SET ${setParts.join(', ')} WHERE id = ${id}`
        );
        
        // Fetch updated video
        const updatedVideos = await prisma.$queryRawUnsafe<Array<any>>(
          `SELECT * FROM videos WHERE id = ${id}`
        );
        
        if (updatedVideos.length === 0) {
          return NextResponse.json(
            { error: 'Video not found' },
            { status: 404 },
          );
        }
        
        video = updatedVideos[0];
      } else {
        throw prismaError;
      }
    }

    // Format response to match Video interface
    return NextResponse.json({
      ...video,
      file_size: video.file_size ? Number(video.file_size) : null,
      display_date: video.display_date ? (typeof video.display_date === 'string' ? video.display_date : video.display_date.toISOString()) : null,
      visible: video.visible !== null && video.visible !== undefined ? Boolean(video.visible) : true,
      created_at: video.created_at ? (typeof video.created_at === 'string' ? video.created_at : video.created_at.toISOString()) : new Date().toISOString(),
      updated_at: video.updated_at ? (typeof video.updated_at === 'string' ? video.updated_at : video.updated_at.toISOString()) : new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('PATCH /api/videos/[id] error', err);
    return NextResponse.json(
      { error: 'Failed to update video', details: err?.message || String(err) },
      { status: 500 },
    );
  }
}

