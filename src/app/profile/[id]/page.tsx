// src/app/profile/[id]/page.tsx
'use client';

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, updateDoc, arrayUnion, arrayRemove, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "#/lib/firebase";
import Navbar from "#/components/Navbar";
import { useRouter } from "next/navigation";
import { useAuth } from "#/context/AuthContext";
import { 
  MapPin, Mail, Phone, User, Briefcase, Star, Clock, DollarSign, Award,
  UserPlus, UserCheck, Loader2, MoreHorizontal, Share, Flag, Ban, 
  Globe, Github, Linkedin, Film, Folder, GraduationCap, CreditCard, 
  Facebook, Instagram, Twitter, Heart, MessageSquare, BookOpen, ShoppingBag, Search, MessageCircle, IdCard
} from 'lucide-react';
import Link from "next/link";

const OFFICIAL_EMAIL = "cineplanter@gmail.com";

interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email?: string;
  bio?: string;
  location?: string;
  photoURL?: string;
  avatar?: string;
  profileType?: string;
  followers?: string[];
  following?: string[];
  title?: string;
  createdAt?: any;
  posts?: number;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  freelancerProfile?: {
    title?: string;
    bio?: string;
    skills?: string[];
    hourlyRate?: number;
    experience?: string;
    location?: string;
    phone?: string;
    website?: string;
    github?: string;
    linkedin?: string;
    rating?: string;
    successRate?: string;
    portfolio?: any[];
    education?: any[];
    languages?: any[];
  };
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [view, setView] = useState<'freelancer' | 'normal'>('freelancer');
  const [searchTerm, setSearchTerm] = useState('');
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
  const router = useRouter();

  const normalMenu = [
    { icon: User, label: "Profile Info", href: "#" },
    { icon: Film, label: "My Movies", href: "#" },
    { icon: Folder, label: "My Products", href: "#" },
    { icon: GraduationCap, label: "My Courses", href: "#" }
  ];

  const freelancerMenu = [
    { icon: User, label: "Profile Info", href: "#" },
    { icon: Film, label: "My Movies", href: "#" },
    { icon: Folder, label: "My Products", href: "#" },
    { icon: GraduationCap, label: "My Courses", href: "#" },
    { icon: Star, label: "Public Reviews", href: "#" },
    { icon: CreditCard, label: "Payment Method", href: "#" },
    { icon: DollarSign, label: "Earnings", href: "#" }
  ];

  // ✅ Next.js 15 এর জন্য params await
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);
    };
    unwrapParams();
  }, [params]);

  const getCurrentUserId = () => {
    return currentUser?.id || (currentUser as any)?.uid;
  };

  const handleMessage = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      router.push('/auth');
      return;
    }
    if (!userId) return;
    if (currentUserId === userId) {
      alert("You cannot message yourself");
      return;
    }
    
    setMessageLoading(true);
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', currentUserId)
      );
      const snapshot = await getDocs(q);
      
      let existingConversation: { id: string; participants: string[] } | null = null;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants && data.participants.includes(userId)) {
          existingConversation = { 
            id: doc.id, 
            participants: data.participants 
          };
        }
      });
      
      if (existingConversation) {
        alert("Conversation exists! Messages feature coming soon.");
      } else {
        const newConversation = {
          participants: [currentUserId, userId],
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
          lastMessageSender: "",
          unreadCount: { [currentUserId]: 0, [userId]: 0 },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isPinned: false,
          isMarkedUnread: false
        };
        
        await addDoc(collection(db, "conversations"), newConversation);
        alert("Conversation created! Messages feature coming soon.");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setMessageLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "users", userId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const userData = snap.data();
          setProfile({
            id: snap.id,
            name: userData.name || "User",
            username: userData.username || "",
            email: userData.email || "",
            bio: userData.bio || "",
            location: userData.location || "",
            photoURL: userData.avatar || userData.photoURL || "",
            profileType: userData.profileType || "normal",
            followers: userData.followers || [],
            following: userData.following || [],
            title: userData.title || "",
            createdAt: userData.createdAt,
            posts: userData.posts || 0,
            socials: userData.socials || {},
            freelancerProfile: userData.freelancerProfile || {}
          });

          const currentUserId = getCurrentUserId();
          if (currentUserId) {
            const followers = userData.followers || [];
            setIsFollowing(followers.includes(currentUserId));
          }

          const postsQuery = query(
            collection(db, "posts"),
            where("userId", "==", userId),
            where("isDeleted", "==", false),
            orderBy("createdAt", "desc"),
            limit(20)
          );
          const postsSnap = await getDocs(postsQuery);
          const userPosts = postsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPosts(userPosts);
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, currentUser, router]);

  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(userRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const followingIds: string[] = userData.following || [];
        
        const followingUsersList: any[] = [];
        
        for (const followingId of followingIds) {
          const followingUserRef = doc(db, 'users', followingId);
          const followingUserSnap = await getDoc(followingUserRef);
          
          if (followingUserSnap.exists()) {
            const followingData = followingUserSnap.data();
            followingUsersList.push({
              id: followingId,
              userId: followingId,
              name: followingData.name || "User",
              username: followingData.username || followingId,
              photoURL: followingData.avatar || followingData.photoURL,
              email: followingData.email
            });
          }
        }
        
        setFollowingUsers(followingUsersList);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleFollow = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      router.push('/auth');
      return;
    }

    if (!userId) return;

    setFollowingLoading(true);
    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      const targetUserRef = doc(db, 'users', userId);

      if (isFollowing) {
        await updateDoc(currentUserRef, { following: arrayRemove(userId) });
        await updateDoc(targetUserRef, { followers: arrayRemove(currentUserId) });
        setIsFollowing(false);
      } else {
        await updateDoc(currentUserRef, { following: arrayUnion(userId) });
        await updateDoc(targetUserRef, { followers: arrayUnion(currentUserId) });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      alert('Failed to update follow status');
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    setUnfollowingId(targetUserId);
    
    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      const targetUserRef = doc(db, 'users', targetUserId);

      await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
      await updateDoc(targetUserRef, { followers: arrayRemove(currentUserId) });
    } catch (error) {
      console.error('Error unfollowing:', error);
    } finally {
      setUnfollowingId(null);
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${userId}`;
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: `${profile?.name}'s Profile`, 
          text: `Check out ${profile?.name}'s profile on CinePlanter!`, 
          url: profileUrl 
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        alert('Profile link copied!');
      }
      setShowMenu(false);
    } catch (error) { console.error('Error sharing:', error); }
  };

  const handleReport = () => { alert('Report user'); setShowMenu(false); };
  const handleBlock = () => { 
    if (confirm('Block this user?')) { 
      alert('User blocked'); 
      setShowMenu(false); 
    } 
  };

  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const formatPostDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate?.() || new Date(timestamp);
    const diffDays = Math.floor((new Date().getTime() - date.getTime()) / 86400000);
    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isFreelancer = profile?.profileType === "freelancer";
  const freelancerData = profile?.freelancerProfile || {};
  const isOfficial = profile?.email === OFFICIAL_EMAIL;
  const isOwnProfile = getCurrentUserId() === userId;
  const socials = profile?.socials || {};

  const displayLocation = (() => {
    if (isFreelancer && freelancerData.location) return freelancerData.location;
    if (profile?.location) return profile.location;
    return null;
  })();

  const filteredFollowing = followingUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <Link href="/" className="mt-4 inline-block text-purple-400">Go back home</Link>
        </div>
      </div>
    );
  }

  const currentMenu = isFreelancer && view === 'freelancer' ? freelancerMenu : normalMenu;

  return (
    <div className="min-h-screen bg-[#050505] text-white relative">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <Navbar />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MOBILE VIEW — Center aligned, glass morph                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <main className="lg:hidden relative z-10 pt-24 px-4 pb-10">
        {/* Glass morph container */}
        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative">

          {/* ✅ 3-dot menu — ekebare upore right এ */}
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal size={20} className="text-gray-300" />
            </button>

            {showMenu && (
              <>
                {/* Outside click to close */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                />
                
                {/* Dropdown menu */}
                <div className="absolute right-0 top-12 z-50 w-56 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl overflow-hidden">
                  <button 
                    onClick={handleShare} 
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <Share size={16} /> Share Profile
                  </button>
                  <button 
                    onClick={handleReport} 
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <Flag size={16} /> Report User
                  </button>
                  <button 
                    onClick={handleBlock} 
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Ban size={16} /> Block User
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ─── AVATAR (center) ─── */}
          <div className="flex justify-center mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 border-4 border-white/10 ring-4 ring-purple-500/10 flex items-center justify-center">
              {profile.photoURL ? (
                <img 
                  src={profile.photoURL} 
                  alt={profile.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User size={40} className="text-white" />
              )}
            </div>
          </div>

          {/* ─── USERNAME (center) ─── */}
          <div className="text-center mb-1">
            <h1 className="text-2xl font-bold text-white inline-flex items-center gap-1.5">
              {profile.username || profile.name}
              {isOfficial && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d13af7]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </h1>
          </div>

          {/* ─── ROLE (center) ─── */}
          {(freelancerData.title || profile.title) && (
            <div className="text-center mb-4">
              <span className="text-sm text-purple-400 font-medium">
                {freelancerData.title || profile.title}
              </span>
            </div>
          )}

          {/* ─── STATS (center) ─── */}
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-center">
              <b className="text-white text-lg">{posts.length}</b>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Posts</p>
            </div>
            <div className="text-center">
              <b className="text-white text-lg">{profile.followers?.length || 0}</b>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Followers</p>
            </div>
            <div className="text-center">
              <b className="text-white text-lg">{profile.following?.length || 0}</b>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Following</p>
            </div>
          </div>

          {/* ─── BIO (center) ─── */}
          {profile.bio && (
            <div className="text-center mb-4 px-2">
              <p className="text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* ─── FOLLOW + MESSAGE ─── */}
          {!isOwnProfile && (
            <div className="flex justify-center gap-3 mb-4">
              <button 
                onClick={handleFollow} 
                disabled={followingLoading} 
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                  isFollowing 
                    ? 'bg-zinc-800 text-slate-300 hover:bg-red-500/20 hover:text-red-400' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
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

              <button
                onClick={handleMessage}
                disabled={messageLoading}
                className="px-5 py-2 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {messageLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <MessageCircle size={14} />
                    <span>Message</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ─── SOCIAL LINKS ─── */}
          {(socials.facebook || socials.instagram || socials.twitter || socials.youtube) && (
            <div className="flex justify-center gap-4 pt-4 border-t border-white/10">
              {socials.facebook && (
                <a 
                  href={socials.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-blue-500/20 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
              )}
              {socials.instagram && (
                <a 
                  href={socials.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-pink-500/20 flex items-center justify-center text-gray-400 hover:text-pink-500 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
              )}
              {socials.twitter && (
                <a 
                  href={socials.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-blue-400/20 flex items-center justify-center text-gray-400 hover:text-blue-400 transition-all"
                  aria-label="Twitter"
                >
                  <Twitter size={18} />
                </a>
              )}
              {socials.youtube && (
                <a 
                  href={socials.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"
                  aria-label="YouTube"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* POSTS SECTION — below                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-6 backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Posts</h2>
            <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
          </div>

          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="bg-white/[0.02] border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 overflow-hidden">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-white font-bold block text-center leading-6">
                          {profile.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatPostDate(post.createdAt)}</span>
                    {post.postType && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        {post.postType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-3">{post.content}</p>
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="Post" className="mt-2 rounded-lg max-h-40 object-cover w-full" />
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Heart size={12} /> {post.likesCount || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.commentsCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 text-sm">No posts yet</p>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DESKTOP VIEW — unchanged                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <main className="hidden lg:block relative z-10 max-w-[1500px] mx-auto pt-[10px] px-6 pb-10">
        <div className="flex gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="w-[230px]">
            <div className="sticky top-[90px] backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <div className="flex flex-col text-sm">
                <p className="text-white font-semibold text-lg mb-6">Menu</p>
                <div className="space-y-5">
                  {currentMenu.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition">
                        <Icon size={20} />
                        <span className="text-[15px] font-medium">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* PROFILE HEADER */}
            <div className="backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex gap-8">
                  <div className="relative">
                    <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} className="text-white" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                      {isOfficial && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d13af7]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17L4 12" />
                          </svg>
                        </span>
                      )}
                      {profile.username && <p className="text-gray-400 text-sm">@{profile.username}</p>}
                      
                      <div className="flex items-center gap-2 ml-2">
                        <button 
                          onClick={handleFollow} 
                          disabled={followingLoading} 
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isFollowing 
                              ? 'bg-zinc-800 text-slate-300 hover:bg-red-500/20 hover:text-red-400' 
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          } disabled:opacity-50`}
                        >
                          {followingLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : isFollowing ? 'Following' : 'Follow'}
                        </button>
                        
                        {!isOwnProfile && (
                          <button
                            onClick={handleMessage}
                            disabled={messageLoading}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            {messageLoading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <>
                                <MessageCircle size={12} />
                                <span>Message</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {!isFreelancer && (
                      <p className="text-slate-400 text-sm">{profile.email}</p>
                    )}

                    {isFreelancer && view === 'freelancer' ? (
                      <div className="flex gap-6 mt-4">
                        <div className="text-center">
                          <b className="text-white text-xl">{profile.followers?.length || 0}</b>
                          <p className="text-xs text-slate-400">followers</p>
                        </div>
                        <div className="text-center">
                          <b className="text-white text-xl">{profile.following?.length || 0}</b>
                          <p className="text-xs text-slate-400">following</p>
                        </div>
                        <div className="text-center">
                          <b className="text-white text-xl">{freelancerData.successRate || '0%'}</b>
                          <p className="text-xs text-slate-400">success rate</p>
                        </div>
                        <div className="text-center">
                          <b className="text-white text-xl">{freelancerData.rating || '0.0'}</b>
                          <p className="text-xs text-slate-400">rating</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-6 mt-4">
                        <div className="text-center">
                          <b className="text-white text-xl">{posts.length}</b>
                          <p className="text-xs text-slate-400">posts</p>
                        </div>
                        <div className="text-center">
                          <b className="text-white text-xl">{profile.followers?.length || 0}</b>
                          <p className="text-xs text-slate-400">followers</p>
                        </div>
                        <div className="text-center">
                          <b className="text-white text-xl">{profile.following?.length || 0}</b>
                          <p className="text-xs text-slate-400">following</p>
                        </div>
                      </div>
                    )}

                    {isFreelancer && freelancerData.title && (
                      <div className="mt-2">
                        <span className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full">
                          #{freelancerData.title}
                        </span>
                      </div>
                    )}

                    {profile.bio && (
                      <p className="text-sm text-slate-300 mt-4 max-w-md">{profile.bio}</p>
                    )}
                    
                    {!isFreelancer && profile.title && (
                      <div className="mt-2">
                        <span className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full">
                          #{profile.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex gap-2">
                    {isFreelancer && (
                      <button 
                        onClick={() => setView(view === 'freelancer' ? 'normal' : 'freelancer')} 
                        className={`px-4 py-2 rounded-lg text-sm ${
                          view === 'normal' 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <User size={16} className="inline mr-1" /> 
                        {view === 'freelancer' ? 'Social Profile' : 'Freelancer Profile'}
                      </button>
                    )}

                    {isFreelancer && view === 'freelancer' && (
                      <Link 
                        href={`/profile/${userId}/id-card`} 
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm"
                      >
                        <IdCard size={16} className="inline mr-1" /> ID Card
                      </Link>
                    )}
                    
                    <div className="relative">
                      <button 
                        onClick={() => setShowMenu(!showMenu)} 
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      {showMenu && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowMenu(false)}
                          />
                          <div className="absolute right-0 top-12 z-50 w-56 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl overflow-hidden">
                            <button onClick={handleShare} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                              <Share size={16} /> Share Profile
                            </button>
                            <button onClick={handleReport} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                              <Flag size={16} /> Report User
                            </button>
                            <button onClick={handleBlock} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                              <Ban size={16} /> Block User
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {displayLocation && (
                    <div className="flex items-center justify-end gap-2 text-gray-400 text-sm mt-1 pt-2 border-t border-white/10">
                      <span>{displayLocation}</span>
                      <MapPin size={14} className="flex-shrink-0" />
                    </div>
                  )}

                  <div className="w-full space-y-2 mt-1">
                    {profile.email && (
                      <a 
                        href={`mailto:${profile.email}`}
                        className="flex items-center justify-end gap-2 text-gray-400 text-sm hover:text-purple-400 transition-colors group"
                      >
                        <span className="truncate group-hover:underline">{profile.email}</span>
                        <Mail size={14} className="flex-shrink-0" />
                      </a>
                    )}
                    {isFreelancer && freelancerData.phone && (
                      <a 
                        href={`tel:${freelancerData.phone.replace(/\s+/g, '')}`}
                        className="flex items-center justify-end gap-2 text-gray-400 text-sm hover:text-purple-400 transition-colors group"
                      >
                        <span className="group-hover:underline">{freelancerData.phone}</span>
                        <Phone size={14} className="flex-shrink-0" />
                      </a>
                    )}
                  </div>

                  {(socials.facebook || socials.instagram || socials.twitter) && (
                    <div className="flex gap-3 mt-1 pt-2 border-t border-white/10">
                      {socials.facebook && (
                        <a 
                          href={socials.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-500 transition-colors hover:scale-110 transform duration-200"
                        >
                          <Facebook size={18} />
                        </a>
                      )}
                      {socials.instagram && (
                        <a 
                          href={socials.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-pink-500 transition-colors hover:scale-110 transform duration-200"
                        >
                          <Instagram size={18} />
                        </a>
                      )}
                      {socials.twitter && (
                        <a 
                          href={socials.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-400 transition-colors hover:scale-110 transform duration-200"
                        >
                          <Twitter size={18} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(!isFreelancer || view === 'normal') ? (
                <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Following</h2>
                    <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
                      {followingUsers.length} {followingUsers.length === 1 ? 'user' : 'users'}
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
                    {filteredFollowing.length > 0 ? (
                      filteredFollowing.map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => navigateToProfile(user.userId)}
                          >
                            <img 
                              src={user.photoURL || "/default-avatar.png"} 
                              className="w-10 h-10 rounded-full object-cover" 
                              alt={user.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/default-avatar.png"
                              }}
                            />
                            <div>
                              <p className="text-sm font-bold text-slate-200">{user.name}</p>
                              <p className="text-xs text-gray-500">@{user.username}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnfollow(user.userId)}
                            disabled={unfollowingId === user.userId}
                            className="bg-zinc-800 text-white text-[12px] font-bold px-4 py-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {unfollowingId === user.userId ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              'Unfollow'
                            )}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">
                          {searchTerm ? "No users found" : "No following users"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {(freelancerData.skills && freelancerData.skills.length > 0 
                      ? freelancerData.skills 
                      : ['video editing', 'photography', 'cinematography']
                    ).map((skill: string, index: number) => (
                      <span key={index} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!isFreelancer || view === 'normal') ? (
                <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">My Community Posts</h2>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                      {posts.length} posts
                    </span>
                  </div>
                  {posts.length > 0 ? (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {posts.map((post) => (
                        <div key={post.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 hover:border-purple-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 overflow-hidden">
                              {profile.photoURL ? (
                                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-white font-bold block text-center">
                                  {profile.name?.[0]?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{formatPostDate(post.createdAt)}</span>
                            {post.postType && (
                              <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                                {post.postType}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2 line-clamp-3">{post.content}</p>
                          {post.imageUrl && (
                            <img src={post.imageUrl} alt="Post" className="mt-2 rounded-lg max-h-40 object-cover w-full" />
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>❤️ {post.likesCount || 0}</span>
                            <span>💬 {post.commentsCount || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No posts yet</p>
                  )}
                </div>
              ) : (
                <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Portfolio</h2>
                  {(freelancerData.portfolio && freelancerData.portfolio.length > 0) ? (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {freelancerData.portfolio.map((item: any, index: number) => (
                        <div key={index} className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{item.client}</p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={12} 
                                    className={i < item.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'} 
                                  />
                                ))}
                                <span className="text-xs text-gray-400 ml-2">{item.rating}/5</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{item.date}</span>
                          </div>
                          <p className="text-sm text-gray-400">{item.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No portfolio items yet</p>
                  )}
                </div>
              )}
            </div>

            {isFreelancer && view === 'freelancer' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Languages Known</h2>
                  <div className="space-y-3">
                    {(freelancerData.languages && freelancerData.languages.length > 0 
                      ? freelancerData.languages 
                      : [
                          { name: 'Hindi', level: 'Native' },
                          { name: 'English', level: 'Fluent' }
                        ]
                    ).map((lang: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-300">{lang.name}</span>
                        <span className="text-sm text-purple-400 capitalize">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Education</h2>
                  <div className="space-y-3">
                    {(freelancerData.education && freelancerData.education.length > 0 
                      ? freelancerData.education 
                      : [
                          { degree: 'BA in Chinese', institution: 'Visva Bharati University', year: '2026' }
                        ]
                    ).map((edu: any, index: number) => (
                      <div key={index}>
                        <p className="font-semibold text-white">{edu.degree}</p>
                        <p className="text-sm text-gray-400">{edu.institution} · {edu.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(!isFreelancer || view === 'normal') && (
              <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-2">Review of You:</h3>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <p className="text-xs text-purple-400 font-medium mb-2">Outstanding User!</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Very Creative & Fun</li>
                    <li>• Asks Great Questions</li>
                    <li>• Always Polite & Friendly</li>
                  </ul>
                  <p className="text-xs text-purple-400 mt-2">Keep Up the Amazing Work! 😊</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}