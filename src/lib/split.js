// Week planner (pure). Decides which muscles each training day works, how many hard sets each gets, and in
// what order — from the user's goal, level, session length, focus and the weekdays they train.
//
// The evidence (see README → "How the week is planned"): weekly hard sets per muscle drive growth; frequency and
// the split just distribute them. Each muscle gets 2× a week (3× for strength), ≥48 h apart, inside a per-session
// cap, with synergists credited fractionally from compounds and the priority muscle first in the session.
// Day types (full / upper / lower / push / pull / legs) come from the day count and focus, placed on the real
// weekdays so the same muscle never lands on back-to-back days when the calendar allows it.

export const MUSCLES = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hams", "glutes", "calves", "core"];
export const REGION_OF = {chest:"upper", back:"upper", shoulders:"upper", biceps:"upper", triceps:"upper", quads:"lower", hams:"lower", glutes:"lower", calves:"lower", core:"core"};
export const MUSCLE_LABEL = {chest:"Chest", back:"Back", shoulders:"Shoulders", biceps:"Biceps", triceps:"Triceps", quads:"Quads", hams:"Hams", glutes:"Glutes", calves:"Calves", core:"Core"};

// ---- volume model ----
// Weekly fractional sets per muscle = base[goal][level] × factor[muscle]
const BASE = {size:{new:10, some:14, experienced:18}, strength:{new:8, some:10, experienced:12}, endurance:{new:8, some:10, experienced:12}};
const FACTOR = {chest:1, back:1.1, shoulders:0.9, quads:1, hams:0.8, glutes:0.7, biceps:0.7, triceps:0.6, calves:0.5, core:0.6};
const FACTOR_STRENGTH = {chest:1, back:1.1, shoulders:0.6, quads:1, hams:0.9, glutes:0.4, biceps:0.4, triceps:0.4, calves:0.3, core:0.5};
// A hard set for the key muscle also counts this much for the synergist (bench → triceps, rows → biceps…).
const CREDIT = {chest:{triceps:0.3, shoulders:0.15}, shoulders:{triceps:0.25}, back:{biceps:0.3, shoulders:0.15}, quads:{glutes:0.4}, hams:{glutes:0.5, back:0.15}, glutes:{hams:0.25}};
export const CAP = {new:6, some:8, experienced:10};         // direct hard sets for one muscle in one session
export const LIFTS_PER = {short:4, standard:6, long:8};
const SETS_PER_LIFT = 3.3;

export function weeklyTargets({goal = "size", experience = "some", focus = ["upper", "core"]}){
  const base = (BASE[goal] || BASE.size)[experience] || BASE.size.some; const f = goal === "strength" ? FACTOR_STRENGTH : FACTOR; const out = {};
  for (const m of MUSCLES) { const r = REGION_OF[m]; const on = r === "core" ? focus.includes("core") : focus.includes(r); out[m] = on ? Math.round(base * f[m]) : 0; }
  return out;
}
// Direct sets still needed once compounds have credited their synergists. A muscle in focus keeps ≥40% of its
// target (and at least 4 sets) as direct work.
export function directTargets(target){
  const credit = {}; for (const m in CREDIT) for (const s in CREDIT[m]) credit[s] = (credit[s] || 0) + (target[m] || 0) * CREDIT[m][s];
  const out = {}; for (const m of MUSCLES) out[m] = target[m] ? Math.round(Math.max(target[m] - (credit[m] || 0), target[m] * 0.4, 4)) : 0;
  return out;
}

// ---- day types ----
// Muscles each day type trains, in session order. "A"/"B" variants change the lead (squat- vs hinge-led, press- vs
// pull-led) so the week isn't two copies of one day.
const TYPES = {
  full:  {name:"Full body", muscles:["quads", "chest", "back", "hams", "shoulders", "biceps", "triceps", "glutes", "calves", "core"]},
  fullA: {name:"Full body A", muscles:["quads", "chest", "back", "shoulders", "triceps", "calves", "core"]},
  fullB: {name:"Full body B", muscles:["hams", "back", "chest", "glutes", "biceps", "core"]},
  fullC: {name:"Full body C", muscles:["quads", "shoulders", "back", "chest", "hams", "calves", "core"]},
  upper: {name:"Upper", muscles:["chest", "back", "shoulders", "biceps", "triceps", "core"]},
  upperA:{name:"Upper A", muscles:["chest", "back", "shoulders", "triceps", "biceps", "core"]},
  upperB:{name:"Upper B", muscles:["back", "chest", "shoulders", "biceps", "triceps", "core"]},
  upperC:{name:"Delts & arms", muscles:["shoulders", "biceps", "triceps", "chest", "back", "core"]},
  lower: {name:"Lower", muscles:["quads", "hams", "glutes", "calves", "core"]},
  lowerA:{name:"Lower A", muscles:["quads", "hams", "glutes", "calves", "core"]},
  lowerB:{name:"Lower B", muscles:["hams", "quads", "glutes", "calves", "core"]},
  quad:  {name:"Quads", muscles:["quads", "glutes", "calves", "core"]},
  hip:   {name:"Hips & hams", muscles:["hams", "glutes", "quads", "calves", "core"]},
  push:  {name:"Push", muscles:["chest", "shoulders", "triceps", "core"]},
  pull:  {name:"Pull", muscles:["back", "biceps", "shoulders@0.5", "core"]},
  legs:  {name:"Legs", muscles:["quads", "hams", "glutes", "calves", "core"]},
  core:  {name:"Core", muscles:["core", "calves"]},
};
// Which day types a week gets, by what's trained and how many days. Evidence: full body ≈ split at equal volume;
// 2× frequency as the default; ≥3 lower sessions only when the week is lower-only; PPL ×2 or U/L ×3 at six days.
export function dayTypes(n, focus, goal){
  const up = focus.includes("upper"), lo = focus.includes("lower");
  if (up && lo) return {
    1:["full"], 2:["fullA", "fullB"], 3:["fullA", "fullB", "fullC"], 4:["upperA", "lowerA", "upperB", "lowerB"],
    5:["upperA", "lowerA", "push", "pull", "legs"], 6: goal === "strength" ? ["upper", "lower", "upper", "lower", "upper", "lower"] : ["push", "pull", "legs", "push", "pull", "legs"],
  }[n];
  if (up) return {1:["upper"], 2:["upperA", "upperB"], 3:["upperA", "upperB", "upperC"], 4:["push", "pull", "push", "pull"], 5:["push", "pull", "push", "pull", "upperC"], 6:["push", "pull", "push", "pull", "push", "pull"]}[n];
  if (lo) return {1:["lower"], 2:["lowerA", "lowerB"], 3:["quad", "hip", "lowerA"], 4:["quad", "hip", "quad", "hip"], 5:["quad", "hip", "core", "quad", "hip"], 6:["quad", "core", "hip", "quad", "core", "hip"]}[n];
  return Array.from({length:n}, () => "core");
}

