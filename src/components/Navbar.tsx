// src/components/Navbar.tsx
'use client';

import { useAuth } from '#/context/AuthContext';
import {
  Film, Search, Bell, MessageCircle, User, Menu, X, ChevronDown,
  Upload, BookOpen, Users, Compass, Clapperboard,
  Heart, UserPlus, Settings, LogOut, PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '#/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  name: string;
  username?: string;
  photoURL?: string;
  type: 'user' | 'movie';
  subtitle?: string;
  image?: string;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'mention';
  postId?: string;
  commentId?: string;
  userId: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  content?: string;
  read: boolean;
  createdAt: any;
}

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Avatar listener
  useEffect(() => {
    if (!user?.id) return;
    const userRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.avatar !== user.avatar) setAvatarKey(Date.now());
      }
    });
    return () => unsubscribe();
  }, [user?.id, user?.avatar]);

  // Unread messages
  useEffect(() => {
    if (!user?.id) return;
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.id)
    );
    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      let totalUnread = 0;
      snapshot.forEach((docSnap) => {
        const unreadCount = docSnap.data().unreadCount?.[user.id] || 0;
        if (unreadCount > 0) totalUnread += unreadCount;
      });
      setUnreadMessageCount(totalUnread);
    });
    return () => unsubscribe();
  }, [user?.id]);

  // Notifications
  useEffect(() => {
    if (!user?.id) return;
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs: Notification[] = [];
      let unread = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const notif: Notification = {
          id: docSnap.id,
          type: data.type,
          postId: data.postId,
          commentId: data.commentId,
          userId: data.userId,
          actorId: data.actorId,
          actorName: data.actorName,
          actorAvatar: data.actorAvatar,
          content: data.content,
          read: data.read || false,
          createdAt: data.createdAt
        };
        notifs.push(notif);
        if (!notif.read) unread++;
      });
      setNotifications(notifs);
      setUnreadNotificationCount(unread);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markNotificationAsRead(notification.id);
    setShowNotifications(false);
    if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'reply') {
      if (notification.postId) router.push(`/community/post/${notification.postId}`);
    } else if (notification.type === 'follow') {
      router.push(`/profile/${notification.actorId}`);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    for (const notif of unreadNotifs) await markNotificationAsRead(notif.id);
  };

  // Focus input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [isSearchExpanded]);

  // Close on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    setIsUploadDropdownOpen(false);
    setShowNotifications(false);
    setIsSearchExpanded(false);
    setSearchTerm('');
  }, [pathname]);

  // Click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (uploadRef.current && !uploadRef.current.contains(event.target as Node)) {
        setIsUploadDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
        setSearchTerm('');
        setSearchResults([]);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Search logic
  useEffect(() => {
    const fetchSearchResults = async () => {
      const searchText = searchTerm.trim();
      if (!searchText) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const results: SearchResult[] = [];
        const searchLower = searchText.toLowerCase();

        const usersRef = collection(db, 'users');
        const nameQuery = query(
          usersRef,
          where('name', '>=', searchText),
          where('name', '<=', searchText + '\uf8ff'),
          orderBy('name'),
          limit(10)
        );
        const nameSnapshot = await getDocs(nameQuery);
        nameSnapshot.forEach((doc) => {
          const data = doc.data();
          const name = data.name || data.displayName || '';
          if (name.toLowerCase().includes(searchLower)) {
            results.push({
              id: doc.id,
              name: name,
              username: data.username || '',
              photoURL: data.avatar || data.photoURL || '',
              type: 'user',
              subtitle: data.username ? `@${data.username}` : '',
              image: data.avatar || data.photoURL || ''
            });
          }
        });

        const moviesRef = collection(db, 'movies');
        const movieQuery = query(
          moviesRef,
          where('title', '>=', searchText),
          where('title', '<=', searchText + '\uf8ff'),
          orderBy('title'),
          limit(10)
        );
        const movieSnapshot = await getDocs(movieQuery);
        movieSnapshot.forEach((doc) => {
          const data = doc.data();
          const title = data.title || '';
          if (title.toLowerCase().includes(searchLower) && !results.some(r => r.id === doc.id && r.type === 'movie')) {
            results.push({
              id: doc.id,
              name: title,
              photoURL: data.posterUrl || data.heroUrl || '',
              type: 'movie',
              subtitle: data.language || data.genre?.join(', ') || '',
              image: data.posterUrl || data.heroUrl || ''
            });
          }
        });

        if (results.length < 8) {
          const allUsersSnapshot = await getDocs(query(usersRef, limit(50)));
          const allMoviesSnapshot = await getDocs(query(moviesRef, limit(50)));

          allUsersSnapshot.forEach((doc) => {
            const data = doc.data();
            const name = (data.name || data.displayName || '').toLowerCase();
            const username = (data.username || '').toLowerCase();
            if ((name.includes(searchLower) || username.includes(searchLower)) &&
                !results.some(r => r.id === doc.id && r.type === 'user')) {
              results.push({
                id: doc.id,
                name: data.name || data.displayName || '',
                username: data.username || '',
                photoURL: data.avatar || data.photoURL || '',
                type: 'user',
                subtitle: data.username ? `@${data.username}` : '',
                image: data.avatar || data.photoURL || ''
              });
            }
          });

          allMoviesSnapshot.forEach((doc) => {
            const data = doc.data();
            const title = (data.title || '').toLowerCase();
            if (title.includes(searchLower) && !results.some(r => r.id === doc.id && r.type === 'movie')) {
              results.push({
                id: doc.id,
                name: data.title || '',
                photoURL: data.posterUrl || data.heroUrl || '',
                type: 'movie',
                subtitle: data.language || data.genre?.join(', ') || '',
                image: data.posterUrl || data.heroUrl || ''
              });
            }
          });
        }

        results.sort((a, b) => (a.type === 'user' && b.type === 'movie' ? -1 : 1));
        setSearchResults(results.slice(0, 15));
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user') router.push(`/profile/${result.id}`);
    else if (result.type === 'movie') router.push(`/streaming/movie/${result.id}`);
    setIsSearchExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const uploadMenuItems = [
    { name: 'Create Post', href: '/community', icon: PlusCircle },
    { name: 'Upload Movie', href: '/upload/movie', icon: Film },
  ];

  const navLinks = [
    { name: 'Explore', href: '/', icon: Compass },
    { name: 'Movies', href: '/movies', icon: Clapperboard },
    { name: 'Community', href: '/community', icon: Users },
  ];

  const formatCount = (count: number): string => count > 99 ? '99+' : count.toString();

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    const diffHours = Math.floor((Date.now() - date.getTime()) / 3600000);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-3 h-3 text-pink-500" />;
      case 'comment':
      case 'reply': return <MessageCircle className="w-3 h-3 text-blue-500" />;
      case 'follow': return <UserPlus className="w-3 h-3 text-purple-500" />;
      default: return <Bell className="w-3 h-3 text-gray-400" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return <span><span className="font-semibold text-white">{notification.actorName}</span> liked your post</span>;
      case 'comment':
        return <span><span className="font-semibold text-white">{notification.actorName}</span> commented</span>;
      case 'reply':
        return <span><span className="font-semibold text-white">{notification.actorName}</span> replied to your comment</span>;
      case 'follow':
        return <span><span className="font-semibold text-white">{notification.actorName}</span> started following you</span>;
      default:
        return <span><span className="font-semibold text-white">{notification.actorName}</span> interacted</span>;
    }
  };

  const getAvatarUrl = () => user?.avatar || "/default-avatar.png";

  return (
    <>
      <nav className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 
                      w-[96%] sm:w-[98%] max-w-[1900px] 
                      bg-gray-900/40 backdrop-blur-2xl 
                      border border-white/15 
                      rounded-full 
                      shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.08)]
                      z-50 
                      px-3 sm:px-6 
                      py-2 
                      transition-all duration-500">

        <div className="flex justify-between items-center gap-2 h-10 sm:h-11">

          {/* ========== LEFT SIDE ========== */}
          <div className="flex items-center gap-3 sm:gap-10 min-w-0 flex-1">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative overflow-hidden rounded-xl flex-shrink-0">
                <Image
                  src="/logo copy.png"
                  alt="CinePlanter Logo"
                  width={40}
                  height={40}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-bold text-white">CinePlanter</span>
                <span className="text-[11px] text-white-300 tracking-wide">A Filmmakers Ecosystem</span>
              </div>
            </Link>

            {/* ===== MOBILE: NAV ICONS (no bg, white highlight, gradient underline on active) ===== */}
            <div className="lg:hidden flex items-center gap-0.5 ml-1">
              <AnimatePresence>
                {!isSearchExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-0.5"
                  >
                    {navLinks.map((link) => {
                      const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.name}
                          href={link.href}
                          className={`relative p-2 rounded-full transition-colors ${
                            isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                          }`}
                          aria-label={link.name}
                        >
                          <Icon className="w-[18px] h-[18px] transition-colors" />
                          {isActive && (
                            <span className="absolute left-1/2 -translate-x-1/2 -bottom-[6px] 
                                             w-8 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 
                                             rounded-full"></span>
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== DESKTOP: NAV LINKS (unchanged) ===== */}
            <div className="hidden lg:flex items-center gap-6 text-sm">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative font-semibold flex items-center gap-1.5 transition-colors group ${
                      isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                    <span>{link.name}</span>
                    {isActive && (
                      <span className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-14 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ========== RIGHT SIDE ========== */}
          <div className="flex items-center gap-1 sm:gap-2 relative flex-shrink-0">

            {/* === MOBILE SEARCH — default: icon only | expanded: input pill === */}
            <div className="lg:hidden flex-shrink-0" ref={searchRef}>
              <AnimatePresence mode="wait" initial={false}>
                {isSearchExpanded ? (
                  // 🔍 EXPANDED — input pill
                  <motion.div
                    key="search-expanded"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'clamp(140px, 55vw, 320px)', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center 
                                    bg-white/[0.07] backdrop-blur-xl 
                                    border border-white/15 
                                    rounded-full 
                                    pl-3 pr-1.5 py-1.5">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search..."
                        className="flex-1 bg-transparent text-white placeholder-gray-400 
                                   focus:outline-none text-sm min-w-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchLoading && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setIsSearchExpanded(false);
                          setSearchTerm('');
                          setSearchResults([]);
                        }}
                        className="ml-1 flex-shrink-0 p-0.5 rounded-full text-gray-400 hover:text-white transition-colors"
                        aria-label="Close search"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  // 🔍 COLLAPSED — icon only (no pill)
                  <motion.button
                    key="search-collapsed"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                    aria-label="Search"
                  >
                    <Search className="w-[18px] h-[18px]" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* === DESKTOP SEARCH (unchanged) === */}
            <div className="relative hidden lg:block" ref={searchRef}>
              <div className={`flex items-center transition-all duration-300 ${isSearchExpanded ? 'bg-white/10 rounded-full ring-1 ring-white/20' : ''}`}>
                <AnimatePresence>
                  {isSearchExpanded && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="Search..."
                        className="pl-3 pr-2 py-1.5 bg-transparent text-white placeholder-gray-400 
                                   focus:outline-none w-48 md:w-56 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchLoading && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-white/5"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Upload Dropdown — md+ only */}
            {user && (
              <div className="relative hidden md:block" ref={uploadRef}>
                <button
                  onClick={() => setIsUploadDropdownOpen(!isUploadDropdownOpen)}
                  className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white 
                             px-3 py-1.5 rounded-full text-sm font-medium 
                             hover:from-purple-700 hover:to-pink-700 
                             transition shadow-lg shadow-purple-500/20"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {isUploadDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-52 
                                 bg-gray-900/85 backdrop-blur-2xl 
                                 border border-white/15 
                                 rounded-xl shadow-2xl py-2 z-50"
                    >
                      {uploadMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setIsUploadDropdownOpen(false)}
                          >
                            <Icon className="w-4 h-4 mr-3 text-purple-400" />
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Notifications — সবসময় visible */}
            {user && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-6 md:h-6 transition-colors" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] 
                                     bg-red-500 text-[9px] text-white rounded-full 
                                     flex items-center justify-center px-1 font-bold
                                     ring-2 ring-gray-900/50">
                      {formatCount(unreadNotificationCount)}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 
                                 w-[calc(100vw-2rem)] max-w-sm sm:w-80 
                                 bg-gray-900/85 backdrop-blur-2xl 
                                 border border-white/15 
                                 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        {unreadNotificationCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${
                                !notification.read ? 'bg-purple-500/5' : ''
                              }`}
                            >
                              <div className="flex-shrink-0 relative">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                                  {notification.actorAvatar ? (
                                    <img src={notification.actorAvatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-300">{getNotificationText(notification)}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{formatTime(notification.createdAt)}</p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No notifications yet</p>
                          </div>
                        )}
                      </div>

                      <Link
                        href="/community/notifications"
                        className="block text-center py-2 text-xs text-purple-400 hover:text-purple-300 border-t border-white/10 transition-colors"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all notifications
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Messages — সবসময় visible */}
            {user && (
              <Link
                href="/community/messages"
                className="relative p-2 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <MessageCircle className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-6 md:h-6 transition-colors" />
                {unreadMessageCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] 
                                   bg-purple-500 text-[9px] text-white rounded-full 
                                   flex items-center justify-center px-1 font-bold
                                   ring-2 ring-gray-900/50">
                    {formatCount(unreadMessageCount)}
                  </span>
                )}
              </Link>
            )}

            {/* Profile — lg+ only */}
            {!isLoading && user ? (
              <div className="relative hidden lg:block" ref={profileRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-white/5"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden ring-1 ring-white/20">
                    {user.avatar ? (
                      <img
                        key={avatarKey}
                        src={getAvatarUrl()}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 
                                 bg-gray-900/85 backdrop-blur-2xl 
                                 border border-white/15 
                                 rounded-xl shadow-2xl py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-gray-400 text-xs truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5">
                        <User className="w-4 h-4 mr-3" /> My Profile
                      </Link>
                      <Link href="/uploads" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5">
                        <Upload className="w-4 h-4 mr-3" /> My Uploads
                      </Link>
                      <Link href="/settings" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5">
                        <Settings className="w-4 h-4 mr-3" /> Settings
                      </Link>
                      <button
                        onClick={() => { logout(); setIsProfileDropdownOpen(false); }}
                        className="flex items-center w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-white/5"
                      >
                        <LogOut className="w-4 h-4 mr-3" /> Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : !user && !isLoading && (
              <Link href="/auth" className="hidden lg:block bg-gradient-to-r from-purple-600 to-pink-600 text-white 
                                              px-4 py-2 rounded-full font-medium 
                                              hover:from-purple-700 hover:to-pink-700 text-sm">
                Sign In
              </Link>
            )}

            {/* Hamburger — সবসময় visible, mobile-only */}
            <div className="relative lg:hidden" ref={mobileMenuRef}>
              <button
                className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
              </button>

              {/* Mobile Popup Menu */}
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{ transformOrigin: 'top right' }}
                    className="absolute right-0 top-full mt-4 
                               w-56 
                               bg-gray-900/95 backdrop-blur-2xl 
                               border border-white/15 
                               rounded-2xl 
                               shadow-2xl shadow-black/50 
                               overflow-hidden 
                               z-50"
                  >
                    {user ? (
                      <>
                        <div className="p-1.5">
                          <Link
                            href="/community"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <PlusCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-sm font-medium">Create Post</span>
                          </Link>
                          <Link
                            href="/upload/movie"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Upload className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-sm font-medium">Upload Movie</span>
                          </Link>
                        </div>

                        <div className="border-t border-white/10"></div>

                        <div className="p-1.5">
                          <Link
                            href="/profile"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-purple-400/40 bg-gradient-to-br from-purple-600 to-pink-600">
                              {user.avatar ? (
                                <img
                                  key={avatarKey}
                                  src={getAvatarUrl()}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium">My Profile</span>
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-sm font-medium">Settings</span>
                          </Link>
                        </div>

                        <div className="border-t border-white/10"></div>

                        <div className="p-1.5">
                          <button
                            onClick={() => {
                              logout();
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">Log Out</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-1.5">
                          {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                              <Link
                                key={link.name}
                                href={link.href}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <span className="text-sm font-medium">{link.name}</span>
                              </Link>
                            );
                          })}
                        </div>

                        <div className="border-t border-white/10"></div>

                        <div className="p-1.5">
                          <Link
                            href="/auth"
                            className="w-full flex items-center justify-center gap-2 
                                       bg-gradient-to-r from-purple-600 to-pink-600 
                                       text-white py-2 px-3 rounded-lg font-medium 
                                       hover:from-purple-700 hover:to-pink-700 
                                       transition-colors text-sm
                                       shadow-lg shadow-purple-500/20"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            Sign In
                          </Link>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* ============ SEARCH RESULTS DROPDOWN ============ */}
      <AnimatePresence>
        {isSearchExpanded && searchTerm.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 
                       w-[96%] max-w-2xl 
                       bg-gray-900/85 backdrop-blur-2xl 
                       border border-white/15 
                       rounded-2xl 
                       shadow-2xl 
                       z-40 
                       overflow-hidden 
                       max-h-[60vh] overflow-y-auto"
          >
            {searchResults.length > 0 ? (
              <>
                {searchResults.filter(r => r.type === 'user').length > 0 && (
                  <>
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/10">Users</div>
                    {searchResults.filter(r => r.type === 'user').map((result) => (
                      <button
                        key={`user-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {result.photoURL ? (
                            <img src={result.photoURL} alt={result.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{result.name}</p>
                          {result.username && (
                            <p className="text-gray-400 text-xs truncate">@{result.username}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">User</span>
                      </button>
                    ))}
                  </>
                )}

                {searchResults.filter(r => r.type === 'movie').length > 0 && (
                  <>
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/10 border-t border-white/10">Movies</div>
                    {searchResults.filter(r => r.type === 'movie').map((result) => (
                      <button
                        key={`movie-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {result.image ? (
                            <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                          ) : (
                            <Film className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{result.name}</p>
                          {result.subtitle && (
                            <p className="text-gray-400 text-xs truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">Movie</span>
                      </button>
                    ))}
                  </>
                )}
              </>
            ) : !searchLoading ? (
              <div className="text-center py-10">
                <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No results for &quot;{searchTerm}&quot;</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* spacing */}
      <div className="h-17"></div>
    </>
  );
}