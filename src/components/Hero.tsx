'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  // Cyclic auto-slide interval
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
      <div className="w-full h-[450px] bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl flex items-center justify-center">
        <p className="text-white text-xl">No movies available</p>
      </div>
    );
  }

  // Calculate 3D positioning styles for dynamic depth
  const getCardStyle = (index: number) => {
    const total = featuredMovies.length;
    const offset = (index - currentIndex + total) % total;

    // Center Active Card
    if (offset === 0) {
      return {
        transform: 'translateX(0%) scale(1)',
        zIndex: 30,
        opacity: 1,
        filter: 'brightness(100%)',
        pointerEvents: 'auto' as const,
      };
    }
    // Immediate Right Card
    if (offset === 1 || (total === 2 && offset === 1)) {
      return {
        transform: 'translateX(55%) scale(0.85)',
        zIndex: 20,
        opacity: 0.6,
        filter: 'brightness(50%) blur(1px)',
        pointerEvents: 'auto' as const,
      };
    }
    // Immediate Left Card
    if (offset === total - 1) {
      return {
        transform: 'translateX(-55%) scale(0.85)',
        zIndex: 20,
        opacity: 0.6,
        filter: 'brightness(50%) blur(1px)',
        pointerEvents: 'auto' as const,
      };
    }
    // Hidden Background Cards
    return {
      transform: 'translateX(0%) scale(0.5)',
      zIndex: 10,
      opacity: 0,
      pointerEvents: 'none' as const,
    };
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto h-[460px] flex items-center justify-center overflow-hidden py-4">
      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 z-40 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 border border-white/10 shadow-2xl"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 z-40 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 border border-white/10 shadow-2xl"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 3D Cyclic Cards Stack */}
      <div className="relative w-full h-full flex items-center justify-center">
        {featuredMovies.map((movie, index) => {
          const style = getCardStyle(index);
          const genreText = Array.isArray(movie.genre) 
            ? movie.genre.join(', ') 
            : movie.genre;

          return (
            <div
              key={movie.id}
              onClick={() => {
                if (index !== currentIndex) {
                  setCurrentIndex(index);
                }
              }}
              style={style}
              className="absolute w-[80%] md:w-[68%] lg:w-[62%] h-[420px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-out cursor-pointer border border-white/10"
            >
              {/* Cover Image */}
              <img
                src={movie.heroUrl || movie.posterUrl || '/placeholder.jpg'}
                alt={movie.title}
                className="w-full h-full object-cover select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.jpg';
                }}
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full max-w-xl text-white">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-wide drop-shadow-md">
                  {movie.title}
                </h2>

                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300 mb-4 font-medium">
                  {movie.language && (
                    <span>{movie.language}</span>
                  )}
                  {movie.language && genreText && <span>|</span>}
                  {genreText && <span>{genreText}</span>}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayClick(movie.id);
                  }}
                  className="px-6 py-2.5 bg-white text-black hover:bg-gray-200 font-semibold rounded-full flex items-center gap-2 transition-all duration-200 shadow-md text-sm md:text-base active:scale-95"
                >
                  <span className="text-xs">▶</span> Watch Now
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-2 z-40 flex gap-2">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-6'
                : 'bg-white/30 hover:bg-white/50 w-2'
            }`}
          />
        ))}
      </div>
    </section>
  );
}