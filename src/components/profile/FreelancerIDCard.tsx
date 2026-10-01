// src/components/profile/FreelancerIDCard.tsx
'use client'

import { useState, useRef, useEffect } from "react"
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

  // ✅ Multiple fallback for userId
  const resolvedUserId = 
    userId || 
    profile?.id || 
    profile?.uid || 
    ''

  // ✅ Public profile URL
  const profileUrl = typeof window !== 'undefined' && resolvedUserId
    ? `${window.location.origin}/profile/${resolvedUserId}/id-card`
    : ''

  // Debug
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 ID Card Debug:', {
        userIdProp: userId,
        profileId: profile?.id,
        resolvedUserId,
        profileUrl,
        socials
      })
    }
  }, [userId, profile, resolvedUserId, profileUrl, socials])

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
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const cardWidth = 54
      const cardHeight = 85.6
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

  // Check if any links exist
  const hasAnyLink = 
    socials.instagram || 
    socials.youtube || 
    socials.twitter || 
    socials.facebook ||
    freelancerData?.portfolio || 
    freelancerData?.website ||
    freelancerData?.github ||
    freelancerData?.linkedin

  return (
    <div className="relative">
      <div className="flex justify-center items-center min-h-[600px] p-4">

        {/* FLIPPABLE CARD */}
        <div 
          className="relative w-[350px] h-[580px] cursor-pointer perspective-1000 flippable-card"
          onClick={() => setIsFlipped(!isFlipped)}
          data-flipped={isFlipped}
        >
          <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* ─────────── FRONT ─────────── */}
            <div className="absolute w-full h-full backface-hidden">
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
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1 rounded-full border border-gray-200"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>Profile Link</span>
                  </button>
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
            </div>

            {/* ─────────── BACK ─────────── */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180">
              <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-5 flex flex-col">

                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">CinePlanter</h2>
                  <p className="text-[10px] text-gray-500">PROFESSIONAL DETAILS</p>
                </div>

                {/* Info Grid */}
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

                {/* ✅ SOCIAL LINKS — from profile.socials + freelancerProfile */}
                {hasAnyLink && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-600 text-xs">Links</div>
                      <div className="w-2/3">
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5">

                          {/* Portfolio */}
                          {freelancerData?.portfolio && (
                            <a 
                              href={typeof freelancerData.portfolio === 'string' 
                                ? freelancerData.portfolio 
                                : undefined} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe size={11} className="text-gray-500" />
                              <span>Portfolio</span>
                            </a>
                          )}

                          {/* Website */}
                          {freelancerData?.website && (
                            <a 
                              href={freelancerData.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe size={11} className="text-gray-500" />
                              <span>Website</span>
                            </a>
                          )}

                          {/* Instagram */}
                          {socials?.instagram && (
                            <a 
                              href={socials.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-pink-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z" />
                              </svg>
                              <span>Instagram</span>
                            </a>
                          )}

                          {/* YouTube */}
                          {socials?.youtube && (
                            <a 
                              href={socials.youtube} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-red-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                              </svg>
                              <span>YouTube</span>
                            </a>
                          )}

                          {/* Twitter */}
                          {socials?.twitter && (
                            <a 
                              href={socials.twitter} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                              <span>Twitter</span>
                            </a>
                          )}

                          {/* Facebook */}
                          {socials?.facebook && (
                            <a 
                              href={socials.facebook} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                              <span>Facebook</span>
                            </a>
                          )}

                          {/* GitHub */}
                          {freelancerData?.github && (
                            <a 
                              href={freelancerData.github} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-900"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.34 4.687-4.57 4.935.36.31.68.92.68 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12c0-5.523-4.477-10-10-10z" />
                              </svg>
                              <span>GitHub</span>
                            </a>
                          )}

                          {/* LinkedIn */}
                          {freelancerData?.linkedin && (
                            <a 
                              href={freelancerData.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                              <span>LinkedIn</span>
                            </a>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code */}
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
            </div>
          </div>
        </div>

        {/* HIDDEN DOWNLOAD CARD */}
        <div ref={downloadCardRef} className="fixed top-[-9999px] left-[-9999px]">
          <div className="w-[350px] h-[580px] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col">
            <div className="text-center pt-8 pb-2">
              <h1 className="text-2xl font-bold text-gray-900">CinePlanter</h1>
              <p className="text-xs text-gray-500 tracking-wide mt-1">FREELANCER ID</p>
            </div>
            <div className="flex justify-center mt-6 mb-5">
              <div className="w-44 h-44 rounded-full bg-gray-100 border-4 border-gray-300 flex items-center justify-center overflow-hidden shadow-md">
                {profile?.avatar || profile?.photoURL ? (
                  <img 
                    src={profile.avatar || profile.photoURL} 
                    alt={userName} 
                    className="w-full h-full object-cover" 
                  />
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

      {/* ACTION BUTTONS */}
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
            <span>Download ID Card</span>
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

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @media print {
          body * { visibility: hidden; }
          .flippable-card, .flippable-card * { visibility: visible; }
          .flippable-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}