export const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const iso = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
export const today = () => iso(new Date());
export const fmtDate = s => { const [y, m, d] = s.split("-"); return new Date(y, m - 1, d).toLocaleDateString(undefined, {month:"short", day:"numeric"}); };
export const addDays = (date, n) => { const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d); };
export const dowOf = date => new Date(date + "T12:00:00").getDay();
export const weekStart = (date = today()) => { const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
export function weekNumber(sessions, bodylog){
  const dates = [...sessions.map(s => s.date), ...bodylog.map(b => b.date)].sort();
  if (!dates.length) return 1;
  const start = new Date(dates[0] + "T12:00:00");
  return Math.max(1, Math.floor((Date.now() - start) / 864e5 / 7) + 1);
}
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
