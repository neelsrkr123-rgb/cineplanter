'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  if (featuredMovies.length === 0) {
    return (
      <div className="w-full h-64 bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl flex items-center justify-center">
        <p className="text-white text-xl">Welcome to CinePlanter</p>
      </div>
    );
  }

  const movie = featuredMovies[currentIndex];

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden">
      <img 
        src={movie.heroUrl || movie.posterUrl || '/placeholder.jpg'}
        alt={movie.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder.jpg';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
        <div>
          <h1 className="text-4xl font-bold text-white">{movie.title}</h1>
          {movie.genre && movie.genre.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {movie.genre.slice(0, 3).map((g, i) => (
                <span key={i} className="px-2 py-1 bg-purple-600/50 rounded-full text-xs text-white">
                  {g}
                </span>
              ))}
            </div>
          )}
          <button 
            onClick={() => handlePlayClick(movie.id)}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition"
          >
            Watch Now
          </button>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white scale-125' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}