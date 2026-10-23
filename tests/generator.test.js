import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProgram, PROGRAM_DEFAULTS, GEAR_DEFAULTS, LIB } from "../src/lib/program.js";
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
test("every exercise has media and a guide", () => { for (const e of LIB) assert.ok(e.img && e.q && e.g, e.key); });
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
import { alternatives } from "../src/lib/program.js";
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
  assert.ok(alternatives("row", g50, ["row"]).every(x => x.group === "back"));
});
