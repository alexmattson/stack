// Stack program generator (pure).
// Builds PROGRAM (an array of training days) from the user's goals, schedule and equipment.
// Nothing here is shown as a list in the app; the workout page simply reflects what this produces.

// ---------- exercise library ----------
// key, name, group, region (push|pull|legs|core), kind (compound|iso), needs (equipment tags),
// bw (bodyweight), start (lb per hand for a 150 lb lifter with some experience), img, q (video search), g (guide), pri (lower = preferred)
// equip: db (per-hand dumbbell weight, stepped through the dumbbells you own) · bb (total bar weight, 5 lb steps)
// kb (kettlebell) · cable · band · bw (bodyweight). needs: equipment tags that must be present; unless: tags that make it redundant.
// reps: fixed rep/second range for bodyweight moves (otherwise "max", or the goal's range). up: how to make it harder once the range is owned.
const EX = r => Object.assign({needs:[], unless:[], bw:false, start:0, pri:5, timed:false, equip:"db", reps:null, up:null, g:null}, r);
const BW = r => EX(Object.assign({bw:true, equip:"bw", q:r.name.toLowerCase().replace(/\s*\(.*\)/, "") + " form"}, r));
export const LIB = [
  // push: chest
  EX({key:"flat_press",   name:"Flat DB press",           group:"chest", region:"push", kind:"compound", needs:["bench"],         start:35, img:"press",   q:"dumbbell bench press form", g:"https://musclewiki.com/exercise/dumbbell-bench-press", pri:1}),
  EX({key:"floor_press", unless:["bench"],  name:"DB floor press",          group:"chest", region:"push", kind:"compound",                          start:35, img:"press",   q:"dumbbell floor press form", g:"https://musclewiki.com/exercise/dumbbell-floor-press", pri:3}),
  EX({key:"incline_press",name:"Incline DB press",        group:"chest_upper", region:"push", kind:"compound", needs:["incline"], start:30, img:"incline", q:"incline dumbbell press form", g:"https://musclewiki.com/exercise/dumbbell-incline-bench-press", pri:1}),
  EX({key:"pushup",       name:"Push-ups",                group:"chest", region:"push", kind:"compound", bw:true, equip:"bw",      img:"press",   q:"push up form", g:"https://musclewiki.com/exercise/push-up", pri:4, up:"Elevate your feet, or move to decline push-ups."}),
  EX({key:"fly",          name:"DB flys",                 group:"chest", region:"push", kind:"iso", needs:["bench"],              start:15, img:"fly",     q:"dumbbell chest fly form", g:"https://musclewiki.com/exercise/dumbbell-chest-fly", pri:2}),
  EX({key:"floor_fly", unless:["bench"],    name:"Floor flys",              group:"chest", region:"push", kind:"iso",                               start:15, img:"fly",     q:"dumbbell floor fly form", g:"https://musclewiki.com/exercise/dumbbell-floor-fly", pri:4}),
  EX({key:"cg_press",     name:"Close-grip DB press",     group:"triceps", region:"push", kind:"compound", needs:["bench"],       start:25, img:"press",   q:"close grip dumbbell press", g:"https://musclewiki.com/exercise/dumbbell-squeeze-press", pri:3}),
  // push: shoulders
  EX({key:"ohp",          name:"Seated DB shoulder press",group:"shoulders", region:"push", kind:"compound",                      start:25, img:"shoulder",q:"seated dumbbell shoulder press form", g:"https://musclewiki.com/exercise/dumbbell-seated-overhead-press", pri:1}),
  EX({key:"arnold",       name:"Arnold press",            group:"shoulders", region:"push", kind:"compound",                      start:25, img:"shoulder",q:"arnold press form", g:"https://musclewiki.com/exercise/dumbbell-arnold-press", pri:2}),
  EX({key:"lateral",      name:"Lateral raises",          group:"side_delts", region:"push", kind:"iso",                          start:10, img:"raise",   q:"dumbbell lateral raise form", g:"https://musclewiki.com/exercise/dumbbell-lateral-raise", pri:1}),
  EX({key:"front_raise",  name:"Front raises",            group:"shoulders", region:"push", kind:"iso",                           start:10, img:"raise",   q:"dumbbell front raise form", g:"https://musclewiki.com/exercise/dumbbell-front-raise", pri:4}),
  // push: triceps
  EX({key:"oh_tri",       name:"Overhead triceps ext.",   group:"triceps", region:"push", kind:"iso",                             start:25, img:"tri",     q:"overhead dumbbell triceps extension form", g:"https://musclewiki.com/exercise/dumbbell-overhead-tricep-extension", pri:1}),
  EX({key:"skull",        name:"Skull-crushers",          group:"triceps", region:"push", kind:"iso", needs:["bench"],            start:15, img:"tri",     q:"dumbbell skull crusher form", g:"https://musclewiki.com/exercise/dumbbell-skullcrusher", pri:2}),
  EX({key:"floor_skull", unless:["bench"],  name:"Floor skull-crushers",    group:"triceps", region:"push", kind:"iso",                             start:15, img:"tri",     q:"dumbbell skull crusher form", g:"https://musclewiki.com/exercise/dumbbell-skullcrusher", pri:3}),
  EX({key:"kickback",     name:"Triceps kickbacks",       group:"triceps", region:"push", kind:"iso",                             start:10, img:"tri",     q:"dumbbell triceps kickback form", g:"https://musclewiki.com/exercise/dumbbell-tricep-kickback", pri:4}),
  // pull: back
  EX({key:"chinup",       name:"Chin-ups",                group:"lats", region:"pull", kind:"compound", needs:["bar"], bw:true,   img:"pull",    q:"chin up form", g:"https://musclewiki.com/exercise/chin-ups", pri:1}),
  EX({key:"pullup",       name:"Pull-ups (wide)",         group:"lats", region:"pull", kind:"compound", needs:["bar"], bw:true,   img:"pull",    q:"wide grip pull up form", g:"https://musclewiki.com/exercise/pull-ups", pri:2}),
  EX({key:"row",          name:"One-arm DB row",          group:"back", region:"pull", kind:"compound",                           start:40, img:"row",     q:"one arm dumbbell row form", g:"https://musclewiki.com/exercise/dumbbell-single-arm-row", pri:1}),
  EX({key:"cs_row",       name:"Chest-supported row",     group:"back", region:"pull", kind:"compound", needs:["incline"],        start:30, img:"row",     q:"chest supported dumbbell row", g:"https://musclewiki.com/exercise/dumbbell-laying-incline-row", pri:2}),
  EX({key:"bo_row",       name:"Bent-over DB row",        group:"back", region:"pull", kind:"compound",                           start:35, img:"row",     q:"bent over dumbbell row form", g:"https://musclewiki.com/exercise/dumbbell-row-bilateral", pri:3}),
  EX({key:"bo_row2",      name:"Bent-over row (both arms)",group:"lats", region:"pull", kind:"compound",                          start:30, img:"row",     q:"bent over dumbbell row form", g:"https://musclewiki.com/exercise/dumbbell-row-bilateral", pri:4}),
  EX({key:"renegade",     name:"Renegade row",            group:"lats", region:"pull", kind:"compound",                           start:25, img:"row",     q:"renegade row form", g:"https://musclewiki.com/exercise/dumbbell-renegade-row", pri:5}),
  EX({key:"pullover",     name:"DB pullover",             group:"lats", region:"pull", kind:"iso", needs:["bench"],               start:30, img:"pull",    q:"dumbbell pullover form", g:"https://musclewiki.com/exercise/dumbbell-pullover", pri:3}),
  EX({key:"floor_pullover", unless:["bench"],name:"Floor pullover",         group:"lats", region:"pull", kind:"iso",                                start:30, img:"pull",    q:"dumbbell pullover form", g:"https://musclewiki.com/exercise/dumbbell-pullover", pri:5}),
  EX({key:"rear_fly",     name:"Rear-delt flys",          group:"rear_delts", region:"pull", kind:"iso",                          start:10, img:"raise",   q:"dumbbell rear delt fly form", g:"https://musclewiki.com/exercise/dumbbell-rear-delt-fly", pri:1}),
  EX({key:"shrug",        name:"Shrugs",                  group:"traps", region:"pull", kind:"iso",                               start:50, img:"raise",   q:"dumbbell shrug form", g:"https://musclewiki.com/exercise/dumbbell-shrug", pri:2}),
  // pull: biceps
  EX({key:"curl",         name:"DB curls",                group:"biceps", region:"pull", kind:"iso",                              start:20, img:"curl",    q:"dumbbell bicep curl form", g:"https://musclewiki.com/exercise/dumbbell-curl", pri:1}),
  EX({key:"inc_curl",     name:"Incline curls",           group:"biceps", region:"pull", kind:"iso", needs:["incline"],           start:15, img:"curl",    q:"incline dumbbell curl form", g:"https://musclewiki.com/exercise/dumbbell-incline-curl", pri:2}),
  EX({key:"hammer",       name:"Hammer curls",            group:"biceps", region:"pull", kind:"iso",                              start:20, img:"curl",    q:"hammer curl form", g:"https://musclewiki.com/exercise/dumbbell-hammer-curl", pri:2}),
  EX({key:"alt_curl",     name:"Alternating curls",       group:"biceps", region:"pull", kind:"iso",                              start:20, img:"curl",    q:"alternating dumbbell curl form", g:"https://musclewiki.com/exercise/dumbbell-curl", pri:3}),
  EX({key:"conc_curl",    name:"Concentration curls",     group:"biceps", region:"pull", kind:"iso",                              start:15, img:"curl",    q:"concentration curl form", g:"https://musclewiki.com/exercise/dumbbell-concentration-curl", pri:4}),
  // legs
  EX({key:"goblet",       name:"Goblet squat",            group:"quads", region:"legs", kind:"compound",                          start:40, img:"squat",   q:"goblet squat form", g:"https://musclewiki.com/exercise/dumbbell-goblet-squat", pri:1}),
  EX({key:"db_squat", unless:["bench"],     name:"DB squat (two hands)",    group:"quads", region:"legs", kind:"compound",                          start:35, img:"squat",   q:"dumbbell squat form", g:"https://musclewiki.com/exercise/dumbbell-front-rack-squat", pri:3}),
  EX({key:"split_squat",  name:"Bulgarian split squat",   group:"quads", region:"legs", kind:"compound", needs:["bench"],         start:20, img:"lunge",   q:"bulgarian split squat form", g:"https://musclewiki.com/exercise/dumbbell-bulgarian-split-squat", pri:1}),
  EX({key:"lunge",        name:"Walking lunges",          group:"quads", region:"legs", kind:"compound",                          start:20, img:"lunge",   q:"dumbbell walking lunge form", g:"https://musclewiki.com/exercise/dumbbell-forward-lunge", pri:2}),
  EX({key:"step_up",      name:"Step-ups",                group:"quads", region:"legs", kind:"compound", needs:["bench"],         start:20, img:"lunge",   q:"dumbbell step up form", g:"https://musclewiki.com/exercise/dumbbell-step-up", pri:3}),
  EX({key:"rdl",          name:"Romanian deadlift",       group:"hams", region:"legs", kind:"compound",                           start:40, img:"hinge",   q:"dumbbell romanian deadlift form", g:"https://musclewiki.com/exercise/dumbbell-romanian-deadlift", pri:1}),
  EX({key:"sl_rdl",       name:"Single-leg RDL",          group:"hams", region:"legs", kind:"compound",                           start:25, img:"hinge",   q:"single leg dumbbell romanian deadlift form", g:"https://musclewiki.com/exercise/dumbbell-single-leg-single-arm-deadlift", pri:2}),
  EX({key:"hip_thrust",   name:"DB hip thrust",           group:"glutes", region:"legs", kind:"compound", needs:["bench"],        start:45, img:"hinge",   q:"dumbbell hip thrust form", g:"https://musclewiki.com/exercise/dumbbell-hip-thrust", pri:1}),
  EX({key:"glute_bridge", unless:["bench"], name:"DB glute bridge",         group:"glutes", region:"legs", kind:"compound",                         start:40, img:"hinge",   q:"dumbbell glute bridge form", g:"https://musclewiki.com/exercise/dumbbell-glute-bridge", pri:2}),
  EX({key:"calf_raise",   name:"Standing calf raises",    group:"calves", region:"legs", kind:"iso",                              start:40, img:"squat",   q:"dumbbell calf raise form", g:"https://musclewiki.com/exercise/dumbbell-calf-raise", pri:1}),
  EX({key:"ham_curl",     name:"Lying DB hamstring curl", group:"hams", region:"legs", kind:"iso",                                start:15, img:"hinge",   q:"lying dumbbell hamstring curl", g:"https://musclewiki.com/exercise/dumbbell-leg-curl", pri:3}),
  // core
  EX({key:"wt_crunch",    name:"Weighted crunch",         group:"abs", region:"core", kind:"iso",                                 start:15, img:"abs",     q:"dumbbell weighted crunch form", g:"https://musclewiki.com/exercise/dumbbell-crunch", pri:1}),
  EX({key:"knee_raise",   name:"Hanging knee raises",     group:"abs_lower", region:"core", kind:"iso", needs:["bar"], bw:true,   img:"abs",     q:"hanging knee raise form", g:"https://musclewiki.com/exercise/hanging-knee-raises", pri:1}),
  EX({key:"leg_raise",    name:"Hanging leg raises",      group:"abs_lower", region:"core", kind:"iso", needs:["bar"], bw:true,   img:"abs",     q:"hanging leg raise form", g:"https://musclewiki.com/exercise/hanging-knee-raises", pri:2}),
  EX({key:"lying_leg_raise",name:"Lying leg raises",      group:"abs_lower", region:"core", kind:"iso", bw:true,                  img:"abs",     q:"lying leg raise form", g:"https://musclewiki.com/exercise/laying-leg-raises", pri:3}),
  EX({key:"rev_crunch",   name:"Reverse crunch",          group:"abs_lower", region:"core", kind:"iso", bw:true,                  img:"abs",     q:"reverse crunch form", g:"https://musclewiki.com/exercise/reverse-crunch", pri:4}),
  EX({key:"side_plank",   name:"Side plank (sec per side)",group:"obliques", region:"core", kind:"iso", bw:true, timed:true,      img:"sideplank",q:"side plank form", g:"https://musclewiki.com/exercise/elbow-side-plank", pri:1}),
  EX({key:"side_bend",    name:"DB side bend (per side)", group:"obliques", region:"core", kind:"iso",                            start:25, img:"sideplank",q:"dumbbell side bend form", g:"https://musclewiki.com/exercise/dumbbell-side-bend", pri:2}),
  EX({key:"plank",        name:"Plank (seconds)",         group:"abs", region:"core", kind:"iso", bw:true, timed:true,            img:"sideplank",q:"plank form", g:"https://musclewiki.com/exercise/forearm-plank", pri:3}),
  EX({key:"russian_twist",name:"Russian twist (per side)",group:"obliques", region:"core", kind:"iso",                            start:15, img:"abs",     q:"dumbbell russian twist form", g:"https://musclewiki.com/exercise/dumbbell-russian-twist", pri:3}),
  // barbell (needs plates; rack for squat/bench)
  EX({key:"bb_bench",     name:"Barbell bench press",     group:"chest", region:"push", kind:"compound", needs:["barbell","rack","bench"], equip:"bb", start:95, img:"press", q:"barbell bench press form", g:"https://musclewiki.com/exercise/barbell-bench-press", pri:0}),
  EX({key:"bb_incline",   name:"Barbell incline press",   group:"chest_upper", region:"push", kind:"compound", needs:["barbell","rack","incline"], equip:"bb", start:75, img:"incline", q:"incline barbell bench press form", g:"https://musclewiki.com/exercise/barbell-incline-bench-press", pri:1}),
  EX({key:"bb_ohp",       name:"Barbell overhead press",  group:"shoulders", region:"push", kind:"compound", needs:["barbell"], equip:"bb", start:65, img:"shoulder", q:"barbell overhead press form", g:"https://musclewiki.com/exercise/barbell-overhead-press", pri:0}),
  EX({key:"bb_row",       name:"Barbell row",             group:"back", region:"pull", kind:"compound", needs:["barbell"], equip:"bb", start:95, img:"row", q:"barbell row form", g:"https://musclewiki.com/exercise/barbell-bent-over-row", pri:0}),
  EX({key:"bb_curl",      name:"Barbell curl",            group:"biceps", region:"pull", kind:"iso", needs:["barbell"], equip:"bb", start:45, img:"curl", q:"barbell curl form", g:"https://musclewiki.com/exercise/barbell-curl", pri:1}),
  EX({key:"bb_squat",     name:"Barbell back squat",      group:"quads", region:"legs", kind:"compound", needs:["barbell","rack"], equip:"bb", start:115, img:"squat", q:"barbell back squat form", g:"https://musclewiki.com/exercise/barbell-squat", pri:0}),
  EX({key:"bb_deadlift",  name:"Barbell deadlift",        group:"hams", region:"legs", kind:"compound", needs:["barbell"], equip:"bb", start:135, img:"hinge", q:"barbell deadlift form", g:"https://musclewiki.com/exercise/barbell-deadlift", pri:0}),
  EX({key:"bb_rdl",       name:"Barbell Romanian deadlift",group:"hams", region:"legs", kind:"compound", needs:["barbell"], equip:"bb", start:95, img:"hinge", q:"barbell romanian deadlift form", g:"https://musclewiki.com/exercise/barbell-romanian-deadlift", pri:1}),
  EX({key:"bb_hip_thrust",name:"Barbell hip thrust",      group:"glutes", region:"legs", kind:"compound", needs:["barbell","bench"], equip:"bb", start:95, img:"hinge", q:"barbell hip thrust form", g:"https://musclewiki.com/exercise/barbell-hip-thrust", pri:0}),
  EX({key:"ez_curl",      name:"EZ-bar curl",             group:"biceps", region:"pull", kind:"iso", needs:["ezbar"], equip:"ez", start:40, img:"curl", q:"ez bar curl form", g:"https://musclewiki.com/exercise/ez-bar-curl", pri:1}),
  EX({key:"ez_skull",     name:"EZ-bar skull-crushers",   group:"triceps", region:"push", kind:"iso", needs:["ezbar","bench"], equip:"ez", start:40, img:"tri", q:"ez bar skull crusher form", g:"https://musclewiki.com/exercise/barbell-skullcrusher", pri:1}),
  // kettlebell
  EX({key:"kb_swing",     name:"Kettlebell swing",        group:"hams", region:"legs", kind:"compound", needs:["kettlebell"], equip:"kb", start:35, img:"hinge", q:"kettlebell swing form", g:"https://musclewiki.com/exercise/kettlebell-swing", pri:2}),
  EX({key:"kb_goblet",    name:"Kettlebell goblet squat", group:"quads", region:"legs", kind:"compound", needs:["kettlebell"], equip:"kb", start:35, img:"squat", q:"kettlebell goblet squat form", g:"https://musclewiki.com/exercise/kettlebell-goblet-squat", pri:2}),
  EX({key:"kb_press",     name:"Kettlebell press",        group:"shoulders", region:"push", kind:"compound", needs:["kettlebell"], equip:"kb", start:25, img:"shoulder", q:"kettlebell press form", g:"https://musclewiki.com/exercise/kettlebell-single-arm-push-press", pri:3}),
  // dip station / parallel bars
  EX({key:"dip",          name:"Dips",                    group:"chest", region:"push", kind:"compound", needs:["dipbars"], bw:true, equip:"bw", img:"press", q:"dip form", g:"https://musclewiki.com/exercise/parralel-bar-dips", pri:1}),
  EX({key:"dip_knee_raise",name:"Captain's chair knee raises",group:"abs_lower", region:"core", kind:"iso", needs:["dipbars"], bw:true, equip:"bw", img:"abs", q:"captains chair knee raise form", g:"https://musclewiki.com/exercise/hanging-knee-raises", pri:2}),
  // cable machine
  EX({key:"lat_pulldown", name:"Lat pulldown",            group:"lats", region:"pull", kind:"compound", needs:["cable"], equip:"cable", start:80, img:"pull", q:"lat pulldown form", g:"https://musclewiki.com/exercise/machine-pulldown", pri:1}),
  EX({key:"cable_row",    name:"Seated cable row",        group:"back", region:"pull", kind:"compound", needs:["cable"], equip:"cable", start:80, img:"row", q:"seated cable row form", g:"https://musclewiki.com/exercise/machine-seated-cable-row", pri:1}),
  EX({key:"face_pull",    name:"Face pulls",              group:"rear_delts", region:"pull", kind:"iso", needs:["cable"], equip:"cable", start:30, img:"raise", q:"face pull form", g:"https://musclewiki.com/exercise/machine-face-pulls", pri:0}),
  EX({key:"pushdown",     name:"Triceps pushdown",        group:"triceps", region:"push", kind:"iso", needs:["cable"], equip:"cable", start:40, img:"tri", q:"triceps pushdown form", g:"https://musclewiki.com/exercise/cable-rope-pushdown", pri:0}),
  EX({key:"cable_curl",   name:"Cable curl",              group:"biceps", region:"pull", kind:"iso", needs:["cable"], equip:"cable", start:40, img:"curl", q:"cable curl form", g:"https://musclewiki.com/exercise/cable-bar-curl", pri:3}),
  EX({key:"cable_crunch", name:"Cable crunch",            group:"abs", region:"core", kind:"iso", needs:["cable"], equip:"cable", start:50, img:"abs", q:"cable crunch form", g:"https://musclewiki.com/exercise/cable-rope-kneeling-crunch", pri:0}),
  // bands
  EX({key:"band_pullapart",name:"Band pull-aparts",       group:"rear_delts", region:"pull", kind:"iso", needs:["bands"], equip:"band", start:0, bw:true, img:"raise", q:"band pull apart form", g:"https://musclewiki.com/exercise/band-pull-apart", pri:2}),
  EX({key:"band_facepull", name:"Band face pulls",        group:"rear_delts", region:"pull", kind:"iso", needs:["bands"], unless:["cable"], equip:"band", start:0, bw:true, img:"raise", q:"band face pull form", g:"https://musclewiki.com/exercise/band-face-pull", pri:1}),
  EX({key:"band_pushdown", name:"Band triceps pushdown",  group:"triceps", region:"push", kind:"iso", needs:["bands"], unless:["cable"], equip:"band", start:0, bw:true, img:"tri", q:"band triceps pushdown form", g:"https://musclewiki.com/exercise/band-rapunzel-pushdown", pri:3}),
  // ab wheel
  EX({key:"ab_rollout",   name:"Ab wheel rollouts",       group:"abs", region:"core", kind:"iso", needs:["abwheel"], bw:true, equip:"bw", img:"abs", q:"ab wheel rollout form", g:"https://musclewiki.com/exercise/barbell-roll-outs", pri:0}),
  // ---------- bodyweight & isometrics (no equipment) ----------
  // Priorities sit above the dumbbell versions so these fill in only where nothing weighted fits.
  // push
  BW({key:"decline_pushup", name:"Decline push-ups (feet up)",     group:"chest_upper", region:"push", kind:"compound", img:"incline", g:"https://musclewiki.com/exercise/decline-push-up", pri:6, up:"Raise your feet higher, or pause 2 seconds at the bottom."}),
  BW({key:"wide_pushup",    name:"Wide push-ups",                  group:"chest", region:"push", kind:"compound", img:"press", pri:7, up:"Elevate your feet or slow the lowering to 3 seconds."}),
  BW({key:"pushup_hold",    name:"Push-up bottom hold (seconds)",  group:"chest", region:"push", kind:"iso", timed:true, reps:"20–45", img:"press", pri:8, up:"Hold an inch lower, or elevate your feet."}),
  BW({key:"pike_pushup",    name:"Pike push-ups",                  group:"shoulders", region:"push", kind:"compound", img:"shoulder", g:"https://musclewiki.com/exercise/elevated-pike-press", pri:6, up:"Put your feet on a chair to load the shoulders more."}),
  BW({key:"handstand_hold", name:"Wall handstand hold (seconds)",  group:"shoulders", region:"push", kind:"iso", timed:true, reps:"20–45", img:"shoulder", pri:8, up:"Walk your hands a little farther from the wall."}),
  BW({key:"lateral_hold",   name:"Wall lateral raise hold (sec per side)", group:"side_delts", region:"push", kind:"iso", timed:true, reps:"20–45", img:"raise", pri:8, up:"Press harder into the wall, or hold a water bottle."}),
  BW({key:"diamond_pushup", name:"Diamond push-ups",               group:"triceps", region:"push", kind:"compound", img:"tri", g:"https://musclewiki.com/exercise/diamond-push-ups", pri:6, up:"Elevate your feet."}),
  BW({key:"bench_dip",      name:"Chair dips",                     group:"triceps", region:"push", kind:"compound", img:"tri", g:"https://musclewiki.com/exercise/bench-dips", pri:6, up:"Put your feet up on a second chair."}),
  BW({key:"plank_updown",   name:"Plank up-downs (per side)",      group:"triceps", region:"push", kind:"iso", reps:"8–15", img:"press", g:"https://musclewiki.com/exercise/bodyweight-plank-up-down", pri:8, up:"Slow each rep down and keep the hips still."}),
  // pull
  BW({key:"inverted_row",   name:"Inverted row (under a table)",   group:"back", region:"pull", kind:"compound", img:"row", g:"https://musclewiki.com/exercise/inverted-row", pri:5, up:"Lower the surface, or put your feet up on a chair."}),
  BW({key:"door_row",       name:"Doorway row (towel or door edge)", group:"lats", region:"pull", kind:"compound", img:"row", g:"https://musclewiki.com/exercise/bodyweight-standing-inverted-row", pri:6, up:"Walk your feet closer to the door so you lean back further."}),
  BW({key:"superman",       name:"Supermans",                      group:"back", region:"pull", kind:"iso", reps:"10–15", img:"hinge", g:"https://musclewiki.com/exercise/supermans", pri:6, up:"Pause 3 seconds at the top of every rep."}),
  BW({key:"superman_hold",  name:"Superman hold (seconds)",        group:"back", region:"pull", kind:"iso", timed:true, reps:"20–45", img:"hinge", pri:7, up:"Reach your arms further forward."}),
  BW({key:"bird_dog",       name:"Bird dog (per side)",            group:"back", region:"pull", kind:"iso", reps:"10–15", img:"hinge", g:"https://musclewiki.com/exercise/bird-dog", pri:8, up:"Hold each rep for 3 seconds."}),
  BW({key:"prone_y",        name:"Prone Y raises",                 group:"rear_delts", region:"pull", kind:"iso", reps:"12–20", img:"raise", g:"https://musclewiki.com/exercise/i-into-w-prone", pri:6, up:"Hold the top for 2 seconds, or hold water bottles."}),
  BW({key:"snow_angel",     name:"Reverse snow angels",            group:"rear_delts", region:"pull", kind:"iso", reps:"12–20", img:"raise", pri:7, up:"Slow each sweep to 3 seconds."}),
  BW({key:"scap_pushup",    name:"Scapular push-ups",              group:"traps", region:"pull", kind:"iso", reps:"12–20", img:"press", pri:6, up:"Do them with your feet elevated."}),
  BW({key:"table_curl",     name:"Table curls (under a sturdy table)", group:"biceps", region:"pull", kind:"iso", reps:"8–15", img:"curl", pri:7, up:"Straighten your body so more weight hangs from your arms."}),
  BW({key:"towel_curl",     name:"Towel isometric curl (seconds)", group:"biceps", region:"pull", kind:"iso", timed:true, reps:"20–45", img:"curl", pri:8, up:"Pull harder against the towel; try one arm at a time."}),
  // legs
  BW({key:"bw_squat",       name:"Bodyweight squats",              group:"quads", region:"legs", kind:"compound", reps:"15–25", img:"squat", g:"https://musclewiki.com/exercise/bodyweight-squat", pri:6, up:"Slow to 3 seconds down, or move to split squats."}),
  BW({key:"bw_split_squat", name:"Split squats (per leg)",         group:"quads", region:"legs", kind:"compound", reps:"10–15", img:"lunge", g:"https://musclewiki.com/exercise/split-squat", pri:6, up:"Put your rear foot up on a chair."}),
  BW({key:"rev_lunge",      name:"Reverse lunges (per leg)",       group:"quads", region:"legs", kind:"compound", reps:"10–15", img:"lunge", g:"https://musclewiki.com/exercise/bodyweight-reverse-lunge", pri:7, up:"Pause 2 seconds at the bottom."}),
  BW({key:"step_up_bw",     name:"Step-ups on a chair (per leg)",  group:"quads", region:"legs", kind:"compound", reps:"10–15", img:"lunge", pri:7, up:"Use a higher step, or drive the other knee up."}),
  BW({key:"pistol",         name:"Pistol squats (per leg)",        group:"quads", region:"legs", kind:"compound", img:"squat", pri:8, up:"Slow the lowering to 3 seconds."}),
  BW({key:"jump_squat",     name:"Jump squats",                    group:"quads", region:"legs", kind:"compound", reps:"8–12", img:"squat", g:"https://musclewiki.com/exercise/jump-squats", pri:9, up:"Land softer and sink deeper on each rep."}),
  BW({key:"wall_sit",       name:"Wall sit (seconds)",             group:"quads", region:"legs", kind:"iso", timed:true, reps:"30–60", img:"squat", g:"https://musclewiki.com/exercise/wall-sit", pri:7, up:"Lift one foot an inch off the floor."}),
  BW({key:"nordic",         name:"Nordic curls (feet under a couch)", group:"hams", region:"legs", kind:"compound", reps:"4–8", img:"hinge", g:"https://musclewiki.com/exercise/nordic-hamstring-curl", pri:6, up:"Lower for 5 seconds and push up with less hand help."}),
  BW({key:"sl_rdl_bw",      name:"Single-leg RDL, bodyweight (per leg)", group:"hams", region:"legs", kind:"compound", reps:"10–15", img:"hinge", g:"https://musclewiki.com/exercise/single-legged-romanian-deadlifts", pri:7, up:"Hold the bottom for 2 seconds."}),
  BW({key:"slider_curl",    name:"Sliding hamstring curls (towel on floor)", group:"hams", region:"legs", kind:"iso", reps:"10–15", img:"hinge", g:"https://musclewiki.com/exercise/hamstring-curl-1-supine-single-leg-slider", pri:7, up:"Do them one leg at a time."}),
  BW({key:"bw_bridge",      name:"Glute bridges",                  group:"glutes", region:"legs", kind:"compound", reps:"15–25", img:"hinge", g:"https://musclewiki.com/exercise/glute-bridge", pri:7, up:"Move to single-leg glute bridges."}),
  BW({key:"sl_bridge",      name:"Single-leg glute bridge (per leg)", group:"glutes", region:"legs", kind:"compound", reps:"10–15", img:"hinge", g:"https://musclewiki.com/exercise/single-leg-glute-bridge", pri:6, up:"Put your planted foot up on a chair."}),
  BW({key:"bridge_hold",    name:"Glute bridge hold (seconds)",    group:"glutes", region:"legs", kind:"iso", timed:true, reps:"30–60", img:"hinge", pri:8, up:"Hold on one leg."}),
  BW({key:"side_leg_raise", name:"Side-lying leg raises (per side)", group:"glutes", region:"legs", kind:"iso", reps:"15–20", img:"sideplank", g:"https://musclewiki.com/exercise/abductor-leg-raise-side-lying", pri:8, up:"Pause 2 seconds at the top."}),
  BW({key:"bw_calf",        name:"Calf raises (bodyweight)",       group:"calves", region:"legs", kind:"iso", reps:"15–25", img:"squat", g:"https://musclewiki.com/exercise/calf-raises", pri:6, up:"Move to single-leg calf raises."}),
  BW({key:"sl_calf",        name:"Single-leg calf raises (per leg)", group:"calves", region:"legs", kind:"iso", reps:"12–20", img:"squat", g:"https://musclewiki.com/exercise/bodyweight-single-leg-calf-raise", pri:7, up:"Do them on a step for a deeper stretch."}),
  // core
  BW({key:"hollow_hold",    name:"Hollow hold (seconds)",          group:"abs", region:"core", kind:"iso", timed:true, reps:"20–45", img:"abs", g:"https://musclewiki.com/exercise/hollow-hold", pri:2, up:"Straighten your legs and lower them closer to the floor."}),
  BW({key:"dead_bug",       name:"Dead bug (per side)",            group:"abs", region:"core", kind:"iso", reps:"10–15", img:"abs", g:"https://musclewiki.com/exercise/dead-bug", pri:4, up:"Slow each rep to 3 seconds."}),
  BW({key:"crunch",         name:"Crunches",                       group:"abs", region:"core", kind:"iso", reps:"15–25", img:"abs", pri:5, up:"Pause at the top, or move to V-ups."}),
  BW({key:"vup",            name:"V-ups",                          group:"abs", region:"core", kind:"iso", reps:"10–15", img:"abs", pri:5, up:"Slow the lowering to 3 seconds."}),
  BW({key:"plank_taps",     name:"Plank shoulder taps (per side)", group:"abs", region:"core", kind:"iso", reps:"12–20", img:"sideplank", pri:6, up:"Bring your feet closer together."}),
  BW({key:"mtn_climber",    name:"Mountain climbers (per side)",   group:"abs_lower", region:"core", kind:"iso", reps:"15–25", img:"abs", g:"https://musclewiki.com/exercise/mountain-climber", pri:5, up:"Slow them down and drive the knee to the chest."}),
  BW({key:"scissor_kick",   name:"Scissor kicks (seconds)",        group:"abs_lower", region:"core", kind:"iso", timed:true, reps:"20–45", img:"abs", g:"https://musclewiki.com/exercise/scissor-kick", pri:6, up:"Keep your legs lower to the floor."}),
  BW({key:"bicycle",        name:"Bicycle crunches (per side)",    group:"obliques", region:"core", kind:"iso", reps:"12–20", img:"abs", g:"https://musclewiki.com/exercise/bicycle-crunch", pri:3, up:"Slow each rep and pause at the twist."}),
];
// Equipment the Setup page can toggle. Dumbbells and bench type are chosen separately.
export const EQUIPMENT = [
  {key:"dumbbells",  name:"Dumbbells",            sub:"Pick the weights you own, per hand", options:"dumbbells"},
  {key:"bench",      name:"Bench",                sub:"Flat or incline", options:"bench"},
  {key:"bar",        name:"Pull-up bar",          sub:"Chin-ups, pull-ups, hanging ab work"},
  {key:"barbell",    name:"Barbell & plates",     sub:"Rows, presses, deadlifts", options:"barbell"},
  {key:"rack",       name:"Squat rack",           sub:"Unlocks barbell squats and bench press (needs a barbell)"},
  {key:"ezbar",      name:"EZ curl bar",          sub:"Curls and skull-crushers; uses your barbell plates", options:"ezbar"},
  {key:"kettlebell", name:"Kettlebells",          sub:"Swings, goblet squats, presses", options:"kettlebells"},
  {key:"dipbars",    name:"Dip station",          sub:"Dips and captain's chair raises"},
  {key:"cable",      name:"Cable machine",        sub:"Pulldowns, rows, face pulls, pushdowns", options:"cable"},
  {key:"bands",      name:"Resistance bands",     sub:"Pull-aparts, face pulls, pushdowns", options:"bands"},
  {key:"abwheel",    name:"Ab wheel",             sub:"Rollouts"},
];
export const BAND_LEVELS = [["light","Light"],["medium","Medium"],["heavy","Heavy"],["xheavy","X-heavy"]];
export const LIB_BY_KEY = Object.fromEntries(LIB.map(e => [e.key, e]));
// Movement pattern of each compound lift. A day avoids stacking the same pattern (three rows in a row), and the
// warm-up ramp is only needed for the first lift of each pattern.
const PATTERNS = {
  h_press:["flat_press","floor_press","incline_press","pushup","cg_press","bb_bench","bb_incline","dip","decline_pushup","wide_pushup","diamond_pushup","bench_dip"],
  v_press:["ohp","arnold","bb_ohp","kb_press","pike_pushup"],
  v_pull:["chinup","pullup","lat_pulldown"],
  h_pull:["row","cs_row","bo_row","bo_row2","renegade","bb_row","cable_row","inverted_row","door_row"],
  squat:["goblet","db_squat","bb_squat","kb_goblet","bw_squat","jump_squat","pistol"],
  lunge:["split_squat","lunge","step_up","bw_split_squat","rev_lunge","step_up_bw"],
  hinge:["rdl","sl_rdl","bb_deadlift","bb_rdl","kb_swing","nordic","sl_rdl_bw"],
  bridge:["hip_thrust","glute_bridge","bb_hip_thrust","bw_bridge","sl_bridge"],
};
export const PATTERN = Object.fromEntries(Object.entries(PATTERNS).flatMap(([p, keys]) => keys.map(k => [k, p])));
export const patternOf = key => PATTERN[key] || null;

