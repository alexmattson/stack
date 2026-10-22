import React, { useMemo, useState, useEffect } from "react";
import { PageHeader, BackButton, Card, Toggle, Icon } from "../components/ui.jsx";
import { LIB, exImg, buildProgram } from "../lib/program.js";

const REGION = {push:"Push · chest, shoulders, triceps", pull:"Pull · back, biceps", legs:"Legs", core:"Core"};
const ORDER = ["push","pull","legs","core"];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Turn individual exercises off; the generator fills the slot with the next-best option you own.
export function ExercisesPage({ data, onBack }){
  const { prog, gear, trainingDays, api } = data;
  const [excluded, setExcluded] = useState(prog.excluded || []);
  const [state, setState] = useState("idle"); const [err, setErr] = useState("");
  useEffect(() => { setExcluded(prog.excluded || []); }, [prog]);
  const dirty = !same(excluded.slice().sort(), (prog.excluded || []).slice().sort());
  const off = new Set(excluded);
  // Which exercises are available with the current gear (so the list shows what could actually appear).
  const available = useMemo(() => { const p = buildProgram({gear, prog:{...prog, excluded:[]}, trainingDays}); const inPlan = new Set(p.flatMap(d => d.ex.map(e => e[0]))); const have = new Set([...(gear.equipment || []), ...(gear.bar ? ["bar"] : []), ...(gear.bench !== "none" ? ["bench"] : []), ...(gear.bench === "incline" ? ["incline"] : [])]);
    return {inPlan, usable: new Set(LIB.filter(e => e.needs.every(n => have.has(n)) && (e.bw || e.equip !== "db" || (have.has("dumbbells") && gear.dumbbells.length)) && (e.equip !== "kb" || gear.kettlebells.length)).map(e => e.key))}; }, [gear, prog, trainingDays]);
  const save = async () => { setErr(""); setState("saving"); try { await api.saveExcluded(excluded); setState("saved"); setTimeout(() => setState("idle"), 2200); } catch (e) { setState("idle"); setErr(api.friendlyDbError(e)); } };
  return (
    <section id="exercises-page">
      <PageHeader left={<BackButton onClick={onBack}/>} title="Exercises" sub="Turn off anything you don't want in your plan"/>
      <p className="muted" style={{fontSize:".88rem", margin:"0 0 6px"}}>Greyed-out moves need equipment you haven't turned on. In-plan moves are marked; switch one off and the next-best option takes its slot when you save.</p>
      {ORDER.map(r => (
        <React.Fragment key={r}>
          <h2>{REGION[r]}</h2>
          <Card style={{display:"grid", gap:12}}>
            {LIB.filter(e => e.region === r).map(e => { const usable = available.usable.has(e.key); const on = !off.has(e.key); return (
              <div key={e.key} className={`exrow ${usable ? "" : "dim"}`}>
                <img src={exImg(e.key)} alt=""/>
                <div className="grow"><b>{e.name}{available.inPlan.has(e.key) && on && <span className="chip inplan">in plan</span>}</b><small>{e.kind === "compound" ? "Compound" : "Isolation"}{e.bw ? " · bodyweight" : ""}{e.needs.length ? ` · needs ${e.needs.join(", ")}` : ""} · <a href={e.g} target="_blank" rel="noopener">guide</a></small></div>
                <Toggle on={on} onChange={v => setExcluded(v ? excluded.filter(k => k !== e.key) : [...excluded, e.key])} label={e.name}/>
              </div>); })}
          </Card>
        </React.Fragment>))}
      {err && <div className="status">{err}</div>}
      {(dirty || state === "saved") && <div className="fsave"><button className={`pill big ${state === "saved" ? "saved" : ""}`} disabled={state === "saving"} onClick={save}>{state === "saving" ? "Rebuilding…" : state === "saved" ? <><Icon name="tick" className="gicon"/><span>Plan rebuilt</span></> : "Save & rebuild my plan"}</button></div>}
    </section>
  );
}
