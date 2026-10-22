import React, { useState } from "react";
import { PageHeader, BackButton, IconButton, WeekBadge } from "../components/ui.jsx";
import { DOW, today, fmtDate, weekNumber } from "../lib/dates.js";
import { buildPlan, nextDayIdx } from "../lib/plan.js";

const DayPicker = ({ days, onChange }) => <div className="dow">{DOW.map((n, i) => <button key={i} aria-pressed={days.includes(i)} onClick={() => onChange(days.includes(i) ? days.filter(x => x !== i) : [...days, i].sort())}>{n}</button>)}</div>;

const Calendar = ({ y, m, plan, program, onPick }) => {
  const first = new Date(y, m, 1), pad = first.getDay(), days = new Date(y, m + 1, 0).getDate(); const t = today();
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(<div key={"p" + i} className="c out"/>);
  for (let d = 1; d <= days; d++) { const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; const p = plan[k] || {kind:"rest"}; const prog = p.idx !== undefined && p.idx >= 0 ? program[p.idx] : null;
    const label = p.kind === "rest" ? "Rest" : p.kind === "miss" ? "Missed" : prog ? prog.name : ""; const focus = prog && p.kind === "done" ? "logged" : "";
    cells.push(<div key={k} className={`c ${p.kind} ${k === t ? "today" : ""}`} role="button" tabIndex={0} onClick={() => onPick(k)}><span className="d">{d}</span><span className="l">{label}</span><span className="f">{focus}</span></div>); }
  return <div className="cal">{DOW.map(n => <div key={n} className="wd">{n[0]}</div>)}{cells}</div>;
};

export function SchedulePage({ data, onBack, onPickDate }){
  const { sessions, bodylog, program, trainingDays, api } = data;
  const now = new Date(); const [ym, setYm] = useState({y:now.getFullYear(), m:now.getMonth()});
  const plan = buildPlan(ym.y, ym.m, sessions, program, trainingDays);
  const t = today(); const ni = nextDayIdx(sessions, program);
  const up = Object.keys(plan).filter(k => plan[k].kind === "plan" && k >= t).sort()[0];
  const move = n => setYm(({y, m}) => { let mm = m + n, yy = y; if (mm < 0) { mm = 11; yy--; } if (mm > 11) { mm = 0; yy++; } return {y:yy, m:mm}; });
  return (
    <section id="schedule">
      <PageHeader left={<BackButton onClick={onBack}/>} title="Schedule" sub={`${trainingDays.length} training days a week`} right={<WeekBadge week={data.week} alert={data.todayAlert}/>}/>
      <p className="eyebrow" style={{marginBottom:4}}>Training days · tap to change</p>
      <DayPicker days={trainingDays} onChange={d => api.saveSchedule(d).catch(() => {})}/>
      <div className="pagehead" style={{padding:"4px 0 8px"}}><IconButton name="back" label="Previous month" onClick={() => move(-1)}/><div className="ttl"><b>{new Date(ym.y, ym.m, 1).toLocaleDateString(undefined, {month:"long", year:"numeric"})}</b></div><IconButton name="next" label="Next month" onClick={() => move(1)}/></div>
      <Calendar y={ym.y} m={ym.m} plan={plan} program={program} onPick={onPickDate}/>
      <p className="legend"><span className="sw done"/>Logged <span className="sw plan"/>Planned <span className="sw rest"/>Rest <span className="sw miss"/>Missed</p>
    </section>
  );
}
