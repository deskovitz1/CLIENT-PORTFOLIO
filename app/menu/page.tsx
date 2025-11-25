"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"

interface Letter {
  char: string
  x: number
  y: number
  vx: number
  vy: number
  isActive: boolean
}

function CircusLetters() {
  const letters = "CIRCUS".split("")
  const [letterStates, setLetterStates] = useState<Letter[]>(() =>
    letters.map((char) => ({
      char,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      isActive: false,
    }))
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (!letterStates.some((l) => l.isActive)) return

    const animate = () => {
      setLetterStates((prev) => {
        const newStates = prev.map((letter) => {
          if (!letter.isActive) return letter

          const gravity = 0.6
          const friction = 0.98
          const bounce = 0.75

          // Apply gravity
          let newVy = letter.vy + gravity
          let newVx = letter.vx * friction

          // Update position
          let newX = letter.x + newVx
          let newY = letter.y + newVy

          // Get viewport bounds (full screen)
          const letterWidth = 100
          const letterHeight = 120
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight

          // Bounce off walls
          if (newX <= letterWidth / 2) {
            newVx = -newVx * bounce
            newX = letterWidth / 2
          } else if (newX >= viewportWidth - letterWidth / 2) {
            newVx = -newVx * bounce
            newX = viewportWidth - letterWidth / 2
          }

          if (newY <= letterHeight / 2) {
            newVy = -newVy * bounce
            newY = letterHeight / 2
          } else if (newY >= viewportHeight - letterHeight / 2) {
            newVy = -newVy * bounce
            newY = viewportHeight - letterHeight / 2
            // Add friction when on ground
            newVx *= 0.95
          }

          // Stop if velocity is very small and on ground
          if (
            Math.abs(newVx) < 0.2 &&
            Math.abs(newVy) < 0.2 &&
            newY >= viewportHeight - letterHeight / 2 - 10
          ) {
            return { ...letter, isActive: false, x: newX, y: newY, vx: 0, vy: 0 }
          }

          return {
            ...letter,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          }
        })

        // Continue animation if any letters are still active
        if (newStates.some((l) => l.isActive)) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }

        return newStates
      })
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [letterStates])

  const handleLetterClick = (index: number, e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const clickX = e.clientX
    const clickY = e.clientY

    setLetterStates((prev) => {
      const newStates = [...prev]
      const letter = newStates[index]

      // Get current letter position (centered in container)
      const centerX = window.innerWidth / 2
      const centerY = rect.top + rect.height / 2
      const letterX = centerX + (index - 2.5) * 90

      // Calculate velocity based on click direction
      const dx = clickX - letterX
      const dy = clickY - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const force = Math.min(distance * 0.15, 20) // Cap the force

      newStates[index] = {
        ...letter,
        x: letterX,
        y: centerY,
        vx: (dx / distance) * force + (Math.random() - 0.5) * 3,
        vy: (dy / distance) * force + (Math.random() - 0.5) * 3 - 8, // Add upward boost
        isActive: true,
      }

      return newStates
    })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-32 md:h-40 flex items-center justify-center"
      style={{ minHeight: "200px" }}
    >
      {letterStates.map((letter, index) => {
        const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 0
        const baseX = centerX + (index - 2.5) * 90

        return (
          <button
            key={index}
            type="button"
            onClick={(e) => handleLetterClick(index, e)}
            className="absolute cursor-pointer select-none transition-transform hover:scale-110 active:scale-95"
            style={{
              left: letter.isActive ? `${letter.x}px` : "50%",
              top: letter.isActive ? `${letter.y}px` : "50%",
              transform: letter.isActive
                ? "translate(-50%, -50%)"
                : `translate(calc(-50% + ${(index - 2.5) * 90}px), -50%)`,
              transition: letter.isActive ? "none" : "transform 0.3s ease-out",
              zIndex: letter.isActive ? 50 : 10,
            }}
          >
            <span
              className="text-6xl md:text-8xl font-black text-red-600 block"
              style={{ fontFamily: "Helvetica, Arial, sans-serif", letterSpacing: "-0.05em" }}
            >
              {letter.char}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function MenuButton({ 
  label, 
  category 
}: { 
  label: string
  category?: string 
}) {
  const router = useRouter()

  const handleClick = () => {
    if (category) {
      router.push(`/videos?category=${encodeURIComponent(category)}`)
    } else {
      router.push("/videos")
    }
  }

  return (
    <button
      onClick={handleClick}
      className="group relative px-8 py-3 text-left w-full max-w-xs transition-all duration-300 hover:translate-x-2"
    >
      {/* Decorative line on left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-px bg-red-600 group-hover:w-8 transition-all duration-300" />
      
      {/* Button text */}
      <span 
        className="text-2xl font-bold text-red-600 tracking-tight group-hover:tracking-wider transition-all duration-300"
        style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
      >
        {label}
      </span>
      
      {/* Subtle underline on hover */}
      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
    </button>
  )
}

export default function MainMenuPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [follower1, setFollower1] = useState({ x: 0, y: 0 })
  const [follower2, setFollower2] = useState({ x: 0, y: 0 })
  const [follower3, setFollower3] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Multiple trailing followers with different speeds for a cool effect
  useEffect(() => {
    let animationFrameId: number

    const animate = () => {
      // First follower - closest to cursor
      setFollower1((prev) => {
        const dx = mousePosition.x - prev.x
        const dy = mousePosition.y - prev.y
        return {
          x: prev.x + dx * 0.15,
          y: prev.y + dy * 0.15,
        }
      })

      // Second follower - middle trail
      setFollower2((prev) => {
        const dx = mousePosition.x - prev.x
        const dy = mousePosition.y - prev.y
        return {
          x: prev.x + dx * 0.08,
          y: prev.y + dy * 0.08,
        }
      })

      // Third follower - furthest trail
      setFollower3((prev) => {
        const dx = mousePosition.x - prev.x
        const dy = mousePosition.y - prev.y
        return {
          x: prev.x + dx * 0.04,
          y: prev.y + dy * 0.04,
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [mousePosition])

  return (
    <main className="min-h-screen bg-stone-200 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Cool mouse follower with multiple trailing elements */}
      {/* Third follower - furthest, largest, most transparent */}
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: `${follower3.x}px`,
          top: `${follower3.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-16 h-16 rounded-full bg-red-600/5 blur-xl" />
        <div className="absolute inset-0 w-8 h-8 rounded-full bg-red-600/10 blur-md -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
      </div>

      {/* Second follower - middle trail */}
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: `${follower2.x}px`,
          top: `${follower2.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-12 h-12 rounded-full bg-red-600/15 blur-lg" />
        <div className="absolute inset-0 w-6 h-6 rounded-full bg-red-600/25 blur-sm -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
      </div>

      {/* First follower - closest to cursor, most visible */}
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: `${follower1.x}px`,
          top: `${follower1.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-8 h-8 rounded-full bg-red-600/20 blur-md" />
        <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-600/40 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-600/60 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
      </div>

      {/* Decorative geometric elements */}
      <div className="absolute top-20 left-10 w-32 h-32 border-2 border-red-100 rotate-45 opacity-20" />
      <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-red-100 rounded-full opacity-20" />
      <div className="absolute top-1/2 right-20 w-px h-32 bg-red-100 opacity-30" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-16 w-full max-w-4xl">
        {/* Title area */}
        <div className="text-center">
          <CircusLetters />
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="w-12 h-px bg-red-600" />
            <span className="text-red-400 text-sm tracking-widest uppercase">17</span>
            <div className="w-12 h-px bg-red-600" />
          </div>
        </div>

        {/* Menu buttons */}
        <div className="flex flex-col items-center gap-2 w-full">
          <MenuButton label="Recent Work" category="recent-work" />
          <MenuButton label="Music" category="music-video" />
          <MenuButton label="Launch Videos" category="industry-work" />
          <MenuButton label="Clothing" category="clothing" />
        </div>
      </div>
    </main>
  )
}
