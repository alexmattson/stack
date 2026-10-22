import React, { useState, useEffect, useMemo } from "react";
import { PageHeader, BackButton, IconButton, Card, Pill, Icon, IconBubble, BigInput, Status, useStatus, useBeep, IMG } from "../components/ui.jsx";
import { useRestTimer } from "../hooks/useRestTimer.js";
import { fmtDate } from "../lib/dates.js";
import { exImg, howTo, TIMED } from "../lib/program.js";

const RestBar = ({ timer, nextText, onSkip }) => (
  <div className={`timer ${timer.active ? "on" : ""} ${timer.done ? "go" : ""}`}>
    <span className="t">{timer.text}</span>
    <span className="bar"><i style={{width:`${timer.frac * 100}%`}}/></span>
    <button onClick={() => timer.add(30)}>+30s</button>
    <button className={timer.done ? "go" : ""} onClick={onSkip}>{timer.done ? "Go" : "Skip"}</button>
    <span className="nx">{nextText}</span>
  </div>
);

// Entry point to focus mode: start / continue / done, with both characters.
export function StartCard({ wo, onStart, timer, nextText, onSkipRest }){
  const done = wo.doneCount >= wo.total && wo.total > 0; const started = wo.doneCount > 0 && !done;
  return (
    <div className={`startcard ${done ? "done" : ""}`}>
      <div className="txt">
        <div className="eyebrow">{done ? "Complete" : started ? "In progress" : "Ready"}</div>
        <h2>{done ? `${wo.day.name} done` : started ? `${wo.doneCount} of ${wo.total} sets` : `${wo.total} sets · ~${Math.round(wo.total * 2)} min`}</h2>
        <p>{done ? "All sets logged. Eat, sleep, grow." : started ? "Pick up where you left off." : "One set at a time, rest on a timer."}</p>
        <Pill onClick={onStart}><Icon name="bolt" className="gicon"/><span>{done ? "Review" : started ? "Continue" : "Start workout"}</span></Pill>
      </div>
      <div className="art">{done ? <img className="solo" src={IMG("hero-done.png")} alt=""/> : <><img className="b" src={IMG("login-run.png")} alt=""/><img className="a" src={IMG("login-leap.png")} alt=""/></>}</div>
      <RestBar timer={timer} nextText={nextText} onSkip={onSkipRest}/>
    </div>
  );
}
function NowCardUnused({ wo, w, r, setW, setR, onDone, status, timer, nextText, onSkipRest, busy }){
  const ex = wo.day.ex[wo.ptr.ei]; if (!ex) return null;
  const [key, name, n, reps] = ex; const bw = wo.isBW(key); const sv = wo.savedSet(key, wo.ptr.si);
  const allDone = !wo.nextOpen();
  return (
    <div className="now">
      <div className="nowtop">
        <img className="nowimg" src={exImg(key)} alt=""/>
        <div className="hd"><IconBubble name={/Pull/.test(wo.day.name) ? "pull" : "push"}/><div style={{minWidth:0}}><small>{allDone ? "All sets logged" : sv ? "Logged · edit" : wo.flatIndex(wo.ptr) === 0 ? "Start here" : "Up next"}</small><b>{name}</b><span className="muted" style={{fontSize:".82rem"}}>Set {wo.ptr.si + 1} of {n} · target {reps} · {wo.flatIndex(wo.ptr) + 1}/{wo.total}</span></div></div>
        <p className="why">{wo.suggestions[key].why}</p>
      </div>
      <div className="bigs">
        <BigInput id="n-w" label="Weight lb" value={bw ? "" : w} onChange={setW} step={5} disabled={bw} placeholder={bw ? "BW" : ""}/>
        <BigInput id="n-r" label={TIMED.has(key) ? "Seconds" : "Reps"} value={r} onChange={setR} step={1}/>
      </div>
      <button className="done-btn" onClick={onDone} disabled={busy}>{sv ? "Update set" : "Finish set"}</button>
      <div className={`exstatus ${status.ok ? "ok" : status.text ? "bad" : ""}`} style={{textAlign:"center", margin:"8px 0 0"}}>{status.text}</div>
      <RestBar timer={timer} nextText={nextText} onSkip={onSkipRest}/>
    </div>
  );
}

