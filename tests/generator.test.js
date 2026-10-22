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
  const a = buildProgram({gear:{...g50, bar:false, equipment:[]}, prog:PROGRAM_DEFAULTS, trainingDays:[1,2,4,5]});
  assert.ok(!a.some(d => d.ex.some(e => e[0] === "chinup")));
  const b = buildProgram({gear:{...g50, equipment:["bar","barbell","rack"]}, prog:PROGRAM_DEFAULTS, trainingDays:[1,2,4,5]});
  assert.ok(b[0].ex.some(e => e[0] === "bb_bench"));
});
test("every exercise has media and a guide", () => { for (const e of LIB) assert.ok(e.img && e.q && e.g, e.key); });
test("progression: top of range steps to next owned dumbbell; barbell steps 5 lb", () => {
  const s1 = suggest(["flat_press","Flat",4,"8–12",35,"",""], [{date:"2026-10-20", sets:{flat_press:[{w:35,r:12},{w:35,r:12},{w:35,r:12},{w:35,r:12}]}}], [10,15,20,25,30,35,40,45,50]);
  assert.equal(s1.w, 40);
  const s2 = suggest(["bb_bench","BB",4,"8–12",95,"",""], [{date:"2026-10-20", sets:{bb_bench:[{w:95,r:12},{w:95,r:12},{w:95,r:12},{w:95,r:12}]}}], [10,15,20]);
  assert.equal(s2.w, 100);
});
