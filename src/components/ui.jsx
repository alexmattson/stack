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

export function useBeep(){
  const ctx = React.useRef(null);
  const prime = () => { try { if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)(); ctx.current.resume(); } catch (e) {} };
  const tone = (freq, at, dur, vol = 0.25, type = "sine") => { const c = ctx.current; if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq; o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.0001, c.currentTime + at); g.gain.exponentialRampToValueAtTime(vol, c.currentTime + at + .015); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur); o.start(c.currentTime + at); o.stop(c.currentTime + at + dur + .02); };
  // one short tick per second for the last ten seconds
  const tick = n => { try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {} try { tone(n <= 3 ? 1046 : 880, 0, .08, 0.18); } catch (e) {} };
  // "go": a rising three-note chime, clearly different from the ticks
  const beep = () => {
    try { if (navigator.vibrate) navigator.vibrate([250, 80, 250, 80, 400]); } catch (e) {}
    try { tone(660, 0, .16, .3, "triangle"); tone(880, .18, .16, .3, "triangle"); tone(1320, .36, .45, .32, "triangle"); } catch (e) {}
  };
  return { prime, beep, tick };
}
