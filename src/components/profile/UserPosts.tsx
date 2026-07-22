'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Heart, MessageSquare, Share, Bookmark, MoreHorizontal, Youtube,
  Flag, Trash2, UserX, AlertTriangle, Loader2, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '#/lib/firebase'
import { 
  doc, updateDoc, arrayUnion, arrayRemove, increment,
  collection, query, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp, deleteDoc 
} from 'firebase/firestore'
import { useAuth } from '#/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function UserPosts({ posts: initialPosts }: { posts: any[] }) {
  const { user } = useAuth()
  const router = useRouter()
  
  // Local state for posts with interactions
  const [posts, setPosts] = useState(initialPosts)
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({})
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [showReportMenu, setShowReportMenu] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  
  // Comment states
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [activeReply, setActiveReply] = useState<string | null>(null)
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  
  const menuRef = useRef<HTMLDivElement>(null)

  // Update posts when initialPosts changes
  useEffect(() => {
    setPosts(initialPosts)
    
    // Initialize liked posts based on user's likes
    if (user?.id || user?.uid) {
      const userId = user.id || user.uid;
      const newLikedPosts: Record<string, boolean> = {}
      initialPosts.forEach(post => {
        newLikedPosts[post.id] = post.likes?.includes(userId) || false
      })
      setLikedPosts(newLikedPosts)
    }
  }, [initialPosts, user?.id, user?.uid])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null)
        setShowReportMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Get user ID (supports both id and uid)
  const getUserId = () => {
    return user?.id || user?.uid;
  }

  // Check if user is logged in
  const requireAuth = () => {
    if (!user) {
      router.push('/auth/signin')
      return false
    }
    return true
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    
    try {
      const date = timestamp?.toDate?.() || new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch (e) {
      return ""
    }
  }

  const getPostTypeBadge = (type: string) => {
    const colors: any = {
      discussion: "bg-blue-500/20 text-blue-400",
      query: "bg-green-500/20 text-green-400",
      suggestion: "bg-purple-500/20 text-purple-400",
      review: "bg-yellow-500/20 text-yellow-400",
      poll: "bg-pink-500/20 text-pink-400"
    }
    return colors[type] || "bg-gray-500/20 text-gray-400"
  }

  // Load comments for a post
  const loadComments = async (postId: string) => {
    if (!requireAuth()) return

    setLoadingComments(prev => ({ ...prev, [postId]: true }))

    try {
      const commentsQuery = query(
        collection(db, "posts", postId, "comments"),
        orderBy("createdAt", "desc")
      )
      
      const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
        const commentsData = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data()
          
          // Load replies for this comment
          let replies: any[] = []
          const repliesQuery = query(
            collection(db, "posts", postId, "comments", doc.id, "replies"),
            orderBy("createdAt", "asc")
          )
          const repliesSnap = await getDocs(repliesQuery)
          replies = repliesSnap.docs.map(replyDoc => ({
            id: replyDoc.id,
            ...replyDoc.data(),
            createdAt: replyDoc.data().createdAt?.toDate?.() || new Date()
          }))

          return {
            id: doc.id,
            ...data,
            replies,
            createdAt: data.createdAt?.toDate?.() || new Date()
          }
        }))
        
        setComments(prev => ({ ...prev, [postId]: commentsData }))
        setLoadingComments(prev => ({ ...prev, [postId]: false }))
      })

      return () => unsubscribe()
    } catch (error) {
      console.error("Error loading comments:", error)
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  // Add comment
  const addComment = async (postId: string) => {
    if (!requireAuth()) return
    if (!commentText[postId]?.trim()) return
    
    // Get user ID (supports both id and uid)
    const userId = getUserId();
    if (!userId) {
      console.error("User ID is missing")
      return
    }

    try {
      const commentData = {
        userId: userId,
        userName: user.displayName || user.name || user.username || "Anonymous",
        userPhotoURL: user.photoURL || user.avatar || "",
        content: commentText[postId].trim(),
        createdAt: serverTimestamp(),
        likes: [],
        likesCount: 0
      }

      console.log("Adding comment with data:", commentData)

      await addDoc(collection(db, "posts", postId, "comments"), commentData)
      
      // Update post comment count
      const postRef = doc(db, "posts", postId)
      await updateDoc(postRef, {
        commentsCount: increment(1)
      })

      setCommentText(prev => ({ ...prev, [postId]: "" }))
    } catch (error) {
      console.error("Error adding comment:", error)
      alert("Failed to add comment. Please try again.")
    }
  }

  // Like comment
  const handleLikeComment = async (postId: string, commentId: string, currentLikes: string[] = []) => {
    if (!requireAuth()) return
    
    const userId = getUserId();
    if (!userId) return

    const commentRef = doc(db, "posts", postId, "comments", commentId)
    const isLiked = currentLikes.includes(userId)

    try {
      if (isLiked) {
        await updateDoc(commentRef, {
          likes: arrayRemove(userId),
          likesCount: increment(-1)
        })
      } else {
        await updateDoc(commentRef, {
          likes: arrayUnion(userId),
          likesCount: increment(1)
        })
      }
    } catch (error) {
      console.error("Error liking comment:", error)
    }
  }

  // Add reply
  const addReply = async (postId: string, commentId: string) => {
    if (!requireAuth()) return
    if (!replyText[commentId]?.trim()) return
    
    const userId = getUserId();
    if (!userId) return

    try {
      await addDoc(
        collection(db, "posts", postId, "comments", commentId, "replies"),
        {
          userId: userId,
          userName: user.displayName || user.name || user.username || "Anonymous",
          userPhotoURL: user.photoURL || user.avatar || "",
          content: replyText[commentId].trim(),
          createdAt: serverTimestamp(),
          likes: [],
          likesCount: 0
        }
      )

      setReplyText(prev => ({ ...prev, [commentId]: "" }))
      setActiveReply(null)
    } catch (error) {
      console.error("Error adding reply:", error)
      alert("Failed to add reply. Please try again.")
    }
  }

  // Like post
  const handleLike = async (postId: string) => {
    if (!requireAuth()) return
    
    const userId = getUserId();
    if (!userId) return

    setLoadingStates(prev => ({ ...prev, [`like-${postId}`]: true }))

    try {
      const postRef = doc(db, "posts", postId)
      const isLiked = likedPosts[postId]

      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
          likesCount: increment(-1)
        })
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
          likesCount: increment(1)
        })
      }

      // Update local state
      setLikedPosts(prev => ({ ...prev, [postId]: !isLiked }))
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likesCount: (p.likesCount || 0) + (isLiked ? -1 : 1)
          }
        }
        return p
      }))

    } catch (error) {
      console.error("Error liking post:", error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [`like-${postId}`]: false }))
    }
  }

  // Save post
  const handleSave = async (postId: string) => {
    if (!requireAuth()) return
    
    const userId = getUserId();
    if (!userId) return

    setLoadingStates(prev => ({ ...prev, [`save-${postId}`]: true }))

    try {
      const userRef = doc(db, "users", userId)
      const isSaved = savedPosts[postId]

      if (isSaved) {
        await updateDoc(userRef, {
          savedPosts: arrayRemove(postId)
        })
      } else {
        await updateDoc(userRef, {
          savedPosts: arrayUnion(postId)
        })
      }

      setSavedPosts(prev => ({ ...prev, [postId]: !isSaved }))

    } catch (error) {
      console.error("Error saving post:", error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [`save-${postId}`]: false }))
    }
  }

  // Share post
  const handleShare = async (postId: string) => {
    if (!requireAuth()) return

    try {
      const postRef = doc(db, "posts", postId)
      await updateDoc(postRef, {
        shares: increment(1)
      })

      const url = `${window.location.origin}/community/post/${postId}`
      await navigator.clipboard.writeText(url)
      
      alert("Link copied to clipboard!")
      setShowMenu(null)
    } catch (error) {
      console.error("Error sharing post:", error)
    }
  }

  // Delete post
  const handleDelete = async (postId: string) => {
    if (!requireAuth()) return
    
    const userId = getUserId();
    if (!userId) return
    
    if (!confirm("Are you sure you want to delete this post?")) return

    setLoadingStates(prev => ({ ...prev, [`delete-${postId}`]: true }))

    try {
      const postRef = doc(db, "posts", postId)
      await updateDoc(postRef, {
        isDeleted: true,
        deletedAt: serverTimestamp()
      })

      setPosts(prev => prev.filter(p => p.id !== postId))
      alert("Post deleted successfully")
      setShowMenu(null)
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Failed to delete post")
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete-${postId}`]: false }))
    }
  }

  // Report post
  const handleReport = async (postId: string) => {
    if (!requireAuth()) return
    
    const userId = getUserId();
    if (!userId) return
    
    if (!reportReason.trim()) return

    setLoadingStates(prev => ({ ...prev, [`report-${postId}`]: true }))

    try {
      await addDoc(collection(db, "reports"), {
        postId: postId,
        reportedBy: userId,
        reason: reportReason,
        createdAt: serverTimestamp(),
        status: "pending"
      })

      alert("Post reported successfully")
      setShowReportMenu(null)
      setReportReason("")
      setShowMenu(null)
    } catch (error) {
      console.error("Error reporting post:", error)
      alert("Failed to report post")
    } finally {
      setLoadingStates(prev => ({ ...prev, [`report-${postId}`]: false }))
    }
  }

  const reportReasons = [
    "Spam",
    "Harassment",
    "Inappropriate content",
    "Misinformation",
    "Copyright violation",
    "Other"
  ]

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <p className="text-slate-400">No posts yet</p>
        <p className="text-sm text-gray-600 mt-1">Your community posts will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-transparent backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all"
        >
          {/* Post Header */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <img
                src={post.userPhotoURL || "/default-avatar.png"}
                className="w-10 h-10 rounded-full border border-white/10 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-avatar.png"
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">
                    {post.userName || "User"}
                  </span>
                  <span className="text-xs text-slate-500">
                    @{(post.userName || "user").toLowerCase().replace(/\s+/g, '')}
                  </span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-500">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                
                {/* Post Type and Category Badges */}
                <div className="flex items-center gap-2 mt-1">
                  {post.postType && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${getPostTypeBadge(post.postType)}`}>
                      {post.postType}
                    </span>
                  )}
                  {post.category && post.category !== "general" && (
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full uppercase">
                      {post.category}
                    </span>
                  )}
                </div>
              </div>
              
              {/* 3-dot menu */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(showMenu === post.id ? null : post.id)}
                  className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
                >
                  <MoreHorizontal size={18} />
                </button>

                <AnimatePresence>
                  {showMenu === post.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-8 z-50 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
                    >
                      {post.userId === getUserId() ? (
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={loadingStates[`delete-${post.id}`]}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                        >
                          {loadingStates[`delete-${post.id}`] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete Post
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowReportMenu(post.id)}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                          >
                            <Flag className="w-4 h-4" />
                            Report
                          </button>
                          <button
                            onClick={() => {
                              if (requireAuth()) {
                                // Block user logic here
                              }
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                            Block User
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Report menu */}
                <AnimatePresence>
                  {showReportMenu === post.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-8 z-50 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-3"
                    >
                      <p className="text-xs font-bold text-slate-400 mb-2 px-2">Report reason</p>
                      {reportReasons.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => {
                            setReportReason(reason)
                            handleReport(post.id)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <AlertTriangle className="w-3 h-3 text-yellow-500" />
                          {reason}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowReportMenu(null)}
                        className="w-full mt-2 px-3 py-2 text-xs text-slate-500 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <p className="px-4 text-sm text-slate-200 mb-3 whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Media - YouTube */}
          {post.youtubeVideoId && (
            <div className="border-t border-white/10">
              <div className="relative w-full pt-[56.25%] bg-gray-900">
                <iframe
                  src={`https://www.youtube.com/embed/${post.youtubeVideoId}`}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="YouTube video"
                />
              </div>
            </div>
          )}

          {/* Media - Image */}
          {post.imageUrl && !post.youtubeVideoId && (
            <div className="border-t border-white/10">
              <img 
                src={post.imageUrl} 
                alt="Post" 
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          {/* Post Stats */}
          <div className="px-4 py-2 flex items-center gap-4 text-xs text-slate-500 border-t border-white/10">
            <span>{post.likesCount || 0} likes</span>
            <span>{post.commentsCount || 0} comments</span>
            <span>{post.shares || 0} shares</span>
          </div>

          {/* Post Actions */}
          <div className="px-4 py-2 flex items-center justify-around border-t border-white/10">
            <button 
              onClick={() => handleLike(post.id)}
              disabled={loadingStates[`like-${post.id}`]}
              className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg transition-colors ${
                likedPosts[post.id] ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500 hover:bg-white/5'
              } disabled:opacity-50`}
            >
              {loadingStates[`like-${post.id}`] ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className={`w-4 h-4 ${likedPosts[post.id] ? 'fill-pink-500' : ''}`} />
              )}
              <span className="text-xs font-medium">Like</span>
            </button>
            
            <button 
              onClick={() => {
                if (user) {
                  setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))
                  if (!comments[post.id]) loadComments(post.id)
                } else {
                  router.push('/auth/signin')
                }
              }}
              className="flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-white/5 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-medium">Comment</span>
            </button>
            
            <button 
              onClick={() => handleShare(post.id)}
              className="flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-slate-400 hover:text-green-400 hover:bg-white/5 transition-colors"
            >
              <Share className="w-4 h-4" />
              <span className="text-xs font-medium">Share</span>
            </button>

            <button 
              onClick={() => handleSave(post.id)}
              disabled={loadingStates[`save-${post.id}`]}
              className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg transition-colors ${
                savedPosts[post.id] ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400 hover:bg-white/5'
              } disabled:opacity-50`}
            >
              {loadingStates[`save-${post.id}`] ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bookmark className={`w-4 h-4 ${savedPosts[post.id] ? 'fill-yellow-400' : ''}`} />
              )}
              <span className="text-xs font-medium">Save</span>
            </button>
          </div>

          {/* Comments Section */}
          {showComments[post.id] && user && (
            <div className="px-4 py-3 border-t border-white/10">
              {/* Add comment */}
              <div className="flex items-center gap-2 mb-3">
                <img
                  src={user.photoURL || user.avatar || "/default-avatar.png"}
                  className="w-6 h-6 rounded-full border border-white/10 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png"
                  }}
                />
                <input 
                  type="text"
                  value={commentText[post.id] || ""}
                  onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                />
                <button 
                  onClick={() => addComment(post.id)}
                  disabled={!commentText[post.id]?.trim()}
                  className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50"
                >
                  Post
                </button>
              </div>

              {/* Comments list */}
              {loadingComments[post.id] ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                </div>
              ) : comments[post.id]?.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {comments[post.id].map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <img
                        src={comment.userPhotoURL || "/default-avatar.png"}
                        className="w-5 h-5 rounded-full border border-white/10 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/default-avatar.png"
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{comment.userName}</span>
                          <span className="text-[8px] text-slate-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">{comment.content}</p>
                        
                        {/* Comment actions */}
                        <div className="flex items-center gap-3 mt-1">
                          <button
                            onClick={() => handleLikeComment(post.id, comment.id, comment.likes)}
                            className={`text-[8px] flex items-center gap-1 ${
                              comment.likes?.includes(getUserId()) ? 'text-pink-500' : 'text-slate-500'
                            }`}
                          >
                            <Heart className={`w-2 h-2 ${comment.likes?.includes(getUserId()) ? 'fill-pink-500' : ''}`} />
                            {comment.likesCount || 0}
                          </button>
                          <button
                            onClick={() => setActiveReply(activeReply === comment.id ? null : comment.id)}
                            className="text-[8px] text-slate-500 hover:text-blue-400"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Reply input */}
                        {activeReply === comment.id && (
                          <div className="flex gap-2 mt-2">
                            <input
                              value={replyText[comment.id] || ""}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                              onKeyPress={(e) => e.key === 'Enter' && addReply(post.id, comment.id)}
                              placeholder="Write a reply..."
                              className="flex-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 text-[10px] text-white placeholder:text-gray-500 focus:outline-none"
                            />
                            <button
                              onClick={() => addReply(post.id, comment.id)}
                              disabled={!replyText[comment.id]?.trim()}
                              className="text-[10px] text-purple-400 disabled:opacity-50"
                            >
                              Send
                            </button>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies?.length > 0 && (
                          <div className="ml-3 mt-2 space-y-2 border-l border-white/10 pl-2">
                            {comment.replies.map((reply: any) => (
                              <div key={reply.id} className="flex gap-2">
                                <img
                                  src={reply.userPhotoURL || "/default-avatar.png"}
                                  className="w-4 h-4 rounded-full border border-white/10 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/default-avatar.png"
                                  }}
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-semibold text-white">{reply.userName}</span>
                                    <span className="text-[6px] text-slate-500">{formatDate(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-[9px] text-slate-400">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[10px] text-slate-500 py-2">No comments yet</p>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}