import React, { useState, useEffect } from "react";
import { PageHeader, BackButton, Card, Pill, Segmented, Toggle, RowCard, IconBubble, IMG, Icon } from "../components/ui.jsx";
import { EQUIPMENT } from "../lib/program.js";
import { DOW } from "../lib/dates.js";

const ALL_W = Array.from({length:20}, (_, i) => (i + 1) * 5);
const GOAL_SUB = {size:"Moderate weight, 8–12 reps on the big lifts. Muscle.", strength:"Heavier, 5–8 reps on the big lifts, longer rests. Power.", endurance:"Lighter, 12–20 reps. Conditioning and tone."};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Floating save pill: appears when something changed, turns green once the plan is rebuilt.
const FloatingSave = ({ dirty, state, onSave }) => {
  if (!dirty && state !== "saved") return null;
  return <div className="fsave"><button className={`pill big ${state === "saved" ? "saved" : ""}`} disabled={state === "saving"} onClick={onSave}>
    {state === "saving" ? "Rebuilding…" : state === "saved" ? <><Icon name="tick" className="gicon"/><span>Plan rebuilt</span></> : "Save & rebuild my plan"}
  </button></div>;
};

export function SetupPage({ data, onBack }){
  const { gear, prog, trainingDays, api } = data;
  const [g, setG] = useState(gear); const [p, setP] = useState(prog); const [state, setState] = useState("idle"); const [err, setErr] = useState("");
  useEffect(() => { setG(gear); setP(prog); }, [gear, prog]);
  const dirty = !same(g, gear) || !same(p, prog);
  const equip = new Set(g.equipment || []);
  const toggleEquip = k => { const n = new Set(equip); n.has(k) ? n.delete(k) : n.add(k); setG({...g, equipment:[...n], bar:n.has("bar")}); };
  const save = async () => {
    if (!g.dumbbells.length && !equip.has("barbell") && !equip.has("kettlebell") && !equip.has("cable")) return setErr("Pick at least one dumbbell weight, or other weighted equipment.");
    if (!p.focus.length) return setErr("Pick at least one area to train.");
    setErr(""); setState("saving");
    try { await api.saveSetup(g, {...p, bodyweight:+p.bodyweight || 150}); setState("saved"); setTimeout(() => setState("idle"), 2200); } catch (e) { setState("idle"); setErr("Saved here, but couldn't sync: " + api.friendlyDbError(e)); }
  };
  return (
    <section id="gear">
      <PageHeader left={<BackButton onClick={onBack}/>} title="Setup" sub="Your goals and gear shape every workout"/>
      <Card tone="aqua" className="rowcard" style={{overflow:"hidden", minHeight:120}}><div className="grow"><b>Your gym, your goals</b><small>The plan rebuilds around what you own and what you're after. Progression only suggests weights you have.</small></div><img src={IMG("gear.png")} alt="" style={{width:"46%", maxWidth:190, height:"auto", margin:"-26px -30px -30px 0", filter:"drop-shadow(0 10px 14px rgba(21,48,58,.25))"}}/></Card>

      <h2>What do you want to train?</h2>
      <Card><div className="focus">{[["upper","Upper","Chest, back, shoulders, arms"],["lower","Lower","Quads, hams, glutes, calves"],["core","Core","Abs and obliques"]].map(([v, t, s]) => <button key={v} aria-pressed={p.focus.includes(v)} onClick={() => setP({...p, focus: p.focus.includes(v) ? p.focus.filter(x => x !== v) : [...p.focus, v]})}><b>{t}</b><small>{s}</small></button>)}</div></Card>

      <h2>Goal</h2>
      <Segmented options={[["size","Size"],["strength","Strength"],["endurance","Endurance"]]} value={p.goal} onChange={v => setP({...p, goal:v})}/>
      <p className="muted" style={{fontSize:".82rem", margin:"8px 0 0"}}>{GOAL_SUB[p.goal]}</p>

      <h2>Session length</h2>
      <Segmented options={[["short","~30 min"],["standard","~45 min"],["long","~60 min"]]} value={p.length} onChange={v => setP({...p, length:v})}/>

      <h2>About you</h2>
      <Card style={{display:"grid", gap:12}}>
        <div><div className="eyebrow" style={{marginBottom:6}}>Lifting experience</div><Segmented options={[["new","New"],["some","Some"],["experienced","Experienced"]]} value={p.experience} onChange={v => setP({...p, experience:v})}/></div>
        <RowCard title="Bodyweight" sub="Sets your starting weights" right={<><input type="number" inputMode="decimal" value={p.bodyweight} onChange={e => setP({...p, bodyweight:e.target.value})} style={{width:96, textAlign:"center"}}/><span className="muted">lb</span></>}/>
      </Card>
      <p className="muted" style={{fontSize:".82rem", margin:"8px 0 0"}}>Training days are set on the Schedule page: <b>{trainingDays.length ? trainingDays.map(d => DOW[d]).join(", ") + ` (${trainingDays.length}/week)` : "none yet"}</b>.</p>

      <h2>Dumbbells <span className="muted" style={{fontWeight:600, fontSize:".85rem"}}>· lb, per hand</span></h2>
      <Card>
        <div className="wgrid">{ALL_W.map(w => <button key={w} aria-pressed={g.dumbbells.includes(w)} onClick={() => setG({...g, dumbbells: g.dumbbells.includes(w) ? g.dumbbells.filter(x => x !== w) : [...g.dumbbells, w]})}>{w}</button>)}</div>
        <div className="rowi" style={{margin:"12px 0 0", gap:8}}><Pill ghost style={{padding:"8px 14px", fontSize:".85rem"}} onClick={() => setG({...g, dumbbells:ALL_W.filter(w => w <= 50)})}>5–50 set</Pill><Pill ghost style={{padding:"8px 14px", fontSize:".85rem"}} onClick={() => setG({...g, dumbbells:ALL_W.slice()})}>5–100 set</Pill><Pill ghost style={{padding:"8px 14px", fontSize:".85rem"}} onClick={() => setG({...g, dumbbells:[]})}>Clear</Pill></div>
      </Card>

      <h2>Bench</h2>
      <Segmented options={[["none","None"],["flat","Flat"],["incline","Incline"]]} value={g.bench} onChange={v => setG({...g, bench:v})}/>
      <p className="muted" style={{fontSize:".82rem", margin:"8px 0 0"}}>{g.bench === "incline" ? "Incline unlocks incline presses, chest-supported rows and incline curls." : g.bench === "flat" ? "Flat: presses on the bench; incline work is swapped out." : "No bench: presses move to the floor."}</p>

      <h2>Other equipment</h2>
      <Card style={{display:"grid", gap:14}}>{EQUIPMENT.map(e => <RowCard key={e.key} icon={<IconBubble name={e.key === "bar" ? "bar" : e.key === "cable" ? "pull" : "gear"}/>} title={e.name} sub={e.sub} right={<Toggle on={equip.has(e.key)} onChange={() => toggleEquip(e.key)} label={e.name}/>}/>)}</Card>
      {err && <div className="status">{err}</div>}
      <FloatingSave dirty={dirty} state={state} onSave={save}/>
    </section>
  );
}
