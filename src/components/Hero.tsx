'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

export interface Movie {
  id: string;
  title: string;
  duration?: string;
  runtime?: string;
  language?: string;
  genre?: string[] | string;
  description?: string;
  director?: string;
  posterUrl?: string | any;
  heroUrl?: string | any;
  views?: number;
  likes?: number;
  rating?: number;
  uploadedAt?: any;
}

export default function Hero({ featuredMovies }: { featuredMovies: Movie[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  // Auto-slide every 5 seconds
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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  if (featuredMovies.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl flex items-center justify-center">
        <p className="text-white text-xl">No movies available</p>
      </div>
    );
  }

  return (
    <section className="relative w-full h-[380px] sm:h-[440px] md:h-[480px] lg:h-[520px] overflow-hidden rounded-2xl">
      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 z-40 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/20 hover:scale-110"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 z-40 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/20 hover:scale-110"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slides */}
      <div className="relative w-full h-full">
        {featuredMovies.map((movie, index) => {
          const isActive = index === currentIndex;
          const genreText = Array.isArray(movie.genre) 
            ? movie.genre.join(' • ') 
            : movie.genre;

          return (
            <div
              key={movie.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive 
                  ? 'opacity-100 scale-100 z-10' 
                  : 'opacity-0 scale-105 z-0'
              }`}
            >
              {/* Background Image */}
              <img
                src={movie.heroUrl || movie.posterUrl || '/placeholder.jpg'}
                alt={movie.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.jpg';
                }}
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-8 md:bottom-12 left-6 md:left-10 z-20 text-white max-w-2xl">
                {/* Movie Title */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 tracking-tight drop-shadow-lg">
                  {movie.title}
                </h2>

                {/* Genre & Language */}
                <div className="flex items-center gap-3 text-xs md:text-sm text-gray-300 mb-4">
                  {movie.language && (
                    <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                      {movie.language}
                    </span>
                  )}
                  {genreText && (
                    <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                      {genreText}
                    </span>
                  )}
                  {movie.duration && (
                    <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                      {movie.duration}
                    </span>
                  )}
                </div>

                {/* Description */}
                {movie.description && (
                  <p className="text-sm md:text-base text-gray-300 line-clamp-2 mb-4 max-w-xl">
                    {movie.description}
                  </p>
                )}

                {/* Watch Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayClick(movie.id);
                  }}
                  className="group flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Now</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-8 h-1.5'
                : 'bg-white/40 hover:bg-white/60 w-2 h-1.5'
            }`}
          />
        ))}
      </div>
    </section>
  );
}