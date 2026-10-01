// src/components/profile/FlippableIDCard.tsx
'use client'

import { useState, useRef } from "react"
import { Mail, Phone, User, Star, MapPin, Copy, Check, Download, Printer, Globe, FileText } from "lucide-react"
import { useAuth } from "#/context/AuthContext"
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface FreelancerIDCardProps {
  profile: any
  userId?: string
  showActions?: boolean
}

export default function FreelancerIDCard({ profile }: FreelancerIDCardProps) {
  const { user } = useAuth()
  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const downloadCardRef = useRef<HTMLDivElement>(null)

  const freelancerData = profile?.freelancerProfile || {}
  const userName = profile?.name || user?.name || "User"
  const userEmail = profile?.email || user?.email || ""
  const userPhone = freelancerData?.phone || ""
  const userRole = freelancerData?.title || profile?.role || "Freelancer"
  const location = freelancerData?.location || profile?.location || "Not specified"

  // ✅ FIXED — Multiple fallback for userId
  const resolvedUserId = 
    profile?.id || 
    profile?.uid || 
    (user as any)?.id || 
    (user as any)?.uid || 
    ''

  // ✅ FIXED — Profile URL points to public ID card route
  const profileUrl = typeof window !== 'undefined' && resolvedUserId
    ? `${window.location.origin}/profile/${resolvedUserId}/id-card`
    : ''

  const handleCopyLink = () => {
    if (!profileUrl) return
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadFrontSide = async () => {
    if (!downloadCardRef.current) return
    
    setDownloading(true)
    try {
      const cardElement = downloadCardRef.current
      
      const canvas = await html2canvas(cardElement, {
        scale: 4,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false
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

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="relative">
      <div className="flex justify-center items-center min-h-[600px] p-4">
        
        {/* FRONT/BACK FLIPPABLE CARD */}
        <div 
          className="relative w-[350px] h-[580px] cursor-pointer perspective-1000 flippable-card"
          onClick={() => setIsFlipped(!isFlipped)}
          data-flipped={isFlipped}
        >
          <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRONT SIDE */}
            <div className="absolute w-full h-full backface-hidden">
              <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-5 flex flex-col">
                
                {/* Platform Name */}
                <div className="text-center pt-2 pb-2">
                  <h1 className="text-2xl font-bold text-gray-900">CinePlanter</h1>
                  <p className="text-xs text-gray-500 tracking-wide">FREELANCER ID</p>
                </div>

                {/* Avatar */}
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

                {/* Name */}
                <div className="text-center mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">{userName}</h2>
                </div>

                {/* Role */}
                <div className="text-center mb-3">
                  <p className="text-base text-gray-600">{userRole}</p>
                </div>

                {/* Contact Info */}
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

                {/* Profile Link Button */}
                <div className="flex justify-center mb-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1 rounded-full border border-gray-200"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>Profile Link</span>
                  </button>
                </div>

                {/* QR Code */}
                {profileUrl && (
                  <div className="flex justify-center mt-auto mb-6">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <QRCodeSVG 
                        value={profileUrl}
                        size={90}
                        level="H"
                        fgColor="#111827"
                      />
                    </div>
                  </div>
                )}

                <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-gray-400">tap to flip</p>
              </div>
            </div>

            {/* BACK SIDE */}
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
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} size={10} className={star <= Math.floor(parseFloat(freelancerData?.rating || "0")) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Links */}
                {freelancerData?.portfolio && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-600">Links</div>
                      <div className="w-2/3 flex flex-wrap gap-2">
                        {freelancerData.portfolio && (
                          <a 
                            href={freelancerData.portfolio} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Globe size={12} />
                            <span>Portfolio</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code */}
                {profileUrl && (
                  <div className="flex flex-col items-center mt-auto pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Scan to view profile</p>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <QRCodeSVG 
                        value={profileUrl} 
                        size={70} 
                        level="H" 
                        fgColor="#111827" 
                      />
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
                  <QRCodeSVG 
                    value={profileUrl}
                    size={80}
                    level="H"
                    fgColor="#111827"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-center gap-4 mt-6 flex-wrap">
        <button
          onClick={downloadFrontSide}
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

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .flippable-card, .flippable-card * {
            visibility: visible;
          }
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