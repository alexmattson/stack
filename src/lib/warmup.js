// Warm-up ramps and plate math. Pure.
import { LIB_BY_KEY, ladder, patternOf } from "./program.js";

// Ramp before the first working set of a compound. full: 50% × 8, 70% × 5, 85% × 2 (the first lift of the session);
// otherwise a single feel set at 70% × 4. Snapped to weights you own.
export function warmups(key, workW, gear, full = true){
  const e = LIB_BY_KEY[key]; if (!e || e.bw || e.kind !== "compound" || !workW || workW < 20) return [];
  const lad = ladder(e.equip, gear);
  const steps = full ? [[0.5, 8], [0.7, 5], [0.85, 2]] : [[0.7, 4]];
  const out = []; const seen = new Set();
  for (const [f, r] of steps) { const w = lad.nearest(Math.round(workW * f / 5) * 5); if (w >= workW || seen.has(w)) continue; seen.add(w); out.push({w, r}); }
  return out;
}

export const PLATE_SIZES = [45, 35, 25, 10, 5, 2.5, 1.25];
// Plates per side for a bar: greedy from the heaviest plate you own. Returns null when it can't be loaded exactly.
export function platesPerSide(total, barWeight, plates){
  let side = (total - barWeight) / 2; if (side < 0) return null;
  const out = []; const avail = (plates && plates.length ? plates : [45, 25, 10, 5, 2.5]).slice().sort((a, b) => b - a);
  for (const p of avail) { while (side >= p - 1e-6) { out.push(p); side -= p; } }
  return side > 1e-6 ? null : out;
}
export const plateText = per => !per ? "" : per.length ? per.map(p => (p % 1 ? p.toFixed(2).replace(/0$/, "") : p)).join(" + ") : "bar only";

// Which lifts get a ramp, and how big. The first compound in the day gets the full ramp; a later compound gets one
// feel set only if its movement pattern hasn't been trained yet today; a repeat pattern (second row, second press) gets none.
// Returns {ei: [{w,r}]} for lifts whose first set isn't logged.
export function warmupPlan(day, suggestions, gear, savedSet){
  const out = {}; const seen = new Set(); let first = true;
  day.ex.forEach((e, ei) => { const lib = LIB_BY_KEY[e[0]]; if (!lib || lib.kind !== "compound" || lib.bw) return;
    const p = patternOf(e[0]) || e[0]; const logged = !!savedSet(e[0], 0);
    if (!logged) { const steps = seen.has(p) ? [] : warmups(e[0], (suggestions[e[0]] || {}).w, gear, first); if (steps.length) out[ei] = steps; }
    seen.add(p); first = false; });
  return out;
}
// A short general warm-up for the day, from the regions it trains. ~3 minutes, before any lifting.
const GENERAL = {
  push: ["Arm circles, 10 each way", "Scapular push-ups × 10", "Easy push-ups × 10"],
  pull: ["Dead hang or doorway lean, 20 s", "Band pull-aparts or reverse snow angels × 15", "Cat-cow × 8"],
  legs: ["Leg swings, 10 each leg", "Bodyweight squats × 15", "Glute bridges × 12"],
  core: ["Cat-cow × 8", "Dead bugs × 8 per side"],
};
export function generalWarmup(day){
  const regions = []; day.ex.forEach(e => { const r = (LIB_BY_KEY[e[0]] || {}).region; if (r && !regions.includes(r)) regions.push(r); });
  const main = regions.filter(r => r !== "core"); const list = [];
  (main.length ? main : regions).forEach(r => (GENERAL[r] || []).forEach(x => { if (!list.includes(x)) list.push(x); }));
  return {minutes: 3, items: list.slice(0, 5)};
}
