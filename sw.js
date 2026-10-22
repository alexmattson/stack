// Stack service worker: network-first for the page, cache-first for images and SDK files.
const CACHE = "stack-v2";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.hostname.includes("googleapis.com") || url.hostname.includes("firebaseio") || url.hostname.includes("firestore")) return;
  const isPage = url.pathname.endsWith("/") || url.pathname.endsWith("index.html") || url.pathname.endsWith("seed.js");
  if (isPage) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })));
  }
});
