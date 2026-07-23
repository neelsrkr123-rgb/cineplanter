'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "#/context/AuthContext";
import Navbar from "#/components/Navbar";
import { db } from "#/lib/firebase";
import {
  doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, increment,
  collection, query, getDocs, where, getDoc
} from "firebase/firestore";
import {
  Compass, Users, Search, Loader2, UserPlus, UserCheck,
  Camera, Edit3, Film, Video, Palette, Star, Sparkles, Hash, Music, MessageCircle, Briefcase,
  ChevronDown, Home, Mail, Info, Bookmark, Ban, Settings, LogOut, User, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// All interest categories with details
const INTERESTS = [
  { id: "cinematography", name: "Cinematography", icon: Camera, color: "from-purple-600 to-pink-600", description: "Camera techniques, lighting, and visual storytelling" },
  { id: "scriptwriting", name: "Scriptwriting", icon: Edit3, color: "from-blue-600 to-cyan-600", description: "Story structure, dialogue, and screenplay format" },
  { id: "direction", name: "Direction", icon: Film, color: "from-red-600 to-orange-600", description: "Directing actors, blocking, and shot composition" },
  { id: "video editing", name: "Video Editing", icon: Video, color: "from-green-600 to-emerald-600", description: "Editing techniques and post-production workflows" },
  { id: "photo editing", name: "Photo Editing", icon: Palette, color: "from-pink-600 to-rose-600", description: "Photoshop, Lightroom, and retouching" },
  { id: "photography", name: "Photography", icon: Camera, color: "from-yellow-600 to-amber-600", description: "Composition, lighting, and photography techniques" },
  { id: "acting", name: "Acting", icon: Star, color: "from-purple-600 to-indigo-600", description: "Acting techniques and audition tips" },
  { id: "animation", name: "Animation", icon: Sparkles, color: "from-cyan-600 to-blue-600", description: "2D, 3D, and motion graphics" },
  { id: "movie review", name: "Movie Review", icon: Star, color: "from-yellow-600 to-orange-600", description: "Film analysis and critical discussion" },
  { id: "movie suggestion", name: "Movie Suggestion", icon: Film, color: "from-purple-600 to-pink-600", description: "Recommendations and hidden gems" },
  { id: "breakdown", name: "Breakdown", icon: Hash, color: "from-gray-600 to-slate-600", description: "Scene breakdowns and technical analysis" },
  { id: "cine gossip", name: "Cine Gossip", icon: MessageCircle, color: "from-pink-600 to-red-600", description: "Industry news and behind-the-scenes" },
  { id: "gen ai", name: "Gen AI", icon: Sparkles, color: "from-blue-600 to-purple-600", description: "AI tools for filmmaking" },
  { id: "freelance", name: "Freelance", icon: Briefcase, color: "from-green-600 to-teal-600", description: "Freelancing tips and career advice" },
  { id: "motion graphics", name: "Motion Graphics", icon: Film, color: "from-purple-600 to-blue-600", description: "After Effects and motion design" },
  { id: "sound design", name: "Sound Design", icon: Music, color: "from-indigo-600 to-purple-600", description: "Audio mixing and sound effects" },
  { id: "graphic design", name: "Graphic Design", icon: Palette, color: "from-rose-600 to-pink-600", description: "Poster design and visual communication" }
];

const menuItems = [
  { icon: Home, label: "Home", href: "/community" },
  { icon: Mail, label: "Messages", href: "/community/messages" },
  { icon: Compass, label: "Discover", href: "/community/discover", active: true },
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

export default function DiscoverPage() {
  const { user } = useAuth();
  const [joinedInterests, setJoinedInterests] = useState<string[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load user's joined interests and member counts
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setJoinedInterests(docSnap.data().joinedInterests || []);
      }
      setLoading(false);
    });

    // Listen to member count changes for all interests
    const unsubscribes = INTERESTS.map(interest => {
      const interestRef = doc(db, "interests", interest.id);
      return onSnapshot(interestRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMemberCounts(prev => ({
            ...prev,
            [interest.id]: data.memberCount || 0
          }));
        }
      });
    });

    return () => {
      unsubscribeUser();
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user?.uid]);

  const handleJoin = async (interestId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user?.uid) {
      alert("Please login to join communities");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const interestRef = doc(db, "interests", interestId);
      const isJoined = joinedInterests.includes(interestId);

      if (isJoined) {
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
      alert("Failed to update");
    }
  };

  const filteredInterests = INTERESTS.filter(interest =>
    interest.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const joinedInterestsList = INTERESTS.filter(interest => joinedInterests.includes(interest.id));
  const unjoinedInterestsList = INTERESTS.filter(interest => !joinedInterests.includes(interest.id));

  const SidebarLink = ({ icon: Icon, label, href, active = false }: any) => (
    <Link href={href} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${active ? "text-white font-semibold bg-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
      <Icon className={`w-7 h-7 ${active ? "text-white" : "group-hover:scale-110 transition-transform duration-200"}`} />
      <span className="text-[17px] tracking-tight">{label}</span>
    </Link>
  );

  if (loading) {
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
          
          <aside className="hidden lg:flex flex-col gap-1 sticky top-24 h-fit">
            {menuItems.map((item, index) => (
              <SidebarLink key={index} icon={item.icon} label={item.label} href={item.href} active={item.active} />
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
                  <span className="text-slate-400">Total Communities</span>
                  <span className="text-white font-medium">{INTERESTS.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Your Communities</span>
                  <span className="text-white font-medium">{joinedInterests.length}</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-6 min-w-0">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Compass className="w-8 h-8 text-purple-400" />
                <h1 className="text-3xl font-bold text-white">Discover Communities</h1>
              </div>
              <p className="text-slate-400">Find and join communities that match your interests</p>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {joinedInterestsList.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <UserCheck size={20} className="text-green-400" />
                  Your Communities
                </h2>
                <div className="space-y-2">
                  {joinedInterestsList.map((interest) => {
                    const Icon = interest.icon;
                    const memberCount = memberCounts[interest.id] || 0;
                    
                    return (
                      <div
                        key={interest.id}
                        className="group flex items-center justify-between p-4 bg-green-500/5 hover:bg-green-500/10 border border-green-500/30 rounded-xl transition-all"
                      >
                        <Link href={`/community/discover/${interest.id}`} className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${interest.color} flex items-center justify-center`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-lg">{interest.name}</h3>
                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                <span className="flex items-center gap-1"><Users size={12} />{memberCount} members</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                        <button
                          onClick={(e) => handleJoin(interest.id, e)}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center gap-2"
                        >
                          <UserCheck size={16} />
                          Joined
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Compass size={20} className="text-purple-400" />
                All Communities
              </h2>
              <div className="space-y-2">
                {unjoinedInterestsList.map((interest) => {
                  const Icon = interest.icon;
                  const memberCount = memberCounts[interest.id] || 0;
                  
                  return (
                    <div
                      key={interest.id}
                      className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                    >
                      <Link href={`/community/discover/${interest.id}`} className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${interest.color} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">{interest.name}</h3>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1"><Users size={12} />{memberCount} members</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => handleJoin(interest.id, e)}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
                      >
                        <UserPlus size={16} />
                        Join
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-fit">
            {user && (
              <div className="bg-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-white text-lg">{user.displayName?.[0]?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user.displayName || "User"}</p>
                    <p className="text-xs text-slate-500">@{user.email?.split('@')[0]}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>{joinedInterests.length} communities</span>
                    </div>
                  </div>
                </div>
                <Link href="/profile" className="block mt-3 text-xs text-purple-400 font-semibold hover:text-purple-300 text-center">
                  View Profile
                </Link>
              </div>
            )}

            <div className="bg-white/5 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">💡 Tip</h3>
              <p className="text-xs text-slate-400">
                Join communities that match your interests to see relevant posts in your feed!
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}