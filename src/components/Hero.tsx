'use client';

import { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  duration?: string;
  language?: string;
  genre?: string[];  // 🔥 string[] করুন
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

  const getPosition = (index: number) => {
    const total = featuredMovies.length;
    const relativeIndex = (index - currentIndex + total) % total;
    if (relativeIndex === 0) return 'center';
    if (relativeIndex === 1) return 'right';
    if (relativeIndex === total - 1) return 'left';
    return 'hidden';
  };

  const currentMovie = featuredMovies[currentIndex];

  if (featuredMovies.length === 0) {
    return (
      <div className="w-full h-[390px] bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl flex items-center justify-center">
        <p className="text-white text-xl">No movies available</p>
      </div>
    );
  }

  return (
    <section className="mt-1 py-1 flex justify-center flex-col items-center w-full">
      {/* Hero Banner */}
      <div className="relative w-full h-[390px] rounded-2xl overflow-hidden">
        <img
          src={currentMovie.heroUrl || currentMovie.posterUrl || '/placeholder.jpg'}
          alt={currentMovie.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-8 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {currentMovie.title}
          </h1>
          {currentMovie.genre && (
            <span className="inline-block px-3 py-1 bg-purple-600/80 rounded-full text-sm text-white mb-2">
              {currentMovie.genre}
            </span>
          )}
          {currentMovie.description && (
            <p className="text-gray-300 text-sm line-clamp-2 mb-4">
              {currentMovie.description}
            </p>
          )}
          <button
            onClick={() => handlePlayClick(currentMovie.id)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full text-white font-semibold transition-all duration-200 shadow-lg"
          >
            ▶ Watch Now
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="carousel-container relative w-full h-[200px] flex justify-center items-center mt-4">
        <button
          onClick={() =>
            setCurrentIndex(
              (prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length
            )
          }
          className="absolute left-0 z-40 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {featuredMovies.map((movie, index) => (
          <MovieCard
            key={movie.id}
            {...movie}
            position={getPosition(index)}
            onClick={() => handlePlayClick(movie.id)}
            posterUrl={movie.posterUrl || ''}
          />
        ))}

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredMovies.length)}
          className="absolute right-0 z-40 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mt-4">
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
    </section>
  );
}