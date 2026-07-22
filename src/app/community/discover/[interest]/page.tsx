// app/community/discover/[interest]/page.tsx
'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "#/context/AuthContext";
import Navbar from "#/components/Navbar";
import PostCard from "#/components/PostCard";
import { db } from "#/lib/firebase";
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, increment,
  collection, query, where, onSnapshot, limit, serverTimestamp,
  orderBy, getDocs
} from "firebase/firestore";
import {
  Users, Share2, MoreVertical, UserPlus, UserCheck,
  Loader2, TrendingUp, Clock, Hash, Camera, Edit3, Film, Video, 
  Palette, Star, Sparkles, Music, MessageCircle, Briefcase,
  Info, X, Home, Mail, Compass, Bookmark,
  Settings, LogOut, User, ImageIcon
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Interest data mapping with all categories
const INTEREST_MAP: Record<string, { 
  name: string; 
  description: string; 
  icon: any; 
  iconEmoji: string;
  color: string; 
  coverImage: string;
  rules: string[];
}> = {
  cinematography: {
    name: "Cinematography",
    description: "Discuss camera techniques, lighting, composition, and visual storytelling.",
    icon: Camera,
    iconEmoji: "🎥",
    color: "from-purple-600 to-pink-600",
    coverImage: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=300&fit=crop",
    rules: ["Share your work for constructive feedback", "Respect different styles and techniques"]
  },
  scriptwriting: {
    name: "Scriptwriting",
    description: "Story structure, dialogue, character development, and screenplay format.",
    icon: Edit3,
    iconEmoji: "✍️",
    color: "from-blue-600 to-cyan-600",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=300&fit=crop",
    rules: ["Share original work only", "Provide constructive feedback"]
  },
  direction: {
    name: "Direction",
    description: "Directing actors, blocking, shot composition, and scene direction.",
    icon: Film,
    iconEmoji: "🎬",
    color: "from-red-600 to-orange-600",
    coverImage: "https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=1200&h=300&fit=crop",
    rules: ["Share your directorial choices", "Be open to critique"]
  },
  "video editing": {
    name: "Video Editing",
    description: "Editing techniques, software tips, and post-production workflows.",
    icon: Video,
    iconEmoji: "✂️",
    color: "from-green-600 to-emerald-600",
    coverImage: "https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=1200&h=300&fit=crop",
    rules: ["Share before/after comparisons", "Mention software used"]
  },
  "photo editing": {
    name: "Photo Editing",
    description: "Photoshop, Lightroom, color grading, and retouching techniques.",
    icon: Palette,
    iconEmoji: "📸",
    color: "from-pink-600 to-rose-600",
    coverImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=300&fit=crop",
    rules: ["Share original and edited versions", "Explain your process"]
  },
  photography: {
    name: "Photography",
    description: "Composition, lighting, gear, and photography techniques.",
    icon: Camera,
    iconEmoji: "📷",
    color: "from-yellow-600 to-amber-600",
    coverImage: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=1200&h=300&fit=crop",
    rules: ["Share camera settings when possible", "Respect subjects' privacy"]
  },
  acting: {
    name: "Acting",
    description: "Acting techniques, audition tips, character development.",
    icon: Star,
    iconEmoji: "🎭",
    color: "from-purple-600 to-indigo-600",
    coverImage: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&h=300&fit=crop",
    rules: ["Share monologue videos", "Support fellow actors"]
  },
  animation: {
    name: "Animation",
    description: "2D, 3D, motion graphics, and animation techniques.",
    icon: Sparkles,
    iconEmoji: "🎨",
    color: "from-cyan-600 to-blue-600",
    coverImage: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&h=300&fit=crop",
    rules: ["Show your animation process", "Mention software used"]
  },
  "movie review": {
    name: "Movie Review",
    description: "Film analysis, reviews, and critical discussion.",
    icon: Star,
    iconEmoji: "⭐",
    color: "from-yellow-600 to-orange-600",
    coverImage: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=300&fit=crop",
    rules: ["No spoilers without warning", "Explain your rating"]
  },
  "movie suggestion": {
    name: "Movie Suggestion",
    description: "Recommendations, hidden gems, and must-watch films.",
    icon: Film,
    iconEmoji: "🎬",
    color: "from-purple-600 to-pink-600",
    coverImage: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=300&fit=crop",
    rules: ["Explain why you recommend it", "No spoilers"]
  },
  breakdown: {
    name: "Breakdown",
    description: "Scene breakdowns, technical analysis, and deconstructions.",
    icon: Hash,
    iconEmoji: "🔍",
    color: "from-gray-600 to-slate-600",
    coverImage: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&h=300&fit=crop",
    rules: ["Include timestamps", "Explain technical aspects"]
  },
  "cine gossip": {
    name: "Cine Gossip",
    description: "Industry news, rumors, and behind-the-scenes stories.",
    icon: MessageCircle,
    iconEmoji: "🗣️",
    color: "from-pink-600 to-red-600",
    coverImage: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1200&h=300&fit=crop",
    rules: ["Cite sources when possible", "Keep it respectful"]
  },
  "gen ai": {
    name: "Gen AI",
    description: "AI tools for filmmaking, script generation, and creative AI.",
    icon: Sparkles,
    iconEmoji: "🤖",
    color: "from-blue-600 to-purple-600",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=300&fit=crop",
    rules: ["Share AI tools you use", "Discuss ethical considerations"]
  },
  freelance: {
    name: "Freelance",
    description: "Freelancing tips, client management, and career advice.",
    icon: Briefcase,
    iconEmoji: "💼",
    color: "from-green-600 to-teal-600",
    coverImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=300&fit=crop",
    rules: ["Share what works for you", "No spamming services"]
  },
  "motion graphics": {
    name: "Motion Graphics",
    description: "After Effects, animation, and motion design.",
    icon: Film,
    iconEmoji: "✨",
    color: "from-purple-600 to-blue-600",
    coverImage: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=1200&h=300&fit=crop",
    rules: ["Share project files when possible", "Explain your process"]
  },
  "sound design": {
    name: "Sound Design",
    description: "Audio mixing, sound effects, and music composition.",
    icon: Music,
    iconEmoji: "🎵",
    color: "from-indigo-600 to-purple-600",
    coverImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=300&fit=crop",
    rules: ["Share sound effects libraries", "Explain your mixing process"]
  },
  "graphic design": {
    name: "Graphic Design",
    description: "Poster design, typography, and visual communication.",
    icon: Palette,
    iconEmoji: "🎨",
    color: "from-rose-600 to-pink-600",
    coverImage: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&h=300&fit=crop",
    rules: ["Share your design process", "Mention fonts and tools"]
  }
};

const DEFAULT_COVER = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=300&fit=crop";

// Sidebar menu items
const menuItems = [
  { icon: Home, label: "Home", href: "/community" },
  { icon: Mail, label: "Messages", href: "/community/messages" },
  { icon: Compass, label: "Discover", href: "/community/discover" },
  { icon: Bookmark, label: "Saved Posts", href: "/community/saved" },
  { icon: Users, label: "Following", href: "/community/following" },
  { icon: TrendingUp, label: "Trending", href: "/community/trending" },
  { icon: Info, label: "Guidelines", href: "/community/guidelines" }
];

const bottomMenuItems = [
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: LogOut, label: "Logout", href: "/auth/signout" }
];

