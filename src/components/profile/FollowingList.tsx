'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { db } from '#/lib/firebase'
import { doc, updateDoc, arrayRemove, onSnapshot, getDoc } from 'firebase/firestore'
import { useAuth } from '#/context/AuthContext'
import { useRouter } from 'next/navigation'

interface FollowingUser {
  id: string
  userId: string
  username: string
  name?: string
  avatar?: string
  photoURL?: string
  email?: string
}

interface FollowingListProps {
  userId?: string
  isOwner?: boolean
}

export default function FollowingList({ userId, isOwner = true }: FollowingListProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [following, setFollowing] = useState<FollowingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null)

  // Real-time listener for following list
  useEffect(() => {
    const targetUserId = userId || user?.uid
    if (!targetUserId) return

    const userRef = doc(db, 'users', targetUserId)
    
    const unsubscribe = onSnapshot(userRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data()
        const followingIds: string[] = userData.following || []
        
        // Fetch full details of each followed user
        const followingUsers: FollowingUser[] = []
        
        for (const followingId of followingIds) {
          const followingUserRef = doc(db, 'users', followingId)
          const followingUserSnap = await getDoc(followingUserRef)
          
          if (followingUserSnap.exists()) {
            const followingData = followingUserSnap.data()
            followingUsers.push({
              id: followingId,
              userId: followingId,
              username: followingData.username || followingData.name || followingId,
              name: followingData.name || followingData.displayName,
              avatar: followingData.avatar || followingData.photoURL,
              email: followingData.email
            })
          }
        }
        
        setFollowing(followingUsers)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [userId, user?.uid])

  const handleUnfollow = async (targetUserId: string) => {
    if (!user?.uid) return

    setUnfollowingId(targetUserId)
    
    try {
      const currentUserRef = doc(db, 'users', user.uid)
      const targetUserRef = doc(db, 'users', targetUserId)

      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
      })
      await updateDoc(targetUserRef, {
        followers: arrayRemove(user.uid)
      })
    } catch (error) {
      console.error('Error unfollowing:', error)
      alert('Failed to unfollow user')
    } finally {
      setUnfollowingId(null)
    }
  }

  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  const filteredUsers = following.filter(userItem =>
    (userItem.username || userItem.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 size={24} className="animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Following</h2>
        <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
          {following.length} {following.length === 1 ? 'user' : 'users'}
        </span>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
        />
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((userItem) => (
            <div 
              key={userItem.id} 
              className="flex items-center justify-between"
            >
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => navigateToProfile(userItem.userId)}
              >
                <img 
                  src={userItem.avatar || "/default-avatar.png"} 
                  className="w-10 h-10 rounded-full object-cover" 
                  alt={userItem.username}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png"
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-200">
                    {userItem.username || userItem.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    @{(userItem.username || userItem.name || '').toLowerCase()}
                  </p>
                </div>
              </div>
              
              {isOwner && (
                <button
                  onClick={() => handleUnfollow(userItem.userId)}
                  disabled={unfollowingId === userItem.userId}
                  className="bg-zinc-800 text-white text-[12px] font-bold px-4 py-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {unfollowingId === userItem.userId ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    'Unfollow'
                  )}
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              {searchTerm ? "No users found" : "You're not following anyone yet"}
            </p>
            {!searchTerm && (
              <p className="text-xs text-gray-600 mt-2">
                Follow users to see them here
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}