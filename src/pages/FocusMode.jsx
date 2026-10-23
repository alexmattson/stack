import React, { useState, useEffect, useRef } from "react";
import { PageHeader, BackButton, IconButton, Pill, BigInput, IMG, useStatus, useBeep, Icon } from "../components/ui.jsx";
import { useRestTimer } from "../hooks/useRestTimer.js";
import { exImg, TIMED, LIB_BY_KEY } from "../lib/program.js";
import { platesPerSide, plateText } from "../lib/warmup.js";
import { ConfirmSheet } from "../components/ui.jsx";

const Segments = ({ wo }) => <div className="seg">{wo.sequence.map(p => <i key={`${p.ei}-${p.si}-${p.wu ?? "s"}`} className={`${p.wu !== undefined ? "wu" : ""} ${!wo.isOpen(p) ? "done" : ""} ${p.ei === wo.ptr.ei && p.si === wo.ptr.si && (p.wu ?? -1) === (wo.ptr.wu ?? -1) ? "cur" : ""}`}/>)}</div>;

const RestCard = ({ timer, nextText, nextGuide, nextImg, nextTarget, nextPlates, onNext }) => (
  <div className={`fcard frest ${timer.done ? "go" : ""}`}>
    <div className="eyebrow">{timer.done ? "Go" : "Rest"}</div>
    <div className="ringbox"><svg className="ring2" viewBox="0 0 120 120"><circle className="tr" cx="60" cy="60" r="52"/><circle className="pr" cx="60" cy="60" r="52" strokeDasharray="326.7" strokeDashoffset={(326.7 * (1 - timer.frac)).toFixed(1)}/></svg><div className="time">{timer.text}</div></div>
    <div className="next">{nextText}{nextGuide && <> · <a href={nextGuide} target="_blank" rel="noopener">guide</a></>}</div>
    {nextTarget && <div className="nexttarget"><span><small>Weight</small><b>{nextTarget.w}</b></span><span className="x">×</span><span><small>{nextTarget.label}</small><b>{nextTarget.r}</b></span></div>}
    {nextPlates && <div className="plates" style={{marginTop:-6}}>{nextPlates}</div>}
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
  const ex = wo.day.ex[wo.ptr.ei]; const [key, name, n, reps, , q, g, pair] = ex || []; const bw = ex && wo.isBW(key); const sg = ex && wo.suggestions[key]; const sv = ex && wo.savedSet(key, wo.ptr.si);
  const equipOf = k => (LIB_BY_KEY[k] || {}).equip;
  const plateLine = (k, wv) => { const eq = equipOf(k); if (eq !== "bb" && eq !== "ez") return null; const bar = eq === "ez" ? data.gear.ezbar.bar : data.gear.barbell.bar; const per = platesPerSide(+wv || 0, bar, data.gear.barbell.plates); return per === null ? `Can't load ${wv} lb exactly with your plates` : `Per side: ${plateText(per)}`; };
  const isWu = wo.ptr.wu !== undefined; const wuTotal = isWu ? wo.sequence.filter(x => x.ei === wo.ptr.ei && x.wu !== undefined).length : 0;
  const [noteOpen, setNoteOpen] = useState(false); const [noteText, setNoteText] = useState("");
  const [swapOpen, setSwapOpen] = useState(false); const [swapping, setSwapping] = useState(false);
  useEffect(() => { setNoteText(data.notes[key] || ""); setNoteOpen(false); setSwapOpen(false); }, [key]); // eslint-disable-line
  const partnerName = pair ? (wo.day.ex.find((x, j) => x[7] === pair && j !== wo.ptr.ei) || [])[1] : null;
  useEffect(() => { if (!ex) return; setW(bw ? "" : String(sv ? sv.w : sg.w)); setR(String(sv ? sv.r : (sg.reps[wo.ptr.si] ?? ""))); setEffort(sv && sv.e ? sv.e : 2); setStatus(""); setPr(null); }, [wo.ptr, wo.id]); // eslint-disable-line
  const done = async () => {
    const wv = bw ? 0 : +w || 0, rv = +r || 0;
    if (!rv) return setStatus("Enter the reps you got."); if (!bw && !wv) return setStatus("Enter the weight.");
    setBusy(true); let hit = null; try { hit = await wo.save(key, wo.ptr.si, wv, rv, effort); } catch (e) { setBusy(false); return setStatus(data.api.friendlyDbError(e)); } setBusy(false);
    if (hit) { setPr(hit); try { if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 120]); } catch (e) {} }
    const nxt = wo.nextOpen(wo.ptr);
    if (!nxt) { timer.stop(); setPhase("finish"); return; }
    const nex = wo.day.ex[nxt.ei]; const ss = ex[7] && ex[7] === nex[7] && nxt.ei !== wo.ptr.ei; const nsg = wo.suggestions[nex[0]]; const nsv = wo.savedSet(nex[0], nxt.si); const nbw = wo.isBW(nex[0]);
    const isNextWu = nxt.wu !== undefined;
    setNextText(isNextWu ? `Warm-up ${nxt.wu + 1}: ${nex[1]}` : `${ss ? "Superset → " : "Next: "}${nex[1]} · set ${nxt.si + 1} of ${nex[2]}`);
    const nw = isNextWu ? nxt.w : (nsv ? nsv.w : nsg.w); const pl = plateLine(nex[0], nw);
    setNextMeta({guide: nex[6], img: exImg(nex[0]), plates: pl, target: {w: nbw ? "BW" : `${nw} lb`, r: isNextWu ? nxt.r : (nsv ? nsv.r : (nsg.reps[nxt.si] ?? "max")), label: TIMED.has(nex[0]) ? "Seconds" : "Reps"}}); setNextPtr(nxt); nextRef.current = nxt; prime(); timer.start(wo.restFor(key, wo.isLastInSeq(wo.ptr) || (wo.nextInSeq(wo.ptr).ei !== wo.ptr.ei && !ss), wo.ptr, nxt)); setPhase("rest");
  };
  const advance = () => { timer.stop(); nextRef.current = null; if (nextPtr) wo.setPtr(nextPtr); setPhase("set"); };
  const prev = () => { timer.stop(); nextRef.current = null; wo.setPtr(wo.prevInSeq(wo.ptr)); setPhase("set"); };
  const skip = () => { timer.stop(); nextRef.current = null; if (wo.isLastInSeq(wo.ptr)) { setPhase("finish"); return; } wo.setPtr(wo.nextInSeq(wo.ptr)); setPhase("set"); };
  return (
    <section id="focus">
      <div className="wrap">
        <PageHeader left={<BackButton onClick={onBack} label="Back to workout"/>} title={wo.isDeload ? `${wo.day.name} · deload` : wo.day.name} sub={isWu ? `Warm-up · ${name}` : `Set ${wo.workingIndex(wo.ptr)} of ${wo.total}${ex ? " · " + name : ""}`} right={<IconButton name="close" label="Home" onClick={onHome}/>}/>
        <Segments wo={wo}/>
        {phase === "set" && ex && isWu && (
          <div className="fcard wucard">
            <div className="ftop">
              <img className="fimg" src={exImg(key)} alt=""/>
              <div className="eyebrow">Warm-up {wo.ptr.wu + 1} of {wuTotal} · before {name}</div>
              <h2>{name}</h2>
              <div className="why">Light and smooth. Groove the movement; don't chase reps.{plateLine(key, wo.ptr.w) ? ` ${plateLine(key, wo.ptr.w)}.` : ""}</div>
            </div>
            <div className="wubig"><span><small>Weight</small><b>{wo.ptr.w}</b></span><span className="x">×</span><span><small>Reps</small><b>{wo.ptr.r}</b></span></div>
            <button className="done-btn" onClick={() => { wo.markWu(wo.ptr); const nxt = wo.nextOpen(wo.ptr); if (!nxt) { setPhase("finish"); return; } const nex = wo.day.ex[nxt.ei]; const nw = nxt.wu !== undefined ? nxt.w : (wo.savedSet(nex[0], nxt.si) ? wo.savedSet(nex[0], nxt.si).w : wo.suggestions[nex[0]].w); const nr = nxt.wu !== undefined ? nxt.r : (wo.savedSet(nex[0], nxt.si) ? wo.savedSet(nex[0], nxt.si).r : (wo.suggestions[nex[0]].reps[nxt.si] ?? "max"));
              setNextText(nxt.wu !== undefined ? `Warm-up ${nxt.wu + 1}: ${nex[1]}` : `Next: ${nex[1]} · set ${nxt.si + 1} of ${nex[2]}`); setNextMeta({guide: nex[6], img: exImg(nex[0]), plates: plateLine(nex[0], nw), target: {w: wo.isBW(nex[0]) ? "BW" : `${nw} lb`, r: nr, label:"Reps"}}); setNextPtr(nxt); nextRef.current = nxt; prime(); timer.start(45); setPhase("rest"); }}>Done</button>
          </div>
        )}
        {phase === "set" && ex && !isWu && (
          <div className="fcard">
            <div className="ftop">
              <img className="fimg" src={exImg(key)} alt=""/>
              <div className="eyebrow">Lift {wo.ptr.ei + 1} of {wo.day.ex.length} · set {wo.ptr.si + 1} of {n} · target {reps}{pair && <span className="chip ss">Superset · with {partnerName}</span>}</div>
              <h2>{name}</h2>
              <div className="muted" style={{fontSize:".85rem"}}><a href={g} target="_blank" rel="noopener">guide</a> · <button className="linkbtn" onClick={() => setSwapOpen(true)}>swap</button> · <button className="linkbtn" onClick={() => setNoteOpen(o => !o)}>{data.notes[key] ? "note" : "add note"}</button></div>
              {data.notes[key] && !noteOpen && <div className="exnote" onClick={() => setNoteOpen(true)}>{data.notes[key]}</div>}
              {noteOpen && <div className="exnote-edit"><textarea value={noteText} placeholder="Seat height, grip, cues… shows every time this lift comes up" onChange={e => setNoteText(e.target.value)}/><div className="rowi" style={{margin:"6px 0 0", gap:8}}><Pill className="mini" onClick={async () => { try { await data.api.saveNote(key, noteText.trim()); } catch (e) {} setNoteOpen(false); }}>Save note</Pill><Pill ghost className="mini" onClick={() => setNoteOpen(false)}>Cancel</Pill></div></div>}
              <div className="why">{(sv ? `Logged ${bw ? sv.r + " reps" : sv.w + " × " + sv.r}. ` : "") + sg.why}</div>
            </div>
            <div className="bigs">
              <BigInput id="f-w" label="Weight lb" value={bw ? "" : w} onChange={setW} step={5} disabled={bw} placeholder={bw ? "BW" : ""}/>
              <BigInput id="f-r" label={TIMED.has(key) ? "Seconds" : "Reps"} value={r} onChange={setR} step={1}/>
            </div>
            {plateLine(key, w) && <div className="plates">{plateLine(key, w)}</div>}
            <div className="effort"><span className="eyebrow">How hard was it?</span><div className="segc">{[[1,"Easy","3+ left"],[2,"Hard","1–2 left"],[3,"Max","nothing left"]].map(([v, l, s]) => <button key={v} aria-pressed={effort === v} onClick={() => setEffort(v)}><b>{l}</b><small>{s}</small></button>)}</div></div>
            <button className="done-btn" onClick={done} disabled={busy}>{sv ? "Update set" : "Finish set"}</button>
            <div className={`exstatus ${status.text ? "bad" : ""}`} style={{textAlign:"center", marginTop:8}}>{status.text}</div>
          </div>
        )}
        {swapOpen && <div className="sheet-wrap" onClick={() => setSwapOpen(false)}><div className="sheet" onClick={e => e.stopPropagation()}>
          <b className="sheet-t">Swap {name}</b><p className="muted">Same muscle, with what you have. Only for today's session.</p>
          <div className="swaplist">{wo.alts(key).length ? wo.alts(key).map(a => <button key={a.key} className="swaprow" disabled={swapping} onClick={async () => { setSwapping(true); try { await wo.swap(key, a); } catch (e) {} setSwapping(false); setSwapOpen(false); }}><img src={exImg(a.key)} alt=""/><span><b>{a.name}</b><small>{a.kind === "compound" ? "Compound" : "Isolation"}{a.bw ? " · bodyweight" : ""}</small></span></button>) : <div className="empty">No alternative for this muscle with your equipment.</div>}</div>
          <Pill ghost onClick={() => setSwapOpen(false)}>Cancel</Pill>
        </div></div>}
        {phase === "rest" && pr && <div className="prtoast"><Icon name="bolt" className="gicon"/><span>{pr.text}</span></div>}
        {phase === "rest" && <RestCard timer={timer} nextText={nextText} nextGuide={nextMeta.guide} nextImg={nextMeta.img} nextTarget={nextMeta.target} nextPlates={nextMeta.plates} onNext={advance}/>}
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