// Post type definition
interface PostType {
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
  user?: any;
}

export default function InterestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const interestId = decodeURIComponent(params.interest as string);

  const [interest, setInterest] = useState<any>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [showMenu, setShowMenu] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [coverImage, setCoverImage] = useState(DEFAULT_COVER);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get interest info from MAP
  const interestInfo = INTEREST_MAP[interestId];
  const pageName = interestInfo?.name || interestId.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const pageDescription = interestInfo?.description || `Posts about ${interestId}. Join the community to discuss and share your work.`;
  const pageIcon = interestInfo?.icon || Hash;
  const pageColor = interestInfo?.color || "from-purple-600 to-pink-600";
  const pageRules = interestInfo?.rules || ["Be respectful", "No spam", "Stay on topic"];
  const pageIconEmoji = interestInfo?.iconEmoji || "📄";

  // Debug log for auth
  useEffect(() => {
    console.log("🔍 Interest Page Auth Debug:");
    console.log("  - user from context:", user);
    console.log("  - user id:", user?.id);
    console.log("  - user uid:", user?.uid);
    console.log("  - authLoading:", authLoading);
  }, [user, authLoading]);

  // Get current user ID - try both id and uid
  const currentUserId = user?.id || user?.uid;
  const currentUserName = user?.name || "User";

  // Load user profile
  useEffect(() => {
    if (!currentUserId) return;
    
    const userRef = doc(db, "users", currentUserId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [currentUserId]);

  // REAL-TIME: Listen for interest data changes
  useEffect(() => {
    if (!interestId) return;
    
    const interestRef = doc(db, "interests", interestId);
    const unsubscribe = onSnapshot(interestRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInterest(data);
        setMemberCount(data.memberCount || 0);
        if (data.coverImage) setCoverImage(data.coverImage);
      } else {
        setDoc(interestRef, {
          id: interestId,
          name: pageName,
          description: pageDescription,
          coverImage: coverImage,
          memberCount: 0,
          postCount: 0,
          createdAt: serverTimestamp(),
          createdBy: currentUserId || "system",
          icon: pageIconEmoji,
          rules: pageRules
        }).catch(err => console.error("Error creating:", err));
        setMemberCount(0);
      }
    });

    return () => unsubscribe();
  }, [interestId, currentUserId]);

  // REAL-TIME: Check if user has joined
  useEffect(() => {
    if (!currentUserId || !interestId) return;

    const userRef = doc(db, "users", currentUserId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const interests = data.joinedInterests || [];
        const isJoined = Array.isArray(interests) && interests.includes(interestId);
        setHasJoined(isJoined);
      }
    });

    return () => unsubscribe();
  }, [currentUserId, interestId]);

  // Load members who joined this community
  useEffect(() => {
    if (!interestId) return;
    
    setLoadingMembers(true);
    
    const usersRef = collection(db, "users");
    const usersQuery = query(usersRef, where("joinedInterests", "array-contains", interestId));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList);
      setLoadingMembers(false);
    }, (error) => {
      console.error("Error loading members:", error);
      setLoadingMembers(false);
    });
    
    return () => unsubscribe();
  }, [interestId]);

  // REAL-TIME: Load posts for this interest with all data
  useEffect(() => {
    if (!interestId) return;

    setLoading(true);

    let postsQuery;
    
    if (sortBy === "latest") {
      postsQuery = query(
        collection(db, "posts"),
        where("interests", "array-contains", interestId),
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    } else {
      postsQuery = query(
        collection(db, "posts"),
        where("interests", "array-contains", interestId),
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      try {
        const postListPromises = snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          if (data.isDeleted) return null;
          
          let userData = null;
          if (data.userId) {
            const userRef = doc(db, "users", data.userId);
            const userSnap = await getDoc(userRef);
            userData = userSnap.exists() ? userSnap.data() : null;
          }
          
          // Check if post is saved by current user
          let isSaved = false;
          if (currentUserId && userProfile?.savedPosts) {
            isSaved = userProfile.savedPosts.includes(docSnap.id);
          }
          
          return { 
            id: docSnap.id, 
            ...data, 
            user: userData,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            likesCount: data.likes?.length || 0,
            commentsCount: data.comments?.length || 0,
            isSaved: isSaved,
            userPhotoURL: userData?.avatar || data.userPhotoURL,
            userName: userData?.name || data.userName,
            userId: data.userId
          } as PostType;
        });
        
        const postList = await Promise.all(postListPromises);
        
        // Filter out null values with type guard
        const filteredPosts: PostType[] = postList.filter((post): post is PostType => post !== null);
        
        // Sort by likes count for popular view
        if (sortBy === "popular") {
          filteredPosts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        }
        
        setPosts(filteredPosts);
        setLoading(false);
      } catch (error) {
        console.error("Error processing posts:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [interestId, sortBy, currentUserId, userProfile]);

  // Handle Follow/Unfollow user
  const handleFollowUser = async (userId: string, currentFollowing: boolean) => {
    if (!currentUserId) {
      router.push("/auth/login");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUserId);
      const targetUserRef = doc(db, "users", userId);

      if (currentFollowing) {
        await updateDoc(userRef, {
          following: arrayRemove(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserId)
        });
      } else {
        await updateDoc(userRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserId)
        });
      }
      
      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error("Error following user:", error);
      alert("Failed to update");
    }
  };

  // Handle Join/Leave community
  const handleJoin = async () => {
    if (!currentUserId) {
      router.push("/auth/login");
      return;
    }

    const newJoinState = !hasJoined;
    setHasJoined(newJoinState);
    
    if (!hasJoined) {
      setMemberCount(prev => prev + 1);
    } else {
      setMemberCount(prev => Math.max(0, prev - 1));
    }

    try {
      const userRef = doc(db, "users", currentUserId);
      const interestRef = doc(db, "interests", interestId);

      if (hasJoined) {
        await updateDoc(userRef, {
          joinedInterests: arrayRemove(interestId)
        });
        await updateDoc(interestRef, {
          memberCount: increment(-1)
        });
      } else {
        await updateDoc(userRef, {
          joinedInterests: arrayUnion(interestId)
        });
        await updateDoc(interestRef, {
          memberCount: increment(1)
        });
      }
      
      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error("Error joining community:", error);
      setHasJoined(!newJoinState);
      if (!hasJoined) {
        setMemberCount(prev => Math.max(0, prev - 1));
      } else {
        setMemberCount(prev => prev + 1);
      }
      alert("Failed to join community: " + (error as any).message);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community/discover/${interestId}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
    setShowMenu(false);
  };

  const handleInvite = () => {
    const url = `${window.location.origin}/community/discover/${interestId}`;
    navigator.clipboard.writeText(url);
    alert("Invite link copied!");
  };

  const SidebarLink = ({ icon: Icon, label, href, active = false }: any) => (
    <Link href={href} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${active ? "text-white font-semibold bg-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
      <Icon className={`w-7 h-7 ${active ? "text-white" : "group-hover:scale-110 transition-transform duration-200"}`} />
      <span className="text-[17px] tracking-tight">{label}</span>
    </Link>
  );

  const IconComponent = pageIcon;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <Navbar />

      <main className="relative pt-24 pb-10 px-4 md:px-8">
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_380px] gap-8 lg:gap-12">
          
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:flex flex-col gap-1 sticky top-24 h-fit">
            {menuItems.map((item, index) => (
              <SidebarLink key={index} icon={item.icon} label={item.label} href={item.href} active={item.label === "Discover"} />
            ))}

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1">
              {bottomMenuItems.map((item, index) => (
                <SidebarLink key={index} icon={item.icon} label={item.label} href={item.href} />
              ))}
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-2xl">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Community Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Members</span>
                  <span className="text-white font-medium">{memberCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Posts</span>
                  <span className="text-white font-medium">{posts.length}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER FEED */}
          <section className="space-y-6 min-w-0 flex flex-col items-center">
            <div className="w-full max-w-[800px]">
              {/* Cover Image */}
              <div className="relative h-48 md:h-56 w-full rounded-2xl overflow-hidden">
                <img
                  src={coverImage}
                  alt={pageName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_COVER;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
              </div>

              {/* Group Info Bar */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 mt-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pageColor} flex items-center justify-center shadow-lg`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">{pageName}</h1>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-400">Public group</span>
                        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                        <span className="text-sm text-slate-400">{memberCount} members</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleInvite}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <UserPlus size={16} />
                      Invite
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Share2 size={18} />
                    </button>
                    <button
                      onClick={handleJoin}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                        hasJoined
                          ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                          : `bg-gradient-to-r ${pageColor} text-white hover:opacity-90`
                      }`}
                    >
                      {hasJoined ? (
                        <>
                          <UserCheck size={16} />
                          Joined
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Join
                        </>
                      )}
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      <AnimatePresence>
                        {showMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 z-50 bg-[#1a1a1a] border border-white/10 rounded-xl py-1 min-w-[140px]"
                          >
                            <button
                              onClick={handleShare}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/10"
                            >
                              <Share2 size={14} />
                              Share Community
                            </button>
                            <button
                              onClick={() => setShowRules(true)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/10"
                            >
                              <Info size={14} />
                              View Rules
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="w-full max-w-[800px] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">All Posts</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("latest")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                    sortBy === "latest"
                      ? `bg-gradient-to-r ${pageColor} text-white`
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  <Clock size={12} />
                  Latest
                </button>
                <button
                  onClick={() => setSortBy("popular")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                    sortBy === "popular"
                      ? `bg-gradient-to-r ${pageColor} text-white`
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  <TrendingUp size={12} />
                  Popular
                </button>
              </div>
            </div>

            {/* Posts Feed - Passing currentUserId correctly */}
            <div className="w-full max-w-[800px] space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-white mb-2">No posts yet in this community</p>
                  <p className="text-sm text-slate-400">Be the first to share something!</p>
                  <Link 
                    href="/community"
                    className="inline-block mt-4 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
                  >
                    Create a Post
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT SIDEBAR - Members List */}
          <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-fit">
            {/* Community Rules */}
            <div className="bg-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Community Rules</h3>
                <button onClick={() => setShowRules(true)} className="text-xs text-purple-400 hover:text-purple-300">
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {pageRules.slice(0, 3).map((rule, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-purple-400">•</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* About Community */}
            <div className="bg-white/5 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">About</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {pageDescription}
              </p>
            </div>

            {/* Members List */}
            <div className="bg-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users size={14} className="text-purple-400" />
                  Members ({memberCount})
                </h3>
                <Link href={`/community/discover/${interestId}/members`} className="text-xs text-purple-400 hover:text-purple-300">
                  View All
                </Link>
              </div>
              
              {loadingMembers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                </div>
              ) : members.length > 0 ? (
                <div className="space-y-3">
                  {members.slice(0, 5).map((member) => {
                    const isFollowing = userProfile?.following?.includes(member.id) || false;
                    const isCurrentUser = currentUserId === member.id;
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between group">
                        <Link href={`/profile/${member.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-white">{member.name?.[0]?.toUpperCase() || "U"}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{member.name || "User"}</p>
                            <p className="text-xs text-slate-500 truncate">@{member.username || member.email?.split('@')[0]}</p>
                          </div>
                        </Link>
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleFollowUser(member.id, isFollowing)}
                            className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                              isFollowing
                                ? 'bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                                : 'bg-purple-600/80 text-white hover:bg-purple-600'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No members yet</p>
              )}
            </div>
          </aside>
        </div>

        {/* Rules Modal */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
              onClick={() => setShowRules(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Community Rules</h3>
                  <button onClick={() => setShowRules(false)} className="p-1 hover:bg-white/10 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  {pageRules.map((rule, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-purple-400">{index + 1}</span>
                      </div>
                      <p className="text-sm text-slate-300">{rule}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}