// Small shared building blocks. Every visual primitive in the app comes from here.
import React from "react";

export const GymSwitcher = ({ data, note }) => {
  const { gyms } = data; if (!gyms || gyms.list.length < 2) return null;
  return (
    <div className="gymsw">
      <span className="eyebrow">Training at</span>
      <div className="gyms">{gyms.list.map(x => <button key={x.id} className="gymchip" aria-pressed={x.id === gyms.active} onClick={() => x.id !== gyms.active && data.api.switchGym(x.id)}>{x.name}</button>)}</div>
      {note && <small className="muted">{note}</small>}
    </div>
  );
};

export const IMG = p => `${import.meta.env.BASE_URL}img/${p}`;

export const Icon = ({ name, className = "" }) => {
  const paths = {
    home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>,
    push: <path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>,
    pull: <path d="M4 6h16M8 6v4a4 4 0 0 0 8 0V6M12 14v6M9 20h6"/>,
    cal: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    chart: <path d="M4 19V5M4 19h16M8 15l4-5 3 3 5-7"/>,
    gear: <path d="M4 7h3v10H4zM17 7h3v10h-3zM7 10h10v4H7zM2 9h2v6H2zM20 9h2v6h-2z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>,
    scale: <><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 10a4 4 0 0 1 8 0M12 10v3"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>,
    tick: <path d="M5 12l5 5 9-10"/>,
    bolt: <path d="M13 3L5 14h6l-1 7 9-12h-6z"/>,
    download: <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>,
    upload: <path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>,
    bar: <path d="M4 5h16M8 5v5a4 4 0 0 0 8 0V5"/>,
    bench: <path d="M3 14h18M5 14v5M19 14v5M8 14V9h8v5"/>,
    back: <path d="M15 5l-7 7 7 7"/>,
    next: <path d="M9 5l7 7-7 7"/>,
    close: <path d="M6 6l12 12M18 6L6 18"/>,
    expand: <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></>,
    google: <><path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"/><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5L6.4 10C7.2 7.8 9.4 6 12 6z"/></>,
  };
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{paths[name]}</svg>;
};

export const Logo = ({ size = 48, className = "" }) => (
  <span className={`logo ${className}`} style={{width:size, height:size}}>
    <svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1c5467"/><stop offset="1" stopColor="#2c7f98"/></linearGradient></defs><circle cx="24" cy="24" r="24" fill="url(#lg)"/><rect x="12" y="30" width="24" height="6" rx="3" fill="#ffffff" opacity=".55"/><rect x="9" y="22" width="30" height="6" rx="3" fill="#ffffff" opacity=".8"/><rect x="6" y="14" width="36" height="6" rx="3" fill="#ffd27a"/><circle cx="42" cy="17" r="4" fill="#f6a33e"/></svg>
  </span>
);

export const Card = ({ tone = "", className = "", style, children }) => <div className={`card ${tone} ${className}`} style={style}>{children}</div>;
export const Pill = ({ ghost, big, className = "", ...rest }) => <button className={`pill ${ghost ? "ghost" : ""} ${big ? "big" : ""} ${className}`} {...rest}/>;
export const RoundButton = ({ ghost, className = "", ...rest }) => ghost ? <div className="roundbtn ghost" aria-hidden="true"/> : <button className={`roundbtn ${className}`} {...rest}/>;
export const IconBubble = ({ name, className = "" }) => <span className={`icon ${className}`}><Icon name={name}/></span>;
export const Eyebrow = ({ children, style }) => <div className="eyebrow" style={style}>{children}</div>;
export const H2 = ({ children }) => <h2>{children}</h2>;
export const Status = ({ text, ok }) => <div className={`status ${ok ? "ok" : ""}`}>{text}</div>;
export const Ring = ({ pct, label, up }) => <span className={`ring ${up ? "up" : ""}`} style={{"--p":pct}}><span>{label}</span></span>;

