// src/lib/follow.ts
import { db } from "#/lib/firebase";
import { doc, setDoc, updateDoc, deleteField, getDoc } from "firebase/firestore";

/**
 * Follow a user (creates/merges fields in following/currentUserId and followers/targetUserId)
 */
export async function followUser(currentUid: string, targetUid: string) {
  if (!currentUid || !targetUid || currentUid === targetUid) return;

  try {
    // set field in following/currentUid
    await setDoc(doc(db, "following", currentUid), { [targetUid]: true }, { merge: true });

    // set field in followers/targetUid
    await setDoc(doc(db, "followers", targetUid), { [currentUid]: true }, { merge: true });
  } catch (err) {
    console.error("followUser error:", err);
    throw err;
  }
}

/**
 * Unfollow a user (delete the fields)
 */
export async function unfollowUser(currentUid: string, targetUid: string) {
  if (!currentUid || !targetUid || currentUid === targetUid) return;

  try {
    // remove from following/currentUid (if doc not exists updateDoc will fail - handle)
    const followingRef = doc(db, "following", currentUid);
    const followingSnap = await getDoc(followingRef);
    if (followingSnap.exists()) {
      await updateDoc(followingRef, { [targetUid]: deleteField() });
    }

    // remove from followers/targetUid
    const followersRef = doc(db, "followers", targetUid);
    const followersSnap = await getDoc(followersRef);
    if (followersSnap.exists()) {
      await updateDoc(followersRef, { [currentUid]: deleteField() });
    }
  } catch (err) {
    console.error("unfollowUser error:", err);
    throw err;
  }
}

/**
 * Check if currentUid is following targetUid
 * returns boolean
 */
export async function isFollowing(currentUid: string, targetUid: string) {
  if (!currentUid || !targetUid) return false;
  try {
    const snap = await getDoc(doc(db, "following", currentUid));
    return snap.exists() && !!snap.data()?.[targetUid];
  } catch (err) {
    console.error("isFollowing error:", err);
    return false;
  }
}

/**
 * Get followers count for a user
 */
export async function getFollowersCount(userId: string) {
  if (!userId) return 0;
  try {
    const snap = await getDoc(doc(db, "followers", userId));
    if (!snap.exists()) return 0;
    const data = snap.data() || {};
    return Object.keys(data).length;
  } catch (err) {
    console.error("getFollowersCount error:", err);
    return 0;
  }
}
