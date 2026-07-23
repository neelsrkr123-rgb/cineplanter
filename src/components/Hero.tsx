// src/components/Hero.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  duration?: string;
  language?: string;
  genre?: string[];
  description?: string;
  director?: string;
  posterUrl?: string;
  heroUrl?: string;
  rating?: number;
}

export default function Hero({ featuredMovies }: { featuredMovies: Movie[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (featuredMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredMovies]);

  const handlePlayClick = (movieId: string) => {
    router.push(`/streaming/movie/${movieId}`);
  };

  if (featuredMovies.length === 0) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl flex items-center justify-center">
        <p className="text-white text-lg">No movies available</p>
      </div>
    );
  }

  const currentMovie = featuredMovies[currentIndex];

  return (
    <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden relative">
      <img
        src={currentMovie.heroUrl || currentMovie.posterUrl || '/placeholder.jpg'}
        alt={currentMovie.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder.jpg';
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      
      <div className="absolute bottom-0 left-0 p-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">
          {currentMovie.title}
        </h1>
        
        <div className="flex flex-wrap gap-1.5 mb-2">
          {currentMovie.genre && currentMovie.genre.length > 0 && (
            currentMovie.genre.slice(0, 3).map((g, i) => (
              <span key={i} className="px-2.5 py-0.5 bg-purple-600/80 rounded-full text-xs text-white">
                {g}
              </span>
            ))
          )}
          {currentMovie.language && (
            <span className="px-2.5 py-0.5 bg-blue-600/80 rounded-full text-xs text-white">
              {currentMovie.language}
            </span>
          )}
          {currentMovie.duration && (
            <span className="px-2.5 py-0.5 bg-gray-600/80 rounded-full text-xs text-white">
              {currentMovie.duration}
            </span>
          )}
        </div>
        
        {currentMovie.description && (
          <p className="text-gray-300 text-xs md:text-sm line-clamp-2 mb-3">
            {currentMovie.description}
          </p>
        )}
        
        <button
          onClick={() => handlePlayClick(currentMovie.id)}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full text-white text-sm font-medium transition-all duration-200 shadow-lg"
        >
          <Play className="w-3.5 h-3.5" />
          Watch Now
        </button>
      </div>

      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredMovies.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all backdrop-blur-sm"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-4'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}