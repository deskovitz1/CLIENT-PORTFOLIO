"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, RefreshCw, Video as VideoIcon } from "lucide-react"

interface Video {
  id: number
  title: string
  description: string | null
  category: string | null
  blob_url: string
  file_name: string
  visible: boolean  // Single source of truth
}

export default function AdminPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncingMessage, setSyncingMessage] = useState("")

  // Fetch all videos (including hidden ones) for admin
  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/videos?includeIntro=true")
      if (!response.ok) {
        throw new Error("Failed to fetch videos")
      }
      const data = await response.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  // Sync videos from blob storage
  const syncFromBlob = async () => {
    try {
      setSyncing(true)
      setSyncingMessage("Syncing videos from blob storage...")
      
      const response = await fetch("/api/videos/sync-blob", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to sync videos")
      }

      const data = await response.json()
      setSyncingMessage(data.message || `Imported ${data.imported} new video(s)`)
      
      // Refresh video list after sync
      await fetchVideos()
      
      // Clear message after 3 seconds
      setTimeout(() => setSyncingMessage(""), 3000)
    } catch (error) {
      console.error("Error syncing videos:", error)
      setSyncingMessage("Failed to sync videos")
      setTimeout(() => setSyncingMessage(""), 3000)
    } finally {
      setSyncing(false)
    }
  }

  // Toggle video visibility - uses dedicated visibility endpoint
  const toggleVisibility = async (id: number, currentVisible: boolean) => {
    const response = await fetch(`/api/videos/${id}/visibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !currentVisible }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      console.error('Failed to update visibility:', response.status, data);
      alert(`Failed to update visibility: ${data.error || data.details || response.status}`);
      return;
    }

    // Refresh video list after success
    await fetchVideos();
  }

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchVideos()
    
    // Auto-refresh every 30 seconds to detect new videos
    const interval = setInterval(() => {
      fetchVideos()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Management</h1>
            <p className="text-gray-600">Control what videos appear on your website</p>
          </div>
          
          {/* Sync Button */}
          <button
            onClick={syncFromBlob}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync from Blob"}
          </button>
        </div>

        {/* Sync Message */}
        {syncingMessage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {syncingMessage}
          </div>
        )}

        {/* Videos List */}
        {loading ? (
          <p className="text-gray-600">Loading videos...</p>
        ) : videos.length === 0 ? (
          <div className="bg-white p-8 border border-gray-200 rounded-lg text-center">
            <VideoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No videos found.</p>
            <button
              onClick={syncFromBlob}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sync videos from blob storage
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`bg-white p-4 border rounded-lg flex items-center justify-between ${
                  !video.visible
                    ? "border-gray-300 opacity-60 bg-gray-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{video.title}</h3>
                    {!video.visible && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                        Hidden
                      </span>
                    )}
                    {video.category && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {video.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{video.file_name}</p>
                </div>
                
                {/* Toggle Visibility Button */}
                <button
                  onClick={() => toggleVisibility(video.id, video.visible)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !video.visible
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                  title={!video.visible ? "Show on website" : "Hide from website"}
                >
                  {video.visible ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Show
                    </>
                  )}
                </button>
                {!video.visible && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded ml-2">
                    Hidden
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> Videos uploaded to Vercel Blob Storage will automatically appear here. 
            Use the "Hide" button to remove videos from your public website without deleting them from the database. 
            The page auto-refreshes every 30 seconds to detect new videos.
          </p>
        </div>
      </div>
    </div>
  )
}
