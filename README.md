<p align="center"><img src="docs/banner.png" alt="Stack" width="100%"></p>

<h1 align="center">Stack</h1>
<p align="center"><b>Show up. Stack it up.</b><br>A home-gym training app that builds your program, logs every set, and quietly pushes the weights up for you.</p>

<p align="center">
  <a href="https://alexmattson.github.io/stack/">Open the app</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#the-generator">The generator</a> ·
  <a href="#progression">Progression</a> ·
  <a href="#develop">Develop</a>
</p>

---

<table>
<tr>
<td width="140" align="center"><img src="docs/sticker-leap.png" alt="" width="110"></td>
<td>

### Meet the crew

That's **Leap** on the left. He does one thing: shows up. He'll be on your home screen on training days, mid-air, waiting for you to hit Start.

The woman sprinting past him is **Dash**. She handles the sets. When you're inside a workout she's the one on the card, and when you log a set she's already on to the next one.

The guy on the bench with the towel? **Bench**. He appears on rest days. He has never once skipped a rest day and he'd like you to know it.

</td>
<td width="140" align="center"><img src="docs/sticker-run.png" alt="" width="110"></td>
</tr>
</table>

---

## What it does

<table>
<tr>
<td width="33%" align="center"><img src="docs/home.png" alt="Home" width="100%"><br><sub><b>Home</b> · today's workout, the week at a glance</sub></td>
<td width="33%" align="center"><img src="docs/workout.png" alt="Workout" width="100%"><br><sub><b>Workout</b> · every lift, every set, targets pre-filled</sub></td>
<td width="33%" align="center"><img src="docs/focus.png" alt="Focus" width="100%"><br><sub><b>Focus mode</b> · one set at a time, rest on a ring</sub></td>
</tr>
</table>

- **A plan built for you**, not a template. Tell it what you want to train, how many days you have, how long a session can be, what you own, and it generates the week.
- **Per-set logging** with a rest timer that starts the moment you finish a set and tells you what's next.
- **Progression that thinks.** Hit the top of the rep range on every set and the weight goes up to the next dumbbell you actually own. Stall three sessions and it backs you off and rebuilds. Reps collapsing across sets? It tells you to rest longer.
- **Equipment-aware down to the plate.** Dumbbell pairs, kettlebell weights, bar weight and smallest plate, cable stack increments. Barbell lifts climb by two of your smallest plate; kettlebell swings jump to the next bell on your rack.
- **Frozen history.** Change your goals or gear and the plan rebuilds, but every workout you've already logged stays exactly as you did it.
- **Schedule that follows your life.** Miss a day and the rotation shifts forward; you never lose a push or pull day.
- **Progress** with weekly volume bars, a bodyweight sparkline, and first-vs-latest for every lift.
- **Installable.** Add it to your home screen; it opens full-screen with its own icon and keeps working offline.
- **Syncs** across your phone and laptop with Google sign-in, or stays device-only if you'd rather.

<table>
<tr>
<td width="140" align="center"><img src="docs/sticker-rest.png" alt="" width="110"></td>
<td>

> *"Rest days are where the muscle actually happens. I'm not lazy, I'm compounding."* — Bench

</td>
</tr>
</table>

---

## How it works

```
 Goals + schedule + equipment ──▶ program generator ──▶ this week's days
                                                              │
                     ┌────────────────────────────────────────┘
                     ▼
      Workout page ──▶ you log a set ──▶ Firestore (users/{uid}/sessions)
                                              │
                     progression engine ◀─────┘
                     (history for that lift)
                             │
                             ▼
             next session's targets: weight × reps per set
```

Everything a workout needs is decided before you start: which lifts, how many sets, the rep range, and the weight and reps to aim for on every set. You just log what happened.

### The generator

`src/lib/program.js` holds a library of ~75 movements, each tagged with muscle group, region (push / pull / legs / core), type (compound / isolation), what equipment it needs, and a starting weight for a 150 lb lifter.

Building a program:

1. **Pick the split** from your training-day count and focus. Upper only, 4 days → push/pull ×2. Upper + lower, 4 days → upper/lower. 6 days with everything → push/pull/legs ×2. 2–3 days → full body. Lower only → Lower A/B. Core only → core days.
2. **Fill each day from a slot template**, compounds first, so a 30-minute session drops isolation work rather than the main lifts.
3. **Choose the best movement per slot** from what you own, with floor variants when there's no bench, rows instead of chin-ups when there's no bar, barbell lifts when there's a bar and rack. Choices vary across the week so Day 3 isn't a copy of Day 1.
4. **Set rep ranges from the goal**: strength 5–8, size 8–12, endurance 12–20.
5. **Scale starting weights** by bodyweight and experience, then snap them to weights you actually have.
6. **Add core finishers** to alternate days when Core is selected.