// ---------- day templates ----------
// Each day is a list of slots; a slot names acceptable muscle groups in order of preference.
// Slots are ordered compounds first, so trimming for a short session drops isolation work.
const T = {
  push:  [["chest"],["chest_upper","chest"],["shoulders"],["side_delts"],["triceps"],["chest"],["triceps"]],
  pull:  [["lats"],["back"],["back","lats"],["rear_delts"],["biceps"],["biceps"],["traps"]],
  legs:  [["quads"],["hams"],["quads"],["glutes"],["calves"],["hams"]],
  upper: [["chest"],["back"],["shoulders"],["lats"],["side_delts"],["biceps"],["triceps"]],
  full:  [["quads"],["chest"],["back"],["hams"],["shoulders"],["biceps"],["triceps"]],
  arms:  [["shoulders"],["side_delts"],["rear_delts"],["biceps"],["triceps"],["biceps"],["triceps"]],
  core:  [["abs"],["abs_lower"],["obliques"]],
  coreday:[["abs"],["abs_lower"],["obliques"],["abs"],["obliques"]],
  lowerA:[["quads"],["hams"],["quads"],["calves"],["glutes"]],
  lowerB:[["glutes"],["hams"],["quads"],["calves"],["hams"]],
};
const DAY_META = {
  push:{name:"Push", focus:"Chest · Shoulders · Tri"}, pull:{name:"Pull", focus:"Back · Biceps"}, legs:{name:"Legs", focus:"Quads · Hams · Glutes"},
  upper:{name:"Upper", focus:"Chest · Back · Arms"}, full:{name:"Full body", focus:"Everything, once"}, arms:{name:"Arms & delts", focus:"Shoulders · Arms"},
  coreday:{name:"Core", focus:"Abs · Obliques"}, lowerA:{name:"Lower A", focus:"Quads · Hams"}, lowerB:{name:"Lower B", focus:"Glutes · Hams"},
};

