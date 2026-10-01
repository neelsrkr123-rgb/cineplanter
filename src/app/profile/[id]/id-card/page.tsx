// src/app/profile/[id]/id-card/page.tsx
'use client'

import { useState, useEffect } from "react"
import Navbar from "#/components/Navbar"
import FreelancerIDCard from "#/components/profile/FreelancerIDCard"
import { db } from "#/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Share2 } from 'lucide-react'

export default function PublicIDCardPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      setNotFound(true)
      return
    }

    const loadProfile = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', userId))
        if (userSnap.exists()) {
          setProfile(userSnap.data())
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [userId])

  const shareCard = async () => {
    if (!userId) return
    const publicUrl = `${window.location.origin}/profile/${userId}/id-card`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.name}'s Freelancer ID`,
          text: `Check out ${profile?.name}'s freelancer profile on CinePlanter!`,
          url: publicUrl
        })
      } else {
        await navigator.clipboard.writeText(publicUrl)
        alert('Profile link copied!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">This ID card does not exist or was removed.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto pt-24 px-6 pb-10">
        {/* Back button at top */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
        </div>

        {/* Card */}
        <div className="flex justify-center">
          <FreelancerIDCard profile={profile} userId={userId} showActions={false} />
        </div>

        {/* Only Share button BELOW the card */}
        <div className="flex justify-center mt-8">
          <button
            onClick={shareCard}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium text-white shadow-lg shadow-purple-500/20"
          >
            <Share2 size={16} />
            <span>Share ID Card</span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          A7 size (74mm × 105mm) • Tap to flip • Double-sided
        </p>
      </main>
    </div>
  )
}