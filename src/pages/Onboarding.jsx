import React, { useState, useMemo } from "react";
import { Pill, Icon, IMG, Logo, Segmented, RowCard, IconBubble, Toggle } from "../components/ui.jsx";
import { GOAL_SUB, Options } from "./SetupPage.jsx";
import { EQUIPMENT, buildProgram, GEAR_DEFAULTS, PROGRAM_DEFAULTS } from "../lib/program.js";
import { DOW } from "../lib/dates.js";

const STEPS = ["welcome","focus","goal","days","you","gear","done"];
const FOCUS = [["upper","Upper body","Chest, back, shoulders, arms", "hero-train.png"],["lower","Lower body","Quads, hamstrings, glutes, calves", "ex-lunge.png"],["core","Core","Abs and obliques", "ex-abs.png"]];
const GOALS = [["size","Build muscle","8–12 reps, moderate weight. Visible size."],["strength","Get strong","5–8 reps, heavier, longer rests. Power."],["endurance","Tone & condition","12–20 reps, lighter. Stamina and definition."]];
const PRESETS = [[3,[1,3,5],"Mon · Wed · Fri"],[4,[1,2,4,5],"Mon · Tue · Thu · Fri"],[5,[1,2,3,4,5],"Weekdays"]];

export function Onboarding({ data, onDone, onCancel, replay }){
  const [i, setI] = useState(0);
  const [p, setP] = useState({...PROGRAM_DEFAULTS, focus:["upper"]});
  const [days, setDays] = useState([1,2,4,5]);
  const [g, setG] = useState({...GEAR_DEFAULTS, equipment:["dumbbells"], bar:false, bench:"none"});
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const step = STEPS[i];
  const equip = new Set(g.equipment);
  const toggleEquip = k => { const n = new Set(equip); n.has(k) ? n.delete(k) : n.add(k); const next = {...g, equipment:[...n], bar:n.has("bar"), bench:n.has("bench") ? (g.bench === "flat" ? "flat" : "incline") : "none"}; if (k === "dumbbells" && n.has(k) && !g.dumbbells.length) next.dumbbells = GEAR_DEFAULTS.dumbbells; setG(next); };
  const preview = useMemo(() => step === "done" ? buildProgram({gear:g, prog:{...p, bodyweight:+p.bodyweight || 150}, trainingDays:days}) : [], [step, g, p, days]);
  const canNext = step === "focus" ? p.focus.length > 0 : step === "days" ? days.length > 0 : step === "gear" ? (!equip.has("dumbbells") || g.dumbbells.length > 0) && (!equip.has("kettlebell") || g.kettlebells.length > 0) : true;
  const next = () => { setErr(""); setI(x => Math.min(STEPS.length - 1, x + 1)); window.scrollTo(0, 0); };
  const back = () => { setErr(""); setI(x => Math.max(0, x - 1)); window.scrollTo(0, 0); };
  const finish = async () => { setBusy(true); try { await data.api.completeOnboarding(g, {...p, bodyweight:+p.bodyweight || 150}, days); onDone(); } catch (e) { setErr("Couldn't save: " + (e.message || e)); setBusy(false); } };
  return (
    <section id="onboard">
      <div className="wrap ob-wrap">
        <div className="ob-top"><Logo size={36}/>{replay && <button className="link" onClick={onCancel}>Exit test run</button>}{i > 0 && <div className="ob-dots">{STEPS.slice(1).map((s, k) => <i key={s} className={k + 1 === i ? "cur" : k + 1 < i ? "done" : ""}/>)}</div>}</div>

        {step === "welcome" && <div className="ob-body ob-center">
          <div className="login-art"><i className="orb"/><img className="fl fl-b" src={IMG("login-run.png")} alt=""/><img className="fl fl-a" src={IMG("login-leap.png")} alt=""/></div>
          <h1 className="login-h">Let's build your plan.</h1>
          <p className="muted login-p">Six quick questions. Stack turns them into a program that fits your week, your gear and your goal, and keeps nudging the weights up as you log.</p>
        </div>}

        {step === "focus" && <div className="ob-body">
          <div className="eyebrow">Step 1 of 6</div><h1 className="ob-h">What do you want to train?</h1><p className="muted">Pick everything that applies.</p>
          <div className="ob-cards">{FOCUS.map(([v, t, s, img]) => <button key={v} className="ob-card" aria-pressed={p.focus.includes(v)} onClick={() => setP({...p, focus: p.focus.includes(v) ? p.focus.filter(x => x !== v) : [...p.focus, v]})}><img src={IMG(img)} alt=""/><div><b>{t}</b><small>{s}</small></div><span className="ob-check"><Icon name="tick"/></span></button>)}</div>
        </div>}

        {step === "goal" && <div className="ob-body">
          <div className="eyebrow">Step 2 of 6</div><h1 className="ob-h">What's the goal?</h1><p className="muted">This sets your rep ranges and rest times.</p>
          <div className="ob-cards">{GOALS.map(([v, t, s]) => <button key={v} className="ob-card" aria-pressed={p.goal === v} onClick={() => setP({...p, goal:v})}><div><b>{t}</b><small>{s}</small></div><span className="ob-check"><Icon name="tick"/></span></button>)}</div>
        </div>}

        {step === "days" && <div className="ob-body">
          <div className="eyebrow">Step 3 of 6</div><h1 className="ob-h">Which days can you train?</h1><p className="muted">The split is chosen from how many days you pick.</p>
          <div className="dow" style={{marginTop:12}}>{DOW.map((n, k) => <button key={k} aria-pressed={days.includes(k)} onClick={() => setDays(days.includes(k) ? days.filter(x => x !== k) : [...days, k].sort())}>{n}</button>)}</div>
          <div className="ob-presets">{PRESETS.map(([n, d, l]) => <button key={n} className="pill ghost mini" onClick={() => setDays(d)}>{n} days · {l}</button>)}</div>
          <p className="muted" style={{fontSize:".85rem"}}>{days.length} day{days.length === 1 ? "" : "s"} a week{days.length >= 4 && p.focus.includes("upper") && !p.focus.includes("lower") ? " · push / pull split" : days.length >= 4 && p.focus.includes("lower") && p.focus.includes("upper") ? " · upper / lower split" : days.length <= 3 ? " · full sessions each day" : ""}.</p>
        </div>}

        {step === "you" && <div className="ob-body">
          <div className="eyebrow">Step 4 of 6</div><h1 className="ob-h">About you</h1><p className="muted">Starting weights are set from this. You'll adjust them in the first week anyway.</p>
          <div className="ob-field"><div className="eyebrow">Session length</div><Segmented options={[["short","~30 min"],["standard","~45 min"],["long","~60 min"]]} value={p.length} onChange={v => setP({...p, length:v})}/></div>
          <div className="ob-field"><div className="eyebrow">Lifting experience</div><Segmented options={[["new","New"],["some","Some"],["experienced","Experienced"]]} value={p.experience} onChange={v => setP({...p, experience:v})}/></div>
          <div className="ob-field"><div className="eyebrow">Bodyweight</div><div className="numin"><input type="number" inputMode="decimal" value={p.bodyweight} onChange={e => setP({...p, bodyweight:e.target.value})}/><small>lb</small></div></div>
        </div>}

        {step === "gear" && <div className="ob-body">
          <div className="eyebrow">Step 5 of 6</div><h1 className="ob-h">What do you have?</h1><p className="muted">Turn on what you own; the plan only uses that. Nothing yet? Leave it all off and you get a bodyweight plan. You can change it any time.</p>
          <div className="card" style={{display:"grid", gap:14}}>{EQUIPMENT.map(e => <React.Fragment key={e.key}>
            <RowCard icon={<IconBubble name={e.key === "bar" ? "bar" : e.key === "bench" ? "bench" : e.key === "cable" ? "pull" : "gear"}/>} title={e.name} sub={e.sub} right={<Toggle on={equip.has(e.key)} onChange={() => toggleEquip(e.key)} label={e.name}/>}/>
            {e.options && equip.has(e.key) && <Options kind={e.options} g={g} setG={setG} equip={equip}/>}
          </React.Fragment>)}</div>
        </div>}

        {step === "done" && <div className="ob-body">
          <div className="eyebrow">Step 6 of 6</div><h1 className="ob-h">Your plan is ready.</h1>
          <p className="muted">{days.length} days a week · {p.focus.map(f => f[0].toUpperCase() + f.slice(1)).join(" + ")} · {GOALS.find(x => x[0] === p.goal)[1].toLowerCase()}</p>
          <div className="ob-plan">{preview.map((d, k) => <div key={d.key} className="ob-day"><b>{d.name}</b><small>{d.ex.length} lifts · {d.ex.reduce((a, e) => a + e[2], 0)} sets</small></div>)}</div>
          <p className="muted" style={{fontSize:".85rem"}}>Every set you log moves the next target. Hit the top of a rep range on every set and the weight goes up; miss it and you'll be told what to do instead.</p>
        </div>}

        <div className="ob-nav">
          {i > 0 ? <Pill ghost onClick={back}>Back</Pill> : <span/>}
          {step === "done" ? <Pill big onClick={finish} disabled={busy}>{busy ? "Saving…" : "Start training"}</Pill> : <Pill big onClick={next} disabled={!canNext}>{step === "welcome" ? "Let's go" : "Next"}</Pill>}
        </div>
        {err && <div className="status">{err}</div>}
      </div>
    </section>
  );
}
