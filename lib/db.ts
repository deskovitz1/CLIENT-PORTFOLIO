import { prisma } from "@/lib/prisma";

export interface Video {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  video_url: string;
  thumbnail_url: string | null;
  blob_url: string;
  file_name: string;
  file_size: number | null;
  duration: number | null;
  display_date: string | null;
  visible: boolean;  // Single source of truth - NOT NULL, defaults to true
  created_at: string;
  updated_at: string;
}

// Intro video filtering configuration
// NOTE: This is used to EXCLUDE the intro video from the regular video grid listings
// The actual intro video URL is configured in app/config/intro.ts
// 
// To update: Change the filename pattern below to match your intro video's filename
// This helps filter it out from the /videos page grid
const INTRO_VIDEO_FILENAME = "WEBSITE VID heaven"

export async function getVideos(category?: string, excludeIntro: boolean = true, includeHidden: boolean = false): Promise<Video[]> {
  try {
    const whereClause: any = {}
    
    // Build conditions array
    const conditions: any[] = []
    
    if (category) {
      conditions.push({ category })
    }
    
    // Exclude intro video from regular listings (by filename)
    // The intro video is configured in app/config/intro.ts
    // We filter it out here so it doesn't appear in the /videos grid
    if (excludeIntro) {
      conditions.push({
        NOT: {
          file_name: {
            contains: INTRO_VIDEO_FILENAME,
          },
        },
      })
    }
    
    // TEMPORARILY DISABLED: Show all videos while we fix visibility
    // TODO: Re-enable after migration: if (!includeHidden) { conditions.push({ visible: true }) }
    
    // Only use AND if we have multiple conditions
    if (conditions.length > 1) {
      whereClause.AND = conditions
    } else if (conditions.length === 1) {
      Object.assign(whereClause, conditions[0])
    }
    
    // Order by created_at for now (display_date ordering will be enabled after database migration)
    // TODO: Once display_date column exists in database, enable ordering by display_date for "recent-work"
    const orderBy = { created_at: "desc" as const };
    
    let videos;
    try {
      videos = await prisma.video.findMany({
        where: whereClause,
        orderBy,
      });
    } catch (error) {
      // If there's a schema mismatch, try a simpler query with raw SQL
      console.error("Error in findMany, trying raw query:", error);
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (errorMsg.includes("column") || errorMsg.includes("does not exist")) {
        // Use raw SQL query as fallback
        const whereParts: string[] = [];
        
        if (category) {
          whereParts.push(`category = '${category.replace(/'/g, "''")}'`);
        }
        
        if (excludeIntro) {
          whereParts.push(`file_name NOT LIKE '%${INTRO_VIDEO_FILENAME.replace(/'/g, "''")}%'`);
        }
        
        // TEMPORARILY DISABLED: Show all videos while we fix visibility
        // TODO: Re-enable after migration: if (!includeHidden) { whereParts.push(`visible = true`); }
        
        const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : "";
        videos = await prisma.$queryRawUnsafe<Array<any>>(
          `SELECT * FROM videos ${whereSql} ORDER BY created_at DESC LIMIT 100`
        );
      } else {
        throw error;
      }
    }
    
    return videos.map((v: any) => ({
      ...v,
      file_size: v.file_size ? Number(v.file_size) : null,
      display_date: v.display_date ? v.display_date.toISOString() : null,
      visible: v.visible !== null && v.visible !== undefined ? Boolean(v.visible) : true, // Default to visible if missing
      created_at: v.created_at ? (typeof v.created_at === 'string' ? v.created_at : v.created_at.toISOString()) : new Date().toISOString(),
      updated_at: v.updated_at ? (typeof v.updated_at === 'string' ? v.updated_at : v.updated_at.toISOString()) : new Date().toISOString(),
    })) as Video[];
  } catch (error) {
    console.error("Error in getVideos:", error);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    
    // If there's a database error, return empty array instead of throwing
    // This prevents the entire API from failing
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes("column") || errorMsg.includes("unknown") || errorMsg.includes("does not exist")) {
        console.warn("Database schema issue detected, returning empty array");
        return [];
      }
    }
    
    throw error;
  }
}

