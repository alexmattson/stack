// Calendar planning: which workout lands on which date, driven by the log.
import { iso, today, dowOf } from "./dates.js";
import { planFromStore } from "./program.js";

export const sessionSetCount = s => Object.values(s.sets || {}).reduce((a, arr) => a + arr.filter(x => x.r).length, 0);
export const sessionTotal = (s, program) => { const di = program.findIndex(d => d.key === s.day); const ex = s.plan ? planFromStore(s.plan) : (program[di] ? program[di].ex : []); return ex.reduce((a, e) => a + e[2], 0); };
export const sessionComplete = (s, program) => sessionSetCount(s) >= (sessionTotal(s, program) || 1);
export const sessionFor = (sessions, date) => sessions.filter(s => s.date === date).sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""))[0];

export function nextDayIdx(sessions, program){
  const done = sessions.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.savedAt || "").localeCompare(a.savedAt || ""));
  if (!done.length || !program.length) return 0;
  const i = program.findIndex(d => d.key === done[0].day);
  return (i + 1) % program.length;
}

// Map of date -> {kind, idx} covering the given month, projected forward from today.
export function buildPlan(y, m, sessions, program, trainingDays){
  const map = {}, byDate = {};
  sessions.forEach(s => { (byDate[s.date] = byDate[s.date] || []).push(program.findIndex(d => d.key === s.day)); });
  const t = today();
  const firstLogged = Object.keys(byDate).sort()[0] || t;
  let idx = nextDayIdx(sessions, program);
  const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
  const cur = new Date(); cur.setHours(0, 0, 0, 0);
  const horizonEnd = last > cur ? last : cur;
  for (let d = new Date(cur); d <= horizonEnd; d.setDate(d.getDate() + 1)) {
    const k = iso(d);
    if (byDate[k]) continue;
    if (trainingDays.includes(d.getDay()) && program.length) { map[k] = {kind:"plan", idx}; idx = (idx + 1) % program.length; }
  }
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const k = iso(d);
    if (byDate[k]) map[k] = {kind:"done", idx:byDate[k][0], n:byDate[k].length};
    else if (map[k]) continue;
    else if (k < t && k > firstLogged && trainingDays.includes(d.getDay())) map[k] = {kind:"miss"};
    else map[k] = {kind:"rest"};
  }
  return map;
}
export function plannedDayFor(date, sessions, program, trainingDays){
  const d = new Date(date + "T12:00:00"); const plan = buildPlan(d.getFullYear(), d.getMonth(), sessions, program, trainingDays); const p = plan[date];
  return p && p.idx !== undefined && p.idx >= 0 ? p.idx : nextDayIdx(sessions, program);
}
export const isTrainingDate = (date, trainingDays) => trainingDays.includes(dowOf(date));
