"use client"

import { useState, useRef, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react"
import { Video } from "@/lib/db"
import { useIsMobile } from "@/hooks/use-mobile"

interface VideoPlayerProps {
  video?: Video
  videoUrl?: string
  title?: string
  isOpen: boolean
  onClose: () => void
  allVideos?: Video[]
  currentVideoIndex?: number
  onNextVideo?: () => void
  onPrevVideo?: () => void
}

export function VideoPlayer({ 
  video, 
  videoUrl, 
  title, 
  isOpen, 
  onClose,
  allVideos = [],
  currentVideoIndex = 0,
  onNextVideo,
  onPrevVideo
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null) // Lazy-loaded video src
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = useIsMobile()
  
  // Get URL using the same logic as the hover preview (direct Blob URL, no API proxy)
  const url = video 
    ? (video.video_url || video.blob_url || "")
    : (videoUrl || "")

  // Lazy-load video src only when modal opens
  useEffect(() => {
    if (isOpen && url && !videoSrc) {
      // Set video src only when modal opens (user explicitly chose to watch)
      setVideoSrc(url);
    } else if (!isOpen) {
      // Clear video src when modal closes to free memory
      setVideoSrc(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    }
  }, [isOpen, url, videoSrc]);

  // Reset video src when video changes
  useEffect(() => {
    if (isOpen && url) {
      setVideoSrc(url);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [video?.id, videoUrl, isOpen]);

  // Reset controls timeout
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(true)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  // Handle video time updates
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(videoEl.currentTime)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(videoEl.duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      resetControlsTimeout()
    }

    const handlePause = () => {
      setIsPlaying(false)
      setShowControls(true)
    }

    videoEl.addEventListener('timeupdate', handleTimeUpdate)
    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoEl.addEventListener('play', handlePlay)
    videoEl.addEventListener('pause', handlePause)

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate)
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoEl.removeEventListener('play', handlePlay)
      videoEl.removeEventListener('pause', handlePause)
    }
  }, [isDragging])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  const togglePlay = () => {
    const videoEl = videoRef.current
    if (!videoEl) return

    if (isPlaying) {
      videoEl.pause()
    } else {
      videoEl.play()
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.5
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return
    
    setIsDragging(true)
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = percent * duration
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return
    
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  const canGoPrev = currentVideoIndex > 0 && onPrevVideo
  const canGoNext = currentVideoIndex < allVideos.length - 1 && onNextVideo

  if (!isOpen) return null

  if (!url) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
        <div className="relative w-full max-w-7xl aspect-video bg-black flex items-center justify-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="text-red-500 p-4 text-center">
            <p className="text-lg mb-2">No video URL available for this video.</p>
          </div>
        </div>
      </div>
    )
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        if (isPlaying) {
          setTimeout(() => setShowControls(false), 2000)
        }
      }}
    >
      {/* Navigation Arrows */}
      {canGoPrev && (
        <button
          onClick={onPrevVideo}
          className="absolute left-4 z-40 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all opacity-0 hover:opacity-100 group"
          style={{ opacity: showControls ? 1 : 0 }}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      
      {canGoNext && (
        <button
          onClick={onNextVideo}
          className="absolute right-4 z-40 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all opacity-0 hover:opacity-100 group"
          style={{ opacity: showControls ? 1 : 0 }}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      <div className={`relative w-full ${isMobile ? 'h-full' : 'max-w-7xl aspect-video'} bg-black flex flex-col`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-50 p-2 text-white hover:bg-white/10 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center`}
          style={{ opacity: showControls ? 1 : 0 }}
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        
        {/* BANDWIDTH-SAFE: Video player - preload="none", loads only when modal opens */}
        <div className="relative flex-1 w-full">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={video?.thumbnail_url || undefined}
              playsInline
              preload="none"
              className="w-full h-full object-contain"
              onClick={togglePlay}
              onLoadStart={() => setIsLoading(true)}
              onWaiting={() => setIsLoading(true)}
              onCanPlay={() => {
                setIsLoading(false);
                // Auto-play when video is ready (user already opened modal)
                videoRef.current?.play().catch((err) => {
                  console.error("Autoplay failed:", err);
                });
              }}
              onPlaying={() => {
                setIsLoading(false);
                setIsPlaying(true);
              }}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                setIsLoading(false)
                console.error("Video playback error:", e)
              }}
            />
          ) : (
            // Show thumbnail/poster while video src is loading
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {video?.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={title || video?.title || "Video thumbnail"}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-white/50">Loading video...</div>
              )}
            </div>
          )}
          
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Custom Controls Overlay */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            style={{ pointerEvents: showControls ? 'auto' : 'none' }}
          >
            {/* Progress Bar */}
            <div 
              ref={progressRef}
              className="absolute bottom-16 left-0 right-0 h-1 bg-white/30 cursor-pointer group"
              onClick={handleProgressClick}
              onMouseDown={handleProgressDrag}
              onMouseMove={(e) => {
                if (isDragging) {
                  handleProgressDrag(e)
                }
              }}
              onMouseUp={() => setIsDragging(false)}
            >
              <div 
                className="h-full bg-red-600 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => skip(-10)}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Skip back 10s"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Skip forward 10s"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 text-white hover:bg-white/10 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>

              {/* Time Display */}
              <div className="text-white text-sm font-mono ml-auto">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>

            {/* Title Overlay */}
            {title && (
              <div className="absolute top-4 left-4 right-20">
                <h3 className="text-white text-lg font-semibold drop-shadow-lg">{title}</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
