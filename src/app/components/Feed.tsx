'use client';

import { useEffect, useState } from "react";
import { db } from "#/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit
} from "firebase/firestore";

import PostCard from "./PostCard";

export default function Feed() {

  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {

    const q = query(
      collection(db, "posts"),
      where("isDeleted", "==", false),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {

      const postList = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setPosts(postList);

    });

    return () => unsub();

  }, []);

  return (
    <div>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}