// app/community/messages/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Search,
  Home,
  Info,
  Bookmark,
  Ban,
  Compass,
  ChevronDown,
  LucideIcon,
  MoreHorizontal,
  Phone,
  Video,
  Smile,
  Paperclip,
  Send,
  Image,
  User,
  Users,
  Settings,
  LogOut,
  CheckCheck,
  Mic,
  Camera,
  FileText,
  X,
  Plus,
  Loader2,
  Circle,
  MoreVertical,
  Heart,
  Reply,
  Copy,
  Flag,
  Forward,
  Trash2,
  UserX,
  EyeOff,
  Pin,
  Clock
} from "lucide-react";

import Navbar from "#/components/Navbar";
import { useAuth } from "#/context/AuthContext";
import { db, auth } from "#/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  limit,
  getDocs,
  arrayUnion,
  arrayRemove,
  increment,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import dynamic from "next/dynamic";

// Dynamic import for EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  { ssr: false }
);

const interestCategories = [
  "cinematography",
  "scriptwriting",
  "direction",
  "video editing",
  "photography",
  "acting",
  "animation",
  "movie review",
  "gen AI",
  "motion graphics",
  "sound design",
];

type SidebarLinkProps = {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
  showLabel?: boolean;
};

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  lastMessageSender: string;
  unreadCount: Record<string, number>;
  updatedAt: any;
  isPinned?: boolean;
  isMarkedUnread?: boolean;
}

interface UserProfile {
  uid: string;
  name: string;
  username: string;
  avatar: string;
  photoURL?: string;
  online?: boolean;
  lastSeen?: any;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: any;
  readBy: string[];
  reactions?: Record<string, string>;
  isDeleted?: boolean;
}

