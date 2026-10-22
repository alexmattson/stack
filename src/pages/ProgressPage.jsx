import React, { useState } from "react";
import { PageHeader, BackButton, Card, IconBubble, Ring, Status, useStatus, WeekBadge } from "../components/ui.jsx";
import { DOW, today, fmtDate, iso, weekStart, weekNumber } from "../lib/dates.js";
import { strengthSummary } from "../lib/progression.js";
import { BODYWEIGHT_EX, planFromStore } from "../lib/program.js";
import { sessionSetCount } from "../lib/plan.js";


const WeeklyBars = ({ sessions }) => {
  const ws = weekStart(); const t = today();
  const per = Array.from({length:7}, (_, o) => { const d = new Date(ws + "T12:00:00"); d.setDate(d.getDate() + o); const k = iso(d); return {k, lbl:DOW[d.getDay()], n:sessions.filter(s => s.date === k).reduce((a, s) => a + sessionSetCount(s), 0)}; });
  const mx = Math.max(10, ...per.map(p => p.n)); const total = per.reduce((a, p) => a + p.n, 0); const wk = sessions.filter(s => s.date >= ws).length;
  return (
    <Card tone="aqua" style={{padding:"16px 16px 10px"}}>
      <div className="rowcard" style={{marginBottom:6}}><IconBubble name="push"/><div className="grow"><b>Sets this week</b><small>{wk} workout{wk === 1 ? "" : "s"} · Mon–Sun</small></div><div className="num">{total}<small> sets</small></div></div>
      <div className="bars">{per.map(p => <div key={p.k} className={`b ${p.k === t ? "today" : ""}`}>{p.n ? <span className="v">{p.n}</span> : null}<span className="pill-b"><i style={{height:`${Math.round(p.n / mx * 100)}%`}}/></span><small>{p.lbl}</small></div>)}</div>
    </Card>
  );
};

