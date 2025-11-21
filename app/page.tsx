"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { INTRO_VIDEO_URL } from "@/app/config/intro"

const TRANSITION_TIME = 3.5 // seconds - when door opens and exposure brightens

export default function IntroLanding() {
  const [started, setStarted] = useState(false)
  const [flash, setFlash] = useState(false)
  const [transitioned, setTransitioned] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if intro has been seen before
    const introSeen = localStorage.getItem("intro_seen")
    if (introSeen === "true") {
      // Skip intro and go directly to menu
      router.push("/menu")
      return
    }
  }, [router])

  const handleEnter = () => {
    setStarted(true)
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Intro play failed:", err)
      })
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || transitioned) return

    // Trigger flash and transition at the specified time
    if (video.currentTime >= TRANSITION_TIME) {
      setTransitioned(true)
      setFlash(true)
      
      // Navigate to menu after flash
      setTimeout(() => {
        localStorage.setItem("intro_seen", "true")
        router.push("/menu")
      }, 300)
    }
  }

  const handleEnded = () => {
    // Fallback: if video ends before transition, go to menu
    if (!transitioned) {
      localStorage.setItem("intro_seen", "true")
      router.push("/menu")
    }
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={INTRO_VIDEO_URL}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        playsInline
        muted={false}
        controls={false}
        loop={false}
      />

      {/* White flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white pointer-events-none z-50" />
      )}

      {!started && (
        <button
          type="button"
          onClick={handleEnter}
          className="absolute inset-0 flex items-center justify-center text-white text-xl bg-black/50 z-40"
        >
          Click to enter
        </button>
      )}
    </div>
  )
}
