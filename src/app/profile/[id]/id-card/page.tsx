// src/app/profile/[id]/id-card/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useAuth } from "#/context/AuthContext"
import Navbar from "#/components/Navbar"
import FlippableIDCard from "#/components/profile/FreelancerIDCard"
import { db } from "#/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { ArrowLeft, Share2 } from 'lucide-react'

export default function PublicIDCardPage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);
    };
    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, router]);

  const shareCard = async () => {
    const profileUrl = `${window.location.origin}/profile/${userId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.name}'s ID Card`,
          text: `Check out ${profile?.name}'s freelancer ID card on CinePlanter!`,
          url: profileUrl
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        alert('Profile link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"/>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full"/>
      </div>

      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto pt-24 px-6 pb-10">
        {/* Header with Buttons */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          
          {/* Only Share Button */}
          <button
            onClick={shareCard}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium text-white"
          >
            <Share2 size={18} />
            <span>Share ID Card</span>
          </button>
        </div>

        {/* Flippable ID Card */}
        <div className="flex justify-center">
          <FlippableIDCard profile={profile} />
        </div>

        {/* Info */}
        <p className="text-center text-sm text-gray-500 mt-8">
          A7 size (74mm × 105mm) • Tap to flip • Double-sided
        </p>
      </main>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .flippable-card {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 74mm;
            height: 105mm;
          }
          nav, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}