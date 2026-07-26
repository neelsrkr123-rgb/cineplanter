'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';

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
  const [currentIndex, setCurrentIndex] = useState(1);
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

  const getCardPosition = (index: number) => {
    const total = featuredMovies.length;
    const offset = (index - currentIndex + total) % total;

    if (offset === 0) return 'center';
    if (offset === 1 || (total === 2 && offset === 1)) return 'right';
    if (offset === total - 1) return 'left';
    return 'hidden';
  };

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 py-8">
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center">
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
                ${isCenter ? 'transform scale-100 opacity-100 z-30' : ''}
                ${isLeft ? 'transform -translate-x-[75%] scale-85 blur-sm opacity-60 z-10' : ''}
                ${isRight ? 'transform translate-x-[75%] scale-85 blur-sm opacity-60 z-10' : ''}
              `}
              style={{
                transform: isLeft ? 'translateX(-75%) scale(0.85)' : 
                           isRight ? 'translateX(75%) scale(0.85)' : 
                           'translateX(0) scale(1)',
                filter: isLeft || isRight ? 'blur(4px)' : 'blur(0)',
                opacity: isLeft || isRight ? 0.6 : 1,
                zIndex: isCenter ? 30 : 10,
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
                  {/* Movie Title - No background */}
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
                    {movie.title}
                  </h3>

                  {/* Runtime | Language | Genre - No background */}
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

                  {/* Description - No background */}
                  {movie.description && (
                    <p className="text-gray-300 text-sm md:text-base max-w-xl mb-4 line-clamp-3 drop-shadow-md">
                      {movie.description}
                    </p>
                  )}

                  {/* Directed by - No background */}
                  {movie.director && (
                    <p className="text-white font-semibold text-sm md:text-base mb-5 drop-shadow-md">
                      Directed by: <span className="text-purple-300 font-medium">{movie.director}</span>
                    </p>
                  )}

                  {/* Watch Now Button - Smaller */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayClick(movie.id);
                    }}
                    className="group flex items-center gap-1.5 px-4 py-1.5 md:px-5 md:py-2 bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/30 rounded-full text-white font-semibold text-xs md:text-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl w-fit"
                  >
                    <Play className="w-3 h-3 md:w-4 md:h-4 fill-white" />
                    <span>Watch Now</span>
                  </button>
                </div>
              )}

              {/* Play Button - Only on side cards (left/right) */}
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

      {/* Pagination Dots */}
      <div className="flex justify-center gap-3 mt-4">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
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