// Pick the split from how many days you train and what you want to work.
export function chooseSplit(days, focus){
  const up = focus.includes("upper"), lo = focus.includes("lower"), core = focus.includes("core");
  let split;
  if (up && lo) split = {2:["full","full"],3:["full","full","full"],4:["upper","legs","upper","legs"],5:["upper","legs","upper","legs","full"],6:["push","pull","legs","push","pull","legs"]}[days];
  else if (up) split = {2:["upper","upper"],3:["push","pull","upper"],4:["push","pull","push","pull"],5:["push","pull","push","pull","arms"],6:["push","pull","arms","push","pull","arms"]}[days];
  else if (lo) split = {2:["lowerA","lowerB"],3:["lowerA","lowerB","lowerA"],4:["lowerA","lowerB","lowerA","lowerB"],5:["lowerA","lowerB","lowerA","lowerB","legs"],6:["lowerA","lowerB","legs","lowerA","lowerB","legs"]}[days];
  else split = Array.from({length:days}, () => "coreday");
  if (!split) split = Array.from({length:Math.max(1,days)}, (_,i) => (up&&lo) ? ["upper","legs"][i%2] : up ? ["push","pull"][i%2] : lo ? ["lowerA","lowerB"][i%2] : "coreday");
  return split.map(k => ({kind:k, core: core && k!=="coreday"}));
}

