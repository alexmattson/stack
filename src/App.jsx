import React, { useState, useCallback } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useData } from "./hooks/useData.js";
import { useWorkout } from "./hooks/useWorkout.js";
import { Splash } from "./components/Splash.jsx";
import { NavRail } from "./components/NavRail.jsx";
import { LoginScreen } from "./pages/LoginScreen.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { WorkoutPage } from "./pages/WorkoutPage.jsx";
import { FocusMode } from "./pages/FocusMode.jsx";
import { SchedulePage } from "./pages/SchedulePage.jsx";
import { ProgressPage } from "./pages/ProgressPage.jsx";
import { SetupPage } from "./pages/SetupPage.jsx";
import { AccountPage } from "./pages/AccountPage.jsx";
import { today } from "./lib/dates.js";
import { sessionFor, plannedDayFor } from "./lib/plan.js";

// Simple in-app router with a back trail (no URL changes: the app runs full-screen on a phone).
function useNav(){
  const [tab, setTab] = useState("home"); const [trail, setTrail] = useState([]);
  const go = useCallback(next => setTab(cur => { if (cur !== next) setTrail(t => [...t.slice(-19), cur]); return next; }), []);
  const back = useCallback(() => setTrail(t => { const prev = t[t.length - 1] || "home"; setTab(prev); return t.slice(0, -1); }), []);
  const jump = useCallback(next => { setTrail([]); setTab(next); }, []);
  return { tab, go, back, jump };
}

function Shell({ auth }){
  const data = useData(auth.user.uid);
  const nav = useNav();
  const [wsel, setWsel] = useState({date:today(), dayIdx:0});
  const [focus, setFocus] = useState(false);
  const wo = useWorkout(data, wsel.date, wsel.dayIdx);
  const openWorkout = (date, dayIdx) => { const cur = sessionFor(data.sessions, date); setWsel({date, dayIdx: cur ? Math.max(0, data.program.findIndex(x => x.key === cur.day)) : (dayIdx ?? plannedDayFor(date, data.sessions, data.program, data.trainingDays))}); nav.go("log"); };
  if (!data.loaded) return <Splash/>;
  if (auth.state === "manage") return <LoginScreen auth={auth} manage onBack={auth.closeLogin}/>;
  return (
    <>
      <div className="wrap">
        {nav.tab === "home" && <HomePage data={data} onOpenWorkout={openWorkout}/>}
        {nav.tab === "log" && <WorkoutPage data={data} wo={wo} date={wsel.date} onBack={nav.back} onFocus={() => setFocus(true)}/>}
        {nav.tab === "schedule" && <SchedulePage data={data} onBack={nav.back} onPickDate={d => openWorkout(d)}/>}
        {nav.tab === "progress" && <ProgressPage data={data} onBack={nav.back}/>}
        {nav.tab === "gear" && <SetupPage data={data} onBack={nav.back}/>}
        {nav.tab === "settings" && <AccountPage data={data} auth={auth} onBack={nav.back} onManage={auth.openLogin} go={nav.go}/>}
      </div>
      {focus && <FocusMode data={data} wo={wo} onBack={() => setFocus(false)} onHome={() => { setFocus(false); nav.jump("home"); }}/>}
      <NavRail tab={nav.tab} onSelect={nav.jump}/>
    </>
  );
}

export default function App(){
  const auth = useAuth();
  if (auth.state === "loading") return <Splash/>;
  if (auth.state === "login") return <LoginScreen auth={auth}/>;
  return <Shell auth={auth}/>;
}