// One 48 | 1fr | 48 header on every page so titles stay centered.
export const PageHeader = ({ left, right, title, sub, align = "" }) => (
  <div className="pagehead">
    <div className="lead">{left}</div>
    <div className={`ttl ${align}`}><b>{title}</b>{sub != null && <small>{sub}</small>}</div>
    {right || <RoundButton ghost/>}
  </div>
);
// Program week badge. The orange dot means today is a training day and the workout isn't logged yet.
export const WeekBadge = ({ week, alert }) => <div className={`roundbtn wkbadge ${alert ? "alert" : ""}`} title={alert ? "Program week · today's workout not logged yet" : "Program week"}><small>WK</small><b>{week}</b></div>;
export const BackButton = ({ onClick, label = "Back" }) => <RoundButton onClick={onClick} aria-label={label}><Icon name="back" className="rb-icon"/></RoundButton>;
export const IconButton = ({ name, label, onClick, title }) => <RoundButton onClick={onClick} aria-label={label} title={title}><Icon name={name} className="rb-icon"/></RoundButton>;

export const Segmented = ({ options, value, onChange, id }) => (
  <div className="segc" id={id}>{options.map(([v, label]) => <button key={v} aria-pressed={value === v} onClick={() => onChange(v)}>{label}</button>)}</div>
);
// 0–5 slider with a label for the current level.
export const LevelSlider = ({ value, onChange, labels, id }) => (
  <div className="lvl"><input type="range" id={id} min="0" max="5" step="1" value={value} onChange={e => onChange(+e.target.value)} style={{"--p": `${value / 5 * 100}%`}}/><span className="lvl-v">{labels[value]}</span></div>
);
export const Toggle = ({ on, onChange, label }) => <button className="tog" aria-pressed={on} aria-label={label} onClick={() => onChange(!on)}><i/></button>;
export const RowCard = ({ icon, title, sub, right, className = "" }) => (
  <div className={`rowcard ${className}`}>{icon}<div className="grow"><b>{title}</b>{sub != null && <small>{sub}</small>}</div>{right}</div>
);

// Big numeric field with ± steppers, used on the Now card and in focus mode.
export const BigInput = ({ id, label, value, onChange, step, disabled, placeholder }) => (
  <div className="bigin">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="number" inputMode="decimal" value={value} placeholder={placeholder} disabled={disabled} onChange={e => onChange(e.target.value)}/>
    <div className="st"><button type="button" onClick={() => !disabled && onChange(Math.max(0, (+value || 0) - step))}>−{step}</button><button type="button" onClick={() => !disabled && onChange((+value || 0) + step)}>+{step}</button></div>
  </div>
);

// Bottom sheet confirmation; the destructive action is never one tap away.
export const ConfirmSheet = ({ open, title, body, confirmLabel = "Confirm", danger, onConfirm, onCancel, busy }) => {
  if (!open) return null;
  return (
    <div className="sheet-wrap" onClick={onCancel}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <b className="sheet-t">{title}</b>
        <p className="muted">{body}</p>
        <div className="sheet-btns"><Pill ghost onClick={onCancel} disabled={busy}>Cancel</Pill><Pill className={danger ? "danger" : ""} onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</Pill></div>
      </div>
    </div>
  );
};

export function useStatus(timeout = 4000){
  const [st, setSt] = React.useState({text:"", ok:false});
  const set = React.useCallback((text, ok = false) => { setSt({text, ok}); if (ok && text) setTimeout(() => setSt(s => s.text === text ? {text:"", ok:false} : s), timeout); }, [timeout]);
  return [st, set];
}