// ---------- builder ----------
export function buildProgram(opts){
  const {gear, prog, trainingDays, block = 1} = opts;
  const days = Math.min(6, Math.max(1, trainingDays.length || 4));
  const focus = prog.focus && prog.focus.length ? prog.focus : ["upper","core"];
  const have = new Set(gear.equipment || []);
  if (gear.bar) have.add("bar");
  if (gear.bench && gear.bench !== "none") have.add("bench"); if (gear.bench === "incline") have.add("incline");
  if (!have.has("bench")) have.delete("incline");
  const excluded = new Set(prog.excluded || []);
  const ok = e => !excluded.has(e.key) && e.needs.every(n => have.has(n)) && !e.unless.some(n => have.has(n)) && (e.bw || (e.equip === "db" ? (have.has("dumbbells") && gear.dumbbells.length > 0) : e.equip === "kb" ? (gear.kettlebells||[]).length > 0 : true));
  const rep = {size:{compound:"8–12", iso:"12–15"}, strength:{compound:"5–8", iso:"8–12"}, endurance:{compound:"12–15", iso:"15–20"}}[prog.goal || "size"];
  const liftsPer = {short:4, standard:6, long:8}[prog.length || "standard"];
  const setsFor = e => (prog.goal === "strength" && e.kind === "compound") ? 4 : e.kind === "compound" ? 4 : 3;
  const expMult = {new:0.8, some:1, experienced:1.2}[prog.experience || "some"];
  const bwMult = Math.pow((prog.bodyweight || 150) / 150, 0.7);
  const startFor = e => { if (e.bw) return 0; const w = Math.max(5, Math.round(e.start * expMult * bwMult / 5) * 5); return ladder(e.equip, gear).nearest(w); };
  const repsFor = e => e.reps ? e.reps : e.timed ? "20–45" : e.bw && e.region !== "core" ? "max" : e.region === "core" && e.bw ? "10–15" : rep[e.kind];
  const toRow = (e, sets) => [e.key, e.name, sets || setsFor(e), repsFor(e), startFor(e), e.q, e.g, null];

  const split = chooseSplit(days, focus);
  const usedCount = {};                                  // spread variety across the week
  // each new block nudges the second-choice exercises up so the plan rotates without losing the main lifts
  const rot = e => { if (block <= 1 || e.pri === 0) return 0; let h = block; for (const ch of e.key) h = (h * 31 + ch.charCodeAt(0)) % 97; return h % 2 ? -1.5 : 0; };
  // Variety within a day: a lift whose movement pattern is already in the day scores 3 worse per repeat,
  // so the third "back" slot becomes a pullover or rear-delt move rather than a third row.
  const patternsToday = usedToday => { const c = {}; for (const k of usedToday) { const p = PATTERN[k]; if (p) c[p] = (c[p] || 0) + 1; } return c; };
  const pick = (groups, usedToday, slot = 9) => {
    const pt = patternsToday(usedToday);
    // the first two slots of a day should be compounds when any exist for the group
    const score = e => e.pri + rot(e) + (usedCount[e.key]||0)*2 + (PATTERN[e.key] ? (pt[PATTERN[e.key]] || 0) * 3 : 0) + (slot < 2 && e.kind !== "compound" ? 4 : 0);
    // all of the slot's groups compete, earlier groups with a small head start
    const cands = groups.flatMap((g, gi) => LIB.filter(e => e.group === g && ok(e) && !usedToday.has(e.key)).map(e => [score(e) + gi * 0.5, e])).sort((a, b) => a[0] - b[0]);
    return cands.length ? cands[0][1] : null;
  };
  const program = split.map((d, i) => {
    const usedToday = new Set(); const ex = [];
    for (const [si, slot] of T[d.kind].entries()) { if (ex.length >= liftsPer) break; const e = pick(slot, usedToday, si); if (e) { usedToday.add(e.key); usedCount[e.key] = (usedCount[e.key]||0) + 1; ex.push(e); } }
    let coreEx = [];
    if (d.core && (days <= 2 || i % 2 === 1 || days === 3)) {           // core finisher on every other day (every day when 2–3 days)
      for (const slot of T.core) { const e = pick(slot, usedToday); if (e) { usedToday.add(e.key); usedCount[e.key] = (usedCount[e.key]||0) + 1; coreEx.push(e); } }
    }
    const meta = DAY_META[d.kind];
    return {key:"d"+(i+1), name:meta.name, focus:meta.focus + (coreEx.length ? " · Abs" : ""), ex:[...ex.map(e => toRow(e)), ...coreEx.map(e => toRow(e, 2))]};
  });
  const balanced = rebalance(program, focus);
  if (prog.supersets !== false) balanced.forEach(d => pairIsolation(d));
  return balanced;
}
// Superset: the last two isolation lifts that work different muscles share a pair tag ("A").
function pairIsolation(day){
  const iso = day.ex.map((e, i) => [e, i]).filter(([e]) => LIB_BY_KEY[e[0]] && LIB_BY_KEY[e[0]].kind === "iso" && LIB_BY_KEY[e[0]].region !== "core");
  for (let a = iso.length - 1; a > 0; a--) { const [ea, ia] = iso[a], [eb, ib] = iso[a - 1];
    if (MUSCLE[LIB_BY_KEY[ea[0]].group] !== MUSCLE[LIB_BY_KEY[eb[0]].group] && Math.abs(ia - ib) === 1 && ea[2] === eb[2]) { ea[7] = "A"; eb[7] = "A"; return; } }
}

