// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCNQsu9FmgVUKcpOe9frK2EJa-Qf3zGi-w",
  authDomain: "cine-planter-2.firebaseapp.com",
  projectId: "cine-planter-2",
  storageBucket: "cine-planter-2.appspot.com",
  messagingSenderId: "409457911289",
  appId: "1:409457911289:web:a06b7a8b1488aa5baa0928"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
