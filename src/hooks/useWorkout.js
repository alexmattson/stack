import { useMemo, useState, useCallback, useEffect } from "react";
import { suggest } from "../lib/progression.js";
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
  const nextOpen = useCallback(from => { let started = !from; for (let ei = 0; ei < day.ex.length; ei++) for (let si = 0; si < day.ex[ei][2]; si++) { if (!started) { if (ei === from.ei && si === from.si) started = true; continue; } if (!savedSet(day.ex[ei][0], si)) return {ei, si}; } return null; }, [day, savedSet]);
  const [ptr, setPtr] = useState({ei:0, si:0});
  useEffect(() => { setPtr(nextOpen() || {ei:0, si:0}); }, [id]); // eslint-disable-line
  const flatIndex = p => { let n = 0; for (let ei = 0; ei < p.ei; ei++) n += day.ex[ei][2]; return n + p.si; };
  const ctx = {deload:isDeload, readiness: date === data.today ? data.readiness.level : "unknown"};
  const suggestions = useMemo(() => Object.fromEntries(day.ex.map(e => [e[0], suggest(e, sessions, data.gear, ctx)])), [day, sessions, data.gear, isDeload, ctx.readiness]); // eslint-disable-line
  const restFor = (key, isLast) => isLast ? REST.last : COMPOUND.has(key) ? REST.compound : REST.iso;
  const save = async (key, i, w, r, e) => { const pr = detectPR(data.prs, key, w, r); await api.saveSet(id, date, dayIdx, key, i, w, r, e); return pr; };
  const finish = (pending, note) => api.finish(id, date, dayIdx, pending, note);
  return { id, session, day, total, doneCount, savedSet, nextOpen, ptr, setPtr, flatIndex, suggestions, restFor, save, finish, isBW: key => BODYWEIGHT_EX.has(key), isDeload, cycle:cyc };
}
