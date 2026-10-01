// app/profile/freelancer/edit/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useAuth } from "#/context/AuthContext"
import Navbar from "#/components/Navbar"
import { db } from "#/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import {
  User, Film, Star, GraduationCap, Briefcase,
  Award, Settings, LogOut, Camera,
  Plus, X, Save, ArrowLeft, Globe, Calendar
} from 'lucide-react'
import { uploadToCloudinary } from "#/lib/cloudinary"

export default function EditFreelancerProfilePage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({
    avatar: false,
    cover: false,
    portfolio: false
  })

  // ✅ Safe user ID
  const userId = user?.id || (user as any)?.uid

  // Form state
  const [form, setForm] = useState({
    avatar: "",
    coverImage: "",
    displayName: "",
    username: "",
    email: "",
    phone: "",
    location: "",
    title: "",
    bio: "",
    experience: "",
    hourlyRate: 0,
    availability: "freelance" as "freelance" | "full-time" | "part-time" | "contract",
    skills: [] as string[],
    languages: [] as { name: string; level: string }[],
    tools: [] as string[],
    portfolio: [] as {
      id: string
      title: string
      description: string
      image: string
      category: string
      link: string
      date: string
    }[],
    workHistory: [] as {
      id: string
      company: string
      position: string
      startDate: string
      endDate: string
      current: boolean
      description: string
    }[],
    education: [] as {
      id: string
      degree: string
      institution: string
      year: string
      description: string
    }[],
    certifications: [] as {
      id: string
      name: string
      issuer: string
      year: string
      link: string
    }[],
    website: "",
    github: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
    availableForHire: true,
    showEmail: true,
    showPhone: false
  })

  // New item states
  const [newSkill, setNewSkill] = useState("")
  const [newTool, setNewTool] = useState("")
  const [newLanguage, setNewLanguage] = useState({ name: "", level: "Native" })
  const [newPortfolio, setNewPortfolio] = useState({
    title: "",
    description: "",
    image: "",
    category: "",
    link: "",
    date: new Date().toISOString().split('T')[0]
  })
  const [newWork, setNewWork] = useState({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    current: false,
    description: ""
  })
  const [newEducation, setNewEducation] = useState({
    degree: "",
    institution: "",
    year: "",
    description: ""
  })
  const [newCertification, setNewCertification] = useState({
    name: "",
    issuer: "",
    year: "",
    link: ""
  })

  const [activeTab, setActiveTab] = useState("basic")

  const menuItems = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "professional", label: "Professional", icon: Briefcase },
    { id: "skills", label: "Skills & Tools", icon: Star },
    { id: "portfolio", label: "Portfolio", icon: Film },
    { id: "work", label: "Work History", icon: Calendar },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "social", label: "Social Links", icon: Globe },
    { id: "settings", label: "Settings", icon: Settings }
  ]

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
      return
    }
    if (user && userId) {
      loadFreelancerData()
    }
  }, [user, isLoading, userId])

  const loadFreelancerData = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data = userSnap.data()
        const profile = data.freelancerProfile || {}

        setForm({
          avatar: data.avatar || "",
          coverImage: profile.coverImage || "",
          displayName: data.name || "",
          username: data.username || "",
          email: data.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
          title: profile.title || "",
          bio: profile.bio || "",
          experience: profile.experience || "",
          hourlyRate: profile.hourlyRate || 0,
          availability: profile.availability || "freelance",
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          languages: Array.isArray(profile.languages) ? profile.languages : [],
          tools: Array.isArray(profile.tools) ? profile.tools : [],
          portfolio: Array.isArray(profile.portfolio) ? profile.portfolio : [],
          workHistory: Array.isArray(profile.workHistory) ? profile.workHistory : [],
          education: Array.isArray(profile.education) ? profile.education : [],
          certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
          website: profile.website || "",
          github: profile.github || "",
          linkedin: profile.linkedin || "",
          twitter: profile.twitter || "",
          instagram: profile.instagram || "",
          facebook: profile.facebook || "",
          availableForHire: profile.availableForHire ?? true,
          showEmail: profile.showEmail ?? true,
          showPhone: profile.showPhone ?? false
        })
      }
    } catch (error) {
      console.error('Error loading freelancer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(prev => ({ ...prev, avatar: true }))
      const preview = URL.createObjectURL(file)
      setForm(prev => ({ ...prev, avatar: preview }))

      const result = await uploadToCloudinary(file, {
        folder: "avatars",
        tags: ["avatar"]
      })

      setForm(prev => ({ ...prev, avatar: result.url }))
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(prev => ({ ...prev, avatar: false }))
    }
  }

  const uploadCoverImage = async (file: File) => {
    try {
      setUploading(prev => ({ ...prev, cover: true }))
      const preview = URL.createObjectURL(file)
      setForm(prev => ({ ...prev, coverImage: preview }))

      const result = await uploadToCloudinary(file, {
        folder: "cover-images",
        tags: ["cover"]
      })

      setForm(prev => ({ ...prev, coverImage: result.url }))
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(prev => ({ ...prev, cover: false }))
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !form.skills.includes(newSkill.trim())) {
      setForm({ ...form, skills: [...form.skills, newSkill.trim()] })
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter(s => s !== skill) })
  }

  const addTool = () => {
    if (newTool.trim() && !form.tools.includes(newTool.trim())) {
      setForm({ ...form, tools: [...form.tools, newTool.trim()] })
      setNewTool('')
    }
  }

  const removeTool = (tool: string) => {
    setForm({ ...form, tools: form.tools.filter(t => t !== tool) })
  }

  const addLanguage = () => {
    if (newLanguage.name.trim()) {
      setForm({ ...form, languages: [...form.languages, { ...newLanguage }] })
      setNewLanguage({ name: '', level: 'Native' })
    }
  }

  const removeLanguage = (index: number) => {
    setForm({ ...form, languages: form.languages.filter((_, i) => i !== index) })
  }

  const addPortfolio = () => {
    if (newPortfolio.title.trim()) {
      setForm({
        ...form,
        portfolio: [...form.portfolio, {
          id: Date.now().toString(),
          ...newPortfolio,
          image: newPortfolio.image || "https://via.placeholder.com/300x200"
        }]
      })
      setNewPortfolio({
        title: "",
        description: "",
        image: "",
        category: "",
        link: "",
        date: new Date().toISOString().split('T')[0]
      })
    }
  }

  const removePortfolio = (id: string) => {
    setForm({ ...form, portfolio: form.portfolio.filter(item => item.id !== id) })
  }

  const addWork = () => {
    if (newWork.company.trim() && newWork.position.trim()) {
      setForm({
        ...form,
        workHistory: [...form.workHistory, { id: Date.now().toString(), ...newWork }]
      })
      setNewWork({
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        current: false,
        description: ""
      })
    }
  }

  const removeWork = (id: string) => {
    setForm({ ...form, workHistory: form.workHistory.filter(item => item.id !== id) })
  }

  const addEducation = () => {
    if (newEducation.degree.trim() && newEducation.institution.trim()) {
      setForm({
        ...form,
        education: [...form.education, { id: Date.now().toString(), ...newEducation }]
      })
      setNewEducation({ degree: "", institution: "", year: "", description: "" })
    }
  }

  const removeEducation = (id: string) => {
    setForm({ ...form, education: form.education.filter(item => item.id !== id) })
  }

  const addCertification = () => {
    if (newCertification.name.trim() && newCertification.issuer.trim()) {
      setForm({
        ...form,
        certifications: [...form.certifications, { id: Date.now().toString(), ...newCertification }]
      })
      setNewCertification({ name: "", issuer: "", year: "", link: "" })
    }
  }

  const removeCertification = (id: string) => {
    setForm({ ...form, certifications: form.certifications.filter(item => item.id !== id) })
  }

  const saveProfile = async () => {
    if (!userId) {
      console.error('User not logged in')
      return
    }

    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', userId), {
        name: form.displayName,
        username: form.username,
        avatar: form.avatar,
        freelancerProfile: {
          coverImage: form.coverImage,
          title: form.title,
          bio: form.bio,
          phone: form.phone,
          location: form.location,
          experience: form.experience,
          hourlyRate: form.hourlyRate,
          availability: form.availability,
          skills: form.skills,
          tools: form.tools,
          languages: form.languages,
          portfolio: form.portfolio,
          workHistory: form.workHistory,
          education: form.education,
          certifications: form.certifications,
          website: form.website,
          github: form.github,
          linkedin: form.linkedin,
          twitter: form.twitter,
          instagram: form.instagram,
          facebook: form.facebook,
          availableForHire: form.availableForHire,
          showEmail: form.showEmail,
          showPhone: form.showPhone
        }
      })

      router.push('/profile/freelancer')
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    )
  }

  if (!user) return null

  const languageLevels = ["Native", "Fluent", "Professional", "Conversational"]

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl sm:text-3xl font-bold">Edit Profile</h1>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 sm:px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 text-sm"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Sidebar Tabs */}
          <aside className="md:w-56 flex-shrink-0">
            <div className="md:sticky md:top-24 bg-white/[0.04] border border-white/10 rounded-2xl p-2 md:p-4 overflow-x-auto">
              <div className="flex md:flex-col gap-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm transition-colors whitespace-nowrap ${
                        activeTab === item.id
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* BASIC INFO */}
            {activeTab === "basic" && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-6">Basic Information</h2>
                <div className="space-y-5">
                  {/* Cover */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image</label>
                    <div className="relative h-32 sm:h-40 bg-zinc-900 rounded-xl overflow-hidden">
                      {form.coverImage && (
                        <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                        <Camera size={24} />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadCoverImage(file)
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-purple-500/30">
                          <img
                            src={form.avatar || "/default-avatar.png"}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={20} />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) uploadAvatar(file)
                            }}
                          />
                        </label>
                      </div>
                      {uploading.avatar && <span className="text-sm text-gray-400">Uploading...</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Display Name *</label>
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      disabled
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                      placeholder="+91 1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                      placeholder="Kolkata, India"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PROFESSIONAL */}
            {activeTab === "professional" && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-6">Professional Info</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Professional Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g., Cinematographer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Bio *</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={4}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 resize-none"
                      placeholder="Tell clients about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Experience (years)</label>
                      <input
                        type="text"
                        value={form.experience}
                        onChange={(e) => setForm({ ...form, experience: e.target.value })}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Hourly Rate ($)</label>
                      <input
                        type="number"
                        value={form.hourlyRate}
                        onChange={(e) => setForm({ ...form, hourlyRate: parseInt(e.target.value) || 0 })}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Availability</label>
                    <select
                      value={form.availability}
                      onChange={(e) => setForm({ ...form, availability: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="freelance">Freelance</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SKILLS */}
            {activeTab === "skills" && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Skills & Tools</h2>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Skills *</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      placeholder="Add a skill"
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                    <button onClick={addSkill} className="bg-purple-600 hover:bg-purple-700 px-4 rounded-lg">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map((skill, index) => (
                      <span key={index} className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-red-400">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tools & Software</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTool}
                      onChange={(e) => setNewTool(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTool()}
                      placeholder="e.g., Premiere Pro"
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                    <button onClick={addTool} className="bg-purple-600 hover:bg-purple-700 px-4 rounded-lg">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.tools.map((tool, index) => (
                      <span key={index} className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {tool}
                        <button onClick={() => removeTool(tool)} className="hover:text-red-400">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Languages</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={newLanguage.name}
                      onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                      placeholder="Language"
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                    <select
                      value={newLanguage.level}
                      onChange={(e) => setNewLanguage({ ...newLanguage, level: e.target.value })}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                    >
                      {languageLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <button onClick={addLanguage} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.languages.map((lang, index) => (
                      <div key={index} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                        <span className="text-gray-300 text-sm">{lang.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-400">{lang.level}</span>
                          <button onClick={() => removeLanguage(index)} className="hover:text-red-400">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PORTFOLIO */}
            {activeTab === "portfolio" && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold">Portfolio</h2>

                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-sm">Add New Project</h3>
                  <input
                    type="text"
                    value={newPortfolio.title}
                    onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                    placeholder="Project Title"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <textarea
                    value={newPortfolio.description}
                    onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                    placeholder="Description"
                    rows={2}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newPortfolio.category}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, category: e.target.value })}
                      placeholder="Category"
                      className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                    />
                    <input
                      type="url"
                      value={newPortfolio.link}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, link: e.target.value })}
                      placeholder="Project Link"
                      className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={addPortfolio}
                    disabled={!newPortfolio.title}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg disabled:opacity-50 text-sm"
                  >
                    Add Project
                  </button>
                </div>

                <div className="space-y-3">
                  {form.portfolio.map((item) => (
                    <div key={item.id} className="bg-white/5 rounded-xl p-3 flex gap-3">
                      <div className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                          <button onClick={() => removePortfolio(item.id)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                        {item.category && (
                          <span className="inline-block text-[10px] text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full mt-1">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WORK */}
            {activeTab === "work" && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold">Work History</h2>

                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-sm">Add Experience</h3>
                  <input
                    type="text"
                    value={newWork.company}
                    onChange={(e) => setNewWork({ ...newWork, company: e.target.value })}
                    placeholder="Company"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={newWork.position}
                    onChange={(e) => setNewWork({ ...newWork, position: e.target.value })}
                    placeholder="Position"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={newWork.startDate}
                      onChange={(e) => setNewWork({ ...newWork, startDate: e.target.value })}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                    />
                    <input
                      type="date"
                      value={newWork.endDate}
                      onChange={(e) => setNewWork({ ...newWork, endDate: e.target.value })}
                      disabled={newWork.current}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm disabled:opacity-50"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newWork.current}
                      onChange={(e) => setNewWork({ ...newWork, current: e.target.checked })}
                      className="w-4 h-4 accent-purple-600"
                    />
                    Currently working here
                  </label>
                  <textarea
                    value={newWork.description}
                    onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                    placeholder="Description"
                    rows={2}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <button
                    onClick={addWork}
                    disabled={!newWork.company || !newWork.position}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg disabled:opacity-50 text-sm"
                  >
                    Add Experience
                  </button>
                </div>

                <div className="space-y-3">
                  {form.workHistory.map((work) => (
                    <div key={work.id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-sm">{work.position}</h4>
                          <p className="text-purple-400 text-xs">{work.company}</p>
                        </div>
                        <button onClick={() => removeWork(work.id)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {work.startDate} - {work.current ? 'Present' : work.endDate}
                      </p>
                      {work.description && (
                        <p className="text-xs text-gray-400 mt-2">{work.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EDUCATION */}
            {activeTab === "education" && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold">Education</h2>

                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-sm">Add Education</h3>
                  <input
                    type="text"
                    value={newEducation.degree}
                    onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                    placeholder="Degree"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={newEducation.institution}
                    onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                    placeholder="Institution"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={newEducation.year}
                    onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
                    placeholder="Year"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <textarea
                    value={newEducation.description}
                    onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })}
                    placeholder="Description"
                    rows={2}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <button
                    onClick={addEducation}
                    disabled={!newEducation.degree || !newEducation.institution}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg disabled:opacity-50 text-sm"
                  >
                    Add Education
                  </button>
                </div>

                <div className="space-y-3">
                  {form.education.map((edu) => (
                    <div key={edu.id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-sm">{edu.degree}</h4>
                          <p className="text-purple-400 text-xs">{edu.institution}</p>
                        </div>
                        <button onClick={() => removeEducation(edu.id)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">{edu.year}</p>
                      {edu.description && (
                        <p className="text-xs text-gray-400 mt-2">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CERTIFICATIONS */}
            {activeTab === "certifications" && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold">Certifications</h2>

                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-sm">Add Certification</h3>
                  <input
                    type="text"
                    value={newCertification.name}
                    onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                    placeholder="Certification Name"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={newCertification.issuer}
                    onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                    placeholder="Issuer"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newCertification.year}
                      onChange={(e) => setNewCertification({ ...newCertification, year: e.target.value })}
                      placeholder="Year"
                      className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                    />
                    <input
                      type="url"
                      value={newCertification.link}
                      onChange={(e) => setNewCertification({ ...newCertification, link: e.target.value })}
                      placeholder="Link"
                      className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={addCertification}
                    disabled={!newCertification.name || !newCertification.issuer}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg disabled:opacity-50 text-sm"
                  >
                    Add Certification
                  </button>
                </div>

                <div className="space-y-3">
                  {form.certifications.map((cert) => (
                    <div key={cert.id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-sm">{cert.name}</h4>
                          <p className="text-purple-400 text-xs">{cert.issuer}</p>
                        </div>
                        <button onClick={() => removeCertification(cert.id)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">{cert.year}</p>
                      {cert.link && (
                        <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                          View Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SOCIAL */}
            {activeTab === "social" && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-5">
                <h2 className="text-lg sm:text-xl font-semibold">Social Links</h2>
                {[
                  { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
                  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
                  { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/username' },
                  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
                  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' }
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
                    <input
                      type="url"
                      value={(form as any)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === "settings" && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-5">
                <h2 className="text-lg sm:text-xl font-semibold">Profile Settings</h2>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.availableForHire}
                    onChange={(e) => setForm({ ...form, availableForHire: e.target.checked })}
                    className="w-5 h-5 accent-purple-600"
                  />
                  <div>
                    <span className="text-sm font-medium">Available for hire</span>
                    <p className="text-xs text-gray-500">Show clients that you're actively looking for work</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showEmail}
                    onChange={(e) => setForm({ ...form, showEmail: e.target.checked })}
                    className="w-5 h-5 accent-purple-600"
                  />
                  <span className="text-sm font-medium">Show email on profile</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showPhone}
                    onChange={(e) => setForm({ ...form, showPhone: e.target.checked })}
                    className="w-5 h-5 accent-purple-600"
                  />
                  <span className="text-sm font-medium">Show phone number on profile</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}