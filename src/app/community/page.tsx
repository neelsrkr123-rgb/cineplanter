"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "#/components/Navbar";
import { 
  Home, Mail, Search, Compass, ChevronDown, Info, Bookmark, 
  Ban, Heart, MessageCircle, Share, MoreHorizontal, 
  ImageIcon, Youtube, LinkIcon, Send, Sparkles, Film,
  X, Upload, Video, FileText, Globe, ExternalLink as ExternalLinkIcon,
  Clock, ThumbsUp, MessageSquare, BookmarkPlus, Loader2,
  User, Users, TrendingUp, Zap, Eye, Star, PlusCircle,
  ChevronRight, Verified, Bell, Settings, LogOut, Shield,
  HelpCircle, Award, Repeat2,
  MapPin, Briefcase, Camera, Film as FilmIcon,
  Flag, Trash2, EyeOff, UserX, AlertTriangle, UserPlus, UserCheck, Hash, BookOpen
} from "lucide-react";
import { db, auth } from "#/lib/firebase";
import {
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove,
  increment, where, limit, getDocs, setDoc
} from "firebase/firestore";
import { useAuth } from "#/context/AuthContext";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToCloudinary } from "#/lib/cloudinary";
import PostCard from "#/components/PostCard";

// Categories for discover menu
const interestCategories = [
  { id: "cinematography", name: "Cinematography", icon: "🎥", memberCount: "0" },
  { id: "scriptwriting", name: "Scriptwriting", icon: "✍️", memberCount: "0" },
  { id: "direction", name: "Direction", icon: "🎬", memberCount: "0" },
  { id: "video editing", name: "Video Editing", icon: "✂️", memberCount: "0" },
  { id: "photo editing", name: "Photo Editing", icon: "📸", memberCount: "0" },
  { id: "photography", name: "Photography", icon: "📷", memberCount: "0" },
  { id: "acting", name: "Acting", icon: "🎭", memberCount: "0" },
  { id: "animation", name: "Animation", icon: "🎨", memberCount: "0" },
  { id: "movie review", name: "Movie Review", icon: "⭐", memberCount: "0" },
  { id: "movie suggestion", name: "Movie Suggestion", icon: "🎬", memberCount: "0" },
  { id: "breakdown", name: "Breakdown", icon: "🔍", memberCount: "0" },
  { id: "cine gossip", name: "Cine Gossip", icon: "🗣️", memberCount: "0" },
  { id: "gen ai", name: "Gen AI", icon: "🤖", memberCount: "0" },
  { id: "freelance", name: "Freelance", icon: "💼", memberCount: "0" },
  { id: "motion graphics", name: "Motion Graphics", icon: "✨", memberCount: "0" },
  { id: "sound design", name: "Sound Design", icon: "🎵", memberCount: "0" },
  { id: "graphic design", name: "Graphic Design", icon: "🎨", memberCount: "0" }
];

const postTypes = [
  { value: "discussion", label: "Discussion", icon: MessageCircle, color: "text-blue-400" },
  { value: "query", label: "Question", icon: Search, color: "text-green-400" },
  { value: "poll", label: "Poll", icon: TrendingUp, color: "text-yellow-400" },
  { value: "review", label: "Review", icon: Star, color: "text-purple-400" },
  { value: "suggestion", label: "Suggestion", icon: Sparkles, color: "text-pink-400" },
  { value: "showcase", label: "Showcase", icon: Film, color: "text-purple-400" }
];

// Suggested users
const suggestedUsers = [
  {
    id: "suggested-user-1",
    name: "collaborator_1",
    username: "@collab1",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop",
    bio: "Filmmaker | Editor",
    followers: "2.5K",
    following: false
  },
  {
    id: "suggested-user-2",
    name: "collaborator_2",
    username: "@collab2",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop",
    bio: "Cinematographer",
    followers: "1.8K",
    following: true
  },
  {
    id: "suggested-user-3",
    name: "collaborator_3",
    username: "@collab3",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    bio: "Director | Writer",
    followers: "3.2K",
    following: false
  }
];

