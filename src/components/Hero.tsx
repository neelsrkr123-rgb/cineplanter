'use client';

import { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { useRouter } from 'next/navigation';

interface Movie {
  id: string;
  title: string;
  duration?: string;
  language?: string;
  genre?: string;
  description?: string;
  director?: string;
  posterUrl?: string;
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

  return (
    <section className="mt-1 py-1 flex justify-center flex-col items-center">
      <div className="carousel-container relative w-full max-w-9xl h-[390px] flex justify-center items-center mb-5">
        <button
          onClick={() =>
            setCurrentIndex(
              (prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length
            )
          }
          className="absolute left-4 z-40 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-all"
        >
          <i className="fas fa-chevron-left"></i>
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
          className="absolute right-4 z-40 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-all"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <div className="flex gap-3 mt-5">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white scale-125'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
