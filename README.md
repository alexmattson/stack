# Stack

Progressive dumbbell/home-gym training app. React + Vite, Firebase (Auth + Firestore), deployed to GitHub Pages by the workflow in `.github/workflows/deploy.yml`.

## Structure
- `src/lib/program.js` — exercise library + program generator (pure)
- `src/lib/progression.js` — double-progression engine, strength summary (pure)
- `src/lib/plan.js` — calendar projection from the log (pure)
- `src/lib/dates.js` — date helpers
- `src/lib/firebase.js` — auth + per-user Firestore API (`users/{uid}/…`)
- `src/hooks/` — `useAuth`, `useData` (live Firestore state + writes), `useWorkout` (one workout's state), `useRestTimer`
- `src/components/ui.jsx` — shared primitives (Card, Pill, PageHeader, BigInput, Segmented, Toggle, Ring, icons, logo)
- `src/pages/` — Login, Home, Workout (+NowCard), FocusMode, Schedule, Progress, Setup, Account
- `src/styles.css` — design tokens and component styles

## Develop
```
npm install
npm run dev        # local
npm test           # generator + progression unit tests
VITE_MOCK=1 npm run build   # build against the in-memory Firebase mock (for e2e)
```
Firestore rules: `firestore.rules`.
