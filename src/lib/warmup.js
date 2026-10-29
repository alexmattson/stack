// Warm-up ramps and plate math. Pure.
import { LIB_BY_KEY, ladder, patternOf } from "./program.js";

// Ramp before the first working set of a compound. full: 50% × 8, 70% × 5, 85% × 2 (the first lift of the session);
// otherwise a single feel set at 70% × 4. Snapped to weights you own.
// Strength (heavy, low reps) gets a longer ramp: 50% × 5, 70% × 3, 85% × 1. Size and endurance: 50% × 8, 75% × 5.
// Later lifts of a new pattern get one feeder set at ~60% × 5 (Enes 2025: more ramping doesn't help).
export function warmups(key, workW, gear, full = true, goal = "size"){
  const e = LIB_BY_KEY[key]; if (!e || e.bw || e.kind !== "compound" || !workW || workW < 20) return [];
  const lad = ladder(e.equip, gear);
  const steps = full ? (goal === "strength" ? [[0.5, 5], [0.7, 3], [0.85, 1]] : [[0.5, 8], [0.75, 5]]) : [[0.6, 5]];
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
export function warmupPlan(day, suggestions, gear, savedSet, goal = "size"){
  const out = {}; const seen = new Set(); let first = true;
  day.ex.forEach((e, ei) => { const lib = LIB_BY_KEY[e[0]]; if (!lib || lib.kind !== "compound" || lib.bw) return;
    const p = patternOf(e[0]) || e[0]; const logged = !!savedSet(e[0], 0);
    if (!logged) { const steps = seen.has(p) ? [] : warmups(e[0], (suggestions[e[0]] || {}).w, gear, first, goal); if (steps.length) out[ei] = steps; }
    seen.add(p); first = false; });
  return out;
}
// Warm-up moves per region. Most are library exercises done light (so they carry a guide and a picture);
// a few are warm-up-only. needs: equipment tags; pri: lower first. r: what to do.
const W = r => Object.assign({needs:[], pri:5, img:"stretch", g:null}, r);
export const WARMUP_LIB = [
  // push
  W({key:"pushup",        region:"push", r:"10 easy reps", pri:1}),
  W({key:"band_pullapart",region:"push", r:"15 reps", needs:["bands"], pri:2}),
  W({key:"pike_pushup",   region:"push", r:"8 easy reps", pri:3}),
  W({key:"scap_pushup",   region:"push", r:"12 reps", pri:4}),
  W({key:"wu_arm_circles",name:"Arm circles", region:"push", r:"10 each way, both directions", img:"raise", pri:5}),
  // pull
  W({key:"band_pullapart",region:"pull", r:"15 reps", needs:["bands"], pri:1}),
  W({key:"wu_dead_hang",  name:"Dead hang", region:"pull", r:"20–30 seconds", needs:["bar"], img:"pull", pri:2}),
  W({key:"row",           region:"pull", r:"12 reps, lightest dumbbell", needs:["dumbbells"], pri:3}),
  W({key:"inverted_row",  region:"pull", r:"10 easy reps", pri:4}),
  W({key:"superman",      region:"pull", r:"10 reps, 2 s hold", pri:5}),
  W({key:"wu_cat_cow",    name:"Cat-cow", region:"pull", r:"8 slow reps", img:"hinge", pri:6}),
  // legs
  W({key:"bw_squat",      region:"legs", r:"15 reps", pri:1}),
  W({key:"bw_bridge",     region:"legs", r:"12 reps", pri:2}),
  W({key:"rev_lunge",     region:"legs", r:"8 per leg", pri:3}),
  W({key:"wu_leg_swings", name:"Leg swings", region:"legs", r:"10 per leg, front to back", img:"lunge", pri:4}),
  W({key:"kb_swing",      region:"legs", r:"10 reps, lightest bell", needs:["kettlebell"], pri:5}),
  // core
  W({key:"dead_bug",      region:"core", r:"8 per side", pri:1}),
  W({key:"bird_dog",      region:"core", r:"8 per side", pri:2}),
  W({key:"wu_cat_cow",    name:"Cat-cow", region:"core", r:"8 slow reps", img:"hinge", pri:3}),
];
const resolve = w => { const lib = LIB_BY_KEY[w.key]; return {key:w.key, name:w.name || (lib ? lib.name : w.key), region:w.region, r:w.r, g:w.g || (lib ? lib.g : null), img:w.img === "stretch" && lib ? lib.img : w.img, needs:w.needs.length ? w.needs : (lib ? lib.needs : [])}; };
// The warm-up for a day: two moves for each region it trains (three on a single-region day; core only on a
// core-only day), chosen from what you own, guides first. Never a lift that's in the day itself.
export function generalWarmup(day, gear){
  const have = new Set(gear.equipment || []); if (gear.bar) have.add("bar"); if (gear.bench && gear.bench !== "none") have.add("bench");
  if (!(gear.dumbbells || []).length) have.delete("dumbbells"); if (!(gear.kettlebells || []).length) have.delete("kettlebell");
  const regions = []; day.ex.forEach(e => { const r = (LIB_BY_KEY[e[0]] || {}).region; if (r && !regions.includes(r)) regions.push(r); });
  const main = regions.filter(r => r !== "core"); const use = main.length ? main : regions;
  const inDay = new Set(day.ex.map(e => e[0])); const out = []; const seen = new Set();
  for (const region of use) {
    const picked = WARMUP_LIB.filter(w => w.region === region && !inDay.has(w.key) && !seen.has(w.key)).map(w => [w, resolve(w)])
      .filter(([, r]) => r.needs.every(n => have.has(n)))
      .sort((a, b) => (a[0].pri + (a[1].g ? 0 : 2)) - (b[0].pri + (b[1].g ? 0 : 2)))     // what you own, guides first
      .slice(0, use.length > 1 ? 2 : 3).map(([, r]) => r);
    picked.forEach(w => { seen.add(w.key); out.push(w); });
  }
  return out;
}
