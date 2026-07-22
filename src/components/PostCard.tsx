// src/components/PostCard.tsx
'use client'

import { useState, useEffect, useRef } from "react"
import { Heart, MessageSquare, Share, BookmarkPlus, MoreHorizontal, Flag, Trash2, UserX, AlertTriangle, Loader2, UserPlus, UserCheck, EyeOff, Hash, ChevronDown, Send, Twitter, Facebook, Link2, Instagram, Copy, CheckCircle, Users } from 'lucide-react'
import { useAuth } from "#/context/AuthContext"
import { db } from "#/lib/firebase"
import { 
  doc, updateDoc, arrayUnion, arrayRemove, increment,
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, getDocs,
  getDoc
} from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getOptimizedAvatarUrl, getFallbackAvatar } from "#/lib/cloudinary"

// Define types
interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  likes?: string[];
  comments?: any[];
  shares?: number;
  imageUrl?: string;
  youtubeVideoId?: string;
  postType?: string;
  interests?: string[];
  isSaved?: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  likes: string[];
  likesCount: number;
  replies?: Reply[];
}

interface Reply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  likes: string[];
  likesCount: number;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  currentUserName?: string;
}

export default function PostCard({ post: initialPost, currentUserId, currentUserName }: PostCardProps) {
  const router = useRouter()
  const [post, setPost] = useState<Post>(initialPost)
  const [isLiked, setIsLiked] = useState(currentUserId ? initialPost.likes?.includes(currentUserId) : false)
  const [likeCount, setLikeCount] = useState(initialPost.likesCount || 0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [replyText, setReplyText] = useState("")
  const [activeReply, setActiveReply] = useState<string | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReportMenu, setShowReportMenu] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [isSavedState, setIsSavedState] = useState(initialPost.isSaved || false)
  const [showCommentMenu, setShowCommentMenu] = useState<string | null>(null)
  const [showReplyMenu, setShowReplyMenu] = useState<string | null>(null)
  const [showAllTags, setShowAllTags] = useState(false)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  const [userAvatar, setUserAvatar] = useState(initialPost.userPhotoURL || "")
  const [userName, setUserName] = useState(initialPost.userName || "")
  const [commentCount, setCommentCount] = useState(initialPost.commentsCount || 0)
  
  // Share Modal States
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const menuRef = useRef<HTMLDivElement>(null)
  const commentMenuRef = useRef<HTMLDivElement>(null)
  const replyMenuRef = useRef<HTMLDivElement>(null)
  const tagsMenuRef = useRef<HTMLDivElement>(null)

  // Real-time listener for post updates (likes, comments count)
  useEffect(() => {
    if (!post.id) return;
    
    const postRef = doc(db, "posts", post.id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newLikeCount = data.likes?.length || 0;
        const newCommentCount = data.commentCount || data.commentsCount || 0;
        
        setLikeCount(newLikeCount);
        setCommentCount(newCommentCount);
        setIsLiked(data.likes?.includes(currentUserId) || false);
        
        setPost(prev => ({
          ...prev,
          likesCount: newLikeCount,
          commentsCount: newCommentCount,
          likes: data.likes || []
        }));
      }
    });
    
    return () => unsubscribe();
  }, [post.id, currentUserId]);

  // Real-time listener for user avatar updates
  useEffect(() => {
    if (!post.userId) return;
    
    const userRef = doc(db, 'users', post.userId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newAvatar = data.avatar || data.photoURL;
        const newName = data.name || data.displayName;
        
        if (newAvatar !== userAvatar) {
          setUserAvatar(newAvatar);
          setAvatarKey(Date.now());
        }
        if (newName && newName !== userName) {
          setUserName(newName);
        }
      }
    });
    
    return () => unsubscribe();
  }, [post.userId]);

  // Update local state when initialPost changes
  useEffect(() => {
    setPost(initialPost);
    setUserAvatar(initialPost.userPhotoURL || "");
    setUserName(initialPost.userName || "");
    setIsLiked(currentUserId ? initialPost.likes?.includes(currentUserId) : false);
    setLikeCount(initialPost.likesCount || 0);
    setCommentCount(initialPost.commentsCount || 0);
    setIsSavedState(initialPost.isSaved || false);
  }, [initialPost, currentUserId]);

  // Check follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || !post.userId || currentUserId === post.userId) return
      
      try {
        const userRef = doc(db, 'users', currentUserId)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          const following = userSnap.data().following || []
          setIsFollowing(following.includes(post.userId))
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
      }
    }
    
    checkFollowStatus()
  }, [currentUserId, post.userId])

  const handleFollow = async () => {
    if (!currentUserId) {
      alert('Please login to follow users')
      return
    }

    setFollowingLoading(true)
    try {
      const currentUserRef = doc(db, 'users', currentUserId)
      const postUserRef = doc(db, 'users', post.userId)

      if (isFollowing) {
        await updateDoc(currentUserRef, { following: arrayRemove(post.userId) })
        await updateDoc(postUserRef, { followers: arrayRemove(currentUserId) })
        setIsFollowing(false)
      } else {
        await updateDoc(currentUserRef, { following: arrayUnion(post.userId) })
        await updateDoc(postUserRef, { followers: arrayUnion(currentUserId) })
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error)
      alert('Failed to update follow status')
    } finally {
      setFollowingLoading(false)
    }
  }

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
        setShowReportMenu(false)
      }
      if (commentMenuRef.current && !commentMenuRef.current.contains(event.target as Node)) {
        setShowCommentMenu(null)
      }
      if (replyMenuRef.current && !replyMenuRef.current.contains(event.target as Node)) {
        setShowReplyMenu(null)
      }
      if (tagsMenuRef.current && !tagsMenuRef.current.contains(event.target as Node)) {
        setShowAllTags(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Load comments when comment section is opened
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments()
    }
  }, [showComments])

  // Also listen for comment changes in real-time
  useEffect(() => {
    if (!showComments || !post.id) return;
    
    const commentsQuery = query(
      collection(db, "posts", post.id, "comments"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      const commentsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        let replies: Reply[] = [];
        const repliesQuery = query(
          collection(db, "posts", post.id, "comments", doc.id, "replies"),
          orderBy("createdAt", "asc")
        );
        const repliesSnap = await getDocs(repliesQuery);
        replies = repliesSnap.docs.map(replyDoc => ({
          id: replyDoc.id,
          ...replyDoc.data(),
          createdAt: replyDoc.data().createdAt?.toDate?.() || new Date()
        } as Reply));
        
        return {
          id: doc.id,
          ...data,
          replies,
          createdAt: data.createdAt?.toDate?.() || new Date()
        } as Comment;
      }));
      
      setComments(commentsData);
      setLoadingComments(false);
    });
    
    return () => unsubscribe();
  }, [showComments, post.id]);

  const loadComments = async () => {
    setLoadingComments(true);
  };

  const addComment = async () => {
    if (!currentUserId || !commentText.trim()) return

    try {
      const commentData = {
        userId: currentUserId,
        userName: currentUserName || post.userName || "User",
        content: commentText.trim(),
        createdAt: serverTimestamp(),
        likes: [],
        likesCount: 0
      }

      await addDoc(collection(db, "posts", post.id, "comments"), commentData)
      
      const postRef = doc(db, "posts", post.id)
      await updateDoc(postRef, { commentCount: increment(1) })

      setCommentText("")
    } catch (error: any) {
      console.error("Error adding comment:", error)
      alert("Failed to add comment. Please try again.")
    }
  }

  const handleLikeComment = async (commentId: string, currentLikes: string[]) => {
    if (!currentUserId) return

    const commentRef = doc(db, "posts", post.id, "comments", commentId)
    const isLiked = currentLikes.includes(currentUserId)

    try {
      if (isLiked) {
        await updateDoc(commentRef, { likes: arrayRemove(currentUserId), likesCount: increment(-1) })
      } else {
        await updateDoc(commentRef, { likes: arrayUnion(currentUserId), likesCount: increment(1) })
      }
    } catch (error) {
      console.error("Error liking comment:", error)
    }
  }

  const handleLikeReply = async (commentId: string, replyId: string, currentLikes: string[]) => {
    if (!currentUserId) return

    const replyRef = doc(db, "posts", post.id, "comments", commentId, "replies", replyId)
    const isLiked = currentLikes.includes(currentUserId)

    try {
      if (isLiked) {
        await updateDoc(replyRef, { likes: arrayRemove(currentUserId), likesCount: increment(-1) })
      } else {
        await updateDoc(replyRef, { likes: arrayUnion(currentUserId), likesCount: increment(1) })
      }
    } catch (error) {
      console.error("Error liking reply:", error)
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return

    try {
      await deleteDoc(doc(db, "posts", post.id, "comments", commentId))
      const postRef = doc(db, "posts", post.id)
      await updateDoc(postRef, { commentCount: increment(-1) })
      setShowCommentMenu(null)
    } catch (error) {
      console.error("Error deleting comment:", error)
      alert("Failed to delete comment. Please try again.")
    }
  }

  const deleteReply = async (commentId: string, replyId: string) => {
    if (!confirm("Delete this reply?")) return

    try {
      await deleteDoc(doc(db, "posts", post.id, "comments", commentId, "replies", replyId))
      setShowReplyMenu(null)
    } catch (error) {
      console.error("Error deleting reply:", error)
      alert("Failed to delete reply. Please try again.")
    }
  }

  const reportComment = async (commentId: string) => {
    if (!currentUserId) return

    try {
      await addDoc(collection(db, "commentReports"), {
        postId: post.id, commentId: commentId, reportedBy: currentUserId,
        reason: "Inappropriate content", createdAt: serverTimestamp(), status: "pending"
      })
      alert("Comment reported. Our team will review it.")
      setShowCommentMenu(null)
    } catch (error) {
      console.error("Error reporting comment:", error)
      alert("Failed to report comment. Please try again.")
    }
  }

  const reportReply = async (commentId: string, replyId: string) => {
    if (!currentUserId) return

    try {
      await addDoc(collection(db, "replyReports"), {
        postId: post.id, commentId: commentId, replyId: replyId, reportedBy: currentUserId,
        reason: "Inappropriate content", createdAt: serverTimestamp(), status: "pending"
      })
      alert("Reply reported. Our team will review it.")
      setShowReplyMenu(null)
    } catch (error) {
      console.error("Error reporting reply:", error)
      alert("Failed to report reply. Please try again.")
    }
  }

  const addReply = async (commentId: string) => {
    if (!replyText.trim() || !currentUserId) return

    try {
      await addDoc(collection(db, "posts", post.id, "comments", commentId, "replies"), {
        userId: currentUserId, userName: currentUserName || post.userName || "User",
        content: replyText.trim(), createdAt: serverTimestamp(), likes: [], likesCount: 0
      })
      setReplyText("")
      setActiveReply(null)
    } catch (error) {
      console.error("Error adding reply:", error)
      alert("Failed to add reply. Please try again.")
    }
  }

  const handleLike = async () => {
    if (!currentUserId) {
      alert("Please login to like posts")
      return
    }

    try {
      const postRef = doc(db, "posts", post.id)
      const newIsLiked = !isLiked

      if (newIsLiked) {
        await updateDoc(postRef, { 
          likes: arrayUnion(currentUserId), 
          likesCount: increment(1) 
        })
      } else {
        await updateDoc(postRef, { 
          likes: arrayRemove(currentUserId), 
          likesCount: increment(-1) 
        })
      }
    } catch (error: any) {
      console.error("Error liking post:", error)
    }
  }

  const handleSave = async () => {
    if (!currentUserId) {
      alert("Please login to save posts")
      return
    }

    try {
      const userRef = doc(db, "users", currentUserId)
      const newSavedState = !isSavedState

      if (newSavedState) {
        await updateDoc(userRef, { savedPosts: arrayUnion(post.id) })
      } else {
        await updateDoc(userRef, { savedPosts: arrayRemove(post.id) })
      }
      
      setIsSavedState(newSavedState)
    } catch (error) {
      console.error("Error saving post:", error)
    }
  }

  // Share Modal Functions
  const handleShareClick = () => {
    setShowShareModal(true)
  }

  const copyToClipboard = async () => {
    const url = `${window.location.origin}/community/post/${post.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnTwitter = () => {
    const text = `Check out this post by ${userName || post.userName} on CinePlanter!`
    const url = `${window.location.origin}/community/post/${post.id}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    setShowShareModal(false)
  }

  const shareOnFacebook = () => {
    const url = `${window.location.origin}/community/post/${post.id}`
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    setShowShareModal(false)
  }

  const shareOnInstagram = () => {
    copyToClipboard()
    alert('Link copied! You can now paste it on Instagram.')
    setShowShareModal(false)
  }

  const shareToCommunity = () => {
    router.push(`/community/create?share=post&id=${post.id}&title=${encodeURIComponent(post.content.substring(0, 100))}`)
    setShowShareModal(false)
  }

  const shareToMessages = () => {
    const shareText = `📢 Check out this post by ${userName || post.userName}:\n\n"${post.content.substring(0, 150)}${post.content.length > 150 ? "..." : ""}"\n\n🔗 ${window.location.origin}/community/post/${post.id}`
    router.push(`/community/messages?share=true&text=${encodeURIComponent(shareText)}&postId=${post.id}`)
    setShowShareModal(false)
  }

  const handleReport = async () => {
    if (!currentUserId) {
      alert("Please login to report posts")
      return
    }

    if (!reportReason.trim()) return

    try {
      await addDoc(collection(db, "reports"), {
        postId: post.id, reportedBy: currentUserId, reason: reportReason,
        createdAt: serverTimestamp(), status: "pending"
      })
      alert("Post reported successfully. Our team will review it.")
      setShowReportMenu(false)
      setReportReason("")
      setShowMenu(false)
    } catch (error) {
      console.error("Error reporting post:", error)
      alert("Failed to report post. Please try again.")
    }
  }

  const handleDelete = async () => {
    if (post.userId !== currentUserId) return
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const postRef = doc(db, "posts", post.id)
      await updateDoc(postRef, { isDeleted: true, deletedAt: serverTimestamp() })
      alert("Post deleted successfully")
      setShowMenu(false)
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Failed to delete post. Please try again.")
    }
  }

  const handleNotInterested = async () => {
    if (!currentUserId) return

    try {
      const userRef = doc(db, "users", currentUserId)
      await updateDoc(userRef, { notInterestedPosts: arrayUnion(post.id) })
      setShowMenu(false)
    } catch (error) {
      console.error("Error marking as not interested:", error)
    }
  }

  const handleBlockUser = async () => {
    if (!currentUserId || currentUserId === post.userId) return
    if (!confirm("Are you sure you want to block this user? You won't see their posts anymore.")) return

    try {
      const userRef = doc(db, "users", currentUserId)
      await updateDoc(userRef, { blockedUsers: arrayUnion(post.userId) })
      alert("User blocked successfully")
      setShowMenu(false)
    } catch (error) {
      console.error("Error blocking user:", error)
      alert("Failed to block user. Please try again.")
    }
  }

  const formatDate = (date: Date) => {
    if (!date) return "Recently"
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const reportReasons = ["Spam", "Harassment", "Inappropriate content", "Misinformation", "Copyright violation", "Other"]

  const getPostTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      discussion: "Discussion", query: "Question", poll: "Poll",
      review: "Review", suggestion: "Suggestion", showcase: "Showcase"
    }
    return types[type] || type
  }

  const getPostTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      discussion: "text-blue-400 bg-blue-500/20", query: "text-green-400 bg-green-500/20",
      poll: "text-yellow-400 bg-yellow-500/20", review: "text-purple-400 bg-purple-500/20",
      suggestion: "text-pink-400 bg-pink-500/20", showcase: "text-orange-400 bg-orange-500/20"
    }
    return colors[type] || "text-gray-400 bg-gray-500/20"
  }

  const interests = post.interests || []
  const visibleTags = interests.slice(0, 2)
  const remainingTags = interests.slice(2)

  const getAvatarUrl = () => {
    return getOptimizedAvatarUrl(userAvatar || post.userPhotoURL, userName || post.userName, avatarKey)
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl overflow-hidden"
      >
        {/* POST HEADER */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.userId}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm overflow-hidden cursor-pointer hover:opacity-80 transition">
                {(userAvatar || post.userPhotoURL) ? (
                  <img 
                    key={avatarKey}
                    src={getAvatarUrl()} 
                    alt={userName || post.userName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackAvatar(userName || post.userName || 'User')
                    }}
                  />
                ) : (
                  (userName || post.userName)?.[0]?.toUpperCase() || "U"
                )}
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${post.userId}`}>
                  <span className="text-sm font-semibold text-white hover:text-purple-400 transition cursor-pointer">
                    {userName || post.userName}
                  </span>
                </Link>
                <span className="text-xs text-slate-500">@{post.userName?.toLowerCase()}</span>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">{formatDate(post.createdAt)}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {post.postType && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPostTypeColor(post.postType)}`}>
                    {getPostTypeLabel(post.postType)}
                  </span>
                )}
                
                {interests.length > 0 && (
                  <div className="flex items-center gap-1">
                    {visibleTags.map((interest: string) => (
                      <Link
                        key={interest}
                        href={`/community/discover/${encodeURIComponent(interest)}`}
                        className="inline-flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full hover:bg-purple-500/30 hover:text-purple-300 transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Hash size={10} />
                        {interest}
                      </Link>
                    ))}
                    
                    {remainingTags.length > 0 && (
                      <div className="relative" ref={tagsMenuRef}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowAllTags(!showAllTags)
                          }}
                          className="inline-flex items-center gap-0.5 text-[10px] bg-white/10 text-slate-400 px-2 py-0.5 rounded-full hover:bg-white/20 transition-colors"
                        >
                          +{remainingTags.length}
                          <ChevronDown size={10} className={`transition-transform ${showAllTags ? "rotate-180" : ""}`} />
                        </button>
                        
                        <AnimatePresence>
                          {showAllTags && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a1a] border border-white/10 rounded-xl p-2 min-w-[140px] shadow-2xl"
                            >
                              <div className="flex flex-col gap-1">
                                {remainingTags.map((interest: string) => (
                                  <Link
                                    key={interest}
                                    href={`/community/discover/${encodeURIComponent(interest)}`}
                                    className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-purple-400 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Hash size={10} />
                                    {interest}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentUserId && post.userId !== currentUserId && (
              <button
                onClick={handleFollow}
                disabled={followingLoading}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isFollowing 
                    ? 'bg-zinc-800 text-slate-300 hover:bg-red-500/20 hover:text-red-400' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:opacity-50`}
              >
                {followingLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserCheck size={12} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={12} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}

            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-10 z-50 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
                  >
                    {post.userId === currentUserId ? (
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Post
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowReportMenu(true)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          Report
                        </button>
                        <button
                          onClick={handleNotInterested}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                        >
                          <EyeOff className="w-4 h-4" />
                          Not Interested
                        </button>
                        <button
                          onClick={handleBlockUser}
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

              <AnimatePresence>
                {showReportMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-10 z-50 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-3"
                  >
                    <p className="text-xs font-bold text-slate-400 mb-2 px-2">Report reason</p>
                    {reportReasons.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => {
                          setReportReason(reason)
                          handleReport()
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        {reason}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowReportMenu(false)}
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
        
        {/* POST CONTENT */}
        <p className="px-4 text-sm text-slate-200 mb-3 whitespace-pre-wrap">
          {post.content}
        </p>

        {/* MEDIA */}
        {post.imageUrl && (
          <div className="border-y border-[#2a2a2a]">
            <img 
              src={post.imageUrl}
              alt="Post" 
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {post.youtubeVideoId && (
          <div className="relative w-full pt-[56.25%] bg-gray-900 border-y border-[#2a2a2a]">
            <iframe
              src={`https://www.youtube.com/embed/${post.youtubeVideoId}`}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allowFullScreen
              title="YouTube video"
            />
          </div>
        )}

        {/* POST STATS */}
        <div className="px-4 py-2 flex items-center gap-4 text-xs text-slate-500 border-b border-[#2a2a2a]">
          <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
          <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
          <span>{post.shares || 0} {post.shares === 1 ? 'share' : 'shares'}</span>
        </div>

        {/* POST ACTIONS */}
        <div className="px-4 py-2 flex items-center justify-around">
          <button 
            onClick={handleLike}
            className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg transition-colors ${
              isLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500 hover:bg-white/5'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500' : ''}`} />
            <span className="text-xs font-medium">Like</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-white/5 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-medium">Comment</span>
          </button>
          
          <button 
            onClick={handleShareClick}
            className="flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-slate-400 hover:text-green-400 hover:bg-white/5 transition-colors"
          >
            <Share className="w-4 h-4" />
            <span className="text-xs font-medium">Share</span>
          </button>

          <button 
            onClick={handleSave}
            className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg transition-colors ${
              isSavedState ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400 hover:bg-white/5'
            }`}
          >
            <BookmarkPlus className={`w-4 h-4 ${isSavedState ? 'fill-yellow-400' : ''}`} />
            <span className="text-xs font-medium">Save</span>
          </button>
        </div>

        {/* COMMENTS SECTION */}
        {showComments && (
          <div className="px-4 py-3 border-t border-[#2a2a2a]">
            {currentUserId && !activeReply && (
              <div className="flex items-center gap-3 mb-4">
                <input 
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  placeholder="Write a comment..."
                  className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                />
                <button 
                  onClick={addComment}
                  disabled={!commentText.trim()}
                  className="text-blue-400 text-sm font-semibold hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            )}

            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex gap-2 group">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-[8px] text-white flex-shrink-0">
                        {comment.userName?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{comment.userName}</span>
                            <span className="text-[8px] text-slate-500">{formatDate(comment.createdAt)}</span>
                          </div>
                          
                          <div className="relative">
                            <button 
                              onClick={() => setShowCommentMenu(comment.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded-full transition-opacity"
                            >
                              <MoreHorizontal className="w-3 h-3 text-slate-400" />
                            </button>
                            
                            {showCommentMenu === comment.id && (
                              <div 
                                ref={commentMenuRef}
                                className="absolute right-0 top-5 z-50 w-32 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl overflow-hidden"
                              >
                                {comment.userId === currentUserId ? (
                                  <button
                                    onClick={() => deleteComment(comment.id)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-400/10"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => reportComment(comment.id)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-yellow-400 hover:bg-yellow-400/10"
                                  >
                                    <Flag className="w-3 h-3" />
                                    Report
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-slate-300 mt-1">{comment.content}</p>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <button
                            onClick={() => handleLikeComment(comment.id, comment.likes || [])}
                            className={`flex items-center gap-1 text-[10px] transition-colors ${
                              comment.likes?.includes(currentUserId || '')
                                ? 'text-pink-500'
                                : 'text-slate-500 hover:text-pink-500'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${comment.likes?.includes(currentUserId || '') ? 'fill-pink-500' : ''}`} />
                            <span>{comment.likesCount || 0}</span>
                          </button>

                          <button
                            onClick={() => setActiveReply(comment.id)}
                            className="text-[10px] text-slate-500 hover:text-blue-400 transition-colors"
                          >
                            Reply
                          </button>
                        </div>

                        {activeReply === comment.id && (
                          <div className="flex gap-2 mt-2">
                            <input
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addReply(comment.id)}
                              placeholder="Write a reply..."
                              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => addReply(comment.id)}
                              disabled={!replyText.trim()}
                              className="text-blue-400 text-xs font-semibold hover:text-blue-300 disabled:opacity-50"
                            >
                              Send
                            </button>
                          </div>
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-4 mt-3 space-y-2 border-l border-[#2a2a2a] pl-3">
                            {comment.replies.map((reply: Reply) => (
                              <div key={reply.id} className="flex gap-2 group">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500/50 to-pink-500/50 flex items-center justify-center font-bold text-[6px] text-white flex-shrink-0">
                                  {reply.userName?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-semibold text-white">{reply.userName}</span>
                                      <span className="text-[6px] text-slate-500">{formatDate(reply.createdAt)}</span>
                                    </div>
                                    
                                    <div className="relative">
                                      <button 
                                        onClick={() => setShowReplyMenu(reply.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded-full transition-opacity"
                                      >
                                        <MoreHorizontal className="w-2 h-2 text-slate-400" />
                                      </button>
                                      
                                      {showReplyMenu === reply.id && (
                                        <div 
                                          ref={replyMenuRef}
                                          className="absolute right-0 top-4 z-50 w-28 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl overflow-hidden"
                                        >
                                          {reply.userId === currentUserId ? (
                                            <button
                                              onClick={() => deleteReply(comment.id, reply.id)}
                                              className="flex items-center gap-2 w-full px-2 py-1.5 text-[10px] text-red-400 hover:bg-red-400/10"
                                            >
                                              <Trash2 className="w-2 h-2" />
                                              Delete
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => reportReply(comment.id, reply.id)}
                                              className="flex items-center gap-2 w-full px-2 py-1.5 text-[10px] text-yellow-400 hover:bg-yellow-400/10"
                                            >
                                              <Flag className="w-2 h-2" />
                                              Report
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <p className="text-[10px] text-slate-400 mt-0.5">{reply.content}</p>
                                  
                                  <button
                                    onClick={() => handleLikeReply(comment.id, reply.id, reply.likes || [])}
                                    className={`flex items-center gap-1 mt-1 text-[8px] transition-colors ${
                                      reply.likes?.includes(currentUserId || '')
                                        ? 'text-pink-500'
                                        : 'text-slate-500 hover:text-pink-500'
                                    }`}
                                  >
                                    <Heart className={`w-2 h-2 ${reply.likes?.includes(currentUserId || '') ? 'fill-pink-500' : ''}`} />
                                    <span>{reply.likesCount || 0}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-slate-500 py-4">No comments yet. Be the first to comment!</p>
            )}
          </div>
        )}
      </motion.div>

      {/* SHARE MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Share this post</h3>
              <div className="space-y-3">
                <button
                  onClick={shareToMessages}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Send className="w-5 h-5 text-purple-400" />
                  <span className="text-white">Share to Messages</span>
                </button>
                <button
                  onClick={shareToCommunity}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Share to Community</span>
                </button>
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Link2 className="w-5 h-5" />}
                  <span className="text-white">{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={shareOnTwitter}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Share on Twitter</span>
                </button>
                <button
                  onClick={shareOnFacebook}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span className="text-white">Share on Facebook</span>
                </button>
                <button
                  onClick={shareOnInstagram}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Instagram className="w-5 h-5 text-pink-500" />
                  <span className="text-white">Share on Instagram</span>
                </button>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="mt-4 w-full p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}