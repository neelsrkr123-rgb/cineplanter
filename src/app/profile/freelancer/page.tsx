'use client'

import { useState, useEffect } from "react"
import { useAuth } from "#/context/AuthContext"
import Navbar from "#/components/Navbar"
import { db } from "#/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Award, Briefcase, DollarSign, Clock, Star, MapPin, Mail, Phone,
  Edit2, Camera, Github, Linkedin, Globe, Users, ThumbsUp, Calendar,
  ArrowLeft, User, Film, Bookmark, Folder, ShoppingBag, GraduationCap,
  CreditCard, Settings, LogOut, X, Plus, Save, Upload
} from 'lucide-react'

export default function FreelancerDashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [freelancerData, setFreelancerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // ইউজার আইডি ঠিক করে নেওয়া
  const userId = user?.id || user?.uid
  const userEmail = user?.email
  const userName = user?.name || user?.displayName || "User"
  const userPhoto = user?.photoURL || user?.avatar || "/default-avatar.png"

  // Menu items for sidebar
  const menu = [
    { icon: User, label: "Profile Info", href: "#" },
    { icon: Film, label: "My Movies", href: "#" },
    { icon: Bookmark, label: "Watchlist", href: "#" },
    { icon: Star, label: "Public Reviews", href: "#" },
    { icon: Folder, label: "Saved Projects", href: "#" },
    { icon: ShoppingBag, label: "My Products", href: "#" },
    { icon: GraduationCap, label: "My Courses", href: "#" }
  ]

  const finance = [
    { icon: CreditCard, label: "Payment Method", href: "#" },
    { icon: DollarSign, label: "Earnings", href: "#" }
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
        setFreelancerData(data.freelancerProfile || {})
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    )
  }

  if (!user) return null

  const stats = [
    { label: 'Followers', value: user?.followers?.length || '0' },
    { label: 'Following', value: user?.following?.length || '0' },
    { label: 'Success Rate', value: '100%' },
    { label: 'Rating', value: freelancerData?.rating || '1.4/8.5' }
  ]

  const skills = freelancerData?.skills || [
    'Video Editor',
    'Cinematographer',
    'Script Writer',
    'Director'
  ]

  const reviews = freelancerData?.portfolio || [
    { client: 'Client 1', rating: 5, comment: 'Excellent work!', date: '2024-01-15' },
    { client: 'Client 2', rating: 4, comment: 'Great collaboration', date: '2024-01-10' }
  ]

  const languages = freelancerData?.languages || [
    { name: 'Bengali', level: 'Native' },
    { name: 'English', level: 'Fluent' },
    { name: 'Hindi', level: 'Professional' }
  ]

  const education = freelancerData?.education || [
    { degree: 'BFA in Film Making', institution: 'Film Institute', year: '2020-2024' }
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-white relative">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"/>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full"/>
      </div>

      <Navbar />

      <main className="relative z-10 max-w-[1500px] mx-auto pt-[10px] px-6 pb-10">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <aside className="w-[230px] hidden md:block">
            <div className="sticky top-[90px] backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <div className="flex flex-col text-sm">
                <p className="text-white font-semibold text-lg mb-6">Menu</p>

                {/* MAIN MENU */}
                <div className="space-y-5">
                  {menu.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition"
                      >
                        <Icon size={20} />
                        <span className="text-[15px] font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                <hr className="border-white/10 my-8" />

                {/* FINANCE */}
                <div className="space-y-5">
                  {finance.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition"
                      >
                        <Icon size={20} />
                        <span className="text-[15px] font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                <hr className="border-white/10 my-8" />

                {/* SETTINGS + LOGOUT */}
                <div className="space-y-5">
                  <Link
                    href="/profile/settings"
                    className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition"
                  >
                    <Settings size={20} />
                    <span className="text-[15px] font-medium">Settings</span>
                  </Link>
                  <div
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-red-400 hover:text-red-500 cursor-pointer transition"
                  >
                    <LogOut size={20} />
                    <span className="text-[15px] font-medium">Logout</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Header */}
            <div className="backdrop-blur-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/30">
                    <img
                      src={userPhoto}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  {/* Title and Buttons */}
                  <div className="flex items-center justify-between mb-3">
                    <h1 className="text-3xl font-bold text-white">{userName}</h1>
                    
                    {/* Action Buttons - এখানে Edit Profile বাটন আপডেট করা হয়েছে */}
                    <div className="flex gap-2">
                      {/* আপডেটেড Edit Profile বাটন - নতুন পৃষ্ঠায় নিয়ে যাবে */}
                      <Link
                        href="/profile/freelancer/edit"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
                      >
                        <Edit2 size={16} />
                        <span>Edit Profile</span>
                      </Link>
                      
                      <Link
                        href="/profile/freelancer/id-card"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm hover:from-purple-700 hover:to-pink-700 transition-all"
                      >
                        <Award size={16} />
                        <span>View ID Card</span>
                      </Link>
                      
                      <button
                        onClick={() => router.push('/profile?view=normal')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
                      >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Normal Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-purple-400 mb-3">{freelancerData?.title || 'Cinematographer'}</p>

                  {/* Stats Row */}
                  <div className="flex gap-6 mb-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail size={14} />
                      <span>{userEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone size={14} />
                      <span>{freelancerData?.phone || '1234569870'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin size={14} />
                      <span>{freelancerData?.location || 'Kolkata, India'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-white">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Section */}
              <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4 text-white">Portfolio</h2>
                <div className="space-y-4">
                  {reviews.map((review: any, index: number) => (
                    <div key={index} className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{review.client}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}
                              />
                            ))}
                            <span className="text-xs text-gray-400 ml-2">{review.rating}/5</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{review.date}</span>
                      </div>
                      <p className="text-sm text-gray-400">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages & Education */}
              <div className="space-y-6">
                {/* Languages */}
                <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4 text-white">Languages Known</h2>
                  <div className="space-y-3">
                    {languages.map((lang: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-300">{lang.name}</span>
                        <span className="text-sm text-purple-400">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4 text-white">Education</h2>
                  <div className="space-y-3">
                    {education.map((edu: any, index: number) => (
                      <div key={index}>
                        <p className="font-semibold text-white">{edu.degree}</p>
                        <p className="text-sm text-gray-400">{edu.institution} · {edu.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}