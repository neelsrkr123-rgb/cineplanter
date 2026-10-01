// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, storage } from "#/lib/firebase";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Types
interface UserData {
  id: string;
  uid?: string;
  name: string;
  username?: string;
  title?: string;
  email: string;
  avatar: string;
  bio: string;
  tagline: string;
  phone: string;
  location: string;
  profileType: "normal" | "freelancer";
  role: string;
  experience: string;
  hourlyRate: string;
  services: string;
  skills: string[];
  followers: string[];
  following: string[];

  // ✅ All social fields optional
  socials: {
    instagram?: string;
    youtube?: string;
    twitter?: string;
    facebook?: string;
  };

  joinedInterests?: string[];
  savedPosts?: string[];
  notInterestedPosts?: string[];
  blockedUsers?: string[];
  mutedUsers?: string[];
  online?: boolean;
  lastSeen?: any;
  createdAt: number;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  updateUserData: (data: Partial<UserData>) => Promise<boolean>;
  updateAvatar: (file: File) => Promise<string>;
  loginWithGoogle: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FIXED: refreshUser uses auth.currentUser (avoids stale closure)
  const refreshUser = async () => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;

    try {
      const userRef = doc(db, "users", currentUid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUser({ id: snap.id, ...snap.data() } as UserData);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Load user data
  const loadUserData = async (firebaseUser: FirebaseUser): Promise<UserData | null> => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      let snap = await getDoc(userRef);

      if (!snap.exists()) {
        const newUserData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "",
          title: "",
          email: firebaseUser.email || "",
          avatar: firebaseUser.photoURL || "/default-avatar.png",
          bio: "",
          tagline: "",
          phone: "",
          location: "",
          profileType: "normal" as const,
          role: "",
          experience: "",
          hourlyRate: "",
          services: "",
          skills: [],
          followers: [],
          following: [],
          socials: {
            instagram: "",
            youtube: "",
            twitter: "",
            facebook: "",
          },
          joinedInterests: [],
          savedPosts: [],
          notInterestedPosts: [],
          blockedUsers: [],
          mutedUsers: [],
          online: true,
          lastSeen: serverTimestamp(),
          createdAt: Date.now(),
        };

        await setDoc(userRef, newUserData);
        snap = await getDoc(userRef);
      }

      // Update online status
      await updateDoc(userRef, { online: true, lastSeen: serverTimestamp() });

      return { id: snap.id, ...snap.data() } as UserData;
    } catch (error) {
      console.error("Error loading user data:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);

      if (firebaseUser) {
        const userData = await loadUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    // ✅ FIXED: use auth.currentUser inside handler
    const handleBeforeUnload = () => {
      const currentUid = auth.currentUser?.uid;
      if (currentUid) {
        updateDoc(doc(db, "users", currentUid), { online: false }).catch(console.error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleBeforeUnload);

      const currentUid = auth.currentUser?.uid;
      if (currentUid) {
        updateDoc(doc(db, "users", currentUid), { online: false }).catch(console.error);
      }
    };
  }, []);

  // ✅ FIXED: updateUserData uses auth.currentUser
  const updateUserData = async (data: Partial<UserData>) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) throw new Error("Not authenticated");

    try {
      const userRef = doc(db, "users", currentUid);
      await updateDoc(userRef, data);
      setUser((prev) => prev ? { ...prev, ...data } : null);
      return true;
    } catch (error) {
      console.error("Error updating user data:", error);
      return false;
    }
  };

  // ✅ FIXED: updateAvatar uses auth.currentUser
  const updateAvatar = async (file: File): Promise<string> => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) throw new Error("Not authenticated");

    try {
      const storageRef = ref(storage, `avatars/${currentUid}/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);

      const userRef = doc(db, "users", currentUid);
      await updateDoc(userRef, { avatar: url });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url });
      }

      setUser((prev) => prev ? { ...prev, avatar: url } : null);
      return url;
    } catch (err) {
      console.error("Upload avatar error:", err);
      throw err;
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<boolean> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Google login successful:", result.user);
      return true;
    } catch (err: any) {
      console.error("Google login error:", err);

      if (err.code === 'auth/popup-closed-by-user') {
        console.log("Popup closed by user");
      } else if (err.code === 'auth/cancelled-popup-request') {
        console.log("Popup request cancelled");
      } else if (err.code === 'auth/unauthorized-domain') {
        alert("Please add this domain to Firebase authorized domains");
      }
      return false;
    }
  };

  // Login with email/password
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  // Register
  const register = async ({ name, email, password }: { name: string; email: string; password: string }): Promise<boolean> => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      const newUserData = {
        id: res.user.uid,
        name: name,
        username: name,
        title: "",
        email: email,
        avatar: "/default-avatar.png",
        bio: "",
        tagline: "",
        phone: "",
        location: "",
        profileType: "normal" as const,
        role: "",
        experience: "",
        hourlyRate: "",
        services: "",
        skills: [],
        followers: [],
        following: [],
        socials: {
          instagram: "",
          youtube: "",
          twitter: "",
          facebook: "",
        },
        joinedInterests: [],
        savedPosts: [],
        notInterestedPosts: [],
        blockedUsers: [],
        mutedUsers: [],
        online: true,
        lastSeen: serverTimestamp(),
        createdAt: Date.now(),
      };

      const userRef = doc(db, "users", res.user.uid);
      await setDoc(userRef, newUserData);

      return true;
    } catch (err) {
      console.error("Registration error:", err);
      return false;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      const userRef = doc(db, "users", currentUid);
      await updateDoc(userRef, { online: false }).catch(console.error);
    }
    await signOut(auth);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    updateUserData,
    updateAvatar,
    loginWithGoogle,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};