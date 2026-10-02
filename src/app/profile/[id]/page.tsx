// src/app/profile/[id]/page.tsx
'use client';

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, updateDoc, arrayUnion, arrayRemove, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "#/lib/firebase";
import Navbar from "#/components/Navbar";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "#/context/AuthContext";
import { 
  Mail, Phone, User, Star, Loader2, MoreHorizontal, 
  Share, Flag, Ban, Film, Folder, GraduationCap, CreditCard,
  Facebook, Instagram, Twitter, Heart, MessageSquare, MessageCircle
} from 'lucide-react';
import Link from "next/link";

const OFFICIAL_EMAIL = "cineplanter@gmail.com";

export default function PublicProfilePage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const getCurrentUserId = () => currentUser?.id || (currentUser as any)?.uid;

  const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  // ─── Load profile + posts ───
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, "users", userId));

        if (!snap.exists()) {
          router.push('/404');
          return;
        }

        const userData = snap.data();
        setProfile({
          id: snap.id,
          name: userData.name || "",
          username: userData.username || "",
          email: userData.email || "",
          bio: userData.bio || "",
          photoURL: userData.avatar || userData.photoURL || "",
          profileType: userData.profileType || "normal",
          followers: userData.followers || [],
          following: userData.following || [],
          title: userData.title || "",
          socials: userData.socials || {},
          freelancerProfile: userData.freelancerProfile || {}
        });

        const currentUserId = getCurrentUserId();
        if (currentUserId) {
          setIsFollowing((userData.followers || []).includes(currentUserId));
        }

        // ✅ Simple query (no composite index needed)
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", userId),
          limit(50)
        );
        const postsSnap = await getDocs(postsQuery);
        const userPosts = postsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((p: any) => !p.isDeleted)
          .sort((a: any, b: any) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
        setPosts(userPosts);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, currentUser, router]);

  // ─── Follow ───
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
      console.error(error);
    } finally {
      setFollowingLoading(false);
    }
  };

  // ─── Message ───
  const handleMessage = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      router.push('/auth');
      return;
    }
    if (!userId || currentUserId === userId) return;

    setMessageLoading(true);
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUserId)
      );
      const snapshot = await getDocs(q);

      let exists = false;
      snapshot.forEach((d) => {
        if (d.data().participants?.includes(userId)) exists = true;
      });

      if (exists) {
        alert("Conversation exists! Messages coming soon.");
      } else {
        await addDoc(collection(db, "conversations"), {
          participants: [currentUserId, userId],
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
          lastMessageSender: "",
          unreadCount: { [currentUserId]: 0, [userId]: 0 },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isPinned: false,
          isMarkedUnread: false
        });
        alert("Conversation created! Messages coming soon.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setMessageLoading(false);
    }
  };

  // ─── Share ───
  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${userId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile?.name}'s Profile`, url: profileUrl });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        alert('Profile link copied!');
      }
      setShowMenu(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReport = () => { alert('Report user'); setShowMenu(false); };
  const handleBlock = () => {
    if (confirm('Block this user?')) {
      alert('User blocked');
      setShowMenu(false);
    }
  };

  const formatPostDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate?.() || new Date(timestamp);
    const diffDays = Math.floor((new Date().getTime() - date.getTime()) / 86400000);
    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const freelancerData = profile?.freelancerProfile || {};
  const isOfficial = profile?.email === OFFICIAL_EMAIL;
  const isOwnProfile = getCurrentUserId() === userId;
  const socials = profile?.socials || {};
  const userRole = freelancerData.title || profile?.title || "";

  // ─── Loading ───
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }

  // ─── Not found ───
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

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden bg-[#050505]">
      
      {/* ─── Full page glass morph background ─── */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-[15%] -left-[15%] w-[60%] h-[60%] bg-purple-900/20 blur-[140px] rounded-full" />
        <div className="absolute top-[20%] -right-[15%] w-[50%] h-[50%] bg-blue-900/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-pink-900/15 blur-[140px] rounded-full" />
      </div>

      <Navbar />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MOBILE VIEW                                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <main className="lg:hidden relative z-10 pt-24 pb-10">
        <div className="relative px-5">
          
          {/* 3-dot menu */}
          <div className="absolute top-0 right-5 z-50">
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="p-2 rounded-full hover:bg-white/5 transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal size={22} className="text-gray-300" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 z-50 w-56 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl overflow-hidden">
                  <button onClick={handleShare} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5">
                    <Share size={16} /> Share Profile
                  </button>
                  <button onClick={handleReport} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5">
                    <Flag size={16} /> Report User
                  </button>
                  <button onClick={handleBlock} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10">
                    <Ban size={16} /> Block User
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-4 mt-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl border-2 border-white/10">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-white" />
              )}
            </div>
          </div>

          {/* Name */}
          {profile.name && (
            <div className="text-center mb-1">
              <h1 className="text-lg font-bold text-white uppercase inline-flex items-center gap-1.5">
                {profile.name}
                {isOfficial && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#d13af7]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </h1>
            </div>
          )}

          {/* @username */}
          {profile.username && (
            <div className="text-center mb-1">
              <p className="text-xs text-gray-500">@{profile.username}</p>
            </div>
          )}

          {/* Role */}
          {userRole && (
            <div className="text-center mb-4">
              <p className="text-xs text-gray-400 font-medium">{userRole}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-4">
            <div className="text-center">
              <b className="text-white text-base font-bold block">{formatCount(posts.length)}</b>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Posts</p>
            </div>
            <div className="text-center">
              <b className="text-white text-base font-bold block">{formatCount(profile.followers?.length || 0)}</b>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Followers</p>
            </div>
            <div className="text-center">
              <b className="text-white text-base font-bold block">{formatCount(profile.following?.length || 0)}</b>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Following</p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="text-center mb-4 px-2">
              <p className="text-xs text-gray-300 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Social icons */}
          {(socials.instagram || socials.twitter || socials.facebook || socials.youtube) && (
            <div className="flex justify-center items-center gap-5 mb-4">
              {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors" aria-label="Instagram">
                  <Instagram size={20} />
                </a>
              )}
              {socials.twitter && (
                <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors" aria-label="Twitter">
                  <Twitter size={20} />
                </a>
              )}
              {socials.facebook && (
                <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-400 transition-colors" aria-label="Facebook">
                  <Facebook size={20} />
                </a>
              )}
              {socials.youtube && (
                <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-red-500 transition-colors" aria-label="YouTube">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Follow + Message */}
          {!isOwnProfile && (
            <div className="flex justify-center gap-3 mb-5">
              <button 
                onClick={handleFollow} 
                disabled={followingLoading} 
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                  isFollowing 
                    ? 'bg-zinc-800/80 text-slate-300 hover:bg-red-500/20 hover:text-red-400 border border-white/10' 
                    : 'bg-zinc-800/80 text-white hover:bg-zinc-700/80 border border-white/10'
                }`}
              >
                {followingLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <>
                    <User size={12} />
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleMessage}
                disabled={messageLoading}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
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
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mx-5"></div>

        {/* Posts */}
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Posts</h2>
            <span className="text-[10px] text-purple-400 bg-purple-500/20 px-2.5 py-1 rounded-full font-medium">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
          </div>

          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="backdrop-blur-sm bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 overflow-hidden">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-white font-bold block text-center leading-7">
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
                  <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap line-clamp-4">{post.content}</p>
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="Post" className="mt-2 rounded-xl max-h-60 object-cover w-full" />
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Heart size={13} /> {post.likesCount || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={13} /> {post.commentsCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">No posts yet</div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DESKTOP VIEW (unchanged)                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <main className="hidden lg:block relative z-10 max-w-[1500px] mx-auto pt-[10px] px-6 pb-10">
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="flex gap-8">
            <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
              {profile.username && <p className="text-gray-400 text-sm">@{profile.username}</p>}
              {userRole && <p className="text-slate-300 text-sm mt-2">{userRole}</p>}
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}