// src/app/profile/freelancer/id-card/page.tsx
'use client'

import { useState, useEffect, useRef } from "react"
import { useAuth } from "#/context/AuthContext"
import Navbar from "#/components/Navbar"
import FreelancerIDCard from "#/components/profile/FreelancerIDCard"
import { db } from "#/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { X, Download, Share2, Printer } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function IDCardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const userId = user?.id || (user as any)?.uid
  const userName = user?.name || "User"

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
      return
    }
    if (user && userId) loadUserData()
  }, [user, isLoading, userId])

  const loadUserData = async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      const userSnap = await getDoc(doc(db, 'users', userId))
      if (userSnap.exists()) setProfile(userSnap.data())
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Download as PDF
  const downloadPDF = async () => {
    if (!cardRef.current) return
    setDownloading(true)

    try {
      const card = cardRef.current

      card.setAttribute('data-flipped', 'false')
      await new Promise(r => setTimeout(r, 250))
      const frontCanvas = await html2canvas(card, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      })

      card.setAttribute('data-flipped', 'true')
      await new Promise(r => setTimeout(r, 250))
      const backCanvas = await html2canvas(card, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      })

      card.setAttribute('data-flipped', 'false')

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [74, 105]
      })

      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, 74, 105, undefined, 'FAST')
      pdf.addPage([74, 105])
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, 74, 105, undefined, 'FAST')

      pdf.save(`${profile?.name || userName}-id-card.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  // ✅ Share — public route
  const shareCard = async () => {
    if (!userId) return
    const publicUrl = `${window.location.origin}/profile/${userId}/id-card`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.name || userName}'s Freelancer ID`,
          text: `Check out my freelancer profile on CinePlanter!`,
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

  const printCard = () => window.print()

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50"><Navbar /></div>

      <div className="min-h-screen bg-[#050505] pt-24 relative">
        {/* Background glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          {/* ✅ Only close button at top */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-300" />
            </button>
          </div>

          {/* Card */}
          <div className="flex justify-center">
            <div ref={cardRef}>
              <FreelancerIDCard profile={profile} userId={userId} showActions={false} />
            </div>
          </div>

          {/* ✅ Action Buttons BELOW the card — Share, Download, Print */}
          <div className="flex justify-center gap-3 sm:gap-4 mt-8 flex-wrap">
            <button
              onClick={shareCard}
              className="flex items-center gap-2 px-5 py-2.5 
                         bg-white/5 backdrop-blur-sm border border-white/10 
                         rounded-xl hover:bg-white/10 transition-colors 
                         text-sm font-medium text-gray-200"
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>

            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 
                         bg-gradient-to-r from-purple-600 to-pink-600 
                         rounded-xl hover:from-purple-700 hover:to-pink-700 
                         transition-all text-sm font-medium text-white 
                         disabled:opacity-50 shadow-lg shadow-purple-500/20"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>{downloading ? 'Downloading...' : 'Download'}</span>
            </button>

            <button
              onClick={printCard}
              className="flex items-center gap-2 px-5 py-2.5 
                         bg-white/5 backdrop-blur-sm border border-white/10 
                         rounded-xl hover:bg-white/10 transition-colors 
                         text-sm font-medium text-gray-200"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            A7 size (74mm × 105mm) • Double-sided • Printable
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .flippable-card, .flippable-card * { visibility: visible; }
          .flippable-card {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
          }
          nav, button { display: none !important; }
        }
      `}</style>
    </>
  )
}