export default function MessagesPage() {
  const { user: contextUser } = useAuth();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [showInterests, setShowInterests] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [conversationUsers, setConversationUsers] = useState<Map<string, UserProfile>>(new Map());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUser = firebaseUser || contextUser;
  const currentUserId = currentUser?.uid;

  // Get current Firebase user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Update user online status
  useEffect(() => {
    if (!currentUserId) return;

    const userRef = doc(db, "users", currentUserId);
    
    const updateOnlineStatus = async () => {
      try {
        await updateDoc(userRef, {
          online: true,
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };
    
    updateOnlineStatus();
    
    const handleBeforeUnload = () => {
      updateDoc(userRef, { online: false }).catch(console.error);
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      updateDoc(userRef, { online: false }).catch(console.error);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentUserId]);

  // Load conversations with user details
  useEffect(() => {
    if (!currentUserId) return;

    setLoading(true);
    
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUserId)
    );

    const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
      const convos: Conversation[] = [];
      const usersMap = new Map(conversationUsers);
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const conversation: Conversation = {
          id: docSnap.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || "",
          lastMessageTime: data.lastMessageTime,
          lastMessageSender: data.lastMessageSender || "",
          unreadCount: data.unreadCount || {},
          updatedAt: data.updatedAt,
          isPinned: data.isPinned || false,
          isMarkedUnread: data.isMarkedUnread || false
        };
        convos.push(conversation);
        
        // Fetch other participant's user details
        const otherUserId = conversation.participants.find(id => id !== currentUserId);
        if (otherUserId && !usersMap.has(otherUserId)) {
          const userRef = doc(db, "users", otherUserId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            usersMap.set(otherUserId, {
              uid: otherUserId,
              name: userData.name || userData.displayName || "User",
              username: userData.username || "",
              avatar: userData.avatar || userData.photoURL || "",
              photoURL: userData.photoURL,
              online: userData.online || false,
              lastSeen: userData.lastSeen
            });
          }
        }
      }
      
      // Sort: pinned first, then by updatedAt
      convos.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = a.updatedAt?.toDate?.() || new Date(0);
        const timeB = b.updatedAt?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
      
      setConversationUsers(usersMap);
      setConversations(convos);
      setLoading(false);
    }, (error) => {
      console.error("Error loading conversations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Real-time listener for user presence updates
  useEffect(() => {
    if (!currentUserId || conversationUsers.size === 0) return;
    
    const unsubscribes: (() => void)[] = [];
    
    conversationUsers.forEach((user, userId) => {
      const userRef = doc(db, "users", userId);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConversationUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(userId, {
              ...prev.get(userId)!,
              online: data.online || false,
              lastSeen: data.lastSeen,
              name: data.name || data.displayName || prev.get(userId)?.name || "User",
              avatar: data.avatar || data.photoURL || prev.get(userId)?.avatar || ""
            });
            return newMap;
          });
        }
      });
      unsubscribes.push(unsubscribe);
    });
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUserId, conversationUsers.size]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", selectedConversation.id)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({ 
          id: docSnap.id, 
          conversationId: data.conversationId,
          senderId: data.senderId,
          text: data.text,
          createdAt: data.createdAt,
          readBy: data.readBy || [],
          reactions: data.reactions || {},
          isDeleted: data.isDeleted || false
        } as Message);
      });
      
      const activeMessages = msgs.filter(msg => !msg.isDeleted);
      
      activeMessages.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0);
        const timeB = b.createdAt?.toDate?.() || new Date(0);
        return timeA.getTime() - timeB.getTime();
      });
      
      setMessages(activeMessages);
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      
      markMessagesAsRead(selectedConversation.id);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // Load user details for selected conversation
  useEffect(() => {
    if (!selectedConversation || !currentUserId) return;

    const otherUserId = selectedConversation.participants.find(id => id !== currentUserId);
    if (otherUserId) {
      const userFromMap = conversationUsers.get(otherUserId);
      if (userFromMap) {
        setSelectedUser(userFromMap);
      } else {
        const userRef = doc(db, "users", otherUserId);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSelectedUser({
              uid: otherUserId,
              name: data.name || data.displayName || "User",
              username: data.username || "",
              avatar: data.avatar || data.photoURL || "",
              photoURL: data.photoURL,
              online: data.online || false,
              lastSeen: data.lastSeen
            });
          }
        });
        return () => unsubscribe();
      }
    }
  }, [selectedConversation, currentUserId, conversationUsers]);

  // Mark messages as read
  const markMessagesAsRead = async (conversationId: string) => {
    if (!currentUserId) return;
    
    const unreadMessages = messages.filter(
      msg => msg.senderId !== currentUserId && !msg.readBy?.includes(currentUserId)
    );
    
    for (const msg of unreadMessages) {
      const msgRef = doc(db, "messages", msg.id);
      await updateDoc(msgRef, {
        readBy: arrayUnion(currentUserId)
      });
    }
    
    const convRef = doc(db, "conversations", conversationId);
    await updateDoc(convRef, {
      [`unreadCount.${currentUserId}`]: 0
    });
  };

  // Add reaction to message
  const addReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) return;
    
    const msgRef = doc(db, "messages", messageId);
    await updateDoc(msgRef, {
      [`reactions.${currentUserId}`]: emoji
    });
    
    setShowMessageMenu(null);
  };

  // Copy message to clipboard
  const copyMessage = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert("Message copied to clipboard!");
    setShowMessageMenu(null);
  };

  // Forward message
  const forwardMessage = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert("Message copied. You can now paste it in another conversation.");
    setShowMessageMenu(null);
  };

  // Unsend (delete) message
  const unsendMessage = async (messageId: string) => {
    if (!confirm("Delete this message for everyone?")) return;
    
    try {
      const msgRef = doc(db, "messages", messageId);
      await updateDoc(msgRef, {
        isDeleted: true,
        text: "This message was unsent",
        deletedAt: serverTimestamp()
      });
      setShowMessageMenu(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  // Report message
  const reportMessage = async (messageId: string) => {
    if (!currentUserId) return;
    
    try {
      await addDoc(collection(db, "messageReports"), {
        messageId: messageId,
        reportedBy: currentUserId,
        reportedUser: selectedUser?.uid,
        reason: "Inappropriate content",
        createdAt: serverTimestamp(),
        status: "pending"
      });
      alert("Message reported. Our team will review it.");
      setShowMessageMenu(null);
    } catch (error) {
      console.error("Error reporting message:", error);
    }
  };

  // Block user
  const blockUser = async () => {
    if (!currentUserId || !selectedUser) return;
    
    if (!confirm(`Are you sure you want to block ${selectedUser.name}? You won't receive messages from them.`)) return;
    
    try {
      const userRef = doc(db, "users", currentUserId);
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(selectedUser.uid)
      });
      alert("User blocked successfully");
      setShowUserMenu(false);
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  // Restrict user (mute)
  const restrictUser = async () => {
    if (!currentUserId || !selectedUser) return;
    
    if (!confirm(`Mute ${selectedUser.name}? You won't get notifications from them.`)) return;
    
    try {
      const userRef = doc(db, "users", currentUserId);
      await updateDoc(userRef, {
        mutedUsers: arrayUnion(selectedUser.uid)
      });
      alert("User muted successfully");
      setShowUserMenu(false);
    } catch (error) {
      console.error("Error muting user:", error);
    }
  };

  // Pin conversation
  const pinConversation = async (conversationId: string, isPinned: boolean) => {
    try {
      const convRef = doc(db, "conversations", conversationId);
      await updateDoc(convRef, {
        isPinned: !isPinned
      });
      setShowConversationMenu(null);
    } catch (error) {
      console.error("Error pinning conversation:", error);
    }
  };

  // Mark as unread
  const markAsUnread = async (conversationId: string, isMarkedUnread: boolean) => {
    try {
      const convRef = doc(db, "conversations", conversationId);
      if (!isMarkedUnread) {
        await updateDoc(convRef, {
          [`unreadCount.${currentUserId}`]: 1,
          isMarkedUnread: true
        });
      } else {
        await updateDoc(convRef, {
          [`unreadCount.${currentUserId}`]: 0,
          isMarkedUnread: false
        });
      }
      setShowConversationMenu(null);
    } catch (error) {
      console.error("Error marking as unread:", error);
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    
    try {
      const convRef = doc(db, "conversations", conversationId);
      await deleteDoc(convRef);
      setShowConversationMenu(null);
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !currentUserId || !selectedConversation) return;
    
    setSending(true);
    const messageText = messageInput.trim();
    setMessageInput("");
    setReplyingTo(null);
    
    try {
      await addDoc(collection(db, "messages"), {
        conversationId: selectedConversation.id,
        senderId: currentUserId,
        text: messageText,
        createdAt: serverTimestamp(),
        readBy: [currentUserId],
        reactions: {},
        isDeleted: false
      });
      
      const convRef = doc(db, "conversations", selectedConversation.id);
      await updateDoc(convRef, {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: currentUserId,
        updatedAt: serverTimestamp()
      });
      
      const otherUserId = selectedConversation.participants.find(id => id !== currentUserId);
      if (otherUserId) {
        await updateDoc(convRef, {
          [`unreadCount.${otherUserId}`]: increment(1)
        });
      }
      
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Start new conversation
  const startNewConversation = async (otherUser: UserProfile) => {
    if (!currentUserId) return;
    
    const existingConvo = conversations.find(conv => 
      conv.participants.includes(otherUser.uid) && conv.participants.includes(currentUserId)
    );
    
    if (existingConvo) {
      setSelectedConversation(existingConvo);
      setShowNewChat(false);
      setSearchTerm("");
      setSearchResults([]);
      return;
    }
    
    try {
      const newConversation = {
        participants: [currentUserId, otherUser.uid],
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        lastMessageSender: "",
        unreadCount: { [currentUserId]: 0, [otherUser.uid]: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPinned: false,
        isMarkedUnread: false
      };
      
      const docRef = await addDoc(collection(db, "conversations"), newConversation);
      
      // Add to conversationUsers map
      setConversationUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(otherUser.uid, otherUser);
        return newMap;
      });
      
      setSelectedConversation({ id: docRef.id, ...newConversation } as Conversation);
      setShowNewChat(false);
      setSearchTerm("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  // Search users
  useEffect(() => {
    if (!searchTerm.trim() || !currentUserId) {
      setSearchResults([]);
      return;
    }
    
    const searchUsers = async () => {
      setSearching(true);
      try {
        const usersRef = collection(db, "users");
        const usersQuery = query(usersRef, limit(50));
        
        const snapshot = await getDocs(usersQuery);
        const userList: UserProfile[] = [];
        const searchLower = searchTerm.toLowerCase();
        
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== currentUserId) {
            const data = docSnap.data();
            const name = (data.name || data.displayName || "").toLowerCase();
            const username = (data.username || "").toLowerCase();
            
            if (name.includes(searchLower) || username.includes(searchLower)) {
              userList.push({
                uid: docSnap.id,
                name: data.name || data.displayName || "User",
                username: data.username || "",
                avatar: data.avatar || data.photoURL || "",
                photoURL: data.photoURL,
                online: data.online || false,
                lastSeen: data.lastSeen
              });
            }
          }
        });
        
        setSearchResults(userList);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setSearching(false);
      }
    };
    
    const debounce = setTimeout(searchUsers, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm, currentUserId]);

  // Format time for conversation list
  const formatConversationTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setMessageInput(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Mail className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">Sign in to view messages</p>
          <Link 
            href="/auth/signin"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-full transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      
      <main className="relative h-[calc(100vh-64px)] pt-0 overflow-hidden">
        {/* Background Glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-purple-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        </div>

        <div className="flex h-full">
          {/* LEFT SIDEBAR */}
          <aside className="w-[80px] flex-shrink-0 flex flex-col items-center py-6 border-r border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 h-full">
            <div className="flex flex-col gap-3 w-full px-2">
              <SidebarLink icon={Home} label="Home" href="/community" />
              <SidebarLink icon={Mail} label="Messages" href="/community/messages" active />
              
              <div className="py-1 relative">
                <button
                  onClick={() => setShowInterests((prev) => !prev)}
                  className="w-full flex items-center justify-center p-3 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all group relative"
                >
                  <Compass className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showInterests && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full top-0 ml-2 z-50 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[160px]"
                    >
                      {interestCategories.map((interest) => (
                        <Link
                          key={interest}
                          href={`/community/discover/${encodeURIComponent(interest)}`}
                          className="block py-2 px-3 text-xs text-slate-400 hover:text-purple-300 hover:bg-white/5 rounded-lg capitalize"
                        >
                          {interest}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                <SidebarLink icon={Info} label="Info" href="/community/instructions" />
                <SidebarLink icon={Bookmark} label="Saved" href="/community/saved" />
                <SidebarLink icon={Ban} label="Blocked" href="/community/blocked" />
              </div>

              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-2">
                <SidebarLink icon={User} label="Profile" href="/profile" />
                <SidebarLink icon={Settings} label="Settings" href="/settings" />
                <SidebarLink icon={LogOut} label="Logout" href="/auth/signout" />
              </div>
            </div>
          </aside>

          {/* MIDDLE PANEL - Chat List */}
          <section className="w-[380px] flex-shrink-0 flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl h-full">
            <div className="flex-shrink-0 p-5 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-white tracking-tight">Messages</h1>
                <button 
                  onClick={() => setShowNewChat(!showNewChat)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Plus size={18} className="text-slate-400" />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500/30 focus:bg-white/10 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* New Chat Panel */}
            <AnimatePresence>
              {showNewChat && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-shrink-0 px-3 pb-3 border-b border-white/10"
                >
                  <p className="text-xs text-slate-400 mb-2 px-2">Start a new conversation</p>
                  {searching ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.uid}
                          onClick={() => startNewConversation(user)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-left"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex-shrink-0">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-purple-400" />
                                </div>
                              )}
                            </div>
                            {user.online && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <p className="text-xs text-slate-500 text-center py-6">No users found</p>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6">Search for users to start chatting</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable Chat List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conv) => {
                  const otherUserId = conv.participants.find(id => id !== currentUserId);
                  const otherUser = otherUserId ? conversationUsers.get(otherUserId) : null;
                  const unreadCount = conv.unreadCount?.[currentUserId || ''] || 0;
                  
                  if (!otherUser) return null;
                  
                  return (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedConversation?.id === conv.id 
                          ? "bg-purple-500/20 border border-purple-500/30" 
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div 
                        className="flex-1 min-w-0 flex items-center gap-3"
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                            {otherUser.avatar ? (
                              <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-6 h-6 text-purple-400" />
                              </div>
                            )}
                          </div>
                          {otherUser.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              {conv.isPinned && <Pin size={12} className="text-purple-400 flex-shrink-0" />}
                              <p className="text-sm font-medium text-white truncate">{otherUser.name || "User"}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">
                              {formatConversationTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {conv.lastMessageSender === currentUserId ? "You: " : ""}
                            {conv.lastMessage || "Start a conversation"}
                          </p>
                        </div>
                      </div>
                      
                      {/* 3-dot menu for conversation */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConversationMenu(showConversationMenu === conv.id ? null : conv.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <MoreVertical size={16} className="text-slate-400" />
                        </button>
                        <AnimatePresence>
                          {showConversationMenu === conv.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute right-0 top-full mt-1 z-50 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl py-1 min-w-[160px] shadow-2xl"
                            >
                              <button
                                onClick={() => pinConversation(conv.id, conv.isPinned || false)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                              >
                                <Pin size={14} />
                                <span>{conv.isPinned ? "Unpin" : "Pin"}</span>
                              </button>
                              <button
                                onClick={() => markAsUnread(conv.id, conv.isMarkedUnread || false)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                              >
                                <Clock size={14} />
                                <span>{conv.isMarkedUnread ? "Mark as Read" : "Mark as Unread"}</span>
                              </button>
                              <button
                                onClick={() => deleteConversation(conv.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
                              >
                                <Trash2 size={14} />
                                <span>Delete Chat</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {unreadCount > 0 && (
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500">No messages yet</p>
                  <p className="text-xs text-slate-600 mt-1">Start a conversation</p>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT PANEL - Chat Window */}
          {selectedConversation && selectedUser ? (
            <div className="flex-1 flex flex-col h-full bg-transparent">
              {/* TOP HEADER */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-400" />
                        </div>
                      )}
                    </div>
                    {selectedUser.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                    )}
                  </div>
                  <div>
                    <Link href={`/profile/${selectedUser.uid}`}>
                      <p className="text-sm font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer">
                        {selectedUser.name}
                      </p>
                    </Link>
                    <Link href={`/profile/${selectedUser.uid}`}>
                      <p className="text-[10px] text-slate-400 hover:text-purple-400 transition-colors cursor-pointer">
                        @{selectedUser.username}
                      </p>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-1 relative">
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Phone size={16} className="text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Video size={16} className="text-slate-400" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <MoreHorizontal size={16} className="text-slate-400" />
                    </button>
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, x: -40 }}
                          animate={{ opacity: 1, y: 0, x: -40 }}
                          exit={{ opacity: 0, y: -10, x: -40 }}
                          className="absolute right-0 top-full mt-1 z-50 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl py-1 min-w-[160px]"
                        >
                          <button
                            onClick={blockUser}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
                          >
                            <UserX size={14} />
                            <span>Block User</span>
                          </button>
                          <button
                            onClick={restrictUser}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-yellow-400 hover:bg-white/10 transition-colors"
                          >
                            <EyeOff size={14} />
                            <span>Mute / Restrict</span>
                          </button>
                          <button
                            onClick={() => setShowUserMenu(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:bg-white/10 transition-colors"
                          >
                            <Flag size={14} />
                            <span>Report User</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* MESSAGE AREA */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500 text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = msg.senderId === currentUserId;
                    const isDeleted = msg.isDeleted;
                    const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
                    const showReactions = !isDeleted && hasReactions;
                    
                    // Determine if avatar should be shown
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== msg.senderId);
                    
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} items-start gap-2 group`}>
                        {!isOwn && showAvatar && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                            <img src={selectedUser.avatar || "/default-avatar.png"} className="w-full h-full object-cover" alt="" />
                          </div>
                        )}
                        {!isOwn && !showAvatar && (
                          <div className="w-8 flex-shrink-0" />
                        )}
                        
                        {/* Message Bubble */}
                        <div
                          className={`relative max-w-[70%] px-3 py-2 rounded-2xl ${
                            isOwn 
                              ? "bg-purple-600 text-white rounded-br-sm"
                              : "bg-white/10 backdrop-blur-sm text-slate-200 rounded-bl-sm border border-white/10"
                          }`}
                        >
                          {replyingTo && replyingTo.id === msg.id && (
                            <div className="mb-1 pb-1 border-b border-white/20">
                              <p className="text-xs text-purple-300">Replying to...</p>
                              <p className="text-xs text-slate-300 truncate max-w-[200px]">{replyingTo.text}</p>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{isDeleted ? "This message was unsent" : msg.text}</p>
                          
                          {/* Reaction Display */}
                          {showReactions && (
                            <div className="absolute -bottom-4 -right-2 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1">
                              {Object.entries(msg.reactions || {}).map(([userId, emoji]) => (
                                <span key={userId} className="text-xs">{emoji}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Action Icons */}
                        <div className={`flex gap-1 transition-opacity ${isOwn ? "order-first" : ""} ${isOwn ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                          <button
                            onClick={() => {
                              setReplyingTo(msg);
                              inputRef.current?.focus();
                            }}
                            className="p-1 hover:text-blue-400 transition-colors"
                            title="Reply"
                          >
                            <Reply size={14} className="text-slate-400 hover:text-blue-400" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setShowMessageMenu(showMessageMenu === msg.id ? null : msg.id)}
                              className="p-1 hover:text-white transition-colors"
                              title="More options"
                            >
                              <MoreVertical size={14} className="text-slate-400 hover:text-white" />
                            </button>
                            
                            {/* Message Menu Popup */}
                            <AnimatePresence>
                              {showMessageMenu === msg.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className={`absolute z-50 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl py-1 min-w-[140px] shadow-2xl ${
                                    isOwn 
                                      ? "right-full top-0 mr-1" 
                                      : "left-full top-0 ml-1"
                                  }`}
                                >
                                  {!isOwn && (
                                    <button
                                      onClick={() => addReaction(msg.id, '❤️')}
                                      className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-colors"
                                    >
                                      <Heart size={14} />
                                      <span>❤️ React</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => forwardMessage(msg.text)}
                                    className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-colors"
                                  >
                                    <Forward size={14} />
                                    <span>Forward</span>
                                  </button>
                                  <button
                                    onClick={() => copyMessage(msg.text)}
                                    className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-colors"
                                  >
                                    <Copy size={14} />
                                    <span>Copy</span>
                                  </button>
                                  {isOwn ? (
                                    <button
                                      onClick={() => unsendMessage(msg.id)}
                                      className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
                                    >
                                      <Trash2 size={14} />
                                      <span>Unsend</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => reportMessage(msg.id)}
                                      className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
                                    >
                                      <Flag size={14} />
                                      <span>Report</span>
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT AREA */}
              <div className="flex-shrink-0 p-4 bg-transparent">
                {replyingTo && (
                  <div className="mb-2 px-3 py-2 bg-white/5 rounded-lg border-l-4 border-purple-500 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-xs text-purple-400">Replying to:</p>
                      <p className="text-xs text-slate-300 truncate">{replyingTo.text}</p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-1 hover:bg-white/10 rounded-full"
                    >
                      <X size={14} className="text-slate-400" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2">
                  <button 
                    onClick={() => setShowAttachments(!showAttachments)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Plus size={18} className="text-slate-400" />
                  </button>
                  
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 py-2"
                  />
                  
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Smile size={18} className="text-slate-400" />
                      </button>
                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 z-50"
                          >
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                      <Paperclip size={18} className="text-slate-400" />
                    </button>
                    <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                      <Image size={18} className="text-slate-400" />
                    </button>
                    <button 
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full transition-colors ml-1 disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 size={16} className="animate-spin text-white" />
                      ) : (
                        <Send size={16} className="text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Attachment Menu */}
                <AnimatePresence>
                  {showAttachments && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-20 left-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl"
                    >
                      <div className="grid grid-cols-4 gap-2">
                        <button className="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg">
                          <Camera className="w-5 h-5 text-purple-400 mb-1" />
                          <span className="text-[8px] text-slate-400">Camera</span>
                        </button>
                        <button className="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg">
                          <Image className="w-5 h-5 text-blue-400 mb-1" />
                          <span className="text-[8px] text-slate-400">Gallery</span>
                        </button>
                        <button className="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg">
                          <FileText className="w-5 h-5 text-green-400 mb-1" />
                          <span className="text-[8px] text-slate-400">File</span>
                        </button>
                        <button className="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg">
                          <Mic className="w-5 h-5 text-pink-400 mb-1" />
                          <span className="text-[8px] text-slate-400">Audio</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center bg-transparent">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-purple-400/50" />
                </div>
                <p className="text-slate-400 text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, href, active = false }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center p-3 rounded-xl transition-all ${
        active
          ? "text-white bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30"
          : "text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
      title={label}
    >
      <Icon className="w-5 h-5" />
    </Link>
  );
}