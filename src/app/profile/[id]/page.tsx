// src/app/profile/[id]/page.tsx
'use client';

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, updateDoc, arrayUnion, arrayRemove, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "#/lib/firebase";
import Navbar from "#/components/Navbar";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "#/context/AuthContext";
import { 
  MapPin, Mail, Phone, User, Star, DollarSign, Loader2, MoreHorizontal, 
  Share, Flag, Ban, Film, Folder, GraduationCap, CreditCard, IdCard,
  Facebook, Instagram, Twitter, Heart, MessageSquare, MessageCircle, Search
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
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [view, setView] = useState<'freelancer' | 'normal'>('freelancer');
  const [searchTerm, setSearchTerm] = useState('');
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  const getCurrentUserId = () => currentUser?.id || (currentUser as any)?.uid;

  const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  // ─── Message ───
  const handleMessage = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) { router.push('/auth'); return; }
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
        alert("Conversation exists! Messages feature coming soon.");
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
        alert("Conversation created! Messages feature coming soon.");
      }
    } catch (error) { console.error(error); }
    finally { setMessageLoading(false); }
  };

  // ─── Load profile ───
  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, "users", userId));

        if (snap.exists()) {
          const userData = snap.data();
          setProfile({
            id: snap.id,
            name: userData.name || "",
            username: userData.username || "",
            email: userData.email || "",
            bio: userData.bio || "",
            location: userData.location || "",
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

          // Simple query without composite index
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
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [userId, currentUser, router]);

  // ─── Following list ───
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onSnapshot(doc(db, 'users', userId), async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const followingIds: string[] = docSnapshot.data().following || [];
        const list: any[] = [];
        for (const fid of followingIds) {
          const uSnap = await getDoc(doc(db, 'users', fid));
          if (uSnap.exists()) {
            const d = uSnap.data();
            list.push({
              id: fid,
              userId: fid,
              name: d.name || "User",
              username: d.username || fid,
              photoURL: d.avatar || d.photoURL
            });
          }
        }
        setFollowingUsers(list);
      }
    });
    return () => unsubscribe();
  }, [userId]);

  // ─── Follow ───
  const handleFollow = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) { router.push('/auth'); return; }
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
    } catch (error) { console.error(error); }
    finally { setFollowingLoading(false); }
  };

  const handleUnfollow = async (targetUserId: string) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;
    setUnfollowingId(targetUserId);
    try {
      await updateDoc(doc(db, 'users', currentUserId), { following: arrayRemove(targetUserId) });
      await updateDoc(doc(db, 'users', targetUserId), { followers: arrayRemove(currentUserId) });
    } catch (error) { console.error(error); }
    finally { setUnfollowingId(null); }
  };

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
    } catch (error) { console.error(error); }
  };

  const handleReport = () => { alert('Report user'); setShowMenu(false); };
  const handleBlock = () => { if (confirm('Block this user?')) { alert('User blocked'); setShowMenu(false); } };

  const navigateToProfile = (id: string) => {
    router.push(`/profile/${id}`);
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
  const isFreelancer = profile?.profileType === "freelancer";

  // ✅ Single display name — username priority, else name
  const displayName = profile?.username ? `@${profile.username}` : (profile?.name || "");

  const displayLocation = (() => {
    if (isFreelancer && freelancerData.location) return freelancerData.location;
    if (profile?.location) return profile.location;
    return null;
  })();

  const filteredFollowing = followingUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
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

  return (
    <div className="min-h-screen text-white relative">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PROFILE PAGE ONLY — Full-page glass morph background        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute -top-[15%] -left-[15%] w-[60%] h-[60%] bg-purple-900/25 blur-[140px] rounded-full" />
        <div className="absolute top-[20%] -right-[15%] w-[50%] h-[50%] bg-blue-900/25 blur-[140px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-pink-900/20 blur-[140px] rounded-full" />
      </div>

      <Navbar />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MOBILE VIEW                                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <main className="lg:hidden relative z-10 pt-12 pb-10 px-5">

        <div className="relative">
          {/* 3-dot menu */}
          <div className="absolute top-0 right-0 z-50">
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
          <div className="flex justify-center mb-4 mt-2">
            <div className="w-26 h-26 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl border-2 border-white/10">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-white" />
              )}
            </div>
          </div>

          {/* ✅ Display name or username — not both */}
          {displayName && (
            <div className="text-center mb-2">
              <h1 className="text-lg font-bold text-white inline-flex items-center gap-1.5">
                {displayName}
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
                {followingLoading ? <Loader2 size={12} className="animate-spin" /> : (
                  <><User size={12} /><span>{isFollowing ? 'Following' : 'Follow'}</span></>
                )}
              </button>

              <button
                onClick={handleMessage}
                disabled={messageLoading}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {messageLoading ? <Loader2 size={12} className="animate-spin" /> : (
                  <><MessageCircle size={12} /><span>Message</span></>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-5"></div>

        {/* Posts */}
        <div>
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
                          {(profile.username || profile.name)?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatPostDate(post.createdAt)}</span>
                    {post.postType && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{post.postType}</span>}
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
      {/* DESKTOP VIEW                                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <main className="hidden lg:block relative z-10 max-w-[1500px] mx-auto pt-[10px] px-6 pb-10">
        <div className="flex gap-6">
          <aside className="w-[230px]">
            <div className="sticky top-[90px] backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <div className="flex flex-col text-sm">
                <p className="text-white font-semibold text-lg mb-6">Menu</p>
                <div className="space-y-5">
                  {[
                    { icon: User, label: "Profile Info" },
                    { icon: Film, label: "My Movies" },
                    { icon: Folder, label: "My Products" },
                    { icon: GraduationCap, label: "My Courses" },
                    { icon: Star, label: "Public Reviews" }
                  ].map((item, index) => {
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

          <div className="flex-1 space-y-6 min-w-0">
            <div className="backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex gap-8">
                  <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {/* ✅ Display name or username — not both */}
                      {displayName && (
                        <h1 className="text-3xl font-bold text-white">{displayName}</h1>
                      )}
                      {isOfficial && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d13af7]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17L4 12" />
                          </svg>
                        </span>
                      )}
                      
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
                          {followingLoading ? <Loader2 size={12} className="animate-spin" /> : isFollowing ? 'Following' : 'Follow'}
                        </button>
                        
                        {!isOwnProfile && (
                          <button
                            onClick={handleMessage}
                            disabled={messageLoading}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            {messageLoading ? <Loader2 size={12} className="animate-spin" /> : (
                              <><MessageCircle size={12} /><span>Message</span></>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

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

                    {profile.bio && <p className="text-sm text-slate-300 mt-4 max-w-md">{profile.bio}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="relative">
                    <button 
                      onClick={() => setShowMenu(!showMenu)} 
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg"
                    >
                      <MoreHorizontal size={20} />
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

                  {displayLocation && (
                    <div className="flex items-center justify-end gap-2 text-gray-400 text-sm mt-1 pt-2 border-t border-white/10">
                      <span>{displayLocation}</span>
                      <MapPin size={14} />
                    </div>
                  )}

                  {(socials.facebook || socials.instagram || socials.twitter) && (
                    <div className="flex gap-3 mt-1 pt-2 border-t border-white/10">
                      {socials.facebook && (
                        <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                          <Facebook size={18} />
                        </a>
                      )}
                      {socials.instagram && (
                        <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                          <Instagram size={18} />
                        </a>
                      )}
                      {socials.twitter && (
                        <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                          <Twitter size={18} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Posts */}
            <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Posts</h2>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{posts.length} posts</span>
              </div>
              {posts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">{formatPostDate(post.createdAt)}</span>
                        {post.postType && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{post.postType}</span>}
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
          </div>
        </div>
      </main>
    </div>
  );
}