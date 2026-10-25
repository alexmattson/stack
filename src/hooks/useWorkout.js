import { useMemo, useState, useCallback, useEffect } from "react";
import { suggest } from "../lib/progression.js";
import { alternatives, rowFor } from "../lib/program.js";
import { warmups } from "../lib/warmup.js";
import { planFromStore, BODYWEIGHT_EX, LIB_BY_KEY } from "../lib/program.js";
import { COMPOUND } from "../lib/program.js";
import { REST } from "../lib/progression.js";
import { cycleInfo, deloadSets } from "../lib/cycle.js";
import { detectPR } from "../lib/prs.js";

// State for one workout (a date + a program day): the frozen exercise list, saved sets, the cursor, drafts.
export function useWorkout(data, date, dayIdx){
  const { sessions, program, api } = data;
  const id = `${date}_${program[dayIdx]?.key || "d1"}`;
  const session = useMemo(() => sessions.find(s => s.id === id), [sessions, id]);
  const cyc = useMemo(() => cycleInfo(sessions, data.prog.cycleStart, date), [sessions, data.prog.cycleStart, date]);
  const isDeload = session ? !!session.deload : cyc.deload;
  const day = useMemo(() => {
    const live0 = program[dayIdx] || program[0];
    const live = (!session && cyc.deload) ? {...live0, ex: live0.ex.map(e => [e[0], e[1], deloadSets(e[2]), e[3], e[4], e[5], e[6]])} : live0;
    if (!session) return live;
    if (Array.isArray(session.plan) && session.plan.length) return {key:live.key, name:session.planName || live.name, focus:session.planFocus || live.focus, ex:planFromStore(session.plan)};
    // legacy session without a stored plan: rebuild from what was logged
    const keys = Object.keys(session.sets).filter(k => session.sets[k].some(x => x.r));
    const ex = keys.map(k => { const d = LIB_BY_KEY[k]; const n = Math.max(d ? 3 : 1, session.sets[k].length); return d ? [d.key, d.name, n, d.bw ? "max" : "8–12", d.start, d.q, d.g] : [k, k, n, "8–12", 0, k, "https://exrx.net/Lists/Directory"]; });
    return ex.length ? {key:live.key, name:live.name, focus:live.focus, ex} : live;
  }, [session, program, dayIdx, cyc.deload]);
  const total = day.ex.reduce((a, e) => a + e[2], 0);
  const savedSet = useCallback((key, i) => session && session.sets[key] && session.sets[key][i] && session.sets[key][i].r ? session.sets[key][i] : null, [session]);
  const doneCount = session ? Object.values(session.sets).reduce((a, arr) => a + arr.filter(x => x.r).length, 0) : 0;
  const suggestions = useMemo(() => Object.fromEntries(day.ex.map(e => [e[0], suggest(e, sessions, data.gear, {deload:isDeload, readiness: date === data.today ? data.readiness.level : "unknown"})])), [day, sessions, data.gear, isDeload, date, data.today, data.readiness.level]);
  // Warm-up steps done this visit (they aren't logged).
  const [doneWu, setDoneWu] = useState(() => new Set());
  const markWu = p => setDoneWu(s => new Set([...s, `${p.ei}-${p.wu}`]));
  // The order everything is done in: all warm-up steps first (for compounds whose first set isn't logged), then working sets.
  // Paired lifts (supersets) alternate set by set: A1, B1, A2, B2…
  const sequence = useMemo(() => { const seq = []; const done = new Set();
    const wuFor = ei => { const e = day.ex[ei]; if (savedSet(e[0], 0)) return []; return warmups(e[0], suggestions[e[0]].w, data.gear).map((s, k) => ({ei, si:0, wu:k, w:s.w, r:s.r})); };
    day.ex.forEach((e, ei) => wuFor(ei).forEach(x => seq.push(x)));   // every warm-up first, in lift order
    day.ex.forEach((e, ei) => { if (done.has(ei)) return; const partner = e[7] ? day.ex.findIndex((x, j) => j > ei && x[7] === e[7]) : -1;
      if (partner >= 0) { const n = Math.max(e[2], day.ex[partner][2]); for (let si = 0; si < n; si++) { if (si < e[2]) seq.push({ei, si}); if (si < day.ex[partner][2]) seq.push({ei:partner, si}); } done.add(ei); done.add(partner); }
      else { for (let si = 0; si < e[2]; si++) seq.push({ei, si}); done.add(ei); } });
    return seq; }, [day, suggestions, data.gear, savedSet]);
  const same = (a, b) => a.ei === b.ei && a.si === b.si && (a.wu ?? -1) === (b.wu ?? -1);
  const seqIndex = p => sequence.findIndex(x => same(x, p));
  const isOpen = p => p.wu !== undefined ? !doneWu.has(`${p.ei}-${p.wu}`) : !savedSet(day.ex[p.ei][0], p.si);
  const nextOpen = useCallback(from => { const start = from ? seqIndex(from) + 1 : 0; for (let i = start; i < sequence.length; i++) { const p = sequence[i]; if (isOpen(p)) return p; } return null; }, [day, savedSet, sequence, doneWu]); // eslint-disable-line
  const workingIndex = p => sequence.slice(0, seqIndex(p) + 1).filter(x => x.wu === undefined).length;
  const prevInSeq = p => sequence[Math.max(0, seqIndex(p) - 1)] || p;
  const nextInSeq = p => sequence[Math.min(sequence.length - 1, seqIndex(p) + 1)] || p;
  const isLastInSeq = p => seqIndex(p) >= sequence.length - 1;
  const [ptr, setPtr] = useState({ei:0, si:0});
  useEffect(() => { setPtr(nextOpen() || {ei:0, si:0}); }, [id]); // eslint-disable-line
  const flatIndex = p => { let n = 0; for (let ei = 0; ei < p.ei; ei++) n += day.ex[ei][2]; return n + p.si; };
  // Inside a superset the rest between the pair is short; the full rest comes after the second lift.
  const restFor = (key, isLast, from, nxt) => { if (from && nxt && day.ex[from.ei][7] && day.ex[from.ei][7] === day.ex[nxt.ei][7] && from.ei !== nxt.ei) return REST.superset; return isLast ? REST.last : COMPOUND.has(key) ? REST.compound : REST.iso; };
  const swap = (oldKey, alt) => api.swapExercise(id, date, dayIdx, oldKey, rowFor(alt, data.gear, data.prog));
  const alts = key => alternatives(key, data.gear, day.ex.map(e => e[0]));
  const save = async (key, i, w, r, e) => { const pr = detectPR(data.prs, key, w, r); await api.saveSet(id, date, dayIdx, key, i, w, r, e); return pr; };
  const finish = (pending, note) => api.finish(id, date, dayIdx, pending, note);
  return { id, date, session, day, total, doneCount, savedSet, nextOpen, ptr, setPtr, flatIndex, suggestions, restFor, save, finish, isBW: key => BODYWEIGHT_EX.has(key), isDeload, cycle:cyc, sequence, seqIndex, prevInSeq, nextInSeq, isLastInSeq, swap, alts, markWu, isOpen, workingIndex };
}
