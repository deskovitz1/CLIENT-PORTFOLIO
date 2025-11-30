import { VideoHomepage } from "@/components/video-homepage"

// Disable static caching so visibility changes are immediately visible
export const dynamic = 'force-dynamic'

interface VideosPageProps {
  searchParams: { category?: string }
}

export default function VideosPage({ searchParams }: VideosPageProps) {
  return <VideoHomepage initialCategory={searchParams.category} />
}

