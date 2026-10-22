import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/stack/",
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC") },
  resolve: { alias: process.env.VITE_MOCK ? { "./firebase.js": "/src/lib/firebase.mock.js", "../lib/firebase.js": "/src/lib/firebase.mock.js" } : {} },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["img/*.png"],
      manifest: {
        name: "Stack", short_name: "Stack", display: "standalone",
        background_color: "#e7f0f5", theme_color: "#1c5467", start_url: "/stack/",
        icons: [
          { src: "img/icon-192-v2.png", sizes: "192x192", type: "image/png" },
          { src: "img/icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "any" }
        ]
      },
      workbox: { globPatterns: ["**/*.{js,css,html,png}"], navigateFallback: "/stack/index.html", skipWaiting: true, clientsClaim: true, cleanupOutdatedCaches: true }
    })
  ]
});