export default function CommunityMainPage() {
  const { user: contextUser, isLoading: authLoading } = useAuth();
  
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [fbAuthLoading, setFbAuthLoading] = useState(true);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  
  const [postType, setPostType] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showInterests, setShowInterests] = useState(false);
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPostsCount, setUserPostsCount] = useState(0);
  const [userFollowersCount, setUserFollowersCount] = useState(0);
  const [userFollowingCount, setUserFollowingCount] = useState(0);
  const [joinedInterests, setJoinedInterests] = useState<string[]>([]);
  const [interestMemberCounts, setInterestMemberCounts] = useState<Record<string, number>>({});
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  
  const [showAllJoinedPages, setShowAllJoinedPages] = useState(false);
  const [feedSource, setFeedSource] = useState<"following" | "communities" | "all">("all");

  const getCurrentUser = () => {
    if (firebaseUser) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      };
    }
    if (contextUser) {
      return {
        uid: contextUser.id,
        email: contextUser.email,
        displayName: contextUser.name || contextUser.email?.split('@')[0],
        photoURL: contextUser.avatar
      };
    }
    return null;
  };

  const currentUser = getCurrentUser();
  const isUserLoading = authLoading || fbAuthLoading;

  // Initialize all interest documents in Firestore
  const initializeAllInterests = async () => {
    try {
      for (const interest of interestCategories) {
        const interestRef = doc(db, "interests", interest.id);
        const interestSnap = await getDoc(interestRef);
        
        if (!interestSnap.exists()) {
          await setDoc(interestRef, {
            id: interest.id,
            name: interest.name,
            description: `${interest.name} community for cine enthusiasts`,
            memberCount: 0,
            postCount: 0,
            createdAt: serverTimestamp(),
            createdBy: "system",
            icon: interest.icon,
            rules: [
              "Be respectful to other members",
              "No spam or self-promotion",
              "Stay on topic",
              "Share your work for constructive feedback"
            ]
          });
          console.log(`Created interest: ${interest.name}`);
        }
      }
    } catch (error) {
      console.error("Error initializing interests:", error);
    }
  };

  // Get joined pages data from joinedInterests with real-time member counts
  const getJoinedPagesData = () => {
    return joinedInterests
      .map(interestId => {
        const category = interestCategories.find(cat => cat.id === interestId);
        if (category) {
          return {
            id: category.id,
            name: category.name,
            category: category.name,
            icon: category.icon,
            memberCount: interestMemberCounts[category.id]?.toLocaleString() || "0"
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const joinedPages = getJoinedPagesData();

  const getDisplayedJoinedPages = () => {
    if (showAllJoinedPages) {
      return joinedPages;
    }
    return joinedPages.slice(0, 3);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowInterestDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setFbAuthLoading(false);
    });
    setFirebaseUser(auth.currentUser);
    setFbAuthLoading(false);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser?.uid) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setSavedPosts(userData.savedPosts || []);
            setBlockedUsers(userData.blockedUsers || []);
            setUserProfile(userData);
            setUserFollowersCount(userData.followers?.length || 0);
            setUserFollowingCount(userData.following?.length || 0);
            setJoinedInterests(userData.joinedInterests || []);
            setFollowingUsers(userData.following || []);
          } else {
            const newUserData = {
              uid: currentUser.uid, email: currentUser.email,
              name: currentUser.displayName || "User",
              username: currentUser.email?.split('@')[0] || "user",
              avatar: currentUser.photoURL || "",
              createdAt: serverTimestamp(),
              followers: [], following: [], savedPosts: [], blockedUsers: [], joinedInterests: []
            };
            await setDoc(doc(db, "users", currentUser.uid), newUserData);
            setUserProfile(newUserData);
            setJoinedInterests([]);
            setFollowingUsers([]);
          }
        } catch (error) { console.error("Error loading user data:", error); }
      }
    };
    loadUserData();
    initializeAllInterests();
  }, [currentUser?.uid]);

  // Real-time listener for user profile changes
  useEffect(() => {
    if (!currentUser?.uid) return;
    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        setUserProfile(userData);
        setUserFollowersCount(userData.followers?.length || 0);
        setUserFollowingCount(userData.following?.length || 0);
        setJoinedInterests(userData.joinedInterests || []);
        setFollowingUsers(userData.following || []);
      }
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Real-time listener for member counts of all interests
  useEffect(() => {
    const unsubscribes = interestCategories.map(interest => {
      const interestRef = doc(db, "interests", interest.id);
      return onSnapshot(interestRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInterestMemberCounts(prev => ({
            ...prev,
            [interest.id]: data.memberCount || 0
          }));
        }
      });
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const postsQuery = query(collection(db, "posts"), where("userId", "==", currentUser.uid), where("isDeleted", "==", false));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => setUserPostsCount(snapshot.docs.length));
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // 🔥 FIXED: Real-time posts feed - Shows posts from:
  // 1. People you follow
  // 2. Communities you joined
  // 3. Your own posts
  useEffect(() => {
    if (isUserLoading || !currentUser?.uid) return;
    
    setLoading(true);
    
    // Create array of conditions for posts to show
    // We'll use multiple queries and combine results
    
    const fetchFeed = async () => {
      try {
        // Query 1: Posts from users you follow
        let followedUsersPosts: any[] = [];
        if (followingUsers.length > 0) {
          const usersQuery = query(
            collection(db, "posts"),
            where("userId", "in", followingUsers),
            where("isDeleted", "==", false),
            orderBy("createdAt", "desc"),
            limit(50)
          );
          
          const usersSnapshot = await getDocs(usersQuery);
          followedUsersPosts = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            source: "following"
          }));
        }
        
        // Query 2: Posts from communities you joined
        let communityPosts: any[] = [];
        if (joinedInterests.length > 0) {
          // Note: Firestore doesn't support "in" on array fields directly
          // So we need to query for each interest individually or use a different approach
          // For now, we'll query all posts that have any of the interests
          // This requires an index on interests array
          
          // Alternative: Query all posts and filter client-side (not efficient for large data)
          // Better approach: Create a feed collection or use cloud function
          
          // For simplicity, we'll query all posts and filter by interests client-side
          // This works for smaller datasets
          const allPostsQuery = query(
            collection(db, "posts"),
            where("isDeleted", "==", false),
            orderBy("createdAt", "desc"),
            limit(100)
          );
          
          const allPostsSnapshot = await getDocs(allPostsQuery);
          communityPosts = allPostsSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              source: "community"
            }))
            .filter(post => {
              if (!post.interests || !Array.isArray(post.interests)) return false;
              return post.interests.some((interest: string) => joinedInterests.includes(interest));
            })
            .slice(0, 50);
        }
        
        // Query 3: Your own posts
        const ownPostsQuery = query(
          collection(db, "posts"),
          where("userId", "==", currentUser.uid),
          where("isDeleted", "==", false),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        
        const ownPostsSnapshot = await getDocs(ownPostsQuery);
        const ownPosts = ownPostsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: "own"
        }));
        
        // Combine all posts
        let allPosts = [...followedUsersPosts, ...communityPosts, ...ownPosts];
        
        // Remove duplicates by ID
        const uniquePosts = Array.from(
          new Map(allPosts.map(post => [post.id, post])).values()
        );
        
        // Sort by createdAt
        uniquePosts.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Fetch user data for each post
        const postsWithUserData = await Promise.all(uniquePosts.map(async (post) => {
          let userData = null;
          if (post.userId) {
            const userRef = doc(db, "users", post.userId);
            const userSnap = await getDoc(userRef);
            userData = userSnap.exists() ? userSnap.data() : null;
          }
          return {
            ...post,
            user: userData,
            createdAt: post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt),
            likesCount: post.likes?.length || 0,
            commentsCount: post.comments?.length || 0,
            isSaved: savedPosts.includes(post.id)
          };
        }));
        
        // Filter blocked users
        const filteredPosts = postsWithUserData.filter(post => !blockedUsers.includes(post.userId));
        
        setPosts(filteredPosts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching feed:", error);
        setLoading(false);
      }
    };
    
    fetchFeed();
    
    // Set up real-time listeners
    // For simplicity, we'll refresh every 30 seconds
    const interval = setInterval(fetchFeed, 30000);
    
    return () => clearInterval(interval);
  }, [isUserLoading, currentUser?.uid, followingUsers, joinedInterests, blockedUsers, savedPosts]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) { alert("Please select a valid image file"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image size should be less than 5MB"); return; }
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setImagePreview(previewUrl);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const handleJoinInterest = async (interestId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser?.uid) {
      alert("Please login to join communities");
      return;
    }

    const wasJoined = joinedInterests.includes(interestId);
    
    // Optimistic update
    if (wasJoined) {
      setJoinedInterests(prev => prev.filter(id => id !== interestId));
    } else {
      setJoinedInterests(prev => [...prev, interestId]);
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const interestRef = doc(db, "interests", interestId);

      if (wasJoined) {
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
    } catch (error) {
      console.error("Error joining interest:", error);
      // Revert optimistic update
      if (wasJoined) {
        setJoinedInterests(prev => [...prev, interestId]);
      } else {
        setJoinedInterests(prev => prev.filter(id => id !== interestId));
      }
      alert("Failed to update: " + (error as any).message);
    }
  };

  const createPost = async () => {
    if (!currentUser || !currentUser.uid) { alert("Please login to create a post"); return; }
    if (!content.trim()) { alert("Please enter some content"); return; }
    if (!postType) { alert("Please select a post type"); return; }

    setUploading(true);
    setUploadProgress(0);
    try {
      let imageUrl = null;
      if (selectedImage) {
        try {
          setUploadProgress(30);
          const result = await uploadToCloudinary(selectedImage, { folder: `community-posts/post_images/${currentUser.uid}`, tags: ['cine-planter', 'community'].concat(postType ? [postType] : [], selectedInterests).filter(Boolean) });
          setUploadProgress(80);
          imageUrl = result.url;
          setUploadProgress(100);
        } catch (uploadError) { console.error("Cloudinary upload error:", uploadError); alert("Failed to upload image."); setUploading(false); return; }
      }

      const postData = {
        uid: currentUser.uid, userId: currentUser.uid, userEmail: currentUser.email || "no-email@example.com",
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || "Anonymous",
        userPhotoURL: currentUser.photoURL || "", username: currentUser.displayName || currentUser.email?.split('@')[0] || "Anonymous",
        avatar: currentUser.photoURL || "", content: content.trim(), postType: postType,
        interests: selectedInterests, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        likes: [], likesCount: 0, comments: [], commentsCount: 0, shares: 0, views: 0, viewCount: 0,
        isPinned: false, isDeleted: false, reports: [], reportCount: 0, hasMedia: false, mediaType: "none"
      };
      if (imageUrl) { postData.imageUrl = imageUrl; postData.hasMedia = true; }
      if (ytUrl && ytUrl.trim() !== "") { const videoId = extractYouTubeId(ytUrl); postData.youtubeUrl = ytUrl.trim(); postData.hasMedia = true; if (videoId) { postData.youtubeVideoId = videoId; postData.youtubeThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; } }
      if (externalLink && externalLink.trim() !== "") { postData.externalLink = externalLink.trim(); postData.hasMedia = true; postData.linkTitle = linkTitle || extractDomainName(externalLink); }

      await addDoc(collection(db, "posts"), postData);
      resetForm();
      alert(`Post created! ${selectedInterests.length > 0 ? `Will appear in: Home feed + ${selectedInterests.length} interest page(s)` : "Will only appear in Home feed"}`);
    } catch (error: any) { console.error("Error creating post:", error); alert("Failed to create post."); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const resetForm = () => {
    setContent(""); setPostType(""); setSelectedInterests([]); setYtUrl(""); setExternalLink(""); setLinkTitle("");
    if (imagePreview) { URL.revokeObjectURL(imagePreview); setImagePreview(""); }
    setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => { if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(""); setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const extractYouTubeId = (url: string): string | null => { const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#\&\?]*).*/; const match = url.match(regExp); return (match && match[2].length === 11) ? match[2] : null; };
  const extractDomainName = (url: string): string => { try { const domain = new URL(url).hostname; return domain.replace('www.', ''); } catch { return url; } };
  const isValidUrl = (url: string): boolean => { try { new URL(url); return true; } catch { return false; } };
  const getUserInitial = () => { if (!currentUser) return "U"; return currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || "U"; };

  if (isUserLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

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
            <SidebarLink icon={Home} label="Home" href="/community" active />
            <SidebarLink icon={Mail} label="Messages" href="/community/messages" />
            <div className="py-2">
              <button 
                onClick={() => setShowInterests(!showInterests)} 
                className="w-full flex items-center justify-between px-4 py-3.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center">
                  <Compass className="w-7 h-7 mr-4 group-hover:text-purple-400" />
                  <span className="text-[17px] font-medium tracking-tight">Discover</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showInterests ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showInterests && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }} 
                    className="ml-4 mt-2 overflow-hidden space-y-1"
                  >
                    {interestCategories.map((interest) => {
                      const isJoined = joinedInterests.includes(interest.id);
                      const memberCount = interestMemberCounts[interest.id] || 0;
                      return (
                        <div 
                          key={interest.id} 
                          className="flex items-center justify-between py-2 px-3 text-sm text-slate-400 hover:text-purple-300 capitalize transition-colors group hover:bg-white/5 rounded-lg"
                        >
                          <Link 
                            href={`/community/discover/${encodeURIComponent(interest.id)}`} 
                            className="flex-1 hover:text-purple-300 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span>{interest.icon}</span>
                              <span>{interest.name}</span>
                              <span className="text-xs text-slate-500">({memberCount})</span>
                            </div>
                          </Link>
                          <button
                            onClick={(e) => handleJoinInterest(interest.id, e)}
                            className={`ml-2 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                              isJoined
                                ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                                : 'bg-purple-600/80 text-white hover:bg-purple-600'
                            }`}
                          >
                            {isJoined ? 'Joined' : 'Join'}
                          </button>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1">
              <SidebarLink icon={Bookmark} label="Saved Posts" href="/community/saved" />
              <SidebarLink icon={Users} label="Following" href="/community/following" />
              <SidebarLink icon={TrendingUp} label="Trending" href="/community/trending" />
              <SidebarLink icon={Info} label="Guidelines" href="/community/guidelines" />
            </div>
            {joinedInterests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 px-4">Your Communities</h3>
                <div className="space-y-1">
                  {joinedInterests.map((interestId) => {
                    const interest = interestCategories.find(cat => cat.id === interestId);
                    const memberCount = interestMemberCounts[interestId] || 0;
                    return (
                      <Link 
                        key={interestId} 
                        href={`/community/discover/${encodeURIComponent(interestId)}`} 
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <span className="text-base">{interest?.icon || "📄"}</span>
                        <span className="capitalize">{interest?.name || interestId}</span>
                        <span className="text-xs text-slate-500">({memberCount})</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-6 p-4 bg-white/5 rounded-2xl">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Feed Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Following</span>
                  <span className="text-white font-medium">{followingUsers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Communities Joined</span>
                  <span className="text-white font-medium">{joinedInterests.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Posts in Feed</span>
                  <span className="text-white font-medium">{posts.length}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER FEED */}
          <section className="space-y-6 min-w-0 flex flex-col items-center">
            {currentUser ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[600px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Link href="/profile"><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm overflow-hidden cursor-pointer hover:opacity-80 transition">{userProfile?.avatar ? <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" /> : getUserInitial()}</div></Link>
                  <span className="text-white font-medium">{currentUser?.displayName || "User"}</span>
                </div>
                <textarea placeholder="What's happening?" value={content} onChange={(e) => setContent(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder:text-[#3a3a3a] resize-none min-h-[100px] outline-none text-white font-light" disabled={uploading} />
                {imagePreview && (<div className="relative mt-3 rounded-xl overflow-hidden border border-[#2a2a2a]"><img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" /><button onClick={removeImage} className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 rounded-full p-1.5"><X className="w-4 h-4" /></button></div>)}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2a2a]">
                  <div className="flex gap-1">
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors text-[#3a3a3a] hover:text-white"><ImageIcon className="w-5 h-5" /></button>
                    <button onClick={() => { const url = prompt("Enter YouTube URL:"); if (url && isValidUrl(url)) setYtUrl(url); }} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors text-[#3a3a3a] hover:text-white"><Youtube className="w-5 h-5" /></button>
                    <button onClick={() => { const url = prompt("Enter link URL:"); if (url && isValidUrl(url)) setExternalLink(url); }} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors text-[#3a3a3a] hover:text-white"><LinkIcon className="w-5 h-5" /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <select value={postType} onChange={(e) => setPostType(e.target.value)} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-full text-xs px-4 py-2 text-slate-300 outline-none"><option value="">Post Type</option>{postTypes.map((type, index) => (<option key={`post-type-${type.value}-${index}`} value={type.value}>{type.label}</option>))}</select>
                    <div className="relative" ref={dropdownRef}>
                      <button onClick={() => setShowInterestDropdown(!showInterestDropdown)} className="flex items-center gap-1 px-3 py-2 bg-white/5 rounded-full text-xs text-slate-300 hover:bg-white/10 transition-colors"><Hash size={12} /><span>{selectedInterests.length > 0 ? `${selectedInterests.length} selected` : "Interests"}</span><ChevronDown size={12} /></button>
                      {showInterestDropdown && (<div className="absolute top-full right-0 mt-2 z-20 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 w-64 max-h-64 overflow-y-auto"><p className="text-xs text-slate-400 mb-2">Select interests (post will appear in these communities)</p><div className="flex flex-wrap gap-2">{interestCategories.map(interest => (<button key={interest.id} onClick={() => toggleInterest(interest.id)} className={`px-2 py-1 rounded-full text-xs capitalize transition-colors ${selectedInterests.includes(interest.id) ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{interest.name}</button>))}</div></div>)}
                    </div>
                    <button onClick={createPost} disabled={!content.trim() || !postType || uploading} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50">{uploading ? "Posting..." : "Post"}</button>
                  </div>
                </div>
                {selectedInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedInterests.map(interest => {
                      const interestData = interestCategories.find(cat => cat.id === interest);
                      return (
                        <Link 
                          key={interest} 
                          href={`/community/discover/${encodeURIComponent(interest)}`}
                          className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full hover:bg-purple-500/30 transition-colors"
                        >
                          #{interestData?.name || interest}
                        </Link>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">{selectedInterests.length > 0 ? `✨ This post will appear in: Home feed + ${selectedInterests.length} interest page(s)` : "⚡ No interests selected - post will only appear in Home feed"}</p>
              </motion.div>
            ) : (
              <div className="w-full max-w-[600px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6 text-center"><p className="text-slate-400 mb-4">Sign in to share your thoughts</p><Link href="/auth/login" className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors">Sign In</Link></div>
            )}
            <div className="w-full max-w-[600px] space-y-4">
              {loading ? (<div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" /></div>) : posts.length > 0 ? (posts.map((post) => (<PostCard key={post.id} post={post} currentUserId={currentUser?.uid} currentUserName={currentUser?.displayName || "User"} />))) : (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-white mb-2">No posts in your feed</p>
                  <p className="text-sm">Follow users or join communities to see posts here!</p>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-fit">
            {currentUser && userProfile && (
              <div className="bg-transparent">
                <div className="flex items-center gap-3">
                  <Link href="/profile"><div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition">{userProfile.avatar ? <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" /> : <span className="font-bold text-white text-lg">{getUserInitial()}</span>}</div></Link>
                  <div><Link href="/profile"><p className="text-sm font-semibold text-white hover:text-purple-400 transition">{userProfile.name || currentUser?.displayName || "User"}</p></Link><p className="text-xs text-slate-500">@{userProfile.username || currentUser?.email?.split('@')[0]}</p><div className="flex items-center gap-3 mt-1 text-xs text-slate-500"><span>{userPostsCount} posts</span><span className="w-1 h-1 rounded-full bg-slate-600"></span><span>{userFollowingCount} following</span><span className="w-1 h-1 rounded-full bg-slate-600"></span><span>{userFollowersCount} followers</span></div></div>
                </div>
                <Link href="/profile" className="block mt-3 text-xs text-purple-400 font-semibold hover:text-purple-300">View Profile</Link>
              </div>
            )}

            <div className="bg-transparent">
              <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold text-white">Suggested for you</span><button className="text-xs text-purple-400 font-semibold hover:text-purple-300">See All</button></div>
              <div className="space-y-4">{suggestedUsers.map((user) => (<div key={user.id} className="flex items-center justify-between"><div className="flex items-center gap-3"><img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-[#2a2a2a]" /><div><span className="text-sm font-medium text-white">{user.name}</span><p className="text-xs text-slate-500">{user.bio}</p></div></div><button className={`text-xs font-semibold ${user.following ? 'text-slate-400' : 'text-purple-400 hover:text-purple-300'}`}>{user.following ? 'Following' : 'Follow'}</button></div>))}</div>
            </div>

            {joinedPages.length > 0 && (
              <div className="bg-transparent">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Joined Pages
                  </span>
                  {joinedPages.length > 3 && (
                    <button 
                      onClick={() => setShowAllJoinedPages(!showAllJoinedPages)}
                      className="text-xs text-purple-400 font-semibold hover:text-purple-300 transition-colors"
                    >
                      {showAllJoinedPages ? 'Show Less' : 'See All'}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {getDisplayedJoinedPages().map((page) => (
                    <div key={page.id} className="flex items-center justify-between group">
                      <Link 
                        href={`/community/discover/${encodeURIComponent(page.id)}`}
                        className="flex items-center gap-3 flex-1 min-w-0 hover:bg-white/5 rounded-lg transition-colors p-1 -m-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-xl flex-shrink-0 border border-[#2a2a2a]">
                          {page.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{page.name}</p>
                          <p className="text-xs text-slate-500">{page.memberCount} members</p>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => handleJoinInterest(page.id, e)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-200"
                      >
                        Joined
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                <Link href="/about" className="hover:text-slate-400">ABOUT</Link>
                <Link href="/help" className="hover:text-slate-400">HELP</Link>
                <Link href="/press" className="hover:text-slate-400">PRESS</Link>
                <Link href="/api" className="hover:text-slate-400">API</Link>
                <Link href="/jobs" className="hover:text-slate-400">JOBS</Link>
                <Link href="/privacy" className="hover:text-slate-400">PRIVACY</Link>
                <Link href="/terms" className="hover:text-slate-400">TERMS</Link>
              </div>
              <p className="text-xs text-slate-700 mt-3">© 2026 CINE-PLANTER</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, href }: any) {
  return <Link href={href} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${active ? "text-white font-semibold bg-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon className={`w-7 h-7 ${active ? "text-white" : "group-hover:scale-110 transition-transform duration-200"}`} /><span className="text-[17px] tracking-tight">{label}</span></Link>;
}