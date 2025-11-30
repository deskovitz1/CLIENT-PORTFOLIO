"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Video } from "@/lib/db"

interface VideoPlayerProps {
  video?: Video
  videoUrl?: string
  title?: string
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayer({ video, videoUrl, title, isOpen, onClose }: VideoPlayerProps) {
  // Get URL using the same logic as the hover preview
  // If video object is passed, use video.video_url || video.blob_url
  // If only videoUrl string is passed, use that
  const url = video 
    ? (video.video_url || video.blob_url || "")
    : (videoUrl || "")

  if (!isOpen) return null

  if (!url) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
        <div className="relative w-full max-w-7xl aspect-video bg-black flex items-center justify-center">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="text-red-500 p-4 text-center">
            <p className="text-lg mb-2">No video URL available for this video.</p>
            {video && (
              <p className="text-sm text-gray-600">
                video.video_url: {video.video_url || "null"}
                <br />
                video.blob_url: {video.blob_url || "null"}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-7xl flex flex-col items-center">
        {/* Video Container */}
        <div className="relative w-full aspect-video bg-black">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <video
            src={url}
            controls
            autoPlay
            muted
            playsInline
            preload="auto"
            className="w-full h-full"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onError={(e) => {
              const video = e.currentTarget
              console.error("Video playback error:", {
                error: video.error,
                code: video.error?.code,
                message: video.error?.message,
                networkState: video.networkState,
                readyState: video.readyState,
                src: video.src,
              })
            }}
            onLoadedMetadata={() => {
              console.log("Video metadata loaded in modal", { url })
            }}
            onCanPlay={() => {
              console.log("Video can play in modal", { url })
            }}
            onCanPlayThrough={() => {
              console.log("Video fully buffered in modal", { url })
            }}
            onWaiting={() => {
              console.log("Video waiting for data in modal", { url })
            }}
            onPlay={() => {
              console.log("Video started playing in modal", { url })
            }}
          />
          
          {/* Title Overlay on Video - positioned to not block controls */}
        </div>
        
        {/* Title and Description below video */}
        {(title || video?.description) && (
          <div className="w-full mt-6">
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              {title && (
                <h3 className="text-gray-100 text-xl font-semibold mb-3">{title}</h3>
              )}
              {video?.description && (
                <>
                  <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Description</h4>
                  <p className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap">{video.description}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
