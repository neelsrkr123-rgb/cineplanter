// components/profile/FlippableIDCard.tsx
'use client'

import { useState, useRef } from "react"
import { Mail, Phone, User, Award, MapPin, Briefcase, Clock, DollarSign, Star, Globe, FileText, ExternalLink, Copy, Check, Download, Printer } from 'lucide-react'
import { useAuth } from "#/context/AuthContext"
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface FlippableIDCardProps {
  profile: any
}

export default function FlippableIDCard({ profile }: FlippableIDCardProps) {
  const { user } = useAuth()
  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const downloadCardRef = useRef<HTMLDivElement>(null)

  const freelancerData = profile?.freelancerProfile || {}
  const userName = profile?.name || profile?.displayName || user?.name || "Neel Sarkar"
  const userEmail = profile?.email || user?.email || "neelsrkr123@gmail.com"
  const userPhone = freelancerData?.phone || "+91 6295090960"
  const userRole = freelancerData?.title || "Photographer"
  
  const location = freelancerData?.location || "Kolkata, India"
  const profileUrl = `${window.location.origin}/profile/${profile?.uid || user?.uid}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Download Front Side Only - CR80 Standard size on A4 Page
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
      
      // Vertical CR80 Standard card size: 54mm x 85.6mm (width x height)
      const cardWidth = 54
      const cardHeight = 85.6
      
      // Center the card on A4 page (210mm x 297mm)
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
        {/* Virtual Card Container - Original design with links */}
        <div 
          className="relative w-[350px] h-[580px] cursor-pointer perspective-1000 flippable-card"
          onClick={() => setIsFlipped(!isFlipped)}
          data-flipped={isFlipped}
        >
          {/* Flippable Card - Virtual View */}
          <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRONT SIDE - Virtual Card Design with Links */}
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
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt={userName} className="w-full h-full object-cover" />
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

                {/* Contact Info - With Copy Buttons */}
                <div className="space-y-1.5 px-4 mb-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700 group">
                    <Phone size={14} className="text-gray-500" />
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${userPhone.replace(/[\s+]/g, '')}`;
                      }}
                      className="hover:text-blue-600 transition-colors cursor-pointer underline underline-offset-2 decoration-gray-300 hover:decoration-blue-600"
                    >
                      {userPhone}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(userPhone);
                        alert('Phone number copied!');
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                      title="Copy phone number"
                    >
                      <Copy size={12} className="text-gray-500 hover:text-gray-700" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700 group">
                    <Mail size={14} className="text-gray-500" />
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `mailto:${userEmail}`;
                      }}
                      className="hover:text-blue-600 transition-colors cursor-pointer underline underline-offset-2 decoration-gray-300 hover:decoration-blue-600"
                    >
                      {userEmail}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(userEmail);
                        alert('Email copied!');
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                      title="Copy email address"
                    >
                      <Copy size={12} className="text-gray-500 hover:text-gray-700" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                    <MapPin size={14} className="text-gray-500" />
                    <span>{location}</span>
                  </div>
                </div>

                {/* Profile Link - Only on Virtual Card */}
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

                {/* Flip Hint */}
                <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-gray-400">tap to flip</p>
              </div>
            </div>

            {/* BACK SIDE - Virtual Card Design with Links Section */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180">
              <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-5 flex flex-col">
                
                {/* Header */}
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
                  
                  <div className="flex">
                    <div className="w-1/3 font-medium text-gray-600">Skills</div>
                    <div className="w-2/3 text-gray-900">{freelancerData?.skills?.join(' · ') || "video editing · photography · cinematography"}</div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-1/3 font-medium text-gray-600">Experience</div>
                    <div className="w-2/3 text-gray-900">{freelancerData?.experience || "2"} years</div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-1/3 font-medium text-gray-600">Hourly Rate</div>
                    <div className="w-2/3 text-gray-900">₹{freelancerData?.hourlyRate || "10"}/hr</div>
                  </div>
                  
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
                  
                  <div className="flex">
                    <div className="w-1/3 font-medium text-gray-600">Success Rate</div>
                    <div className="w-2/3 text-gray-900">{freelancerData?.successRate || "0%"}</div>
                  </div>
                </div>

                {/* Links Section - RESTORED */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex">
                    <div className="w-1/3 font-medium text-gray-600">Links</div>
                    <div className="w-2/3">
                      <div className="flex flex-wrap gap-2">
                        {/* Portfolio Link */}
                        {freelancerData?.portfolio && (
                          <a 
                            href={freelancerData.portfolio} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Globe size={12} className="text-gray-500" />
                            <span>Portfolio</span>
                          </a>
                        )}

                        {/* Resume Link */}
                        {freelancerData?.resume && (
                          <a 
                            href={freelancerData.resume} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText size={12} className="text-gray-500" />
                            <span>Resume</span>
                          </a>
                        )}

                        {/* Facebook Link */}
                        {freelancerData?.facebook && (
                          <a 
                            href={freelancerData.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span>Facebook</span>
                          </a>
                        )}

                        {/* Instagram Link */}
                        {freelancerData?.instagram && (
                          <a 
                            href={freelancerData.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-pink-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                            </svg>
                            <span>Instagram</span>
                          </a>
                        )}

                        {/* GitHub Link */}
                        {freelancerData?.github && (
                          <a 
                            href={freelancerData.github} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.34 4.687-4.57 4.935.36.31.68.92.68 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12c0-5.523-4.477-10-10-10z"/>
                            </svg>
                            <span>GitHub</span>
                          </a>
                        )}

                        {/* LinkedIn Link */}
                        {freelancerData?.linkedin && (
                          <a 
                            href={freelancerData.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-700 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <span>LinkedIn</span>
                          </a>
                        )}

                        {/* Twitter/X Link */}
                        {freelancerData?.twitter && (
                          <a 
                            href={freelancerData.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            <span>Twitter</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
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

                {/* Flip Hint */}
                <p className="text-center text-[10px] text-gray-400 mt-3">← tap to flip back</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Download Card - Larger text from avatar to location only */}
        <div ref={downloadCardRef} className="fixed top-[-9999px] left-[-9999px]">
          <div className="w-[350px] h-[580px] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col">
            
            {/* Platform Name - Normal size */}
            <div className="text-center pt-8 pb-2">
              <h1 className="text-2xl font-bold text-gray-900">CinePlanter</h1>
              <p className="text-xs text-gray-500 tracking-wide mt-1">FREELANCER ID</p>
            </div>

            {/* Avatar - Much Larger */}
            <div className="flex justify-center mt-6 mb-5">
              <div className="w-44 h-44 rounded-full bg-gray-100 border-4 border-gray-300 flex items-center justify-center overflow-hidden shadow-md">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <User size={90} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Name - Larger */}
            <div className="text-center mb-3">
              <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
            </div>

            {/* Role - Larger */}
            <div className="text-center mb-5">
              <p className="text-lg text-gray-600 font-medium">{userRole}</p>
            </div>

            {/* Contact Info - Larger text, better spacing */}
            <div className="space-y-3 px-6 mb-6">
              <div className="flex items-center justify-center gap-3 text-base text-gray-700">
                <Phone size={18} className="text-gray-500" />
                <span className="font-mono text-base">{userPhone}</span>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-base text-gray-700">
                <Mail size={18} className="text-gray-500" />
                <span className="text-base">{userEmail}</span>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-base text-gray-700">
                <MapPin size={18} className="text-gray-500" />
                <span className="text-base">{location}</span>
              </div>
            </div>

            {/* QR Code - Normal size at bottom */}
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
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-6">
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