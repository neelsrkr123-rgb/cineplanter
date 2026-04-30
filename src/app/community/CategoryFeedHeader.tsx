"use client";

import { useEffect, useState } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  increment,
  updateDoc
} from "firebase/firestore";
import { db, auth } from "#/lib/firebase";

export default function CategoryFeedHeader({ category }: any) {
  const user = auth.currentUser;
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      const ref = doc(
        db,
        "category_followers",
        category.slug,
        "users",
        user.uid
      );
      const snap = await getDoc(ref);
      setIsFollowing(snap.exists());
    };

    check();
  }, [category.slug, user]);

  const follow = async () => {
    if (!user) return;

    await setDoc(
      doc(db, "category_followers", category.slug, "users", user.uid),
      { followedAt: new Date() }
    );

    await updateDoc(
      doc(db, "community_categories", category.slug),
      { followersCount: increment(1) }
    );

    setIsFollowing(true);
  };

  const unfollow = async () => {
    if (!user) return;

    await deleteDoc(
      doc(db, "category_followers", category.slug, "users", user.uid)
    );

    await updateDoc(
      doc(db, "community_categories", category.slug),
      { followersCount: increment(-1) }
    );

    setIsFollowing(false);
  };

  return (
    <div>
      {/* BANNER */}
      <img
        src={category.coverImage}
        alt={category.title}
        className="w-full h-[260px] object-cover"
      />

      {/* INFO BAR */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black">{category.title}</h1>
          <p className="text-sm text-slate-400">
            {category.followersCount} followers
          </p>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm text-slate-400 hover:text-white">
            Invite
          </button>
          <button className="px-3 py-1.5 text-sm text-slate-400 hover:text-white">
            Share
          </button>

          {isFollowing ? (
            <button
              onClick={unfollow}
              className="px-4 py-1.5 text-sm border border-white/20 rounded-lg"
            >
              Unfollow
            </button>
          ) : (
            <button
              onClick={follow}
              className="px-4 py-1.5 text-sm bg-white text-black rounded-lg"
            >
              Follow
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
