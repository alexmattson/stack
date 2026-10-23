// Per-muscle weekly volume, landmarks, and a simple recovery model.
import { LIB_BY_KEY, planFromStore } from "./program.js";
import { weekStart, today, addDays } from "./dates.js";

// Library groups -> the muscle a lifter thinks in.
export const MUSCLE_OF = {chest:"chest", chest_upper:"chest", shoulders:"shoulders", side_delts:"shoulders", rear_delts:"shoulders", triceps:"arms", biceps:"arms",
  lats:"back", back:"back", traps:"back", quads:"legs", hams:"legs", glutes:"legs", calves:"legs", abs:"core", abs_lower:"core", obliques:"core"};
export const MUSCLES = ["chest","back","shoulders","arms","legs","core"];
export const MUSCLE_LABEL = {chest:"Chest", back:"Back", shoulders:"Shoulders", arms:"Arms", legs:"Legs", core:"Core"};
// Weekly hard-set landmarks (per muscle): below `min` is maintenance, `min–max` grows, above `max` is more than most recover from.
export const LANDMARKS = {chest:[10,20], back:[10,20], shoulders:[8,20], arms:[8,18], legs:[10,20], core:[6,14]};
export const muscleOf = key => { const e = LIB_BY_KEY[key]; return e ? MUSCLE_OF[e.group] || "other" : "other"; };

// Hard sets per muscle for sessions in [from, to].
export function weeklySets(sessions, from = weekStart(), to = addDays(from, 6)){
  const out = Object.fromEntries(MUSCLES.map(m => [m, 0]));
  sessions.filter(s => s.date >= from && s.date <= to).forEach(s => { for (const k in s.sets) { const m = muscleOf(k); if (out[m] !== undefined) out[m] += s.sets[k].filter(x => x.r).length; } });
  return out;
}
// Sets per muscle the current plan would deliver in a full week.
export function plannedSets(program){
  const out = Object.fromEntries(MUSCLES.map(m => [m, 0]));
  program.forEach(d => d.ex.forEach(e => { const m = muscleOf(e[0]); if (out[m] !== undefined) out[m] += e[2]; }));
  return out;
}
// Recovery 0–100 per muscle: each hard set costs points that recover linearly over 72 h.
export function recovery(sessions, now = Date.now()){
  const load = Object.fromEntries(MUSCLES.map(m => [m, 0]));
  sessions.forEach(s => { const t = new Date((s.savedAt || (s.date + "T18:00:00"))).getTime(); const age = (now - t) / 36e5; if (age < 0 || age > 72) return; const remain = 1 - age / 72;
    for (const k in s.sets) { const m = muscleOf(k); if (load[m] === undefined) continue; const hard = s.sets[k].filter(x => x.r); const w = hard.reduce((a, x) => a + (x.e === 3 ? 1.2 : x.e === 1 ? 0.7 : 1), 0); load[m] += w * 6 * remain; } });
  return Object.fromEntries(MUSCLES.map(m => [m, Math.max(0, Math.round(100 - load[m]))]));
}
// Readiness from a morning check-in (each 1–3): sleep, soreness (3 = none), energy -> 0–100 plus a label.
export function readinessScore(c){ if (!c) return null; const s = ((c.sleep || 2) + (c.soreness || 2) + (c.energy || 2)) / 9; return Math.round(s * 100); }
export const readinessLevel = score => score == null ? "unknown" : score >= 70 ? "high" : score >= 50 ? "ok" : "low";
