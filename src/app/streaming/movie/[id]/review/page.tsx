// src/app/streaming/movie/[id]/review/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { db } from '#/lib/firebase'
import { useAuth } from '#/context/AuthContext'
import Navbar from '#/components/Navbar'
import { 
  Star, ArrowLeft, Send, Film, Loader2, AlertCircle, CheckCircle, 
  User, TrendingUp, Camera, Scissors, Music, Mic, Clapperboard,
  Award, Sparkles, ThumbsUp
} from 'lucide-react'

interface Movie {
  id: string
  title: string
  posterUrl: string
  backdropUrl: string
  rating?: number
}

interface TechnicalRating {
  category: string
  value: number
  label: string
}

export default function ReviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [overallRating, setOverallRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [checkingReview, setCheckingReview] = useState(true)
  const [hoveredStar, setHoveredStar] = useState<{ categoryIndex: number; value: number } | null>(null)
  
  // Technical ratings state
  const [technicalRatings, setTechnicalRatings] = useState<TechnicalRating[]>([
    { category: "Storytelling", value: 0, label: "Plot & Narrative" },
    { category: "Cinematography", value: 0, label: "Visual & Camera Work" },
    { category: "Editing", value: 0, label: "Pacing & Flow" },
    { category: "Sound Design", value: 0, label: "Audio & Score" },
    { category: "Acting", value: 0, label: "Performance" }
  ])

  const ratingOptions = [
    { id: "outstanding", label: "Outstanding", value: 5, color: "#10b981" },
    { id: "good", label: "Good Effort", value: 4, color: "#3b82f6" },
    { id: "decent", label: "Decent Attempt", value: 3, color: "#eab308" },
    { id: "needs", label: "Needs Work", value: 2, color: "#ef4444" }
  ]

  // Helper function to get user ID from different possible fields
  const getUserId = (): string | null => {
    if (!user) return null
    return user.uid || user.id || user.userId || null
  }

  // Helper function to get user name from different possible fields
  const getUserName = (): string => {
    if (!user) return 'Anonymous'
    return user.displayName || user.name || user.username || user.email?.split('@')[0] || 'Anonymous'
  }

  // Helper function to get user avatar from different possible fields
  const getUserAvatar = (): string | null => {
    if (!user) return null
    const avatar = user.photoURL || user.avatar || user.profilePicture
    return avatar || null
  }

  // Helper function to get user email
  const getUserEmail = (): string | null => {
    if (!user) return null
    return user.email || null
  }

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return
      
      try {
        const docRef = doc(db, 'movies', id as string)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          setMovie({
            id: docSnap.id,
            title: data.title || 'Untitled',
            posterUrl: data.posterUrl || '',
            backdropUrl: data.backdropUrl || '',
            rating: data.rating
          })
        } else {
          setError('Movie not found')
        }
      } catch (err) {
        console.error('Error fetching movie:', err)
        setError('Failed to load movie')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMovie()
  }, [id])
  
  // Check if user already reviewed this movie
  useEffect(() => {
    const checkExistingReview = async () => {
      const userId = getUserId()
      
      if (!user || !id || authLoading) {
        setCheckingReview(false)
        return
      }
      
      if (!userId) {
        console.error('User ID is missing. User object:', user)
        setCheckingReview(false)
        return
      }
      
      try {
        const reviewsRef = collection(db, 'reviews')
        const q = query(
          reviewsRef,
          where('movieId', '==', id),
          where('userId', '==', userId)
        )
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const reviewData = querySnapshot.docs[0].data()
          setExistingReview({ id: querySnapshot.docs[0].id, ...reviewData })
          setOverallRating(reviewData.rating || 0)
          setReviewText(reviewData.review || '')
          if (reviewData.technicalRatings) {
            setTechnicalRatings(reviewData.technicalRatings)
          }
        }
      } catch (err) {
        console.error('Error checking existing review:', err)
      } finally {
        setCheckingReview(false)
      }
    }
    
    checkExistingReview()
  }, [user, id, authLoading])

  const handleTechnicalRatingChange = (index: number, value: number) => {
    const updated = [...technicalRatings]
    updated[index].value = value
    setTechnicalRatings(updated)
  }

  const handleSubmit = async () => {
    const userId = getUserId()
    const userName = getUserName()
    const userAvatar = getUserAvatar()
    const userEmail = getUserEmail()
    
    // Check if user is logged in
    if (!user) {
      setError('Please login to submit a review')
      return
    }
    
    if (!userId) {
      setError('User authentication error. Please logout and login again.')
      console.error('User ID is missing. User object:', user)
      return
    }
    
    if (overallRating === 0) {
      setError('Please select an overall rating')
      return
    }
    
    if (!reviewText.trim()) {
      setError('Please write your review')
      return
    }
    
    if (reviewText.trim().length < 20) {
      setError('Please write at least 20 characters')
      return
    }
    
    // Check if any technical rating is missing
    const missingTechRatings = technicalRatings.filter(r => r.value === 0)
    if (missingTechRatings.length > 0) {
      setError(`Please rate all technical categories: ${missingTechRatings.map(r => r.category).join(', ')}`)
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const avgTechnicalRating = technicalRatings.reduce((sum, r) => sum + r.value, 0) / technicalRatings.length
      
      // Clean and validate all data before sending
      const cleanReviewText = reviewText.trim()
      const movieId = id as string
      const movieTitle = movie?.title || 'Untitled'
      
      // Create review object with ONLY defined values - NO undefined allowed
      const reviewData: Record<string, any> = {
        movieId: movieId,
        movieTitle: movieTitle,
        userId: userId,
        userName: userName,
        rating: Number(overallRating),
        technicalRatings: technicalRatings.map(r => ({ 
          category: r.category, 
          value: Number(r.value), 
          label: r.label 
        })),
        avgTechnicalRating: Number(avgTechnicalRating),
        review: cleanReviewText,
        likes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      // Only add optional fields if they have valid non-null values
      if (userAvatar && userAvatar !== 'null' && userAvatar !== 'undefined') {
        reviewData.userAvatar = userAvatar
      }
      if (userEmail && userEmail !== 'null' && userEmail !== 'undefined') {
        reviewData.userEmail = userEmail
      }
      
      // Log the data to debug
      console.log('=== REVIEW DATA BEING SUBMITTED ===')
      Object.keys(reviewData).forEach(key => {
        console.log(`${key}:`, reviewData[key])
      })
      console.log('===================================')
      
      // Double-check for any undefined values
      const hasUndefined = Object.values(reviewData).some(value => value === undefined)
      if (hasUndefined) {
        const undefinedFields = Object.keys(reviewData).filter(key => reviewData[key] === undefined)
        console.error('Undefined fields:', undefinedFields)
        throw new Error(`Cannot submit: undefined values found in ${undefinedFields.join(', ')}`)
      }
      
      if (existingReview) {
        // Update existing review
        const reviewRef = doc(db, 'reviews', existingReview.id)
        await updateDoc(reviewRef, reviewData)
      } else {
        // Add new review
        await addDoc(collection(db, 'reviews'), reviewData)
        
        // Update movie's average rating
        const movieRef = doc(db, 'movies', movieId)
        const movieDoc = await getDoc(movieRef)
        const currentData = movieDoc.data()
        const currentCount = currentData?.reviewCount || 0
        const currentTotal = currentData?.totalRating || 0
        
        await updateDoc(movieRef, {
          reviewCount: currentCount + 1,
          totalRating: currentTotal + overallRating,
          rating: (currentTotal + overallRating) / (currentCount + 1)
        })
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push(`/streaming/movie/${id}`)
      }, 2000)
    } catch (err: any) {
      console.error('Error submitting review:', err)
      if (err.code === 'permission-denied') {
        setError('You don\'t have permission to submit reviews. Please check your Firestore security rules.')
      } else if (err.message) {
        setError(`Failed to submit review: ${err.message}`)
      } else {
        setError('Failed to submit review. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || loading || checkingReview) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // If user is not logged in, show login prompt
  if (!user || !getUserId()) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center max-w-md mx-auto p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
            <User className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
            <p className="text-gray-400 mb-6">Please login to write a review</p>
            <button 
              onClick={() => router.push('/auth')}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white hover:opacity-90 transition"
            >
              Login Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Helper to get icon component for display
  const getIconForCategory = (category: string) => {
    switch(category) {
      case 'Storytelling': return TrendingUp
      case 'Cinematography': return Camera
      case 'Editing': return Scissors
      case 'Sound Design': return Music
      case 'Acting': return Mic
      default: return Star
    }
  }

  const getActiveRatingColor = () => {
    const active = ratingOptions.find(r => r.value === overallRating)
    return active?.color || '#8b5cf6'
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="relative min-h-screen pt-24 pb-12">
        {/* Background Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Movie</span>
          </button>
          
          {success ? (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Review Submitted!</h2>
              <p className="text-gray-400 mb-4">
                {existingReview ? 'Your review has been updated successfully.' : 'Thank you for sharing your thoughts!'}
              </p>
              <p className="text-sm text-gray-500">Redirecting you back to the movie page...</p>
            </div>
          ) : (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Hero Section with Movie Info */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                {movie?.backdropUrl ? (
                  <>
                    <img 
                      src={movie.backdropUrl} 
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-purple-900/50 to-pink-900/50" />
                )}
                <div className="absolute inset-0 flex items-end p-8">
                  <div className="flex items-center gap-4">
                    {movie?.posterUrl && (
                      <img 
                        src={movie.posterUrl} 
                        alt={movie.title}
                        className="w-20 h-28 rounded-lg object-cover shadow-xl hidden md:block"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{movie?.title}</h1>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{movie?.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <span>•</span>
                        <span>Write your honest review</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-8">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                    {getUserAvatar() ? (
                      <img 
                        src={getUserAvatar()!} 
                        alt={getUserName()} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{getUserName()}</p>
                    <p className="text-xs text-gray-500">{getUserEmail()}</p>
                  </div>
                </div>

                {/* Two Column Layout - Rating (Left) & Review (Right) */}
                <div className="flex flex-col md:flex-row gap-8">
                  
                  {/* LEFT COLUMN - Rating Section */}
                  <div className="w-full md:w-2/5 space-y-6">
                    {/* Overall Rating - Horizontal Pill Bar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-3">Overall Rating</label>
                      <div className="relative bg-white/5 rounded-full p-1 flex">
                        {ratingOptions.map((option) => {
                          const isActive = overallRating === option.value
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setOverallRating(option.value)}
                              className={`relative flex-1 py-2 px-2 rounded-full text-xs font-medium transition-all duration-300 z-10 ${
                                isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                        {/* Sliding Indicator */}
                        <div 
                          className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out"
                          style={{
                            width: `${100 / ratingOptions.length}%`,
                            transform: `translateX(${(overallRating ? ratingOptions.findIndex(r => r.value === overallRating) : 0) * 100}%)`,
                            backgroundColor: getActiveRatingColor(),
                            opacity: overallRating ? 0.2 : 0
                          }}
                        />
                      </div>
                    </div>

                    {/* Technical Ratings - Clean star rows */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-3">Technical Ratings</label>
                      <div className="space-y-4">
                        {technicalRatings.map((rating, index) => {
                          const Icon = getIconForCategory(rating.category)
                          return (
                            <div key={rating.category} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-gray-300">{rating.category}</span>
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const isActive = star <= rating.value
                                  const isHovered = hoveredStar?.categoryIndex === index && star <= hoveredStar.value
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleTechnicalRatingChange(index, star)}
                                      onMouseEnter={() => setHoveredStar({ categoryIndex: index, value: star })}
                                      onMouseLeave={() => setHoveredStar(null)}
                                      className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                      <Star
                                        size={16}
                                        className={`${
                                          isActive || isHovered
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-600'
                                        } transition-all duration-150`}
                                      />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN - Review Section */}
                  <div className="w-full md:w-3/5 space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Your Review</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="What did you think about this movie? Share your thoughts about the story, performances, cinematography, direction, and overall experience..."
                      rows={8}
                      className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition resize-none"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Minimum 20 characters</span>
                      <span>{reviewText.length}/2000 characters</span>
                    </div>
                  </div>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-shake">
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle size={16} />
                      {error}
                    </p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        {existingReview ? 'Update Review' : 'Submit Review'}
                      </>
                    )}
                  </button>
                </div>
                
                {/* Edit Note */}
                {existingReview && (
                  <p className="text-center text-xs text-gray-500">
                    You're editing your existing review. Your previous rating and review will be updated.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-in {
          animation: fade-in 0.5s ease-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}