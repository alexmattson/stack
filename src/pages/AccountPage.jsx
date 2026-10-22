import React, { useState } from "react";
import { PageHeader, BackButton, Card, Pill, RowCard, IconBubble, Logo, Status, useStatus } from "../components/ui.jsx";
import { DOW, today } from "../lib/dates.js";
import SEED from "../seed.json";

export function AccountPage({ data, auth, onBack, onManage, go, onReplayOnboarding }){
  const { sessions, bodylog, gear, prog, trainingDays, api } = data;
  const u = auth.user; const g = u && !u.isAnonymous; const [st, setSt] = useStatus();
  const dbs = gear.dumbbells.slice().sort((a, b) => a - b);
  const exportData = () => { const blob = new Blob([JSON.stringify({exportedAt:new Date().toISOString(), sessions, bodylog, settings:{schedule:{trainingDays}, equipment:gear, program:prog}}, null, 2)], {type:"application/json"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `stack-export-${today()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };
  const importSeed = async () => { try { await api.importSeed(SEED); setSt(`Imported ${Object.keys(SEED.sessions || {}).length} session(s) and your settings.`, true); } catch (e) { setSt("Import failed: " + e.message); } };
  return (
    <section id="settings">
      <PageHeader left={<BackButton onClick={onBack}/>} title="Account" sub="Sync, data and app details"/>
      <Card tone="aqua" style={{display:"grid", gap:12}}>
        <RowCard icon={<IconBubble name="user"/>} title={g ? (u.displayName || u.email || "Signed in") : "Device only"} sub={g ? `${u.email || "Google account"} · progress follows you everywhere.` : "Saved on this device. Sign in to keep it everywhere you train."}/>
        {!g && <Pill big onClick={auth.google}>Continue with Google</Pill>}
        {g && <Pill big ghost onClick={auth.logout}>Sign out</Pill>}
        <Status text={auth.error}/>
      </Card>
      <h2>Your data</h2>
      <Card style={{display:"grid", gap:10}}>
        <RowCard icon={<IconBubble name="download"/>} title="Export" sub="Download every session, weigh-in and setting as a file." right={<Pill ghost style={{padding:"9px 14px"}} onClick={exportData}>Export</Pill>}/>
        {sessions.length === 0 && <RowCard icon={<IconBubble name="upload"/>} title="Import old log" sub="Bring in the workout from the first version of the app." right={<Pill ghost style={{padding:"9px 14px"}} onClick={importSeed}>Import</Pill>}/>}
        <Status text={st.text} ok={st.ok}/>
      </Card>
      <h2>Training</h2>
      <Card style={{display:"grid", gap:10}}>
        <RowCard icon={<IconBubble name="cal"/>} title="Training days" sub={trainingDays.length ? trainingDays.map(d => DOW[d]).join(", ") : "None set"} right={<Pill ghost style={{padding:"9px 14px"}} onClick={() => go("schedule")}>Edit</Pill>}/>
        <RowCard icon={<IconBubble name="bolt"/>} title="Goals" sub={`${prog.focus.map(f => f[0].toUpperCase() + f.slice(1)).join(" + ")} · ${prog.goal} · ${({short:"30", standard:"45", long:"60"})[prog.length]} min`} right={<Pill ghost style={{padding:"9px 14px"}} onClick={() => go("goals")}>Edit</Pill>}/>
        <RowCard icon={<IconBubble name="push"/>} title="Exercises" sub={(prog.excluded || []).length ? `${prog.excluded.length} turned off` : "All available moves on"} right={<Pill ghost style={{padding:"9px 14px"}} onClick={() => go("exercises")}>Edit</Pill>}/>
        <RowCard icon={<IconBubble name="gear"/>} title="Equipment" sub={[(gear.equipment||[]).includes("dumbbells") && dbs.length ? `DB ${dbs[0]}–${dbs[dbs.length - 1]}` : "no dumbbells", gear.bench === "none" ? "no bench" : gear.bench + " bench", (gear.equipment||[]).includes("barbell") ? `bar to ${gear.barbell.max}` : null, (gear.equipment||[]).includes("kettlebell") && gear.kettlebells.length ? `KB ${gear.kettlebells.slice().sort((a,b)=>a-b).join("/")}` : null, (gear.equipment||[]).includes("cable") ? `cable to ${gear.cable.max}` : null].filter(Boolean).join(" · ")} right={<Pill ghost style={{padding:"9px 14px"}} onClick={() => go("gear")}>Edit</Pill>}/>
      </Card>
      {(auth.admin || data.isAdmin) && <>
        <h2>Admin</h2>
        <Card style={{display:"grid", gap:10}}>
          <RowCard icon={<IconBubble name="bolt"/>} title="Run onboarding" sub="Walk the first-time flow again. Finishing it overwrites your goals, schedule and equipment; Exit keeps everything." right={<Pill ghost style={{padding:"9px 14px"}} onClick={onReplayOnboarding}>Start</Pill>}/>
          <RowCard icon={<IconBubble name="user"/>} title="Admin account" sub={data.isAdmin ? `${u.email || "this account"} · isAdmin set in Firestore` : `${u.email} · listed in the app`}/>
        </Card>
      </>}
      <h2>About</h2>
      <Card className="rowcard"><Logo size={44}/><div className="grow"><b>Stack</b><small>Progressive training. Show up, stack it up.</small><small style={{display:"block", color:"var(--muted)", fontSize:".72rem"}}>Build {typeof __BUILD__ !== "undefined" ? __BUILD__ : "dev"}</small></div></Card>
    </section>
  );
}
