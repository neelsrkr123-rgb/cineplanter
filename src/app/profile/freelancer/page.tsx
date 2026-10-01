'use client'

import { useState, useEffect } from "react"
import { useAuth } from "#/context/AuthContext"
import Navbar from "#/components/Navbar"
import { db } from "#/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Award, DollarSign, Star, MapPin, Mail, Phone,
  Edit2, Globe, ArrowLeft, User, Film, Bookmark, Folder,
  ShoppingBag, GraduationCap, CreditCard, Settings, LogOut,
  Briefcase as BriefcaseIcon
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function FreelancerDashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [freelancerData, setFreelancerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // ✅ Safe user data access
  const userId = user?.id || (user as any)?.uid
  const userEmail = user?.email
  const userName = user?.name || "User"
  const userPhoto = user?.avatar || "/default-avatar.png"

  // Menu
  const menu = [
    { icon: User, label: "Profile Info", href: "/profile/freelancer" },
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

  // ✅ Safe array helper
  const safeArray = <T,>(data: any, fallback: T[] = []): T[] => {
    return Array.isArray(data) && data.length > 0 ? data : fallback
  }

  const stats = [
    { label: 'Followers', value: (user as any)?.followers?.length || '0' },
    { label: 'Following', value: (user as any)?.following?.length || '0' },
    { label: 'Success Rate', value: freelancerData?.successRate || '100%' },
    { label: 'Rating', value: freelancerData?.rating || '4.8/5' }
  ]

  // ✅ সব array fields safe
  const skills = safeArray<string>(
    freelancerData?.skills,
    ['Video Editor', 'Cinematographer', 'Script Writer', 'Director']
  )

  const reviews = safeArray<any>(
    freelancerData?.reviews,
    [
      { client: 'Client 1', rating: 5, comment: 'Excellent work!', date: '2024-01-15' },
      { client: 'Client 2', rating: 4, comment: 'Great collaboration', date: '2024-01-10' }
    ]
  )

  const languages = safeArray<any>(
    freelancerData?.languages,
    [
      { name: 'Bengali', level: 'Native' },
      { name: 'English', level: 'Fluent' },
      { name: 'Hindi', level: 'Professional' }
    ]
  )

  const education = safeArray<any>(
    freelancerData?.education,
    [
      { degree: 'BFA in Film Making', institution: 'Film Institute', year: '2020-2024' }
    ]
  )

  // 🔥 Experience — string হলে empty array, array হলে সেটাই
  const experience = Array.isArray(freelancerData?.experience)
    ? freelancerData.experience
    : []

  return (
    <div className="min-h-screen bg-[#050505] text-white relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <Navbar />

      <main className="relative z-10 max-w-[1500px] mx-auto pt-[10px] px-3 sm:px-6 pb-10">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">

          {/* LEFT SIDEBAR */}
          <aside className="hidden md:block w-[230px] flex-shrink-0">
            <div className="sticky top-[90px] backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              <div className="flex flex-col text-sm">
                <p className="text-white font-semibold text-lg mb-6">Menu</p>

                <div className="space-y-4">
                  {menu.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition"
                      >
                        <Icon size={18} />
                        <span className="text-[14px] font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                <hr className="border-white/10 my-5" />

                <div className="space-y-4">
                  {finance.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition"
                      >
                        <Icon size={18} />
                        <span className="text-[14px] font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                <hr className="border-white/10 my-5" />

                <div className="space-y-4">
                  <Link
                    href="/profile/settings"
                    className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer transition"
                  >
                    <Settings size={18} />
                    <span className="text-[14px] font-medium">Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 text-red-400 hover:text-red-500 cursor-pointer transition"
                  >
                    <LogOut size={18} />
                    <span className="text-[14px] font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">

            {/* PROFILE HEADER */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
            >
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="flex justify-center md:justify-start">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-purple-500/30 ring-4 ring-purple-500/10">
                      <img
                        src={userPhoto}
                        alt={userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                    </div>
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h1 className="text-2xl md:text-3xl font-bold text-white truncate">{userName}</h1>
                      <p className="text-purple-400 mt-1 text-sm md:text-base">
                        {freelancerData?.title || 'Cinematographer'}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-end gap-2">
                      <Link
                        href="/profile/freelancer/edit"
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs sm:text-sm transition-colors border border-white/10"
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </Link>

                      <Link
                        href="/profile/freelancer/id-card"
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-xs sm:text-sm hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/20"
                      >
                        <Award size={14} />
                        <span>ID Card</span>
                      </Link>

                      <button
                        onClick={() => router.push('/profile')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs sm:text-sm transition-colors border border-white/10"
                      >
                        <ArrowLeft size={14} />
                        <span className="hidden sm:inline">Normal</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-4 mb-4 max-w-md mx-auto md:mx-0">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-base sm:text-xl font-bold text-white">{stat.value}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-xs sm:text-sm flex flex-col items-center md:items-start">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail size={13} />
                      <span className="truncate">{userEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone size={13} />
                      <span>{freelancerData?.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin size={13} />
                      <span>{freelancerData?.location || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SKILLS */}
            {skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <BriefcaseIcon className="w-4 h-4 text-purple-400" />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/20 rounded-full text-xs sm:text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TWO COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Reviews */}
              {reviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6"
                >
                  <h2 className="text-base sm:text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Reviews
                  </h2>
                  <div className="space-y-3">
                    {reviews.map((review: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white/[0.03] border border-white/10 rounded-xl p-3 sm:p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{review.client}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}
                                />
                              ))}
                              <span className="text-[10px] text-gray-400 ml-1">{review.rating}/5</span>
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-500 flex-shrink-0">{review.date}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="space-y-4 sm:space-y-6">
                {/* Languages */}
                {languages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6"
                  >
                    <h2 className="text-base sm:text-lg font-semibold mb-4 text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      Languages
                    </h2>
                    <div className="space-y-3">
                      {languages.map((lang: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">{lang.name}</span>
                          <span className="text-xs sm:text-sm text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                            {lang.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Education */}
                {education.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6"
                  >
                    <h2 className="text-base sm:text-lg font-semibold mb-4 text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-green-400" />
                      Education
                    </h2>
                    <div className="space-y-3">
                      {education.map((edu: any, index: number) => (
                        <div key={index}>
                          <p className="font-semibold text-white text-sm">{edu.degree}</p>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {edu.institution} · {edu.year}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* EXPERIENCE */}
            {experience.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <BriefcaseIcon className="w-4 h-4 text-orange-400" />
                  Experience
                </h2>
                <div className="space-y-3">
                  {experience.map((exp: any, index: number) => (
                    <div key={index} className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-semibold text-white text-sm">{exp.role || exp.position}</p>
                        <p className="text-xs sm:text-sm text-gray-400">{exp.company}</p>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{exp.year || exp.startDate}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}