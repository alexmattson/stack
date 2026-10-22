import React from "react";
import { Logo, Pill, Icon, IMG, IconBubble } from "../components/ui.jsx";

export function LoginScreen({ auth, manage, onBack }){
  const u = auth.user; const g = u && !u.isAnonymous;
  return (
    <section id="login">
      <div className="wrap login-wrap">
        <div className="login-art"><i className="orb"/><img className="fl fl-b" src={IMG("login-run.png")} alt=""/><img className="fl fl-a" src={IMG("login-leap.png")} alt=""/></div>
        <div className="login-brand"><Logo size={40}/><b>Stack</b></div>
        <h1 className="login-h">Show up. Stack it up.</h1>
        <p className="muted login-p">{g ? "You're all set. Your progress follows you." : "Your workouts, your progress, one place."}</p>
        {g && <div className="login-acct"><IconBubble name="user"/><div className="grow"><b>{u.displayName || u.email || "Signed in"}</b><small>{u.email || "Google account"}</small></div></div>}
        <div className="login-btns">
          {!g && <Pill big onClick={auth.google}><Icon name="google" className="gicon"/><span>Continue with Google</span></Pill>}
          {g && <Pill big ghost onClick={auth.logout}>Sign out</Pill>}
          {manage && <button className="link" onClick={onBack}>Back to the app</button>}
        </div>
        {!g && <p className="muted login-foot">Your progress follows you everywhere you train.</p>}
        <div className="status">{auth.error}</div>
      </div>
    </section>
  );
}
