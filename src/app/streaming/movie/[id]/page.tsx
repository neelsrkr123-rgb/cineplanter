// src/app/streaming/movie/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, increment, collection, query, where, orderBy, limit, getDocs, setDoc, deleteDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '#/lib/firebase'
import { useAuth } from '#/context/AuthContext'
import Navbar from '#/components/Navbar'
import { getOptimizedAvatarUrl, getFallbackAvatar } from '#/lib/cloudinary'
import { 
  Calendar, Clock, Globe, Users, Star, ArrowLeft, Play, Film, Loader2,
  ThumbsUp, ThumbsDown, Share2, Bookmark, Eye, MessageCircle, 
  ChevronRight, User, Heart, List, Info, Award, TrendingUp, 
  Volume2, VolumeX, Maximize, Minimize, Pause, Clapperboard, CheckCircle, Copy, Twitter, Facebook, Link2, Instagram, Send, Verified, UserPlus, UserCheck
} from 'lucide-react'

interface Movie {
  id: string
  title: string
  description: string
  backdropUrl: string
  posterUrl: string
  youtubeId: string
  youtubeUrl: string
  genre: string[]
  language: string
  runtime: string
  crew: { name: string; role: string; imageUrl?: string; userId?: string }[]
  views: number
  rating?: number
  cast?: { name: string; role: string; imageUrl?: string; userId?: string }[]
  releaseDate?: string
  likes?: number
  uploadedBy?: string
  uploadedByEmail?: string
  reviewCount?: number
  totalRating?: number
}

interface Review {
  id: string
  movieId: string
  userId: string
  userName: string
  userAvatar: string | null
  rating: number
  review: string
  likes: number
  createdAt: any
  avgTechnicalRating?: number
  technicalRatings?: { category: string; value: number; label: string }[]
}

