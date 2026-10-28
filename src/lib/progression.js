// Double-progression engine with stall and fatigue handling. Pure: takes history, returns targets.
import { BODYWEIGHT_EX, CORE_BW, TIMED, LIB_BY_KEY, ladder } from "./program.js";

export const e1rm = (w, r) => w * (1 + r / 30);
export function parseRange(r){ if (r === "max") return null; const m = r.split("–").map(Number); return {lo:m[0], hi:m[1] || m[0]}; }

export function historyFor(sessions, exKey){
  return sessions.filter(s => s.sets[exKey] && s.sets[exKey].some(x => x.r))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(s => ({date:s.date, sets:s.sets[exKey].filter(x => x.r)}));
}

// dbs: sorted list of available dumbbells
// Effort per set: 1 = easy (3+ reps left), 2 = hard (1–2 left), 3 = max (nothing left). Missing = hard.
export const EFFORT = {1:"Easy", 2:"Hard", 3:"Max"};
const effortOf = sets => { const es = sets.map(x => x.e || 2); return es.reduce((a, b) => a + b, 0) / es.length; };

// ctx: {readiness: "low"|"ok"|"high"|"unknown", deload: bool}
export function suggest(ex, sessions, gear, ctx = {}){
  const [key, , n, rangeStr, startW] = ex;
  const range = parseRange(rangeStr);
  const hist = historyFor(sessions, key);
  const fill = v => Array.from({length:n}, () => v);
  const equip = LIB_BY_KEY[key] ? LIB_BY_KEY[key].equip : "db";
  const lad = ladder(equip, gear);
  const nextDB = lad.next, prevDB = lad.prev, maxDB = lad.max;

  if (BODYWEIGHT_EX.has(key)) {
    const ab = CORE_BW.has(key), timed = TIMED.has(key), ranged = !!range; const lib = LIB_BY_KEY[key] || {};
    const up = lib.up || (timed ? "Add a dumbbell on the hip or raise the top leg." : ab ? (key === "knee_raise" ? "Move to hanging leg raises, or hold a dumbbell between your feet." : "Slow the lowering to 3 seconds or hold a light dumbbell between your feet.") : "Hold a 10 lb dumbbell between your feet and rebuild.");
    if (!hist.length) return ranged
      ? {w:0, reps:fill(range.lo), why: timed ? `Hold ${range.lo} seconds${/per side/i.test(lib.name || "") ? " per side" : ""}. Add 5 seconds each week.` : `Start at ${range.lo} slow, full reps. No swinging.`}
      : {w:0, reps:fill(null), why:"Do as many clean reps as you can each set. Partial reps don't count."};
    const last = hist[0].sets.map(s => s.r);
    if (ranged) {
      if (last.every(r => r >= range.hi)) return {w:0, reps:fill(range.hi), why:`Top of the range on every set. ${up}`};
      return {w:0, reps:last.map(r => Math.min(range.hi, r + (timed ? 5 : 1))), why:`Last time ${last.join(", ")}. Add ${timed ? "5 seconds" : "one rep"} per set.`};
    }
    const total = last.reduce((a, b) => a + b, 0);
    if (total >= 40) return {w:0, reps:last.slice(), why:`${total} total reps last time. Make it harder: ${up}`};
    const reps = last.map((r, i) => i === 0 ? r + 1 : r);
    while (reps.length < n) reps.push(Math.max(1, last[last.length - 1] - 1));
    return {w:0, reps, why:`Last time ${last.join(", ")}. Add one rep to the first set and hold the rest.`};
  }

  if (!hist.length) return {w:startW, reps:fill(range.lo), why:`Starting point: ${startW} lb for ${range.lo} reps. Rate the set Easy if you had 4+ left and the next target jumps.`};
  // The weight a session "was" is the one most sets were done at (a mid-session drop counts; a first-set miss doesn't).
  const domW = h => { const c = {}; let best = 0, bw = 0; h.sets.forEach(s => { const w = s.w || 0; c[w] = (c[w] || 0) + 1; if (c[w] >= best) { best = c[w]; bw = w; } }); return bw; };
  const last = {...hist[0], sets: hist[0].sets.filter(s => (s.w || 0) === domW(hist[0]))};
  const lastW = domW(hist[0]);
  const lastReps = last.sets.map(s => s.r);
  const effort = effortOf(last.sets);
  if (ctx.deload) return {w:lastW, reps:fill(range.lo), why:`Deload week: ${lastW} lb for ${range.lo}, half the sets. Move well, leave plenty in the tank.`};
  if (ctx.readiness === "low") return {w:lastW, reps:lastReps.map(r => Math.max(range.lo, r - 1)), why:`Low readiness today. Match ${lastW} lb, one rep under last time. The push comes next session.`};
  const totalReps = r => r.reduce((a, b) => a + b, 0);
  const allHitTop = lastReps.length >= n && lastReps.every(r => r >= range.hi);
  const fatigue = lastReps.length > 1 && (lastReps[0] - lastReps[lastReps.length - 1]) >= 4;
  const prevSame = hist.filter(h => domW(h) === lastW);
  const stalled = prevSame.length >= 3 &&
    totalReps(prevSame[0].sets.map(s => s.r)) <= totalReps(prevSame[1].sets.map(s => s.r)) &&
    totalReps(prevSame[1].sets.map(s => s.r)) <= totalReps(prevSame[2].sets.map(s => s.r));
  if (allHitTop) {
    const up = nextDB(lastW);
    if (up && effort <= 1.34 && !last.sets.some(s => s.e === 3)) { const up2 = nextDB(up) || up; return {w:up2, reps:fill(range.lo), why:`Top of the range and you called it easy. Two steps up to ${up2} lb; reps reset to ${range.lo}.`}; }
    if (up) return {w:up, reps:fill(range.lo), why:`You hit ${range.hi}+ on every set at ${lastW} lb. Weight goes up to ${up}; reps reset to ${range.lo}.`};
    return {w:lastW, reps:lastReps.map(r => r + 1), why: equip === "db" || equip === "kb" ? `Maxed out your ${maxDB}s. Add a rep per set, lower for 3 seconds, pause at the bottom. Time to buy heavier.` : `At your max load (${maxDB} lb). Add a rep per set and slow the lowering; update Setup if you get more plates.`};
  }
  if (stalled) { const w = prevDB(lastW); return {w, reps:fill(range.hi), why:`Three sessions at ${lastW} lb with no rep gain. Drop to ${w} lb, own the top of the range, then climb back.`}; }
  // Below the bottom of the range on two or more sets: the weight is too heavy right now.
  const belowLo = last.sets.filter(s => s.r < range.lo).length;
  if (belowLo >= 2 && prevDB(lastW) < lastW) { const w = prevDB(lastW); return {w, reps:fill(range.lo + 2), why:`Under ${range.lo} reps on ${belowLo} sets at ${lastW} lb. Back to ${w} lb for ${range.lo + 2}s, then climb again.`}; }
  // Per set: easy → +2, hard → +1, max → hold. A set that missed its target holds too (you don't add to a rep you didn't get).
  const perSet = last.sets.map(s => { const e = s.e || 2; const missed = s.t && s.r < s.t; const bump = e === 1 ? 2 : (e === 3 || missed) ? 0 : 1; return {r:s.r, e, missed, bump}; });
  const reps = perSet.map(s => Math.min(range.hi, s.r + s.bump));
  while (reps.length < n) reps.push(range.lo);
  const held = perSet.filter(s => s.bump === 0).length, missedN = perSet.filter(s => s.missed).length, maxN = perSet.filter(s => s.e === 3).length;
  let why;
  if (held === perSet.length) why = missedN ? `Missed the target on ${missedN === 1 ? "a set" : missedN + " sets"} last time. Repeat ${lastW} lb for ${lastReps.join(", ")} and own it before adding.` : `Every set was max effort last time. Repeat ${lastW} lb for ${lastReps.join(", ")} and own it before adding.`;
  else if (fatigue) why = `Reps fell from ${lastReps[0]} to ${lastReps[lastReps.length - 1]} last time. Same weight, a rep more where you had something left, and rest a full 2–3 minutes between sets.`;
  else if (held) why = `Last time ${lastReps.join(", ")} at ${lastW} lb. Add a rep on the sets you had in hand; ${missedN ? "the missed set" : "the max-effort set"}${held > 1 ? "s" : ""} stay${held > 1 ? "" : "s"} put.`;
  else if (perSet.every(s => s.e === 1)) why = `Last time ${lastReps.join(", ")} at ${lastW} lb and you called it all easy. Two reps more per set. Hit ${range.hi} everywhere and the weight goes up.`;
  else why = `Last time ${lastReps.join(", ")} at ${lastW} lb. Same weight, a rep more per set${perSet.some(s => s.e === 1) ? ", two on the easy ones" : ""}. Hit ${range.hi} on all sets and the weight goes up.`;
  return {w:lastW, reps, why};
}

export function strengthSummary(sessions, names){
  const byEx = {};
  sessions.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(s => {
    for (const k in s.sets) {
      const score = x => BODYWEIGHT_EX.has(k) ? x.r : e1rm(x.w, x.r);
      const top = s.sets[k].filter(x => x.r).reduce((best, x) => (!best || score(x) > score(best)) ? x : best, null);
      if (!top) continue;
      byEx[k] = byEx[k] || {first:{...top, date:s.date}};
      byEx[k].last = {...top, date:s.date};
    }
  });
  const score = (k, t) => BODYWEIGHT_EX.has(k) ? t.r : e1rm(t.w, t.r);
  return Object.keys(byEx).map(k => { const f = byEx[k].first, l = byEx[k].last; const same = f.date === l.date;
    return {k, name:names[k] || k, first:f, last:l, delta: same ? 0 : score(k, l) - score(k, f), pct: same ? 0 : Math.round((score(k, l) - score(k, f)) / score(k, f) * 100)}; })
    .sort((a, b) => b.pct - a.pct || b.delta - a.delta || a.name.localeCompare(b.name));   // biggest improvement first
}

export const REST = { compound:150, iso:90, last:120, superset:30 };
