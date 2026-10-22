# Stack

A dumbbell upper-body training app: per-set logging with a rest timer, progression engine, schedule, progress charts, and equipment-aware plan rebuilding.

Static site, no build step. Data lives in Firebase (Firestore) under `users/{uid}/…`; sign-in is anonymous by default with optional Google sign-in to sync across devices.

## Deploy
Served from GitHub Pages (main branch, root). Firebase config is in `index.html`; security rules are in `firestore.rules` (paste into Firestore → Rules).
