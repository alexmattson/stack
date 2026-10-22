import React, { useState, useEffect } from "react";
import { PageHeader, BackButton, Card, Pill, Segmented, Toggle, RowCard, IconBubble, IMG, Icon } from "../components/ui.jsx";
import { EQUIPMENT, KB_WEIGHTS, BAND_LEVELS } from "../lib/program.js";
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

// What you own for a piece of equipment, shown inline under its toggle once it's on.
const Grid = ({ all, picked, onChange }) => <div className="wgrid">{all.map(w => <button key={w} aria-pressed={picked.includes(w)} onClick={() => onChange(picked.includes(w) ? picked.filter(x => x !== w) : [...picked, w])}>{w}</button>)}</div>;
const Options = ({ kind, g, setG, equip }) => {
  const set = patch => setG({...g, ...patch});
  if (kind === "dumbbells") return (
    <div className="inv"><div className="eyebrow">Weights · lb, per hand</div>
      <Grid all={ALL_W} picked={g.dumbbells} onChange={d => set({dumbbells:d})}/>
      <div className="rowi" style={{margin:0, gap:8}}><Pill ghost className="mini" onClick={() => set({dumbbells:ALL_W.filter(w => w <= 50)})}>5–50 set</Pill><Pill ghost className="mini" onClick={() => set({dumbbells:ALL_W.slice()})}>5–100 set</Pill><Pill ghost className="mini" onClick={() => set({dumbbells:[]})}>Clear</Pill></div>
    </div>);
  if (kind === "bench") return (
    <div className="inv"><div className="eyebrow">Type</div>
      <Segmented options={[["flat","Flat"],["incline","Incline"]]} value={g.bench === "flat" ? "flat" : "incline"} onChange={v => set({bench:v})}/>
      <p className="muted mini-note">{g.bench === "flat" ? "Flat: presses on the bench; incline work is swapped out." : "Incline unlocks incline presses, chest-supported rows and incline curls."}</p>
    </div>);
  if (kind === "kettlebells") return <div className="inv"><div className="eyebrow">Weights · lb</div><Grid all={KB_WEIGHTS} picked={g.kettlebells} onChange={k => set({kettlebells:k})}/></div>;
  if (kind === "barbell") { const b = g.barbell; const sb = patch => set({barbell:{...b, ...patch}}); return (
    <div className="inv"><div className="eyebrow">Bar &amp; plates</div>
      <div className="invrow"><span>Bar weight</span><div className="segc small">{[[45,"45"],[35,"35"],[15,"15"]].map(([v, l]) => <button key={v} aria-pressed={b.bar === v} onClick={() => sb({bar:v})}>{l} lb</button>)}</div></div>
      <div className="invrow"><span>Smallest plate</span><div className="segc small">{[[1.25,"1¼"],[2.5,"2½"],[5,"5"],[10,"10"]].map(([v, l]) => <button key={v} aria-pressed={b.plateMin === v} onClick={() => sb({plateMin:v})}>{l}</button>)}</div></div>
      <div className="invrow"><span>Max you can load</span><div className="numin"><input type="number" inputMode="numeric" step="5" value={b.max} onChange={e => sb({max:+e.target.value || 0})}/><small>lb</small></div></div>
      <p className="muted mini-note">Barbell lifts move up by two of your smallest plate and stop at the max.</p>
    </div>); }
  if (kind === "ezbar") { const e = g.ezbar; return (
    <div className="inv"><div className="eyebrow">EZ bar</div>
      <div className="invrow"><span>Bar weight</span><div className="segc small">{[[25,"25"],[15,"15"],[10,"10"]].map(([v, l]) => <button key={v} aria-pressed={e.bar === v} onClick={() => set({ezbar:{...e, bar:v}})}>{l} lb</button>)}</div></div>
      {!equip.has("barbell") && <p className="muted mini-note">Plates come from the barbell entry; turn on Barbell &amp; plates to set your smallest plate.</p>}
    </div>); }
  if (kind === "cable") { const c = g.cable; const sc = patch => set({cable:{...c, ...patch}}); return (
    <div className="inv"><div className="eyebrow">Cable stack</div>
      <div className="invrow"><span>Heaviest setting</span><div className="numin"><input type="number" inputMode="numeric" step="5" value={c.max} onChange={e => sc({max:+e.target.value || 0})}/><small>lb</small></div></div>
      <div className="invrow"><span>Steps of</span><div className="segc small">{[[5,"5"],[10,"10"],[15,"15"]].map(([v, l]) => <button key={v} aria-pressed={c.inc === v} onClick={() => sc({inc:v})}>{l} lb</button>)}</div></div>
    </div>); }
  if (kind === "bands") return (
    <div className="inv"><div className="eyebrow">Resistance levels</div>
      <div className="wgrid four">{BAND_LEVELS.map(([v, l]) => <button key={v} aria-pressed={g.bands.includes(v)} onClick={() => set({bands: g.bands.includes(v) ? g.bands.filter(x => x !== v) : [...g.bands, v]})}>{l}</button>)}</div>
    </div>);
  return null;
};

