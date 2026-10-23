// Warm-up ramps and plate math. Pure.
import { LIB_BY_KEY, ladder } from "./program.js";

// Ramp before the first working set of a compound: 50% × 8, 70% × 5, 85% × 2, snapped to weights you own.
export function warmups(key, workW, gear){
  const e = LIB_BY_KEY[key]; if (!e || e.bw || e.kind !== "compound" || !workW || workW < 20) return [];
  const lad = ladder(e.equip, gear);
  const steps = [[0.5, 8], [0.7, 5], [0.85, 2]];
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
