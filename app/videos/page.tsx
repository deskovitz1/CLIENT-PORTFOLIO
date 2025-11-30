import { VideoHomepage } from "@/components/video-homepage"

interface VideosPageProps {
  searchParams: { category?: string }
}

export default function VideosPage({ searchParams }: VideosPageProps) {
  return <VideoHomepage initialCategory={searchParams.category} />
}

