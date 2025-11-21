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
  if (category) {
    return prisma.video.findMany({
      where: { category },
      orderBy: { created_at: "desc" },
    }) as Promise<Video[]>;
  }
  
  return prisma.video.findMany({
    orderBy: { created_at: "desc" },
  }) as Promise<Video[]>;
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
