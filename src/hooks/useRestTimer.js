import { useEffect, useRef, useState, useCallback } from "react";

// Countdown that survives re-renders; `done` flips at zero and stays until stopped.
export function useRestTimer(onDone, onTick){
  const [left, setLeft] = useState(0);
  const [total, setTotal] = useState(1);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const end = useRef(0); const tick = useRef(null); const cb = useRef(onDone); cb.current = onDone; const tcb = useRef(onTick); tcb.current = onTick; const lastSec = useRef(-1);
  const stop = useCallback(() => { clearInterval(tick.current); tick.current = null; setActive(false); setDone(false); }, []);
  const run = useCallback(() => {
    clearInterval(tick.current);
    tick.current = setInterval(() => {
      const l = Math.max(0, Math.ceil((end.current - Date.now()) / 1000));
      if (l !== lastSec.current) { lastSec.current = l; if (l > 0 && l <= 10 && tcb.current) tcb.current(l); }
      setLeft(l);
      if (l === 0) { clearInterval(tick.current); tick.current = null; setDone(true); cb.current && cb.current(); }
    }, 250);
  }, []);
  const start = useCallback(seconds => { lastSec.current = -1; end.current = Date.now() + seconds * 1000; setTotal(seconds); setLeft(seconds); setActive(true); setDone(false); run(); }, [run]);
  const add = useCallback(seconds => { if (!tick.current) { end.current = Date.now(); setDone(false); } end.current += seconds * 1000; setTotal(t => t + seconds); setLeft(Math.max(0, Math.round((end.current - Date.now()) / 1000))); setActive(true); run(); }, [run]);
  useEffect(() => () => clearInterval(tick.current), []);
  const text = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  return { left, total, active, done, text, frac: Math.max(0, Math.min(1, left / total)), start, add, stop };
}
