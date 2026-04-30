// src/components/PosterCard.tsx
'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play, Star } from "lucide-react"

interface PosterCardProps {
  id: string
  title: string
  duration?: string
  language?: string
  genres?: string[]
  posterUrl?: string
  rating?: number
}

export default function PosterCard({
  id,
  title,
  duration = "Unknown",
  language = "Unknown",
  genres = [],
  posterUrl = "",
  rating = 0,
}: PosterCardProps) {

  const router = useRouter()
  const [imageError, setImageError] = useState(false)

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/streaming/movie/${id}`)
  }

  const handleCardClick = () => {
    router.push(`/streaming/movie/${id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer rounded-xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30">

        {/* IMAGE */}
        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-white/30">
              {title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* GRADIENT OVERLAY */}
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/95 via-black/70 to-transparent" />

        {/* RATING BADGE */}
        {rating > 0 && (
          <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Star size={10} className="fill-yellow-400" />
            {rating.toFixed(1)}
          </div>
        )}

        {/* TEXT CONTENT */}
        <div className="absolute left-0 right-0 bottom-2 px-3 z-20 group-hover:bottom-16 transition-all duration-500">
          <h3 className="text-white font-bold text-sm mb-1 line-clamp-2 group-hover:text-purple-400">
            {title}
          </h3>

          {/* GENRE */}
          {genres && genres.length > 0 && (
            <div className="flex flex-wrap gap-x-2 text-xs text-gray-300 mb-1">
              {genres.slice(0, 2).map((g, i) => (
                <span key={i}>{g}</span>
              ))}
            </div>
          )}

          {/* LANGUAGE + DURATION */}
          <p className="text-xs text-gray-400">
            {language} • {duration}
          </p>
        </div>

        {/* WATCH BUTTON */}
        <div className="absolute left-0 right-0 bottom-0 px-3 pb-3 z-20 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <button
            onClick={handlePlayClick}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Play size={14} />
            Watch Now
          </button>
        </div>
      </div>
    </div>
  )
}