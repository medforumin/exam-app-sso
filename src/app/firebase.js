import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  linkWithCredential
} from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { ENABLE_FIREBASE, firebaseConfig } from "./config";
import { isNativePlatform } from "./platform/native";

export let db = null;
export let auth = null;
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export function initFirebase() {
  if (!ENABLE_FIREBASE) return;
  if (db !== null && auth !== null) return;

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, "default");
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

export async function signInWithGoogle() {
  if (!ENABLE_FIREBASE || !auth) {
    throw new Error("Firebase is not enabled or initialized.");
  }

  if (isNativePlatform()) {
    // Native Android platform: use @capacitor-firebase/authentication
    const result = await FirebaseAuthentication.signInWithGoogle({
      webClientId: "960945553986-ab6954jb1t93b825vanqmjr0ibsdr122.apps.googleusercontent.com"
    });
    
    const idToken = result.credential?.idToken;
    const accessToken = result.credential?.accessToken;

    if (idToken) {
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      return await signInWithCredential(auth, credential);
    } else if (result.user) {
      return { user: result.user };
    } else {
      throw new Error("Failed to obtain Google credentials on native device.");
    }
  } else {
    // Web platform: use Firebase Web SDK popup
    return await signInWithPopup(auth, googleProvider);
  }
}

// Helper exports (re-export firebase helpers so consumers can stay in one place)
export {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  linkWithCredential,
};

// Initialize eagerly where this module is imported
initFirebase();

