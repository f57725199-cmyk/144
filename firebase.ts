// ================================
// FIREBASE SETUP – FINAL FIXED
// ================================

import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  getDocs,
  query,
  where
} from "firebase/firestore";

import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update
} from "firebase/database";

// ================================
// FIREBASE CONFIG
// ================================

const firebaseConfig = {
  apiKey: "AIzaSyC7N3IOa7GRETNRBo8P-QKVFzg2bLqoEco",
  authDomain: "students-app-deae5.firebaseapp.com",
  databaseURL: "https://students-app-deae5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "students-app-deae5",
  storageBucket: "students-app-deae5.appspot.com",
  messagingSenderId: "128267767708",
  appId: "1:128267767708:web:08ed73b1563b2f3eb60259"
};

// ================================
// INIT (SAFE FOR VERCEL)
// ================================

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// ================================
// AUTH LISTENER
// ================================

export const subscribeToAuth = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ================================
// USER SAVE (RTDB + FIRESTORE)
// ================================

export const saveUser = async (user: any) => {
  if (!user?.id) return;

  try {
    // RTDB
    await set(ref(rtdb, `users/${user.id}`), user);

    // Firestore
    await setDoc(doc(db, "users", user.id), user, { merge: true });

    console.log("✅ User saved in RTDB + Firestore");
  } catch (err) {
    console.error("❌ saveUser error:", err);
  }
};

// ================================
// GET USER
// ================================

export const getUser = async (uid: string) => {
  try {
    const rtdbSnap = await get(ref(rtdb, `users/${uid}`));
    if (rtdbSnap.exists()) return rtdbSnap.val();

    const fsSnap = await getDoc(doc(db, "users", uid));
    if (fsSnap.exists()) return fsSnap.data();

    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// ================================
// ALL USERS (ADMIN)
// ================================

export const subscribeUsers = (callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, "users"), (snap) => {
    const list = snap.docs.map(d => d.data());
    callback(list);
  });
};

// ================================
// FIND USER BY EMAIL
// ================================

export const getUserByEmail = async (email: string) => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data();
};

// ================================
// SYSTEM SETTINGS
// ================================

export const saveSystemSettings = async (data: any) => {
  await set(ref(rtdb, "system_settings"), data);
  await setDoc(doc(db, "config", "system_settings"), data);
};

export const subscribeSystemSettings = (callback: (d: any) => void) => {
  return onSnapshot(doc(db, "config", "system_settings"), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
};

// ================================
// CONTENT DATA
// ================================

export const saveContent = async (key: string, data: any) => {
  await set(ref(rtdb, `content/${key}`), data);
  await setDoc(doc(db, "content", key), data);
};

export const getContent = async (key: string) => {
  const snap = await get(ref(rtdb, `content/${key}`));
  if (snap.exists()) return snap.val();

  const fs = await getDoc(doc(db, "content", key));
  return fs.exists() ? fs.data() : null;
};