// Keep weekly hard sets per muscle inside the growth window: add a set to the lifts of an
// under-served muscle, trim one from an over-served one. Compounds first, never below 2 or above 5.
const MUSCLE = {chest:"chest", chest_upper:"chest", shoulders:"shoulders", side_delts:"shoulders", rear_delts:"shoulders", triceps:"arms", biceps:"arms", lats:"back", back:"back", traps:"back", quads:"legs", hams:"legs", glutes:"legs", calves:"legs", abs:"core", abs_lower:"core", obliques:"core"};
const WINDOW = {chest:[10,20], back:[10,20], shoulders:[8,20], arms:[8,18], legs:[10,20], core:[6,14]};
function rebalance(program, focus){
  const want = new Set(); if (focus.includes("upper")) ["chest","back","shoulders","arms"].forEach(m => want.add(m)); if (focus.includes("lower")) want.add("legs"); if (focus.includes("core")) want.add("core");
  const count = () => { const c = {}; program.forEach(d => d.ex.forEach(e => { const m = MUSCLE[LIB_BY_KEY[e[0]].group]; c[m] = (c[m] || 0) + e[2]; })); return c; };
  for (let pass = 0; pass < 6; pass++) {
    const c = count(); let changed = false;
    for (const m of want) {
      const [lo, hi] = WINDOW[m]; const rows = program.flatMap(d => d.ex).filter(e => MUSCLE[LIB_BY_KEY[e[0]].group] === m).sort((a, b) => (LIB_BY_KEY[a[0]].kind === "compound" ? 0 : 1) - (LIB_BY_KEY[b[0]].kind === "compound" ? 0 : 1));
      if (!rows.length) continue;
      if ((c[m] || 0) < lo) { const r = rows.find(e => e[2] < 5); if (r) { r[2]++; changed = true; } }
      else if ((c[m] || 0) > hi) { const r = rows.slice().reverse().find(e => e[2] > 2); if (r) { r[2]--; changed = true; } }
    }
    if (!changed) break;
  }
  return program;
}

