'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Navbar from "#/components/Navbar"
import { db } from "#/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useAuth } from "#/context/AuthContext"
import { Heart, MessageSquare, Share, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function SinglePostPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return
      
      try {
        const postRef = doc(db, "posts", id as string)
        const postSnap = await getDoc(postRef)
        
        if (postSnap.exists()) {
          const data = postSnap.data()
          setPost({
            id: postSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date()
          })
        } else {
          setError("Post not found")
        }
      } catch (err) {
        console.error("Error loading post:", err)
        setError("Failed to load post")
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [id])

  const formatDate = (date: Date) => {
    if (!date) return "Recently"
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Post not found"}</p>
          <Link href="/profile" className="text-purple-400 hover:text-purple-300">
            ← Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"/>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full"/>
      </div>

      <Navbar />

      <main className="relative pt-24 pb-10 px-4 max-w-3xl mx-auto">
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl overflow-hidden"
        >
          {/* Post Header */}
          <div className="p-6 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white">
                {post.userName?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{post.userName}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-4">
              {post.title || "Untitled Post"}
            </h1>
            
            <p className="text-gray-300 whitespace-pre-wrap mb-6">
              {post.content || post.description}
            </p>

            {post.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-[#2a2a2a] mb-6">
                <img 
                  src={post.imageUrl} 
                  alt="Post" 
                  className="w-full h-auto"
                />
              </div>
            )}

            {post.youtubeVideoId && (
              <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden border border-[#2a2a2a] mb-6">
                <iframe
                  src={`https://www.youtube.com/embed/${post.youtubeVideoId}`}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="YouTube video"
                />
              </div>
            )}

            {/* Post Stats */}
            <div className="flex items-center gap-6 pt-4 border-t border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <span className="text-white">{post.likesCount || 0} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span className="text-white">{post.commentsCount || 0} comments</span>
              </div>
              <div className="flex items-center gap-2">
                <Share className="w-5 h-5 text-green-500" />
                <span className="text-white">{post.shares || 0} shares</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}