import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./styles.css";

// Install updates immediately and reload once the new version takes control, so the
// home-screen app never keeps serving a stale build.
registerSW({ immediate: true });
if ("serviceWorker" in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloaded) return; reloaded = true; window.location.reload(); });
}

createRoot(document.getElementById("root")).render(<App/>);
