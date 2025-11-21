"use client"

import { useRouter } from "next/navigation"
import { Film, Rocket, Music, Shirt, BookOpen } from "lucide-react"

interface MenuButtonProps {
  label: string
  href: string
  icon: React.ReactNode
}

function MenuButton({ label, href, icon }: MenuButtonProps) {
  const router = useRouter()
  
  return (
    <button
      onClick={() => router.push(href)}
      className="group relative p-8 bg-[#181818] hover:bg-[#272727] border border-[#272727] hover:border-white/20 rounded-lg transition-all duration-300 transform hover:scale-105"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-4 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-medium mb-2">{label}</h3>
      </div>
    </button>
  )
}

export default function MainMenuPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-[#272727] px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold">CIRCUS17</h1>
          <a
            href="/admin"
            className="px-4 py-2 text-sm bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors"
          >
            Admin
          </a>
        </div>
      </header>

      {/* Main Menu Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-light mb-4">Main Menu</h2>
          <p className="text-gray-400 text-lg">Select a category to explore</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <MenuButton
            label="Recent Videos"
            href="/videos?category=recent-work"
            icon={<Film className="w-8 h-8 text-white" />}
          />
          <MenuButton
            label="Launch Videos"
            href="/videos?category=industry-work"
            icon={<Rocket className="w-8 h-8 text-white" />}
          />
          <MenuButton
            label="Music"
            href="/videos?category=music-video"
            icon={<Music className="w-8 h-8 text-white" />}
          />
          <MenuButton
            label="Clothing"
            href="/videos?category=clothing"
            icon={<Shirt className="w-8 h-8 text-white" />}
          />
          <MenuButton
            label="Narrative"
            href="/videos?category=narrative"
            icon={<BookOpen className="w-8 h-8 text-white" />}
          />
        </div>
      </main>
    </div>
  )
}

