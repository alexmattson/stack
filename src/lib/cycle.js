// Mesocycles: blocks of BUILD_WEEKS progressive weeks followed by one deload week.
// The cycle clock starts at the first logged session (or an explicit start date).
import { today } from "./dates.js";

export const BUILD_WEEKS = 4;
export const CYCLE_WEEKS = BUILD_WEEKS + 1;

export function cycleInfo(sessions, cycleStart, date = today()){
  const dates = sessions.map(s => s.date).sort();
  const start = cycleStart || dates[0];
  if (!start) return {week:1, cycle:1, deload:false, phase:"build", start:null, weeksIn:0, buildWeeks:BUILD_WEEKS, cycleWeeks:CYCLE_WEEKS};
  const days = Math.floor((new Date(date + "T12:00:00") - new Date(start + "T12:00:00")) / 864e5);
  const weeksIn = Math.max(0, Math.floor(days / 7));
  const cycle = Math.floor(weeksIn / CYCLE_WEEKS) + 1;
  const week = (weeksIn % CYCLE_WEEKS) + 1;
  const deload = week === CYCLE_WEEKS;
  return {week, cycle, deload, phase: deload ? "deload" : week === 1 && cycle > 1 ? "new block" : "build", start, weeksIn, buildWeeks:BUILD_WEEKS, cycleWeeks:CYCLE_WEEKS};
}

// Deload: half the sets (never below 2), same weight as last time, bottom of the rep range.
export const deloadSets = n => Math.max(2, Math.ceil(n / 2));
