// components/IDCard.tsx
import React, { useEffect, useState } from "react";
import { User as UserIcon, Star, MoreVertical } from "lucide-react";
import type { ExtendedUser } from "#/types/user";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "#/lib/firebase";

type Props = {
  user: ExtendedUser;
  updateUserData: (data: Partial<ExtendedUser>) => Promise<void>;
};

export default function IDCard({ user, updateUserData }: Props) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(user?.role || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Real-time listeners
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const qFollowers = query(collection(db, "followers"), where("followee", "==", user.uid));
      const unsubF = onSnapshot(qFollowers, (snap) => {
        setFollowers(snap.size);
      });

      const qFollowing = query(collection(db, "followers"), where("follower", "==", user.uid));
      const unsubG = onSnapshot(qFollowing, (snap) => {
        setFollowing(snap.size);
      });

      const qReviews = query(collection(db, "reviews"), where("reviewee", "==", user.uid));
      const unsubR = onSnapshot(qReviews, (snap) => {
        const ratings: number[] = [];
        let successCount = 0;
        snap.forEach((d) => {
          const data = d.data() as any;
          if (typeof data.rating === "number") ratings.push(data.rating);
          if (data.success) successCount += 1;
        });
        if (ratings.length > 0) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          setAvgRating(Math.round(avg * 10) / 10);
          setSuccessRate(Math.round((successCount / snap.size) * 100));
        } else {
          setAvgRating(null);
          setSuccessRate(null);
        }
      });

      return () => {
        unsubF();
        unsubG();
        unsubR();
      };
    } catch (err) {
      console.warn("IDCard listener error:", err);
    }
  }, [user?.uid]);

  const handleSave = async () => {
    try {
      await updateUserData({ role, phone, location });
      setEditing(false);
    } catch (err) {
      console.error("Failed to save ID card data:", err);
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/8 p-4 w-[260px] h-[430px] flex flex-col items-center relative">
      {/* header curve */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-gray-900 to-gray-800 rounded-t-2xl"></div>

      {/* avatar */}
      <div className="mt-8 w-28 h-28 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <UserIcon className="w-12 h-12 text-white" />
        )}
      </div>

      {/* name */}
      <h3 className="mt-4 text-xl font-bold text-white text-center">{user?.name}</h3>

      {/* role */}
      {editing ? (
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 bg-transparent border-b border-white/10 text-white text-sm text-center w-40 p-1 outline-none"
        />
      ) : (
        <p className="text-sm text-purple-200 mt-1 text-center">
          {role || user?.role || "—"}
        </p>
      )}

      {/* followers/following */}
      <div className="flex gap-6 mt-3 text-center">
        <div>
          <div className="text-white font-semibold">{followers}</div>
          <div className="text-xs text-gray-300">Followers</div>
        </div>
        <div>
          <div className="text-white font-semibold">{following}</div>
          <div className="text-xs text-gray-300">Following</div>
        </div>
      </div>

      {/* contact */}
      <div className="text-center mt-3 text-sm text-gray-300">
        <p>{user?.email || "—"}</p>
        {editing ? (
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="mt-1 bg-transparent border-b border-white/10 text-white text-sm text-center w-40 p-1 outline-none"
          />
        ) : (
          <p className="mt-1">{phone || user?.phone || "—"}</p>
        )}
      </div>

      {/* location */}
      {editing ? (
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="mt-2 bg-transparent border-b border-white/10 text-white text-sm text-center w-44 p-1 outline-none"
        />
      ) : (
        <p className="text-xs text-gray-400 mt-2">
          {location || user?.location || "—"}
        </p>
      )}

      {/* rating & success */}
      <div className="mt-4 text-center">
        {avgRating !== null && (
          <div className="flex items-center gap-2 justify-center">
            <Star className="w-4 h-4 text-yellow-400" />
            <div className="text-white text-sm">{avgRating}/5</div>
          </div>
        )}
        {successRate !== null && (
          <div className="text-green-400 text-sm mt-1">{successRate}% Success Rate</div>
        )}
      </div>

      {/* bottom menu */}
      <div className="absolute bottom-3 right-4">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="p-1 rounded-full bg-black/40"
          >
            <MoreVertical className="w-5 h-5 text-gray-300" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-gray-800/90 border border-white/6 rounded-lg shadow-lg z-20 w-40 p-2">
              <button
                onClick={() => {
                  setEditing(true);
                  setMenuOpen(false);
                }}
                className="w-full text-left p-2 text-sm text-white hover:bg-white/5 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  alert("Share (virtual ID) — coming soon");
                  setMenuOpen(false);
                }}
                className="w-full text-left p-2 text-sm text-white hover:bg-white/5 rounded"
              >
                Share
              </button>
              <button
                onClick={() => {
                  alert("Download QR — coming soon");
                  setMenuOpen(false);
                }}
                className="w-full text-left p-2 text-sm text-white hover:bg-white/5 rounded"
              >
                Download
              </button>
            </div>
          )}
        </div>
      </div>

      {/* edit actions */}
      {editing && (
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="px-2 py-1 bg-gray-600 rounded text-sm text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-2 py-1 bg-purple-600 rounded text-sm text-white"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
