'use client';

import { useEffect, useState } from 'react';
import { db } from '#/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import Navbar from '#/components/Navbar';
import Hero from '#/components/Hero';
import PosterCard from '#/components/PosterCard';
import Section from '#/components/Section';

export default function Home() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const moviesRef = collection(db, 'movies');
        const q = query(moviesRef, orderBy('uploadedAt', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        const moviesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-blue-950 pb-20">
      <Navbar />
      <main className="pt-24 px-4 md:px-6">
        {/* 🔥 ফিক্স: featuredMovies prop পাস করুন */}
        <Hero featuredMovies={movies.slice(0, 5)} />

        <div className="w-full px-2 md:px-6 mt-16">
          <Section title="New Movies" viewAllLink="/movies">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {movies.map(movie => (
                <PosterCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  duration={movie.runtime}
                  language={movie.language}
                  genres={movie.genre}
                  posterUrl={movie.posterUrl}
                  rating={movie.rating}
                />
              ))}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}