// YouTube ID EXTRACTOR
const extractYouTubeId = (url: string | any): string | null => {
  if (!url) return null
  
  const targetUrl = typeof url === 'string' ? url : url?.url
  if (!targetUrl) return null

  if (targetUrl.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(targetUrl)) {
    return targetUrl
  }
  
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/
  ]

  for (let pattern of patterns) {
    const match = targetUrl.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

const getImageUrl = (imgData: any): string => {
  if (!imgData) return ''
  if (typeof imgData === 'string') return imgData
  return imgData?.url || ''
}

// Official user IDs for verified badge
const OFFICIAL_USER_IDS = ["ripqyqxEwZPq0IFDkHP0QxtwVT12"]

export default function StreamingPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [isWatchlist, setIsWatchlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hoveredRating, setHoveredRating] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [likeCount, setLikeCount] = useState(0)
  const [uploaderAvatar, setUploaderAvatar] = useState<string>('')
  const [uploaderName, setUploaderName] = useState<string>('')
  const [uploaderId, setUploaderId] = useState<string | null>(null)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  const [followingLoading, setFollowingLoading] = useState(false)
  const [currentUserData, setCurrentUserData] = useState<any>(null)
  
  const [ratingPercentages, setRatingPercentages] = useState({
    outstanding: 0,
    good: 0,
    decent: 0,
    needs: 0
  })
  
  const [averageTechnicalRatings, setAverageTechnicalRatings] = useState([
    { category: "Storytelling", rating: 0, stars: 0 },
    { category: "Cinematography", rating: 0, stars: 0 },
    { category: "Editing", rating: 0, stars: 0 },
    { category: "Sound Design", rating: 0, stars: 0 },
    { category: "Acting", rating: 0, stars: 0 }
  ])

  // Helper function to get user ID
  const getUserId = (): string | null => {
    if (!user) return null
    return user.uid || user.id || user.userId || null
  }

  // Check if uploader is official
  const isUploaderOfficial = OFFICIAL_USER_IDS.includes(uploaderId || '')
  
  // Check if current user is the uploader
  const isCurrentUserUploader = getUserId() === uploaderId

  // Load current user's following list
  useEffect(() => {
    const loadCurrentUser = async () => {
      const currentUserId = getUserId()
      if (!currentUserId) return
      
      const userRef = doc(db, 'users', currentUserId)
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setCurrentUserData(docSnap.data())
        }
      })
      return () => unsubscribe()
    }
    loadCurrentUser()
  }, [user])

  // Real-time listener for uploader profile updates (avatar, name)
  useEffect(() => {
    if (!uploaderId) return
    
    const userRef = doc(db, 'users', uploaderId)
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        const newAvatar = data.avatar || data.photoURL
        const newName = data.name || data.displayName || movie?.uploadedByEmail?.split('@')[0] || 'Studio'
        
        if (newAvatar !== uploaderAvatar) {
          setUploaderAvatar(newAvatar)
          setAvatarKey(Date.now())
        }
        setUploaderName(newName)
      }
    })
    
    return () => unsubscribe()
  }, [uploaderId])

  // 🔥 CRITICAL FIX: Real-time listener for follow status
  // This checks BOTH the follows collection AND the user's following array
  useEffect(() => {
    const currentUserId = getUserId()
    if (!currentUserId || !uploaderId || currentUserId === uploaderId) {
      setIsFollowing(false)
      return
    }
    
    // Method 1: Check follows collection
    const followRef = doc(db, 'follows', `${currentUserId}_${uploaderId}`)
    const unsubscribeFollow = onSnapshot(followRef, (docSnap) => {
      setIsFollowing(docSnap.exists())
    })
    
    // Method 2: Also listen to user's following array for backup
    const userRef = doc(db, 'users', currentUserId)
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data()
        const followingArray = userData.following || []
        const isInFollowingArray = followingArray.includes(uploaderId)
        
        // If there's a mismatch, sync them
        if (isInFollowingArray !== isFollowing) {
          setIsFollowing(isInFollowingArray)
        }
      }
    })
    
    return () => {
      unsubscribeFollow()
      unsubscribeUser()
    }
  }, [uploaderId, user])

  // Check user interactions (liked, disliked, watchlist, watched)
  useEffect(() => {
    const checkUserInteraction = async () => {
      const userId = getUserId()
      if (!userId || !movie) return
      
      try {
        const userMovieRef = doc(db, 'userMovies', `${userId}_${movie.id}`)
        const userMovieSnap = await getDoc(userMovieRef)
        if (userMovieSnap.exists()) {
          const data = userMovieSnap.data()
          setIsLiked(data.liked || false)
          setIsDisliked(data.disliked || false)
          setIsWatchlist(data.watchlist || false)
          setIsWatched(data.watched || false)
        }
      } catch (err) {
        console.error('Error checking user interaction:', err)
      }
    }
    
    checkUserInteraction()
  }, [user, movie])

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) {
        setError('No movie ID provided')
        setLoading(false)
        return
      }

      try {
        const docRef = doc(db, 'movies', id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          
          const finalYoutubeId = data.videoId || data.youtubeId || ""
          const finalYoutubeUrl = data.youtubeUrl || ""

          const movieData: Movie = {
            id: docSnap.id,
            title: data.title || 'Untitled',
            description: data.description || 'No description available',
            backdropUrl: getImageUrl(data.backdropUrl || data.posterUrl),
            posterUrl: getImageUrl(data.posterUrl),
            youtubeId: finalYoutubeId,
            youtubeUrl: finalYoutubeUrl,
            genre: data.genre || [],
            language: data.language || 'Unknown',
            runtime: data.runtime || 'Unknown',
            crew: data.crew || [],
            views: data.views || 0,
            rating: data.rating,
            cast: data.cast || [],
            releaseDate: data.releaseDate,
            likes: data.likes || 0,
            uploadedBy: data.uploadedBy,
            uploadedByEmail: data.uploadedByEmail,
            reviewCount: data.reviewCount || 0,
            totalRating: data.totalRating || 0
          }

          setMovie(movieData)
          setLikeCount(data.likes || 0)
          setUploaderId(data.uploadedBy || null)
          
          if (data.uploadedBy) {
            const userRef = doc(db, 'users', data.uploadedBy)
            const userSnap = await getDoc(userRef)
            if (userSnap.exists()) {
              const userData = userSnap.data()
              setUploaderAvatar(userData.avatar || userData.photoURL || '')
              setUploaderName(userData.name || userData.displayName || data.uploadedByEmail?.split('@')[0] || 'Studio')
            } else {
              setUploaderAvatar('')
              setUploaderName(data.uploadedByEmail?.split('@')[0] || 'Studio')
            }
          } else {
            setUploaderName(movieData.uploadedByEmail?.split('@')[0] || 'Studio')
          }

          let extractedId = extractYouTubeId(finalYoutubeId) || extractYouTubeId(finalYoutubeUrl)
          
          if (extractedId) {
            setEmbedUrl(`https://www.youtube.com/embed/${extractedId}`)
          }

          await updateDoc(docRef, { views: increment(1) }).catch(e => console.log("View update failed", e))
        } else {
          setError('Movie not found')
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load movie')
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [id])

  // Fetch reviews and calculate statistics
  const fetchReviewsAndCalculateStats = async () => {
    if (!id) return

    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('movieId', '==', id),
        orderBy('createdAt', 'desc')
      )
      const reviewsSnapshot = await getDocs(reviewsQuery)
      const reviewsList: Review[] = []
      reviewsSnapshot.forEach((doc) => {
        reviewsList.push({ id: doc.id, ...doc.data() } as Review)
      })
      setReviews(reviewsList.slice(0, 3))
      
      const totalReviews = reviewsList.length
      if (totalReviews > 0) {
        let outstanding = 0, good = 0, decent = 0, needs = 0
        
        reviewsList.forEach(review => {
          if (review.rating >= 4.5) outstanding++
          else if (review.rating >= 3.5) good++
          else if (review.rating >= 2.5) decent++
          else needs++
        })
        
        setRatingPercentages({
          outstanding: Math.round((outstanding / totalReviews) * 100),
          good: Math.round((good / totalReviews) * 100),
          decent: Math.round((decent / totalReviews) * 100),
          needs: Math.round((needs / totalReviews) * 100)
        })
        
        const techSums = {
          Storytelling: 0,
          Cinematography: 0,
          Editing: 0,
          "Sound Design": 0,
          Acting: 0
        }
        let techCount = 0
        
        reviewsList.forEach(review => {
          if (review.technicalRatings && review.technicalRatings.length > 0) {
            techCount++
            review.technicalRatings.forEach(tech => {
              if (techSums[tech.category as keyof typeof techSums] !== undefined) {
                techSums[tech.category as keyof typeof techSums] += tech.value
              }
            })
          }
        })
        
        if (techCount > 0) {
          setAverageTechnicalRatings([
            { category: "Storytelling", rating: Number((techSums.Storytelling / techCount).toFixed(1)), stars: Math.round(techSums.Storytelling / techCount) },
            { category: "Cinematography", rating: Number((techSums.Cinematography / techCount).toFixed(1)), stars: Math.round(techSums.Cinematography / techCount) },
            { category: "Editing", rating: Number((techSums.Editing / techCount).toFixed(1)), stars: Math.round(techSums.Editing / techCount) },
            { category: "Sound Design", rating: Number((techSums["Sound Design"] / techCount).toFixed(1)), stars: Math.round(techSums["Sound Design"] / techCount) },
            { category: "Acting", rating: Number((techSums.Acting / techCount).toFixed(1)), stars: Math.round(techSums.Acting / techCount) }
          ])
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    }
  }

  useEffect(() => {
    fetchReviewsAndCalculateStats()
  }, [id])

  // Handle Like
  const handleLike = async () => {
    const userId = getUserId()
    if (!userId) {
      router.push('/auth')
      return
    }
    
    try {
      const movieRef = doc(db, 'movies', id as string)
      const userMovieRef = doc(db, 'userMovies', `${userId}_${id}`)
      const userMovieSnap = await getDoc(userMovieRef)
      const existingData = userMovieSnap.exists() ? userMovieSnap.data() : {}
      
      if (isLiked) {
        await updateDoc(movieRef, { likes: increment(-1) })
        await setDoc(userMovieRef, { 
          liked: false, disliked: false,
          watchlist: existingData.watchlist || false,
          watched: existingData.watched || false,
          userId: userId, movieId: id 
        })
        setLikeCount(prev => prev - 1)
        setIsLiked(false)
      } else {
        if (isDisliked) {
          await updateDoc(movieRef, { likes: increment(1) })
          await setDoc(userMovieRef, { 
            liked: true, disliked: false,
            watchlist: existingData.watchlist || false,
            watched: existingData.watched || false,
            userId: userId, movieId: id 
          })
          setLikeCount(prev => prev + 1)
          setIsLiked(true)
          setIsDisliked(false)
        } else {
          await updateDoc(movieRef, { likes: increment(1) })
          await setDoc(userMovieRef, { 
            liked: true, disliked: false,
            watchlist: existingData.watchlist || false,
            watched: existingData.watched || false,
            userId: userId, movieId: id 
          })
          setLikeCount(prev => prev + 1)
          setIsLiked(true)
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  // Handle Dislike
  const handleDislike = async () => {
    const userId = getUserId()
    if (!userId) {
      router.push('/auth')
      return
    }
    
    try {
      const movieRef = doc(db, 'movies', id as string)
      const userMovieRef = doc(db, 'userMovies', `${userId}_${id}`)
      const userMovieSnap = await getDoc(userMovieRef)
      const existingData = userMovieSnap.exists() ? userMovieSnap.data() : {}
      
      if (isDisliked) {
        await setDoc(userMovieRef, { 
          liked: false, disliked: false,
          watchlist: existingData.watchlist || false,
          watched: existingData.watched || false,
          userId: userId, movieId: id 
        })
        setIsDisliked(false)
      } else {
        if (isLiked) {
          await updateDoc(movieRef, { likes: increment(-1) })
          await setDoc(userMovieRef, { 
            liked: false, disliked: true,
            watchlist: existingData.watchlist || false,
            watched: existingData.watched || false,
            userId: userId, movieId: id 
          })
          setLikeCount(prev => prev - 1)
          setIsLiked(false)
          setIsDisliked(true)
        } else {
          await setDoc(userMovieRef, { 
            liked: false, disliked: true,
            watchlist: existingData.watchlist || false,
            watched: existingData.watched || false,
            userId: userId, movieId: id 
          })
          setIsDisliked(true)
        }
      }
    } catch (err) {
      console.error('Error toggling dislike:', err)
    }
  }

  // Handle Watchlist
  const handleWatchlist = async () => {
    const userId = getUserId()
    if (!userId) {
      router.push('/auth')
      return
    }
    
    try {
      const userMovieRef = doc(db, 'userMovies', `${userId}_${id}`)
      const userMovieSnap = await getDoc(userMovieRef)
      const existingData = userMovieSnap.exists() ? userMovieSnap.data() : {}
      
      if (isWatchlist) {
        await setDoc(userMovieRef, { 
          liked: existingData.liked || false,
          disliked: existingData.disliked || false,
          watchlist: false,
          watched: existingData.watched || false,
          userId: userId, movieId: id 
        })
        setIsWatchlist(false)
      } else {
        await setDoc(userMovieRef, { 
          liked: existingData.liked || false,
          disliked: existingData.disliked || false,
          watchlist: true,
          watched: existingData.watched || false,
          userId: userId, movieId: id 
        })
        setIsWatchlist(true)
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err)
    }
  }

  // Handle Watched
  const handleWatched = async () => {
    const userId = getUserId()
    if (!userId) {
      router.push('/auth')
      return
    }
    
    try {
      const userMovieRef = doc(db, 'userMovies', `${userId}_${id}`)
      const userMovieSnap = await getDoc(userMovieRef)
      const existingData = userMovieSnap.exists() ? userMovieSnap.data() : {}
      
      if (isWatched) {
        await setDoc(userMovieRef, { 
          liked: existingData.liked || false,
          disliked: existingData.disliked || false,
          watchlist: existingData.watchlist || false,
          watched: false,
          userId: userId, movieId: id 
        })
        setIsWatched(false)
      } else {
        await setDoc(userMovieRef, { 
          liked: existingData.liked || false,
          disliked: existingData.disliked || false,
          watchlist: existingData.watchlist || false,
          watched: true,
          userId: userId, movieId: id 
        })
        setIsWatched(true)
      }
    } catch (err) {
      console.error('Error toggling watched:', err)
    }
  }

  // 🔥 FIXED: Handle Follow/Unfollow - properly syncs with both follows collection AND users array
  const handleFollow = async () => {
    const currentUserId = getUserId()
    if (!currentUserId) {
      router.push('/auth')
      return
    }
    
    if (!uploaderId || currentUserId === uploaderId) return
    
    setFollowingLoading(true)
    try {
      const followRef = doc(db, 'follows', `${currentUserId}_${uploaderId}`)
      const currentUserRef = doc(db, 'users', currentUserId)
      const targetUserRef = doc(db, 'users', uploaderId)
      
      if (isFollowing) {
        // UNFOLLOW: Delete from follows collection and remove from arrays
        await deleteDoc(followRef)
        
        await updateDoc(currentUserRef, {
          following: arrayRemove(uploaderId)
        })
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserId)
        })
        
        setIsFollowing(false)
        console.log(`Unfollowed ${uploaderName}`)
      } else {
        // FOLLOW: Add to follows collection and update arrays
        await setDoc(followRef, { 
          followerId: currentUserId, 
          followingId: uploaderId, 
          createdAt: new Date(),
          followerName: user?.displayName || user?.email?.split('@')[0] || 'User',
          followingName: uploaderName
        })
        
        await updateDoc(currentUserRef, {
          following: arrayUnion(uploaderId)
        })
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserId)
        })
        
        setIsFollowing(true)
        console.log(`Followed ${uploaderName}`)
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
      alert('Failed to update follow status')
    } finally {
      setFollowingLoading(false)
    }
  }

  // Share handlers
  const handleShare = () => {
    setShowShareModal(true)
  }

  const copyToClipboard = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnTwitter = () => {
    const text = `Check out "${movie?.title}" on CinePlanter!`
    const url = window.location.href
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareOnFacebook = () => {
    const url = window.location.href
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  const shareOnInstagram = () => {
    copyToClipboard()
    alert('Link copied! You can now paste it on Instagram.')
  }

  const shareToCommunity = () => {
    router.push(`/community/create?share=movie&id=${id}&title=${encodeURIComponent(movie?.title || '')}`)
    setShowShareModal(false)
  }

  const shareToMessages = () => {
    router.push(`/community/messages?share=movie&id=${id}&title=${encodeURIComponent(movie?.title || '')}`)
    setShowShareModal(false)
  }

  // Navigation handlers
  const handleLanguageClick = (language: string) => {
    router.push(`/movies?language=${encodeURIComponent(language)}`)
  }

  const handleGenreClick = (genre: string) => {
    router.push(`/movies?genre=${encodeURIComponent(genre)}`)
  }

  const handleProfileClick = () => {
    if (uploaderId) {
      router.push(`/profile/${uploaderId}`)
    }
  }

  const handlePersonClick = (userId: string | undefined, name: string) => {
    if (userId) {
      router.push(`/profile/${userId}`)
    }
  }

  const handleReviewClick = () => {
    router.push(`/streaming/movie/${id}/review`)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`
    return `${Math.floor(diffDays / 30)}m`
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return { label: 'Outstanding', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
    if (rating >= 3.5) return { label: 'Good Effort', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
    if (rating >= 2.5) return { label: 'Decent Attempt', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
    return { label: 'Needs Work', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  }

  const overallAverageRating = movie?.rating || (movie?.totalRating && movie?.reviewCount ? movie.totalRating / movie.reviewCount : 0)

  const ratingSegments = [
    { id: "outstanding", percent: ratingPercentages.outstanding, color: "#3B82F6", label: "Outstanding" },
    { id: "good", percent: ratingPercentages.good, color: "#10B981", label: "Good Effort" },
    { id: "decent", percent: ratingPercentages.decent, color: "#F59E0B", label: "Decent Attempt" },
    { id: "needs", percent: ratingPercentages.needs, color: "#EF4444", label: "Needs Work" }
  ]

  const radius = 45
  const circumference = 2 * Math.PI * radius

  const getUploaderAvatarUrl = () => {
    return getOptimizedAvatarUrl(uploaderAvatar, uploaderName, avatarKey)
  }

  if (authLoading || loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
        <p className="text-gray-400">Loading masterpiece...</p>
      </div>
    </div>
  )

  if (error || !movie) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-center px-4">
      <div className="max-w-md">
        <Film className="w-20 h-20 text-gray-600 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-3">Video Unavailable</h1>
        <p className="text-gray-400 mb-6">{error || 'Movie data could not be loaded'}</p>
        <button 
          onClick={() => router.push('/')} 
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-medium hover:opacity-90 transition"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  )

  const director = movie.crew?.find(c => c.role === "Director" || c.role === "director")
  const writer = movie.crew?.find(c => c.role === "Writer" || c.role === "writer")

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Share "{movie.title}"</h3>
            <div className="space-y-3">
              <button onClick={copyToClipboard} className="w-full flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
                {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Link2 className="w-5 h-5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button onClick={shareToCommunity} className="w-full flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
                <Users className="w-5 h-5 text-purple-400" />
                <span>Share to Community</span>
              </button>
              <button onClick={shareToMessages} className="w-full flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
                <Send className="w-5 h-5 text-blue-400" />
                <span>Share to Messages</span>
              </button>
              <button onClick={shareOnTwitter} className="w-full flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
                <Twitter className="w-5 h-5 text-blue-400" />
                <span>Share on Twitter</span>
              </button>
              <button onClick={shareOnFacebook} className="w-full flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
                <Facebook className="w-5 h-5 text-blue-600" />
                <span>Share on Facebook</span>
              </button>
              <button onClick={shareOnInstagram} className="w-full flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
                <Instagram className="w-5 h-5 text-pink-500" />
                <span>Share on Instagram</span>
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="mt-4 w-full p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto w-full px-4 md:px-6 py-6">
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft size={18} /> <span>Back</span>
        </button>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Video & Details (78%) */}
          <div className="w-full lg:w-[78%] space-y-5">
            {/* Video Player */}
            <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
              {embedUrl ? (
                <div className="relative w-full aspect-video">
                  <iframe
                    src={`${embedUrl}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0&enablejsapi=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={movie.title}
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
                  <Play className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="text-gray-400">Video player unavailable</p>
                </div>
              )}
            </div>

            {/* Text Area Below Video */}
            <div className="space-y-5">
              {/* Row 1: Title and Action Buttons */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold">{movie.title}</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleLike}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${isLiked ? 'bg-purple-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <ThumbsUp size={18} />
                    <span>{likeCount.toLocaleString()}</span>
                  </button>
                  <button 
                    onClick={handleDislike}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${isDisliked ? 'bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <ThumbsDown size={18} />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-full px-4 py-2 text-sm transition"
                  >
                    <Share2 size={18} />
                    <span>Share</span>
                  </button>
                  <button 
                    onClick={handleReviewClick}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-full px-4 py-2 text-sm transition"
                  >
                    <MessageCircle size={18} />
                    <span>Review</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Runtime, Language, Genre and Watched/Watchlist */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-base text-gray-400">
                  <div className="flex items-center gap-1"><Clock size={16} /><span>{movie.runtime}</span></div>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <button 
                    onClick={() => handleLanguageClick(movie.language)}
                    className="flex items-center gap-1 hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    <Globe size={16} />
                    <span>{movie.language}</span>
                  </button>
                  {movie.genre?.map((g, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                      <button 
                        onClick={() => handleGenreClick(g)}
                        className="hover:text-purple-400 transition-colors cursor-pointer"
                      >
                        {g}
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleWatched}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${isWatched ? 'bg-purple-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <Eye size={18} />
                    <span>Watched</span>
                  </button>
                  <button 
                    onClick={handleWatchlist}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${isWatchlist ? 'bg-purple-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <Bookmark size={18} className={isWatchlist ? 'fill-white' : ''} />
                    <span>Watchlist</span>
                  </button>
                </div>
              </div>

              {/* Row 3: Uploader Info with Follow Button - LARGER */}
              <div className="flex items-center gap-4">
                {/* Larger Avatar - w-14 h-14 */}
                <div 
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:scale-105 transition-transform overflow-hidden flex-shrink-0"
                  onClick={handleProfileClick}
                >
                  <img 
                    key={avatarKey}
                    src={getUploaderAvatarUrl()} 
                    alt={uploaderName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackAvatar(uploaderName)
                    }}
                  />
                </div>
                
                {/* Username and Follow Button - Larger text */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <p 
                      className="font-semibold text-lg cursor-pointer hover:text-purple-400 transition-colors text-white"
                      onClick={handleProfileClick}
                    >
                      {uploaderName}
                    </p>
                    {isUploaderOfficial && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                        <Verified size={12} className="text-white" />
                      </span>
                    )}
                  </div>
                  
                  {/* Follow/Unfollow Button - Larger */}
                  {getUserId() && uploaderId && !isCurrentUserUploader && (
                    <button 
                      onClick={handleFollow}
                      disabled={followingLoading}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                        isFollowing 
                          ? 'bg-gray-700 text-gray-200 hover:bg-red-600/80 hover:text-white' 
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      } disabled:opacity-50`}
                    >
                      {followingLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserCheck size={14} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* Show if viewing own movie */}
                  {getUserId() && uploaderId && isCurrentUserUploader && (
                    <span className="text-sm text-gray-500">(You)</span>
                  )}
                </div>
              </div>

              {/* Row 4: Overview */}
              <div>
                <h2 className="text-2xl font-semibold mb-3">Overview</h2>
                <p className="text-gray-300 leading-relaxed text-base">
                  {movie.description}
                </p>
                {writer && (
                  <p className="text-base text-gray-300 mt-2">
                    Written by <span className="font-semibold text-purple-400">{writer.name}</span>
                  </p>
                )}
              </div>

              {/* Row 5: Cast & Crew Section - NO WHITE BORDER */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-6 text-left">Cast & Crew</h2>
                
                {/* Cast Section */}
                {movie.cast && movie.cast.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">CAST</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-y-8 gap-x-4">
                      {movie.cast.slice(0, 6).map((actor, i) => (
                        <div 
                          key={i} 
                          onClick={() => handlePersonClick(actor.userId, actor.name)}
                          className={`flex flex-col items-center group transition-all duration-300 hover:scale-105 ${actor.userId ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold shadow-lg mb-3 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all overflow-hidden ${actor.userId ? 'group-hover:ring-2 group-hover:ring-purple-500' : ''}`}>
                            {actor.imageUrl ? (
                              <img src={actor.imageUrl} alt={actor.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{actor.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="text-center">
                            <p className={`text-base font-medium text-white line-clamp-1 ${actor.userId ? 'group-hover:text-purple-400' : ''}`}>
                              {actor.name}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">{actor.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Crew Section */}
                {movie.crew && movie.crew.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-4 text-left">CREW</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-y-8 gap-x-4">
                      {movie.crew.slice(0, 6).map((member, i) => (
                        <div 
                          key={i} 
                          onClick={() => handlePersonClick(member.userId, member.name)}
                          className={`flex flex-col items-center group transition-all duration-300 hover:scale-105 ${member.userId ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-2xl font-bold shadow-lg mb-3 group-hover:shadow-xl group-hover:shadow-purple-500/20 transition-all overflow-hidden border border-white/5 ${member.userId ? 'group-hover:ring-2 group-hover:ring-purple-500' : ''}`}>
                            {member.imageUrl ? (
                              <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{member.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="text-center">
                            <p className={`text-base font-medium text-white line-clamp-1 ${member.userId ? 'group-hover:text-purple-400' : ''}`}>
                              {member.name}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Ratings & Reviews Panel */}
          <div className="w-full lg:w-[22%] space-y-5">
            {/* Rating Card */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Audience Ratings
              </h3>
              
              <div className="flex justify-center mb-5">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
                    {(() => {
                      let currentCumulativePercent = 0;
                      return ratingSegments.map((segment) => {
                        const strokeLength = (segment.percent / 100) * circumference;
                        const offset = (currentCumulativePercent / 100) * circumference;
                        currentCumulativePercent += segment.percent;
                        return (
                          <circle
                            key={segment.id}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="8"
                            strokeDasharray={`${strokeLength} ${circumference}`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 50 50)"
                            className="transition-all duration-500 ease-out cursor-pointer"
                            style={{ 
                              opacity: hoveredRating === segment.id || !hoveredRating ? 1 : 0.3,
                              strokeWidth: hoveredRating === segment.id ? 10 : 8 
                            }}
                            onMouseEnter={() => setHoveredRating(segment.id)}
                            onMouseLeave={() => setHoveredRating(null)}
                          />
                        );
                      });
                    })()}
                    <text x="50" y="48" textAnchor="middle" dy="0.3em" className="fill-white text-[16px] font-bold">
                      {hoveredRating 
                        ? `${ratingSegments.find(s => s.id === hoveredRating)?.percent}%`
                        : overallAverageRating.toFixed(1)}
                    </text>
                    <text x="50" y="62" textAnchor="middle" className="fill-gray-400 text-[6px] uppercase tracking-widest font-medium">
                      {hoveredRating 
                        ? ratingSegments.find(s => s.id === hoveredRating)?.label
                        : 'Overall'}
                    </text>
                  </svg>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {ratingSegments.map((segment) => (
                  <div 
                    key={segment.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-800 p-1 rounded transition"
                    onMouseEnter={() => setHoveredRating(segment.id)}
                    onMouseLeave={() => setHoveredRating(null)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segment.color }}></div>
                      <span>{segment.label}</span>
                    </div>
                    <span className="font-semibold">{segment.percent}%</span>
                  </div>
                ))}
              </div>

              {/* Technical Ratings */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <h4 className="text-xs font-semibold text-gray-400 mb-3">Technical Ratings</h4>
                <div className="space-y-3">
                  {averageTechnicalRatings.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} size={12} className={i < item.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 font-medium min-w-[35px] text-right">
                          {item.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews Card */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageCircle size={18} /> Reviews
                  {movie.reviewCount && movie.reviewCount > 0 && (
                    <span className="text-xs text-gray-400">({movie.reviewCount})</span>
                  )}
                </h3>
                <button 
                  onClick={handleReviewClick}
                  className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
                >
                  Write <ChevronRight size={14} />
                </button>
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.map((review) => {
                    const ratingInfo = getRatingLabel(review.rating)
                    return (
                      <div key={review.id} className="border-b border-gray-800 pb-3 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                              {review.userAvatar ? (
                                <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                              ) : (
                                <User size={14} className="text-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{review.userName}</p>
                              <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star size={12} className="fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold text-yellow-400">{review.rating}</span>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ratingInfo.bg} ${ratingInfo.color} border ${ratingInfo.border}`}>
                              {ratingInfo.label}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed mt-2 line-clamp-2">
                          {review.review}
                        </p>
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-400 transition mt-2">
                          <ThumbsUp size={10} />
                          <span>{review.likes || 0}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageCircle size={32} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No reviews yet</p>
                  <p className="text-xs text-gray-600 mt-1">Be the first to review!</p>
                </div>
              )}
              
              {reviews.length > 0 && (
                <button 
                  onClick={handleReviewClick}
                  className="w-full mt-3 text-center text-xs text-purple-400 hover:text-purple-300 transition pt-3 border-t border-gray-800"
                >
                  View all {movie.reviewCount} reviews →
                </button>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> More Like This
              </h3>
              <div className="space-y-3">
                {[
                  { title: "The Last Reel", year: "2024", rating: 4.2 },
                  { title: "Shadows of Kolkata", year: "2023", rating: 4.0 },
                  { title: "Frame by Frame", year: "2024", rating: 4.8 }
                ].map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded transition">
                    <div className="w-12 h-16 bg-gradient-to-br from-purple-800 to-pink-800 rounded flex items-center justify-center text-sm">🎬</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-gray-500">{rec.year}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <Star size={10} className="fill-yellow-400" /> {rec.rating}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}