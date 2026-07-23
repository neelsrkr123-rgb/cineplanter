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
  genre?: string[];  // 🔥 string[] করুন (string না)
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
      <div className="w-full h-[400px] bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl flex items-center justify-center">
        <p className="text-white text-xl">No movies available</p>
      </div>
    );
  }

  const currentMovie = featuredMovies[currentIndex];

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
      {/* Background Image */}
      <img
        src={currentMovie.heroUrl || currentMovie.posterUrl || '/placeholder.jpg'}
        alt={currentMovie.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder.jpg';
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
          {currentMovie.title}
        </h1>
        
        {/* Genre Tags - array থেকে string এ রূপান্তর */}
        <div className="flex flex-wrap gap-2 mb-3">
          {currentMovie.genre && currentMovie.genre.length > 0 && (
            currentMovie.genre.slice(0, 3).map((g, i) => (
              <span key={i} className="px-3 py-1 bg-purple-600/80 rounded-full text-sm text-white">
                {g}
              </span>
            ))
          )}
          {currentMovie.language && (
            <span className="px-3 py-1 bg-blue-600/80 rounded-full text-sm text-white">
              {currentMovie.language}
            </span>
          )}
          {currentMovie.duration && (
            <span className="px-3 py-1 bg-gray-600/80 rounded-full text-sm text-white">
              {currentMovie.duration}
            </span>
          )}
        </div>
        
        {/* Description */}
        {currentMovie.description && (
          <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-4">
            {currentMovie.description}
          </p>
        )}
        
        {/* Watch Now Button */}
        <button
          onClick={() => handlePlayClick(currentMovie.id)}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full text-white font-semibold transition-all duration-200 shadow-lg"
        >
          <Play className="w-4 h-4" />
          Watch Now
        </button>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() =>
          setCurrentIndex(
            (prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length
          )
        }
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredMovies.length)}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all backdrop-blur-sm"
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-6'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}