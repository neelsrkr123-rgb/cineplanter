// context/AuthContext.tsx
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
  socials: {
    instagram: string;
    youtube: string;
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

  // Refresh user data from Firestore
  const refreshUser = async () => {
    if (!user?.id) return;
    
    try {
      const userRef = doc(db, "users", user.id);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUser({ id: snap.id, ...snap.data() } as UserData);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Load user data from Firestore
  const loadUserData = async (firebaseUser: FirebaseUser): Promise<UserData | null> => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      let snap = await getDoc(userRef);

      if (!snap.exists()) {
        // Create default profile for new user
        const newUserData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
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
      
      // Also update online status
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

    // Update online status when tab closes
    const handleBeforeUnload = () => {
      if (user?.id) {
        const userRef = doc(db, "users", user.id);
        updateDoc(userRef, { online: false }).catch(console.error);
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      // Set offline when component unmounts
      if (user?.id) {
        const userRef = doc(db, "users", user.id);
        updateDoc(userRef, { online: false }).catch(console.error);
      }
    };
  }, []);

  // Update user data in Firestore
  const updateUserData = async (data: Partial<UserData>) => {
    if (!user?.id) throw new Error("Not authenticated");
    
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, data);
      setUser((prev) => prev ? { ...prev, ...data } : null);
      return true;
    } catch (error) {
      console.error("Error updating user data:", error);
      return false;
    }
  };

  // Update avatar
  const updateAvatar = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error("Not authenticated");
    
    try {
      const storageRef = ref(storage, `avatars/${user.id}/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      
      const userRef = doc(db, "users", user.id);
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
      await signInWithPopup(auth, provider);
      return true;
    } catch (err) {
      console.error("Google login error:", err);
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

  // Register new user
  const register = async ({ name, email, password }: { name: string; email: string; password: string; }): Promise<boolean> => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
      
      const newUserData = {
        id: res.user.uid,
        name: name,
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
    // Set offline status before logout
    if (user?.id) {
      const userRef = doc(db, "users", user.id);
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