// src/components/Navbar.tsx
'use client';

import { useAuth } from '#/context/AuthContext';
import {
  Film, Search, Bell, MessageCircle, User, Menu, X, ChevronDown,
  Upload, BookOpen, Store, Users, Briefcase, Compass, Clapperboard, BriefcaseBusiness, Book, Globe,
  Heart, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '#/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchUser {
  id: string;
  name: string;
  username?: string;
  photoURL?: string;
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
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
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
  const pathname = usePathname();
  const router = useRouter();

  // Real-time listener for user avatar updates
  useEffect(() => {
    if (!user?.id) return;
    const userRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.avatar !== user.avatar) {
          setAvatarKey(Date.now());
        }
      }
    });
    return () => unsubscribe();
  }, [user?.id, user?.avatar]);

  // Check unread messages count
  useEffect(() => {
    if (!user?.id) return;

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.id)
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      let totalUnread = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const unreadCount = data.unreadCount?.[user.id] || 0;
        if (unreadCount > 0) {
          totalUnread += unreadCount;
        }
      });
      setUnreadMessageCount(totalUnread);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Real-time listener for notifications
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

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    await markNotificationAsRead(notification.id);
    setShowNotifications(false);
    
    if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'reply') {
      if (notification.postId) {
        router.push(`/community/post/${notification.postId}`);
      }
    } else if (notification.type === 'follow') {
      router.push(`/profile/${notification.actorId}`);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    for (const notif of unreadNotifs) {
      await markNotificationAsRead(notif.id);
    }
  };

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const usersRef = collection(db, 'users');
        
        const nameQuery = query(
          usersRef,
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff'),
          orderBy('name'),
          limit(10)
        );
        
        const nameSnapshot = await getDocs(nameQuery);
        const users: SearchUser[] = [];
        
        nameSnapshot.forEach((doc) => {
          const data = doc.data();
          users.push({
            id: doc.id,
            name: data.name || data.displayName || '',
            username: data.username || '',
            photoURL: data.avatar || data.photoURL || ''
          });
        });

        if (users.length === 0) {
          const usernameQuery = query(
            usersRef,
            where('username', '>=', searchTerm),
            where('username', '<=', searchTerm + '\uf8ff'),
            limit(10)
          );
          const usernameSnapshot = await getDocs(usernameQuery);
          usernameSnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
              id: doc.id,
              name: data.name || data.displayName || '',
              username: data.username || '',
              photoURL: data.avatar || data.photoURL || ''
            });
          });
        }
        
        setSearchResults(users);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
    setIsSearchExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const uploadMenuItems = [
    { name: 'Create Post', href: '/community', icon: Users },
    { name: 'Upload Movie', href: '/upload/movie', icon: Film },
    { name: 'Upload Assets', href: '/upload/assets', icon: Store },
    { name: 'Create Job', href: '/freelance/create-job', icon: Briefcase },
  ];

  const navLinks = [
    { name: 'Explore', href: '/', icon: Compass },
    { name: 'Movies', href: '/movies', icon: Clapperboard },
    { name: 'Freelance', href: '/freelance', icon: BriefcaseBusiness },
    { name: 'Academy', href: '/academy', icon: Book },
    { name: 'Community', href: '/community', icon: Users },
    { name: 'Store', href: '/store', icon: Store },
  ];

  const formatCount = (count: number): string => {
    if (count > 99) return '99+';
    return count.toString();
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3 h-3 text-pink-500" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-3 h-3 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-3 h-3 text-purple-500" />;
      default:
        return <Bell className="w-3 h-3 text-gray-400" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return <span><span className="font-semibold text-white">{notification.actorName}</span> liked your post</span>;
      case 'comment':
        return <span><span className="font-semibold text-white">{notification.actorName}</span> commented: "{notification.content?.substring(0, 40)}..."</span>;
      case 'reply':
        return <span><span className="font-semibold text-white">{notification.actorName}</span> replied to your comment</span>;
      case 'follow':
        return <span><span className="font-semibold text-white">{notification.actorName}</span> started following you</span>;
      default:
        return <span><span className="font-semibold text-white">{notification.actorName}</span> interacted with your post</span>;
    }
  };

  const getAvatarUrl = () => {
    return user?.avatar || "/default-avatar.png";
  };

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[98%] max-w-[1900px] bg-gray-900/30 backdrop-blur-xl border border-white/20 rounded-full shadow-lg z-50 px-6 py-2 transition-all duration-500">
        <div className="flex justify-between items-center">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="w-10 h-10 relative overflow-hidden rounded-xl">
                <Image 
                  src="/logo copy.png"
                  alt="CinePlanter Logo"
                  width={40}
                  height={40}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">CinePlanter</span>
                <span className="text-[11px] text-white-300 tracking-wide">A Filmmakers Ecosystem</span>
              </div>
            </Link>

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

          {/* Right: Search + Icons + Profile */}
          <div className="flex items-center gap-2 relative">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <div className={`flex items-center transition-all duration-300 ${isSearchExpanded ? 'bg-white/10 rounded-full' : ''}`}>
                {isSearchExpanded && (
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search users..."
                      className="pl-4 pr-2 py-1.5 bg-transparent text-white placeholder-gray-400 focus:outline-none w-56 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchLoading && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-white/5"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {isSearchExpanded && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-72 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleUserClick(result.id)}
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
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Upload Dropdown */}
            {user && (
              <div className="relative hidden md:block" ref={uploadRef}>
                <button
                  onClick={() => setIsUploadDropdownOpen(!isUploadDropdownOpen)}
                  className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition"
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
                      className="absolute right-0 mt-2 w-52 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg py-2 z-50"
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

            {/* Notifications with Dropdown */}
            {user && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="nav-icon relative p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <Bell className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-[10px] rounded-full flex items-center justify-center px-1 font-bold animate-pulse">
                      {formatCount(unreadNotificationCount)}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
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
                                <p className="text-xs text-gray-300">
                                  {getNotificationText(notification)}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1">
                                  {formatTime(notification.createdAt)}
                                </p>
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
                            <p className="text-xs text-gray-600 mt-1">When someone interacts with your posts, you'll see it here</p>
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

            {/* Messages with Count */}
            {user && (
              <Link href="/community/messages" className="nav-icon relative p-2 rounded-full hover:bg-white/5 transition-colors">
                <MessageCircle className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-purple-500 text-[9px] rounded-full flex items-center justify-center px-1 font-bold animate-pulse">
                    {formatCount(unreadMessageCount)}
                  </span>
                )}
              </Link>
            )}

            {/* Profile */}
            {!isLoading && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-white/5"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
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
                      className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-gray-400 text-xs">{user.email}</p>
                      </div>
                      <Link href="/profile" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5">
                        <User className="w-4 h-4 mr-3" /> My Profile
                      </Link>
                      <Link href="/uploads" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5">
                        <Upload className="w-4 h-4 mr-3" /> My Uploads
                      </Link>
                      <Link href="/settings" className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5">
                        <BookOpen className="w-4 h-4 mr-3" /> Settings
                      </Link>
                      <button
                        onClick={() => { logout(); setIsProfileDropdownOpen(false); }}
                        className="flex items-center w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-white/5"
                      >
                        <X className="w-4 h-4 mr-3" /> Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-medium hover:from-purple-700 hover:to-pink-700 text-sm">
                Sign In
              </Link>
            )}

            {/* Mobile Menu */}
            <button className="lg:hidden text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-white/5"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Items */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-gray-900/95 backdrop-blur-lg border-t border-white/10 mt-3 rounded-b-xl overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4 p-4">
                {navLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center gap-2 transition-colors py-2 px-3 rounded-lg hover:bg-white/5 ${
                        isActive ? 'text-white font-medium' : 'text-gray-400 hover:text-white'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{link.name}</span>
                    </Link>
                  );
                })}
                <div className="col-span-2 mt-2 pt-2 border-t border-white/10"></div>
                {uploadMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2 text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-white/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* spacing */}
      <div className="h-24"></div>
    </>
  );
}