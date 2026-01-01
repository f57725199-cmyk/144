// ================= IMPORTS =================
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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

import {
  getAuth,
  onAuthStateChanged
} from "firebase/auth";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyC7N3IOa7GRETNRBo8P-QKVFzg2bLqoEco",
  authDomain: "students-app-deae5.firebaseapp.com",
  databaseURL: "https://students-app-deae5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "students-app-deae5",
  storageBucket: "students-app-deae5.firebasestorage.app",
  messagingSenderId: "128267767708",
  appId: "1:128267767708:web:08ed73b1563b2f3eb60259"
};

// ================= INIT =================
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

// ================= AUTH =================
export const subscribeToAuth = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// ===================================================
// 🔥 USER SAVE (FIXED – NO undefined, NO PASSWORD)
// ===================================================
export const saveUserToLive = async (userData: any) => {
  try {
    const authUser = auth.currentUser;
    if (!authUser) return;

    const uid = authUser.uid;

    const safeUser = {
      id: uid,
      name: userData.name || "",
      email: userData.email || authUser.email || "",
      mobile: userData.mobile || "",
      board: userData.board || "",
      classLevel: userData.classLevel || "",
      role: userData.role || "STUDENT",
      credits: userData.credits ?? 0,
      isPremium: userData.isPremium ?? false,
      subscriptionTier: userData.subscriptionTier || "FREE",
      createdAt: new Date().toISOString(),
      lastLoginDate: new Date().toISOString(),
      streak: userData.streak ?? 0,
      progress: userData.progress || {}
    };

    // RTDB
    await set(ref(rtdb, `users/${uid}`), safeUser);

    // Firestore
    await setDoc(doc(db, "users", uid), safeUser, { merge: true });

  } catch (err) {
    console.error("❌ saveUserToLive failed:", err);
  }
};

// ===================================================
// 👥 ADMIN / USER LIST (FIXED)
// ===================================================
export const subscribeToUsers = (callback: (users: any[]) => void) => {
  const usersCol = collection(db, "users");

  return onSnapshot(usersCol, (snap) => {
    const list = snap.docs
      .map(d => d.data())
      .filter(u => u && u.id); // 🔥 no undefined
    callback(list);
  });
};

// ===================================================
// 🔍 GET USER DATA (SMART READ)
// ===================================================
export const getUserData = async (uid: string) => {
  try {
    const rSnap = await get(ref(rtdb, `users/${uid}`));
    if (rSnap.exists()) return rSnap.val();

    const fSnap = await getDoc(doc(db, "users", uid));
    if (fSnap.exists()) return fSnap.data();

    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// ===================================================
// 📧 GET USER BY EMAIL
// ===================================================
export const getUserByEmail = async (email: string) => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].data();
  return null;
};

// ===================================================
// 📚 CONTENT DATA (STUDENT FEATURES)
// ===================================================
export const saveChapterData = async (key: string, data: any) => {
  await set(ref(rtdb, `content_data/${key}`), data);
  await setDoc(doc(db, "content_data", key), data);
};

export const getChapterData = async (key: string) => {
  const r = await get(ref(rtdb, `content_data/${key}`));
  if (r.exists()) return r.val();

  const f = await getDoc(doc(db, "content_data", key));
  if (f.exists()) return f.data();

  return null;
};

export const subscribeToChapterData = (key: string, cb: (d:any)=>void) => {
  return onValue(ref(rtdb, `content_data/${key}`), snap => {
    if (snap.exists()) cb(snap.val());
  });
};

// ===================================================
// 📝 TEST RESULTS
// ===================================================
export const saveTestResult = async (uid: string, attempt: any) => {
  const id = `${attempt.testId}_${Date.now()}`;
  await setDoc(doc(db, "users", uid, "test_results", id), attempt);
};

// ===================================================
// ⏱️ USER ACTIVITY
// ===================================================
export const updateUserStatus = async (uid: string) => {
  await update(ref(rtdb, `users/${uid}`), {
    lastActiveTime: new Date().toISOString()
  });
};
