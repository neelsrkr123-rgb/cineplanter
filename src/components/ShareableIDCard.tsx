'use client';

import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";

import type { ExtendedUser } from "#/types/user"; // তোমার টাইপ -- নথি অনুযায়ী adjust করো
import { Star } from "lucide-react";

type Props = {
  user: Partial<ExtendedUser>;
  avgRating?: number | null;
  successRate?: number | null;
  readOnly?: boolean; // public view
};

export default function ShareableIDCard({ user, avgRating = null, successRate = null, readOnly = false }: Props) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<HTMLDivElement | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const base = `${window.location.origin}/profile/${user.id || user.uid || user.id}`;
      setShareUrl(base);
    }
  }, [user]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard");
    } catch (err) {
      console.error(err);
      alert("Copy failed");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name || "Freelancer"} • ID`,
          text: `Check my freelancer profile`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("share failed", err);
      }
    } else {
      // fallback: copy link
      handleCopyLink();
    }
  };

  const downloadElementAsImage = async (el: HTMLElement | null, filename = "idcard.png") => {
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: null });
    const data = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = data;
    link.download = filename;
    link.click();
  };

  const handleDownloadCard = async () => {
    await downloadElementAsImage(cardRef.current as HTMLElement, `${(user.name || "profile").replace(/\s+/g, "_")}_IDCard.png`);
  };

  const handleDownloadQR = async () => {
    await downloadElementAsImage(qrRef.current as HTMLElement, `${(user.name || "profile").replace(/\s+/g, "_")}_QR.png`);
  };

  return (
    <div className="w-[340px]">
      <div className="perspective">
        <div
          ref={cardRef}
          className={`relative w-full h-[460px] duration-700 transform-style preserve-3d ${flipped ? 'rotate-y-180' : ''}`}
          style={{ height: 460 }}
        >
          {/* FRONT */}
          <div className="absolute w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 backface-hidden flex flex-col items-center justify-start">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mt-6">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-white text-3xl">{(user.name || "U").slice(0,1)}</div>
              )}
            </div>

            <h2 className="mt-4 text-xl font-bold text-center">{user.name}</h2>
            <p className="text-sm text-purple-300 mt-1 text-center">{user.role || "—"}</p>
            <div className="mt-4 text-center text-sm text-gray-300">
              <div>{user.email || "—"}</div>
              <div className="mt-1">{user.phone || "—"}</div>
            </div>

            <div className="mt-6 w-full px-2">
              <div className="flex justify-between text-xs text-gray-400">
                <div>Followers</div>
                <div>Following</div>
                <div>Verified</div>
              </div>
              <div className="flex justify-between mt-1 text-white">
                <div>{(user.followers && user.followers.length) ?? "0"}</div>
                <div>{(user.following && user.following.length) ?? "0"}</div>
                <div>✓</div>
              </div>
            </div>

            <div className="mt-6 mx-auto flex gap-3">
              <button onClick={handleShare} className="px-3 py-1 bg-purple-600 rounded text-sm">Share Link</button>
              <button onClick={handleDownloadCard} className="px-3 py-1 bg-green-600 rounded text-sm">Download Card</button>
            </div>

            <button onClick={() => setFlipped(true)} className="mt-auto text-sm text-gray-300 hover:text-white">Flip to back</button>
          </div>

          {/* BACK */}
          <div className="absolute w-full h-full bg-gray-800/95 text-white rounded-2xl p-6 backface-hidden rotate-y-180 flex flex-col">
            <h3 className="text-lg font-semibold text-purple-300">Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm mt-3 text-gray-200">
              <div><span className="text-gray-400">Location:</span> {user.location || "—"}</div>
              <div><span className="text-gray-400">Hourly:</span> {user.hourlyRate ? `$${user.hourlyRate}/hr` : "—"}</div>
              <div className="col-span-2"><span className="text-gray-400">Skills:</span> {Array.isArray(user.skills) ? user.skills.join(", ") : (user.skills || "—")}</div>
              <div className="col-span-2"><span className="text-gray-400">Experience:</span> {user.experience || "—"}</div>

              <div className="col-span-2 flex items-center gap-2 mt-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <div>{avgRating ? `${avgRating}/5` : "—"}</div>
              </div>
              <div className="col-span-2 text-green-400">Success: {successRate ?? "—"}%</div>
            </div>

            <h4 className="text-sm font-semibold mt-4 text-purple-300">Direct Links</h4>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {user.resume && <a href={user.resume} target="_blank" className="text-blue-400">Resume</a>}
              {user.portfolio && <a href={user.portfolio} target="_blank" className="text-blue-400">Portfolio</a>}
              {user.socials?.instagram && <a href={user.socials.instagram} target="_blank" className="text-blue-400">Instagram</a>}
              {user.socials?.youtube && <a href={user.socials.youtube} target="_blank" className="text-blue-400">YouTube</a>}
            </div>

            <div className="mt-auto flex flex-col items-center gap-3">
              <div ref={qrRef} className="p-2 bg-black rounded">
                <QRCode value={shareUrl} size={110} fgColor="#ffffff" bgColor="#000000" />
              </div>

              <div className="flex gap-3">
                <button onClick={handleDownloadQR} className="px-3 py-1 bg-gray-600 rounded text-sm">Download QR</button>
                <button onClick={handleCopyLink} className="px-3 py-1 bg-purple-600 rounded text-sm">Copy Link</button>
                <button onClick={() => setFlipped(false)} className="px-3 py-1 bg-gray-700 rounded text-sm">Flip front</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .transform-style { transform-style: preserve-3d; }
        .preserve-3d { transform-style: preserve-3d; }
        .duration-700 { transition: transform 0.7s; }
      `}</style>
    </div>
  );
}
