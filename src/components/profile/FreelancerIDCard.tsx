// src/components/profile/FreelancerIDCard.tsx
'use client'

import { useState, useRef } from "react"
import { Mail, Phone, User, Star, MapPin, Copy, Check, Download, Printer, Globe } from "lucide-react"
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface FreelancerIDCardProps {
  profile: any
  userId?: string
  showActions?: boolean
}

export default function FreelancerIDCard({
  profile,
  userId,
  showActions = true
}: FreelancerIDCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const downloadCardRef = useRef<HTMLDivElement>(null)

  const freelancerData = profile?.freelancerProfile || {}
  const socials = profile?.socials || {}

  const userName = profile?.name || "User"
  const userEmail = profile?.email || ""
  const userPhone = freelancerData?.phone || profile?.phone || ""
  const userRole = freelancerData?.title || profile?.role || "Freelancer"
  const location = freelancerData?.location || profile?.location || "Not specified"

  const resolvedUserId = userId || profile?.id || profile?.uid || ''

  const profileUrl = typeof window !== 'undefined' && resolvedUserId
    ? `${window.location.origin}/profile/${resolvedUserId}/id-card`
    : ''

  const handleCopyLink = () => {
    if (!profileUrl) return
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadAsPDF = async () => {
    if (!downloadCardRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(downloadCardRef.current, {
        scale: 4,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const cardWidth = 74
      const cardHeight = 105
      const xPosition = (210 - cardWidth) / 2
      const yPosition = (297 - cardHeight) / 2
      pdf.addImage(imgData, 'PNG', xPosition, yPosition, cardWidth, cardHeight)
      pdf.save(`${userName.replace(/\s/g, '_')}_ID_Card.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => window.print()

  const hasAnyLink =
    socials.instagram || socials.youtube || socials.twitter || socials.facebook ||
    freelancerData?.portfolio || freelancerData?.website ||
    freelancerData?.github || freelancerData?.linkedin

  // ═══════════════════════════════════════════════════════════
  // FRONT CARD CONTENT
  // ═══════════════════════════════════════════════════════════
  const FrontContent = () => (
    <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-5 flex flex-col">
      <div className="text-center pt-2 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">CinePlanter</h1>
        <p className="text-xs text-gray-500 tracking-wide">FREELANCER ID</p>
      </div>

      <div className="flex justify-center mt-2 mb-3">
        <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center overflow-hidden shadow-sm">
          {profile?.avatar || profile?.photoURL ? (
            <img
              src={profile.avatar || profile.photoURL}
              alt={userName}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <User size={56} className="text-gray-400" />
          )}
        </div>
      </div>

      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-gray-900">{userName}</h2>
      </div>

      <div className="text-center mb-3">
        <p className="text-base text-gray-600">{userRole}</p>
      </div>

      <div className="space-y-1.5 px-4 mb-3">
        {userPhone && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
            <Phone size={14} className="text-gray-500" />
            <span>{userPhone}</span>
          </div>
        )}
        {userEmail && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
            <Mail size={14} className="text-gray-500" />
            <span className="truncate max-w-[200px]">{userEmail}</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
          <MapPin size={14} className="text-gray-500" />
          <span>{location}</span>
        </div>
      </div>

      <div className="flex justify-center mb-3">
        <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
          <Copy size={12} />
          <span>Profile Link</span>
        </div>
      </div>

      {profileUrl && (
        <div className="flex justify-center mt-auto mb-6">
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <QRCodeSVG value={profileUrl} size={90} level="H" fgColor="#111827" />
          </div>
        </div>
      )}

      <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-gray-400">
        tap to flip
      </p>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // BACK CARD CONTENT
  // ═══════════════════════════════════════════════════════════
  const BackContent = () => (
    <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-5 flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">CinePlanter</h2>
        <p className="text-[10px] text-gray-500">PROFESSIONAL DETAILS</p>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex">
          <div className="w-1/3 font-medium text-gray-600">Location</div>
          <div className="w-2/3 text-gray-900">{location}</div>
        </div>
        {freelancerData?.skills && (
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Skills</div>
            <div className="w-2/3 text-gray-900">
              {Array.isArray(freelancerData.skills)
                ? freelancerData.skills.join(' · ')
                : freelancerData.skills}
            </div>
          </div>
        )}
        {freelancerData?.experience && (
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Experience</div>
            <div className="w-2/3 text-gray-900">{freelancerData.experience} years</div>
          </div>
        )}
        {freelancerData?.hourlyRate && (
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Hourly Rate</div>
            <div className="w-2/3 text-gray-900">₹{freelancerData.hourlyRate}/hr</div>
          </div>
        )}
        <div className="flex">
          <div className="w-1/3 font-medium text-gray-600">Rating</div>
          <div className="w-2/3 text-gray-900 flex items-center gap-1">
            <span>{freelancerData?.rating || "0.0"}/5</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={10}
                  className={
                    star <= Math.floor(parseFloat(freelancerData?.rating || "0"))
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasAnyLink && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600 text-xs">Links</div>
            <div className="w-2/3">
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {freelancerData?.portfolio && (
                  <a href={typeof freelancerData.portfolio === 'string' ? freelancerData.portfolio : undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600">
                    <Globe size={11} className="text-gray-500" />
                    <span>Portfolio</span>
                  </a>
                )}
                {socials?.instagram && (
                  <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-pink-600">
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/></svg>
                    <span>Instagram</span>
                  </a>
                )}
                {socials?.youtube && (
                  <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-red-600">
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/></svg>
                    <span>YouTube</span>
                  </a>
                )}
                {socials?.twitter && (
                  <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-400">
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>
                    <span>Twitter</span>
                  </a>
                )}
                {socials?.facebook && (
                  <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600">
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {profileUrl && (
        <div className="flex flex-col items-center mt-auto pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Scan to view profile</p>
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <QRCodeSVG value={profileUrl} size={70} level="H" fgColor="#111827" />
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-gray-400 mt-3">← tap to flip back</p>
    </div>
  )

  return (
    <div className="relative">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCREEN VIEW — Flippable + side-by-side preview             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="screen-only">
        {/* Single flippable card */}
        <div className="flex justify-center items-center min-h-[600px] p-4">
          <div
            className="relative w-[350px] h-[580px] cursor-pointer perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              <div className="absolute w-full h-full backface-hidden">
                <FrontContent />
              </div>
              <div className="absolute w-full h-full backface-hidden rotate-y-180">
                <BackContent />
              </div>
            </div>
          </div>

          {/* Hidden download card */}
          <div ref={downloadCardRef} className="fixed top-[-9999px] left-[-9999px]">
            <div className="w-[350px] h-[580px] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col">
              <div className="text-center pt-8 pb-2">
                <h1 className="text-2xl font-bold text-gray-900">CinePlanter</h1>
                <p className="text-xs text-gray-500 tracking-wide mt-1">FREELANCER ID</p>
              </div>
              <div className="flex justify-center mt-6 mb-5">
                <div className="w-44 h-44 rounded-full bg-gray-100 border-4 border-gray-300 flex items-center justify-center overflow-hidden shadow-md">
                  {profile?.avatar || profile?.photoURL ? (
                    <img src={profile.avatar || profile.photoURL} alt={userName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <User size={90} className="text-gray-400" />
                  )}
                </div>
              </div>
              <div className="text-center mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
              </div>
              <div className="text-center mb-5">
                <p className="text-lg text-gray-600 font-medium">{userRole}</p>
              </div>
              <div className="space-y-3 px-6 mb-6">
                {userPhone && (
                  <div className="flex items-center justify-center gap-3 text-base text-gray-700">
                    <Phone size={18} className="text-gray-500" />
                    <span className="font-mono text-base">{userPhone}</span>
                  </div>
                )}
                {userEmail && (
                  <div className="flex items-center justify-center gap-3 text-base text-gray-700">
                    <Mail size={18} className="text-gray-500" />
                    <span className="text-base">{userEmail}</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 text-base text-gray-700">
                  <MapPin size={18} className="text-gray-500" />
                  <span className="text-base">{location}</span>
                </div>
              </div>
              {profileUrl && (
                <div className="flex justify-center mt-auto mb-6">
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <QRCodeSVG value={profileUrl} size={80} level="H" fgColor="#111827" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            <button
              onClick={downloadAsPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Download size={16} />
              )}
              <span>Download</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              Flip Card
            </button>
          </div>
        )}

        {/* ✅ SIDE-BY-SIDE PREVIEW — shown on screen (below buttons) */}
        <div className="mt-12">
          <p className="text-center text-sm text-gray-400 mb-4">
            Print Preview — Front + Back (A4 paper)
          </p>
          <div className="flex justify-center items-start gap-6 flex-wrap">
            {/* FRONT preview */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">FRONT</span>
              <div className="w-[296px] h-[420px] rounded-2xl overflow-hidden shadow-2xl">
                <div className="w-full h-full scale-[0.845] origin-top-left">
                  <div className="w-[350px] h-[497px] relative">
                    <FrontContent />
                  </div>
                </div>
              </div>
            </div>

            {/* BACK preview */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">BACK</span>
              <div className="w-[296px] h-[420px] rounded-2xl overflow-hidden shadow-2xl">
                <div className="w-full h-full scale-[0.845] origin-top-left">
                  <div className="w-[350px] h-[497px] relative">
                    <BackContent />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PRINT VIEW — A4 with 2 cards side by side                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="print-only">
        <div className="print-a4-page">
          <div className="print-card">
            <FrontContent />
          </div>
          <div className="print-card">
            <BackContent />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }

        /* Print view hidden on screen */
        .print-only {
          display: none;
        }

        @media print {
          /* Hide screen view */
          .screen-only {
            display: none !important;
          }

          /* Show print view */
          .print-only {
            display: block !important;
          }

          /* Hide navbar and other chrome */
          nav, header, footer, button {
            display: none !important;
          }

          /* Hide everything else */
          body > * {
            visibility: hidden;
          }

          /* Show only print-only container */
          .print-only,
          .print-only * {
            visibility: visible !important;
          }

          /* A4 page layout */
          .print-a4-page {
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
            gap: 8mm !important;
            padding: 15mm !important;
            width: 210mm !important;
            min-height: 297mm !important;
            background: white !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            box-sizing: border-box !important;
          }

          .print-card {
            width: 74mm !important;
            height: 105mm !important;
            background: white !important;
            overflow: hidden !important;
            border-radius: 3mm !important;
            border: 0.3mm solid #ddd !important;
            box-shadow: none !important;
            flex-shrink: 0 !important;
            page-break-inside: avoid !important;
            position: relative !important;
            transform: scale(0.98);
            transform-origin: top center;
          }

          /* Reset shadow/filters for clean print */
          .print-card * {
            box-shadow: none !important;
            text-shadow: none !important;
          }

          /* Page setup */
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}