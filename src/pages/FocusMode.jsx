import React, { useState, useEffect, useRef } from "react";
import { PageHeader, BackButton, IconButton, Pill, BigInput, IMG, useStatus, useBeep, Icon } from "../components/ui.jsx";
import { useRestTimer } from "../hooks/useRestTimer.js";
import { exImg, TIMED } from "../lib/program.js";

const Segments = ({ wo }) => <div className="seg">{wo.day.ex.flatMap((e, ei) => Array.from({length:e[2]}, (_, si) => <i key={`${ei}-${si}`} className={`${wo.savedSet(e[0], si) ? "done" : ""} ${ei === wo.ptr.ei && si === wo.ptr.si ? "cur" : ""}`}/>))}</div>;

const RestCard = ({ timer, nextText, nextGuide, nextImg, nextTarget, onNext }) => (
  <div className={`fcard frest ${timer.done ? "go" : ""}`}>
    <div className="eyebrow">{timer.done ? "Go" : "Rest"}</div>
    <div className="ringbox"><svg className="ring2" viewBox="0 0 120 120"><circle className="tr" cx="60" cy="60" r="52"/><circle className="pr" cx="60" cy="60" r="52" strokeDasharray="326.7" strokeDashoffset={(326.7 * (1 - timer.frac)).toFixed(1)}/></svg><div className="time">{timer.text}</div></div>
    <div className="next">{nextText}{nextGuide && <> · <a href={nextGuide} target="_blank" rel="noopener">guide</a></>}</div>
    {nextTarget && <div className="nexttarget"><span><small>Weight</small><b>{nextTarget.w}</b></span><span className="x">×</span><span><small>{nextTarget.label}</small><b>{nextTarget.r}</b></span></div>}
    <img src={nextImg || IMG("stretch.png")} alt="" style={{height:130, width:"auto", margin:"-6px auto 10px", display:"block", opacity:.95}}/>
    <div className="btns"><Pill ghost onClick={() => timer.add(30)}>+30s</Pill><Pill onClick={onNext}>{timer.done ? "Start next set" : "Skip rest"}</Pill></div>
  </div>
);

