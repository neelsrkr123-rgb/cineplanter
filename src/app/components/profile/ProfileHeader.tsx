// src/components/profile/ProfileHeader.tsx
'use client'

import { useState, useEffect } from "react"
import { Settings, Edit2, CheckCircle, MapPin, Upload, Briefcase, Award, UserPlus, UserCheck, Loader2 } from "lucide-react"
import { FaFacebook, FaInstagram } from "react-icons/fa"
import { useAuth } from "#/context/AuthContext"
import { useRouter } from "next/navigation"
import { uploadToCloudinary, getOptimizedImageUrl } from "#/lib/cloudinary"
import { db } from "#/lib/firebase"
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, onSnapshot, collection, query, where, getCountFromServer } from "firebase/firestore"

// অফিসিয়াল Gmail চেক করার জন্য
const OFFICIAL_EMAIL = "cineplanter@gmail.com"

export default function ProfileHeader({ profile: initialProfile }: { profile: any }) {

const { user, updateUserData } = useAuth()
const router = useRouter()

const [profile, setProfile] = useState(initialProfile)
const [editing, setEditing] = useState(false)
const [uploading, setUploading] = useState(false)
const [isFollowing, setIsFollowing] = useState(false)
const [followingLoading, setFollowingLoading] = useState(false)
const [followersCount, setFollowersCount] = useState(initialProfile?.followers?.length || 0)
const [followingCount, setFollowingCount] = useState(initialProfile?.following?.length || 0)
const [postsCount, setPostsCount] = useState(0)
const [preview, setPreview] = useState("")
const [avatarKey, setAvatarKey] = useState(Date.now())

const roles = [
"cinematographer", "writer", "director", "video editor", "photo editor",
"photographer", "actor", "actress", "model", "animator", "graphic designer",
"music producer", "ai artist", "movie lover"
]

const [form, setForm] = useState({
avatar: initialProfile?.avatar || "",
username: initialProfile?.username || "",
bio: initialProfile?.bio || "",
title: initialProfile?.title || "",
facebook: initialProfile?.socials?.facebook || "",
instagram: initialProfile?.socials?.instagram || ""
})

// Fetch posts count from Firestore
useEffect(() => {
  if (!profile?.id) return;
  
  const fetchPostsCount = async () => {
    try {
      const postsQuery = query(
        collection(db, "posts"),
        where("userId", "==", profile.id),
        where("isDeleted", "==", false)
      );
      const snapshot = await getCountFromServer(postsQuery);
      setPostsCount(snapshot.data().count);
    } catch (error) {
      console.error("Error fetching posts count:", error);
      // Fallback to profile.posts if available
      setPostsCount(profile?.posts || 0);
    }
  };
  
  fetchPostsCount();
  
  // Real-time listener for posts count
  const postsQuery = query(
    collection(db, "posts"),
    where("userId", "==", profile.id),
    where("isDeleted", "==", false)
  );
  
  const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
    setPostsCount(snapshot.size);
  });
  
  return () => unsubscribe();
}, [profile?.id]);

// Real-time listener for profile updates
useEffect(() => {
  if (!profile?.id) return;
  const userRef = doc(db, 'users', profile.id);
  const unsubscribe = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      setProfile(prev => ({ ...prev, avatar: data.avatar, username: data.username, bio: data.bio, title: data.title, socials: data.socials, followers: data.followers || [], following: data.following || [] }));
      setFollowersCount(data.followers?.length || 0);
      setFollowingCount(data.following?.length || 0);
      setAvatarKey(Date.now());
      if (!editing) {
        setForm(prev => ({ ...prev, avatar: data.avatar || prev.avatar, username: data.username || prev.username, bio: data.bio || prev.bio, title: data.title || prev.title, facebook: data.socials?.facebook || prev.facebook, instagram: data.socials?.instagram || prev.instagram }));
      }
    }
  });
  return () => unsubscribe();
}, [profile?.id, editing]);

const isFreelancer = profile?.profileType === "freelancer"
const isOfficial = profile?.email === OFFICIAL_EMAIL
const isOwnProfile = user?.id === profile?.id || user?.uid === profile?.id

