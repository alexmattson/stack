// Stack program generator (pure).
// Builds PROGRAM (an array of training days) from the user's goals, schedule and equipment.
// Nothing here is shown as a list in the app; the workout page simply reflects what this produces.

// ---------- exercise library ----------
// key, name, group, region (push|pull|legs|core), kind (compound|iso), needs (equipment tags),
// bw (bodyweight), start (lb per hand for a 150 lb lifter with some experience), img, q (video search), g (guide), pri (lower = preferred)
// equip: db (per-hand dumbbell weight, stepped through the dumbbells you own) · bb (total bar weight, 5 lb steps)
// kb (kettlebell) · cable · band · bw (bodyweight). needs: equipment tags that must be present; unless: tags that make it redundant.
const EX = r => Object.assign({needs:[], unless:[], bw:false, start:0, pri:5, timed:false, equip:"db"}, r);
export const LIB = [
  // push: chest
  EX({key:"flat_press",   name:"Flat DB press",           group:"chest", region:"push", kind:"compound", needs:["bench"],         start:35, img:"press",   q:"dumbbell bench press form", g:"https://exrx.net/WeightExercises/PectoralSternal/DBBenchPress", pri:1}),
  EX({key:"floor_press", unless:["bench"],  name:"DB floor press",          group:"chest", region:"push", kind:"compound",                          start:35, img:"press",   q:"dumbbell floor press form", g:"https://exrx.net/Lists/ExList/ChestWt", pri:3}),
  EX({key:"incline_press",name:"Incline DB press",        group:"chest_upper", region:"push", kind:"compound", needs:["incline"], start:30, img:"incline", q:"incline dumbbell press form", g:"https://exrx.net/WeightExercises/PectoralClavicular/DBInclineBenchPress", pri:1}),
  EX({key:"pushup", unless:["bench"],       name:"Push-ups",                group:"chest", region:"push", kind:"compound", bw:true,                 img:"press",   q:"push up form", g:"https://exrx.net/WeightExercises/PectoralSternal/BWPushup", pri:4}),
  EX({key:"fly",          name:"DB flys",                 group:"chest", region:"push", kind:"iso", needs:["bench"],              start:15, img:"fly",     q:"dumbbell chest fly form", g:"https://exrx.net/Lists/ExList/ChestWt", pri:2}),
  EX({key:"floor_fly", unless:["bench"],    name:"Floor flys",              group:"chest", region:"push", kind:"iso",                               start:15, img:"fly",     q:"dumbbell floor fly form", g:"https://exrx.net/Lists/ExList/ChestWt", pri:4}),
  EX({key:"cg_press",     name:"Close-grip DB press",     group:"triceps", region:"push", kind:"compound", needs:["bench"],       start:25, img:"press",   q:"close grip dumbbell press", g:"https://exrx.net/Lists/ExList/ArmWt", pri:3}),
  // push: shoulders
  EX({key:"ohp",          name:"Seated DB shoulder press",group:"shoulders", region:"push", kind:"compound",                      start:25, img:"shoulder",q:"seated dumbbell shoulder press form", g:"https://exrx.net/Lists/ExList/ShoulderWt", pri:1}),
  EX({key:"arnold",       name:"Arnold press",            group:"shoulders", region:"push", kind:"compound",                      start:25, img:"shoulder",q:"arnold press form", g:"https://exrx.net/Lists/ExList/ShoulderWt", pri:2}),
  EX({key:"lateral",      name:"Lateral raises",          group:"side_delts", region:"push", kind:"iso",                          start:10, img:"raise",   q:"dumbbell lateral raise form", g:"https://exrx.net/Lists/ExList/ShoulderWt", pri:1}),
  EX({key:"front_raise",  name:"Front raises",            group:"shoulders", region:"push", kind:"iso",                           start:10, img:"raise",   q:"dumbbell front raise form", g:"https://exrx.net/Lists/ExList/ShoulderWt", pri:4}),
  // push: triceps
  EX({key:"oh_tri",       name:"Overhead triceps ext.",   group:"triceps", region:"push", kind:"iso",                             start:25, img:"tri",     q:"overhead dumbbell triceps extension form", g:"https://exrx.net/WeightExercises/Triceps/DBTriExt", pri:1}),
  EX({key:"skull",        name:"Skull-crushers",          group:"triceps", region:"push", kind:"iso", needs:["bench"],            start:15, img:"tri",     q:"dumbbell skull crusher form", g:"https://exrx.net/WeightExercises/Triceps/DBLyingTriExt", pri:2}),
  EX({key:"floor_skull", unless:["bench"],  name:"Floor skull-crushers",    group:"triceps", region:"push", kind:"iso",                             start:15, img:"tri",     q:"dumbbell skull crusher form", g:"https://exrx.net/WeightExercises/Triceps/DBLyingTriExt", pri:3}),
  EX({key:"kickback",     name:"Triceps kickbacks",       group:"triceps", region:"push", kind:"iso",                             start:10, img:"tri",     q:"dumbbell triceps kickback form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:4}),
  // pull: back
  EX({key:"chinup",       name:"Chin-ups",                group:"lats", region:"pull", kind:"compound", needs:["bar"], bw:true,   img:"pull",    q:"chin up form", g:"https://exrx.net/Lists/ExList/BackWt", pri:1}),
  EX({key:"pullup",       name:"Pull-ups (wide)",         group:"lats", region:"pull", kind:"compound", needs:["bar"], bw:true,   img:"pull",    q:"wide grip pull up form", g:"https://exrx.net/Lists/ExList/BackWt", pri:2}),
  EX({key:"row",          name:"One-arm DB row",          group:"back", region:"pull", kind:"compound",                           start:40, img:"row",     q:"one arm dumbbell row form", g:"https://exrx.net/Lists/ExList/BackWt", pri:1}),
  EX({key:"cs_row",       name:"Chest-supported row",     group:"back", region:"pull", kind:"compound", needs:["incline"],        start:30, img:"row",     q:"chest supported dumbbell row", g:"https://exrx.net/Lists/ExList/BackWt", pri:2}),
  EX({key:"bo_row",       name:"Bent-over DB row",        group:"back", region:"pull", kind:"compound",                           start:35, img:"row",     q:"bent over dumbbell row form", g:"https://exrx.net/Lists/ExList/BackWt", pri:3}),
  EX({key:"bo_row2",      name:"Bent-over row (both arms)",group:"lats", region:"pull", kind:"compound",                          start:30, img:"row",     q:"bent over dumbbell row form", g:"https://exrx.net/Lists/ExList/BackWt", pri:4}),
  EX({key:"renegade",     name:"Renegade row",            group:"lats", region:"pull", kind:"compound",                           start:25, img:"row",     q:"renegade row form", g:"https://exrx.net/Lists/ExList/BackWt", pri:5}),
  EX({key:"pullover",     name:"DB pullover",             group:"lats", region:"pull", kind:"iso", needs:["bench"],               start:30, img:"pull",    q:"dumbbell pullover form", g:"https://exrx.net/Lists/ExList/ChestWt", pri:3}),
  EX({key:"floor_pullover", unless:["bench"],name:"Floor pullover",         group:"lats", region:"pull", kind:"iso",                                start:30, img:"pull",    q:"dumbbell pullover form", g:"https://exrx.net/Lists/ExList/ChestWt", pri:5}),
  EX({key:"rear_fly",     name:"Rear-delt flys",          group:"rear_delts", region:"pull", kind:"iso",                          start:10, img:"raise",   q:"dumbbell rear delt fly form", g:"https://exrx.net/Lists/ExList/ShoulderWt", pri:1}),
  EX({key:"shrug",        name:"Shrugs",                  group:"traps", region:"pull", kind:"iso",                               start:50, img:"raise",   q:"dumbbell shrug form", g:"https://exrx.net/Lists/ExList/BackWt", pri:2}),
  // pull: biceps
  EX({key:"curl",         name:"DB curls",                group:"biceps", region:"pull", kind:"iso",                              start:20, img:"curl",    q:"dumbbell bicep curl form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:1}),
  EX({key:"inc_curl",     name:"Incline curls",           group:"biceps", region:"pull", kind:"iso", needs:["incline"],           start:15, img:"curl",    q:"incline dumbbell curl form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:2}),
  EX({key:"hammer",       name:"Hammer curls",            group:"biceps", region:"pull", kind:"iso",                              start:20, img:"curl",    q:"hammer curl form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:2}),
  EX({key:"alt_curl",     name:"Alternating curls",       group:"biceps", region:"pull", kind:"iso",                              start:20, img:"curl",    q:"alternating dumbbell curl form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:3}),
  EX({key:"conc_curl",    name:"Concentration curls",     group:"biceps", region:"pull", kind:"iso",                              start:15, img:"curl",    q:"concentration curl form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:4}),
  // legs
  EX({key:"goblet",       name:"Goblet squat",            group:"quads", region:"legs", kind:"compound",                          start:40, img:"squat",   q:"goblet squat form", g:"https://exrx.net/Lists/ExList/ThighWt", pri:1}),
  EX({key:"db_squat", unless:["bench"],     name:"DB squat (two hands)",    group:"quads", region:"legs", kind:"compound",                          start:35, img:"squat",   q:"dumbbell squat form", g:"https://exrx.net/Lists/ExList/ThighWt", pri:3}),
  EX({key:"split_squat",  name:"Bulgarian split squat",   group:"quads", region:"legs", kind:"compound", needs:["bench"],         start:20, img:"lunge",   q:"bulgarian split squat form", g:"https://exrx.net/Lists/ExList/ThighWt", pri:1}),
  EX({key:"lunge",        name:"Walking lunges",          group:"quads", region:"legs", kind:"compound",                          start:20, img:"lunge",   q:"dumbbell walking lunge form", g:"https://exrx.net/Lists/ExList/ThighWt", pri:2}),
  EX({key:"step_up",      name:"Step-ups",                group:"quads", region:"legs", kind:"compound", needs:["bench"],         start:20, img:"lunge",   q:"dumbbell step up form", g:"https://exrx.net/Lists/ExList/ThighWt", pri:3}),
  EX({key:"rdl",          name:"Romanian deadlift",       group:"hams", region:"legs", kind:"compound",                           start:40, img:"hinge",   q:"dumbbell romanian deadlift form", g:"https://exrx.net/Lists/ExList/HamstringWt", pri:1}),
  EX({key:"sl_rdl",       name:"Single-leg RDL",          group:"hams", region:"legs", kind:"compound",                           start:25, img:"hinge",   q:"single leg dumbbell romanian deadlift form", g:"https://exrx.net/Lists/ExList/HamstringWt", pri:2}),
  EX({key:"hip_thrust",   name:"DB hip thrust",           group:"glutes", region:"legs", kind:"compound", needs:["bench"],        start:45, img:"hinge",   q:"dumbbell hip thrust form", g:"https://exrx.net/Lists/ExList/HipWt", pri:1}),
  EX({key:"glute_bridge", unless:["bench"], name:"Glute bridge",            group:"glutes", region:"legs", kind:"compound",                         start:40, img:"hinge",   q:"dumbbell glute bridge form", g:"https://exrx.net/Lists/ExList/HipWt", pri:2}),
  EX({key:"calf_raise",   name:"Standing calf raises",    group:"calves", region:"legs", kind:"iso",                              start:40, img:"squat",   q:"dumbbell calf raise form", g:"https://exrx.net/Lists/ExList/CalfWt", pri:1}),
  EX({key:"ham_curl",     name:"Lying DB hamstring curl", group:"hams", region:"legs", kind:"iso",                                start:15, img:"hinge",   q:"lying dumbbell hamstring curl", g:"https://exrx.net/Lists/ExList/HamstringWt", pri:3}),
  // core
  EX({key:"wt_crunch",    name:"Weighted crunch",         group:"abs", region:"core", kind:"iso",                                 start:15, img:"abs",     q:"dumbbell weighted crunch form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:1}),
  EX({key:"knee_raise",   name:"Hanging knee raises",     group:"abs_lower", region:"core", kind:"iso", needs:["bar"], bw:true,   img:"abs",     q:"hanging knee raise form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:1}),
  EX({key:"leg_raise",    name:"Hanging leg raises",      group:"abs_lower", region:"core", kind:"iso", needs:["bar"], bw:true,   img:"abs",     q:"hanging leg raise form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:2}),
  EX({key:"lying_leg_raise",name:"Lying leg raises",      group:"abs_lower", region:"core", kind:"iso", bw:true,                  img:"abs",     q:"lying leg raise form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:3}),
  EX({key:"rev_crunch",   name:"Reverse crunch",          group:"abs_lower", region:"core", kind:"iso", bw:true,                  img:"abs",     q:"reverse crunch form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:4}),
  EX({key:"side_plank",   name:"Side plank (sec per side)",group:"obliques", region:"core", kind:"iso", bw:true, timed:true,      img:"sideplank",q:"side plank form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:1}),
  EX({key:"side_bend",    name:"DB side bend (per side)", group:"obliques", region:"core", kind:"iso",                            start:25, img:"sideplank",q:"dumbbell side bend form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:2}),
  EX({key:"plank",        name:"Plank (seconds)",         group:"abs", region:"core", kind:"iso", bw:true, timed:true,            img:"sideplank",q:"plank form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:3}),
  EX({key:"russian_twist",name:"Russian twist (per side)",group:"obliques", region:"core", kind:"iso",                            start:15, img:"abs",     q:"dumbbell russian twist form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:3}),
  // barbell (needs plates; rack for squat/bench)
  EX({key:"bb_bench",     name:"Barbell bench press",     group:"chest", region:"push", kind:"compound", needs:["barbell","rack","bench"], equip:"bb", start:95, img:"press", q:"barbell bench press form", g:"https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress", pri:0}),
  EX({key:"bb_incline",   name:"Barbell incline press",   group:"chest_upper", region:"push", kind:"compound", needs:["barbell","rack","incline"], equip:"bb", start:75, img:"incline", q:"incline barbell bench press form", g:"https://exrx.net/WeightExercises/PectoralClavicular/BBInclineBenchPress", pri:1}),
  EX({key:"bb_ohp",       name:"Barbell overhead press",  group:"shoulders", region:"push", kind:"compound", needs:["barbell"], equip:"bb", start:65, img:"shoulder", q:"barbell overhead press form", g:"https://exrx.net/WeightExercises/DeltoidAnterior/BBMilitaryPress", pri:0}),
  EX({key:"bb_row",       name:"Barbell row",             group:"back", region:"pull", kind:"compound", needs:["barbell"], equip:"bb", start:95, img:"row", q:"barbell row form", g:"https://exrx.net/WeightExercises/BackGeneral/BBBentOverRow", pri:0}),
  EX({key:"bb_curl",      name:"Barbell curl",            group:"biceps", region:"pull", kind:"iso", needs:["barbell"], equip:"bb", start:45, img:"curl", q:"barbell curl form", g:"https://exrx.net/WeightExercises/Biceps/BBCurl", pri:1}),
  EX({key:"bb_squat",     name:"Barbell back squat",      group:"quads", region:"legs", kind:"compound", needs:["barbell","rack"], equip:"bb", start:115, img:"squat", q:"barbell back squat form", g:"https://exrx.net/WeightExercises/Quadriceps/BBSquat", pri:0}),
  EX({key:"bb_deadlift",  name:"Barbell deadlift",        group:"hams", region:"legs", kind:"compound", needs:["barbell"], equip:"bb", start:135, img:"hinge", q:"barbell deadlift form", g:"https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift", pri:0}),
  EX({key:"bb_rdl",       name:"Barbell Romanian deadlift",group:"hams", region:"legs", kind:"compound", needs:["barbell"], equip:"bb", start:95, img:"hinge", q:"barbell romanian deadlift form", g:"https://exrx.net/WeightExercises/Hamstrings/BBStraightLegDeadlift", pri:1}),
  EX({key:"bb_hip_thrust",name:"Barbell hip thrust",      group:"glutes", region:"legs", kind:"compound", needs:["barbell","bench"], equip:"bb", start:95, img:"hinge", q:"barbell hip thrust form", g:"https://exrx.net/Lists/ExList/HipWt", pri:0}),
  EX({key:"ez_curl",      name:"EZ-bar curl",             group:"biceps", region:"pull", kind:"iso", needs:["ezbar"], equip:"ez", start:40, img:"curl", q:"ez bar curl form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:1}),
  EX({key:"ez_skull",     name:"EZ-bar skull-crushers",   group:"triceps", region:"push", kind:"iso", needs:["ezbar","bench"], equip:"ez", start:40, img:"tri", q:"ez bar skull crusher form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:1}),
  // kettlebell
  EX({key:"kb_swing",     name:"Kettlebell swing",        group:"hams", region:"legs", kind:"compound", needs:["kettlebell"], equip:"kb", start:35, img:"hinge", q:"kettlebell swing form", g:"https://exrx.net/WeightExercises/GluteusMaximus/KBSwing", pri:2}),
  EX({key:"kb_goblet",    name:"Kettlebell goblet squat", group:"quads", region:"legs", kind:"compound", needs:["kettlebell"], equip:"kb", start:35, img:"squat", q:"kettlebell goblet squat form", g:"https://exrx.net/Lists/ExList/ThighWt", pri:2}),
  EX({key:"kb_press",     name:"Kettlebell press",        group:"shoulders", region:"push", kind:"compound", needs:["kettlebell"], equip:"kb", start:25, img:"shoulder", q:"kettlebell press form", g:"https://exrx.net/Lists/ExList/ShoulderWt", pri:3}),
  // dip station / parallel bars
  EX({key:"dip",          name:"Dips",                    group:"chest", region:"push", kind:"compound", needs:["dipbars"], bw:true, equip:"bw", img:"press", q:"dip form", g:"https://exrx.net/WeightExercises/PectoralSternal/BWChestDip", pri:1}),
  EX({key:"dip_knee_raise",name:"Captain's chair knee raises",group:"abs_lower", region:"core", kind:"iso", needs:["dipbars"], bw:true, equip:"bw", img:"abs", q:"captains chair knee raise form", g:"https://exrx.net/Lists/ExList/WaistWt", pri:2}),
  // cable machine
  EX({key:"lat_pulldown", name:"Lat pulldown",            group:"lats", region:"pull", kind:"compound", needs:["cable"], equip:"cable", start:80, img:"pull", q:"lat pulldown form", g:"https://exrx.net/WeightExercises/LatissimusDorsi/CBPulldown", pri:1}),
  EX({key:"cable_row",    name:"Seated cable row",        group:"back", region:"pull", kind:"compound", needs:["cable"], equip:"cable", start:80, img:"row", q:"seated cable row form", g:"https://exrx.net/WeightExercises/BackGeneral/CBSeatedRow", pri:1}),
  EX({key:"face_pull",    name:"Face pulls",              group:"rear_delts", region:"pull", kind:"iso", needs:["cable"], equip:"cable", start:30, img:"raise", q:"face pull form", g:"https://exrx.net/WeightExercises/DeltoidPosterior/CBRearDeltRow", pri:0}),
  EX({key:"pushdown",     name:"Triceps pushdown",        group:"triceps", region:"push", kind:"iso", needs:["cable"], equip:"cable", start:40, img:"tri", q:"triceps pushdown form", g:"https://exrx.net/WeightExercises/Triceps/CBPushdown", pri:0}),
  EX({key:"cable_curl",   name:"Cable curl",              group:"biceps", region:"pull", kind:"iso", needs:["cable"], equip:"cable", start:40, img:"curl", q:"cable curl form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:3}),
  EX({key:"cable_crunch", name:"Cable crunch",            group:"abs", region:"core", kind:"iso", needs:["cable"], equip:"cable", start:50, img:"abs", q:"cable crunch form", g:"https://exrx.net/WeightExercises/RectusAbdominis/CBKneelingCrunch", pri:0}),
  // bands
  EX({key:"band_pullapart",name:"Band pull-aparts",       group:"rear_delts", region:"pull", kind:"iso", needs:["bands"], equip:"band", start:0, bw:true, img:"raise", q:"band pull apart form", g:"https://exrx.net/Lists/ExList/ShoulderWt", pri:2}),
  EX({key:"band_facepull", name:"Band face pulls",        group:"rear_delts", region:"pull", kind:"iso", needs:["bands"], unless:["cable"], equip:"band", start:0, bw:true, img:"raise", q:"band face pull form", g:"https://exrx.net/Lists/ExList/ShoulderWt", pri:1}),
  EX({key:"band_pushdown", name:"Band triceps pushdown",  group:"triceps", region:"push", kind:"iso", needs:["bands"], unless:["cable"], equip:"band", start:0, bw:true, img:"tri", q:"band triceps pushdown form", g:"https://exrx.net/Lists/ExList/ArmWt", pri:3}),
  // ab wheel
  EX({key:"ab_rollout",   name:"Ab wheel rollouts",       group:"abs", region:"core", kind:"iso", needs:["abwheel"], bw:true, equip:"bw", img:"abs", q:"ab wheel rollout form", g:"https://exrx.net/WeightExercises/RectusAbdominis/BWRollout", pri:0}),
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
  const {gear, prog, trainingDays} = opts;
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
  const repsFor = e => e.bw && e.region !== "core" ? "max" : e.timed ? "20–45" : e.region === "core" && e.bw ? "10–15" : rep[e.kind];
  const toRow = (e, sets) => [e.key, e.name, sets || setsFor(e), repsFor(e), startFor(e), e.q, e.g];

  const split = chooseSplit(days, focus);
  const usedCount = {};                                  // spread variety across the week
  const pick = (groups, usedToday) => {
    for (const g of groups) {
      const cands = LIB.filter(e => e.group === g && ok(e) && !usedToday.has(e.key)).sort((a,b) => (a.pri + (usedCount[a.key]||0)*2) - (b.pri + (usedCount[b.key]||0)*2));
      if (cands.length) return cands[0];
    }
    return null;
  };
  const program = split.map((d, i) => {
    const usedToday = new Set(); const ex = [];
    for (const slot of T[d.kind]) { if (ex.length >= liftsPer) break; const e = pick(slot, usedToday); if (e) { usedToday.add(e.key); usedCount[e.key] = (usedCount[e.key]||0) + 1; ex.push(e); } }
    let coreEx = [];
    if (d.core && (days <= 2 || i % 2 === 1 || days === 3)) {           // core finisher on every other day (every day when 2–3 days)
      for (const slot of T.core) { const e = pick(slot, usedToday); if (e) { usedToday.add(e.key); usedCount[e.key] = (usedCount[e.key]||0) + 1; coreEx.push(e); } }
    }
    const meta = DAY_META[d.kind];
    return {key:"d"+(i+1), name:meta.name, focus:meta.focus + (coreEx.length ? " · Abs" : ""), ex:[...ex.map(e => toRow(e)), ...coreEx.map(e => toRow(e, 2))]};
  });
  return program;
}

export const PROGRAM_DEFAULTS = {focus:["upper","core"], goal:"size", length:"standard", experience:"some", bodyweight:150, excluded:[]};

export const BODYWEIGHT_EX = new Set(LIB.filter(e => e.bw).map(e => e.key));
export const CORE_BW = new Set(LIB.filter(e => e.bw && e.region === "core").map(e => e.key));
export const TIMED = new Set(LIB.filter(e => e.timed).map(e => e.key));
export const COMPOUND = new Set(LIB.filter(e => e.kind === "compound" && e.region !== "core").map(e => e.key));
export const EX_IMG = Object.fromEntries(LIB.map(e => [e.key, e.img]));
export const exImg = key => `${(typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/"}img/ex-${EX_IMG[key] || "press"}.png`;
export const howTo = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent("how to " + q);
export const GEAR_DEFAULTS = {v2:true, dumbbells:[10,15,20,25,30,35,40,45,50], bar:true, bench:"incline", equipment:["dumbbells","bench","bar"],
  kettlebells:[], barbell:{bar:45, plateMin:2.5, max:300}, ezbar:{bar:25}, cable:{max:200, inc:10}, bands:["light","medium","heavy"]};
export const KB_WEIGHTS = [10,15,20,25,30,35,40,45,50,53,60,70,80];
export const normalizeGear = g => {
  const legacy = !Array.isArray(g.equipment) || !g.equipment.includes("dumbbells") && !g.equipment.includes("bench") && (g.dumbbells || []).length > 0 && !g.v2;
  const eq = new Set(Array.isArray(g.equipment) ? g.equipment : (g.bar !== false ? ["bar"] : []));
  if (legacy) { if ((g.dumbbells || []).length) eq.add("dumbbells"); if (g.bench && g.bench !== "none") eq.add("bench"); }
  return {...GEAR_DEFAULTS, ...g, v2:true, barbell:{...GEAR_DEFAULTS.barbell, ...(g.barbell||{})}, ezbar:{...GEAR_DEFAULTS.ezbar, ...(g.ezbar||{})}, cable:{...GEAR_DEFAULTS.cable, ...(g.cable||{})},
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
export const planToStore = ex => ex.map(e => Array.isArray(e) ? {key:e[0], name:e[1], sets:e[2], reps:e[3], w:e[4], q:e[5], g:e[6]} : e);
export const planFromStore = pl => (pl || []).map(e => Array.isArray(e) ? e : [e.key, e.name, e.sets, e.reps, e.w, e.q, e.g]);