export function FocusMode({ data, wo, onBack, onHome }){
  const [phase, setPhase] = useState("set");   // set | rest | finish
  const [w, setW] = useState(""); const [r, setR] = useState("");
  const [status, setStatus] = useStatus(3000);
  const [nextPtr, setNextPtr] = useState(null); const [nextText, setNextText] = useState(""); const [nextMeta, setNextMeta] = useState({});
  const nextRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [effort, setEffort] = useState(2); const [pr, setPr] = useState(null);
  const { prime, beep, tick } = useBeep();
  // at zero: play the go chime, then move to the next set on its own after a short beat
  const timer = useRestTimer(() => { beep(); setTimeout(() => { const n = nextRef.current; if (n) { nextRef.current = null; wo.setPtr(n); setPhase("set"); } }, 1200); }, tick);
  const ex = wo.day.ex[wo.ptr.ei]; const [key, name, n, reps, , q, g] = ex || []; const bw = ex && wo.isBW(key); const sg = ex && wo.suggestions[key]; const sv = ex && wo.savedSet(key, wo.ptr.si);
  useEffect(() => { if (!ex) return; setW(bw ? "" : String(sv ? sv.w : sg.w)); setR(String(sv ? sv.r : (sg.reps[wo.ptr.si] ?? ""))); setEffort(sv && sv.e ? sv.e : 2); setStatus(""); setPr(null); }, [wo.ptr, wo.id]); // eslint-disable-line
  const done = async () => {
    const wv = bw ? 0 : +w || 0, rv = +r || 0;
    if (!rv) return setStatus("Enter the reps you got."); if (!bw && !wv) return setStatus("Enter the weight.");
    setBusy(true); let hit = null; try { hit = await wo.save(key, wo.ptr.si, wv, rv, effort); } catch (e) { setBusy(false); return setStatus(data.api.friendlyDbError(e)); } setBusy(false);
    if (hit) { setPr(hit); try { if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 120]); } catch (e) {} }
    const nxt = wo.nextOpen(wo.ptr);
    if (!nxt) { timer.stop(); setPhase("finish"); return; }
    const nex = wo.day.ex[nxt.ei]; setNextText(`Next: ${nex[1]} · set ${nxt.si + 1} of ${nex[2]}`); const nsg = wo.suggestions[nex[0]]; const nsv = wo.savedSet(nex[0], nxt.si); const nbw = wo.isBW(nex[0]);
    setNextMeta({guide: nex[6], img: exImg(nex[0]), target: {w: nbw ? "BW" : `${nsv ? nsv.w : nsg.w} lb`, r: nsv ? nsv.r : (nsg.reps[nxt.si] ?? "max"), label: TIMED.has(nex[0]) ? "Seconds" : "Reps"}}); setNextPtr(nxt); nextRef.current = nxt; prime(); timer.start(wo.restFor(key, wo.ptr.si + 1 >= n)); setPhase("rest");
  };
  const advance = () => { timer.stop(); nextRef.current = null; if (nextPtr) wo.setPtr(nextPtr); setPhase("set"); };
  const prev = () => { timer.stop(); nextRef.current = null; let p = {...wo.ptr}; if (p.si > 0) p.si--; else if (p.ei > 0) { p.ei--; p.si = wo.day.ex[p.ei][2] - 1; } wo.setPtr(p); setPhase("set"); };
  const skip = () => { timer.stop(); nextRef.current = null; let p = {...wo.ptr}; if (p.si < wo.day.ex[p.ei][2] - 1) p.si++; else if (p.ei < wo.day.ex.length - 1) { p.ei++; p.si = 0; } else { setPhase("finish"); return; } wo.setPtr(p); setPhase("set"); };
  return (
    <section id="focus">
      <div className="wrap">
        <PageHeader left={<BackButton onClick={onBack} label="Back to workout"/>} title={wo.isDeload ? `${wo.day.name} · deload` : wo.day.name} sub={`Set ${wo.flatIndex(wo.ptr) + 1} of ${wo.total}${ex ? " · " + name : ""}`} right={<IconButton name="close" label="Home" onClick={onHome}/>}/>
        <Segments wo={wo}/>
        {phase === "set" && ex && (
          <div className="fcard">
            <div className="ftop">
              <img className="fimg" src={exImg(key)} alt=""/>
              <div className="eyebrow">Lift {wo.ptr.ei + 1} of {wo.day.ex.length} · set {wo.ptr.si + 1} of {n} · target {reps}</div>
              <h2>{name}</h2>
              <div className="muted" style={{fontSize:".85rem"}}><a href={g} target="_blank" rel="noopener">guide</a></div>
              <div className="why">{(sv ? `Logged ${bw ? sv.r + " reps" : sv.w + " × " + sv.r}. ` : "") + sg.why}</div>
            </div>
            <div className="bigs">
              <BigInput id="f-w" label="Weight lb" value={bw ? "" : w} onChange={setW} step={5} disabled={bw} placeholder={bw ? "BW" : ""}/>
              <BigInput id="f-r" label={TIMED.has(key) ? "Seconds" : "Reps"} value={r} onChange={setR} step={1}/>
            </div>
            <div className="effort"><span className="eyebrow">How hard was it?</span><div className="segc">{[[1,"Easy","3+ left"],[2,"Hard","1–2 left"],[3,"Max","nothing left"]].map(([v, l, s]) => <button key={v} aria-pressed={effort === v} onClick={() => setEffort(v)}><b>{l}</b><small>{s}</small></button>)}</div></div>
            <button className="done-btn" onClick={done} disabled={busy}>{sv ? "Update set" : "Finish set"}</button>
            <div className={`exstatus ${status.text ? "bad" : ""}`} style={{textAlign:"center", marginTop:8}}>{status.text}</div>
          </div>
        )}
        {phase === "rest" && pr && <div className="prtoast"><Icon name="bolt" className="gicon"/><span>{pr.text}</span></div>}
        {phase === "rest" && <RestCard timer={timer} nextText={nextText} nextGuide={nextMeta.guide} nextImg={nextMeta.img} nextTarget={nextMeta.target} onNext={advance}/>}
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
