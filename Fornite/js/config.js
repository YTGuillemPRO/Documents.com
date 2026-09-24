// ============ TUNING — everything you'd want to tweak lives here ============
const CFG = {
  WORLD_HALF: 240,        // island is 480x480
  GRID: 4,                // build grid size
  GRAVITY: 30, JUMP: 12, WALK: 6.4, SPRINT: 10.5,
  PLAYER_R: 0.5,
  BOT_COUNT: 23,          // + you = 24 players
  LOOT_COUNT: 110,
  BUILD_COST: 10, BUILD_HP: 150, MAX_PIECES: 400,
  MATS_START: 50, MATS_MAX: 500,
  SENS: 0.0023,
  TREES: 150, ROCKS: 55,
};

const RARITIES = [
  {name:'Common',    color:'#9aa3ad', mult:1.00, weight:34},
  {name:'Uncommon',  color:'#3fd24d', mult:1.12, weight:30},
  {name:'Rare',      color:'#37a9ff', mult:1.25, weight:21},
  {name:'Epic',      color:'#c04dff', mult:1.40, weight:11},
  {name:'Legendary', color:'#ffa22e', mult:1.60, weight:4},
];

const WEAPONS = {
  pickaxe:{name:'Pickaxe', short:'PICK',   melee:true, dmg:20, rof:0.5},
  pistol: {name:'Pistol',        short:'PISTOL', dmg:26, rof:0.34,  mag:16, reload:1.4, range:140, spread:0.014, auto:false, kick:0.006},
  smg:    {name:'SMG',           short:'SMG',    dmg:17, rof:0.095, mag:30, reload:1.8, range:110, spread:0.030, auto:true,  kick:0.004},
  ar:     {name:'Assault Rifle', short:'AR',     dmg:31, rof:0.185, mag:30, reload:2.1, range:220, spread:0.020, auto:true,  kick:0.005},
  shotgun:{name:'Pump Shotgun',  short:'PUMP',   dmg:10, rof:0.95,  mag:5,  reload:2.6, range:38,  spread:0.050, auto:false, kick:0.02, pellets:8},
  sniper: {name:'Bolt Sniper',   short:'SNIPER', dmg:110,rof:1.7,   mag:1,  reload:2.4, range:420, spread:0.002, auto:false, kick:0.03, scope:true},
};
// relative chance each weapon appears as floor loot
const WEAPON_DROP = [['ar',26],['smg',22],['shotgun',20],['pistol',18],['sniper',14]];

// wait(s) → shrink(s) → new radius, damage per second outside
const STORM_PHASES = [
  {wait:22, shrink:26, r:190, dps:1},
  {wait:16, shrink:22, r:120, dps:2},
  {wait:13, shrink:18, r:75,  dps:4},
  {wait:11, shrink:16, r:42,  dps:7},
  {wait:9,  shrink:14, r:18,  dps:10},
  {wait:8,  shrink:20, r:1,   dps:12},
];

const HOUSE_SPOTS = [[62,-46],[-84,28],[34,92],[-52,-88],[110,40]];
