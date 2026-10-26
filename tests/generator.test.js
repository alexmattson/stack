import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProgram, PROGRAM_DEFAULTS, GEAR_DEFAULTS, LIB, normalizeGear } from "../src/lib/program.js";
import { suggest } from "../src/lib/progression.js";

const g50 = GEAR_DEFAULTS;
test("default setup reproduces a 4-day push/pull with core on pull days", () => {
  const p = buildProgram({gear:g50, prog:PROGRAM_DEFAULTS, trainingDays:[1,2,4,5]});
  assert.equal(p.length, 4); assert.deepEqual(p.map(d => d.name), ["Push","Pull","Push","Pull"]);
  assert.ok(p[1].ex.some(e => e[0] === "wt_crunch"));
});
test("no bar removes chin-ups; barbell+rack adds barbell bench", () => {
  const a = buildProgram({gear:{...g50, bar:false, equipment:["dumbbells","bench"]}, prog:PROGRAM_DEFAULTS, trainingDays:[1,2,4,5]});
  assert.ok(!a.some(d => d.ex.some(e => e[0] === "chinup")));
  const b = buildProgram({gear:{...g50, equipment:["dumbbells","bench","bar","barbell","rack"]}, prog:PROGRAM_DEFAULTS, trainingDays:[1,2,4,5]});
  assert.ok(b[0].ex.some(e => e[0] === "bb_bench"));
});
test("every exercise has media; guides are MuscleWiki links when present", () => { for (const e of LIB) { assert.ok(e.img && e.q, e.key); if (e.g) assert.match(e.g, /^https:\/\/musclewiki\.com\/exercise\//, e.key); } });
test("no equipment at all still builds a full bodyweight program with swaps", () => {
  const none = normalizeGear({equipment:[], dumbbells:[], bench:"none", bar:false});
  for (const focus of [["upper","core"], ["upper","lower","core"], ["lower"], ["core"]]) {
    const p = buildProgram({gear:none, prog:{...PROGRAM_DEFAULTS, focus}, trainingDays:[1,2,4,5]});
    assert.ok(p.every(d => d.ex.length >= 4), focus.join("+"));
    for (const d of p) for (const e of d.ex) { assert.equal(e[4], 0, e[0]); assert.ok(alternatives(e[0], none, d.ex.map(x => x[0])).every(x => x.bw), e[0]); }
  }
});
test("progression: top of range steps to next owned dumbbell; barbell steps 5 lb", () => {
  const s1 = suggest(["flat_press","Flat",4,"8–12",35,"",""], [{date:"2026-10-20", sets:{flat_press:[{w:35,r:12},{w:35,r:12},{w:35,r:12},{w:35,r:12}]}}], g50);
  assert.equal(s1.w, 40);
  const s2 = suggest(["bb_bench","BB",4,"8–12",95,"",""], [{date:"2026-10-20", sets:{bb_bench:[{w:95,r:12},{w:95,r:12},{w:95,r:12},{w:95,r:12}]}}], {...g50, barbell:{bar:45, plateMin:2.5, max:300}});
  assert.equal(s2.w, 100);
  const s3 = suggest(["kb_swing","KB",4,"8–12",35,"",""], [{date:"2026-10-20", sets:{kb_swing:[{w:35,r:12},{w:35,r:12},{w:35,r:12},{w:35,r:12}]}}], {...g50, kettlebells:[20,35,53]});
  assert.equal(s3.w, 53);
});

import { cycleInfo, deloadSets } from "../src/lib/cycle.js";
import { weeklySets, recovery, readinessScore, readinessLevel, plannedSets } from "../src/lib/volume.js";
import { prTable, detectPR } from "../src/lib/prs.js";

test("cycle: 4 build weeks then a deload, then block 2", () => {
  const s = [{date:"2026-10-01", sets:{}}];
  assert.deepEqual([cycleInfo(s, null, "2026-10-01").week, cycleInfo(s, null, "2026-10-28").week, cycleInfo(s, null, "2026-10-29").deload, cycleInfo(s, null, "2026-11-05").cycle], [1, 4, true, 2]);
  assert.equal(deloadSets(4), 2); assert.equal(deloadSets(3), 2);
});
test("effort changes progression: easy top-of-range jumps two steps, max effort holds", () => {
  const easy = suggest(["flat_press","F",4,"8–12",35,"",""], [{date:"2026-10-20", sets:{flat_press:[{w:35,r:12,e:1},{w:35,r:12,e:1},{w:35,r:12,e:1},{w:35,r:12,e:1}]}}], g50);
  assert.equal(easy.w, 45);
  const max = suggest(["flat_press","F",4,"8–12",35,"",""], [{date:"2026-10-20", sets:{flat_press:[{w:35,r:10,e:3},{w:35,r:9,e:3},{w:35,r:9,e:3},{w:35,r:8,e:3}]}}], g50);
  assert.deepEqual([max.w, max.reps], [35, [10,9,9,8]]);
  const dl = suggest(["flat_press","F",4,"8–12",35,"",""], [{date:"2026-10-20", sets:{flat_press:[{w:35,r:10},{w:35,r:9}]}}], g50, {deload:true});
  assert.deepEqual([dl.w, dl.reps[0]], [35, 8]);
});
test("volume: plan lands inside landmarks for the default upper+core setup", () => {
  const p = buildProgram({gear:g50, prog:PROGRAM_DEFAULTS, trainingDays:[1,2,4,5]}); const v = plannedSets(p);
  for (const m of ["chest","back","shoulders","arms"]) assert.ok(v[m] >= 8 && v[m] <= 20, `${m}=${v[m]}`);
  assert.ok(v.core >= 6 && v.core <= 14);
});
test("PRs: heavier weight, more reps at weight, and e1rm", () => {
  const t = prTable([{date:"2026-10-20", sets:{flat_press:[{w:35,r:10}]}}]);
  assert.equal(detectPR(t, "flat_press", 40, 8).kind, "weight");
  assert.equal(detectPR(t, "flat_press", 35, 11).kind, "reps");
  assert.equal(detectPR(t, "flat_press", 35, 9), null);
  assert.equal(detectPR(t, "chinup", 8).kind, "reps");
});
test("readiness and recovery", () => {
  assert.equal(readinessLevel(readinessScore({sleep:3, soreness:3, energy:3})), "high");
  assert.equal(readinessLevel(readinessScore({sleep:1, soreness:1, energy:2})), "low");
  const r = recovery([{date:"2026-10-20", savedAt:new Date().toISOString(), sets:{flat_press:[{w:35,r:10},{w:35,r:10},{w:35,r:10},{w:35,r:10}]}}]);
  assert.ok(r.chest < 100 && r.legs === 100);
});

import { warmups, platesPerSide } from "../src/lib/warmup.js";
import { alternatives, patternOf } from "../src/lib/program.js";
import { warmupPlan } from "../src/lib/warmup.js";
test("no day stacks the same movement pattern more than twice; ramps only where they earn their place", () => {
  const gears = [g50, normalizeGear({...GEAR_DEFAULTS, equipment:["dumbbells","bench","bar","barbell","rack"]}), normalizeGear({equipment:[], dumbbells:[], bench:"none", bar:false})];
  for (const g of gears) for (const focus of [["upper","core"], ["upper","lower","core"], ["lower"]]) for (const days of [[1,2,4,5], [1,3,5], [0,1,2,3,4,5]]) {
    const p = buildProgram({gear:g, prog:{...PROGRAM_DEFAULTS, focus}, trainingDays:days});
    for (const d of p) { const c = {}; d.ex.forEach(e => { const pt = patternOf(e[0]); if (pt) c[pt] = (c[pt] || 0) + 1; }); for (const k in c) assert.ok(c[k] <= 2, `${focus.join("+")} ${d.name}: ${k} ×${c[k]} (${d.ex.map(e => e[0]).join(",")})`); }
  }
  const p = buildProgram({gear:g50, prog:PROGRAM_DEFAULTS, trainingDays:[1,2,4,5]});
  const sug = Object.fromEntries(p[0].ex.map(e => [e[0], {w:e[4]}]));
  const plan = warmupPlan(p[0], sug, g50, () => null);
  const eis = Object.keys(plan).map(Number);
  assert.equal(eis[0], 0); assert.equal(plan[0].length, 3);                      // first lift: full ramp
  for (const ei of eis.slice(1)) assert.equal(plan[ei].length, 1);                // later lifts: one feel set
  const pats = eis.map(ei => patternOf(p[0].ex[ei][0])); assert.equal(new Set(pats).size, pats.length); // one per pattern
});
test("warm-ups ramp below the working weight and snap to owned weights", () => {
  assert.deepEqual(warmups("flat_press", 40, g50).map(s => s.w), [20, 30, 35]);
  assert.deepEqual(warmups("lateral", 15, g50), []);          // isolation: no ramp
  assert.deepEqual(warmups("chinup", 0, g50), []);             // bodyweight: no ramp
});
test("plates per side", () => {
  assert.deepEqual(platesPerSide(135, 45, [45,25,10,5,2.5]), [45]);
  assert.deepEqual(platesPerSide(185, 45, [45,25,10,5,2.5]), [45,25]);
  assert.equal(platesPerSide(101, 45, [45,25,10,5,2.5]), null);
});
test("supersets pair the last two isolation lifts; swaps stay in the muscle group", () => {
  const p = buildProgram({gear:g50, prog:PROGRAM_DEFAULTS, trainingDays:[1,2,4,5]});
  assert.ok(p.every(d => d.ex.filter(e => e[7] === "A").length === 2));
  const off = buildProgram({gear:g50, prog:{...PROGRAM_DEFAULTS, supersets:false}, trainingDays:[1,2,4,5]});
  assert.ok(off.every(d => d.ex.every(e => !e[7])));
  const alts = alternatives("row", g50, ["row"]);
  assert.ok(alts.length > 0);
  assert.ok(alts.every(x => ["back", "lats", "traps"].includes(x.group)));
  assert.ok(alts.every(x => x.kind === "compound" || x.group === "back"));
  // every lift in a default program has at least one swap
  for (const d of p) for (const e of d.ex) assert.ok(alternatives(e[0], g50, d.ex.map(x => x[0])).length > 0, e[0]);
});