// Sounds are rendered to tiny WAV files and played through an <audio> element rather than Web Audio.
// On iPhone, Web Audio counts as a "ringer" sound and is muted by the silent switch; media playback is not.
const SR = 22050;
function wav(parts, drive = 1){ // parts: [{f, at, dur, vol, type, f2}] seconds; drive > 1 adds soft-clip grit
  const len = Math.ceil(SR * Math.max(...parts.map(x => x.at + x.dur)) + SR * .02); const pcm = new Float32Array(len);
  for (const {f, at, dur, vol = .5, type = "sine", f2} of parts) { const s0 = Math.floor(at * SR), n = Math.floor(dur * SR);
    for (let k = 0; k < n; k++) { const t = k / SR; const env = Math.min(1, k / (SR * .01)) * Math.min(1, (n - k) / (SR * .04));
      const fk = f2 ? f + (f2 - f) * (k / n) : f; const ph = f2 ? 2 * Math.PI * (f * t + (f2 - f) * t * t / (2 * dur)) : 2 * Math.PI * f * t;
      const v = type === "triangle" ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : type === "saw" ? 2 * ((ph / (2 * Math.PI)) % 1) - 1 : type === "square" ? (Math.sin(ph) >= 0 ? .6 : -.6) : type === "noise" ? Math.random() * 2 - 1 : type === "whistle" ? Math.sin(ph) * (.6 + .4 * Math.sin(2 * Math.PI * 38 * t)) + (Math.random() - .5) * .08 : type === "drop" ? Math.sin(2 * Math.PI * f * t * Math.exp(-t * 6)) : Math.sin(ph);
      pcm[s0 + k] += v * vol * env; } }
  if (drive > 1) for (let k = 0; k < len; k++) pcm[k] = Math.tanh(pcm[k] * drive);
  let peak = 0; for (let k = 0; k < len; k++) peak = Math.max(peak, Math.abs(pcm[k])); const norm = peak > .95 ? .95 / peak : 1;
  const b = new ArrayBuffer(44 + len * 2), d = new DataView(b); const str = (o, t) => { for (let k = 0; k < t.length; k++) d.setUint8(o + k, t.charCodeAt(k)); };
  str(0, "RIFF"); d.setUint32(4, 36 + len * 2, true); str(8, "WAVE"); str(12, "fmt "); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true); d.setUint32(24, SR, true); d.setUint32(28, SR * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); str(36, "data"); d.setUint32(40, len * 2, true);
  for (let k = 0; k < len; k++) d.setInt16(44 + k * 2, Math.max(-1, Math.min(1, pcm[k] * norm)) * 32767, true);
  return URL.createObjectURL(new Blob([b], {type:"audio/wav"}));
}
let SOUNDS = null;
const sounds = () => SOUNDS || (SOUNDS = {
  silent: wav([{f:1, at:0, dur:.05, vol:0}]),
  tick: wav([{f:880, at:0, dur:.08, vol:.5}]),
  tickHi: wav([{f:1046, at:0, dur:.08, vol:.5}]),
  // GO: a referee's pea whistle — one hard blast. The two close tones and the fast warble are what make it read as a whistle.
  go: wav([
    {f:2640, at:0, dur:.75, vol:.55, type:"whistle"}, {f:2960, at:0, dur:.75, vol:.4, type:"whistle"}, {f:1320, at:0, dur:.75, vol:.08, type:"sine"},
    {f:1, at:0, dur:.03, vol:.35, type:"noise"},
  ]),
});
// How rest sounds behave next to whatever else is playing on the phone (iOS Audio Session API, Safari 17+):
//  cut  → "playback": heard even with the silent switch on, but pauses music while a sound plays; we release the
//          session right after each sound so the music comes back.
//  mix  → "transient": plays over (ducks) music without stopping it, but the silent switch mutes it.
export const SOUND_MODES = [["cut", "Cut through"], ["mix", "Over music"]];
export const getSoundMode = () => { try { return localStorage.getItem("stack.sound") === "mix" ? "mix" : "cut"; } catch (e) { return "cut"; } };
export const setSoundMode = m => { try { localStorage.setItem("stack.sound", m); } catch (e) {} };
const session = type => { try { if (navigator.audioSession) navigator.audioSession.type = type; } catch (e) {} };
export function useBeep(){
  const el = React.useRef(null); const release = React.useRef(null);
  const get = () => { if (!el.current) { const a = new Audio(); a.setAttribute("playsinline", ""); a.preload = "auto";
    // when a sound finishes, hand the audio session back so the music resumes
    a.addEventListener("ended", () => { clearTimeout(release.current); release.current = setTimeout(() => { try { a.removeAttribute("src"); a.load(); } catch (e) {} session("ambient"); }, 150); });
    el.current = a; } return el.current; };
  const play = (src, type) => { try { clearTimeout(release.current); session(type); const a = get(); a.src = src; a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
  const live = () => getSoundMode() === "cut" ? "playback" : "transient";
  // Must run inside a tap: unlocks the element so later plays work without a gesture. Ambient, so it never touches the music.
  const prime = () => { try { sounds(); play(sounds().silent, "ambient"); } catch (e) {} };
  // one short tick per second for the last ten seconds
  const tick = n => { try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {} play(n <= 3 ? sounds().tickHi : sounds().tick, live()); };
  // "go": a rising three-note chime, clearly different from the ticks
  const beep = () => { try { if (navigator.vibrate) navigator.vibrate([250, 80, 250, 80, 400]); } catch (e) {} play(sounds().go, live()); };
  return { prime, beep, tick };
}