const SetRow = ({ ex, i, wo, draft, setDraft, onSave, current }) => {
  const [key, name] = ex; const bw = wo.isBW(key); const sg = wo.suggestions[key]; const sv = wo.savedSet(key, i);
  const dw = draft[`${key}_${i}_w`], dr = draft[`${key}_${i}_r`];
  const wVal = bw ? "" : (dw !== undefined ? dw : sv ? sv.w : sg.w);
  const rVal = dr !== undefined ? dr : sv ? sv.r : (sg.reps[i] ?? "");
  const done = sv && (bw || +wVal === sv.w) && +rVal === sv.r;
  return (
    <div className={`setrow ${current ? "cur" : ""}`}>
      <span className="n">SET {i + 1}</span>
      <input type="number" inputMode="decimal" step="2.5" placeholder={bw ? "BW" : sg.w} value={wVal} disabled={bw} aria-label={`${name} set ${i + 1} weight`} onChange={e => setDraft(d => ({...d, [`${key}_${i}_w`]:e.target.value}))}/>
      <span className="x">×</span>
      <input type="number" inputMode="numeric" placeholder={sg.reps[i] ?? "max"} value={rVal} aria-label={`${name} set ${i + 1} reps`} onChange={e => setDraft(d => ({...d, [`${key}_${i}_r`]:e.target.value}))}/>
      <button className={`ck ${done ? "done" : ""}`} aria-label={`Save ${name} set ${i + 1}`} onClick={() => onSave(key, i, bw ? 0 : +wVal, +rVal)}>{done ? <Icon name="tick"/> : "✓"}</button>
    </div>
  );
};

const ExerciseCard = ({ ex, ei, wo, draft, setDraft, onSave, onFocus, status }) => {
  const [key, name, n, reps, , q, g] = ex; const bw = wo.isBW(key); const sg = wo.suggestions[key];
  const target = bw ? sg.reps.map(r => r ?? "max").join(", ") : `${sg.w} lb × ${sg.reps.join(", ")}`;
  return (
    <div className="exl">
      <div className="hd"><IconBubble name={ei < 3 ? "push" : "pull"}/><div style={{minWidth:0}}><b>{name}</b><small>{n} × {reps}{bw ? "" : ` · ${sg.w} lb`}</small></div><span className="chip">{target.length > 18 ? (sg.w ? sg.w + " lb" : "max") : target}</span></div>
      <div className="links"><a href={g} target="_blank" rel="noopener">guide</a> · <a href={howTo(q)} target="_blank" rel="noopener">video</a> · <a href="#" onClick={e => { e.preventDefault(); onFocus(ei); }}>focus</a> · <span>{sg.why}</span></div>
      <div className="setrows">{Array.from({length:n}, (_, i) => <SetRow key={i} ex={ex} i={i} wo={wo} draft={draft} setDraft={setDraft} onSave={onSave} current={wo.ptr.ei === ei && wo.ptr.si === i}/>)}</div>
      <div className={`exstatus ${status && status.key === key ? (status.ok ? "ok" : "bad") : ""}`}>{status && status.key === key ? status.text : ""}</div>
    </div>
  );
};