const cyc = (a, b) => { const d = Math.abs(a - b) % 7; return Math.min(d, 7 - d); };

// Plan the week. trainingDays: weekday indexes (0 = Sun). Returns days in calendar order:
// [{dow, type, name, focus, muscles:[{m, sets}]}]
export function planWeek({trainingDays, goal = "size", experience = "some", length = "standard", focus = ["upper", "core"]}){
  const days = (trainingDays && trainingDays.length ? trainingDays.slice() : [1, 2, 4, 5]).sort((a, b) => a - b).slice(0, 6);
  const n = days.length; const cap = CAP[experience] || 8; const budget = (LIFTS_PER[length] || 6) * SETS_PER_LIFT;
  const types = dayTypes(n, focus, goal) || Array.from({length:n}, () => "full");
  const coreOn = focus.includes("core"), onlyCore = !focus.includes("upper") && !focus.includes("lower");
  const parse = s => { const [m, w] = s.split("@"); return {m, w: w ? +w : 1}; };
  const musclesOf = type => TYPES[type].muscles.map(parse);
  // Which weekday gets which type: the sequence starts on the day after the longest gap (the freshest day), so the
  // week's first/heaviest session follows rest and same-type sessions sit as far apart as the calendar allows.
  let start = 0, gap = -1; for (let i = 0; i < n; i++) { const g = n === 1 ? 7 : cyc(days[i], days[(i - 1 + n) % n]); if (g > gap) { gap = g; start = i; } }
  const assigned = days.map((dow, i) => ({dow, type: types[(i - start + n) % n]}));
  // Volume: weekly direct targets spread over the days that train each muscle, capped per session and scaled to
  // the session budget. Core only when asked for (≤4 sets a day); on a one-day week everything shrinks to fit.
  const weekly = weeklyTargets({goal, experience, focus}); const target = directTargets(weekly);
  // a single-region week gets that region's emphasis (+30%); a core-only week trains core like a real muscle
  const regions = ["upper", "lower"].filter(r => focus.includes(r)); if (regions.length === 1) for (const m of MUSCLES) if (REGION_OF[m] === regions[0]) target[m] = Math.round(target[m] * 1.3);
  if (onlyCore) target.core = Math.round((BASE[goal] || BASE.size)[experience] * 1.6);
  const allow = m => m === "core" ? (coreOn || onlyCore) : target[m] > 0;
  const on = m => assigned.reduce((a, d) => a + (musclesOf(d.type).find(x => x.m === m) || {w:0}).w, 0);    // weighted days a muscle is trained
  const out = assigned.map(d => {
    const list = musclesOf(d.type).filter(x => allow(x.m) && on(x.m) > 0).map(x => ({m:x.m, sets: Math.max(2, Math.min(cap, Math.round((target[x.m] || 4) * x.w / on(x.m))))}));
    list.forEach(x => { if (x.m === "core" && !onlyCore) x.sets = Math.min(x.sets, 4); });
    const sum = list.reduce((a, x) => a + x.sets, 0);
    if (sum > budget) { const k = budget / sum; list.forEach(x => { x.sets = Math.max(2, Math.round(x.sets * k)); }); }
    const t = TYPES[d.type];
    const main = list.filter(x => x.m !== "core").slice(0, 4).map(x => MUSCLE_LABEL[x.m]);
    return {dow:d.dow, type:d.type, name:t.name, muscles:list, focus: main.length ? main.join(" · ") + (list.some(x => x.m === "core") ? " · Core" : "") : "Abs · Obliques"};
  });
  return out;
}