const Sparkline = ({ bl, start }) => {
  const W = 160, H = 70, P = 6; const pts = bl.length ? bl.slice(-12) : [{date:today(), weight:start}];
  const ws = pts.map(p => p.weight); const lo = Math.min(...ws) - 1, hi = Math.max(...ws) + 1;
  const x = i => pts.length > 1 ? P + i * (W - 2 * P) / (pts.length - 1) : W / 2; const y = v => P + (hi - v) / (hi - lo) * (H - 2 * P);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.weight).toFixed(1)}`).join(" ");
  return <svg className="spark" viewBox={`0 0 ${W} ${H}`} aria-label="Bodyweight trend">{pts.length > 1 ? <><path className="a" d={`${path} L${x(pts.length - 1).toFixed(1)},${H} L${x(0)},${H} Z`}/><path className="l" d={path}/><circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1].weight)} r="4"/></> : <><path className="l" d={`M${P},${H / 2} L${W - P},${H / 2}`} opacity=".5"/><circle cx={W / 2} cy={H / 2} r="4"/></>}</svg>;
};

const LiftList = ({ st }) => !st.length ? <div className="empty">Log a session and each lift's first vs latest top set will appear here.</div> : (
  <div className="lifts">{st.map(x => { const same = x.first.date === x.last.date; const pct = same ? 0 : Math.max(0, Math.min(100, x.pct)); const label = same ? "new" : (x.delta > 0 ? "+" : "") + (BODYWEIGHT_EX.has(x.k) ? x.delta : x.pct + "%");
    const cell = t => BODYWEIGHT_EX.has(x.k) ? <>{t.r}<small>reps</small></> : `${t.w}×${t.r}`;
    return <div key={x.k} className="lift"><Ring pct={pct} label={label} up={x.delta > 0}/><div className="nm"><b>{x.name}</b><span className="dots"/></div><span className="val">{cell(x.last)}<small>was {BODYWEIGHT_EX.has(x.k) ? x.first.r : x.first.w + "×" + x.first.r}</small></span></div>; })}</div>
);

const History = ({ sessions, program, names, onDelete }) => {
  const [confirm, setConfirm] = useState(null);
  const list = sessions.slice().sort((a, b) => b.date.localeCompare(a.date));
  if (!list.length) return <div className="empty">No sessions yet. Your first logged workout shows up here.</div>;
  return list.map(s => { const di = program.findIndex(d => d.key === s.day); return (
    <details key={s.id}><summary><span>{fmtDate(s.date)} · {s.planName || `Day ${di + 1}`}</span><span>{Object.keys(s.sets).length} lifts</span></summary>
      {Object.keys(s.sets).map(k => <div key={k} className="d"><b>{names[k] || k}</b> · {s.sets[k].filter(x => x.r).map(x => BODYWEIGHT_EX.has(k) ? x.r : `${x.w}×${x.r}`).join(", ")}</div>)}
      {s.note && <div className="d">{s.note}</div>}
      <button className="del" onClick={() => confirm === s.id ? onDelete(s.id) : setConfirm(s.id)}>{confirm === s.id ? "Tap again to confirm" : "Delete this session"}</button>
    </details>); });
};

export function ProgressPage({ data, onBack }){
  const { sessions, bodylog, program, trainingDays, prog, api } = data;
  const [form, setForm] = useState({date:today(), w:"", arm:""}); const [st, setSt] = useStatus();
  const bl = bodylog.filter(b => b.weight).sort((a, b) => a.date.localeCompare(b.date));
  const lastW = bl.length ? bl[bl.length - 1].weight : prog.bodyweight; const d0 = bl.length ? lastW - bl[0].weight : 0;
  const names = {}; program.forEach(d => d.ex.forEach(([k, n]) => names[k] = names[k] || n)); sessions.forEach(s => planFromStore(s.plan).forEach(([k, n]) => names[k] = names[k] || n));
  const summary = strengthSummary(sessions, names); const ups = summary.filter(x => x.delta > 0).length;
  const wk = sessions.filter(s => s.date >= weekStart()).length; const target = Math.max(1, trainingDays.length); const pct = Math.min(100, Math.round(wk / target * 100));
  const add = async () => { const w = +form.w, arm = +form.arm; if (!w && !arm) return setSt("Enter a weight or arm measurement."); try { await api.addBodylog(form.date, w, arm); setSt("Added.", true); setForm(f => ({...f, w:"", arm:""})); } catch (e) { setSt("Couldn't save."); } };
  return (
    <section id="progress">
      <PageHeader left={<BackButton onClick={onBack}/>} title="My Progress" sub={new Date().toLocaleDateString(undefined, {weekday:"long", day:"numeric", month:"short"})} right={<WeekBadge week={data.week} alert={data.todayAlert}/>}/>
      <WeeklyBars sessions={sessions}/>
      <div className="tiles">
        <div className="tile aqua" style={{gridRow:"span 2"}}><div className="top"><IconBubble name="scale"/>Bodyweight</div><Sparkline bl={bl} start={prog.bodyweight}/><b>{lastW}<small>lb</small></b><small className="muted">{bl.length > 1 ? `${d0 >= 0 ? "+" : ""}${d0.toFixed(1)} lb since ${fmtDate(bl[0].date)}` : "Add weigh-ins below to see the trend"}</small></div>
        <div className="tile"><div className="top"><IconBubble name="check"/>Sessions</div><b>{sessions.length}<small>total</small></b></div>
        <div className="tile"><div className="top"><IconBubble name="chart"/>Lifts up</div><b>{summary.length ? ups : "—"}{summary.length ? <small>of {summary.length}</small> : null}</b></div>
      </div>
      <h2>Weekly target</h2>
      <Card><div className="rowcard"><div className="grow"><b>{wk} of {target} workouts</b><small>Mon–Sun · training days from your schedule</small></div><div className="num">{pct}<small>%</small></div></div><div className="hbar"><i style={{width:`${pct}%`}}/></div></Card>
      <h2>Lifts · first vs latest</h2>
      <Card><LiftList st={summary}/></Card>
      <h2>Weigh in</h2>
      <Card>
        <div className="bl">
          <div><label htmlFor="bl-date">Date</label><input type="date" id="bl-date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))}/></div>
          <div><label htmlFor="bl-w">Weight lb</label><input type="number" inputMode="decimal" step="0.1" id="bl-w" value={form.w} onChange={e => setForm(f => ({...f, w:e.target.value}))}/></div>
          <div><label htmlFor="bl-arm">Arm in</label><input type="number" inputMode="decimal" step="0.1" id="bl-arm" value={form.arm} onChange={e => setForm(f => ({...f, arm:e.target.value}))}/></div>
          <button onClick={add}>Add</button>
        </div>
        <Status text={st.text} ok={st.ok}/>
      </Card>
      <h2>Session history</h2>
      <Card className="hist"><History sessions={sessions} program={program} names={names} onDelete={id => api.deleteSession(id).catch(() => {})}/></Card>
    </section>
  );
}
