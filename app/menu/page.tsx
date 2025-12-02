"use client";

/**
 * Route: /menu (Main Menu - Circle Video Selector)
 *
 * Video data source:
 * - Uses the same API as the /videos page: GET /api/videos
 * - Uses the Video type from lib/db (id, title, category, blob_url, video_url, thumbnail_url, etc.)
 *
 * Circle layout:
 * - One large circle centered in the viewport
 * - Circle is divided into equal angular slices (like a pie chart)
 * - One slice per video: if there are N videos, there are N slices
 * - Each slice shows that video's thumbnail
 * - Each slice is a wedge created via CSS clip-path using polygon points on a unit circle
 *
 * Selection:
 * - Bottom red triangle indicates the selected slice
 * - selectedVideoIndex maps directly to videos[selectedVideoIndex]
 * - Preview updates during spin to show which video is under the triangle
 */

import { useEffect, useMemo, useState, useRef } from "react";
import type { Video } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

// Pointer position: bottom of the wheel (270 degrees or -90 degrees from top)
const POINTER_ANGLE = 270;

type SliceInfo = {
  index: number;
  clipPath: string;
  color: string;
  videoIndex: number | null;
};

// Convert polar coordinates (angle in degrees, radius 0..50) to percentage x/y in a 0..100 box.
// Used to build the polygon points for a wedge.
function polarToPercent(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = 50;
  const cy = 50;
  const x = cx + Math.cos(rad) * radius;
  const y = cy + Math.sin(rad) * radius;
  return `${x}% ${y}%`;
}

/**
 * Build a CSS clip-path polygon string that describes a single wedge between startAngle and endAngle.
 * The wedge starts at the circle center and samples multiple points along the outer arc for a smooth edge.
 */
function createSliceClipPath(startAngle: number, endAngle: number, steps: number = 16): string {
  const points: string[] = [];
  // Center of circle
  points.push("50% 50%");

  const angleStep = (endAngle - startAngle) / steps;
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + angleStep * i;
    points.push(polarToPercent(angle, 50));
  }

  return `polygon(${points.join(", ")})`;
}

