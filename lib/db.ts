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
  created_at: string;
  updated_at: string;
}

export async function getVideos(category?: string): Promise<Video[]> {
  try {
    if (category) {
      const videos = await prisma.video.findMany({
        where: { category },
        orderBy: { created_at: "desc" },
      });
      return videos.map(v => ({
        ...v,
        file_size: v.file_size ? Number(v.file_size) : null,
        created_at: v.created_at.toISOString(),
        updated_at: v.updated_at.toISOString(),
      })) as Video[];
    }
    
    const videos = await prisma.video.findMany({
      orderBy: { created_at: "desc" },
    });
    return videos.map(v => ({
      ...v,
      file_size: v.file_size ? Number(v.file_size) : null,
      created_at: v.created_at.toISOString(),
      updated_at: v.updated_at.toISOString(),
    })) as Video[];
  } catch (error) {
    console.error("Error in getVideos:", error);
    throw error;
  }
}

export async function getVideoById(id: number): Promise<Video | null> {
  const video = await prisma.video.findUnique({
    where: { id },
  });
  return video as Video | null;
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
}): Promise<Video> {
  const video = await prisma.video.create({
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category || null,
      video_url: data.video_url,
      thumbnail_url: data.thumbnail_url || null,
      blob_url: data.blob_url,
      file_name: data.file_name,
      file_size: data.file_size ? BigInt(data.file_size) : null,
      duration: data.duration || null,
    },
  });
  return {
    ...video,
    file_size: video.file_size ? Number(video.file_size) : null,
  } as Video;
}

export async function deleteVideo(id: number): Promise<boolean> {
  try {
    await prisma.video.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    return false;
  }
}
