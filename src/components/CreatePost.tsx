// components/community/CreatePost.tsx
'use client';

import { useState, useRef } from "react";
import { db } from "#/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "#/context/AuthContext";
import { uploadToCloudinary } from "#/lib/cloudinary";
import { 
  ImageIcon, Youtube, LinkIcon, X, Loader2, Hash, ChevronDown, 
  MessageCircle, Star, HelpCircle, Sparkles, Film 
} from "lucide-react";
import Link from "next/link";

// All available interests for the dropdown
const INTERESTS = [
  "cinematography", "scriptwriting", "direction", "video editing", "photo editing",
  "photography", "acting", "animation", "movie review", "movie suggestion",
  "breakdown", "cine gossip", "gen ai", "freelance", "motion graphics",
  "sound design", "graphic design"
];

const POST_TYPES = [
  { value: "discussion", label: "Discussion", icon: MessageCircle, color: "text-blue-400" },
  { value: "question", label: "Question", icon: HelpCircle, color: "text-green-400" },
  { value: "review", label: "Review", icon: Star, color: "text-purple-400" },
  { value: "showcase", label: "Showcase", icon: Film, color: "text-yellow-400" }
];

interface CreatePostProps {
  onPostCreated?: () => void;
  selectedInterest?: string; // Pre-select an interest (for interest pages)
}

export default function CreatePost({ onPostCreated, selectedInterest }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    selectedInterest ? [selectedInterest] : []
  );
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setShowInterestDropdown(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const createPost = async () => {
    if (!user || loading) return;

    if (!content && !image && !ytUrl && !externalLink) {
      alert("Post cannot be empty");
      return;
    }

    if (!postType) {
      alert("Please select a post type");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      let youtubeData = null;

      // Upload image if selected
      if (image) {
        const result = await uploadToCloudinary(image, {
          folder: `community-posts/${user.uid}`,
          tags: ["community", ...selectedInterests]
        });
        imageUrl = result.url;
      }

      // Process YouTube URL if provided
      if (ytUrl && isValidUrl(ytUrl)) {
        const videoId = extractYouTubeId(ytUrl);
        if (videoId) {
          youtubeData = {
            url: ytUrl,
            videoId: videoId,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          };
        }
      }

      // Create post data with selected interests
      const postData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split("@")[0] || "User",
        userPhotoURL: user.photoURL || null,
        content: content || null,
        postType: postType,
        interests: selectedInterests, // 👈 KEY: This array determines where the post appears
        imageUrl: imageUrl || null,
        ytUrl: ytUrl || null,
        youtubeData: youtubeData || null,
        externalLink: externalLink || null,
        likes: [],
        likesCount: 0,
        shares: 0,
        commentCount: 0,
        viewCount: 0,
        isDeleted: false,
        isPinned: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "posts"), postData);

      // Reset form
      setContent("");
      setPostType("");
      setSelectedInterests(selectedInterest ? [selectedInterest] : []);
      setImage(null);
      setImagePreview("");
      setYtUrl("");
      setExternalLink("");

      if (onPostCreated) onPostCreated();
      
      // Show success message with info about where the post will appear
      const interestMessage = selectedInterests.length > 0
        ? `Your post will appear in: Home feed + ${selectedInterests.length} interest page(s)`
        : "Your post will only appear in the Home feed";
      alert(`Post created successfully! ${interestMessage}`);

    } catch (err) {
      console.error(err);
      alert("Error creating post");
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6 text-center">
        <p className="text-slate-400 mb-4">Sign in to share your thoughts</p>
        <Link href="/auth/signin" className="inline-block bg-purple-600 text-white px-6 py-2 rounded-full">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-5">
      {/* User Info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
          )}
        </div>
        <span className="text-white font-medium">{user.displayName || user.email?.split("@")[0] || "User"}</span>
      </div>

      {/* Content Input */}
      <textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full bg-transparent border-none resize-none min-h-[100px] text-white placeholder:text-slate-600 outline-none text-lg"
      />

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative mt-3 rounded-xl overflow-hidden">
          <img src={imagePreview} alt="Preview" className="max-h-64 w-full object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5 hover:bg-black/90"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Post Type Selection */}
      <div className="flex flex-wrap gap-2 mt-3">
        {POST_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setPostType(type.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              postType === type.value
                ? `${type.color} bg-white/10`
                : "text-slate-500 hover:bg-white/5"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Interest Selection - CRITICAL FOR MULTIPLE INTEREST PAGES */}
      <div className="mt-3 relative" ref={dropdownRef}>
        <button
          onClick={() => setShowInterestDropdown(!showInterestDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
        >
          <Hash size={12} />
          <span>{selectedInterests.length > 0 ? `${selectedInterests.length} selected` : "Add interests"}</span>
          <ChevronDown size={12} className={`transition-transform ${showInterestDropdown ? "rotate-180" : ""}`} />
        </button>

        {showInterestDropdown && (
          <div className="absolute top-full left-0 mt-2 z-20 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 w-80 max-h-64 overflow-y-auto">
            <p className="text-xs text-slate-400 mb-2">
              Select interests - your post will appear in each selected community
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-2 py-1 rounded-full text-xs capitalize transition-colors ${
                    selectedInterests.includes(interest)
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Display selected interests as badges */}
        {selectedInterests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedInterests.map(interest => (
              <Link
                key={interest}
                href={`/community/discover/${encodeURIComponent(interest)}`}
                className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full hover:bg-purple-500/30 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                #{interest}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Media Inputs */}
      <div className="space-y-2 mt-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ImageIcon size={14} />
          Add image
        </button>

        <input
          type="text"
          placeholder="YouTube URL"
          value={ytUrl}
          onChange={(e) => setYtUrl(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
        />

        <input
          type="text"
          placeholder="External link"
          value={externalLink}
          onChange={(e) => setExternalLink(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
        />
      </div>

      {/* Post Button */}
      <button
        onClick={createPost}
        disabled={loading}
        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-2 rounded-full text-white font-medium transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Post"}
      </button>

      {/* Info Text */}
      <p className="text-xs text-slate-500 mt-3 text-center">
        {selectedInterests.length > 0 
          ? `✨ Your post will appear in: Home feed + ${selectedInterests.length} community page(s)`
          : "⚡ No interests selected - post will only appear in Home feed"}
      </p>
    </div>
  );
}