// Personal records per lift: heaviest weight, most reps at that weight, best estimated 1RM.
import { BODYWEIGHT_EX } from "./program.js";
import { e1rm } from "./progression.js";

export function prTable(sessions){
  const out = {};
  sessions.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(s => { for (const k in s.sets) s.sets[k].filter(x => x.r).forEach(x => {
    const bw = BODYWEIGHT_EX.has(k); const cur = out[k] || {weight:0, repsAtWeight:0, e1rm:0, reps:0, date:null};
    if (bw) { if (x.r > cur.reps) out[k] = {...cur, reps:x.r, date:s.date}; else out[k] = cur; return; }
    const est = e1rm(x.w, x.r); let n = {...cur};
    if (x.w > cur.weight || (x.w === cur.weight && x.r > cur.repsAtWeight)) { n.weight = x.w; n.repsAtWeight = x.r; }
    if (est > cur.e1rm) { n.e1rm = est; n.date = s.date; }
    out[k] = n; }); });
  return out;
}
// What a just-logged set beat, if anything. `before` is the PR table without this set.
export function detectPR(before, key, w, r){
  const bw = BODYWEIGHT_EX.has(key); const cur = before[key];
  if (bw) return !cur || r > cur.reps ? {kind:"reps", text:`New best: ${r} reps`} : null;
  if (!cur) return null;                                            // first time: nothing to beat yet
  if (w > cur.weight) return {kind:"weight", text:`New PR: ${w} lb`};
  if (w === cur.weight && r > cur.repsAtWeight) return {kind:"reps", text:`New PR: ${r} reps at ${w} lb`};
  if (e1rm(w, r) > cur.e1rm + 0.5) return {kind:"e1rm", text:`New estimated max: ${Math.round(e1rm(w, r))} lb`};
  return null;
}
