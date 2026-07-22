'use client';

import { FaPlay } from "react-icons/fa";
import Link from "next/link";

interface MovieCardProps {
  id: string;
  title: string;
  duration?: string;
  language?: string;
  genre?: string | string[];
  description?: string;
  director?: string;
  position: string;
  posterUrl: string;
  onClick: () => void;
}

const MovieCard = ({
  id,
  title,
  duration,
  language,
  genre,
  description,
  director,
  position,
  posterUrl,
  onClick,
}: MovieCardProps) => {
  let transformClass = '';
  let zIndex = '';
  let opacity = '';
  let blurClass = '';

  if (position === 'left') {
    transformClass = 'translate-x-[-75%] scale-90';
    zIndex = 'z-20';
    opacity = 'opacity-80';
    blurClass = 'blur-[2px]';
  } else if (position === 'center') {
    transformClass = 'translate-x-0 scale-100';
    zIndex = 'z-30';
    opacity = 'opacity-100';
    blurClass = 'blur-0';
  } else if (position === 'right') {
    transformClass = 'translate-x-[75%] scale-90';
    zIndex = 'z-20';
    opacity = 'opacity-80';
    blurClass = 'blur-[2px]';
  } else {
    transformClass = 'translate-x-0 scale-0';
    zIndex = 'z-0';
    opacity = 'opacity-0';
    blurClass = 'blur-0';
  }

  const formatGenre = (genre?: string | string[]) => {
    if (!genre) return '';
    if (Array.isArray(genre)) return genre.map(g => g.trim()).join(' | ');
    return genre.trim();
  };
  const metaArray = [];
  if (duration) metaArray.push(duration.trim());
  if (language) metaArray.push(language.trim());
  const genreString = formatGenre(genre);
  if (genreString) metaArray.push(genreString);
  const metaLine = metaArray.join(' | ');

  return (
    <div
      className={`movie-card absolute w-[1200px] h-[600px] rounded-3xl overflow-hidden shadow-2xl flex border-2 border-purple-300/30 transition-all duration-700 ease-in-out ${transformClass} ${zIndex} ${opacity} ${blurClass}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      aria-label={`Play movie ${title}`}>
      {/* Poster */}
      <div
        className="movie-poster absolute w-full h-full"
        style={{
          backgroundImage: `url(${posterUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Overlay info - middle left vertically centered */}
      <div className="relative z-40 flex flex-col justify-center items-start h-full pl-16 w-2/3">
        <h3 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">{title}</h3>
        
        {/* Meta line */}
        {metaLine && (
          <div className="text-white text-lg font-semibold mb-4 mt-2">
            {metaLine}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-white text-base mb-4 max-w-lg" style={{textShadow: '0 2px 6px #0007'}}>
            {description}
          </p>
        )}

        {/* Director */}
        {director && (
          <div className="text-white font-semibold mb-6">
            Directed by: <span className="font-bold text-purple-200">{director}</span>
          </div>
        )}

        {/* Watch Now Button */}
        <Link
          href={`/streaming?movie=${id}`}
          className="mt-2 px-7 py-3 rounded-full border border-white/40 text-white font-semibold flex items-center gap-2 bg-black/50 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 transition"
          onClick={e => { e.stopPropagation(); onClick(); }}
        >
          <FaPlay className="text-base" />
          Watch Now
        </Link>
      </div>
    </div>
  );
};

export default MovieCard;
