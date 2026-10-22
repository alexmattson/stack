import { useEffect, useState, useCallback } from "react";
import { auth, waitForUser, watchUser, anonSignIn, redirectResult, googleSignIn, signOut, friendlyAuthError } from "../lib/firebase.js";

// Auth state machine: "loading" → "login" (no Google user) → "ready". Sign-out returns to "login".
export function useAuth(){
  const [state, setState] = useState("loading");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    (async () => {
      await redirectResult();
      const u = await waitForUser();
      if (!alive) return;
      setUser(u);
      setState(!u || u.isAnonymous ? "login" : "ready");
    })();
    const off = watchUser(u => { setUser(u); if (!u) setState("login"); });
    return () => { alive = false; off(); };
  }, []);
  const skip = useCallback(async () => { try { const u = auth.currentUser || await anonSignIn(); setUser(u); setState("ready"); } catch (e) { setError(friendlyAuthError(e)); } }, []);
  const google = useCallback(async () => { setError(""); try { await googleSignIn(); const u = auth.currentUser; if (u && !u.isAnonymous) { setUser(u); setState("ready"); } } catch (e) { setError(friendlyAuthError(e)); } }, []);
  const logout = useCallback(async () => { setError(""); try { await signOut(); } catch (e) { setError(friendlyAuthError(e)); } setUser(null); setState("login"); }, []);
  return { state, user, error, skip, google, logout, openLogin: () => setState("manage"), closeLogin: () => setState("ready") };
}
