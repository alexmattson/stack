// In-memory stand-in for firebase.js, used only by the e2e harness (VITE_MOCK=1).
const store = {}; const docWatchers = {}; const colWatchers = {};
let user = null; const authCbs = new Set();
const emitAuth = () => authCbs.forEach(cb => cb(user));
const notify = p => { (docWatchers[p] || []).forEach(cb => cb(store[p])); const c = p.split("/").slice(0, -1).join("/"); (colWatchers[c] || []).forEach(cb => cb(Object.keys(store).filter(k => k.startsWith(c + "/") && k.split("/").length === c.split("/").length + 1).map(k => ({id:k.split("/").pop(), ...store[k]})))); };
export const auth = { get currentUser(){ return user; } };
export const store_ = store;
export const waitForUser = () => new Promise(r => setTimeout(() => r(user), 50));
export const watchUser = cb => { authCbs.add(cb); return () => authCbs.delete(cb); };
export const anonSignIn = async () => { user = {uid:"u1", isAnonymous:true}; emitAuth(); return user; };
export const redirectResult = async () => null;
export const googleSignIn = async () => { user = {uid:"u1", isAnonymous:false, displayName:"Alex", email:"a@b.c"}; emitAuth(); };
export const signOut = async () => { user = null; emitAuth(); };
export const friendlyAuthError = e => (e && e.message) || String(e);
export function userDB(uid){
  const ref = p => `users/${uid}/${p}`;
  const validate = (d, path) => { if (Array.isArray(d)) { for (const x of d) { if (Array.isArray(x)) throw new Error("nested array at " + path); validate(x, path + "[]"); } } else if (d && typeof d === "object") for (const k in d) validate(d[k], path + "." + k); };
  return {
    set: async (p, data) => { validate(data, p); store[ref(p)] = JSON.parse(JSON.stringify(data)); notify(ref(p)); },
    del: async p => { delete store[ref(p)]; notify(ref(p)); },
    watchDoc: (p, cb) => { (docWatchers[ref(p)] = docWatchers[ref(p)] || []).push(cb); cb(store[ref(p)]); return () => {}; },
    watchCol: (c, cb) => { const k = `users/${uid}/${c}`; (colWatchers[k] = colWatchers[k] || []).push(cb); cb(Object.keys(store).filter(x => x.startsWith(k + "/")).map(x => ({id:x.split("/").pop(), ...store[x]}))); return () => {}; },
    batchSet: async entries => { for (const [p, d] of entries) { validate(d, p); store[ref(p)] = JSON.parse(JSON.stringify(d)); notify(ref(p)); } },
  };
}
export const friendlyDbError = e => "Couldn't save (" + ((e && e.message) || "unknown") + ").";
if (typeof window !== "undefined") window.__store = store;