export default function MainMenuPage() {
  const isMobile = useIsMobile();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  // Single source of truth: which video in videos array is selected (by index in videos array)
  // Maps directly to videos[selectedVideoIndex]
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  // Preview index during spin (updates as wheel rotates)
  // Maps directly to videos[previewVideoIndex]
  const [previewVideoIndex, setPreviewVideoIndex] = useState<number | null>(null);
  const [leverPulled, setLeverPulled] = useState(false);
  const [crtVideoSrc, setCrtVideoSrc] = useState<string | null>(null); // Lazy-loaded video src
  const [isCrtPlaying, setIsCrtPlaying] = useState(false);
  const crtVideoRef = useRef<HTMLVideoElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      // Use the same API endpoint as the videos page
      const res = await fetch("/api/videos", { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch videos: ${res.status}`);
      }
      const data = await res.json();
      const allVideos: Video[] = data.videos || [];
      
      // Update videos array - this will automatically update the wheel slices
      setVideos(allVideos);
      
      // If videos were added/removed and we're not spinning, reset selection
      if (!isSpinning) {
        setSelectedVideoIndex(null);
        setPreviewVideoIndex(null);
      }
    } catch (err) {
      console.error("Error loading videos for circle test:", err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch videos once on mount
    fetchVideos();
  }, []);

  // Number of slices equals number of videos (one slice per video)
  // This is the single source of truth: videos array = wheel slices
  const sliceCount = videos.length;

  // Reset selection if selected video no longer exists (e.g., after delete)
  useEffect(() => {
    if (selectedVideoIndex != null && selectedVideoIndex >= videos.length) {
      setSelectedVideoIndex(null);
      setPreviewVideoIndex(null);
    }
  }, [videos.length, selectedVideoIndex]);

  // Inject circus lights animations
  useEffect(() => {
    const styleId = "circus-lights-animations";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .circus-light {
        width: 8px;
        height: 8px;
        position: absolute;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: #f97316;
        opacity: 0.2;
        transition: opacity 0.3s ease, box-shadow 0.3s ease;
        box-shadow: 0 0 3px rgba(249, 115, 22, 0.2);
      }
      
      .circus-light--active {
        opacity: 0.9;
        box-shadow: 0 0 6px rgba(249, 115, 22, 0.6), 0 0 10px rgba(249, 115, 22, 0.4);
        animation: casinoLightPulse 0.8s ease-in-out infinite;
      }
      
      @keyframes casinoLightPulse {
        0%, 100% {
          opacity: 0.7;
          transform: translate(-50%, -50%) scale(1);
        }
        50% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.15);
        }
      }
      
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Memoize slice geometry calculations (heavy math, only recalc when videos.length changes)
  const slices: SliceInfo[] = useMemo(() => {
    if (sliceCount === 0) return [];
    
    const anglePerSlice = 360 / sliceCount;

    // Simple circus-inspired pastel palette for placeholder wedges (fallback if no video thumbnail)
    const COLORS = [
      "#F97373", // soft red
      "#FDBA74", // orange
      "#FACC15", // yellow
      "#4ADE80", // green
      "#38BDF8", // blue
      "#A855F7", // purple
      "#F472B6", // pink
      "#FB7185", // coral
    ];

    return Array.from({ length: sliceCount }).map((_, index) => {
      const startAngle = -90 + index * anglePerSlice; // Start from top
      const endAngle = startAngle + anglePerSlice;
      const clipPath = createSliceClipPath(startAngle, endAngle);
      const color = COLORS[index % COLORS.length];

      // Each slice maps directly to videos[index] (1:1 mapping, one slice per video)
      return { index, clipPath, color, videoIndex: index };
    });
  }, [sliceCount]);

  /**
   * Calculate which slice (and thus which video index in wheelVideos) is aligned with the bottom pointer
   * Returns the index in wheelVideos array (0 to sliceCount-1)
   */
  const getVideoIndexAtPointer = useMemo(() => {
    if (sliceCount === 0) return () => null;
    
    const anglePerSlice = 360 / sliceCount;
    
    return (currentRotation: number): number | null => {
      let closestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < sliceCount; i++) {
        const startAngle = -90 + i * anglePerSlice;
        const centerAngle = startAngle + anglePerSlice / 2;
        // Calculate where this slice's center is after rotation
        const rotatedCenter = (currentRotation + centerAngle) % 360;
        // Normalize to 0-360 range
        const normalizedCenter = rotatedCenter < 0 ? rotatedCenter + 360 : rotatedCenter;
        // Calculate distance to pointer (270 degrees)
        const distance = Math.min(
          Math.abs(normalizedCenter - POINTER_ANGLE),
          360 - Math.abs(normalizedCenter - POINTER_ANGLE)
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }

      return closestIndex;
    };
  }, [sliceCount]);

  // Determine which video to show in the CRT player
  // During spin: show previewVideoIndex, after spin: show selectedVideoIndex
  // Maps directly to videos[index]
  const activeVideo = useMemo(() => {
    if (isSpinning && previewVideoIndex != null && videos[previewVideoIndex]) {
      return videos[previewVideoIndex];
    }
    if (selectedVideoIndex != null && videos[selectedVideoIndex]) {
      return videos[selectedVideoIndex];
    }
    // Default to first video if available
    return videos[0] || null;
  }, [isSpinning, previewVideoIndex, selectedVideoIndex, videos]);

  // BANDWIDTH-SAFE: Reset video src when activeVideo changes (but don't load it yet)
  // Only clears video when spin stops and selection changes - prevents loading during spin animation
  useEffect(() => {
    if (activeVideo && !isSpinning) {
      // Clear video src when video changes - user must click play to load
      // IMPORTANT: Only reset when NOT spinning to prevent bandwidth waste during wheel animation
      setCrtVideoSrc(null);
      setIsCrtPlaying(false);
      if (crtVideoRef.current) {
        crtVideoRef.current.pause();
        crtVideoRef.current.src = '';
        crtVideoRef.current.load();
      }
    }
  }, [activeVideo?.id, isSpinning]); // Only reset when video ID changes AND spin is complete

  // BANDWIDTH-SAFE: Handle play button click - lazy-load video only when user explicitly plays
  // Video src is set ONLY when user clicks play, NOT during spin animation
  const handleCrtPlay = () => {
    if (!activeVideo || isSpinning) return; // Prevent loading during spin
    
    // Get direct Blob URL (no API proxy)
    const videoUrl = activeVideo.video_url || activeVideo.blob_url;
    if (!videoUrl) {
      console.error("No video URL available for:", activeVideo.title);
      return;
    }

    // Set video src only when user clicks play (single video download per selection)
    if (!crtVideoSrc || crtVideoSrc !== videoUrl) {
      setCrtVideoSrc(videoUrl);
    }

    // Play video
    setTimeout(() => {
      crtVideoRef.current?.play().catch((err) => {
        console.error("Failed to play video:", err);
      });
      setIsCrtPlaying(true);
    }, 100);
  };

  // BANDWIDTH-SAFE: Spin wheel - clears video src during spin to prevent loading
  const spinWheel = () => {
    if (isSpinning || sliceCount === 0) return;

    setIsSpinning(true);
    setSelectedVideoIndex(null);
    setPreviewVideoIndex(null);
    // Clear video src during spin to prevent any video loading during animation
    setCrtVideoSrc(null);
    setIsCrtPlaying(false);
    if (crtVideoRef.current) {
      crtVideoRef.current.pause();
      crtVideoRef.current.src = '';
    }

    const anglePerSlice = 360 / sliceCount;
    // Randomly select a target video index (0 to sliceCount-1)
    const targetVideoIndex = Math.floor(Math.random() * sliceCount);
    
    // Calculate the angle needed to align this slice's center with the bottom pointer
    // The slice center starts at: -90 + targetVideoIndex * anglePerSlice + anglePerSlice/2
    const sliceStartAngle = -90 + targetVideoIndex * anglePerSlice;
    const sliceCenterAngle = sliceStartAngle + anglePerSlice / 2;
    
    // Normalize slice center to 0-360 range
    const normalizedSliceCenter = sliceCenterAngle < 0 ? sliceCenterAngle + 360 : sliceCenterAngle;
    
    // We want the slice center to be at POINTER_ANGLE (270 degrees) after final rotation
    // Calculate what the final rotation should be (from 0) to align this slice with pointer
    let targetFinalRotation = POINTER_ANGLE - sliceCenterAngle;
    // Normalize to 0-360 range
    while (targetFinalRotation < 0) targetFinalRotation += 360;
    while (targetFinalRotation >= 360) targetFinalRotation -= 360;
    
    // Add multiple full spins for visual effect (6 full rotations = 2160 degrees)
    const extraSpins = 360 * 6;
    // Calculate final rotation: current rotation + extra spins + adjustment to reach target
    const currentRotationNormalized = ((rotation % 360) + 360) % 360;
    let adjustment = targetFinalRotation - currentRotationNormalized;
    if (adjustment < 0) adjustment += 360;
    
    const finalRotation = rotation + extraSpins + adjustment;

    // Use requestAnimationFrame to ensure transition is applied before rotation change
    requestAnimationFrame(() => {
      setRotation(finalRotation);
    });

    // After animation completes, determine which video is actually at the pointer
    setTimeout(() => {
      setIsSpinning(false);
      // Calculate which video index is aligned with the bottom pointer
      const actualVideoIndex = getVideoIndexAtPointer(finalRotation);
      setSelectedVideoIndex(actualVideoIndex);
      setPreviewVideoIndex(actualVideoIndex);
    }, 4600);
  };

  const handleLeverPullStart = () => {
    if (isSpinning) return;
    setLeverPulled(true);
  };

  const handleLeverPullEnd = () => {
    if (isSpinning) return;
    if (!leverPulled) return;
    setLeverPulled(false);
    spinWheel();
  };

  // Update preview video index during spin by reading actual DOM transform
  // This shows which video is currently under the bottom pointer as the wheel spins
  useEffect(() => {
    if (!isSpinning || sliceCount === 0 || !wheelRef.current) {
      if (!isSpinning) {
        // Clear preview when not spinning
        setPreviewVideoIndex(null);
      }
      return;
    }

    let rafId: number;
    const updatePreview = () => {
      if (!wheelRef.current || !isSpinning) return;
      
      // Read the computed transform from the DOM (this reflects the CSS transition)
      const computedStyle = window.getComputedStyle(wheelRef.current);
      const transform = computedStyle.transform;
      
      if (transform && transform !== 'none') {
        // Parse matrix values: matrix(cos, sin, -sin, cos, tx, ty)
        // For rotation, we can extract the angle from the matrix
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
          // Calculate rotation angle from matrix
          // For 2D rotation: cos = values[0], sin = values[1]
          const angleRad = Math.atan2(values[1], values[0]);
          const angleDeg = (angleRad * 180) / Math.PI;
          // Normalize to 0-360
          const normalizedAngle = angleDeg < 0 ? angleDeg + 360 : angleDeg;
          
          const currentVideoIndex = getVideoIndexAtPointer(normalizedAngle);
          setPreviewVideoIndex(currentVideoIndex);
        }
      }
      
      if (isSpinning) {
        rafId = requestAnimationFrame(updatePreview);
      }
    };

    // Start updating preview
    rafId = requestAnimationFrame(updatePreview);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isSpinning, sliceCount, getVideoIndexAtPointer]);

  return (
    <main className="circle-test-page min-h-screen w-full flex flex-col items-center justify-between bg-white text-black px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-10 relative overflow-hidden">
      {/* Casino-style lights around the perimeter */}
      <div className="circus-lights-container absolute inset-0 pointer-events-none z-0">
        {/* Top row */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`top-${i}`}
            className={`circus-light absolute top-2 ${isSpinning ? "circus-light--active" : ""}`}
            style={{
              left: `${(i + 1) * (100 / 21)}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
        
        {/* Bottom row */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`bottom-${i}`}
            className={`circus-light absolute bottom-2 ${isSpinning ? "circus-light--active" : ""}`}
            style={{
              left: `${(i + 1) * (100 / 21)}%`,
              animationDelay: `${(i + 10) * 0.1}s`,
            }}
          />
        ))}
        
        {/* Left side */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`left-${i}`}
            className={`circus-light absolute left-2 ${isSpinning ? "circus-light--active" : ""}`}
            style={{
              top: `${(i + 1) * (100 / 13)}%`,
              animationDelay: `${(i + 5) * 0.1}s`,
            }}
          />
        ))}
        
        {/* Right side */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`right-${i}`}
            className={`circus-light absolute right-2 ${isSpinning ? "circus-light--active" : ""}`}
            style={{
              top: `${(i + 1) * (100 / 13)}%`,
              animationDelay: `${(i + 15) * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Top navigation - centered */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-center mb-4 sm:mb-6 md:mb-8 pt-2 sm:pt-3 md:pt-4">
        <nav className="flex items-center gap-2 sm:gap-3 md:gap-5 lg:gap-8 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.25em] uppercase flex-wrap justify-center">
          <a
            href="/videos"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">All</span>
            </span>
          </a>
          <a
            href="/videos?category=music-video"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">Music</span>
            </span>
          </a>
          <a
            href="/videos?category=industry-work"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">Launch Videos</span>
            </span>
          </a>
          <a
            href="/videos?category=clothing"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">Clothing</span>
            </span>
          </a>
          <a
            href="/videos?category=live-events"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">LIVE EVENTS</span>
            </span>
          </a>
          <a
            href="/videos?category=bts"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">BTS</span>
            </span>
          </a>
          {/* Link to old menu page */}
          <a
            href="/circle-video-test"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">Old Menu</span>
            </span>
          </a>
        </nav>
      </header>


      {loading ? (
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">🎪</div>
            <p className="text-sm text-gray-500 tracking-[0.25em] uppercase">
              Loading circle collage…
            </p>
          </div>
        </div>
      ) : !slices.length ? (
        <div className="relative z-10 flex-1 flex items-center justify-center w-full">
          <div className="text-center">
            <p className="text-lg text-gray-800 mb-2">No videos available</p>
            <p className="text-xs text-gray-500 uppercase tracking-[0.25em]">
              Upload videos in the admin panel to populate this circle
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 sc-page w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12 lg:gap-24 xl:gap-32 flex-1 py-4 sm:py-6 md:py-8 lg:py-12">
          {/* Left side: lever + wheel in a row */}
          <div className="sc-left flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 flex-shrink-0">
            {/* Minimal lever on the left */}
            <div
              className={`lever-mount relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] flex items-center justify-start cursor-pointer min-h-[44px] min-w-[44px] ${
                isSpinning ? "lever-mount--disabled opacity-50 cursor-not-allowed" : ""
              }`}
              onMouseDown={handleLeverPullStart}
              onMouseUp={handleLeverPullEnd}
              onMouseLeave={handleLeverPullEnd}
              onTouchStart={(e) => {
                e.preventDefault();
                handleLeverPullStart();
              }}
              onTouchEnd={handleLeverPullEnd}
            >
              {/* Lever arm: red ball + bar into base (visually pivoting in center of base) */}
              <div
                className="lever-arm absolute left-1 top-1/2 w-[130px] h-9"
                style={{
                  transformOrigin: "90% 50%",
                  // At rest: slightly angled up; when pulled: swings down, pivoting around center of base
                  transform: leverPulled || isSpinning
                    ? "translateY(-50%) rotate(-25deg)"
                    : "translateY(-50%) rotate(20deg)",
                  transition: "transform 0.15s ease-out",
                }}
              >
                <div className="lever-ball absolute left-0 top-1/2 w-[28px] h-[28px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffe5e5,#ff3b3b_55%,#8b0000)] shadow-[0_5px_10px_rgba(0,0,0,0.5)]" />
                {/* Bar aligned to emerge from the center slot of the base */}
                <div className="lever-bar absolute left-[26px] right-[30px] top-1/2 h-[7px] -translate-y-1/2 rounded-full bg-neutral-900 shadow-[0_0_3px_rgba(0,0,0,0.6)]" />
              </div>
              {/* Vertical base with slot on the right */}
              <div className="lever-base absolute right-0 top-1/2 w-[32px] h-[80px] -translate-y-1/2 rounded-[7px] bg-neutral-900 shadow-[0_7px_16px_rgba(0,0,0,0.45)] flex items-center justify-center">
                <div className="lever-slot w-[5px] h-[60px] rounded-[3px] bg-neutral-700" />
              </div>
            </div>

            {/* WHEEL COLUMN (right of lever) */}
            <div className="wheel-column flex flex-col items-center justify-center flex-shrink-0">
              <div
                ref={wheelRef}
                className="circle-wrapper relative rounded-full overflow-hidden border-2 border-gray-300 shadow-[0_20px_60px_rgba(15,23,42,0.25)] bg-white"
                style={{
                  width: isMobile ? "min(85vw, 400px)" : "600px",
                  height: isMobile ? "min(85vw, 400px)" : "600px",
                  maxWidth: isMobile ? "min(85vw, 400px)" : "min(75vmin, 600px)",
                  maxHeight: isMobile ? "min(85vw, 400px)" : "min(75vmin, 600px)",
                  aspectRatio: "1 / 1",
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning
                    ? "transform 4.5s cubic-bezier(0.2, 0.8, 0.2, 1)"
                    : "transform 0.3s ease-out",
                  willChange: isSpinning ? "transform" : "auto",
                }}
              >
                {/* Slices - one per video */}
                {slices.map(({ videoIndex, index, clipPath, color }) => {
                  // videoIndex is the index in videos array (same as slice index)
                  // Maps directly to videos[videoIndex]
                  const video = videos[videoIndex];
                  
                  // Safety check: if video doesn't exist, show placeholder
                  if (!video) {
                    return (
                      <div
                        key={`slice-empty-${index}`}
                        className="circle-slice absolute inset-0"
                        style={{
                          WebkitClipPath: clipPath,
                          clipPath,
                          backgroundColor: '#e5e7eb',
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-gray-400 opacity-50">#{index + 1}</span>
                        </div>
                      </div>
                    );
                  }
                  
                  const isHovered = hoveredIndex === index;
                  // Selected if this slice's video index matches selectedVideoIndex
                  const isSelected = selectedVideoIndex === videoIndex && !isSpinning;
                  
                  // BANDWIDTH-SAFE: Use thumbnail_url if available, otherwise neutral placeholder
                  // Slices should NEVER use <video> elements - only small image thumbnails (JPG/PNG/WebP)
                  // This prevents downloading full video files for every slice in the wheel
                  const thumbnailUrl = video.thumbnail_url || null;

                  return (
                    <button
                      key={`slice-${video.id}-${index}`}
                      type="button"
                      onClick={() => {
                        if (isSpinning) return;
                        // Set selectedVideoIndex directly (single source of truth)
                        // This maps directly to videos[selectedVideoIndex]
                        setSelectedVideoIndex(videoIndex);
                      }}
                      onMouseEnter={() => !isSpinning && setHoveredIndex(index)}
                      onMouseLeave={() => !isSpinning && setHoveredIndex(null)}
                      className={[
                        "circle-slice absolute inset-0 group transition-all duration-200 ease-out",
                        isHovered && !isSpinning ? "scale-[1.02] z-10" : "",
                        isSelected ? "scale-[1.05] z-20 ring-4 ring-red-500 ring-offset-2 shadow-[0_0_20px_rgba(239,68,68,0.8)]" : "",
                        isSpinning ? "pointer-events-none" : "cursor-pointer",
                      ].join(" ")}
                      style={{
                        WebkitClipPath: clipPath,
                        clipPath,
                      }}
                    >
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={video.title || `Video ${index + 1}`}
                          className="circle-slice-image w-full h-full object-cover block transition-transform duration-300 ease-out group-hover:scale-[1.05]"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback to neutral gray if thumbnail fails
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-placeholder')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-placeholder w-full h-full flex items-center justify-center bg-gray-200';
                              fallback.style.backgroundColor = '#e5e7eb';
                              const text = document.createElement('span');
                              text.className = 'text-xs text-gray-400 opacity-50';
                              text.textContent = video.title ? video.title.substring(0, 10) : `#${index + 1}`;
                              fallback.appendChild(text);
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        // Neutral gray placeholder if no thumbnail - show title
                        <div
                          className="w-full h-full flex items-center justify-center bg-gray-200"
                          style={{
                            backgroundColor: '#e5e7eb',
                          }}
                        >
                          <span className="text-xs text-gray-600 opacity-70 px-2 text-center truncate max-w-full">
                            {video.title ? video.title.substring(0, 15) : `Video ${index + 1}`}
                          </span>
                        </div>
                      )}
                      {/* Selected state overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-red-500/20 pointer-events-none animate-pulse" />
                      )}
                    </button>
                  );
                })}

                {/* Optional inner ring for structure */}
                <div className="pointer-events-none absolute inset-[6%] rounded-full border border-white/80" />
              </div>

              {/* Pointer at the bottom indicating selection */}
              <div className="wheel-pointer pointer-events-none mt-2 relative z-30">
                <div className="wheel-pointer-bottom w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-red-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
              </div>
              
              {/* Selected video title display below wheel */}
              {selectedVideoIndex != null && videos[selectedVideoIndex] && !isSpinning && (
                <div className="mt-4 text-center max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {videos[selectedVideoIndex].title}
                  </h3>
                  {videos[selectedVideoIndex].description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {videos[selectedVideoIndex].description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column: CRT TV that plays the selected video */}
          <div className="sc-right flex items-center justify-center flex-shrink-0 w-full lg:w-auto">
            <div className="crt-shell flex flex-col items-center gap-3 sm:gap-4 w-full max-w-[90vw] sm:max-w-none">
              {/* CRT TV Frame - Enhanced */}
              <div className="crt-frame relative rounded-[28px] sm:rounded-[32px] md:rounded-[36px] bg-[linear-gradient(135deg,#555_0%,#222_50%,#111_100%)] p-4 sm:p-5 md:p-6 lg:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] w-full border-2 border-gray-800/50">
                {/* Brand Logo Area */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                  <div className="px-3 py-0.5 bg-black/60 rounded-full border border-gray-700/50">
                    <span className="text-[8px] sm:text-[10px] font-bold text-gray-300 tracking-wider">CIRCUS17</span>
                  </div>
                </div>
                
                {/* Screen Bezel */}
                <div className={`crt-screen relative ${isMobile ? 'w-full' : 'w-[320px] md:w-[420px] lg:w-[500px]'} aspect-[4/3] bg-black rounded-[12px] sm:rounded-[14px] md:rounded-[16px] overflow-hidden border-[6px] sm:border-[8px] border-[#1a1a1a] shadow-[inset_0_0_50px_rgba(0,0,0,0.95),0_0_20px_rgba(0,0,0,0.8)] flex-shrink-0 mx-auto mt-4`} style={{
                  boxShadow: 'inset 0 0 50px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.5)'
                }}>
                  {/* Screen Glass Reflection Effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] pointer-events-none z-20" />
                  
                  {/* CRT Screen Curvature Effect (subtle) */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none z-15" />
                  
                  {activeVideo ? (
                    <>
                      {/* Always show thumbnail first - no video loading until play is clicked */}
                      {!crtVideoSrc || !isCrtPlaying ? (
                        // Show thumbnail (no video bytes downloaded)
                        <div className="relative w-full h-full">
                          {activeVideo.thumbnail_url ? (
                            <img
                              key={`thumbnail-${activeVideo.id}`}
                              src={activeVideo.thumbnail_url}
                              alt={activeVideo.title}
                              className="crt-video w-full h-full object-cover relative z-0"
                            />
                          ) : (
                            <div className="crt-placeholder w-full h-full flex items-center justify-center text-sm text-gray-400 relative z-0">
                              {activeVideo.title}
                            </div>
                          )}
                          {/* Play button overlay */}
                          {selectedVideoIndex != null && !isSpinning && (
                            <button
                              onClick={handleCrtPlay}
                              className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
                              aria-label="Play video"
                            >
                              <div className="w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </button>
                          )}
                        </div>
                      ) : (
                        // BANDWIDTH-SAFE: Video element - only rendered when user clicks play
                        // preload="none" ensures no video bytes downloaded until play() is called
                        // src is set ONLY when handleCrtPlay() is called, NOT during spin animation
                        <video
                          ref={crtVideoRef}
                          key={`video-${activeVideo.id}`}
                          src={crtVideoSrc || undefined}
                          className="crt-video w-full h-full object-cover relative z-0"
                          controls
                          preload="none"
                          poster={activeVideo.thumbnail_url || undefined}
                          onPlay={() => setIsCrtPlaying(true)}
                          onPause={() => setIsCrtPlaying(false)}
                          onEnded={() => {
                            setIsCrtPlaying(false);
                            // Optionally reset to thumbnail after video ends
                            // setCrtVideoSrc(null);
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="crt-placeholder w-full h-full flex items-center justify-center text-sm text-gray-400 relative z-0">
                      Spin the wheel to pick a video
                    </div>
                  )}
                  
                  {/* Scanline overlay - Enhanced */}
                  <div className="crt-scanlines pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_3px)] mix-blend-soft-light z-25" />
                  
                  {/* Screen Corner Details */}
                  <div className="absolute top-2 left-2 w-1 h-1 bg-white/20 rounded-full z-30" />
                  <div className="absolute top-2 right-2 w-1 h-1 bg-white/20 rounded-full z-30" />
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/20 rounded-full z-30" />
                  <div className="absolute bottom-2 right-2 w-1 h-1 bg-white/20 rounded-full z-30" />
                </div>
              </div>
              {/* CRT controls - Integrated Navigation Buttons */}
              <div className="crt-controls flex items-center justify-center gap-4 sm:gap-5 w-full mt-2">
                {/* Left Knob - Back Button */}
                {activeVideo && selectedVideoIndex != null && !isSpinning ? (
                  <button
                    onClick={() => {
                      if (selectedVideoIndex > 0) {
                        const prevIndex = selectedVideoIndex - 1
                        setSelectedVideoIndex(prevIndex)
                        setPreviewVideoIndex(prevIndex)
                      }
                    }}
                    disabled={selectedVideoIndex === 0}
                    className="crt-knob-button group relative w-[42px] h-[42px] rounded-full bg-[radial-gradient(circle_at_30%_30%,#888,#333)] hover:bg-[radial-gradient(circle_at_30%_30%,#aaa,#444)] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.1)] border-2 border-gray-600 hover:border-gray-500 transition-all duration-200 active:scale-95 flex items-center justify-center"
                    title="Previous video"
                  >
                    <svg className="w-5 h-5 text-white opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    {/* Knob highlight */}
                    <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white/20 blur-sm" />
                  </button>
                ) : (
                  <div className="crt-knob w-[42px] h-[42px] rounded-full bg-[radial-gradient(circle_at_30%_30%,#666,#222)] shadow-[0_4px_12px_rgba(0,0,0,0.7)] border-2 border-gray-700" />
                )}
                
                {/* Center Speaker - Visit Button */}
                {activeVideo && selectedVideoIndex != null && !isSpinning ? (
                  <button
                    onClick={() => {
                      router.push(`/videos`)
                    }}
                    className="crt-speaker-button group relative w-[120px] sm:w-[140px] h-[38px] rounded-[18px] bg-[repeating-linear-gradient(to_right,#444_0,#444_2px,#222_2px,#222_4px)] hover:bg-[repeating-linear-gradient(to_right,#555_0,#555_2px,#333_2px,#333_4px)] border-2 border-gray-600 hover:border-red-500/60 shadow-[0_4px_12px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.1)] transition-all duration-200 active:scale-95 flex items-center justify-center overflow-hidden"
                    title="Visit video page"
                  >
                    {/* Speaker lines */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 px-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-4 w-[2px] bg-gray-400 group-hover:bg-red-400/60 transition-colors" />
                      ))}
                    </div>
                    {/* Visit text overlay */}
                    <span className="relative z-10 text-[10px] sm:text-xs font-bold text-white/90 group-hover:text-red-300 uppercase tracking-wider transition-colors">
                      Visit
                    </span>
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors rounded-[18px]" />
                  </button>
                ) : (
                  <div className="crt-speaker w-[120px] sm:w-[140px] h-[38px] rounded-[18px] bg-[repeating-linear-gradient(to_right,#333_0,#333_2px,#111_2px,#111_4px)] border-2 border-gray-700" />
                )}
                
                {/* Right Knob - Next Button */}
                {activeVideo && selectedVideoIndex != null && !isSpinning ? (
                  <button
                    onClick={() => {
                      if (selectedVideoIndex < videos.length - 1) {
                        const nextIndex = selectedVideoIndex + 1
                        setSelectedVideoIndex(nextIndex)
                        setPreviewVideoIndex(nextIndex)
                      }
                    }}
                    disabled={selectedVideoIndex === videos.length - 1}
                    className="crt-knob-button group relative w-[42px] h-[42px] rounded-full bg-[radial-gradient(circle_at_30%_30%,#888,#333)] hover:bg-[radial-gradient(circle_at_30%_30%,#aaa,#444)] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.1)] border-2 border-gray-600 hover:border-gray-500 transition-all duration-200 active:scale-95 flex items-center justify-center"
                    title="Next video"
                  >
                    <svg className="w-5 h-5 text-white opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                    {/* Knob highlight */}
                    <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white/20 blur-sm" />
                  </button>
                ) : (
                  <div className="crt-knob w-[42px] h-[42px] rounded-full bg-[radial-gradient(circle_at_30%_30%,#666,#222)] shadow-[0_4px_12px_rgba(0,0,0,0.7)] border-2 border-gray-700" />
                )}
              </div>
              
              {/* CRT TV Details - Channel Display & Power Indicator */}
              {activeVideo && selectedVideoIndex != null && !isSpinning && (
                <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded border border-gray-700/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-mono">CH {String(selectedVideoIndex + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="px-2 py-1 bg-black/40 rounded border border-gray-700/50">
                    <span className="font-mono">{videos.length} Videos</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