export const PROGRAM_DEFAULTS = {focus:["upper","core"], goal:"size", length:"standard", experience:"some", bodyweight:150, excluded:[], supersets:true};

export const BODYWEIGHT_EX = new Set(LIB.filter(e => e.bw).map(e => e.key));
export const CORE_BW = new Set(LIB.filter(e => e.bw && e.region === "core").map(e => e.key));
export const TIMED = new Set(LIB.filter(e => e.timed).map(e => e.key));
export const COMPOUND = new Set(LIB.filter(e => e.kind === "compound" && e.region !== "core").map(e => e.key));
export const EX_IMG = Object.fromEntries(LIB.map(e => [e.key, e.img]));
export const exImg = key => `${(typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/"}img/ex-${EX_IMG[key] || "press"}.png`;
export const howTo = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent("how to " + q);
export const GEAR_DEFAULTS = {v2:true, dumbbells:[10,15,20,25,30,35,40,45,50], bar:true, bench:"incline", equipment:["dumbbells","bench","bar"],
  kettlebells:[], barbell:{bar:45, plateMin:2.5, max:300, plates:[45,25,10,5,2.5]}, ezbar:{bar:25}, cable:{max:200, inc:10}, bands:["light","medium","heavy"]};
export const KB_WEIGHTS = [10,15,20,25,30,35,40,45,50,53,60,70,80];
export const normalizeGear = g => {
  const legacy = !Array.isArray(g.equipment) || !g.equipment.includes("dumbbells") && !g.equipment.includes("bench") && (g.dumbbells || []).length > 0 && !g.v2;
  const eq = new Set(Array.isArray(g.equipment) ? g.equipment : (g.bar !== false ? ["bar"] : []));
  if (legacy) { if ((g.dumbbells || []).length) eq.add("dumbbells"); if (g.bench && g.bench !== "none") eq.add("bench"); }
  return {...GEAR_DEFAULTS, ...g, v2:true, barbell:{...GEAR_DEFAULTS.barbell, ...(g.barbell||{}), plates:(g.barbell && Array.isArray(g.barbell.plates) && g.barbell.plates.length) ? g.barbell.plates : GEAR_DEFAULTS.barbell.plates}, ezbar:{...GEAR_DEFAULTS.ezbar, ...(g.ezbar||{})}, cable:{...GEAR_DEFAULTS.cable, ...(g.cable||{})},
    kettlebells:Array.isArray(g.kettlebells)?g.kettlebells:[], bands:Array.isArray(g.bands)?g.bands:GEAR_DEFAULTS.bands, dumbbells:Array.isArray(g.dumbbells)?g.dumbbells:[],
    equipment:[...eq], bar:eq.has("bar"), bench: eq.has("bench") ? (g.bench === "flat" ? "flat" : "incline") : "none"};
};
// How a lift's weight can move for the equipment it uses: {next(w), prev(w), nearest(w), max}
export function ladder(equip, gear){
  const list = equip === "kb" ? (gear.kettlebells||[]).slice().sort((a,b)=>a-b) : gear.dumbbells.slice().sort((a,b)=>a-b);
  if (equip === "db" || equip === "kb") return {
    next: w => { for (const x of list) if (x > w) return x; return null; },
    prev: w => { let p = null; for (const x of list) if (x < w) p = x; return p ?? (list[0] ?? w); },
    nearest: w => { if (!list.length) return w; let b = list[0]; for (const x of list) if (x <= w) b = x; return b; },
    max: list.length ? list[list.length - 1] : 0, list };
  if (equip === "ez") { const bb = gear.barbell || GEAR_DEFAULTS.barbell; const inc = (bb.plateMin || 2.5) * 2; const lo = (gear.ezbar && gear.ezbar.bar) || 25; const hi = Math.min(bb.max || 300, 200);
    return { next: w => w + inc <= hi ? w + inc : null, prev: w => Math.max(lo, w - inc * 2), nearest: w => Math.min(hi, Math.max(lo, lo + Math.round((w - lo) / inc) * inc)), max: hi }; }
  if (equip === "bb") { const bb = gear.barbell || GEAR_DEFAULTS.barbell; const inc = (bb.plateMin || 2.5) * 2; const lo = bb.bar || 45; const hi = bb.max || 300;
    return { next: w => w + inc <= hi ? w + inc : null, prev: w => Math.max(lo, w - inc * 2), nearest: w => Math.min(hi, Math.max(lo, lo + Math.round((w - lo) / inc) * inc)), max: hi }; }
  if (equip === "cable") { const c = gear.cable || GEAR_DEFAULTS.cable; const inc = c.inc || 10; const hi = c.max || 200;
    return { next: w => w + inc <= hi ? w + inc : null, prev: w => Math.max(inc, w - inc * 2), nearest: w => Math.min(hi, Math.max(inc, Math.round(w / inc) * inc)), max: hi }; }
  return { next: w => w + 5, prev: w => Math.max(5, w - 5), nearest: w => w, max: Infinity };
}
// Stored session plans are rows of objects (Firestore forbids nested arrays); in code they are arrays.
export const planToStore = ex => ex.map(e => Array.isArray(e) ? {key:e[0], name:e[1], sets:e[2], reps:e[3], w:e[4], q:e[5], g:e[6], pair:e[7] || null} : e);
export const planFromStore = pl => (pl || []).map(e => Array.isArray(e) ? e : [e.key, e.name, e.sets, e.reps, e.w, e.q, e.g, e.pair || null]);
// Alternatives for a swap: same muscle group, usable with this gear, not already in the day.
export function alternatives(key, gear, dayKeys){
  const e = LIB_BY_KEY[key]; if (!e) return [];
  const have = new Set(gear.equipment || []); if (gear.bar) have.add("bar"); if (gear.bench && gear.bench !== "none") have.add("bench"); if (gear.bench === "incline") have.add("incline");
  const ok = x => x.needs.every(n => have.has(n)) && (x.bw || (x.equip === "db" ? (have.has("dumbbells") && gear.dumbbells.length > 0) : x.equip === "kb" ? (have.has("kettlebell") && (gear.kettlebells||[]).length > 0) : true));
  const muscle = MUSCLE[e.group];
  const same = LIB.filter(x => x.key !== key && ok(x) && !dayKeys.includes(x.key) && x.group === e.group);
  const near = LIB.filter(x => x.key !== key && ok(x) && !dayKeys.includes(x.key) && x.group !== e.group && MUSCLE[x.group] === muscle && x.kind === e.kind);
  return [...same.sort((a, b) => a.pri - b.pri), ...near.sort((a, b) => a.pri - b.pri)];
}
export function rowFor(x, gear, prog){
  const rep = {size:{compound:"8–12", iso:"12–15"}, strength:{compound:"5–8", iso:"8–12"}, endurance:{compound:"12–15", iso:"15–20"}}[prog.goal || "size"];
  const expMult = {new:0.8, some:1, experienced:1.2}[prog.experience || "some"]; const bwMult = Math.pow((prog.bodyweight || 150) / 150, 0.7);
  const w = x.bw ? 0 : ladder(x.equip, gear).nearest(Math.max(5, Math.round(x.start * expMult * bwMult / 5) * 5));
  const reps = x.reps ? x.reps : x.timed ? "20–45" : x.bw && x.region !== "core" ? "max" : x.region === "core" && x.bw ? "10–15" : rep[x.kind];
  return [x.key, x.name, x.kind === "compound" ? 4 : 3, reps, w, x.q, x.g, null];
}