// Shared save plumbing: dirty tracking + floating pill + the actual rebuild.
function useSave(data, buildPayload, validate){
  const [state, setState] = useState("idle"); const [err, setErr] = useState("");
  const save = async () => {
    const v = validate && validate(); if (v) return setErr(v);
    setErr(""); setState("saving");
    const [g, p] = buildPayload();
    try { await data.api.saveSetup(g, p); setState("saved"); setTimeout(() => setState("idle"), 2200); } catch (e) { setState("idle"); setErr("Saved here, but couldn't sync: " + data.api.friendlyDbError(e)); }
  };
  return { state, err, save };
}

export function GoalsPage({ data, onBack }){
  const { prog, trainingDays } = data;
  const [p, setP] = useState(prog);
  useEffect(() => { setP(prog); }, [prog]);
  const dirty = !same(p, prog);
  const { state, err, save } = useSave(data, () => [data.gear, {...p, bodyweight:+p.bodyweight || 150}], () => !p.focus.length ? "Pick at least one area to train." : "");
  return (
    <section id="goals">
      <PageHeader left={<BackButton onClick={onBack}/>} title="Goals" sub="What you're training for"/>
      <Card tone="aqua" className="rowcard" style={{overflow:"hidden", minHeight:120}}><div className="grow"><b>Your goals, your plan</b><small>Change anything here and the whole program is rebuilt around it.</small></div><img src={IMG("hero-train.png")} alt="" style={{height:140, width:"auto", margin:"-20px -10px -30px 0", filter:"drop-shadow(0 10px 14px rgba(21,48,58,.25))"}}/></Card>

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
      {err && <div className="status">{err}</div>}
      <FloatingSave dirty={dirty} state={state} onSave={save}/>
    </section>
  );
}

export function EquipmentPage({ data, onBack }){
  const { gear } = data;
  const [g, setG] = useState(gear);
  useEffect(() => { setG(gear); }, [gear]);
  const dirty = !same(g, gear);
  const equip = new Set(g.equipment || []);
  const toggleEquip = k => { const n = new Set(equip); n.has(k) ? n.delete(k) : n.add(k);
    const next = {...g, equipment:[...n], bar:n.has("bar"), bench: n.has("bench") ? (g.bench === "flat" ? "flat" : "incline") : "none"};
    if (k === "dumbbells" && n.has(k) && !g.dumbbells.length) next.dumbbells = ALL_W.filter(w => w <= 50);
    setG(next); };
  const { state, err, save } = useSave(data, () => [g, data.prog], () => {
    const weighted = (equip.has("dumbbells") && g.dumbbells.length) || equip.has("barbell") || (equip.has("kettlebell") && g.kettlebells.length) || equip.has("cable");
    if (!weighted) return "Turn on at least one weighted item: dumbbells, barbell, kettlebells or a cable machine.";
    if (equip.has("dumbbells") && !g.dumbbells.length) return "Pick the dumbbell weights you have.";
    if (equip.has("kettlebell") && !g.kettlebells.length) return "Pick the kettlebell weights you have.";
    if (equip.has("rack") && !equip.has("barbell")) return "A squat rack needs a barbell; turn on Barbell & plates too.";
    return "";
  });
  return (
    <section id="gear">
      <PageHeader left={<BackButton onClick={onBack}/>} title="Equipment" sub="What you have to work with"/>
      <Card tone="aqua" className="rowcard" style={{overflow:"hidden", minHeight:120}}><div className="grow"><b>Your gym</b><small>The plan only uses what you own, and progression only suggests weights you have.</small></div><img src={IMG("gear.png")} alt="" style={{width:"46%", maxWidth:190, height:"auto", margin:"-26px -30px -30px 0", filter:"drop-shadow(0 10px 14px rgba(21,48,58,.25))"}}/></Card>

      <h2>What you have</h2>
      <Card style={{display:"grid", gap:14}}>{EQUIPMENT.map(e => (
        <React.Fragment key={e.key}>
          <RowCard icon={<IconBubble name={e.key === "bar" ? "bar" : e.key === "bench" ? "bench" : e.key === "cable" ? "pull" : "gear"}/>} title={e.name} sub={e.sub} right={<Toggle on={equip.has(e.key)} onChange={() => toggleEquip(e.key)} label={e.name}/>}/>
          {e.options && equip.has(e.key) && <Options kind={e.options} g={g} setG={setG} equip={equip}/>}
        </React.Fragment>))}</Card>
      {err && <div className="status">{err}</div>}
      <FloatingSave dirty={dirty} state={state} onSave={save}/>
    </section>
  );
}
