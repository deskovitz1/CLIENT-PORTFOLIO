"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// Intro video URLs are configured in app/config/intro.ts
import { SPLASH_VIDEO_URL, DOOR_VIDEO_URL } from "@/app/config/intro"

export default function IntroLanding() {
  const [stage, setStage] = useState<"splash" | "door">("splash")
  const [started, setStarted] = useState(false)
  const splashVideoRef = useRef<HTMLVideoElement | null>(null)
  const doorVideoRef = useRef<HTMLVideoElement | null>(null)
  const router = useRouter()

  // Stage 1: Splash video (small, auto-plays, auto-navigates to door stage)
  useEffect(() => {
    const video = splashVideoRef.current
    if (!video || stage !== "splash") return

    // Set playback speed to 1.25x (25% faster)
    video.playbackRate = 1.25

    // Auto-play when video can play
    const handleCanPlay = async () => {
      try {
        await video.play()
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Splash auto-play failed:", err)
        }
      }
    }

    // Cut 2.5 seconds off the end - transition when 2.5 seconds before end
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 2.5) {
        setStage("door")
      }
    }

    // Fallback: also handle ended event in case timeupdate doesn't fire
    const handleEnded = () => {
      setStage("door")
    }

    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [stage])

  // Stage 2: Door video (full-screen, click to enter)
  const handleEnter = () => {
    if (started) return
    setStarted(true)

    const video = doorVideoRef.current
    if (!video) return

    video.play().catch((err: any) => {
      if (err?.name === "AbortError") {
        console.warn("Door video play aborted (AbortError), ignoring.")
        return
      }
      console.error("Door video play failed:", err)
    })
  }

  const handleDoorVideoEnded = () => {
    router.push("/videos")
  }

  const handleSkip = () => {
    router.push("/videos")
  }

  // Stage 1: Splash screen (small video)
  if (stage === "splash") {
    return (
      <div className="relative w-screen h-screen bg-black flex items-center justify-center">
        {/* Small centered video - 20% of screen size */}
        <div className="w-[20vw] h-[20vh] max-w-[400px] max-h-[400px] min-w-[200px] min-h-[200px]">
          <video
            ref={splashVideoRef}
            src={SPLASH_VIDEO_URL}
            className="w-full h-full object-contain"
            playsInline
            muted={true}
            controls={false}
            autoPlay
            onLoadedMetadata={(e) => {
              e.currentTarget.playbackRate = 1.25
            }}
          />
        </div>

        {/* Skip intro button */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute bottom-6 right-6 px-4 py-2 text-sm border border-white/60 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition z-20"
        >
          Skip intro
        </button>
      </div>
    )
  }

  // Stage 2: Door video with "CLICK TO ENTER"
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <video
        ref={doorVideoRef}
        src={DOOR_VIDEO_URL}
        className="w-full h-full object-cover"
        playsInline
        muted={true}
        controls={false}
        onEnded={handleDoorVideoEnded}
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = 1.25
        }}
      />

      {/* Overlay text before start */}
      {!started && (
        <button
          type="button"
          onClick={handleEnter}
          className="absolute inset-0 flex items-center justify-center text-center text-white bg-black/20 z-10"
        >
          <span className="text-sm md:text-base tracking-[0.2em] font-light opacity-90 hover:opacity-100 transition-opacity">
            CLICK TO ENTER
          </span>
        </button>
      )}

      {/* Skip intro button - always visible */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute bottom-6 right-6 px-4 py-2 text-sm border border-white/60 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition z-20"
      >
        Skip intro
      </button>
    </div>
  )
}
