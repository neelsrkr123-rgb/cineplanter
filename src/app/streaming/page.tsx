'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '#/context/AuthContext';
import { 
  Play, Pause, Volume2, VolumeX, 
  ThumbsUp, ThumbsDown, Share, 
  User, Clock, Globe, Star, Film,
  ChevronDown, ChevronUp, Bookmark, Eye, MessageSquareText
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '#/components/Navbar';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '#/lib/firebase';

interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  youtubeId: string;
  genre: string[];
  language: string;
  runtime: string;
  rating: number;
  views: number;
  likes: number;
  cast: Array<{ name: string; role: string; imageUrl: string }>;
  crew: Array<{ name: string; role: string; imageUrl: string }>;
  uploadedAt: any;
  uploadedBy: string;
  uploadedByEmail: string;
}

export default function StreamingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const movieId = params.id as string;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [error, setError] = useState<string>('');

  // Dynamic state for hover effect on the circular chart
  const [hoveredRating, setHoveredRating] = useState<{ label: string; value: number; color: string } | null>(null);

  // Firestore থেকে movie data fetch করুন - FIXED VERSION
  useEffect(() => {
    const fetchMovie = async () => {
      if (!movieId) {
        console.log('❌ No movie ID found in URL');
        setError('Movie ID not found');
        setLoadingMovie(false);
        return;
      }

      try {
        setLoadingMovie(true);
        setError('');
        console.log('🔄 Fetching movie with ID:', movieId);
        
        const docRef = doc(db, 'movies', movieId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const movieData = docSnap.data() as Movie;
          console.log('✅ Movie data found:', {
            id: docSnap.id,
            title: movieData.title,
            youtubeId: movieData.youtubeId,
            hasBackdrop: !!movieData.backdropUrl,
            hasPoster: !!movieData.posterUrl
          });
          
          setMovie({ 
            ...movieData, 
            id: docSnap.id 
          });
          
          // Increment view count
          try {
            await updateDoc(docRef, {
              views: increment(1)
            });
            console.log('✅ View count incremented');
          } catch (viewError) {
            console.log('⚠️ Could not increment view count:', viewError);
          }
        } else {
          console.log('❌ No movie found with ID:', movieId);
          setError('Movie not found in database');
        }
      } catch (err: any) {
        console.error('❌ Error fetching movie:', err);
        setError(`Failed to load movie: ${err.message}`);
      } finally {
        setLoadingMovie(false);
        console.log('🏁 Movie loading completed');
      }
    };

    // Debounce fetch to prevent multiple calls
    const timer = setTimeout(() => {
      fetchMovie();
    }, 100);

    return () => clearTimeout(timer);
  }, [movieId]); // Only depend on movieId

  // Sample fallback movie data
  const fallbackMovie = {
    id: movieId || "1",
    title: "4 Filmmakers Exception",
    description: "A gripping tale of four filmmakers who find themselves entangled in a web of crime and moral dilemmas. Set in the bustling city of Kolkata, this crime drama explores the dark underbelly of the film industry and the lengths people will go to achieve their dreams.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1700&q=80",
    genre: ["Crime", "Drama"],
    language: "Bengali",
    runtime: "2h 15m",
    year: 2024,
    rating: 4.5,
    director: "Name Fellow",
    views: "1.2M",
    uploadDate: "1 day ago",
    likes: "118K",
    comments: 918,
    subscribers: "1.5M",
    cast: [
      { name: "Raj Sharma", role: "Lead Actor", image: "https://via.placeholder.com/80?text=Actor" },
      { name: "Priya Patel", role: "Lead Actress", image: "https://via.placeholder.com/80?text=Actress" },
      { name: "Sneha Das", role: "Cinematographer", image: "https://via.placeholder.com/80?text=Cinematographer" },
      { name: "Michael Roy", role: "Writer", image: "https://via.placeholder.com/80?text=Writer" },
      { name: "Amit Kumar", role: "Music Director", image: "https://via.placeholder.com/80?text=Composer" }
    ],
    reviews: [
      { 
        id: 1, 
        username: "JohnDoe", 
        rating: 4, 
        tag: "Good Effort", 
        comment: "This film shows remarkable potential from emerging filmmakers. The cinematography is stunning, capturing the essence of Kolkata beautifully.",
        likes: 12,
        avatar: "https://via.placeholder.com/40?text=User"
      }
    ],
    ratings: {
      needsWork: 10,
      decentAttempt: 20,
      goodEffort: 40,
      outstanding: 30
    },
    uploader: {
        name: "Director's Cut",
        avatar: "https://via.placeholder.com/40?text=DC"
    }
  };

  // Actual movie data ব্যবহার করুন, না হলে fallback
  const currentMovie = movie ? {
    id: movie.id,
    title: movie.title || "Untitled Movie",
    description: movie.description || "No description available",
    videoUrl: movie.youtubeId ? `https://www.youtube.com/embed/${movie.youtubeId}` : fallbackMovie.videoUrl,
    thumbnail: movie.backdropUrl || movie.posterUrl || fallbackMovie.thumbnail,
    genre: movie.genre || fallbackMovie.genre,
    language: movie.language || fallbackMovie.language,
    runtime: movie.runtime || fallbackMovie.runtime,
    rating: movie.rating || fallbackMovie.rating,
    views: movie.views?.toString() || "0",
    uploadDate: "Recently",
    likes: movie.likes?.toString() || "0",
    comments: 0,
    subscribers: "1.5M",
    cast: movie.cast && movie.cast.length > 0 ? movie.cast.map(person => ({
      name: person.name,
      role: person.role,
      image: person.imageUrl || "https://via.placeholder.com/80?text=Person"
    })) : fallbackMovie.cast,
    reviews: fallbackMovie.reviews,
    ratings: fallbackMovie.ratings,
    uploader: {
      name: movie.uploadedByEmail || "Uploader",
      avatar: "https://via.placeholder.com/40?text=U"
    }
  } : fallbackMovie;

  // Video controls (fallback video এর জন্য)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || movie?.youtubeId) return; // YouTube থাকলে video controls skip

    const updateProgress = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    
    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [movie?.youtubeId]); // Re-run when YouTube ID changes

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || movie?.youtubeId) return;

    if (video.paused) {
      video.play().catch(error => {
        console.error("Video play failed:", error);
      });
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video || movie?.youtubeId) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || movie?.youtubeId) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || movie?.youtubeId) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-yellow-400" />);
    }
    
    return stars;
  };

  const ratingsWithColors = [
    { label: "Outstanding", value: currentMovie.ratings.outstanding, color: "#3B82F6" },
    { label: "Good Effort", value: currentMovie.ratings.goodEffort, color: "#10B981" },
    { label: "Decent Attempt", value: currentMovie.ratings.decentAttempt, color: "#F59E0B" },
    { label: "Needs Work", value: currentMovie.ratings.needsWork, color: "#EF4444" }
  ];

  const circumference = 2 * Math.PI * 45;

  // Show error page if there's an error
  if (error && !loadingMovie) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Error Loading Movie</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <div className="space-y-3 text-sm text-gray-400">
              <p>Movie ID: {movieId}</p>
              <p>Please check if the movie exists in the database.</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loadingMovie) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Loading movie...</p>
            <p className="text-sm text-gray-400 mt-2">ID: {movieId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 pt-2">
        {/* Debug Info - Remove in production */}
        <div className="mb-4 p-3 bg-blue-900/30 rounded-lg text-sm">
          <div className="flex flex-wrap gap-4">
            <span>🎬 Movie: {currentMovie.title}</span>
            <span>🆔 ID: {movieId}</span>
            <span>📹 Type: {movie?.youtubeId ? 'YouTube' : 'Fallback'}</span>
            {movie?.youtubeId && <span>YouTube ID: {movie.youtubeId}</span>}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content - wider */}
          <div className="w-full lg:w-3/4 space-y-2">
            {/* Video Player */}
            <div className="relative bg-black rounded-xl overflow-hidden">
              {/* YouTube Video Player */}
              {movie?.youtubeId ? (
                <div className="w-full aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.youtubeId}?autoplay=0&controls=1&modestbranding=1&rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentMovie.title}
                  />
                </div>
              ) : (
                // Fallback video player
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-auto max-h-[70vh] object-contain"
                    src={currentMovie.videoUrl}
                    poster={currentMovie.thumbnail}
                    onClick={togglePlay}
                  />
                  
                  {/* Fallback Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {/* Progress Bar */}
                    <div className="w-full mb-2">
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleProgressChange}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                      <div className="flex justify-between text-sm text-gray-300 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={togglePlay} 
                          className="text-white hover:text-gray-300 transition"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={toggleMute} 
                            className="text-white hover:text-gray-300 transition"
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX className="w-5 h-5" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>
                          
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Play Button Overlay (Fallback video এর জন্য) */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        onClick={togglePlay}
                        className="bg-black/50 rounded-full p-4 hover:bg-black/70 transition"
                      >
                        <Play className="w-12 h-12 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rest of your UI components remain the same */}
            {/* Title and Details Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl font-bold">{currentMovie.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{currentMovie.runtime}</span>
                  <span className="text-gray-600">|</span>
                  <span>{currentMovie.genre.join(", ")}</span>
                  <span className="text-gray-600">|</span>
                  <span>{currentMovie.language}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-start md:items-end gap-2 mt-4 md:mt-0">
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center bg-gray-800 rounded-full">
                    <button className="flex items-center gap-2 hover:bg-gray-700 rounded-l-full px-4 py-2 transition">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{currentMovie.likes}</span>
                    </button>
                    <div className="h-4 w-px bg-gray-700"></div>
                    <button className="flex items-center gap-2 hover:bg-gray-700 rounded-r-full px-4 py-2 transition">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-full px-4 py-2 transition">
                    <Share className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-full px-4 py-2 transition">
                    <MessageSquareText className="w-4 h-4" />
                    <span>Review</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-full px-4 py-2 transition">
                    <Eye className="w-4 h-4" />
                    <span>Watched</span>
                  </button>
                  <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-full px-4 py-2 transition">
                    <Bookmark className="w-4 h-4" />
                    <span>Watchlist</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Uploader Section */}
            <div className="flex items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                <img src={currentMovie.uploader.avatar} alt={currentMovie.uploader.name} className="w-full h-full object-cover"/>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{currentMovie.uploader.name}</span>
              </div>
              <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors font-medium">
                Follow
              </button>
            </div>

            {/* Overview and Cast Sections */}
            <div className="space-y-6 mt-6">
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-3">Overview</h3>
                <p className="text-gray-300 leading-relaxed">
                  {currentMovie.description}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-left">Cast & Crew</h3>
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                  {currentMovie.cast.map((person, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500 bg-gray-700 flex-shrink-0 flex items-center justify-center">
                        {person.image ? (
                          <img 
                            src={person.image} 
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">{person.name}</p>
                        <p className="text-gray-400 text-xs">{person.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ratings, Reviews, etc. */}
          <div className="w-full lg:w-1/4 space-y-6">
            {/* Your existing right column content */}
            {/* Ratings Card */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-center">Ratings</h3>
              
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32">
                  {/* Circular Chart */}
                  <svg 
                    className="w-full h-full" 
                    viewBox="0 0 100 100"
                    onMouseLeave={() => setHoveredRating(null)}
                  >
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="10"
                    />
                    {/* Dynamic segments based on ratings */}
                    {(() => {
                      let currentOffset = 0;
                      return ratingsWithColors.map((item, index) => {
                        const segmentLength = (item.value / 100) * circumference;
                        const dashOffset = -circumference * (currentOffset / 100) + circumference/4;
                        currentOffset += item.value;
                        return (
                          <circle
                            key={item.label}
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={item.color}
                            strokeWidth="10"
                            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out', cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredRating(item)}
                          />
                        );
                      });
                    })()}

                    {/* Center text */}
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dy="0.3em"
                      fontSize="20"
                      fontWeight="bold"
                      fill="white"
                    >
                      {hoveredRating ? `${hoveredRating.value}%` : currentMovie.rating}
                    </text>
                    {/* Hovered category text */}
                    {hoveredRating && (
                      <text
                        x="50"
                        y="65"
                        textAnchor="middle"
                        dy="0.3em"
                        fontSize="10"
                        fill={hoveredRating.color}
                      >
                        {hoveredRating.label}
                      </text>
                    )}
                  </svg>
                </div>
                <div className="mt-2">
                  {ratingsWithColors.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 mt-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Star Ratings */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="font-semibold mb-3">Star Ratings</h4>
                <div className="space-y-3">
                  {[
                    { category: "Storytelling", rating: 4 },
                    { category: "Cinematography", rating: 5 },
                    { category: "Editing", rating: 3 },
                    { category: "Sound", rating: 4 },
                    { category: "Acting", rating: 5 }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{item.category}</span>
                      <div className="flex">
                        {renderStars(item.rating)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews and Related Videos sections */}
            {/* ... (keep your existing reviews and related videos code) ... */}
          </div>
        </div>
      </div>
    </div>
  );
}