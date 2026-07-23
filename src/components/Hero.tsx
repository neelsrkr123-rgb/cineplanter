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
      <div className="w-full h-[450px] bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl flex items-center justify-center">
        <p className="text-white text-xl">No movies available</p>
      </div>
    );
  }

  const total = featuredMovies.length;
  const centerIndex = currentIndex;
  const leftIndex = (centerIndex - 1 + total) % total;
  const rightIndex = (centerIndex + 1) % total;
  const leftLeftIndex = (centerIndex - 2 + total) % total;
  const rightRightIndex = (centerIndex + 2) % total;

  const getMoviePosition = (index: number) => {
    if (index === centerIndex) return 'center';
    if (index === leftIndex) return 'left';
    if (index === rightIndex) return 'right';
    if (index === leftLeftIndex) return 'left-left';
    if (index === rightRightIndex) return 'right-right';
    return 'hidden';
  };

  const getCardStyle = (position: string) => {
    switch (position) {
      case 'center':
        return 'z-30 scale-100 opacity-100 translate-x-0';
      case 'left':
        return 'z-20 scale-90 opacity-80 -translate-x-[70%] translate-y-[10%]';
      case 'right':
        return 'z-20 scale-90 opacity-80 translate-x-[70%] translate-y-[10%]';
      case 'left-left':
        return 'z-10 scale-75 opacity-50 -translate-x-[140%] translate-y-[20%]';
      case 'right-right':
        return 'z-10 scale-75 opacity-50 translate-x-[140%] translate-y-[20%]';
      default:
        return 'z-0 scale-75 opacity-0 pointer-events-none';
    }
  };

  const currentMovie = featuredMovies[centerIndex];

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden">
      {/* Hero Banner */}
      <div className="absolute inset-0">
        <img
          src={currentMovie.heroUrl || currentMovie.posterUrl || '/placeholder.jpg'}
          alt={currentMovie.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-2xl z-20">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
          {currentMovie.title}
        </h1>
        
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
        
        {currentMovie.description && (
          <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-4">
            {currentMovie.description}
          </p>
        )}
        
        <button
          onClick={() => handlePlayClick(currentMovie.id)}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full text-white font-semibold transition-all duration-200 shadow-lg"
        >
          <Play className="w-4 h-4" />
          Watch Now
        </button>
      </div>

      {/* Movie Cards Carousel */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-5xl z-10">
        <div className="relative flex justify-center items-center h-[280px]">
          {featuredMovies.map((movie, index) => {
            const position = getMoviePosition(index);
            const cardStyle = getCardStyle(position);
            
            if (position === 'hidden') return null;

            return (
              <div
                key={movie.id}
                className={`absolute transition-all duration-700 ease-in-out cursor-pointer w-[180px] h-[250px] rounded-xl overflow-hidden shadow-2xl ${cardStyle}`}
                onClick={() => {
                  if (position !== 'center') {
                    setCurrentIndex(index);
                  } else {
                    router.push(`/streaming/movie/${movie.id}`);
                  }
                }}
              >
                <img
                  src={movie.posterUrl || '/placeholder.jpg'}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-semibold truncate">{movie.title}</p>
                  {movie.rating && (
                    <p className="text-yellow-400 text-xs">⭐ {movie.rating}</p>
                  )}
                </div>
                {position === 'center' && (
                  <div className="absolute inset-0 border-2 border-purple-500/50 rounded-xl pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + total) % total)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % total)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all backdrop-blur-sm"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === centerIndex
                ? 'bg-white w-6'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}