import React, { useEffect, useRef, useState } from "react";

// Pull down from the top of any page to reload. Installed PWAs don't get the browser's own gesture.
export function PullToRefresh({ threshold = 90 }){
  const [pull, setPull] = useState(0); const [state, setState] = useState("idle"); // idle | pulling | ready | loading
  const startY = useRef(null); const active = useRef(false);
  useEffect(() => {
    const canPull = () => (window.scrollY || document.documentElement.scrollTop) <= 0 && !document.querySelector("#focus, #login, #onboard");
    const onStart = e => { if (!canPull()) return; startY.current = e.touches[0].clientY; active.current = true; };
    const onMove = e => {
      if (!active.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); setState("idle"); return; }
      if (!canPull()) { active.current = false; setPull(0); setState("idle"); return; }
      const eased = Math.min(140, dy * 0.55);
      setPull(eased); setState(eased >= threshold * 0.55 ? "ready" : "pulling");
      if (dy > 10 && e.cancelable) e.preventDefault();
    };
    const onEnd = () => {
      if (!active.current) return; active.current = false; startY.current = null;
      setState(s => { if (s === "ready") { setPull(56); setTimeout(() => window.location.reload(), 350); return "loading"; } setPull(0); return "idle"; });
    };
    document.addEventListener("touchstart", onStart, {passive:true});
    document.addEventListener("touchmove", onMove, {passive:false});
    document.addEventListener("touchend", onEnd); document.addEventListener("touchcancel", onEnd);
    return () => { document.removeEventListener("touchstart", onStart); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd); document.removeEventListener("touchcancel", onEnd); };
  }, [threshold]);
  if (state === "idle" && pull === 0) return null;
  return (
    <div className={`ptr ${state}`} style={{height:pull}} aria-hidden="true">
      <div className="ptr-in"><i className="spin" style={{animationPlayState: state === "loading" ? "running" : "paused", transform:`rotate(${pull * 3}deg)`}}/><span>{state === "ready" ? "Release to refresh" : state === "loading" ? "Refreshing…" : "Pull to refresh"}</span></div>
    </div>
  );
}
