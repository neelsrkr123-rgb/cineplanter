'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '#/lib/firebase';

interface Movie {
  id: string;
  title: string;
  posterUrl?: string;
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const q = query(collection(db, 'movies'), orderBy('uploadedAt', 'desc'), limit(6));
        const snapshot = await getDocs(q);
        const moviesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || 'Untitled',
          posterUrl: doc.data().posterUrl || '',
        }));
        setMovies(moviesData);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold text-center mb-4">CinePlanter</h1>
        <p className="text-center text-gray-400 mb-12">A Filmmakers Ecosystem</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <div key={movie.id} className="bg-gray-800 rounded-lg overflow-hidden">
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
              <div className="p-2">
                <h3 className="text-sm font-semibold truncate">{movie.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}