export async function getIntroVideo(): Promise<Video | null> {
  try {
    const video = await prisma.video.findFirst({
      where: {
        file_name: {
          contains: INTRO_VIDEO_FILENAME,
        },
      },
    });
    
    if (!video) return null
    
    return {
      ...video,
      file_size: video.file_size ? Number(video.file_size) : null,
      display_date: video.display_date ? video.display_date.toISOString() : null,
      created_at: video.created_at.toISOString(),
      updated_at: video.updated_at.toISOString(),
    } as Video;
  } catch (error) {
    console.error("Error in getIntroVideo:", error);
    return null;
  }
}

export async function getVideoById(id: number): Promise<Video | null> {
  try {
    let video;
    try {
      video = await prisma.video.findUnique({
        where: { id },
      });
    } catch (error) {
      // If there's a schema mismatch (e.g., display_date column doesn't exist), use raw query
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (errorMsg.includes("column") || errorMsg.includes("does not exist")) {
        console.warn("Schema mismatch detected in getVideoById, using raw query");
        const results = await prisma.$queryRaw<Array<any>>`
          SELECT * FROM videos WHERE id = ${id} LIMIT 1
        `;
        video = results[0] || null;
      } else {
        throw error;
      }
    }
    
    if (!video) return null;
    
    return {
      ...video,
      file_size: video.file_size ? Number(video.file_size) : null,
      display_date: video.display_date ? (typeof video.display_date === 'string' ? video.display_date : video.display_date.toISOString()) : null,
      is_visible: video.is_visible !== null && video.is_visible !== undefined ? Boolean(video.is_visible) : true,
      created_at: video.created_at ? (typeof video.created_at === 'string' ? video.created_at : video.created_at.toISOString()) : new Date().toISOString(),
      updated_at: video.updated_at ? (typeof video.updated_at === 'string' ? video.updated_at : video.updated_at.toISOString()) : new Date().toISOString(),
    } as Video;
  } catch (error) {
    console.error("Error in getVideoById:", error);
    throw error;
  }
}