// Check if current user is following this profile
useEffect(() => {
  const checkFollowStatus = async () => {
    if (!user?.uid || isOwnProfile) return
    try {
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const following = userSnap.data().following || []
        setIsFollowing(following.includes(profile?.id))
      }
    } catch (error) { console.error(error) }
  }
  checkFollowStatus()
}, [user?.uid, profile?.id, isOwnProfile])

// Update counts when profile changes
useEffect(() => {
  setFollowersCount(profile?.followers?.length || 0)
  setFollowingCount(profile?.following?.length || 0)
}, [profile?.followers, profile?.following])

const handleFollow = async () => {
  if (!user?.uid) {
    router.push('/auth/signin')
    return
  }
  if (!profile?.id) return
  setFollowingLoading(true)
  try {
    const currentUserRef = doc(db, 'users', user.uid)
    const targetUserRef = doc(db, 'users', profile.id)
    if (isFollowing) {
      await updateDoc(currentUserRef, { following: arrayRemove(profile.id) })
      await updateDoc(targetUserRef, { followers: arrayRemove(user.uid) })
      setIsFollowing(false)
      setFollowersCount(prev => prev - 1)
    } else {
      await updateDoc(currentUserRef, { following: arrayUnion(profile.id) })
      await updateDoc(targetUserRef, { followers: arrayUnion(user.uid) })
      setIsFollowing(true)
      setFollowersCount(prev => prev + 1)
    }
  } catch (error) { console.error(error); alert('Failed to update follow status') }
  finally { setFollowingLoading(false) }
}

const handleChange = (e: any) => {
setForm({ ...form, [e.target.name]: e.target.value })
}

const upgradeToFreelancer = () => router.push('/profile/freelancer')
const goToFreelancerDashboard = () => router.push('/profile/freelancer')

// FIXED: uploadAvatar function with preview
const uploadAvatar = async (file: File) => {
  try {
    setUploading(true)
    
    // Create preview URL for immediate UI update
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder: "avatars",
      tags: ["avatar"]
    })
    
    // Set the real Cloudinary URL
    setForm(prev => ({ ...prev, avatar: result.url }))
    setAvatarKey(Date.now())
    
    // Also update the user profile in Firestore
    await updateUserData({ avatar: result.url, photoURL: result.url })
    
    // Clean up preview URL
    URL.revokeObjectURL(previewUrl)
    setPreview("")
  } catch(err) {
    console.error(err)
    alert("Failed to upload avatar. Please try again.")
  } finally {
    setUploading(false)
  }
}

const saveProfile = async () => {
  await updateUserData({
    avatar: form.avatar,
    username: form.username,
    bio: form.bio,
    title: form.title,
    socials: { facebook: form.facebook, instagram: form.instagram }
  })
  setEditing(false)
  setAvatarKey(Date.now())
}

const getAvatarUrl = () => {
  if (preview) return preview
  if (form.avatar) {
    return getOptimizedImageUrl(form.avatar, {
      width: 300,
      height: 300,
      crop: "fill",
      quality: "auto",
      format: "auto"
    })
  }
  return "/default-avatar.png"
}

