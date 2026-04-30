'use client';
import { useState, useEffect } from "react";
import { FaPlus, FaTimes, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaFacebook, FaLinkedin, FaSnapchat, FaPinterest, FaTwitch, FaLink } from "react-icons/fa";
import type { Socials } from "#/types/user";

interface EditProfileProps {
  username: string;
  bio: string;
  socials: { url: string }[];
  onSave: (data: { username: string; bio: string; socials: { url: string }[] }) => void;
}

// Function to detect platform from URL
const detectPlatform = (url: string): string => {
  if (!url) return 'link';
  
  const urlLower = url.toLowerCase();
  if (urlLower.includes('instagram.com')) return 'instagram';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
  if (urlLower.includes('tiktok.com')) return 'tiktok';
  if (urlLower.includes('facebook.com')) return 'facebook';
  if (urlLower.includes('linkedin.com')) return 'linkedin';
  if (urlLower.includes('snapchat.com')) return 'snapchat';
  if (urlLower.includes('pinterest.com')) return 'pinterest';
  if (urlLower.includes('twitch.tv')) return 'twitch';
  
  return 'link';
};

// Function to get icon for platform
const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'instagram': return <FaInstagram className="text-pink-500" />;
    case 'twitter': return <FaTwitter className="text-blue-400" />;
    case 'youtube': return <FaYoutube className="text-red-600" />;
    case 'tiktok': return <FaTiktok className="text-black dark:text-white" />;
    case 'facebook': return <FaFacebook className="text-blue-600" />;
    case 'linkedin': return <FaLinkedin className="text-blue-700" />;
    case 'snapchat': return <FaSnapchat className="text-yellow-400" />;
    case 'pinterest': return <FaPinterest className="text-red-600" />;
    case 'twitch': return <FaTwitch className="text-purple-600" />;
    default: return <FaLink className="text-gray-400" />;
  }
};

export default function EditProfile({ username: initialUsername, bio: initialBio, socials: initialSocials, onSave }: EditProfileProps) {
  const [username, setUsername] = useState(initialUsername || "");
  const [bio, setBio] = useState(initialBio || "");
  const [socialLinks, setSocialLinks] = useState<{ url: string }[]>(initialSocials || []);

  useEffect(() => {
    setUsername(initialUsername || "");
    setBio(initialBio || "");
    setSocialLinks(initialSocials || []);
  }, [initialUsername, initialBio, initialSocials]);

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, value: string) => {
    const updated = [...socialLinks];
    updated[index].url = value;
    setSocialLinks(updated);
  };

  const handleSave = () => {
    // Filter out empty URLs before saving
    const filteredSocials = socialLinks.filter(social => social.url.trim() !== "");
    onSave({ username, bio, socials: filteredSocials });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800/50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Bio / Tagline</label>
        <input
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell people about yourself"
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Social Links</label>
        <div className="space-y-3">
          {socialLinks.map((social, idx) => {
            const platform = detectPlatform(social.url);
            return (
              <div key={idx} className="flex gap-2 items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-lg">
                  {getPlatformIcon(platform)}
                </div>
                <input
                  value={social.url}
                  onChange={e => updateSocialLink(idx, e.target.value)}
                  placeholder="Paste profile URL (e.g., https://instagram.com/username)"
                  className="flex-1 p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
                <button 
                  onClick={() => removeSocialLink(idx)} 
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            );
          })}
        </div>

        <button 
          onClick={addSocialLink} 
          className="flex items-center gap-2 mt-3 text-purple-400 hover:text-purple-300 p-2 hover:bg-purple-900/20 rounded-lg transition-colors"
        >
          <FaPlus /> Add Link
        </button>
      </div>

      <button
        onClick={handleSave}
        className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Save Changes
      </button>
    </div>
  );
}