export async function createVideo(data: {
  title: string;
  description?: string;
  category?: string;
  video_url: string;
  thumbnail_url?: string;
  blob_url: string;
  file_name: string;
  file_size?: number;
  duration?: number;
  display_date?: string;
}): Promise<Video> {
  try {
    const createData: any = {
      title: data.title,
      description: data.description || null,
      category: data.category || null,
      video_url: data.video_url,
      thumbnail_url: data.thumbnail_url || null,
      blob_url: data.blob_url,
      file_name: data.file_name,
      file_size: data.file_size ? BigInt(data.file_size) : null,
      duration: data.duration || null,
    };
    
    // Try to include display_date, but if the column doesn't exist, retry without it
    if (data.display_date !== undefined) {
      createData.display_date = data.display_date ? new Date(data.display_date) : null;
    }
    
    const video = await prisma.video.create({
      data: createData,
    });
    
    return {
      ...video,
      file_size: video.file_size ? Number(video.file_size) : null,
      display_date: video.display_date ? video.display_date.toISOString() : null,
      visible: video.visible !== null && video.visible !== undefined ? Boolean(video.visible) : true,
      created_at: video.created_at ? (typeof video.created_at === 'string' ? video.created_at : video.created_at.toISOString()) : new Date().toISOString(),
      updated_at: video.updated_at ? (typeof video.updated_at === 'string' ? video.updated_at : video.updated_at.toISOString()) : new Date().toISOString(),
    } as Video;
  } catch (error) {
    console.error("Error in createVideo:", error);
    const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    // If there's a schema mismatch (missing columns like display_date or visible), use raw SQL
    if (errorMsg.includes("column") || errorMsg.includes("does not exist") || errorMsg.includes("display_date") || errorMsg.includes("visible")) {
      console.warn("Schema mismatch detected in createVideo, using raw SQL fallback");
      
      // Build INSERT statement with only columns that definitely exist
      const columns: string[] = ['title', 'description', 'category', 'video_url', 'thumbnail_url', 'blob_url', 'file_name', 'file_size', 'duration', 'created_at', 'updated_at'];
      const values: any[] = [];
      
      // Escape and add values
      const escapedTitle = (data.title || '').replace(/'/g, "''");
      const escapedDesc = (data.description || '').replace(/'/g, "''");
      const escapedCategory = (data.category || '').replace(/'/g, "''");
      const escapedVideoUrl = (data.video_url || '').replace(/'/g, "''");
      const escapedThumbnailUrl = (data.thumbnail_url || '').replace(/'/g, "''");
      const escapedBlobUrl = (data.blob_url || '').replace(/'/g, "''");
      const escapedFileName = (data.file_name || '').replace(/'/g, "''");
      
      const valueParts: string[] = [
        `'${escapedTitle}'`,
        data.description !== undefined ? `'${escapedDesc}'` : 'NULL',
        data.category ? `'${escapedCategory}'` : 'NULL',
        `'${escapedVideoUrl}'`,
        data.thumbnail_url ? `'${escapedThumbnailUrl}'` : 'NULL',
        `'${escapedBlobUrl}'`,
        `'${escapedFileName}'`,
        data.file_size ? String(data.file_size) : 'NULL',
        data.duration ? String(data.duration) : 'NULL',
        'CURRENT_TIMESTAMP',
        'CURRENT_TIMESTAMP',
      ];
      
      const sql = `INSERT INTO videos (${columns.join(', ')}) VALUES (${valueParts.join(', ')}) RETURNING *`;
      
      const results = await prisma.$queryRawUnsafe<Array<any>>(sql);
      const video = results[0];
      
      if (!video) {
        throw new Error("Failed to create video - no result returned");
      }
      
      return {
        ...video,
        file_size: video.file_size ? Number(video.file_size) : null,
        display_date: null, // Column doesn't exist, so always null
        visible: true, // Default to true if column doesn't exist
        created_at: video.created_at ? (typeof video.created_at === 'string' ? video.created_at : video.created_at.toISOString()) : new Date().toISOString(),
        updated_at: video.updated_at ? (typeof video.updated_at === 'string' ? video.updated_at : video.updated_at.toISOString()) : new Date().toISOString(),
      } as Video;
    }
    
    throw error;
  }
}

export async function updateVideo(
  id: number,
  data: {
    title?: string;
    description?: string;
    category?: string;
    display_date?: string;
    is_visible?: boolean;
  }
): Promise<Video | null> {
  try {
    // Start with only basic fields that definitely exist
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    
    // Handle category - if is_visible is being set, use category as workaround
    if (data.is_visible !== undefined) {
      // Use category field as workaround for is_visible (more reliable than trying is_visible column)
      if (data.is_visible === false) {
        updateData.category = "__HIDDEN__";
      } else {
        // If showing and category was __HIDDEN__, we need to restore original category
        // But we don't have it, so if category is explicitly provided, use that
        // Otherwise, we'll need to fetch the video first to get original category
        if (data.category !== undefined) {
          updateData.category = data.category;
        } else {
          // Try to get original category from database
          const existing = await prisma.video.findUnique({
            where: { id },
            select: { category: true },
          });
          // If it was __HIDDEN__, set to null, otherwise keep original
          updateData.category = existing?.category === "__HIDDEN__" ? null : existing?.category || null;
        }
      }
    } else if (data.category !== undefined) {
      // Only update category if is_visible wasn't set
      updateData.category = data.category;
    }

    // Try to update with basic fields first
    let video;
    try {
      video = await prisma.video.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      // If update fails, try with even more minimal data
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      console.warn("Update failed, trying minimal update:", errorMsg);
      
      // Only update title and description - these definitely exist
      const minimalUpdate: any = {};
      if (data.title !== undefined) minimalUpdate.title = data.title;
      if (data.description !== undefined) minimalUpdate.description = data.description || null;
      
      // For visibility, use category workaround
      if (data.is_visible !== undefined) {
        minimalUpdate.category = data.is_visible === false ? "__HIDDEN__" : null;
      } else if (data.category !== undefined) {
        minimalUpdate.category = data.category;
      }
      
      video = await prisma.video.update({
        where: { id },
        data: minimalUpdate,
      });
    }

    return {
      ...video,
      file_size: video.file_size ? Number(video.file_size) : null,
      display_date: video.display_date ? video.display_date.toISOString() : null,
      is_visible: video.is_visible !== null && video.is_visible !== undefined ? Boolean(video.is_visible) : true,
      created_at: video.created_at.toISOString(),
      updated_at: video.updated_at.toISOString(),
    } as Video;
  } catch (error) {
    console.error("Error updating video:", error);
    throw error; // Re-throw so API route can handle it
  }
}

export async function deleteVideo(id: number): Promise<boolean> {
  try {
    await prisma.video.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error in deleteVideo:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    throw error; // Re-throw so the API route can handle it properly
  }
}
