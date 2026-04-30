// src/app/page.tsx
'use client';

import Navbar from '#/components/Navbar';
import Hero from '#/components/Hero';
import PosterCard from '#/components/PosterCard';
import Section from '#/components/Section';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '#/lib/firebase';

interface Movie {
  id: string;
  title: string;
  runtime?: string;
  language?: string;
  genre?: string[];
  posterUrl?: string | any;
  heroUrl?: string | any;
  views?: number;
  likes?: number;
  rating?: number;
  uploadedAt?: any;
}

// Helper function to extract URL from either string or object
const extractImageUrl = (imageData: string | any): string => {
  if (!imageData) return '';
  if (typeof imageData === 'string') return imageData;
  if (imageData.url) return imageData.url;
  return '';
};

export default function Home() {
  const [newMovies, setNewMovies] = useState<Movie[]>([]);
  const [mostWatched, setMostWatched] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Latest Movies
        const latestQuery = query(
          collection(db, 'movies'), 
          orderBy('uploadedAt', 'desc'), 
          limit(12)
        );
        const latestSnapshot = await getDocs(latestQuery);
        const latest = latestSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            runtime: data.runtime || '2h',
            language: data.language || 'English',
            genre: data.genre || [],
            posterUrl: extractImageUrl(data.posterUrl),
            heroUrl: extractImageUrl(data.heroUrl),
            views: data.views || 0,
            likes: data.likes || 0,
            rating: data.rating || 0,
            uploadedAt: data.uploadedAt,
          };
        });
        setNewMovies(latest);

        // Most Watched
        const watchedQuery = query(
          collection(db, 'movies'), 
          orderBy('views', 'desc'), 
          limit(12)
        );
        const watchedSnapshot = await getDocs(watchedQuery);
        const watched = watchedSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            runtime: data.runtime || '2h',
            language: data.language || 'English',
            genre: data.genre || [],
            posterUrl: extractImageUrl(data.posterUrl),
            heroUrl: extractImageUrl(data.heroUrl),
            views: data.views || 0,
            likes: data.likes || 0,
            rating: data.rating || 0,
          };
        });
        setMostWatched(watched);

        // Top Rated
        const ratedQuery = query(
          collection(db, 'movies'), 
          orderBy('rating', 'desc'), 
          limit(12)
        );
        const ratedSnapshot = await getDocs(ratedQuery);
        const rated = ratedSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            runtime: data.runtime || '2h',
            language: data.language || 'English',
            genre: data.genre || [],
            posterUrl: extractImageUrl(data.posterUrl),
            heroUrl: extractImageUrl(data.heroUrl),
            views: data.views || 0,
            likes: data.likes || 0,
            rating: data.rating || 0,
          };
        });
        setTopRated(rated);

        // Hero Movies - first 5 movies with hero images
        const heroQuery = query(
          collection(db, 'movies'),
          limit(5)
        );
        const heroSnapshot = await getDocs(heroQuery);
        const hero = heroSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            runtime: data.runtime || '2h',
            language: data.language || 'English',
            genre: data.genre || [],
            posterUrl: extractImageUrl(data.posterUrl),
            heroUrl: extractImageUrl(data.heroUrl),
            views: data.views || 0,
            likes: data.likes || 0,
            rating: data.rating || 0,
          };
        });
        setFeaturedMovies(hero);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching movies:', error);
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
    <div className="min-h-screen bg-[#050505] pb-20 relative overflow-hidden">
      
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full" />
      </div>

      <Navbar />

      <main className="relative z-10 pt-24 px-4 md:px-6">
        {/* HERO CAROUSEL */}
        {featuredMovies.length > 0 && <Hero featuredMovies={featuredMovies} />}

        <div className="w-full px-5 md:px-6 mt-16">
          {/* NEW MOVIES */}
          <Section title="New Movies" viewAllLink="/movies">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {newMovies.map((movie) => (
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

          {/* MOST WATCHED */}
          <Section title="Most Watched" viewAllLink="/movies">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {mostWatched.map((movie) => (
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

          {/* TOP RATED */}
          <Section title="Top Rated" viewAllLink="/movies">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {topRated.map((movie) => (
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