// src/components/FreelancerIDCard.tsx
'use client';

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function FreelancerIDCard({ userData }: { userData: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  // PDF/Print Download
  const handleDownload = useReactToPrint({
    content: () => cardRef.current,
    documentTitle: `${userData.name}-IDCard`,
  });

  // Share via Web Share API
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userData.name} | Freelancer ID`,
          text: `Check my Freelancer Profile on Cine Planter 🚀`,
          url: `${window.location.origin}/profile/${userData.id}`, // 🔹 direct profile link
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      alert("Sharing not supported in this browser");
    }
  };

  return (
    <div className="mt-6">
      {/* Card */}
      <div
        ref={cardRef}
        className="p-6 bg-gray-800 rounded-xl border border-gray-700 text-white max-w-sm mx-auto"
      >
        <h2 className="text-xl font-semibold mb-3 text-purple-300">🆔 Freelancer ID Card</h2>
        <p><strong>Name:</strong> {userData.name}</p>
        <p><strong>Role:</strong> {userData.role || "N/A"}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Phone:</strong> {userData.phone || "N/A"}</p>
        <p><strong>Location:</strong> {userData.location || "N/A"}</p>
        <p><strong>Hourly Rate:</strong> {userData.hourlyRate || "N/A"}</p>
        <p><strong>Experience:</strong> {userData.experience || "N/A"}</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4 justify-center">
        <button
          onClick={handleShare}
          className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
        >
          📤 Share
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
        >
          ⬇️ Download
        </button>
      </div>
    </div>
  );
}
