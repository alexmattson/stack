import React from "react";
import { Icon } from "./ui.jsx";
const TABS = [["home","home","Home"],["log","push","Workout"],["schedule","cal","Schedule"],["progress","chart","Progress"],["settings","user","Account"]];
export const NavRail = ({ tab, onSelect }) => (
  <div className="nav"><div role="tablist">
    {TABS.map(([id, icon, label]) => <button key={id} role="tab" aria-selected={tab === id} aria-label={label} onClick={() => onSelect(id)}><Icon name={icon}/></button>)}
  </div></div>
);
