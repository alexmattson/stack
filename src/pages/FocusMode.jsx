import React, { useState, useEffect } from "react";
import { PageHeader, BackButton, IconButton, Pill, BigInput, IMG, useStatus, useBeep } from "../components/ui.jsx";
import { useRestTimer } from "../hooks/useRestTimer.js";
import { exImg, howTo, TIMED } from "../lib/program.js";

const Segments = ({ wo }) => <div className="seg">{wo.day.ex.flatMap((e, ei) => Array.from({length:e[2]}, (_, si) => <i key={`${ei}-${si}`} className={`${wo.savedSet(e[0], si) ? "done" : ""} ${ei === wo.ptr.ei && si === wo.ptr.si ? "cur" : ""}`}/>))}</div>;

const RestCard = ({ timer, nextText, onNext }) => (
  <div className={`fcard frest ${timer.done ? "go" : ""}`}>
    <div className="eyebrow">{timer.done ? "Go" : "Rest"}</div>
    <div className="ringbox"><svg className="ring2" viewBox="0 0 120 120"><circle className="tr" cx="60" cy="60" r="52"/><circle className="pr" cx="60" cy="60" r="52" strokeDasharray="326.7" strokeDashoffset={(326.7 * (1 - timer.frac)).toFixed(1)}/></svg><div className="time">{timer.text}</div></div>
    <div className="next">{nextText}</div>
    <img src={IMG("stretch.png")} alt="" style={{width:150, height:"auto", margin:"-6px auto 10px", display:"block", opacity:.9}}/>
    <div className="btns"><Pill ghost onClick={() => timer.add(30)}>+30s</Pill><Pill onClick={onNext}>{timer.done ? "Start next set" : "Skip rest"}</Pill></div>
  </div>
);

export function FocusMode({ data, wo, onBack, onHome }){
  const [phase, setPhase] = useState("set");   // set | rest | finish
  const [w, setW] = useState(""); const [r, setR] = useState("");
  const [status, setStatus] = useStatus(3000);
  const [nextPtr, setNextPtr] = useState(null); const [nextText, setNextText] = useState("");
  const [busy, setBusy] = useState(false);
  const { prime, beep } = useBeep(); const timer = useRestTimer(beep);
  const ex = wo.day.ex[wo.ptr.ei]; const [key, name, n, reps, , q, g] = ex || []; const bw = ex && wo.isBW(key); const sg = ex && wo.suggestions[key]; const sv = ex && wo.savedSet(key, wo.ptr.si);
  useEffect(() => { if (!ex) return; setW(bw ? "" : String(sv ? sv.w : sg.w)); setR(String(sv ? sv.r : (sg.reps[wo.ptr.si] ?? ""))); setStatus(""); }, [wo.ptr, wo.id]); // eslint-disable-line
  const done = async () => {
    const wv = bw ? 0 : +w || 0, rv = +r || 0;
    if (!rv) return setStatus("Enter the reps you got."); if (!bw && !wv) return setStatus("Enter the weight.");
    setBusy(true); try { await wo.save(key, wo.ptr.si, wv, rv); } catch (e) { setBusy(false); return setStatus(data.api.friendlyDbError(e)); } setBusy(false);
    const nxt = wo.nextOpen(wo.ptr);
    if (!nxt) { timer.stop(); setPhase("finish"); return; }
    const nex = wo.day.ex[nxt.ei]; setNextText(`Next: ${nex[1]} · set ${nxt.si + 1} of ${nex[2]}`); setNextPtr(nxt); prime(); timer.start(wo.restFor(key, wo.ptr.si + 1 >= n)); setPhase("rest");
  };
  const advance = () => { timer.stop(); if (nextPtr) wo.setPtr(nextPtr); setPhase("set"); };
  const prev = () => { timer.stop(); let p = {...wo.ptr}; if (p.si > 0) p.si--; else if (p.ei > 0) { p.ei--; p.si = wo.day.ex[p.ei][2] - 1; } wo.setPtr(p); setPhase("set"); };
  const skip = () => { timer.stop(); let p = {...wo.ptr}; if (p.si < wo.day.ex[p.ei][2] - 1) p.si++; else if (p.ei < wo.day.ex.length - 1) { p.ei++; p.si = 0; } else { setPhase("finish"); return; } wo.setPtr(p); setPhase("set"); };
  return (
    <section id="focus">
      <div className="wrap">
        <PageHeader left={<BackButton onClick={onBack} label="Back to workout"/>} title={wo.day.name} sub={`Set ${wo.flatIndex(wo.ptr) + 1} of ${wo.total}${ex ? " · " + name : ""}`} right={<IconButton name="close" label="Home" onClick={onHome}/>}/>
        <Segments wo={wo}/>
        {phase === "set" && ex && (
          <div className="fcard">
            <div className="ftop">
              <img className="fimg" src={exImg(key)} alt=""/>
              <div className="eyebrow">Lift {wo.ptr.ei + 1} of {wo.day.ex.length} · set {wo.ptr.si + 1} of {n} · target {reps}</div>
              <h2>{name}</h2>
              <div className="muted" style={{fontSize:".85rem"}}><a href={g} target="_blank" rel="noopener">guide</a> · <a href={howTo(q)} target="_blank" rel="noopener">video</a></div>
              <div className="why">{(sv ? `Logged ${bw ? sv.r + " reps" : sv.w + " × " + sv.r}. ` : "") + sg.why}</div>
            </div>
            <div className="bigs">
              <BigInput id="f-w" label="Weight lb" value={bw ? "" : w} onChange={setW} step={5} disabled={bw} placeholder={bw ? "BW" : ""}/>
              <BigInput id="f-r" label={TIMED.has(key) ? "Seconds" : "Reps"} value={r} onChange={setR} step={1}/>
            </div>
            <button className="done-btn" onClick={done} disabled={busy}>{sv ? "Update set" : "Finish set"}</button>
            <div className={`exstatus ${status.text ? "bad" : ""}`} style={{textAlign:"center", marginTop:8}}>{status.text}</div>
          </div>
        )}
        {phase === "rest" && <RestCard timer={timer} nextText={nextText} onNext={advance}/>}
        {phase === "finish" && (
          <div className="fcard" style={{textAlign:"center"}}>
            <img src={IMG("hero-done.png")} alt="" style={{width:120, height:"auto", margin:"0 auto 8px", display:"block"}}/>
            <div className="eyebrow">Workout complete</div><h2>{wo.day.name} done</h2>
            <p className="muted">{wo.doneCount} sets logged. Add a note on the workout page if you want, then finish.</p>
            <Pill big onClick={onHome}>Finish</Pill>
          </div>
        )}
        <div className="fnext"><button className="link" onClick={prev}>‹ Previous set</button><button className="link" onClick={skip}>Skip set ›</button></div>
      </div>
    </section>
  );
}
