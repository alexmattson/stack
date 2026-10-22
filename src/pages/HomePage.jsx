import React, { useState } from "react";
import { PageHeader, Logo, Card, Pill, Icon, IconBubble, IMG, Ring } from "../components/ui.jsx";
import { DOW, today, addDays, fmtDate, weekStart, greeting, weekNumber } from "../lib/dates.js";
import { buildPlan, sessionFor, sessionSetCount, sessionTotal, sessionComplete, plannedDayFor } from "../lib/plan.js";
import { strengthSummary } from "../lib/progression.js";
import { planFromStore } from "../lib/program.js";

const WeekBadge = ({ n, alert }) => <div className={`roundbtn wkbadge ${alert ? "alert" : ""}`} title={alert ? "Program week · today's workout not logged yet" : "Program week"}><small>WK</small><b>{n}</b></div>;

const DateStrip = ({ selected, onSelect, plan, sessions, program }) => {
  const t = today();
  const days = Array.from({length:7}, (_, i) => addDays(t, i - 3));
  return (
    <div className="strip">{days.map(k => { const p = plan[k]; const ss = sessionFor(sessions, k); const full = ss && sessionComplete(ss, program);
      const cls = [k === selected ? "today" : "", p && (p.kind === "plan" || p.kind === "done") ? "train" : "", full ? "done" : ""].join(" ");
      return <div key={k} className={cls} role="button" tabIndex={0} onClick={() => onSelect(k)}><small>{DOW[new Date(k + "T12:00:00").getDay()]}</small>{+k.slice(-2)}</div>; })}
    </div>
  );
};

const HeroCard = ({ state, title, eyebrow, sub, cta, onStart }) => (
  <Card tone={`aqua hero ${state}`}>
    <div className="txt"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{sub}</p></div>
    <Pill onClick={onStart}><Icon name="bolt" className="gicon"/><span>{cta}</span></Pill>
    <svg className="trail" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M4 16 C 60 2, 140 2, 196 16"/></svg>
    <div className={`art ${state}`}><img src={IMG(state === "done" ? "hero-done.png" : state === "rest" ? "hero-rest.png" : "hero-train.png")} alt=""/></div>
  </Card>
);

const Tile = ({ icon, label, value, unit, tone = "" }) => <div className={`tile ${tone}`}><div className="top"><IconBubble name={icon}/>{label}</div><b>{value}{unit && <small>{unit}</small>}</b></div>;

const RecentList = ({ sessions, program }) => {
  const rec = sessions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  if (!rec.length) return <Card className="rowcard"><img src={IMG("empty.png")} alt="" style={{width:64, height:"auto"}}/><div className="grow muted">No sessions yet. Tap Start and your first workout will show up here.</div></Card>;
  return rec.map(s => { const n = sessionSetCount(s), tot = sessionTotal(s, program) || n, p = Math.min(100, Math.round(n / tot * 100)); const di = program.findIndex(d => d.key === s.day);
    return <Card key={s.id} className="rowcard" style={{marginBottom:8}}><IconBubble name={/Pull/.test(s.planName || "") ? "pull" : "push"}/><div className="grow"><b>{s.planName ? `${s.planName}` : `Day ${di + 1}`}</b><small>{fmtDate(s.date)} · {n} sets</small></div><Ring pct={p} label={`${p}%`}/></Card>; });
};

