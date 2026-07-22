'use client'

import { useAuth } from "#/context/AuthContext"
import Navbar from "#/components/Navbar"
import ProfileSidebar from "#/components/profile/ProfileSidebar"
import ProfileHeader from "#/components/profile/ProfileHeader"
import FollowingList from "#/components/profile/FollowingList"
import UserPosts from "#/components/profile/UserPosts"

import { useState, useEffect, useRef, useCallback } from "react"
import { db } from "#/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore"

const POSTS_PER_PAGE = 5

export default function ProfilePage() {

  const { user, isLoading } = useAuth()

  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Initial load of posts
  useEffect(() => {
    if (!user) return

    const loadInitialPosts = async () => {
      try {
        setLoadingPosts(true)
        const userId = user.uid || user.id;
        
        if (!userId) {
          console.error("No valid user ID found");
          setLoadingPosts(false);
          return;
        }

        const q = query(
          collection(db, "posts"),
          where("userId", "==", userId),
          where("isDeleted", "==", false),
          orderBy("createdAt", "desc"),
          limit(POSTS_PER_PAGE)
        )

        const snapshot = await getDocs(q)
        
        const posts = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            userName: data.userName || "User",
            userPhotoURL: data.userPhotoURL || "",
            content: data.content || "",
            createdAt: data.createdAt,
            postType: data.postType,
            category: data.category,
            likesCount: data.likesCount || 0,
            commentsCount: data.commentsCount || 0,
            shares: data.shares || 0,
            imageUrl: data.imageUrl,
            youtubeVideoId: data.youtubeVideoId,
            youtubeThumbnail: data.youtubeThumbnail,
            mediaType: data.mediaType,
            likes: data.likes || [],
            isSaved: false
          }
        })

        setUserPosts(posts)
        
        if (snapshot.docs.length > 0) {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1])
          setHasMore(snapshot.docs.length === POSTS_PER_PAGE)
        } else {
          setHasMore(false)
        }

      } catch (error) {
        console.error("Error loading posts:", error)
      } finally {
        setLoadingPosts(false)
      }
    }

    loadInitialPosts()
  }, [user])

  // Load more posts for infinite scrolling
  const loadMorePosts = useCallback(async () => {
    if (!user || !lastVisible || loadingMore || !hasMore) return

    setLoadingMore(true)

    try {
      const userId = user.uid || user.id

      const q = query(
        collection(db, "posts"),
        where("userId", "==", userId),
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(POSTS_PER_PAGE)
      )

      const snapshot = await getDocs(q)

      const newPosts = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          userName: data.userName || "User",
          userPhotoURL: data.userPhotoURL || "",
          content: data.content || "",
          createdAt: data.createdAt,
          postType: data.postType,
          category: data.category,
          likesCount: data.likesCount || 0,
          commentsCount: data.commentsCount || 0,
          shares: data.shares || 0,
          imageUrl: data.imageUrl,
          youtubeVideoId: data.youtubeVideoId,
          youtubeThumbnail: data.youtubeThumbnail,
          mediaType: data.mediaType,
          likes: data.likes || [],
          isSaved: false
        }
      })

      setUserPosts(prev => [...prev, ...newPosts])
      
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1])
        setHasMore(snapshot.docs.length === POSTS_PER_PAGE)
      } else {
        setHasMore(false)
      }

    } catch (error) {
      console.error("Error loading more posts:", error)
    } finally {
      setLoadingMore(false)
    }
  }, [user, lastVisible, loadingMore, hasMore])

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loadingPosts) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [loadingPosts, hasMore, loadingMore, loadMorePosts])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        Not logged in
      </div>
    )
  }

  const enhancedProfile = {
    ...user,
    posts: userPosts.length,
    following: user.following || []
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 relative">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"/>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full"/>
      </div>

      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 max-w-[1500px] mx-auto pt-[10px] px-6 pb-10">
        
        <div className="flex gap-6">
          
          {/* PANEL 1: SIDEBAR - STICKY */}
          <aside className="w-[230px] hidden md:block">
            <div className="sticky top-[90px] backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <ProfileSidebar />
            </div>
          </aside>

          {/* RIGHT SIDE - ALL CONTENT */}
          <div className="flex-1 space-y-6 min-w-0">

            {/* PANEL 2: PROFILE HEADER - SCROLLS */}
            <section className="backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <ProfileHeader profile={enhancedProfile} />
            </section>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6">
              
              {/* PANEL 3: FOLLOWING - STICKY AT NAVBAR */}
              <section className="relative">
                <div 
                  className="sticky backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6"
                  style={{ top: '90px' }}
                >
                  <FollowingList 
                    userId={user.uid || user.id}
                    isOwner={true}
                  />
                </div>
              </section>

              {/* PANEL 4: POSTS */}
              <section className="space-y-4">
                
                {/* Title */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white/90">My Community Posts</h2>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                    {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'}
                  </span>
                </div>
                
                {/* Loading state */}
                {loadingPosts ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin h-8 w-8 border-b-2 border-purple-500 rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {/* Posts */}
                    {userPosts.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-slate-400">No posts yet</p>
                        <p className="text-xs text-slate-500 mt-2">Create your first post to share with the community!</p>
                      </div>
                    ) : (
                      <UserPosts posts={userPosts} />
                    )}
                    
                    {/* Load more trigger */}
                    <div ref={loadMoreRef} className="w-full py-4 flex justify-center">
                      {loadingMore && (
                        <div className="animate-spin h-6 w-6 border-b-2 border-purple-500 rounded-full"></div>
                      )}
                      {!hasMore && userPosts.length > 0 && (
                        <p className="text-xs text-gray-500">No more posts to load</p>
                      )}
                    </div>
                  </>
                )}
              </section>

            </div>

          </div>

        </div>

      </main>

    </div>
  )
}