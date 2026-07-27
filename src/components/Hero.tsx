'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

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
  cast?: Array<{imageUrl?: string; name?: string;}>;
  crew?: Array<{userId?: string; name?: string; role?: string}>;
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

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
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

  const getCardPosition = (index: number) => {
    const total = featuredMovies.length;
    const offset = (index - currentIndex + total) % total;

    if (offset === 0) return 'center';
    if (offset === 1 || (total === 2 && offset === 1)) return 'right';
    if (offset === total - 1) return 'left';
    return 'hidden';
  };

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 py-8 relative">
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center">
        
        {/* Slides */}
        {featuredMovies.map((movie, index) => {
          const position = getCardPosition(index);
          const genreText = Array.isArray(movie.genre) 
            ? movie.genre.join(' • ') 
            : movie.genre;

          if (position === 'hidden') return null;

          const isCenter = position === 'center';
          const isLeft = position === 'left';
          const isRight = position === 'right';

          return (
            <div
              key={movie.id}
              className={`absolute w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ease-in-out border border-white/10
                ${isCenter ? 'z-30' : ''}
                ${isLeft ? 'z-10' : ''}
                ${isRight ? 'z-10' : ''}
              `}
              style={{
                transform: isCenter ? 'translateX(0) scale(1)' : 
                           isLeft ? 'translateX(-75%) scale(0.85)' : 
                           isRight ? 'translateX(75%) scale(0.85)' : 
                           'translateX(0) scale(1)',
                filter: isCenter ? 'blur(0) brightness(1)' : 
                        isLeft || isRight ? 'blur(4px) brightness(0.4)' : 
                        'blur(0) brightness(1)',
                opacity: isCenter ? 1 : 0.5,
                zIndex: isCenter ? 30 : 10,
                pointerEvents: isCenter ? 'auto' : 'none',
              }}
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

              {/* Left Side Vignette Gradient - Only on Center Card */}
              {isCenter && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 via-60% to-transparent" />
              )}

              {/* Left Side Content - Only on Center Card */}
              {isCenter && (
                <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10 lg:p-14 z-10 w-full md:w-[60%] lg:w-[55%]">
                  {/* Movie Title */}
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
                    {movie.title}
                  </h3>

                  {/* Runtime | Language | Genre */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
                    {movie.duration && (
                      <span className="text-white/90 text-xs md:text-sm font-medium">
                        {movie.duration}
                      </span>
                    )}
                    {movie.duration && (movie.language || genreText) && (
                      <span className="text-white/50 text-xs md:text-sm">|</span>
                    )}
                    {movie.language && (
                      <span className="text-white/90 text-xs md:text-sm font-medium">
                        {movie.language}
                      </span>
                    )}
                    {(movie.language || movie.duration) && genreText && (
                      <span className="text-white/50 text-xs md:text-sm">|</span>
                    )}
                    {genreText && (
                      <span className="text-white/90 text-xs md:text-sm font-medium">
                        {genreText}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {movie.description && (
                    <p className="text-gray-300 text-sm md:text-base max-w-xl mb-4 line-clamp-3 drop-shadow-md">
                      {movie.description}
                    </p>
                  )}

                  {/* Directed by */}
                  {movie.director && (
                    <p className="text-white font-semibold text-sm md:text-base mb-5 drop-shadow-md">
                      Directed by: <span className="text-purple-300 font-medium">{movie.director}</span>
                    </p>
                  )}

                  {/* Watch Now Button - Updated hover effect like Sign In button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayClick(movie.id);
                    }}
                    className="group flex items-center gap-1.5 px-4 py-1.5 md:px-5 md:py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs md:text-sm rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl w-fit shadow-lg"
                  >
                    <Play className="w-3 h-3 md:w-4 md:h-4 fill-white" />
                    <span>Watch Now</span>
                  </button>
                </div>
              )}

              {/* Play Button - Only on side cards */}
              {!isCenter && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayClick(movie.id);
                    }}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/30"
                  >
                    <Play className="w-5 h-5 md:w-6 md:h-6 fill-white ml-1" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows - Moved extremely far left and right */}
      <button
        onClick={prevSlide}
        className="absolute left-0 md:-left-20 lg:-left-32 xl:-left-48 top-1/2 -translate-y-1/2 z-[60] w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/20 hover:scale-110 shadow-lg"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-0 md:-right-20 lg:-right-32 xl:-right-48 top-1/2 -translate-y-1/2 z-[60] w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/20 hover:scale-110 shadow-lg"
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-3 mt-4">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'bg-white w-6 h-2 shadow-lg shadow-purple-500/30'
                : 'bg-white/30 hover:bg-white/50 w-2 h-2'
            }`}
          />
        ))}
      </div>
    </section>
  );
}