export function HomePage({ data, onOpenWorkout }){
  const { sessions, bodylog, program, trainingDays } = data;
  const t = today();
  const [sel, setSel] = useState(t);
  const d = new Date(); const plan = buildPlan(d.getFullYear(), d.getMonth(), sessions, program, trainingDays);
  const cur = sessionFor(sessions, sel); const p = plan[sel] || {};
  const ni = cur ? Math.max(0, program.findIndex(x => x.key === cur.day)) : plannedDayFor(sel, sessions, program, trainingDays);
  const dayP = cur && Array.isArray(cur.plan) && cur.plan.length ? {name:cur.planName || program[ni].name, focus:cur.planFocus || program[ni].focus, ex:planFromStore(cur.plan)} : program[ni];
  const isTrain = ["plan","done","miss"].includes(p.kind);
  const total = dayP.ex.reduce((a, e) => a + e[2], 0); const done = cur ? sessionSetCount(cur) : 0;
  const when = sel === t ? "Today" : fmtDate(sel);
  const restDay = !isTrain && !cur, doneDay = cur && done >= total;
  let hero;
  if (cur && done > 0 && done < total) hero = {state:"", eyebrow:`${when} · in progress`, title:`Day ${ni + 1} ${dayP.name}`, sub:`${done} of ${total} sets done · ${dayP.focus}`, cta:"Continue"};
  else if (doneDay) hero = {state:"done", eyebrow:`${when} · complete`, title:`Day ${ni + 1} ${dayP.name} done`, sub:`All ${total} sets logged. Nice work. Eat, sleep, grow.`, cta:"Review"};
  else if (restDay) { const up = Object.keys(plan).filter(k => plan[k].kind === "plan" && k > sel).sort()[0]; const tips = ["Eat, sleep, and let the muscle show up.", "Protein today still counts. Aim for 130 g+.", "A 20-minute walk helps soreness more than sitting.", "Stretch the chest and lats; they tighten fastest."];
    hero = {state:"rest", eyebrow: sel === t ? "Rest day" : `${when} · rest day`, title: sel < t ? "Rested" : "Recovery", sub:(sel === t ? tips[new Date().getDate() % tips.length] + " " : "") + (up ? `Next: Day ${plan[up].idx + 1} ${program[plan[up].idx].name} on ${fmtDate(up)}.` : ""), cta: sel === t ? "Train anyway" : "Log a workout"}; }
  else if (sel < t) hero = {state:"", eyebrow:`${when} · missed`, title:`Day ${ni + 1} ${dayP.name}`, sub:`${dayP.ex.length} lifts · ${total} sets · ${dayP.focus}`, cta:"Log it anyway"};
  else hero = {state:"", eyebrow:when, title:`Day ${ni + 1} ${dayP.name}`, sub:`${dayP.ex.length} lifts · ${total} sets · ~${Math.round(total * 2)} min · ${dayP.focus}`, cta: sel === t ? "Start workout" : "Open workout"};
  const ws = weekStart(); const wk = sessions.filter(s => s.date >= ws).length;
  const bw = bodylog.filter(b => b.weight).sort((a, b) => a.date.localeCompare(b.date));
  const st = strengthSummary(sessions, Object.fromEntries(program.flatMap(d => d.ex.map(e => [e[0], e[1]]))));
  const ups = st.filter(x => x.delta > 0).length;
  const alert = trainingDays.includes(new Date().getDay()) && !sessionFor(sessions, t);
  return (
    <section id="home">
      <PageHeader left={<Logo/>} title="Stack" sub={greeting()} align="left" right={<WeekBadge n={weekNumber(sessions, bodylog)} alert={alert}/>}/>
      {data.error && <p className="warn">{data.error}</p>}
      <div className="eyebrow">{new Date().toLocaleDateString(undefined, {weekday:"long", month:"long", day:"numeric"})}</div>
      <DateStrip selected={sel} onSelect={setSel} plan={plan} sessions={sessions} program={program}/>
      <HeroCard {...hero} onStart={() => onOpenWorkout(sel, ni)}/>
      <div className="tiles">
        <Tile tone="aqua" icon="scale" label="Bodyweight" value={bw.length ? bw[bw.length - 1].weight : data.prog.bodyweight} unit="lb"/>
        <Tile icon="check" label="This week" value={wk} unit={`of ${trainingDays.length}`}/>
        <Tile icon="flame" label="Sessions" value={sessions.length} unit="total"/>
        <Tile icon="chart" label="Lifts up" value={st.length ? ups : "—"} unit={st.length ? `of ${st.length}` : ""}/>
      </div>
      <h2>Recent</h2>
      <RecentList sessions={sessions} program={program}/>
    </section>
  );
}
