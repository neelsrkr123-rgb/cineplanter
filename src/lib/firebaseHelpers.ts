import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "#/lib/firebase";

// Follow user
export const followUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) return;
  await updateDoc(doc(db, "users", currentUserId), {
    following: arrayUnion(targetUserId),
  });
  await updateDoc(doc(db, "users", targetUserId), {
    followers: arrayUnion(currentUserId),
  });
};

// Unfollow user
export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) return;
  await updateDoc(doc(db, "users", currentUserId), {
    following: arrayRemove(targetUserId),
  });
  await updateDoc(doc(db, "users", targetUserId), {
    followers: arrayRemove(currentUserId),
  });
};
