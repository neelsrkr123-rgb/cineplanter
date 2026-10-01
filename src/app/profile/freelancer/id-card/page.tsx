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
  const cardRef = useRef<HTMLDivElement>(null)

  // ✅ Safe userId — user.id from UserData type
  const userId = user?.id || (user as any)?.uid
  const userName = user?.name || "User"

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
      return
    }
    if (user && userId) {
      loadUserData()
    }
  }, [user, isLoading, userId])

  const loadUserData = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        setProfile(userSnap.data())
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!cardRef.current) return

    try {
      const card = cardRef.current

      // Front side
      card.setAttribute('data-flipped', 'false')
      await new Promise(resolve => setTimeout(resolve, 200))
      const frontCanvas = await html2canvas(card, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      })

      // Back side
      card.setAttribute('data-flipped', 'true')
      await new Promise(resolve => setTimeout(resolve, 200))
      const backCanvas = await html2canvas(card, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      })

      card.setAttribute('data-flipped', 'false')

      // PDF — A7 size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [74, 105]
      })

      const frontImgData = frontCanvas.toDataURL('image/png')
      pdf.addImage(frontImgData, 'PNG', 0, 0, 74, 105, undefined, 'FAST')

      pdf.addPage([74, 105])
      const backImgData = backCanvas.toDataURL('image/png')
      pdf.addImage(backImgData, 'PNG', 0, 0, 74, 105, undefined, 'FAST')

      pdf.save(`${profile?.name || userName || 'freelancer'}-id-card.pdf`)

    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  // ✅ Share — public route এ point করবে (অন্য ডিভাইসেও খুলবে)
  const shareCard = async () => {
    if (!userId) return

    const publicUrl = `${window.location.origin}/profile/${userId}/id-card`

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.name || userName}'s Freelancer ID Card`,
          text: `Check out my CinePlanter freelancer profile!`,
          url: publicUrl
        })
      } else {
        await navigator.clipboard.writeText(publicUrl)
        alert('Profile link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const printCard = () => {
    window.print()
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="min-h-screen bg-[#050505] pt-24 relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <button
              onClick={() => router.back()}
              className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-gray-300" />
            </button>

            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={shareCard}
                className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-gray-300"
              >
                <Share2 size={18} />
                <span>Share</span>
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium text-white"
              >
                <Download size={18} />
                <span>Download</span>
              </button>
              <button
                onClick={printCard}
                className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-gray-300"
              >
                <Printer size={18} />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div ref={cardRef}>
              <FreelancerIDCard profile={profile} />
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            A7 size (74mm × 105mm) • Double-sided • Printable
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block {
            display: block !important;
          }
          nav, button, .action-buttons {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}