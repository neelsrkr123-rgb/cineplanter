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

  // Cyclic auto-slide
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

  // Exact 3D Positioning matching Screenshot 2
  const getCardStyle = (index: number) => {
    const total = featuredMovies.length;
    const offset = (index - currentIndex + total) % total;

    // Center Active Card
    if (offset === 0) {
      return {
        transform: 'translateX(-50%) scale(1)',
        left: '50%',
        zIndex: 30,
        opacity: 1,
        filter: 'brightness(100%)',
        pointerEvents: 'auto' as const,
      };
    }
    // Right Peek Card (Pushed right so it overflows slightly off-screen)
    if (offset === 1 || (total === 2 && offset === 1)) {
      return {
        transform: 'translateX(0%) scale(0.92)',
        left: '82%',
        zIndex: 20,
        opacity: 0.5,
        filter: 'brightness(35%) blur(1px)',
        pointerEvents: 'auto' as const,
      };
    }
    // Left Peek Card (Pushed left so it overflows slightly off-screen)
    if (offset === total - 1) {
      return {
        transform: 'translateX(-100%) scale(0.92)',
        left: '18%',
        zIndex: 20,
        opacity: 0.5,
        filter: 'brightness(35%) blur(1px)',
        pointerEvents: 'auto' as const,
      };
    }
    // Hidden Background Cards
    return {
      transform: 'translateX(-50%) scale(0.5)',
      left: '50%',
      zIndex: 10,
      opacity: 0,
      pointerEvents: 'none' as const,
    };
  };

  return (
    <section className="relative w-full h-[380px] sm:h-[440px] md:h-[480px] lg:h-[520px] flex items-center justify-center overflow-hidden pt-2 pb-6 px-12">
      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-3 md:left-6 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-3 md:right-6 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 3D Cyclic Cards Container */}
      <div className="relative w-full h-full">
        {featuredMovies.map((movie, index) => {
          const style = getCardStyle(index);
          const genreText = Array.isArray(movie.genre) 
            ? movie.genre.join(' | ') 
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
              className="absolute top-0 w-[85%] sm:w-[75%] md:w-[68%] lg:w-[64%] h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-out cursor-pointer border border-white/10"
            >
              {/* Wide Hero Image */}
              <img
                src={movie.heroUrl || movie.posterUrl || '/placeholder.jpg'}
                alt={movie.title}
                className="w-full h-full object-cover select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.jpg';
                }}
              />

              {/* Bottom Subtle Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

              {/* Title, Category & Watch Button Overlay */}
              <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 z-10 text-white max-w-lg">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 tracking-tight drop-shadow-lg">
                  {movie.title}
                </h2>

                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-200 mb-5 font-medium tracking-wide">
                  {movie.language && (
                    <span className="capitalize">{movie.language}</span>
                  )}
                  {movie.language && genreText && <span>|</span>}
                  {genreText && <span>{genreText}</span>}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayClick(movie.id);
                  }}
                  className="px-5 py-2 md:px-6 md:py-2.5 bg-black/60 hover:bg-black/90 text-white border border-white/20 font-semibold rounded-full flex items-center gap-2 transition-all duration-200 text-xs md:text-sm backdrop-blur-md shadow-lg active:scale-95"
                >
                  <span className="text-[10px] md:text-xs">▶</span> Watch Now
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Pagination Dots */}
      <div className="absolute bottom-1 z-40 flex gap-2 items-center">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-5 h-1.5'
                : 'bg-white/30 hover:bg-white/50 w-1.5 h-1.5'
            }`}
          />
        ))}
      </div>
    </section>
  );
}