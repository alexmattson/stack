import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, GoogleAuthProvider, linkWithPopup, signInWithPopup, signInWithCredential, signInWithRedirect, linkWithRedirect, getRedirectResult, signOut as fbSignOut } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, onSnapshot, setDoc, deleteDoc, writeBatch } from "firebase/firestore";

const config = {
  apiKey: "AIzaSyDRjTL6n2s_N5n6UYvKrO1r0FxULc-v4VQ",
  authDomain: "stack-lift.firebaseapp.com",
  projectId: "stack-lift",
  storageBucket: "stack-lift.firebasestorage.app",
  messagingSenderId: "225363069261",
  appId: "1:225363069261:web:15a50ca7793bda92e40f04"
};
const app = initializeApp(config);
export const auth = getAuth(app);
let fs;
try { fs = initializeFirestore(app, {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})}); }
catch (e) { fs = initializeFirestore(app, {}); }
export const store = fs;

export const waitForUser = () => new Promise(res => { const off = onAuthStateChanged(auth, u => { off(); res(u); }); });
export const watchUser = cb => onAuthStateChanged(auth, cb);
export const anonSignIn = () => signInAnonymously(auth).then(r => r.user);
export const redirectResult = () => getRedirectResult(auth).catch(() => null);
export async function googleSignIn(){
  const provider = new GoogleAuthProvider();
  const cur = auth.currentUser;
  try { if (cur && cur.isAnonymous) await linkWithPopup(cur, provider); else await signInWithPopup(auth, provider); }
  catch (e) {
    if (e.code === "auth/credential-already-in-use") { const cred = GoogleAuthProvider.credentialFromError(e); if (cred) { await signInWithCredential(auth, cred); return; } }
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") { if (cur && cur.isAnonymous) await linkWithRedirect(cur, provider); else await signInWithRedirect(auth, provider); return; }
    throw e;
  }
}
export async function signOut(){
  const gone = new Promise(res => { const off = onAuthStateChanged(auth, u => { if (!u) { off(); res(); } }); });
  await fbSignOut(auth);
  await Promise.race([gone, new Promise(r => setTimeout(r, 3000))]);
}
export function friendlyAuthError(e){
  const c = e && e.code;
  if (c === "auth/operation-not-allowed") return "Google sign-in isn't enabled yet. In Firebase: Authentication → Sign-in method → Google → Enable.";
  if (c === "auth/unauthorized-domain") return "Add this site's domain under Firebase → Authentication → Settings → Authorized domains.";
  return (e && e.message) || String(e);
}

// Per-user document API. Paths are relative to users/{uid}/.
export function userDB(uid){
  const ref = p => doc(fs, `users/${uid}/${p}`);
  const col = c => collection(fs, `users/${uid}/${c}`);
  return {
    set: (p, data) => setDoc(ref(p), data),
    del: p => deleteDoc(ref(p)),
    watchDoc: (p, cb, err) => onSnapshot(ref(p), snap => cb(snap.data()), err),
    watchCol: (c, cb, err) => onSnapshot(col(c), snap => cb(snap.docs.map(d => ({id:d.id, ...d.data()}))), err),
    batchSet: async entries => { const b = writeBatch(fs); entries.forEach(([p, data]) => b.set(ref(p), data)); await b.commit(); },
  };
}
export function friendlyDbError(e){
  const c = e && e.code;
  if (c === "permission-denied") return "You can view but not write to this log.";
  if (c === "resource-exhausted") return "Storage is full. Delete old sessions from the Progress tab.";
  return "Couldn't save (" + (c || (e && e.message) || "unknown error") + "). Try again.";
}
