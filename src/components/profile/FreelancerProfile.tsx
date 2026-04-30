// components/profile/FreelancerProfile.tsx
'use client'

import { useState } from "react"
import { 
  Award, Briefcase, DollarSign, Clock, Star, MapPin, Mail, Phone, 
  Edit2, Camera, Github, Linkedin, Globe, Users, ThumbsUp, Calendar,
  ArrowLeft, User, Film, Bookmark, Folder, ShoppingBag, GraduationCap,
  CreditCard, Settings, LogOut, X, Plus, Save, Upload, FileText
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '#/context/AuthContext'
import { db } from '#/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import Link from 'next/link'
import { uploadToCloudinary, getOptimizedImageUrl } from '#/lib/cloudinary'

interface FreelancerProfileProps {
  profile: any
}

export default function FreelancerProfile({ profile }: FreelancerProfileProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const userId = user?.id || user?.uid || profile?.id || profile?.uid
  const userEmail = user?.email || profile?.email
  const userName = user?.name || profile?.name || profile?.username || "User"
  const userPhoto = user?.photoURL || profile?.photoURL || profile?.avatar || "/default-avatar.png"
  
  const freelancerData = profile?.freelancerProfile || {}

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: freelancerData.title || 'Cinematographer',
    bio: freelancerData.bio || '',
    phone: freelancerData.phone || '1234569870',
    location: freelancerData.location || 'Kolkata, India',
    website: freelancerData.website || '',
    github: freelancerData.github || '',
    linkedin: freelancerData.linkedin || '',
    hourlyRate: freelancerData.hourlyRate || 0,
    experience: freelancerData.experience || '5',
    skills: freelancerData.skills || ['Video Editor', 'Cinematographer', 'Script Writer', 'Director'],
    languages: freelancerData.languages || [
      { name: 'Bengali', level: 'Native' },
      { name: 'English', level: 'Fluent' },
      { name: 'Hindi', level: 'Professional' }
    ],
    portfolio: freelancerData.portfolio || [
      { client: 'Client 1', rating: 5, comment: 'Excellent work!', date: '2024-01-15' },
      { client: 'Client 2', rating: 4, comment: 'Great collaboration', date: '2024-01-10' }
    ],
    education: freelancerData.education || [
      { degree: 'BFA in Film Making', institution: 'Film Institute', year: '2020-2024' }
    ],
    avatar: userPhoto
  })

  const [newSkill, setNewSkill] = useState('')
  const [newLanguage, setNewLanguage] = useState({ name: '', level: 'Native' })

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const addSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(s => s !== skill)
    })
  }

  const addLanguage = () => {
    if (newLanguage.name.trim()) {
      setEditForm({
        ...editForm,
        languages: [...editForm.languages, { ...newLanguage }]
      })
      setNewLanguage({ name: '', level: 'Native' })
    }
  }

  const removeLanguage = (index: number) => {
    setEditForm({
      ...editForm,
      languages: editForm.languages.filter((_, i) => i !== index)
    })
  }

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true)
      const preview = URL.createObjectURL(file)
      setEditForm(prev => ({ ...prev, avatar: preview }))

      const result = await uploadToCloudinary(file, {
        folder: "avatars",
        tags: ["avatar"]
      })

      setEditForm(prev => ({ ...prev, avatar: result.url }))
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    if (!userId) {
      console.error("No user ID found")
      return
    }

    setLoading(true)
    try {
      await updateDoc(doc(db, 'users', userId), {
  freelancerProfile: {
    title: editForm.title,
    bio: editForm.bio,
    phone: editForm.phone,
    location: editForm.location,
    website: editForm.website,
    github: editForm.github,
    linkedin: editForm.linkedin,
    hourlyRate: editForm.hourlyRate,
    experience: editForm.experience,
    skills: editForm.skills,
    languages: editForm.languages,
    portfolio: editForm.portfolio,
    education: editForm.education
  },
  photoURL: editForm.avatar,
  avatar: editForm.avatar,

  // 🔥🔥 ADD THIS LINE
  profileType: "freelancer"
})
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-6">
      {/* LEFT SIDEBAR */}
      <aside className="w-[230px] hidden md:block">
        <div className="sticky top-[90px] backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col text-sm">
            <p className="text-white font-semibold text-lg mb-6">Menu</p>

            {/* MAIN MENU */}
            <div className="space-y-5">
              {[
                { icon: User, label: "Profile Info" },
                { icon: Film, label: "My Movies" },
                { icon: Bookmark, label: "Watchlist" },
                { icon: Star, label: "Public Reviews" },
                { icon: Folder, label: "Saved Projects" },
                { icon: ShoppingBag, label: "My Products" },
                { icon: GraduationCap, label: "My Courses" }
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition">
                    <Icon size={20} />
                    <span className="text-[15px] font-medium">{item.label}</span>
                  </div>
                )
              })}
            </div>

            <hr className="border-white/10 my-8" />

            {/* FINANCE */}
            <div className="space-y-5">
              {[
                { icon: CreditCard, label: "Payment Method" },
                { icon: DollarSign, label: "Earnings" }
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition">
                    <Icon size={20} />
                    <span className="text-[15px] font-medium">{item.label}</span>
                  </div>
                )
              })}
            </div>

            <hr className="border-white/10 my-8" />

            {/* SETTINGS + LOGOUT */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer">
                <Settings size={20} />
                <span className="text-[15px] font-medium">Settings</span>
              </div>
              <div onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-500 cursor-pointer">
                <LogOut size={20} />
                <span className="text-[15px] font-medium">Logout</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT CONTENT */}
      <div className="flex-1 space-y-6">
        {/* Profile Header - Same size as normal profile header */}
        <div className="backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            
            {/* LEFT - Avatar and Info */}
            <div className="flex gap-8">
              {/* AVATAR - Same size w-36 h-36 */}
              <div className="relative group">
                <img
                  src={getOptimizedImageUrl(editForm.avatar, {
                    width: 300,
                    height: 300,
                    crop: "fill",
                    quality: "auto",
                    format: "auto"
                  }) || "/default-avatar.png"}
                  className="w-36 h-36 rounded-full object-cover"
                  alt={userName}
                />
                {isEditing && (
                  <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={(e: any) => {
                      const file = e.target.files?.[0]
                      if (file) uploadAvatar(file)
                    }} />
                  </label>
                )}
              </div>

              {/* PROFILE INFO - All text white */}
              <div className="flex-1">
                {/* Name with verified badge */}
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <input
                      name="username"
                      value={userName}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="bg-zinc-900 px-3 py-1 rounded text-xl font-bold text-white border border-white/10"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold flex items-center gap-1 text-white">
                      {userName}
                      {profile?.email === "cineplanter@gmail.com" && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#d13af7]">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </h1>
                  )}
                </div>

                {/* Email - same style */}
                <p className="text-slate-400 text-sm mt-1">{userEmail}</p>

                {/* Role - white text */}
                <p className="text-white text-sm mt-2">{editForm.title}</p>

                {/* STATS - Same as normal profile */}
                <div className="flex gap-8 mt-4">
                  <div className="text-center">
                    <b className="text-white-400 text-xl">{profile?.posts || 0}</b>
                    <p className="text-xs text-slate-400">posts</p>
                  </div>
                  <div className="text-center">
                    <b className="text-blue-400 text-xl">{profile?.followers?.length || 0}</b>
                    <p className="text-xs text-slate-400">followers</p>
                  </div>
                  <div className="text-center">
                    <b className="text-blue-400 text-xl">{profile?.following?.length || 0}</b>
                    <p className="text-xs text-slate-400">following</p>
                  </div>
                  {/* Success Rate - Default 0% */}
                  <div className="text-center">
                    <b className="text-green-400 text-xl">0%</b>
                    <p className="text-xs text-slate-400">success rate</p>
                  </div>
                  {/* Rating - Default 0.0/5 */}
                  <div className="text-center">
                    <b className="text-yellow-400 text-xl">0.0</b>
                    <p className="text-xs text-slate-400">rating</p>
                  </div>
                </div>

                {/* Bio - white text */}
                {editForm.bio && (
                  <p className="text-white text-sm mt-4">{editForm.bio}</p>
                )}

                {/* Location - same style */}
                {editForm.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                    <MapPin size={12} />
                    {editForm.location}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT - Action Buttons */}
            <div className="flex flex-col items-end gap-4">
              <div className="flex gap-2">
                {isEditing ? (
                  <button
                    onClick={saveProfile}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                  >
                    <Save size={16} className="inline mr-1" />
                    Save
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg flex items-center gap-2 text-sm transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit Profile
                    </button>
                    <Link
                      href="/profile/freelancer/id-card"
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm flex items-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      <Award size={16} />
                      ID Card
                    </Link>
                  </>
                )}
                <button
                  onClick={() => router.push('/profile?view=normal')}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Back to Normal Profile"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Skills</h2>
            {isEditing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="New skill"
                  className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1 text-sm text-white"
                />
                <button
                  onClick={addSkill}
                  className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-sm"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {editForm.skills.map((skill: string, index: number) => (
              <span key={index} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm flex items-center gap-2">
                {skill}
                {isEditing && (
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-400">
                    <X size={14} />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Section */}
          <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Portfolio</h2>
            <div className="space-y-4">
              {editForm.portfolio.map((item: any, index: number) => (
                <div key={index} className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{item.client}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < item.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-2">{item.rating}/5</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{item.date}</span>
                  </div>
                  <p className="text-sm text-gray-400">{item.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Languages & Education */}
          <div className="space-y-6">
            {/* Languages */}
            <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Languages Known</h2>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLanguage.name}
                      onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                      placeholder="Language"
                      className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1 text-sm text-white"
                    />
                    <select
                      value={newLanguage.level}
                      onChange={(e) => setNewLanguage({ ...newLanguage, level: e.target.value })}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1 text-sm text-white"
                    >
                      <option value="Native">Native</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Professional">Professional</option>
                      <option value="Conversational">Conversational</option>
                    </select>
                    <button
                      onClick={addLanguage}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-sm"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {editForm.languages.map((lang: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-300">{lang.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-purple-400">{lang.level}</span>
                      {isEditing && (
                        <button onClick={() => removeLanguage(index)} className="hover:text-red-400">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Education</h2>
              <div className="space-y-3">
                {editForm.education.map((edu: any, index: number) => (
                  <div key={index}>
                    <p className="font-semibold text-white">{edu.degree}</p>
                    <p className="text-sm text-gray-400">{edu.institution} · {edu.year}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        {(editForm.website || editForm.github || editForm.linkedin) && (
          <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Social</h2>
            <div className="flex gap-4">
              {editForm.website && (
                <a href={editForm.website} target="_blank" className="text-gray-400 hover:text-white">
                  <Globe size={20} />
                </a>
              )}
              {editForm.github && (
                <a href={editForm.github} target="_blank" className="text-gray-400 hover:text-white">
                  <Github size={20} />
                </a>
              )}
              {editForm.linkedin && (
                <a href={editForm.linkedin} target="_blank" className="text-gray-400 hover:text-white">
                  <Linkedin size={20} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}