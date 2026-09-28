// ============ TUNING — everything you'd want to tweak lives here ============
const CFG={WORLD_HALF:240,ISLAND_R:240,WATER_Y:-0.6,GRID:4,GRAVITY:30,JUMP:12,WALK:6.4,SPRINT:10.5,
PLAYER_R:0.5,BOT_COUNT:23,LOOT_COUNT:110,BUILD_COST:10,BUILD_HP:150,MAX_PIECES:400,MATS_START:50,MATS_MAX:500,
SENS:0.0023,TREES:150,ROCKS:55,PICKUP_RANGE:3.2,AUTOPICK_RANGE:2.0,LIGHTNING:true,
CHESTS:10,SUPPLY:{first:40,every:55},DAYNIGHT:{on:true,len:300}};

// ============ SEASON / PROGRESSION ============
const SEASON={name:'SEASON 1',title:'The First Storm'};
const XP_BASE_MATCH=140, XP_PER_KILL=45, XP_WIN_BONUS=250;
const QUEST_POOL=[
  {type:'elims', n:3,  txt:'Eliminate 3 opponents',      xp:300},
  {type:'elims', n:5,  txt:'Eliminate 5 opponents',      xp:450},
  {type:'mats',  n:200,txt:'Harvest 200 materials',      xp:200},
  {type:'shield',n:2,  txt:'Collect 2 Shield Potions',   xp:150},
  {type:'ammo',  n:3,  txt:'Collect 3 Ammo Boxes',       xp:150},
  {type:'play',  n:2,  txt:'Play 2 matches',             xp:150},
  {type:'win',   n:1,  txt:'Win a Victory Royale',       xp:500},
];

const RARITIES=[
{name:'Common',   color:'#9aa3ad',mult:1.00,weight:34},
{name:'Uncommon', color:'#3fd24d',mult:1.12,weight:30},
{name:'Rare',     color:'#37a9ff',mult:1.25,weight:21},
{name:'Epic',     color:'#c04dff',mult:1.40,weight:11},
{name:'Legendary',color:'#ffa22e',mult:1.60,weight:4}];

const WEAPONS={
pickaxe:{name:'Pickaxe',short:'PICK',melee:true,dmg:20,rof:0.5},
pistol:{name:'Pistol',short:'PISTOL',dmg:26,rof:0.34,mag:16,reload:1.4,range:140,spread:0.014,auto:false,kick:0.006},
smg:{name:'SMG',short:'SMG',dmg:17,rof:0.095,mag:30,reload:1.8,range:110,spread:0.030,auto:true,kick:0.004},
ar:{name:'Assault Rifle',short:'AR',dmg:31,rof:0.185,mag:30,reload:2.1,range:220,spread:0.020,auto:true,kick:0.005},
shotgun:{name:'Pump Shotgun',short:'PUMP',dmg:10,rof:0.95,mag:5,reload:2.6,range:38,spread:0.050,auto:false,kick:0.02,pellets:8},
sniper:{name:'Bolt Sniper',short:'SNIPER',dmg:110,rof:1.7,mag:1,reload:2.4,range:420,spread:0.002,auto:false,kick:0.03,scope:true},
rocket:{name:'Rocket Launcher',short:'RPG',dmg:120,rof:1.6,mag:1,reload:2.8,range:300,spread:0.004,auto:false,kick:0.05,projectile:true}};

const WEAPON_DROP=[['ar',24],['smg',21],['shotgun',19],['pistol',17],['sniper',13],['rocket',6]];

const STORM_PHASES=[
{wait:22,shrink:26,r:190,dps:1},
{wait:16,shrink:22,r:120,dps:2},
{wait:13,shrink:18,r:75, dps:4},
{wait:11,shrink:16,r:42, dps:7},
{wait:9, shrink:14,r:18, dps:10},
{wait:8, shrink:20,r:1,  dps:12}];

const HOUSE_SPOTS=[[62,-46],[-84,28],[34,92],[-52,-88],[110,40]];

const OUTFITS=[
{id:'recruit', name:'Recruit',     shirt:'#3fa060',pants:'#c8a06a',skin:'#f2c18f',hair:'#e8cf6a',pack:'#3b4a3f'},
{id:'midnight',name:'Midnight Ops',shirt:'#2a3244',pants:'#1b2230',skin:'#e0a370',hair:'#26262b',pack:'#ff8b3a'},
{id:'crimson', name:'Crimson Ace', shirt:'#c73e34',pants:'#2c2c34',skin:'#f2c18f',hair:'#a33b2a',pack:'#7a2a20'},
{id:'frost',   name:'Frostbite',   shirt:'#bfe6ff',pants:'#5f87a8',skin:'#f2d3b0',hair:'#e8f4ff',pack:'#4a7a9b'},
{id:'vice',    name:'Neon Vice',   shirt:'#ff4fd8',pants:'#19b9e0',skin:'#c98a5b',hair:'#19d3ff',pack:'#2a1c3a'},
{id:'ranger',  name:'Bush Ranger', shirt:'#3f8a3a',pants:'#2c5e28',skin:'#e0a370',hair:'#3a5a2a',pack:'#264d22'},
{id:'gold',    name:'Gold Agent',  shirt:'#ffd23a',pants:'#23262e',skin:'#f2c18f',hair:'#e8cf6a',pack:'#8a6a10',
 lock:{wins:1},  lockText:'Win a match'},
{id:'void',    name:'Void Walker', shirt:'#6a2fd0',pants:'#181030',skin:'#e8c9a0',hair:'#c9b8ff',pack:'#2a1440',
 lock:{elims:5},lockText:'Get 5 elims in one match'}];