return (
<div className="flex flex-col lg:flex-row justify-between gap-6">
  {/* LEFT */}
  <div className="flex gap-8">
    {/* AVATAR */}
    <div className="relative">
      <img
        key={avatarKey}
        src={getAvatarUrl()}
        className="w-36 h-36 rounded-full object-cover border-2 border-purple-500/30"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/default-avatar.png"
        }}
      />
      {editing && (
        <label className="absolute bottom-0 w-full bg-black/70 text-xs text-center py-1 cursor-pointer flex items-center justify-center gap-1 rounded-b-full">
          <Upload size={12} />
          {uploading ? "Uploading..." : "Change"}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e: any) => {
              const file = e.target.files?.[0]
              if (file) uploadAvatar(file)
            }}
          />
        </label>
      )}
    </div>

    {/* PROFILE INFO */}
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {editing ? (
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="bg-zinc-900 px-3 py-1 rounded text-xl font-bold text-white"
          />
        ) : (
          <h1 className="text-3xl font-bold flex items-center gap-1 text-white">
            {profile?.username || profile?.name}
            {isOfficial && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#d13af7]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </h1>
        )}
        
        {/* Follow Button - Only for other users */}
        {!isOwnProfile && (
          <button
            onClick={handleFollow}
            disabled={followingLoading}
            className={`ml-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              isFollowing 
                ? 'bg-zinc-800 text-slate-300 hover:bg-red-500/20 hover:text-red-400' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } disabled:opacity-50`}
          >
            {followingLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : isFollowing ? (
              'Following'
            ) : (
              'Follow'
            )}
          </button>
        )}
      </div>

      <p className="text-slate-400 text-sm">{profile?.email}</p>

      {/* STATS - Fixed with real posts count */}
      <div className="flex gap-8 mt-4">
        <div className="text-center">
          <b className="text-white text-xl">{postsCount}</b>
          <p className="text-xs text-slate-400">posts</p>
        </div>
        <div className="text-center">
          <b className="text-white text-xl">{followersCount}</b>
          <p className="text-xs text-slate-400">followers</p>
        </div>
        <div className="text-center">
          <b className="text-white text-xl">{followingCount}</b>
          <p className="text-xs text-slate-400">following</p>
        </div>
      </div>

      {/* BIO + ROLE */}
      <div className="mt-4 space-y-3">
        {editing ? (
          <>
            {/* ROLE LIST */}
            <div>
              <p className="text-xs text-slate-400 mb-2">Select your role</p>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => {
                  const selected = form.title === role
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({ ...form, title: role })}
                      className={`px-3 py-1 text-xs rounded-full transition ${
                        selected ? "bg-blue-600 text-white" : "bg-zinc-900 hover:bg-zinc-800 text-slate-300"
                      }`}
                    >
                      {role}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* BIO */}
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Bio"
              rows={3}
              className="bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-white w-full"
            />
          </>
        ) : (
          <>
            {profile?.title && (
              <div>
                <span className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full">
                  #{profile.title}
                </span>
              </div>
            )}
            {profile?.bio && (
              <p className="text-sm text-slate-300 max-w-md">{profile.bio}</p>
            )}
          </>
        )}
      </div>
    </div>
  </div>

  {/* RIGHT */}
  <div className="flex flex-col items-end gap-4">
    <div className="flex gap-2">
      {isFreelancer ? (
        <button
          onClick={goToFreelancerDashboard}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm flex items-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <Award size={16} />
          <span>Freelancer Dashboard</span>
        </button>
      ) : (
        <button
          onClick={upgradeToFreelancer}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm flex items-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <Briefcase size={16} />
          <span>Become a Freelancer</span>
        </button>
      )}

      {editing ? (
        <button onClick={saveProfile} className="px-4 py-2 bg-green-600 rounded-lg text-sm">Save</button>
      ) : (
        <button onClick={() => setEditing(true)} className="px-4 py-2 bg-zinc-900 rounded-lg flex items-center gap-2">
          <Edit2 size={16} />
          Edit Profile
        </button>
      )}

      <button className="p-2 bg-zinc-900 rounded-lg">
        <Settings size={18} />
      </button>
    </div>

    {/* SOCIAL */}
    {editing ? (
      <div className="flex flex-col gap-2 w-full">
        <input
          name="facebook"
          value={form.facebook}
          onChange={handleChange}
          placeholder="Facebook URL"
          className="bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-sm text-white"
        />
        <input
          name="instagram"
          value={form.instagram}
          onChange={handleChange}
          placeholder="Instagram URL"
          className="bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-sm text-white"
        />
      </div>
    ) : (
      <div className="flex gap-4">
        {profile?.socials?.facebook && (
          <a href={profile.socials.facebook} target="_blank" rel="noopener noreferrer">
            <FaFacebook size={20} />
          </a>
        )}
        {profile?.socials?.instagram && (
          <a href={profile.socials.instagram} target="_blank" rel="noopener noreferrer">
            <FaInstagram size={20} />
          </a>
        )}
      </div>
    )}
  </div>
</div>
)
}