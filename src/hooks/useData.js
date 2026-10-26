import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { userDB, friendlyDbError } from "../lib/firebase.js";
import { buildProgram, PROGRAM_DEFAULTS, GEAR_DEFAULTS, planToStore, normalizeGear } from "../lib/program.js";
import { deloadSets } from "../lib/cycle.js";
import { today } from "../lib/dates.js";
import { cycleInfo } from "../lib/cycle.js";
import { prTable } from "../lib/prs.js";
import { recovery, readinessScore, readinessLevel } from "../lib/volume.js";

// Everything the app knows about the signed-in user, kept live from Firestore.
export function useData(uid){
  const db = useMemo(() => uid ? userDB(uid) : null, [uid]);
  const [sessions, setSessions] = useState([]);
  const [bodylog, setBodylog] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [notes, setNotes] = useState({});
  const [gyms, setGyms] = useState({active:"home", list:[{id:"home", name:"Home"}]});
  const [gear, setGear] = useState(GEAR_DEFAULTS);
  const [prog, setProg] = useState(PROGRAM_DEFAULTS);
  const [trainingDays, setTrainingDays] = useState([1, 2, 4, 5]);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState({});
  const [settingsSeen, setSettingsSeen] = useState({program:null, equipment:null, schedule:null});
  const [error, setError] = useState("");
  useEffect(() => {
    if (!db) return;
    setLoaded(false);
    const offs = [
      db.watchSelf(d => setProfile(d || {}), () => {}),
      db.watchCol("sessions", s => { setSessions(s); setLoaded(true); }, e => setError("Lost connection to your log: " + (e.message || ""))),
      db.watchCol("bodylog", setBodylog, () => {}),
      db.watchCol("checkins", setCheckins, () => {}),
      db.watchDoc("settings/exnotes", d => setNotes(d || {}), () => {}),
      db.watchDoc("settings/gyms", d => { if (d && Array.isArray(d.list) && d.list.length) setGyms({active:d.active || d.list[0].id, list:d.list}); }, () => {}),
      db.watchDoc("settings/equipment", d => { setSettingsSeen(s => ({...s, equipment:!!d})); if (d && Array.isArray(d.dumbbells)) setGear(normalizeGear(d)); }, () => setSettingsSeen(s => ({...s, equipment:false}))),
      db.watchDoc("settings/program", d => { setSettingsSeen(s => ({...s, program:!!d})); if (d && Array.isArray(d.focus)) setProg({...PROGRAM_DEFAULTS, ...d}); }, () => setSettingsSeen(s => ({...s, program:false}))),
      db.watchDoc("settings/schedule", d => { setSettingsSeen(s => ({...s, schedule:!!d})); if (d && Array.isArray(d.trainingDays)) setTrainingDays(d.trainingDays.slice()); }, () => setSettingsSeen(s => ({...s, schedule:false}))),
    ];
    return () => offs.forEach(f => f());
  }, [db]);

  const cycle = useMemo(() => cycleInfo(sessions, prog.cycleStart), [sessions, prog.cycleStart]);
  const program = useMemo(() => buildProgram({gear, prog, trainingDays, block: cycle.cycle}), [gear, prog, trainingDays, cycle.cycle]);
  const prs = useMemo(() => prTable(sessions), [sessions]);
  const recov = useMemo(() => recovery(sessions), [sessions]);
  const todayCheckin = useMemo(() => checkins.find(c => c.date === today()), [checkins]);
  const readiness = useMemo(() => { const s = readinessScore(todayCheckin); return {score:s, level:readinessLevel(s)}; }, [todayCheckin]);
  const dbs = useMemo(() => gear.dumbbells.slice().sort((a, b) => a - b), [gear]);

  // One write at a time per session document; local state is updated immediately so the next write builds on it.
  const chain = useRef(Promise.resolve());
  const writeSession = useCallback((id, date, dayIdx, mutate) => {
    const run = async () => {
      if (!db) throw new Error("Not connected");
      const base = sessions.find(s => s.id === id);
      const live = program[dayIdx];
      const doc = base
        ? JSON.parse(JSON.stringify({date:base.date, day:base.day, sets:base.sets, note:base.note || "", plan:planToStore(base.plan || live.ex), planName:base.planName || live.name, planFocus:base.planFocus || live.focus}))
        : (() => { const dl = cycleInfo(sessions, prog.cycleStart, date).deload; const ex = dl ? live.ex.map(e => [e[0], e[1], deloadSets(e[2]), e[3], e[4], e[5], e[6]]) : live.ex; return {date, day:live.key, sets:{}, note:"", plan:planToStore(ex), planName:live.name, planFocus:live.focus, deload:dl, gym:(gyms.list.find(x => x.id === gyms.active) || {}).name || null}; })();
      mutate(doc);
      doc.savedAt = new Date().toISOString();
      await db.set("sessions/" + id, doc);
      setSessions(prev => { const i = prev.findIndex(s => s.id === id); const next = prev.slice(); if (i >= 0) next[i] = {id, ...doc}; else next.push({id, ...doc}); return next; });
    };
    chain.current = chain.current.catch(() => {}).then(run);
    return chain.current;
  }, [db, sessions, program, gyms]);

  const api = {
    saveSet: (id, date, dayIdx, key, i, w, r, e, t) => writeSession(id, date, dayIdx, d => { d.sets[key] = d.sets[key] || []; while (d.sets[key].length <= i) d.sets[key].push({w:0, r:0}); const s = {w, r}; if (e) s.e = e; if (t) s.t = t; d.sets[key][i] = s; }),
    saveCheckin: c => db.set("checkins/" + today(), {date:today(), ...c}),
    saveNote: (key, text) => { const n = {...notes, [key]:text}; if (!text) delete n[key]; setNotes(n); return db.set("settings/exnotes", n); },
    swapExercise: (id, date, dayIdx, oldKey, row) => writeSession(id, date, dayIdx, d => { const pl = d.plan.map(e => e.key === oldKey ? {key:row[0], name:row[1], sets:e.sets, reps:row[3], w:row[4], q:row[5], g:row[6], pair:e.pair || null} : e); d.plan = pl; delete d.sets[oldKey]; }),
    // Gym profiles: the active gym's gear is what settings/equipment holds; the list keeps each gym's gear.
    saveGyms: async (list, active) => { setGyms({list, active}); await db.set("settings/gyms", {list, active}); },
    switchGym: async id => { const g = gyms.list.find(x => x.id === id); if (!g || !g.gear) return; const ng = normalizeGear(g.gear); setGyms({...gyms, active:id}); setGear(ng);
      const writes = [db.set("settings/gyms", {...gyms, active:id}), db.set("settings/equipment", ng)];
      // Sessions opened today with nothing logged yet get re-planned for the new gym.
      const fresh = buildProgram({gear:ng, prog, trainingDays, block: cycle.cycle});
      sessions.filter(s => s.date === today() && !Object.values(s.sets || {}).some(arr => arr.some(x => x.r))).forEach(s => { const live = fresh.find(d => d.key === s.day); if (!live) return; const ex = s.deload ? live.ex.map(e => [e[0], e[1], deloadSets(e[2]), e[3], e[4], e[5], e[6]]) : live.ex; const doc = {...s, plan:planToStore(ex), planName:live.name, planFocus:live.focus, gym:g.name, savedAt:new Date().toISOString()}; delete doc.id; writes.push(db.set("sessions/" + s.id, doc)); setSessions(prev => prev.map(x => x.id === s.id ? {id:s.id, ...doc} : x)); });
      await Promise.all(writes); },
    finish: (id, date, dayIdx, pending, note) => writeSession(id, date, dayIdx, d => { pending.forEach(({key, i, w, r}) => { d.sets[key] = d.sets[key] || []; while (d.sets[key].length <= i) d.sets[key].push({w:0, r:0}); d.sets[key][i] = {w, r}; }); d.note = note; }),
    deleteSession: id => db.del("sessions/" + id).then(() => setSessions(p => p.filter(s => s.id !== id))),
    addBodylog: (date, weight, arm) => db.set("bodylog/" + date, {date, weight:weight || null, arm:arm || null}),
    saveSchedule: days => { setTrainingDays(days); return db.set("settings/schedule", {trainingDays:days}); },
    saveSetup: (g, p) => { setGear(g); setProg(p); const list = gyms.list.map(x => x.id === gyms.active ? {...x, gear:g} : x); setGyms({...gyms, list}); return Promise.all([db.set("settings/equipment", g), db.set("settings/program", p), db.set("settings/gyms", {...gyms, list})]); },
    saveExcluded: excluded => { const p = {...prog, excluded}; setProg(p); return db.set("settings/program", p); },
    completeOnboarding: (g, p, days) => { setGear(g); setProg(p); setTrainingDays(days); return Promise.all([db.set("settings/equipment", g), db.set("settings/program", p), db.set("settings/schedule", {trainingDays:days})]); },
    importSeed: async seed => { const entries = []; for (const [id, d] of Object.entries(seed.sessions || {})) entries.push(["sessions/" + id, {...d, plan:planToStore(d.plan || [])}]); for (const [id, d] of Object.entries(seed.bodylog || {})) entries.push(["bodylog/" + id, d]); for (const [id, d] of Object.entries(seed.settings || {})) entries.push(["settings/" + id, d]); await db.batchSet(entries); },
    friendlyDbError,
  };
  const settingsKnown = Object.values(settingsSeen).every(v => v !== null);
  const t = today();
  const week = (() => { const dates = [...sessions.map(s => s.date), ...bodylog.map(b => b.date)].sort(); if (!dates.length) return 1; return Math.max(1, Math.floor((Date.now() - new Date(dates[0] + "T12:00:00")) / 864e5 / 7) + 1); })();
  const todayAlert = trainingDays.includes(new Date().getDay()) && !sessions.some(s => s.date === t);
  const needsOnboarding = settingsKnown && !settingsSeen.program && !settingsSeen.equipment && sessions.length === 0;
  return { sessions, bodylog, checkins, notes, gyms, gear, prog, trainingDays, program, dbs, profile, isAdmin: profile.isAdmin === true, loaded: loaded && settingsKnown, needsOnboarding, error, api, today: t, week, todayAlert, cycle, prs, recov, todayCheckin, readiness };
}
