// app/profile/freelancer/id-card/page.tsx
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user) {
      loadUserData()
    }
  }, [user, isLoading])

  const loadUserData = async () => {
    try {
      const userId = user?.uid || user?.id
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
      
      // Front side capture
      card.setAttribute('data-flipped', 'false')
      await new Promise(resolve => setTimeout(resolve, 200))
      const frontCanvas = await html2canvas(card, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      })

      // Back side capture
      card.setAttribute('data-flipped', 'true')
      await new Promise(resolve => setTimeout(resolve, 200))
      const backCanvas = await html2canvas(card, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      })

      // Reset to front
      card.setAttribute('data-flipped', 'false')

      // Create PDF - A7 size (74mm x 105mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [74, 105]
      })

      // Add front side
      const frontImgData = frontCanvas.toDataURL('image/png')
      pdf.addImage(frontImgData, 'PNG', 0, 0, 74, 105, undefined, 'FAST')

      // Add back side on new page
      pdf.addPage([74, 105])
      const backImgData = backCanvas.toDataURL('image/png')
      pdf.addImage(backImgData, 'PNG', 0, 0, 74, 105, undefined, 'FAST')

      // Save PDF
      pdf.save(`${profile?.name || user?.name || 'freelancer'}-id-card.pdf`)

    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const shareCard = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.name || user?.name}'s Freelancer ID Card`,
          text: `Check out my CinePlanter freelancer profile!`,
          url: `${window.location.origin}/freelancer/${user?.uid || user?.id}`
        })
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/freelancer/${user?.uid || user?.id}`)
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
      {/* Navbar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Main Content - Below Navbar */}
      <div className="min-h-screen bg-[#050505] pt-24 relative">
        {/* Background Glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"/>
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full"/>
        </div>

        {/* ID Card Section */}
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          {/* Buttons Row - Left Cross, Right Actions */}
          <div className="flex items-center justify-between mb-8">
            {/* Left - Cross Button */}
            <button
              onClick={() => router.back()}
              className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-gray-300" />
            </button>

            {/* Right - Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={shareCard}
                className="flex items-center gap-2 px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-gray-300"
              >
                <Share2 size={18} />
                <span>Share</span>
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium text-white"
              >
                <Download size={18} />
                <span>Download</span>
              </button>
              <button
                onClick={printCard}
                className="flex items-center gap-2 px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-gray-300"
              >
                <Printer size={18} />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* ID Card - Centered */}
          <div className="flex justify-center">
            <div ref={cardRef}>
              <FreelancerIDCard profile={profile} />
            </div>
          </div>

          {/* Print Info - Below Card */}
          <p className="text-center text-sm text-gray-500 mt-8">
            A7 size (74mm × 105mm) • Double-sided • Printable
          </p>
        </div>
      </div>

      {/* Print Styles */}
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