Turn any exercise off on the Exercises page and the next-best option takes its slot.

### Progression

`src/lib/progression.js` reads every past session of a lift, newest first, and returns a target for each set plus a one-line reason.

| What happened last time | What you get |
|---|---|
| First time on the lift | Starting weight at the bottom of the range |
| Top of the range on every set | Next weight you own, reps reset to the bottom |
| Otherwise | Same weight, +1 rep on each set below the top |
| Reps fell 4+ from set one to the last set | Same targets, rest 2–3 minutes |
| Three sessions at one weight, no rep gain | Drop one step, own the top of the range, climb back |
| Maxed out your heaviest weight | Add reps, slow the lowering, buy heavier |
| Chin-ups / pull-ups | +1 rep on set one; at 40 total reps, add a dumbbell |

Rest between sets: 2:30 after compounds, 1:30 after isolation and core work, 2:00 after the last set of a lift.

<table>
<tr>
<td width="140" align="center"><img src="docs/sticker-done.png" alt="" width="110"></td>
<td>

> *"All sets logged. Eat, sleep, grow."* — the green card you'll see when you're done

</td>
</tr>
</table>

---

## Onboarding

<table>
<tr>
<td width="33%"><img src="docs/onboarding.png" alt="Onboarding" width="100%"></td>
<td>

First launch walks you through six questions and shows the plan it built before you commit:

1. What do you want to train? (upper / lower / core)
2. What's the goal? (build muscle / get strong / tone & condition)
3. Which days can you train?
4. Session length, experience, bodyweight
5. What do you have? (with weights for anything that needs them)
6. Your plan is ready

Admins can replay it from the Account page to test changes.

</td>
</tr>
</table>

---

## Develop

```bash
npm install
npm run dev                 # local dev server
npm test                    # generator + progression unit tests
npm run build               # production build to dist/
VITE_MOCK=1 npm run build   # build against the in-memory Firebase mock (used by the e2e harness)
```

### Structure

```
src/
  lib/
    program.js      exercise library, equipment ladders, program generator   (pure)
    progression.js  per-lift targets, strength summary                      (pure)
    plan.js         calendar projection from the log                         (pure)
    dates.js        date helpers
    firebase.js     auth + per-user Firestore API (users/{uid}/…)
    firebase.mock.js in-memory stand-in for tests
  hooks/
    useAuth.js      loading → login → ready; Google / anonymous; admin flag
    useData.js      live sessions, bodylog, settings; all writes
    useWorkout.js   one workout's frozen plan, cursor, suggestions
    useRestTimer.js countdown
  components/
    ui.jsx          Card, Pill, PageHeader, BigInput, Segmented, Toggle, Ring, icons, logo
    NavRail.jsx, Splash.jsx
  pages/
    LoginScreen, Onboarding, HomePage, WorkoutPage, FocusMode,
    SchedulePage, ProgressPage, SetupPage (Goals + Equipment), ExercisesPage, AccountPage
  styles.css        design tokens + component styles
tests/              node:test unit tests
.github/workflows/  build + deploy to GitHub Pages
firestore.rules     each user reads/writes only users/{uid}/**
```

### Data model

```
users/{uid}
  isAdmin: bool                      (optional)
  settings/program                   focus, goal, length, experience, bodyweight, excluded[]
  settings/equipment                 dumbbells[], bench, equipment[], kettlebells[], barbell{}, ezbar{}, cable{}, bands[]
  settings/schedule                  trainingDays[]
  sessions/{date}_{dayKey}           date, day, plan[] (frozen), sets{key:[{w,r}]}, note, savedAt
  bodylog/{date}                     weight, arm
```

### Deploy

Push to `main`. The workflow builds with Vite and publishes `dist/` to GitHub Pages. Firebase config lives in `src/lib/firebase.js`; the site's domain must be in Firebase → Authentication → Authorized domains, and `firestore.rules` pasted into Firestore → Rules.

<table>
<tr>
<td width="140" align="center"><img src="docs/sticker-gear.png" alt="" width="110"></td>
<td>

> *"The plan only uses what you own. No, you can't do lat pulldowns on a resistance band. Yes, I've been asked."* — the Equipment page

</td>
</tr>
</table>

---

<p align="center"><sub>Character illustrations from a licensed 3D pack. Built with React, Vite and Firebase.</sub></p>
