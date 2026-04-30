'use client';
import { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '#/context/AuthContext';
import { 
  Film, Upload, X, Plus, Trash2, Youtube, Image, 
  Clock, Globe, Users, User, FileText, ImageIcon,
  AlertCircle, CheckCircle, Search, UserCheck
} from 'lucide-react';
import { db } from '#/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { uploadToCloudinary } from '#/lib/cloudinary';

interface CastMember {
  name: string;
  role: string;
  image: File | null;
  userId?: string;
  userAvatar?: string;
}

interface CrewMember {
  name: string;
  role: string;
  image: File | null;
  userId?: string;
  userAvatar?: string;
}

interface SearchUser {
  id: string;
  name: string;
  username?: string;
  photoURL?: string;
  avatar?: string;
}

export default function MovieUpload() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<{ type: 'cast' | 'crew'; index: number } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    youtubeUrl: '',
    description: '',
    genre: [] as string[],
    language: '',
    runtime: '',
    poster: null as File | null,
    posterPreview: null as string | null,
    hero: null as File | null,
    heroPreview: null as string | null,
    cast: [{ name: '', role: 'Actor', image: null, userId: '', userAvatar: '' }] as CastMember[],
    crew: [{ name: '', role: 'Director', image: null, userId: '', userAvatar: '' }] as CrewMember[]
  });

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
    'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 
    'Romance', 'Sci-Fi', 'Thriller', 'Western'
  ];

  const crewRoles = [
    'Director', 'Producer', 'Screenwriter', 'Cinematographer',
    'Editor', 'Production Designer', 'Costume Designer', 'Composer',
    'Sound Designer', 'VFX Supervisor', 'Casting Director'
  ];

  // Search users from Firestore
  const searchUsers = async (searchText: string) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const usersRef = collection(db, 'users');
      
      const nameQuery = query(
        usersRef,
        where('name', '>=', searchText),
        where('name', '<=', searchText + '\uf8ff'),
        orderBy('name'),
        limit(5)
      );
      
      const nameSnapshot = await getDocs(nameQuery);
      const users: SearchUser[] = [];
      
      nameSnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.name || data.displayName || '',
          username: data.username || '',
          photoURL: data.photoURL || data.avatar || ''
        });
      });

      if (users.length === 0) {
        const usernameQuery = query(
          usersRef,
          where('username', '>=', searchText),
          where('username', '<=', searchText + '\uf8ff'),
          limit(5)
        );
        const usernameSnapshot = await getDocs(usernameQuery);
        usernameSnapshot.forEach((doc) => {
          const data = doc.data();
          users.push({
            id: doc.id,
            name: data.name || data.displayName || '',
            username: data.username || '',
            photoURL: data.photoURL || data.avatar || ''
          });
        });
      }
      
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeSearchIndex) {
        searchUsers(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeSearchIndex]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setActiveSearchIndex(null);
        setSearchTerm('');
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle user selection from search
  const handleSelectUser = (selectedUser: SearchUser, type: 'cast' | 'crew', index: number) => {
    if (type === 'cast') {
      const updatedCast = [...formData.cast];
      updatedCast[index] = {
        ...updatedCast[index],
        name: selectedUser.name,
        userId: selectedUser.id,
        userAvatar: selectedUser.photoURL || selectedUser.avatar || ''
      };
      setFormData(prev => ({ ...prev, cast: updatedCast }));
    } else {
      const updatedCrew = [...formData.crew];
      updatedCrew[index] = {
        ...updatedCrew[index],
        name: selectedUser.name,
        userId: selectedUser.id,
        userAvatar: selectedUser.photoURL || selectedUser.avatar || ''
      };
      setFormData(prev => ({ ...prev, crew: updatedCrew }));
    }
    setActiveSearchIndex(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Show loading while auth is checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-gray-400 mb-4">Please login to upload movies</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Input handlers
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.includes(genre) 
        ? prev.genre.filter(g => g !== genre)
        : [...prev.genre, genre]
    }));
  };

  const handleCastChange = (index: number, field: keyof CastMember, value: string | File | null) => {
    const updatedCast = [...formData.cast];
    updatedCast[index] = { ...updatedCast[index], [field]: value };
    setFormData(prev => ({ ...prev, cast: updatedCast }));
  };

  const addCastMember = () => {
    setFormData(prev => ({
      ...prev,
      cast: [...prev.cast, { name: '', role: 'Actor', image: null, userId: '', userAvatar: '' }]
    }));
  };

  const removeCastMember = (index: number) => {
    if (formData.cast.length > 1) {
      const updatedCast = formData.cast.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, cast: updatedCast }));
    }
  };

  const handleCrewChange = (index: number, field: keyof CrewMember, value: string | File | null) => {
    const updatedCrew = [...formData.crew];
    updatedCrew[index] = { ...updatedCrew[index], [field]: value };
    setFormData(prev => ({ ...prev, crew: updatedCrew }));
  };

  const addCrewMember = () => {
    setFormData(prev => ({
      ...prev,
      crew: [...prev.crew, { name: '', role: 'Director', image: null, userId: '', userAvatar: '' }]
    }));
  };

  const removeCrewMember = (index: number) => {
    if (formData.crew.length > 1) {
      const updatedCrew = formData.crew.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, crew: updatedCrew }));
    }
  };

  const handlePosterUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setFormData(prev => ({ 
        ...prev, 
        poster: file,
        posterPreview: preview 
      }));
    }
  };

  const handleHeroUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setFormData(prev => ({ 
        ...prev, 
        hero: file,
        heroPreview: preview 
      }));
    }
  };

  const removePoster = () => {
    if (formData.posterPreview) {
      URL.revokeObjectURL(formData.posterPreview);
    }
    setFormData(prev => ({ ...prev, poster: null, posterPreview: null }));
  };

  const removeHero = () => {
    if (formData.heroPreview) {
      URL.revokeObjectURL(formData.heroPreview);
    }
    setFormData(prev => ({ ...prev, hero: null, heroPreview: null }));
  };

  const handleProfileImageUpload = (e: ChangeEvent<HTMLInputElement>, type: 'cast' | 'crew', index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'cast') {
        handleCastChange(index, 'image', file);
      } else {
        handleCrewChange(index, 'image', file);
      }
    }
  };

  // YouTube videoId extract function
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Cloudinary upload function for all images
  const uploadImageToCloudinary = async (file: File | null): Promise<string> => {
    if (!file) return '';
    
    try {
      const imageUrl = await uploadToCloudinary(file);
      return imageUrl;
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw new Error('Image upload failed');
    }
  };

  // Main submit function with Cloudinary
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.title.trim()) {
      setError('Movie title is required');
      setStep(1);
      return;
    }

    if (!formData.youtubeUrl.trim()) {
      setError('YouTube URL is required');
      setStep(1);
      return;
    }

    const videoId = extractYoutubeId(formData.youtubeUrl);
    if (!videoId) {
      setError('Please enter a valid YouTube URL');
      setStep(1);
      return;
    }

    if (!formData.poster) {
      setError('Poster image is required');
      setStep(2);
      return;
    }

    if (!formData.hero) {
      setError('Hero image is required');
      setStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting upload process...');

      // Upload poster image to Cloudinary
      console.log('Uploading poster...');
      const posterUrl = await uploadImageToCloudinary(formData.poster);
      console.log('Poster uploaded:', posterUrl);

      // Upload hero image to Cloudinary (different image)
      console.log('Uploading hero...');
      const heroUrl = await uploadImageToCloudinary(formData.hero);
      console.log('Hero uploaded:', heroUrl);

      // Upload cast images to Cloudinary
      const castWithUrls = await Promise.all(
        formData.cast.map(async (member) => {
          const imageUrl = member.image ? await uploadImageToCloudinary(member.image) : (member.userAvatar || '');
          return {
            name: member.name.trim(),
            role: member.role,
            imageUrl: imageUrl,
            userId: member.userId || ''
          };
        })
      );

      // Upload crew images to Cloudinary
      const crewWithUrls = await Promise.all(
        formData.crew.map(async (member) => {
          const imageUrl = member.image ? await uploadImageToCloudinary(member.image) : (member.userAvatar || '');
          return {
            name: member.name.trim(),
            role: member.role,
            imageUrl: imageUrl,
            userId: member.userId || ''
          };
        })
      );

      // Prepare movie data for Firestore
      const movieData = {
        title: formData.title.trim(),
        description: formData.description.trim() || 'No description provided',
        posterUrl: posterUrl,  // Separate poster URL
        heroUrl: heroUrl,      // Separate hero URL
        videoId: videoId,
        genre: formData.genre.length > 0 ? formData.genre : ['General'],
        language: formData.language.trim() || 'English',
        runtime: formData.runtime.trim() || '2h',
        cast: castWithUrls,
        crew: crewWithUrls,
        uploadedBy: user.id,
        uploadedByEmail: user.email || 'unknown@email.com',
        uploadedAt: new Date(),
        views: 0,
        likes: 0,
        featured: false
      };

      console.log('Saving to Firestore...', {
        title: movieData.title,
        posterUrl: movieData.posterUrl,
        heroUrl: movieData.heroUrl
      });

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'movies'), movieData);
      
      console.log('Movie saved with ID:', docRef.id);
      setSuccess('Movie uploaded successfully! Redirecting...');
      
      // Cleanup preview URLs
      if (formData.posterPreview) URL.revokeObjectURL(formData.posterPreview);
      if (formData.heroPreview) URL.revokeObjectURL(formData.heroPreview);
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">Upload Movie</h1>
          <span className="bg-green-600 text-xs px-2 py-1 rounded">Cloudinary + YouTube</span>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-200">{success}</span>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex justify-between mb-10 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 -translate-y-1/2 -z-10"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 -translate-y-1/2 -z-10 transition-all duration-300"
            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
          ></div>
          
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step >= num 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent' 
                  : 'bg-gray-800 border-gray-700'
              }`}>
                {step > num ? (
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                ) : (
                  <span className={`font-medium ${step >= num ? 'text-white' : 'text-gray-400'}`}>
                    {num}
                  </span>
                )}
              </div>
              <span className="mt-2 text-sm font-medium text-gray-300">
                {num === 1 ? 'Basic Info' : num === 2 ? 'Media' : 'Cast & Crew'}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Movie Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Enter movie title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL *</label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                {formData.youtubeUrl && extractYoutubeId(formData.youtubeUrl) && (
                  <div className="mt-3">
                    <p className="text-sm text-green-400 mb-2">YouTube Video ID: {extractYoutubeId(formData.youtubeUrl)}</p>
                    <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYoutubeId(formData.youtubeUrl)}`}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Overview *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Describe the movie plot, themes, and highlights"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Genre *</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        formData.genre.includes(genre)
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Language *</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="English, Spanish, etc."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Runtime *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="runtime"
                      value={formData.runtime}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="e.g., 2h 15m"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Media Upload - Separate Poster and Hero */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Poster Image - 2:3 Aspect Ratio */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded mr-2">2:3</span>
                    Poster Image *
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                    {formData.posterPreview ? (
                      <div className="space-y-3">
                        <div className="mx-auto w-32 h-48 bg-gray-800 rounded overflow-hidden">
                          <img 
                            src={formData.posterPreview} 
                            alt="Poster preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm text-gray-300 truncate">{formData.poster?.name}</p>
                        <button
                          type="button"
                          onClick={removePoster}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePosterUpload}
                        />
                        <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-300">Click to upload poster</p>
                        <p className="text-xs text-gray-500 mt-1">Recommended: 2:3 aspect ratio</p>
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">This will appear as the movie thumbnail on home page</p>
                </div>

                {/* Hero Image - 16:9 Aspect Ratio */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="bg-pink-600 text-white text-xs px-2 py-1 rounded mr-2">16:9</span>
                    Hero Image *
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                    {formData.heroPreview ? (
                      <div className="space-y-3">
                        <div className="mx-auto w-full h-32 bg-gray-800 rounded overflow-hidden">
                          <img 
                            src={formData.heroPreview} 
                            alt="Hero preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm text-gray-300 truncate">{formData.hero?.name}</p>
                        <button
                          type="button"
                          onClick={removeHero}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleHeroUpload}
                        />
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-300">Click to upload hero image</p>
                        <p className="text-xs text-gray-500 mt-1">Recommended: 16:9 aspect ratio</p>
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">This will appear in the hero carousel banner</p>
                </div>
              </div>
              
              {/* Preview info */}
              <div className="bg-gray-800/50 rounded-lg p-4 text-center text-sm text-gray-400">
                <p>📌 Poster image will be used for movie thumbnails (2:3 ratio)</p>
                <p>🎬 Hero image will be used for the hero carousel banner (16:9 ratio)</p>
              </div>
            </div>
          )}

          {/* Step 3: Cast & Crew */}
          {step === 3 && (
            <div className="space-y-8">
              {/* Cast Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Cast</h3>
                  <button
                    type="button"
                    onClick={addCastMember}
                    className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                  >
                    <Plus className="w-4 h-4" /> Add Cast Member
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.cast.map((member, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Cast Member #{index + 1}</h4>
                        {formData.cast.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCastMember(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative" ref={activeSearchIndex?.type === 'cast' && activeSearchIndex?.index === index ? searchRef : null}>
                          <label className="block text-sm font-medium mb-2">Name *</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => {
                                handleCastChange(index, 'name', e.target.value);
                                setActiveSearchIndex({ type: 'cast', index });
                                setSearchTerm(e.target.value);
                              }}
                              onFocus={() => {
                                setActiveSearchIndex({ type: 'cast', index });
                                setSearchTerm(member.name);
                              }}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-purple-600"
                              placeholder="Search user or type name"
                              required
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                          
                          {activeSearchIndex?.type === 'cast' && activeSearchIndex?.index === index && searchResults.length > 0 && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {searchResults.map((result) => (
                                <button
                                  key={result.id}
                                  type="button"
                                  onClick={() => handleSelectUser(result, 'cast', index)}
                                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                                    {result.photoURL ? (
                                      <img src={result.photoURL} alt={result.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-white">{result.name}</p>
                                    {result.username && (
                                      <p className="text-xs text-gray-400">@{result.username}</p>
                                    )}
                                  </div>
                                  <UserCheck className="w-4 h-4 text-purple-400" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Role</label>
                          <select
                            value={member.role}
                            onChange={(e) => handleCastChange(index, 'role', e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          >
                            <option value="Actor">Actor</option>
                            <option value="Actress">Actress</option>
                            <option value="Voice Actor">Voice Actor</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Profile Image</label>
                          <div className="border border-dashed border-gray-600 rounded-lg p-3">
                            {member.image ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600">
                                  <img 
                                    src={URL.createObjectURL(member.image)} 
                                    alt="Profile preview" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCastChange(index, 'image', null)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : member.userAvatar ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600">
                                  <img 
                                    src={member.userAvatar} 
                                    alt="Profile preview" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-xs text-gray-400">From profile</p>
                              </div>
                            ) : (
                              <label className="cursor-pointer flex items-center gap-2">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => handleProfileImageUpload(e, 'cast', index)}
                                />
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-300">Upload custom image</span>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {member.userId && (
                        <p className="text-xs text-purple-400 mt-2">✓ Linked to user profile</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Crew Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Crew</h3>
                  <button
                    type="button"
                    onClick={addCrewMember}
                    className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                  >
                    <Plus className="w-4 h-4" /> Add Crew Member
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.crew.map((member, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Crew Member #{index + 1}</h4>
                        {formData.crew.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCrewMember(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative" ref={activeSearchIndex?.type === 'crew' && activeSearchIndex?.index === index ? searchRef : null}>
                          <label className="block text-sm font-medium mb-2">Name *</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => {
                                handleCrewChange(index, 'name', e.target.value);
                                setActiveSearchIndex({ type: 'crew', index });
                                setSearchTerm(e.target.value);
                              }}
                              onFocus={() => {
                                setActiveSearchIndex({ type: 'crew', index });
                                setSearchTerm(member.name);
                              }}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-purple-600"
                              placeholder="Search user or type name"
                              required
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                          
                          {activeSearchIndex?.type === 'crew' && activeSearchIndex?.index === index && searchResults.length > 0 && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {searchResults.map((result) => (
                                <button
                                  key={result.id}
                                  type="button"
                                  onClick={() => handleSelectUser(result, 'crew', index)}
                                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                                    {result.photoURL ? (
                                      <img src={result.photoURL} alt={result.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-white">{result.name}</p>
                                    {result.username && (
                                      <p className="text-xs text-gray-400">@{result.username}</p>
                                    )}
                                  </div>
                                  <UserCheck className="w-4 h-4 text-purple-400" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Role</label>
                          <select
                            value={member.role}
                            onChange={(e) => handleCrewChange(index, 'role', e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          >
                            {crewRoles.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Profile Image</label>
                          <div className="border border-dashed border-gray-600 rounded-lg p-3">
                            {member.image ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600">
                                  <img 
                                    src={URL.createObjectURL(member.image)} 
                                    alt="Profile preview" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCrewChange(index, 'image', null)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : member.userAvatar ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600">
                                  <img 
                                    src={member.userAvatar} 
                                    alt="Profile preview" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-xs text-gray-400">From profile</p>
                              </div>
                            ) : (
                              <label className="cursor-pointer flex items-center gap-2">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => handleProfileImageUpload(e, 'crew', index)}
                                />
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-300">Upload custom image</span>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {member.userId && (
                        <p className="text-xs text-purple-400 mt-2">✓ Linked to user profile</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Movie
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}