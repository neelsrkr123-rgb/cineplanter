// app/profile/freelancer/edit/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useAuth } from "#/context/AuthContext"
import Navbar from "#/components/Navbar"
import { db } from "#/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import {
  User, Film, Bookmark, Star, Folder, ShoppingBag, GraduationCap,
  CreditCard, DollarSign, Settings, LogOut, Award, Briefcase,
  MapPin, Mail, Phone, Globe, Github, Linkedin, Camera,
  Plus, X, Save, ArrowLeft, Upload, Calendar, Clock
} from 'lucide-react'
import Link from "next/link"
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

  // ইউজার আইডি
  const userId = user?.id || user?.uid

  // Form state
  const [form, setForm] = useState({
    // Basic Info
    avatar: "",
    coverImage: "",
    displayName: "",
    username: "",
    email: "",
    phone: "",
    location: "",
    
    // Professional Info
    title: "",
    bio: "",
    experience: "",
    hourlyRate: 0,
    availability: "freelance" as "freelance" | "full-time" | "part-time" | "contract",
    
    // Skills & Expertise
    skills: [] as string[],
    languages: [] as { name: string; level: string }[],
    tools: [] as string[],
    
    // Portfolio
    portfolio: [] as {
      id: string
      title: string
      description: string
      image: string
      category: string
      link: string
      date: string
    }[],
    
    // Work History
    workHistory: [] as {
      id: string
      company: string
      position: string
      startDate: string
      endDate: string
      current: boolean
      description: string
    }[],
    
    // Education
    education: [] as {
      id: string
      degree: string
      institution: string
      year: string
      description: string
    }[],
    
    // Certifications
    certifications: [] as {
      id: string
      name: string
      issuer: string
      year: string
      link: string
    }[],
    
    // Social Links
    website: "",
    github: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
    
    // Settings
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

  // Active tab
  const [activeTab, setActiveTab] = useState("basic")

  // Menu items for sidebar
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
      router.push('/auth/signin')
      return
    }

    if (user) {
      loadFreelancerData()
    }
  }, [user, isLoading])

  const loadFreelancerData = async () => {
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const data = userSnap.data()
        const profile = data.freelancerProfile || {}
        
        setForm({
          // Basic Info
          avatar: data.photoURL || data.avatar || "",
          coverImage: profile.coverImage || "",
          displayName: data.name || data.displayName || "",
          username: data.username || "",
          email: data.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
          
          // Professional Info
          title: profile.title || "",
          bio: profile.bio || "",
          experience: profile.experience || "",
          hourlyRate: profile.hourlyRate || 0,
          availability: profile.availability || "freelance",
          
          // Skills
          skills: profile.skills || [],
          languages: profile.languages || [],
          tools: profile.tools || [],
          
          // Portfolio
          portfolio: profile.portfolio || [],
          
          // Work History
          workHistory: profile.workHistory || [],
          
          // Education
          education: profile.education || [],
          
          // Certifications
          certifications: profile.certifications || [],
          
          // Social Links
          website: profile.website || "",
          github: profile.github || "",
          linkedin: profile.linkedin || "",
          twitter: profile.twitter || "",
          instagram: profile.instagram || "",
          facebook: profile.facebook || "",
          
          // Settings
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

  const uploadPortfolioImage = async (file: File, index: number) => {
    try {
      setUploading(prev => ({ ...prev, portfolio: true }))
      const preview = URL.createObjectURL(file)
      
      const updatedPortfolio = [...form.portfolio]
      updatedPortfolio[index] = { ...updatedPortfolio[index], image: preview }
      setForm(prev => ({ ...prev, portfolio: updatedPortfolio }))

      const result = await uploadToCloudinary(file, {
        folder: "portfolio",
        tags: ["portfolio"]
      })

      updatedPortfolio[index] = { ...updatedPortfolio[index], image: result.url }
      setForm(prev => ({ ...prev, portfolio: updatedPortfolio }))
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(prev => ({ ...prev, portfolio: false }))
    }
  }

  // Add functions
  const addSkill = () => {
    if (newSkill.trim() && !form.skills.includes(newSkill.trim())) {
      setForm({
        ...form,
        skills: [...form.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setForm({
      ...form,
      skills: form.skills.filter(s => s !== skill)
    })
  }

  const addTool = () => {
    if (newTool.trim() && !form.tools.includes(newTool.trim())) {
      setForm({
        ...form,
        tools: [...form.tools, newTool.trim()]
      })
      setNewTool('')
    }
  }

  const removeTool = (tool: string) => {
    setForm({
      ...form,
      tools: form.tools.filter(t => t !== tool)
    })
  }

  const addLanguage = () => {
    if (newLanguage.name.trim()) {
      setForm({
        ...form,
        languages: [...form.languages, { ...newLanguage }]
      })
      setNewLanguage({ name: '', level: 'Native' })
    }
  }

  const removeLanguage = (index: number) => {
    setForm({
      ...form,
      languages: form.languages.filter((_, i) => i !== index)
    })
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
    setForm({
      ...form,
      portfolio: form.portfolio.filter(item => item.id !== id)
    })
  }

  const addWork = () => {
    if (newWork.company.trim() && newWork.position.trim()) {
      setForm({
        ...form,
        workHistory: [...form.workHistory, { 
          id: Date.now().toString(),
          ...newWork
        }]
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
    setForm({
      ...form,
      workHistory: form.workHistory.filter(item => item.id !== id)
    })
  }

  const addEducation = () => {
    if (newEducation.degree.trim() && newEducation.institution.trim()) {
      setForm({
        ...form,
        education: [...form.education, { 
          id: Date.now().toString(),
          ...newEducation
        }]
      })
      setNewEducation({
        degree: "",
        institution: "",
        year: "",
        description: ""
      })
    }
  }

  const removeEducation = (id: string) => {
    setForm({
      ...form,
      education: form.education.filter(item => item.id !== id)
    })
  }

  const addCertification = () => {
    if (newCertification.name.trim() && newCertification.issuer.trim()) {
      setForm({
        ...form,
        certifications: [...form.certifications, { 
          id: Date.now().toString(),
          ...newCertification
        }]
      })
      setNewCertification({
        name: "",
        issuer: "",
        year: "",
        link: ""
      })
    }
  }

  const removeCertification = (id: string) => {
    setForm({
      ...form,
      certifications: form.certifications.filter(item => item.id !== id)
    })
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', userId), {
        name: form.displayName,
        username: form.username,
        photoURL: form.avatar,
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

  const languageLevels = ["Native", "Fluent", "Professional", "Conversational"]

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto pt-24 px-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">Edit Freelancer Profile</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Tabs */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-4">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                        activeTab === item.id
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>

              <hr className="border-white/10 my-4" />

              <div className="space-y-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Content - Edit Forms */}
          <div className="flex-1 space-y-6">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
                
                <div className="space-y-6">
                  {/* Cover Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Cover Image
                    </label>
                    <div className="relative h-40 bg-zinc-900 rounded-xl overflow-hidden">
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
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30">
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
                      <div className="text-sm text-gray-400">
                        {uploading.avatar && "Uploading..."}
                      </div>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="username"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="email@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="+91 1234567890"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="Kolkata, India"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Professional Info Tab */}
            {activeTab === "professional" && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Professional Information</h2>
                
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Professional Title *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g., Cinematographer, Video Editor"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Bio *
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={4}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="Tell clients about yourself..."
                    />
                  </div>

                  {/* Experience & Rate */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Experience (years)
                      </label>
                      <input
                        type="text"
                        value={form.experience}
                        onChange={(e) => setForm({ ...form, experience: e.target.value })}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        value={form.hourlyRate}
                        onChange={(e) => setForm({ ...form, hourlyRate: parseInt(e.target.value) || 0 })}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Availability
                    </label>
                    <select
                      value={form.availability}
                      onChange={(e) => setForm({ ...form, availability: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
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

            {/* Skills & Tools Tab */}
            {activeTab === "skills" && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Skills & Tools</h2>
                
                <div className="space-y-8">
                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Skills *
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="Add a skill"
                        className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <button
                        onClick={addSkill}
                        className="bg-purple-600 hover:bg-purple-700 px-4 rounded-lg"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
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
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Tools & Software
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newTool}
                        onChange={(e) => setNewTool(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTool()}
                        placeholder="Add a tool (e.g., Premiere Pro)"
                        className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <button
                        onClick={addTool}
                        className="bg-purple-600 hover:bg-purple-700 px-4 rounded-lg"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.tools.map((tool, index) => (
                        <span
                          key={index}
                          className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
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
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Languages
                    </label>
                    <div className="flex gap-2 mb-3">
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
                      <button
                        onClick={addLanguage}
                        className="bg-purple-600 hover:bg-purple-700 px-4 rounded-lg"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.languages.map((lang, index) => (
                        <div key={index} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                          <span className="text-gray-300">{lang.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-purple-400">{lang.level}</span>
                            <button onClick={() => removeLanguage(index)} className="hover:text-red-400">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === "portfolio" && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Portfolio</h2>
                
                <div className="space-y-6">
                  {/* Add New Portfolio Item */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Add New Project</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={newPortfolio.title}
                        onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                        placeholder="Project Title"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <textarea
                        value={newPortfolio.description}
                        onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                        placeholder="Project Description"
                        rows={2}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={newPortfolio.category}
                          onChange={(e) => setNewPortfolio({ ...newPortfolio, category: e.target.value })}
                          placeholder="Category"
                          className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                        />
                        <input
                          type="url"
                          value={newPortfolio.link}
                          onChange={(e) => setNewPortfolio({ ...newPortfolio, link: e.target.value })}
                          placeholder="Project Link"
                          className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                        />
                      </div>
                      <button
                        onClick={addPortfolio}
                        disabled={!newPortfolio.title}
                        className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg disabled:opacity-50"
                      >
                        Add Project
                      </button>
                    </div>
                  </div>

                  {/* Portfolio List */}
                  <div className="space-y-4">
                    {form.portfolio.map((item, index) => (
                      <div key={item.id} className="bg-white/5 rounded-xl p-4 flex gap-4">
                        <div className="w-24 h-24 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-semibold">{item.title}</h4>
                            <button onClick={() => removePortfolio(item.id)} className="text-red-400 hover:text-red-300">
                              <X size={16} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{item.category}</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Work History Tab */}
            {activeTab === "work" && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Work History</h2>
                
                <div className="space-y-6">
                  {/* Add New Work */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Add Work Experience</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={newWork.company}
                        onChange={(e) => setNewWork({ ...newWork, company: e.target.value })}
                        placeholder="Company"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <input
                        type="text"
                        value={newWork.position}
                        onChange={(e) => setNewWork({ ...newWork, position: e.target.value })}
                        placeholder="Position"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="date"
                          value={newWork.startDate}
                          onChange={(e) => setNewWork({ ...newWork, startDate: e.target.value })}
                          className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                        />
                        <input
                          type="date"
                          value={newWork.endDate}
                          onChange={(e) => setNewWork({ ...newWork, endDate: e.target.value })}
                          disabled={newWork.current}
                          className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newWork.current}
                          onChange={(e) => setNewWork({ ...newWork, current: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">I currently work here</span>
                      </label>
                      <textarea
                        value={newWork.description}
                        onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                        placeholder="Job Description"
                        rows={2}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <button
                        onClick={addWork}
                        disabled={!newWork.company || !newWork.position}
                        className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg disabled:opacity-50"
                      >
                        Add Experience
                      </button>
                    </div>
                  </div>

                  {/* Work List */}
                  <div className="space-y-4">
                    {form.workHistory.map((work) => (
                      <div key={work.id} className="bg-white/5 rounded-xl p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-semibold">{work.position}</h4>
                            <p className="text-purple-400 text-sm">{work.company}</p>
                          </div>
                          <button onClick={() => removeWork(work.id)} className="text-red-400 hover:text-red-300">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {work.startDate} - {work.current ? 'Present' : work.endDate}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">{work.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === "education" && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Education</h2>
                
                <div className="space-y-6">
                  {/* Add New Education */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Add Education</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                        placeholder="Degree"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <input
                        type="text"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                        placeholder="Institution"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <input
                        type="text"
                        value={newEducation.year}
                        onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
                        placeholder="Year"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <textarea
                        value={newEducation.description}
                        onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })}
                        placeholder="Description"
                        rows={2}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <button
                        onClick={addEducation}
                        disabled={!newEducation.degree || !newEducation.institution}
                        className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg disabled:opacity-50"
                      >
                        Add Education
                      </button>
                    </div>
                  </div>

                  {/* Education List */}
                  <div className="space-y-4">
                    {form.education.map((edu) => (
                      <div key={edu.id} className="bg-white/5 rounded-xl p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-semibold">{edu.degree}</h4>
                            <p className="text-purple-400 text-sm">{edu.institution}</p>
                          </div>
                          <button onClick={() => removeEducation(edu.id)} className="text-red-400 hover:text-red-300">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{edu.year}</p>
                        <p className="text-sm text-gray-400 mt-2">{edu.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === "certifications" && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Certifications</h2>
                
                <div className="space-y-6">
                  {/* Add New Certification */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Add Certification</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={newCertification.name}
                        onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                        placeholder="Certification Name"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <input
                        type="text"
                        value={newCertification.issuer}
                        onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                        placeholder="Issuing Organization"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={newCertification.year}
                          onChange={(e) => setNewCertification({ ...newCertification, year: e.target.value })}
                          placeholder="Year"
                          className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                        />
                        <input
                          type="url"
                          value={newCertification.link}
                          onChange={(e) => setNewCertification({ ...newCertification, link: e.target.value })}
                          placeholder="Certificate Link"
                          className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white"
                        />
                      </div>
                      <button
                        onClick={addCertification}
                        disabled={!newCertification.name || !newCertification.issuer}
                        className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg disabled:opacity-50"
                      >
                        Add Certification
                      </button>
                    </div>
                  </div>

                  {/* Certifications List */}
                  <div className="space-y-4">
                    {form.certifications.map((cert) => (
                      <div key={cert.id} className="bg-white/5 rounded-xl p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-semibold">{cert.name}</h4>
                            <p className="text-purple-400 text-sm">{cert.issuer}</p>
                          </div>
                          <button onClick={() => removeCertification(cert.id)} className="text-red-400 hover:text-red-300">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{cert.year}</p>
                        {cert.link && (
                          <a href={cert.link} target="_blank" className="text-xs text-blue-400 hover:underline mt-1 block">
                            View Certificate
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Social Links Tab */}
            {activeTab === "social" && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Social Links</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      GitHub
                    </label>
                    <input
                      type="url"
                      value={form.github}
                      onChange={(e) => setForm({ ...form, github: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white"
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={form.twitter}
                      onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white"
                      placeholder="https://twitter.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white"
                      placeholder="https://instagram.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Facebook
                    </label>
                    <input
                      type="url"
                      value={form.facebook}
                      onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white"
                      placeholder="https://facebook.com/username"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.availableForHire}
                        onChange={(e) => setForm({ ...form, availableForHire: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span>Available for hire</span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1 ml-7">
                      Show clients that you're actively looking for work
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.showEmail}
                        onChange={(e) => setForm({ ...form, showEmail: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span>Show email on profile</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.showPhone}
                        onChange={(e) => setForm({ ...form, showPhone: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span>Show phone number on profile</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}