export function WorkoutPage({ data, wo, date, onBack, onFocus }){
  const [draft, setDraft] = useState({});
  const [w, setW] = useState(""); const [r, setR] = useState("");
  const [note, setNote] = useState(wo.session?.note || "");
  const [status, setStatus] = useStatus(3000);
  const [exStatus, setExStatus] = useState(null);
  const [finishStatus, setFinish] = useStatus();
  const [busy, setBusy] = useState(false);
  const [nextText, setNextText] = useState("");
  const { prime, beep } = useBeep();
  const timer = useRestTimer(beep);
  const cur = wo.day.ex[wo.ptr.ei];
  useEffect(() => { if (!cur) return; const [key] = cur; const sg = wo.suggestions[key]; const sv = wo.savedSet(key, wo.ptr.si); setW(wo.isBW(key) ? "" : String(sv ? sv.w : sg.w)); setR(String(sv ? sv.r : (sg.reps[wo.ptr.si] ?? ""))); }, [wo.ptr, wo.id]); // eslint-disable-line
  useEffect(() => { setDraft({}); timer.stop(); setNote(wo.session?.note || ""); }, [wo.id]); // eslint-disable-line

  const startRest = (key, isLast, nxt) => { const nex = wo.day.ex[nxt.ei]; setNextText(`Next: ${nex[1]} · set ${nxt.si + 1} of ${nex[2]}`); prime(); timer.start(wo.restFor(key, isLast)); };
  const persist = async (key, i, wv, rv, fromList) => {
    const bw = wo.isBW(key);
    if (!rv) return fromList ? setExStatus({key, text:`Enter the reps for set ${i + 1}.`}) : setStatus("Enter the reps you got.");
    if (!bw && !wv) return fromList ? setExStatus({key, text:`Enter the weight for set ${i + 1}.`}) : setStatus("Enter the weight.");
    setBusy(true);
    try { await wo.save(key, i, wv, rv); } catch (e) { setBusy(false); const m = data.api.friendlyDbError(e); return fromList ? setExStatus({key, text:m}) : setStatus(m); }
    setBusy(false);
    setDraft(d => { const n = {...d}; delete n[`${key}_${i}_w`]; delete n[`${key}_${i}_r`]; return n; });
    if (fromList) { setExStatus({key, text:`Set ${i + 1} saved: ${bw ? rv + " reps" : wv + " × " + rv}.`, ok:true}); setTimeout(() => setExStatus(s => s && s.key === key ? null : s), 3000); } else setStatus("", true);
    const from = fromList ? {ei: wo.day.ex.findIndex(e => e[0] === key), si:i} : wo.ptr;
    const nxt = wo.nextOpen(from);
    if (!nxt) { setFinish("All sets logged. Tap Finish session.", true); timer.stop(); return; }
    const ex = wo.day.ex[from.ei]; startRest(key, i + 1 >= ex[2], nxt); wo.setPtr(nxt);
  };
  const finish = async () => {
    const pending = [];
    wo.day.ex.forEach(([key, , n]) => { for (let i = 0; i < n; i++) { const bw = wo.isBW(key); const sv = wo.savedSet(key, i); const dw = draft[`${key}_${i}_w`], dr = draft[`${key}_${i}_r`]; if (dr !== undefined && +dr && !(sv && +dr === sv.r && (bw || +dw === sv.w))) pending.push({key, i, w: bw ? 0 : +(dw ?? (sv ? sv.w : wo.suggestions[key].w)), r:+dr}); } });
    if (!pending.length && !note.trim() && !wo.session) return setFinish("Nothing to save yet.");
    try { await wo.finish(pending, note.trim()); setDraft({}); timer.stop(); setFinish(`Session saved: ${wo.day.name}, ${fmtDate(date)}.`, true); } catch (e) { setFinish(data.api.friendlyDbError(e)); }
  };
  return (
    <section id="log">
      <PageHeader left={<BackButton onClick={onBack}/>} title={`Day ${data.program.findIndex(d => d.key === wo.day.key) + 1} ${wo.day.name}`} sub={`${wo.day.focus} · ${fmtDate(date)}`} />
      <StartCard wo={wo} timer={timer} nextText={nextText} onSkipRest={() => timer.stop()} onStart={() => { const p = wo.nextOpen(); if (p) wo.setPtr(p); onFocus(); }}/>
      <textarea className="note" value={note} onChange={e => setNote(e.target.value)} placeholder="Session notes: energy, sleep, what felt heavy (saved with Finish)"/>
      <div>{wo.day.ex.map((ex, ei) => <ExerciseCard key={ex[0] + ei} ex={ex} ei={ei} wo={wo} draft={draft} setDraft={setDraft} status={exStatus} onSave={(key, i, wv, rv) => persist(key, i, wv, rv, true)} onFocus={ei => { let si = 0; const ex = wo.day.ex[ei]; for (let k = 0; k < ex[2]; k++) if (!wo.savedSet(ex[0], k)) { si = k; break; } wo.setPtr({ei, si}); onFocus(); }}/>)}</div>
      <Status text={finishStatus.text} ok={finishStatus.ok}/>
      <div className="fsave"><button className={`pill big ${finishStatus.ok && finishStatus.text ? "saved" : ""}`} onClick={finish}>{finishStatus.ok && finishStatus.text ? <><Icon name="tick" className="gicon"/><span>Session saved</span></> : "Finish session"}</button></div>
    </section>
  );
}
