"use client"

import { useEffect, useRef, useState } from "react"
import ReactPlayer from "react-player"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  videoUrl: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayer({ videoUrl, title, isOpen, onClose }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const playerRef = useRef<ReactPlayer>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    console.log("VideoPlayer mounted/updated", { videoUrl, isOpen })
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [videoUrl, isOpen])

  useEffect(() => {
    if (isOpen && mountedRef.current) {
      console.log("Modal opened, resetting ready state")
      setIsReady(false)
      setIsPlaying(false)
      // Wait a bit for the player to mount before trying to play
      const timer = setTimeout(() => {
        if (mountedRef.current && isReady) {
          console.log("Setting playing to true after ready")
          setIsPlaying(true)
        }
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setIsPlaying(false)
      setIsReady(false)
    }
  }, [isOpen, isReady])

  const handleReady = () => {
    console.log("ReactPlayer ready", { videoUrl })
    if (mountedRef.current) {
      setIsReady(true)
      // Start playing after a short delay to ensure player is ready
      setTimeout(() => {
        if (mountedRef.current) {
          console.log("Starting playback")
          setIsPlaying(true)
        }
      }, 200)
    }
  }

  const handleError = (error: any) => {
    console.error("Video playback error:", error, { videoUrl })
    // Don't try to play if there's an error
    setIsPlaying(false)
  }

  const handleStart = () => {
    console.log("Video started playing")
  }

  if (!isOpen) return null

  console.log("Rendering VideoPlayer", { videoUrl, isOpen, isReady, isPlaying })

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="relative w-full max-w-7xl aspect-video bg-black">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
        
        <div className="w-full h-full">
          {videoUrl ? (
            <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              playing={isPlaying}
              controls
              width="100%"
              height="100%"
              onReady={handleReady}
              onStart={handleStart}
              onError={handleError}
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload",
                    preload: "auto",
                  },
                  forceVideo: true,
                },
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-red-900/20 border-2 border-red-500">
              <div className="text-center">
                <p className="text-red-400 mb-2">No video URL provided</p>
                <p className="text-red-500 text-sm">videoUrl: {String(videoUrl)}</p>
              </div>
            </div>
          )}
        </div>
        
        {title && (
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-lg font-light">{title}</h3>
          </div>
        )}
      </div>
    </div>
  )
}

