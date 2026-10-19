'use strict';
/* ============================================================
   🌱 GROW A GARDEN ES — game.js v3.1 "A prueba de NaN"
   ------------------------------------------------------------
   CORRECCIÓN PRINCIPAL respecto a v3:
   El error "createRadialGradient: The provided double value
   is non-finite" ocurría porque un valor NaN/Infinity llegaba
   hasta el canvas. En v3.1:
   1. TODOS los degradados pasan por safeRadial()/safeLinear(),
      que convierten NaN en números válidos. Nunca más crashea.
   2. El zoom por pellizco ya no divide entre 0 (d0 mínimo 20).
   3. La partida guardada se RECONSTRUYE campo a campo: los
      datos viejos de v1/v2 con campos que faltaban (que daban
      NaN) se sanean automáticamente al cargar.
   4. La cámara y el zoom se re-sanean en cada fotograma.
   5. Si algo fallara, se muestra un aviso pequeño NO bloqueante
      (nada de pantalla de error que impide jugar).
   ============================================================ */

/* ================= 0. UTILIDADES SEGURAS ================= */
const $ = id => document.getElementById(id);
const fin = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v)) ? v : d;
const clamp = (v, a, b) => { v = fin(v, a); return v < a ? a : (v > b ? b : v); };
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

function fmt(n) {
  n = fin(n, 0);
  const neg = n < 0; n = Math.abs(n);
  let s;
  if (n >= 1e9) s = (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  else if (n >= 1e6) s = (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  else if (n >= 1e5) s = (n / 1e3).toFixed(0) + 'K';
  else s = Math.floor(n).toLocaleString('es-ES');
  return (neg ? '-' : '') + s;
}
function fmtT(sec) {
  sec = Math.max(0, Math.floor(fin(sec, 0)));
  if (sec >= 3600) return Math.floor(sec / 3600) + 'h ' + Math.floor((sec % 3600) / 60) + 'm';
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Degradados blindados: convierten cualquier NaN/Infinity en un
   número válido ANTES de llamar a la API del canvas. */
function safeRadial(x0, y0, r0, x1, y1, r1, stops) {
  x0 = fin(x0); y0 = fin(y0); r0 = Math.max(0, fin(r0));
  x1 = fin(x1); y1 = fin(y1); r1 = Math.max(0.01, fin(r1, 1));
  const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
  for (const s of stops) { try { g.addColorStop(clamp(s[0], 0, 1), s[1]); } catch (e) { } }
  return g;
}
function safeLinear(x0, y0, x1, y1, stops) {
  x0 = fin(x0); y0 = fin(y0); x1 = fin(x1); y1 = fin(y1);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const s of stops) { try { g.addColorStop(clamp(s[0], 0, 1), s[1]); } catch (e) { } }
  return g;
}

/* ================= 1. SONIDO (WebAudio) ================= */
let AC = null;
function ac() {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC && AC.state === 'suspended') AC.resume();
  } catch (e) { }
  return AC;
}
function tone(f, d = 0.12, type = 'triangle', v = 0.16, slide = 0) {
  if (S && S.muted) return;
  try {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    const base = Math.max(30, fin(f, 440));
    o.frequency.setValueAtTime(base, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, base + slide), c.currentTime + d);
    g.gain.setValueAtTime(Math.max(0.001, fin(v, 0.15)), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + d + 0.03);
  } catch (e) { }
}
const SND = {
  click: () => tone(620, 0.05, 'square', 0.07),
  plant: () => tone(300, 0.1, 'triangle', 0.14, 130),
  water: () => tone(950, 0.2, 'sine', 0.12, -520),
  harvest: () => { tone(600, 0.07); setTimeout(() => tone(800, 0.07), 65); setTimeout(() => tone(1010, 0.1), 130); },
  coin: () => { tone(1180, 0.06, 'square', 0.08); setTimeout(() => tone(1580, 0.08, 'square', 0.08), 55); },
  buy: () => { tone(520, 0.07); setTimeout(() => tone(760, 0.11), 75); },
  err: () => tone(140, 0.18, 'sawtooth', 0.11, -40),
  level: () => [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.15), i * 95)),
  mut: () => [880, 1110, 1320, 1760].forEach((f, i) => setTimeout(() => tone(f, 0.09, 'sine', 0.13), i * 55)),
  ach: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.17, 'triangle', 0.14), i * 115)),
  weather: () => { tone(392, 0.28, 'sine', 0.11); setTimeout(() => tone(523, 0.36, 'sine', 0.11), 190); },
  thunder: () => tone(70, 0.5, 'sawtooth', 0.1, -30),
};

/* ================= 2. DATOS DEL JUEGO ================= */
const RAR = [
  { n: 'Común', c: '#9ca3af' },
  { n: 'Poco común', c: '#4ade80' },
  { n: 'Raro', c: '#60a5fa' },
  { n: 'Legendario', c: '#c084fc' },
  { n: 'Mítico', c: '#f87171' },
  { n: 'Divino', c: '#fbbf24' },
];
const PLANTS = [
  { id: 'zanahoria', e: '🥕', n: 'Zanahoria', cost: 10, sMin: 18, sMax: 25, grow: 20, regrow: 0, multi: 1, xp: 1, r: 0 },
  { id: 'fresa', e: '🍓', n: 'Fresa', cost: 50, sMin: 15, sMax: 22, grow: 25, regrow: 12, multi: 4, xp: 1, r: 0 },
  { id: 'arandano', e: '🫐', n: 'Arándano', cost: 400, sMin: 18, sMax: 26, grow: 35, regrow: 10, multi: 6, xp: 2, r: 1 },
  { id: 'tomate', e: '🍅', n: 'Tomate', cost: 800, sMin: 35, sMax: 52, grow: 40, regrow: 15, multi: 5, xp: 3, r: 1 },
  { id: 'diente', e: '🌼', n: 'Diente de león', cost: 600, sMin: 90, sMax: 130, grow: 45, regrow: 0, multi: 1, xp: 4, r: 2 },
  { id: 'maiz', e: '🌽', n: 'Maíz', cost: 1300, sMin: 55, sMax: 75, grow: 55, regrow: 18, multi: 5, xp: 4, r: 2 },
  { id: 'manzana', e: '🍎', n: 'Manzana', cost: 3250, sMin: 260, sMax: 380, grow: 80, regrow: 22, multi: 8, xp: 5, r: 2 },
  { id: 'uva', e: '🍇', n: 'Uva', cost: 6500, sMin: 550, sMax: 750, grow: 90, regrow: 20, multi: 8, xp: 10, r: 2 },
  { id: 'sandia', e: '🍉', n: 'Sandía', cost: 2500, sMin: 2900, sMax: 3800, grow: 100, regrow: 0, multi: 1, xp: 8, r: 3 },
  { id: 'calabaza', e: '🎃', n: 'Calabaza', cost: 3000, sMin: 3300, sMax: 4200, grow: 120, regrow: 0, multi: 1, xp: 10, r: 3 },
  { id: 'bambu', e: '🎋', n: 'Bambú', cost: 4000, sMin: 480, sMax: 640, grow: 70, regrow: 15, multi: 10, xp: 8, r: 3 },
  { id: 'cactus', e: '🌵', n: 'Cactus', cost: 15000, sMin: 3200, sMax: 4600, grow: 150, regrow: 30, multi: 7, xp: 18, r: 4 },
  { id: 'coco', e: '🥥', n: 'Coco', cost: 20000, sMin: 680, sMax: 900, grow: 160, regrow: 18, multi: 15, xp: 20, r: 4 },
  { id: 'mango', e: '🥭', n: 'Mango', cost: 45000, sMin: 8000, sMax: 12000, grow: 200, regrow: 40, multi: 4, xp: 40, r: 5 },
  { id: 'setas', e: '🍄', n: 'Setas', cost: 150000, sMin: 125000, sMax: 170000, grow: 300, regrow: 0, multi: 1, xp: 90, r: 5 },
];
const MUTS = [
  { id: 'mojado', e: '💧', n: 'Mojado', x: 2, c: '#38bdf8' },
  { id: 'helado', e: '❄️', n: 'Helado', x: 2, c: '#a5f3fc' },
  { id: 'lunar', e: '🌙', n: 'Lunar', x: 4, c: '#c7d2fe' },
  { id: 'congelado', e: '🧊', n: 'Congelado', x: 10, c: '#67e8f9' },
  { id: 'dorado', e: '🌟', n: 'Dorado', x: 20, c: '#fde047' },
  { id: 'arcoiris', e: '🌈', n: 'Arcoíris', x: 50, c: '#f472b6' },
  { id: 'electro', e: '⚡', n: 'Electrocutado', x: 100, c: '#facc15' },
];
const WEATHERS = [
  { id: 'sol', e: '☀️', n: 'Soleado', w: 34, dur: [120, 240], tint: null },
  { id: 'lluvia', e: '🌧️', n: 'Lluvia', w: 22, dur: [90, 180], mut: { id: 'mojado', ch: 0.35 }, tint: '#0d3b66' },
  { id: 'nieve', e: '🌨️', n: 'Nevada', w: 14, dur: [90, 180], mut: { id: 'helado', ch: 0.25 }, tint: '#7f9fb8' },
  { id: 'hielo', e: '🧊', n: 'Tormenta de hielo', w: 8, dur: [60, 120], mut: { id: 'congelado', ch: 0.15 }, tint: '#155e75' },
  { id: 'meteor', e: '☄️', n: 'Lluvia de meteoros', w: 6, dur: [60, 120], mut: { id: 'dorado', ch: 0.08 }, tint: '#7c2d12' },
  { id: 'aurora', e: '🌌', n: 'Auroras', w: 5, dur: [60, 120], mut: { id: 'arcoiris', ch: 0.05 }, tint: '#4c1d95' },
  { id: 'tormenta', e: '⛈️', n: 'Tormenta eléctrica', w: 8, dur: [60, 120], mut: { id: 'electro', ch: 0.10 }, tint: '#1e293b' },
];
const PETS = [
  { id: 'pollito', e: '🐤', n: 'Pollito', cost: 3500, d: '+20% de XP al cosechar' },
  { id: 'perro', e: '🐕', n: 'Perro', cost: 5000, d: '+10% en todas las ventas' },
  { id: 'conejo', e: '🐇', n: 'Conejo', cost: 6000, d: '+12% velocidad al caminar' },
  { id: 'gato', e: '🐈', n: 'Gato', cost: 8000, d: '−10% tiempo de crecimiento' },
  { id: 'cabra', e: '🐐', n: 'Cabra', cost: 12000, d: '+8% prob. de cosecha doble' },
  { id: 'oveja', e: '🐑', n: 'Oveja', cost: 15000, d: 'Regar acelera ×3 en vez de ×2' },
  { id: 'vaca', e: '🐄', n: 'Vaca', cost: 25000, d: '+15% en todas las ventas' },
  { id: 'pinguino', e: '🐧', n: 'Pingüino', cost: 40000, d: '+50% prob. de Helado/Congelado' },
  { id: 'zorro', e: '🦊', n: 'Zorro', cost: 55000, d: '+5% prob. de TODAS las mutaciones' },
  { id: 'panda', e: '🐼', n: 'Panda', cost: 90000, d: '25% de riego automático al plantar' },
  { id: 'dragon', e: '🐲', n: 'Dragón', cost: 150000, d: '+10% al valor de las mutaciones' },
  { id: 'unicornio', e: '🦄', n: 'Unicornio', cost: 300000, d: '+1% prob. de Arcoíris' },
];
const QTYPES = [
  { id: 'cosechas', e: '🌾', txt: c => 'Recoge ' + c + ' cultivos', opts: [8, 15, 25], rc: 400 },
  { id: 'siembras', e: '🌱', txt: c => 'Planta ' + c + ' semillas', opts: [6, 12, 20], rc: 350 },
  { id: 'ganancias', e: '🪙', txt: c => 'Gana ' + fmt(c) + ' monedas', opts: [800, 2500, 6000], rc: 500 },
  { id: 'riegos', e: '💧', txt: c => 'Riega ' + c + ' plantas', opts: [5, 10, 15], rc: 300 },
  { id: 'muts', e: '✨', txt: c => 'Consigue ' + c + ' mutaciones', opts: [1, 2, 4], rc: 900 },
];
const ACHS = [
  { id: 'semilla', e: '🌱', n: 'Primera siembra', d: 'Planta tu primera semilla' },
  { id: 'cosecha50', e: '🧺', n: 'Cosechador', d: 'Recoge 50 cultivos' },
  { id: 'cosecha500', e: '🚜', n: 'Granjero pro', d: 'Recoge 500 cultivos' },
  { id: 'rico', e: '💰', n: 'Rico', d: 'Ten 10.000 monedas a la vez' },
  { id: 'millon', e: '💎', n: 'Millonario', d: 'Ten 1.000.000 de monedas a la vez' },
  { id: 'coleccion', e: '🧑‍🌾', n: 'Coleccionista', d: 'Planta las 15 especies' },
  { id: 'mut', e: '✨', n: 'Suerte', d: 'Consigue tu primera mutación' },
  { id: 'rainbow', e: '🌈', n: 'Arcoíris', d: 'Consigue una mutación Arcoíris' },
  { id: 'pets3', e: '🐾', n: 'Amigo fiel', d: 'Equipa 3 mascotas a la vez' },
  { id: 'huerto', e: '🪴', n: 'Gran imperio', d: 'Desbloquea las 30 parcelas' },
  { id: 'rebirth', e: '🔁', n: 'Renacimiento', d: 'Haz tu primer renacimiento' },
  { id: 'racha', e: '📅', n: 'Veterano', d: 'Consigue una racha de 7 días' },
];
const DAILY = [500, 1000, 2000, 4000, 8000, 15000, 30000];

const PLANT = id => PLANTS.find(p => p.id === id);
const MUT = id => MUTS.find(m => m.id === id);
const PET = id => PETS.find(p => p.id === id);
const RAR_OF = i => RAR[clamp(i, 0, RAR.length - 1) | 0];

/* ================= 3. ESTADO Y GUARDADO ================= */
const SAVE_KEY = 'gag_es_v31';
const LEGACY_KEYS = ['gag_es_v3', 'gag_es_v2', 'gag_es_v1', 'gag_save', 'gag_es'];
const STOCK_SEC = 180;
const DAY_MS = 20 * 3600 * 1000;
let S = null;

function makePlots() {
  const a = [];
  for (let i = 0; i < 30; i++) a.push({ u: i < 6, c: null });
  return a;
}
function freshState() {
  return {
    v: 3.1, coins: 250, xp: 0, level: 1, rebirths: 0,
    seeds: {}, plots: makePlots(), petsOwned: [], petsEq: [],
    ach: {}, stock: {}, stockT: STOCK_SEC,
    stats: { cosechas: 0, siembras: 0, ganancias: 0, muts: 0, riegos: 0, kinds: {} },
    quests: [null, null, null],
    daily: { last: 0, streak: 0 },
    muted: false, seenIntro: false, time: Date.now(), playT: 0,
  };
}
function save() {
  try { S.time = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { }
}
function loadSave() {
  let obj = null;
  for (const k of [SAVE_KEY].concat(LEGACY_KEYS)) {
    let raw = null;
    try { raw = localStorage.getItem(k); } catch (e) { raw = null; }
    if (!raw) continue;
    try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    if (obj) break;
  }
  return obj;
}
/* Reconstruye el estado campo a campo: cualquier dato viejo,
   corrupto o con NaN se sustituye por un valor válido. */
function buildState(obj) {
  const f = freshState();
  if (!obj || typeof obj !== 'object') return f;
  f.coins = Math.max(0, fin(obj.coins, 250));
  f.level = Math.max(1, fin(obj.level, 1) | 0);
  f.xp = Math.max(0, fin(obj.xp, 0));
  f.rebirths = Math.max(0, fin(obj.rebirths, 0) | 0);
  f.muted = !!obj.muted;
  f.seenIntro = !!obj.seenIntro;
  f.time = fin(obj.time, Date.now());
  if (obj.seeds && typeof obj.seeds === 'object')
    for (const p of PLANTS) { const n = fin(obj.seeds[p.id], 0) | 0; if (n > 0) f.seeds[p.id] = n; }
  if (Array.isArray(obj.petsOwned))
    f.petsOwned = [...new Set(obj.petsOwned.filter(id => PET(id)))].slice(0, 12);
  if (Array.isArray(obj.petsEq))
    f.petsEq = [...new Set(obj.petsEq.filter(id => PET(id) && f.petsOwned.includes(id)))].slice(0, 3);
  if (obj.ach && typeof obj.ach === 'object')
    for (const a of ACHS) if (obj.ach[a.id]) f.ach[a.id] = true;
  if (obj.stats && typeof obj.stats === 'object') {
    const st = obj.stats;
    f.stats.cosechas = Math.max(0, fin(st.cosechas, 0));
    f.stats.siembras = Math.max(0, fin(st.siembras, 0));
    f.stats.ganancias = Math.max(0, fin(st.ganancias, 0));
    f.stats.muts = Math.max(0, fin(st.muts, 0));
    f.stats.riegos = Math.max(0, fin(st.riegos, 0));
    if (st.kinds && typeof st.kinds === 'object')
      for (const p of PLANTS) if (st.kinds[p.id]) f.stats.kinds[p.id] = 1;
  }
  f.plots = [];
  const arr = Array.isArray(obj.plots) ? obj.plots : [];
  for (let i = 0; i < 30; i++) {
    const sp = (arr[i] || {});
    const plot = { u: i < 6 ? true : !!sp.u, c: null };
    if (sp.c && PLANT(sp.c.id)) {
      const P = PLANT(sp.c.id);
      const t = (fin(sp.c.total, -1) === P.grow || fin(sp.c.total, -1) === P.regrow)
        ? fin(sp.c.total, P.grow) : P.grow;
      plot.c = {
        id: P.id, total: t,
        left: clamp(fin(sp.c.left, t), 0, Math.max(t, 0.01)),
        multi: clamp(fin(sp.c.multi, P.multi), 0, 99) | 0,
        watered: !!sp.c.watered,
        mut: MUT(sp.c.mut) ? sp.c.mut : null,
      };
    }
    f.plots.push(plot);
  }
  if (obj.daily && typeof obj.daily === 'object') {
    f.daily.last = Math.max(0, fin(obj.daily.last, 0));
    f.daily.streak = Math.max(0, fin(obj.daily.streak, 0) | 0);
  }
  return f;
}

/* ================= 4. VENTAJAS DE MASCOTAS ================= */
let perk = {
  sale: 1, grow: 1, walk: 1, xp: 1, double: 0, water: 2,
  ice: 0, mut: 0, autoWater: 0, mutVal: 1, rainbow: 0,
};
function calcPerks() {
  const p = {
    sale: 1 + 0.02 * (fin(S.level, 1) - 1), grow: 1, walk: 1, xp: 1,
    double: 0, water: 2, ice: 0, mut: 0, autoWater: 0, mutVal: 1, rainbow: 0,
  };
  const eq = S.petsEq || [];
  if (eq.includes('perro')) p.sale *= 1.10;
  if (eq.includes('vaca')) p.sale *= 1.15;
  if (eq.includes('gato')) p.grow *= 1.10;      // crecen 10% más rápido
  if (eq.includes('conejo')) p.walk *= 1.12;
  if (eq.includes('pollito')) p.xp *= 1.20;
  if (eq.includes('cabra')) p.double = 0.08;
  if (eq.includes('oveja')) p.water = 3;
  if (eq.includes('pinguino')) p.ice = 0.5;
  if (eq.includes('zorro')) p.mut = 0.05;
  if (eq.includes('panda')) p.autoWater = 0.25;
  if (eq.includes('dragon')) p.mutVal = 1.10;
  if (eq.includes('unicornio')) p.rainbow = 0.01;
  p.sale *= 1 + 0.25 * fin(S.rebirths, 0);
  perk = p;
}

/* ================= 5. PROGRESIÓN ================= */
function xpNeed(lv) { return Math.floor(30 * Math.pow(1.32, Math.max(1, lv) - 1)); }
function addXP(n) {
  n = fin(n, 0); if (n <= 0) return;
  S.xp += n;
  let ups = 0;
  while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; ups++; }
  if (ups > 0) {
    SND.level();
    toast('🎉 ¡Subiste a nivel ' + S.level + '!', 'gold');
    floatText(player.x, player.y - 60, '¡NIVEL ' + S.level + '!', '#fbbf24');
    calcPerks(); updateHUD();
  }
}

/* ---- Misiones ---- */
function genQuest() {
  const used = S.quests.filter(Boolean).map(q => q.id);
  const pool = QTYPES.filter(t => !used.includes(t.id));
  const t = pool.length ? pick(pool) : pick(QTYPES);
  const goal = pick(t.opts);
  return {
    id: t.id, e: t.e, txt: t.txt(goal), goal, prog: 0, done: false,
    rc: Math.round(t.rc * (1 + 0.15 * fin(S.level, 1))),
    rx: Math.round(8 * (1 + 0.2 * fin(S.level, 1))),
  };
}
function ensureQuests() { for (let i = 0; i < 3; i++) if (!S.quests[i]) S.quests[i] = genQuest(); }
function questStat(id, n) {
  let changed = false;
  for (const q of S.quests) {
    if (q && q.id === id && !q.done) {
      q.prog = fin(q.prog, 0) + n;
      if (q.prog >= q.goal) { q.done = true; changed = true; toast('📜 ¡Misión completada! Reclama tu recompensa', 'gold'); SND.coin(); }
    }
  }
  if (changed && $('pQuests').classList.contains('open')) buildQuests();
  updateQuestChip();
}
function claimQuest(i) {
  const q = S.quests[i]; if (!q || !q.done) return;
  S.coins += q.rc; addXP(q.rx); SND.buy();
  toast('🪙 +' + fmt(q.rc) + ' y +' + q.rx + ' XP (misión)');
  S.quests[i] = genQuest();
  buildQuests(); updateHUD(); updateQuestChip(); save();
}

/* ---- Logros ---- */
function ach(id) {
  if (S.ach[id]) return;
  const a = ACHS.find(x => x.id === id); if (!a) return;
  S.ach[id] = true;
  SND.ach();
  toast('🏆 Logro desbloqueado: ' + a.n, 'gold');
  floatText(player.x, player.y - 70, '🏆 ' + a.n, '#fbbf24');
}
function checkAch() {
  if (S.coins >= 10000) ach('rico');
  if (S.coins >= 1000000) ach('millon');
  if (S.stats.cosechas >= 50) ach('cosecha50');
  if (S.stats.cosechas >= 500) ach('cosecha500');
  if (Object.keys(S.stats.kinds).length >= 15) ach('coleccion');
  if (S.petsEq.length >= 3) ach('pets3');
  if (S.plots.filter(p => p.u).length >= 30) ach('huerto');
  if (S.daily.streak >= 7) ach('racha');
}

/* ---- Recompensa diaria ---- */
function dailyState() {
  const d = S.daily;
  const nowT = Date.now();
  if (fin(d.last, 0) === 0) return { can: false, day: 1 };
  const gap = nowT - fin(d.last, 0);
  if (gap >= 48 * 3600 * 1000) return { can: true, day: 1, reset: true };
  if (gap >= DAY_MS) return { can: true, day: (fin(d.streak, 0) % 7) + 1 };
  return { can: false, day: (fin(d.streak, 0) % 7) + 1, wait: DAY_MS - gap };
}
function claimDaily() {
  const st = dailyState(); if (!st.can) return;
  if (st.reset) S.daily.streak = 0;
  S.daily.streak++; S.daily.last = Date.now();
  const reward = DAILY[(S.daily.streak - 1) % 7];
  S.coins += reward;
  SND.buy(); checkAch();
  toast('🎁 Recompensa diaria: 🪙 ' + fmt(reward) + ' (día ' + ((S.daily.streak - 1) % 7 + 1) + ' de racha)', 'gold');
  updateHUD(); buildHotbar(); save();
}

/* ---- Renacimiento ---- */
function doRebirth() {
  if (S.level < 15) { SND.err(); toast('Necesitas nivel 15 para renacer', 'warn'); return; }
  showModal('🔁 Renacer',
    'Al renacer perderás <b>monedas, nivel y parcelas</b>, pero conservarás <b>mascotas, logros y semillas</b>.<br><br>' +
    'A cambio ganarás <b>+25% de valor en TODAS las cosechas</b> para siempre.<br>' +
    'Multiplicador actual: ×' + (1 + 0.25 * S.rebirths).toFixed(2) +
    ' → pasaría a ser <b>×' + (1 + 0.25 * (S.rebirths + 1)).toFixed(2) + '</b>.',
    [{ t: 'Cancelar' },
    {
      t: '¡Renacer!', primary: true, fn: () => {
        S.rebirths++; S.coins = 250; S.xp = 0; S.level = 1;
        S.plots = makePlots();
        calcPerks(); ach('rebirth'); SND.ach();
        toast('✨ ¡Has renacido! Valor de cosechas ×' + (1 + 0.25 * S.rebirths).toFixed(2), 'gold');
        player.x = 0; player.y = -150; cam.x = 0; cam.y = 0; walkTarget = null; pending = null;
        buildHotbar(); updateHUD(); buildHelp(); save();
      }
    }]);
}
function resetSave() {
  showModal('🗑️ Reiniciar progreso',
    '¿Seguro? Se borrará <b>TODO</b> tu progreso (monedas, mascotas, logros y parcelas) y no se puede deshacer.',
    [{ t: 'Cancelar' },
    {
      t: 'Borrar todo', primary: true, fn: () => {
        try {
          localStorage.removeItem(SAVE_KEY);
          LEGACY_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch (e) { } });
        } catch (e) { }
        location.reload();
      }
    }]);
}

/* ================= 6. RUNTIME (no se guarda) ================= */
let canvas = null, ctx = null, vw = 0, vh = 0, dpr = 1;
let zoom = 1, cam = { x: 0, y: 0 };
let player = { x: 0, y: -150, dir: 1, step: 0, moving: false, trail: [] };
let walkTarget = null, pending = null;
let sel = null;                 // semilla seleccionada en la barra
const keys = {};
let floaters = [], sparks = [];
let sT = 0;                     // tiempo de animación (s)
let deco = null;
let curWeather = null, weatherT = 0;
let weatherFx = { rain: [], snow: [], meteors: [], flash: 0, aurora: 0, meteorT: 0, flashT: 3 };
let saveT = 12, achT = 1, mutTickT = 5;

const WORLD = { x0: -820, x1: 820, y0: -420, y1: 780 };
const TILE = 104, FARM_X0 = -2.5 * TILE, FARM_Y0 = 110;
function plotPos(i) { return { x: FARM_X0 + (i % 6) * TILE, y: FARM_Y0 + Math.floor(i / 6) * TILE }; }
const STALLS = {
  seeds: { x: -380, y: -170, w: 160, h: 120, label: 'SEMILLAS', a: '#e2574c', b: '#fff6e8', items: ['🥕', '🍓', '🌽'] },
  pets: { x: 380, y: -170, w: 160, h: 120, label: 'MASCOTAS', a: '#3f8fd2', b: '#fff6e8', items: ['🐕', '🐈', '🐇'] },
  board: { x: 0, y: -330, w: 110, h: 130, label: 'MISIONES', a: '#a8763f', b: '#e8cfa0', items: ['📜'] },
};
const POND = { x: 620, y: 640, rx: 150, ry: 78 };

function s2w(sx, sy) { return { x: (sx - vw / 2) / zoom + cam.x, y: (sy - vh / 2) / zoom + cam.y }; }
function w2s(wx, wy) { return { x: (wx - cam.x) * zoom + vw / 2, y: (wy - cam.y) * zoom + vh / 2 }; }
function isNight() { const h = new Date().getHours(); return h >= 20 || h < 6; }

/* ================= 7. MUNDO DECORATIVO (determinista) ================= */
function makeDeco() {
  const R = mulberry32(20261019);
  const d = {
    trees: [], bushes: [], rocks: [], mush: [], flowers: [], patches: [],
    clouds: [], stars: [],
  };
  d.trees = [
    { x: -700, y: 60, s: 1.2 }, { x: 720, y: 80, s: 1.0 }, { x: -680, y: 430, s: 1.1 },
    { x: 700, y: 420, s: 1.3 }, { x: -820, y: 250, s: 1.4 }, { x: 830, y: 240, s: 1.1 },
    { x: -620, y: -260, s: 0.9 }, { x: 630, y: -270, s: 1.0 }, { x: -780, y: 600, s: 1.2 },
    { x: 790, y: 610, s: 1.0 }, { x: -430, y: 690, s: 0.9 }, { x: 450, y: 700, s: 1.1 },
    { x: 950, y: 450, s: 1.3 }, { x: -950, y: 470, s: 1.2 }, { x: 0, y: 820, s: 1.4 },
    { x: 880, y: -80, s: 1.0 },
  ];
  d.bushes = [
    { x: -590, y: 120 }, { x: 600, y: 150 }, { x: -580, y: 520 }, { x: 590, y: 540 },
    { x: -240, y: -80 }, { x: 250, y: -90 }, { x: -640, y: 300 }, { x: 660, y: 320 },
    { x: 150, y: 800 }, { x: -160, y: 810 },
  ];
  d.rocks = [
    { x: -520, y: 300, s: 1.2 }, { x: 530, y: 320, s: 1.0 }, { x: -620, y: 120, s: 0.8 },
    { x: 640, y: 130, s: 1.1 }, { x: 80, y: 780, s: 0.9 }, { x: -90, y: 795, s: 1.2 },
  ];
  d.mush = [
    { x: -560, y: 470 }, { x: 570, y: 450 }, { x: -350, y: 680 }, { x: 360, y: 690 },
    { x: 610, y: -60 }, { x: -620, y: -70 },
  ];
  const badZone = (x, y) =>
    (x > -580 && x < 580 && y > -60 && y < 760) ||            // huerto cercado
    (Math.abs(x + 380) < 140 && y > -280 && y < -60) ||         // puesto semillas
    (Math.abs(x - 380) < 140 && y > -280 && y < -60) ||         // puesto mascotas
    (Math.abs(x) < 120 && y > -430 && y < -230) ||               // tablón misiones
    (dist(x, y, POND.x, POND.y) < 200);                          // estanque
  const scatter = (n, arr, gen) => {
    for (let k = 0; k < n; k++) {
      for (let tries = 0; tries < 30; tries++) {
        const x = -900 + R() * 1800, y = -350 + R() * 1170;
        if (badZone(x, y)) continue;
        arr.push(gen(x, y)); break;
      }
    }
  };
  const fcols = ['#f472b6', '#fbbf24', '#a78bfa', '#f87171', '#fff1a8', '#7dd3fc'];
  scatter(26, d.flowers, (x, y) => ({ x, y, c: fcols[Math.floor(R() * fcols.length)] }));
  scatter(24, d.patches, (x, y) => ({ x, y, r: 30 + R() * 60 }));
  for (let i = 0; i < 7; i++) d.clouds.push({ x: R() * 2000 - 400, y: R(), s: 0.6 + R() * 0.9, v: 8 + R() * 14 });
  for (let i = 0; i < 60; i++) d.stars.push({ x: R(), y: R() * 0.55, p: R() * 6.28 });
  return d;
}

/* ================= 8. ECONOMÍA Y ACCIONES ================= */
function plotCost() { const n = S.plots.filter(p => p.u).length; return Math.floor(300 * Math.pow(1.55, Math.max(0, n - 6))); }
function ownedSeedIds() { return Object.keys(S.seeds).sort((a, b) => PLANT(b).cost - PLANT(a).cost).slice(0, 8); }

function buyPlot(i) {
  const p = S.plots[i]; if (!p || p.u) return false;
  const c = plotCost();
  if (S.coins < c) { SND.err(); toast('🪙 Te faltan monedas para esta parcela (' + fmt(c) + ')', 'warn'); return false; }
  S.coins -= c; p.u = true;
  SND.buy(); toast('🪜 ¡Nueva parcela desbloqueada!');
  const pp = plotPos(i); sparkBurst(pp.x, pp.y, '#8ce06a', 12);
  checkAch(); updateHUD(); save();
  return true;
}
function plantSeed(i, pid) {
  const p = S.plots[i]; if (!p || !p.u || p.c) return;
  if (!pid || !PLANT(pid) || fin(S.seeds[pid], 0) <= 0) {
    SND.err(); toast('No tienes esa semilla. ¡Compra más en la tienda! 🛒', 'warn');
    return;
  }
  const P = PLANT(pid);
  S.seeds[pid] = fin(S.seeds[pid], 0) - 1;
  if (S.seeds[pid] <= 0) delete S.seeds[pid];
  p.c = {
    id: pid, total: P.grow, left: P.grow, multi: P.multi, mut: null,
    watered: perk.autoWater > 0 && Math.random() < perk.autoWater,
  };
  S.stats.siembras++;
  if (!S.stats.kinds[pid]) S.stats.kinds[pid] = 1;
  ach('semilla'); checkAch();
  SND.plant(); questStat('siembras', 1);
  const pp = plotPos(i);
  floatText(pp.x, pp.y - 46, P.e + (p.c.watered ? ' 💧' : ''), '#a3e635');
  if (!sel || !S.seeds[sel]) sel = ownedSeedIds()[0] || null;
  buildHotbar(); save();
}
function waterPlot(i) {
  const p = S.plots[i]; if (!p || !p.u || !p.c || p.c.watered || p.c.left <= 0.05) return;
  p.c.watered = true;
  S.stats.riegos++; questStat('riegos', 1);
  SND.water();
  const pp = plotPos(i);
  floatText(pp.x, pp.y - 52, '💧', '#38bdf8');
  sparkBurst(pp.x, pp.y - 20, '#7dd3fc', 8);
  save();
}
function cropValue(c) {
  const P = PLANT(c.id) || PLANTS[0];
  let v = rnd(P.sMin, P.sMax);
  v *= perk.sale;
  if (c.mut) { const m = MUT(c.mut); if (m) v *= m.x * perk.mutVal; }
  if (perk.double > 0 && Math.random() < perk.double) v *= 2;
  return Math.max(1, Math.round(fin(v, P.sMin)));
}
function harvest(i) {
  const p = S.plots[i]; if (!p || !p.u || !p.c) return;
  const c = p.c; const P = PLANT(c.id) || PLANTS[0];
  if (c.left > 0.05) return;
  const val = cropValue(c);
  S.coins += val; S.stats.ganancias += val; S.stats.cosechas++;
  questStat('cosechas', 1); questStat('ganancias', val);
  if (c.mut) {
    S.stats.muts++; questStat('muts', 1);
    ach('mut'); if (c.mut === 'arcoiris') ach('rainbow');
  }
  checkAch();
  SND.harvest(); setTimeout(SND.coin, 180);
  const pp = plotPos(i);
  const col = c.mut ? MUT(c.mut).c : '#fde047';
  floatText(pp.x, pp.y - 58, '+' + fmt(val), col);
  sparkBurst(pp.x, pp.y - 10, col, 14);
  addXP(fin(P.xp, 1) * perk.xp);
  if (c.multi > 1) {
    c.multi--; c.total = P.regrow; c.left = P.regrow; c.watered = false;
    toast(P.e + ' La planta sigue viva (le quedan ×' + c.multi + ' cosechas)');
  } else {
    p.c = null;
  }
  updateHUD(); save();
}
function rollMut(i) {
  const p = S.plots[i]; if (!p || !p.c || p.c.mut || p.c.left > 0.05) return;
  const w = curWeather;
  const ch = {};
  ch.arcoiris = 0.001 + perk.rainbow;
  ch.dorado = 0.01;
  ch.mojado = 0.02;
  if (isNight()) ch.lunar = 0.06;
  if (w && w.mut) ch[w.mut.id] = (ch[w.mut.id] || 0) + w.mut.ch;
  const mul = 1 + perk.mut;
  for (const k of Object.keys(ch)) ch[k] *= mul;
  if (perk.ice > 0) {
    if (ch.helado) ch.helado *= (1 + perk.ice);
    if (ch.congelado) ch.congelado *= (1 + perk.ice);
  }
  const order = ['arcoiris', 'electro', 'dorado', 'congelado', 'lunar', 'helado', 'mojado'];
  for (const id of order) {
    if (ch[id] && Math.random() < ch[id]) {
      const m = MUT(id); if (!m) return;
      p.c.mut = id;
      SND.mut();
      const pp = plotPos(i);
      floatText(pp.x, pp.y - 70, m.e + ' ' + m.n + ' ×' + m.x, m.c);
      toast('✨ ¡Mutación ' + m.n + '! (×' + m.x + ' de valor)', 'gold');
      return;
    }
  }
}
function buySeed(pid, qty) {
  const P = PLANT(pid); if (!P) return;
  const st = fin(S.stock[pid], 0);
  qty = Math.min(qty, st);
  if (qty <= 0) { SND.err(); toast('Esa semilla está agotada ⏳ Espera el reabastecimiento', 'warn'); return; }
  const cost = P.cost * qty;
  if (S.coins < cost) { SND.err(); toast('🪙 Te faltan monedas (cuesta ' + fmt(cost) + ')', 'warn'); return; }
  S.coins -= cost;
  S.stock[pid] = st - qty;
  S.seeds[pid] = fin(S.seeds[pid], 0) + qty;
  SND.buy(); toast(P.e + ' ×' + qty + ' compradas');
  if (!sel) sel = pid;
  buildHotbar(); buildShop(); updateHUD(); save();
}
function restock(silent) {
  const caps = [8, 6, 4, 3, 2, 1];
  for (const P of PLANTS) {
    S.stock[P.id] = (P.r >= 3 && Math.random() < 0.22) ? 0 : rint(1, caps[P.r]);
  }
  S.stockT = STOCK_SEC;
  if (!silent) {
    toast('🔄 La tienda ha reabastecido semillas');
    if ($('pShop').classList.contains('open')) buildShop();
  }
}
function togglePet(id) {
  const P = PET(id); if (!P) return;
  if (S.petsEq.includes(id)) {
    S.petsEq = S.petsEq.filter(x => x !== id);
    SND.click(); toast(P.e + ' ' + P.n + ' ahora descansa');
  } else {
    if (!S.petsOwned.includes(id)) {
      if (S.coins < P.cost) { SND.err(); toast('🪙 No te llega para adoptar (' + fmt(P.cost) + ')', 'warn'); return; }
      S.coins -= P.cost; S.petsOwned.push(id);
      SND.buy(); toast(P.e + ' ¡Has adoptado a ' + P.n + '!');
    } else { SND.click(); }
    if (S.petsEq.length >= 3) { toast('Máximo 3 mascotas equipadas. Queda una para descansar.', 'warn'); }
    else S.petsEq.push(id);
  }
  calcPerks(); checkAch(); buildPets(); updateHUD(); save();
}

/* ================= 9. CLIMA ================= */
function setWeather(w, silent) {
  curWeather = w;
  weatherT = rnd(w.dur[0], w.dur[1]);
  weatherFx = { rain: [], snow: [], meteors: [], flash: 0, aurora: 0, meteorT: 0, flashT: rnd(2, 6) };
  const id = w.id;
  if (id === 'lluvia' || id === 'tormenta')
    for (let i = 0; i < 130; i++) weatherFx.rain.push({ x: Math.random() * 2000, y: Math.random() * 1200, v: rnd(650, 850) });
  if (id === 'nieve' || id === 'hielo')
    for (let i = 0; i < 90; i++) weatherFx.snow.push({ x: Math.random() * 2000, y: Math.random() * 1200, r: rnd(1.5, 3.5), v: rnd(40, 90), ph: rnd(0, 6.28) });
  if (!silent) {
    SND.weather();
    toast('El clima ha cambiado: ' + w.e + ' ' + w.n + (w.mut ? ' → ¡' + MUT(w.mut.id).n + ' ' + MUT(w.mut.id).e + ' posible!' : ''));
  }
}
function rollWeather() {
  const tot = WEATHERS.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * tot;
  for (const w of WEATHERS) { r -= w.w; if (r <= 0) return w; }
  return WEATHERS[0];
}
function updateWeatherFx(dt) {
  const id = curWeather ? curWeather.id : 'sol';
  for (const r of weatherFx.rain) { r.y += r.v * dt; r.x += r.v * 0.12 * dt; if (r.y > vh + 20) { r.y = -20; r.x = Math.random() * (vw + 300) - 150; } }
  for (const s of weatherFx.snow) { s.y += s.v * dt; s.ph += dt; s.x += Math.sin(s.ph) * 20 * dt; if (s.y > vh + 10) { s.y = -10; s.x = Math.random() * (vw + 300) - 150; } }
  if (id === 'meteor') {
    weatherFx.meteorT -= dt;
    if (weatherFx.meteorT <= 0) {
      weatherFx.meteorT = rnd(0.5, 1.6);
      weatherFx.meteors.push({ x: rnd(vw * 0.15, vw * 1.05), y: -30, vx: -rnd(320, 520), vy: rnd(140, 240), life: rnd(0.9, 1.4) });
    }
  }
  for (let i = weatherFx.meteors.length - 1; i >= 0; i--) {
    const m = weatherFx.meteors[i];
    m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt;
    if (m.life <= 0 || m.y > vh + 40) weatherFx.meteors.splice(i, 1);
  }
  if (id === 'tormenta') {
    weatherFx.flashT -= dt;
    if (weatherFx.flashT <= 0) { weatherFx.flashT = rnd(2.5, 7); weatherFx.flash = 1; SND.thunder(); }
  }
  weatherFx.flash = Math.max(0, weatherFx.flash - dt * 1.8);
  if (id === 'aurora') weatherFx.aurora += dt;
}

/* ================= 10. ENTRADA (TECLADO/RATÓN/TÁCTIL) ================= */
const ptrs = new Map();
let pinch = null;

function walkToAnd(x, y, fn) {
  const tx = clamp(x, WORLD.x0, WORLD.x1), ty = clamp(y, WORLD.y0, WORLD.y1);
  walkTarget = { x: tx, y: ty };
  pending = { x: tx, y: ty, fn };
}
function interactPlot(i) {
  const p = S.plots[i]; if (!p) return;
  const pp = plotPos(i);
  if (!p.u) { buyPlot(i); return; }
  if (!p.c) {
    if (sel) plantSeed(i, sel);
    else { toast('Selecciona una semilla en la barra inferior 🌱', 'warn'); openPanel('pShop'); }
    return;
  }
  if (p.c.left > 0.05) {
    if (!p.c.watered) waterPlot(i);
    else toast('💧 Ya está regada, solo queda esperar');
    return;
  }
  harvest(i);
}
function openStall(k) {
  if (k === 'seeds') openPanel('pShop');
  else if (k === 'pets') openPanel('pPets');
  else openPanel('pQuests');
}
function tapAt(sx, sy) {
  const w = s2w(sx, sy);
  for (const k of Object.keys(STALLS)) {
    const s = STALLS[k];
    if (Math.abs(w.x - s.x) < s.w / 2 && Math.abs(w.y - s.y) < s.h / 2) {
      if (dist(player.x, player.y, s.x, s.y) < 160) openStall(k);
      else walkToAnd(s.x, s.y + s.h / 2 + 40, () => openStall(k));
      return;
    }
  }
  for (let i = 0; i < S.plots.length; i++) {
    const pp = plotPos(i);
    if (Math.abs(w.x - pp.x) < TILE / 2 && Math.abs(w.y - pp.y) < TILE / 2) {
      if (dist(player.x, player.y, pp.x, pp.y) < 130) interactPlot(i);
      else walkToAnd(pp.x, pp.y + 26, () => interactPlot(i));
      return;
    }
  }
  walkTarget = { x: clamp(w.x, WORLD.x0, WORLD.x1), y: clamp(w.y, WORLD.y0, WORLD.y1) };
  pending = null;
}
function interactNearest() {
  let best = null, bd = 1e9;
  for (let i = 0; i < S.plots.length; i++) {
    const pp = plotPos(i);
    const d = dist(player.x, player.y, pp.x, pp.y);
    if (d < 130 && d < bd) { bd = d; best = { t: 'plot', i }; }
  }
  for (const k of Object.keys(STALLS)) {
    const s = STALLS[k];
    const d = dist(player.x, player.y, s.x, s.y);
    if (d < 150 && d < bd) { bd = d; best = { t: 'stall', k }; }
  }
  if (!best) { toast('🤷 No hay nada cerca con qué interactuar'); return; }
  if (best.t === 'plot') interactPlot(best.i); else openStall(best.k);
}

function initInput() {
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('pointerdown', e => {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      /* FIX v3.1: d0 mínimo 20 → jamás dividimos entre 0 */
      pinch = { d0: Math.max(20, dist(a.x, a.y, b.x, b.y)), z0: zoom };
      walkTarget = null; pending = null;
      for (const p of ptrs.values()) p.moved = true;
    }
    ac();
  });

  canvas.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (dist(p.x, p.y, p.sx, p.sy) > 12) p.moved = true;

    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const d = dist(a.x, a.y, b.x, b.y);
      if (d > 1) zoom = clamp(pinch.z0 * d / pinch.d0, 0.45, 2.8);
      return;
    }
    if (ptrs.size === 1 && p.moved) {
      const w = s2w(p.x, p.y);
      walkTarget = { x: clamp(w.x, WORLD.x0, WORLD.x1), y: clamp(w.y, WORLD.y0, WORLD.y1) };
      pending = null;
    }
  });

  const up = e => {
    const p = ptrs.get(e.pointerId);
    ptrs.delete(e.pointerId);
    if (pinch) { if (ptrs.size < 2) pinch = null; return; }
    if (p && !p.moved) tapAt(p.sx, p.sy);
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    zoom = clamp(zoom * (e.deltaY < 0 ? 1.12 : 0.89), 0.45, 2.8);
  }, { passive: false });

  window.addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    keys[k] = true;
    if (e.repeat) return;
    if (k === 'e') interactNearest();
    if (k === 'escape') { closePanels(); hideModal(); }
    if (/^[1-8]$/.test(k)) {
      const ids = ownedSeedIds();
      const id = ids[+k - 1];
      if (id) { sel = id; SND.click(); buildHotbar(); }
    }
    ac();
  });
  window.addEventListener('keyup', e => { keys[(e.key || '').toLowerCase()] = false; });
}

/* ================= 11. TEXTOS FLOTANTES Y CHISPAS ================= */
function floatText(wx, wy, txt, color) {
  floaters.push({
    x: fin(wx, player.x), y: fin(wy, player.y), t: 0,
    txt: String(txt).slice(0, 42), c: color || '#ffffff',
  });
  if (floaters.length > 40) floaters.shift();
}
function sparkBurst(wx, wy, color, n) {
  for (let k = 0; k < (n || 10); k++) {
    sparks.push({ x: fin(wx, 0), y: fin(wy, 0), vx: rnd(-70, 70), vy: rnd(-160, -40), t: 0, c: color || '#fde047' });
  }
  if (sparks.length > 250) sparks.splice(0, sparks.length - 250);
}

/* ================= 12. RENDERIZADO ================= */
function viewRect() {
  const hw = vw / 2 / zoom + 130, hh = vh / 2 / zoom + 130;
  return { l: cam.x - hw, r: cam.x + hw, t: cam.y - hh, b: cam.y + hh };
}
const inView = (v, x, y, m) => x > v.l - (m || 0) && x < v.r + (m || 0) && y > v.t - (m || 0) && y < v.b + (m || 0);

function drawSky() {
  ctx.fillStyle = safeLinear(0, 0, 0, vh, [[0, '#6fbef0'], [0.55, '#a8ddf8'], [1, '#d8f2fd']]);
  ctx.fillRect(0, 0, vw, vh);
}
function drawRange(color, yb, amp, f) {
  const step = 140;
  const off = -cam.x * zoom * f;
  const n = Math.ceil((vw + 400) / step) + 2;
  const start = -200 + (off % step) - step;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(start - 60, vh + 2);
  for (let i = 0; i <= n; i++) {
    const px = start + i * step;
    const ph = amp * (0.55 + 0.45 * Math.sin((i + Math.floor(off / step)) * 1.7));
    ctx.lineTo(px, yb - ph);
    ctx.lineTo(px + step / 2, yb - ph * 0.5);
  }
  ctx.lineTo(vw + 400, vh + 2);
  ctx.closePath();
  ctx.fill();
}
function drawMountains() {
  drawRange('#b7d3e0', vh * 0.42, vh * 0.17, 0.02);
  drawRange('#93b8cc', vh * 0.45, vh * 0.14, 0.05);
  drawRange('#7aa9b0', vh * 0.48, vh * 0.11, 0.09);
}
function drawMist() {
  const y = vh * 0.36 + Math.sin(sT * 0.3) * 6;
  ctx.fillStyle = safeLinear(0, y - 40, 0, y + 90, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.30)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(0, y - 40, vw, 130);
}
function drawSun() {
  const sx = vw * 0.8, sy = vh * 0.15;
  const pr = 46 + Math.sin(sT * 1.4) * 4;
  ctx.fillStyle = safeRadial(sx, sy, 10, sx, sy, pr * 2.4, [[0, 'rgba(255,240,180,0.55)'], [1, 'rgba(255,240,180,0)']]);
  ctx.fillRect(sx - pr * 2.4, sy - pr * 2.4, pr * 4.8, pr * 4.8);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(sT * 0.12);
  ctx.strokeStyle = 'rgba(255,235,160,0.35)';
  ctx.lineWidth = 6;
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(pr * 0.95, 0); ctx.lineTo(pr * 1.45, 0);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#ffe9a0';
  ctx.beginPath(); ctx.arc(sx, sy, pr * 0.55, 0, 7); ctx.fill();
}
function drawClouds() {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const c of deco.clouds) {
    const x = c.x, y = 40 + c.y * vh * 0.3;
    const s = c.s;
    ctx.beginPath();
    ctx.ellipse(x, y, 42 * s, 16 * s, 0, 0, 7);
    ctx.ellipse(x - 30 * s, y + 6 * s, 26 * s, 11 * s, 0, 0, 7);
    ctx.ellipse(x + 34 * s, y + 7 * s, 28 * s, 12 * s, 0, 0, 7);
    ctx.fill();
  }
}
function drawBirds() {
  const cx = Math.cos(sT * 0.1) * 430;
  const cy = -300 + Math.sin(sT * 0.1) * 80;
  ctx.strokeStyle = '#3f5b74';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const bx = cx + (i - 2) * 36 + Math.sin(sT * 2 + i) * 4;
    const by = cy + Math.abs(i - 2) * 14 + Math.sin(sT * 3 + i) * 3;
    const s = w2s(bx, by);
    const wing = Math.sin(sT * 9 + i) * 4 * zoom;
    ctx.beginPath();
    ctx.moveTo(s.x - 9 * zoom, s.y + wing);
    ctx.lineTo(s.x, s.y);
    ctx.lineTo(s.x + 9 * zoom, s.y + wing);
    ctx.stroke();
  }
}
function drawGround() {
  const hor = vh * 0.44;
  ctx.fillStyle = safeLinear(0, hor, 0, vh, [[0, '#8fd06a'], [1, '#58a23f']]);
  ctx.fillRect(0, hor, vw, vh - hor + 2);
  const v = viewRect();
  ctx.fillStyle = 'rgba(70,140,50,0.35)';
  for (const p of deco.patches) {
    if (!inView(v, p.x, p.y, 80)) continue;
    const s = w2s(p.x, p.y);
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, p.r * zoom, p.r * 0.45 * zoom, 0, 0, 7);
    ctx.fill();
  }
}
function drawPond() {
  const v = viewRect();
  if (!inView(v, POND.x, POND.y, 220)) return;
  const s = w2s(POND.x, POND.y);
  const rx = POND.rx * zoom, ry = POND.ry * zoom;
  ctx.fillStyle = '#d9c99a';
  ctx.beginPath(); ctx.ellipse(s.x, s.y + 6 * zoom, rx + 10 * zoom, ry + 7 * zoom, 0, 0, 7); ctx.fill();
  ctx.fillStyle = safeRadial(s.x, s.y, 10, s.x, s.y, rx, [[0, '#7cd0f5'], [1, '#3a8fd0']]);
  ctx.beginPath(); ctx.ellipse(s.x, s.y, rx, ry, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2 * zoom;
  for (let i = 0; i < 3; i++) {
    const ly = s.y - ry * 0.4 + i * ry * 0.45 + Math.sin(sT * 1.6 + i) * 3 * zoom;
    ctx.beginPath();
    ctx.moveTo(s.x - rx * (0.5 - i * 0.12), ly);
    ctx.lineTo(s.x + rx * (0.5 - i * 0.12), ly);
    ctx.stroke();
  }
  ctx.font = Math.round(20 * zoom) + 'px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🪷', s.x + rx * 0.5, s.y - ry * 0.3);
}
function drawDeco() {
  const v = viewRect();
  ctx.textAlign = 'center';
  /* flores */
  for (const f of deco.flowers) {
    if (!inView(v, f.x, f.y, 30)) continue;
    const s = w2s(f.x, f.y);
    ctx.strokeStyle = '#3f7d33'; ctx.lineWidth = 2 * zoom;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - 9 * zoom); ctx.stroke();
    ctx.fillStyle = f.c;
    ctx.beginPath(); ctx.arc(s.x, s.y - 11 * zoom, 3.6 * zoom, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath(); ctx.arc(s.x, s.y - 11 * zoom, 1.3 * zoom, 0, 7); ctx.fill();
  }
  /* setas */
  for (const m of deco.mush) {
    if (!inView(v, m.x, m.y, 30)) continue;
    const s = w2s(m.x, m.y);
    ctx.font = Math.round(15 * zoom) + 'px serif';
    ctx.fillText('🍄', s.x, s.y);
  }
  /* arbustos */
  for (const b of deco.bushes) {
    if (!inView(v, b.x, b.y, 40)) continue;
    const s = w2s(b.x, b.y);
    ctx.fillStyle = 'rgba(40,80,30,0.25)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 8 * zoom, 22 * zoom, 6 * zoom, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4aa04a';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 16 * zoom, 13 * zoom, 0, 0, 7);
    ctx.ellipse(s.x - 13 * zoom, s.y + 3 * zoom, 11 * zoom, 9 * zoom, 0, 0, 7);
    ctx.ellipse(s.x + 13 * zoom, s.y + 3 * zoom, 11 * zoom, 9 * zoom, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#e04b3c';
    ctx.beginPath(); ctx.arc(s.x - 8 * zoom, s.y - 3 * zoom, 2 * zoom, 0, 7); ctx.arc(s.x + 9 * zoom, s.y, 2 * zoom, 0, 7); ctx.fill();
  }
  /* rocas */
  for (const r of deco.rocks) {
    if (!inView(v, r.x, r.y, 40)) continue;
    const s = w2s(r.x, r.y);
    ctx.fillStyle = 'rgba(40,60,50,0.2)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 6 * zoom, 20 * r.s * zoom, 6 * zoom, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#9aa5ab';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 18 * r.s * zoom, 12 * r.s * zoom, 0.3, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#b8c2c7';
    ctx.beginPath(); ctx.ellipse(s.x - 5 * r.s * zoom, s.y - 4 * r.s * zoom, 7 * r.s * zoom, 4 * r.s * zoom, 0.3, 0, 7); ctx.fill();
  }
  /* árboles */
  for (const t of deco.trees) {
    if (!inView(v, t.x, t.y, 120 * t.s)) continue;
    const s = w2s(t.x, t.y);
    const z = zoom * t.s;
    const sway = Math.sin(sT * 0.8 + t.x * 0.01) * 2 * z;
    ctx.fillStyle = 'rgba(40,80,30,0.28)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 5 * z, 34 * z, 9 * z, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(s.x - 6 * z, s.y - 46 * z, 12 * z, 48 * z);
    ctx.fillStyle = '#3e8e3e';
    ctx.beginPath(); ctx.arc(s.x + sway, s.y - 64 * z, 30 * z, 0, 7); ctx.fill();
    ctx.fillStyle = '#4fa04a';
    ctx.beginPath(); ctx.arc(s.x - 20 * z + sway, s.y - 48 * z, 22 * z, 0, 7); ctx.fill();
    ctx.fillStyle = '#377f3b';
    ctx.beginPath(); ctx.arc(s.x + 21 * z + sway, s.y - 48 * z, 22 * z, 0, 7); ctx.fill();
    ctx.fillStyle = '#63b356';
    ctx.beginPath(); ctx.arc(s.x - 4 * z + sway, s.y - 76 * z, 16 * z, 0, 7); ctx.fill();
  }
}
function drawFences() {
  const v = viewRect();
  if (v.l > 420 || v.r < -420 || v.t > 780 || v.b < -80) return;
  const yT = -14, yB = 754, xL = -366, xR = 366;
  ctx.strokeStyle = '#b58a4f';
  ctx.lineWidth = 5 * zoom;
  const rail = (x1, y1, x2, y2) => {
    const a = w2s(x1, y1), b = w2s(x2, y2);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  };
  rail(xL, yT, -42, yT); rail(42, yT, xR, yT);
  rail(xL, yB, xR, yB);
  rail(xL, yT, xL, yB); rail(xR, yT, xR, yB);
  ctx.fillStyle = '#9c7440';
  for (let x = xL; x <= xR + 1; x += 72) {
    if (Math.abs(x) < 42) continue;
    if (!inView(v, x, yT, 20)) continue;
    const s = w2s(x, yT);
    ctx.fillRect(s.x - 4 * zoom, s.y - 10 * zoom, 8 * zoom, 26 * zoom);
    const sb = w2s(x, yB);
    ctx.fillRect(sb.x - 4 * zoom, sb.y - 10 * zoom, 8 * zoom, 26 * zoom);
  }
}
function drawPlots() {
  const v = viewRect();
  ctx.textAlign = 'center';
  for (let i = 0; i < S.plots.length; i++) {
    const p = S.plots[i];
    const pp = plotPos(i);
    if (!inView(v, pp.x, pp.y, 70)) continue;
    const s = w2s(pp.x, pp.y);
    const half = 42 * zoom;
    /* sombra suelo */
    ctx.fillStyle = 'rgba(60,90,40,0.30)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y + half * 0.92, half * 1.05, half * 0.28, 0, 0, 7); ctx.fill();
    /* tierra */
    ctx.fillStyle = p.u ? '#8a5a33' : 'rgba(120,85,50,0.42)';
    roundRect(s.x - half, s.y - half, half * 2, half * 2, 10 * zoom);
    ctx.fill();
    if (p.u) {
      ctx.strokeStyle = '#6d4426'; ctx.lineWidth = 2.5 * zoom;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(s.x - half * 0.7, s.y + k * half * 0.45);
        ctx.lineTo(s.x + half * 0.7, s.y + k * half * 0.45);
        ctx.stroke();
      }
      if (p.c) drawCrop(i, s, half);
      else {
        ctx.font = Math.round(20 * zoom) + 'px serif';
        ctx.fillStyle = 'rgba(255,250,220,0.5)';
        ctx.fillText('🌾', s.x, s.y + 7 * zoom);
      }
    } else {
      /* cartel de venta */
      const c = plotCost();
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(s.x - 3 * zoom, s.y, 6 * zoom, 34 * zoom);
      ctx.fillStyle = '#d9b877';
      roundRect(s.x - half * 0.8, s.y - 26 * zoom, half * 1.6, 26 * zoom, 5 * zoom); ctx.fill();
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5 * zoom;
      roundRect(s.x - half * 0.8, s.y - 26 * zoom, half * 1.6, 26 * zoom, 5 * zoom); ctx.stroke();
      ctx.fillStyle = '#5b3b1e';
      ctx.font = 'bold ' + Math.round(11 * zoom) + 'px "Segoe UI",sans-serif';
      ctx.fillText('🔒 ' + fmt(c), s.x, s.y - 9 * zoom);
    }
  }
}
function roundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function drawCrop(i, s, half) {
  const p = S.plots[i], c = p.c;
  const P = PLANT(c.id) || PLANTS[0];
  const total = Math.max(0.01, fin(c.total, P.grow));
  const g = clamp(1 - fin(c.left, total) / total, 0, 1);
  const ready = c.left <= 0.05;
  let size;
  if (ready) size = 46 + Math.sin(sT * 4) * 3;
  else size = 16 + 30 * easeOut(g);
  /* aura de mutación */
  if (c.mut) {
    const m = MUT(c.mut);
    if (m) {
      const pulse = 0.5 + 0.5 * Math.sin(sT * 3);
      const rr = half * (1.25 + 0.15 * pulse);
      ctx.fillStyle = safeRadial(s.x, s.y, 2, s.x, s.y, rr,
        [[0, hexA(m.c, 0.4 + 0.25 * pulse)], [1, hexA(m.c, 0)]]);
      ctx.fillRect(s.x - rr, s.y - rr, rr * 2, rr * 2);
    }
  }
  /* doble sombra (v3) */
  ctx.fillStyle = 'rgba(50,40,20,0.35)';
  ctx.beginPath(); ctx.ellipse(s.x, s.y + half * 0.55, size * 0.55 * zoom, size * 0.2 * zoom, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(50,40,20,0.18)';
  ctx.beginPath(); ctx.ellipse(s.x + 3 * zoom, s.y + half * 0.62, size * 0.7 * zoom, size * 0.24 * zoom, 0, 0, 7); ctx.fill();
  /* brote o cultivo */
  if (!ready && g < 0.22) {
    ctx.strokeStyle = '#63c04f'; ctx.lineWidth = 3 * zoom; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + 8 * zoom); ctx.lineTo(s.x, s.y - 4 * zoom);
    ctx.moveTo(s.x, s.y - 1 * zoom); ctx.lineTo(s.x + 7 * zoom, s.y - 8 * zoom);
    ctx.moveTo(s.x, s.y - 1 * zoom); ctx.lineTo(s.x - 7 * zoom, s.y - 7 * zoom);
    ctx.stroke();
  } else {
    const py = s.y + half * 0.35 - (ready ? Math.abs(Math.sin(sT * 4)) * 4 * zoom : 0);
    ctx.font = Math.round(size * zoom) + 'px serif';
    ctx.fillText(P.e, s.x, py);
    if (c.mut) {
      const m = MUT(c.mut);
      if (m) {
        ctx.font = Math.round(13 * zoom) + 'px serif';
        ctx.fillText(m.e, s.x + half * 0.55, s.y - half * 0.75 + Math.sin(sT * 3) * 2 * zoom);
      }
    }
  }
  /* iconos de estado */
  if (c.watered && !ready) {
    ctx.font = Math.round(13 * zoom) + 'px serif';
    ctx.fillText('💧', s.x - half * 0.62, s.y - half * 0.66);
  }
  if (ready) {
    ctx.font = Math.round(15 * zoom) + 'px serif';
    ctx.fillText('✨', s.x + half * 0.6, s.y - half * 0.5 + Math.sin(sT * 5) * 3 * zoom);
    ctx.fillText('✨', s.x - half * 0.6, s.y - half * 0.2 + Math.cos(sT * 4.4) * 3 * zoom);
  } else {
    /* barra de progreso */
    const bw = half * 1.5, bh = 5 * zoom;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(s.x - bw / 2, s.y + half * 0.72, bw, bh, 3 * zoom); ctx.fill();
    ctx.fillStyle = '#8ce06a';
    roundRect(s.x - bw / 2, s.y + half * 0.72, bw * g, bh, 3 * zoom); ctx.fill();
  }
}
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp(a, 0, 1) + ')';
}
function drawStalls() {
  const v = viewRect();
  ctx.textAlign = 'center';
  for (const k of Object.keys(STALLS)) {
    const st = STALLS[k];
    if (!inView(v, st.x, st.y, 150)) continue;
    const s = w2s(st.x, st.y);
    const z = zoom;
    /* sombra */
    ctx.fillStyle = 'rgba(50,70,40,0.3)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 42 * z, 80 * z, 14 * z, 0, 0, 7); ctx.fill();
    if (k === 'board') {
      /* tablón de madera */
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(s.x - 4 * z, s.y - 30 * z, 8 * z, 74 * z);
      ctx.fillStyle = st.a;
      roundRect(s.x - 55 * z, s.y - 62 * z, 110 * z, 66 * z, 8 * z); ctx.fill();
      ctx.strokeStyle = '#6d4f28'; ctx.lineWidth = 2 * z;
      roundRect(s.x - 55 * z, s.y - 62 * z, 110 * z, 66 * z, 8 * z); ctx.stroke();
      ctx.font = Math.round(30 * z) + 'px serif';
      ctx.fillText('📜', s.x, s.y - 14 * z);
      ctx.fillStyle = '#fff3d6';
      ctx.font = 'bold ' + Math.round(12 * z) + 'px "Segoe UI",sans-serif';
      ctx.fillText('MISIONES', s.x, s.y + 6 * z);
      return;
    }
    /* mesa y patas */
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(s.x - 60 * z, s.y + 24 * z, 120 * z, 14 * z);
    ctx.fillRect(s.x - 54 * z, s.y + 38 * z, 10 * z, 26 * z);
    ctx.fillRect(s.x + 44 * z, s.y + 38 * z, 10 * z, 26 * z);
    /* productos */
    ctx.font = Math.round(21 * z) + 'px serif';
    st.items.forEach((it, idx) => {
      ctx.fillText(it, s.x - 36 * z + idx * 36 * z, s.y + 20 * z);
    });
    /* postes del toldo */
    ctx.fillStyle = '#7a5a30';
    ctx.fillRect(s.x - 58 * z, s.y - 66 * z, 6 * z, 92 * z);
    ctx.fillRect(s.x + 52 * z, s.y - 66 * z, 6 * z, 92 * z);
    /* toldo a rayas */
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? st.a : st.b;
      const sx0 = s.x - 66 * z + i * 22 * z;
      ctx.beginPath();
      ctx.moveTo(sx0, s.y - 66 * z);
      ctx.lineTo(sx0 + 22 * z, s.y - 66 * z);
      ctx.lineTo(sx0 + 22 * z, s.y - 44 * z);
      ctx.arc(sx0 + 11 * z, s.y - 44 * z, 11 * z, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
    }
    /* cartel colgante */
    ctx.strokeStyle = '#6d5228'; ctx.lineWidth = 1.5 * z;
    ctx.beginPath();
    ctx.moveTo(s.x - 30 * z, s.y - 44 * z); ctx.lineTo(s.x - 30 * z, s.y - 30 * z);
    ctx.moveTo(s.x + 30 * z, s.y - 44 * z); ctx.lineTo(s.x + 30 * z, s.y - 30 * z);
    ctx.stroke();
    ctx.fillStyle = '#f4e3b2';
    roundRect(s.x - 44 * z, s.y - 30 * z, 88 * z, 22 * z, 5 * z); ctx.fill();
    ctx.strokeStyle = '#a88950'; ctx.lineWidth = 1.5 * z;
    roundRect(s.x - 44 * z, s.y - 30 * z, 88 * z, 22 * z, 5 * z); ctx.stroke();
    ctx.fillStyle = '#5b3b1e';
    ctx.font = 'bold ' + Math.round(11 * z) + 'px "Segoe UI",sans-serif';
    ctx.fillText(st.label, s.x, s.y - 14 * z);
  }
}
function drawPetsTrail() {
  if (!S.petsEq.length) return;
  ctx.textAlign = 'center';
  for (let k = 0; k < S.petsEq.length; k++) {
    const P = PET(S.petsEq[k]); if (!P) continue;
    const idx = player.trail.length - 1 - (k + 1) * 5;
    const t = idx >= 0 ? player.trail[idx] : player;
    const s = w2s(fin(t.x, player.x), fin(t.y, player.y));
    ctx.fillStyle = 'rgba(50,40,20,0.25)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 9 * zoom, 9 * zoom, 3.5 * zoom, 0, 0, 7); ctx.fill();
    ctx.font = Math.round(19 * zoom) + 'px serif';
    const bob = Math.sin(sT * 6 + k * 2) * 2 * zoom;
    ctx.fillText(P.e, s.x, s.y + 8 * zoom + bob);
  }
}
function drawPlayer() {
  const s = w2s(player.x, player.y);
  const z = zoom;
  const bob = player.moving ? Math.abs(Math.sin(player.step)) * 3 * z : 0;
  /* sombra */
  ctx.fillStyle = 'rgba(40,60,30,0.35)';
  ctx.beginPath(); ctx.ellipse(s.x, s.y + 20 * z, 20 * z, 7 * z, 0, 0, 7); ctx.fill();
  ctx.save();
  ctx.translate(s.x, s.y - bob);
  if (player.dir < 0) ctx.scale(-1, 1);
  /* piernas */
  ctx.fillStyle = '#3b5a8f';
  const lg = player.moving ? Math.sin(player.step * 2) * 5 * z : 0;
  roundRect(-8 * z, 8 * z, 7 * z, 14 * z + lg, 3 * z); ctx.fill();
  roundRect(1 * z, 8 * z, 7 * z, 14 * z - lg, 3 * z); ctx.fill();
  /* cuerpo (peto azul) */
  ctx.fillStyle = '#4a7ec9';
  roundRect(-13 * z, -14 * z, 26 * z, 26 * z, 8 * z); ctx.fill();
  ctx.fillStyle = '#3b5a8f';
  roundRect(-13 * z, -2 * z, 26 * z, 8 * z, 4 * z); ctx.fill();
  /* brazos */
  ctx.fillStyle = '#f0c090';
  roundRect(-17 * z, -10 * z, 5 * z, 14 * z, 2.5 * z); ctx.fill();
  roundRect(12 * z, -10 * z, 5 * z, 14 * z, 2.5 * z); ctx.fill();
  /* cabeza */
  ctx.fillStyle = '#f7cf9e';
  ctx.beginPath(); ctx.arc(0, -22 * z, 11 * z, 0, 7); ctx.fill();
  /* ojos */
  ctx.fillStyle = '#3b2f1e';
  ctx.beginPath(); ctx.arc(3 * z, -24 * z, 1.6 * z, 0, 7); ctx.arc(8 * z, -24 * z, 1.6 * z, 0, 7); ctx.fill();
  /* sombrero de paja */
  ctx.fillStyle = '#d9a441';
  ctx.beginPath(); ctx.ellipse(0, -30 * z, 16 * z, 5 * z, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -32 * z, 10 * z, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#b8842e';
  ctx.fillRect(-10 * z, -32 * z, 20 * z, 3 * z);
  ctx.restore();
}
function drawTargetRing() {
  if (!walkTarget) return;
  const s = w2s(walkTarget.x, walkTarget.y);
  const pulse = 0.5 + 0.5 * Math.sin(sT * 6);
  const r = (20 + 8 * pulse) * zoom;
  ctx.fillStyle = safeRadial(s.x, s.y, r * 0.4, s.x, s.y, r,
    [[0, 'rgba(255,255,255,0)'], [0.7, 'rgba(255,255,255,' + (0.25 + 0.2 * pulse) + ')'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2 * zoom;
  ctx.beginPath(); ctx.ellipse(s.x, s.y, r, r * 0.45, 0, 0, 7); ctx.stroke();
}
function drawSparks() {
  for (const sp of sparks) {
    const s = w2s(sp.x, sp.y);
    ctx.fillStyle = hexA(sp.c, clamp(1 - sp.t / 1.1, 0, 1));
    ctx.beginPath(); ctx.arc(s.x, s.y, 3.2 * zoom, 0, 7); ctx.fill();
  }
}
function drawFloaters() {
  ctx.textAlign = 'center';
  for (const f of floaters) {
    const s = w2s(f.x, f.y - f.t * 46);
    ctx.font = 'bold ' + Math.round(15 * zoom) + 'px "Segoe UI",sans-serif';
    ctx.globalAlpha = clamp(1.2 - f.t, 0, 1);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3;
    ctx.strokeText(f.txt, s.x, s.y);
    ctx.fillStyle = f.c;
    ctx.fillText(f.txt, s.x, s.y);
    ctx.globalAlpha = 1;
  }
}
function drawWeatherFX() {
  const id = curWeather ? curWeather.id : 'sol';
  if (weatherFx.rain.length) {
    ctx.strokeStyle = 'rgba(160,210,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const r of weatherFx.rain) { ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + 4, r.y + 16); }
    ctx.stroke();
  }
  if (weatherFx.snow.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const s of weatherFx.snow) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); }
  }
  for (const m of weatherFx.meteors) {
    const a = clamp(m.life, 0, 1);
    ctx.strokeStyle = safeLinear(m.x, m.y, m.x - m.vx * 0.18, m.y - m.vy * 0.18,
      [[0, 'rgba(255,220,140,' + (0.9 * a) + ')'], [1, 'rgba(255,140,60,0)']]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 0.18, m.y - m.vy * 0.18);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,230,170,' + (0.9 * a) + ')';
    ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, 7); ctx.fill();
  }
  if (weatherFx.aurora > 0) {
    for (let b = 0; b < 3; b++) {
      const base = vh * (0.08 + b * 0.05);
      ctx.beginPath();
      ctx.moveTo(-20, base);
      for (let x = -20; x <= vw + 20; x += 24) {
        ctx.lineTo(x, base + Math.sin(x * 0.008 + weatherFx.aurora * (0.8 + b * 0.3) + b * 2) * 26);
      }
      ctx.lineTo(vw + 20, -10); ctx.lineTo(-20, -10);
      ctx.closePath();
      ctx.fillStyle = 'hsla(' + (120 + b * 50) + ',80%,65%,0.13)';
      ctx.fill();
    }
  }
  if (weatherFx.flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (weatherFx.flash * 0.5) + ')';
    ctx.fillRect(0, 0, vw, vh);
  }
  if (curWeather && curWeather.tint) {
    ctx.fillStyle = curWeather.tint;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalAlpha = 1;
  }
}
function drawNight() {
  if (!isNight()) return;
  ctx.fillStyle = 'rgba(15,25,70,0.42)';
  ctx.fillRect(0, 0, vw, vh);
  for (const st of deco.stars) {
    const tw = 0.5 + 0.5 * Math.sin(sT * 2 + st.p);
    ctx.fillStyle = 'rgba(255,255,240,' + (0.55 * tw) + ')';
    ctx.fillRect(st.x * vw, st.y * vh, 2, 2);
  }
  const mx = vw * 0.16, my = vh * 0.13;
  ctx.fillStyle = safeRadial(mx, my, 4, mx, my, 60,
    [[0, 'rgba(255,251,220,0.5)'], [1, 'rgba(255,251,220,0)']]);
  ctx.fillRect(mx - 60, my - 60, 120, 120);
  ctx.fillStyle = '#fff8cf';
  ctx.beginPath(); ctx.arc(mx, my, 20, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(210,205,170,0.8)';
  ctx.beginPath();
  ctx.arc(mx - 6, my - 4, 3, 0, 7);
  ctx.arc(mx + 5, my + 6, 4, 0, 7);
  ctx.arc(mx + 7, my - 7, 2, 0, 7);
  ctx.fill();
}
function render() {
  /* saneo por fotograma: si algo llegara a ser NaN, se corrige aquí */
  zoom = clamp(zoom, 0.45, 2.8);
  cam.x = fin(cam.x, player.x);
  cam.y = fin(cam.y, player.y);
  drawSky();
  drawMountains();
  drawMist();
  drawSun();
  drawClouds();
  drawBirds();
  drawGround();
  drawPond();
  drawDeco();
  drawFences();
  drawPlots();
  drawStalls();
  drawPetsTrail();
  drawPlayer();
  drawTargetRing();
  drawSparks();
  drawFloaters();
  drawWeatherFX();
  drawNight();
}

/* ================= 13. BUCLE PRINCIPAL ================= */
let lastT = 0;
function frame(t) {
  requestAnimationFrame(frame);
  const dt = clamp((t - lastT) / 1000, 0, 0.1);
  lastT = t;
  try {
    update(dt);
  } catch (err) { console.error(err); fatalOnce(err); }
  try {
    render();
  } catch (err) { console.error(err); fatalOnce(err); }
}
function update(dt) {
  sT += dt;
  S.playT += dt;

  /* --- movimiento del jugador --- */
  let mvx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  let mvy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
  const spd = 300 * perk.walk;
  if (mvx || mvy) {
    const L = Math.hypot(mvx, mvy) || 1;
    player.x += mvx / L * spd * dt;
    player.y += mvy / L * spd * dt;
    walkTarget = null; pending = null;
    player.moving = true;
    if (mvx !== 0) player.dir = mvx > 0 ? 1 : -1;
  } else if (walkTarget) {
    const d = dist(player.x, player.y, walkTarget.x, walkTarget.y);
    if (d < 10) { walkTarget = null; player.moving = false; }
    else {
      player.x += (walkTarget.x - player.x) / d * spd * dt;
      player.y += (walkTarget.y - player.y) / d * spd * dt;
      player.moving = true;
      player.dir = (walkTarget.x - player.x) >= 0 ? 1 : -1;
    }
  } else player.moving = false;
  player.x = clamp(player.x, WORLD.x0, WORLD.x1);
  player.y = clamp(player.y, WORLD.y0, WORLD.y1);
  if (player.moving) {
    player.step += dt * 11;
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 30) player.trail.shift();
  }
  /* --- interacción en cola (tocar parcela lejana) --- */
  if (pending && dist(player.x, player.y, pending.x, pending.y) < 120) {
    const fn = pending.fn;
    pending = null; walkTarget = null;
    if (fn) fn();
  }
  /* --- cámara con seguimiento suave --- */
  const k = 1 - Math.pow(0.002, dt);
  cam.x = lerp(cam.x, player.x, k);
  cam.y = lerp(cam.y, player.y, k);

  /* --- crecimiento de cultivos --- */
  for (let i = 0; i < S.plots.length; i++) {
    const p = S.plots[i];
    if (!p.c) continue;
    const rate = (p.c.watered ? perk.water : 1) * perk.grow;
    const before = p.c.left;
    p.c.left = Math.max(0, p.c.left - dt * rate);
    if (before > 0.05 && p.c.left <= 0.05) rollMut(i);
  }

  /* --- clima --- */
  weatherT -= dt;
  if (weatherT <= 0) setWeather(rollWeather());
  updateWeatherFx(dt);

  /* --- tick de mutaciones en cultivos maduros --- */
  mutTickT -= dt;
  if (mutTickT <= 0) {
    mutTickT = 5;
    for (let i = 0; i < S.plots.length; i++) {
      const p = S.plots[i];
      if (p.c && !p.c.mut && p.c.left <= 0.05) rollMut(i);
    }
  }
  /* --- reabastecimiento de tienda --- */
  S.stockT -= dt;
  if (S.stockT <= 0) restock(false);

  /* --- nubes --- */
  for (const c of deco.clouds) {
    c.x -= c.v * dt;
    if (c.x < -260) { c.x = vw + 260; c.y = Math.random(); }
  }
  /* --- textos y chispas --- */
  for (let i = floaters.length - 1; i >= 0; i--) {
    floaters[i].t += dt;
    if (floaters[i].t > 1.2) floaters.splice(i, 1);
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const sp = sparks[i];
    sp.t += dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 320 * dt;
    if (sp.t > 1.1) sparks.splice(i, 1);
  }
  /* --- relojes de UI --- */
  achT -= dt;
  if (achT <= 0) { achT = 1; checkAch(); }
  saveT -= dt;
  if (saveT <= 0) { saveT = 12; save(); }
  const we = $('wTime');
  if (we) we.textContent = fmtT(weatherT);
  if (S.stockT <= STOCK_SEC) {
    const stEl = $('stockTimer');
    if (stEl) stEl.textContent = fmtT(S.stockT);
  }
}

/* ================= 14. INTERFAZ (DOM) ================= */
function toast(msg, cls) {
  const box = $('toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast ' + (cls || '');
  t.textContent = msg;
  box.appendChild(t);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => t.classList.add('out'), 2700);
  setTimeout(() => t.remove(), 3200);
}
function showModal(title, html, buttons) {
  const m = $('modal');
  m.classList.remove('hidden');
  m.innerHTML = '<div class="mbox"><h3>' + title + '</h3><div class="mbody">' + html +
    '</div><div class="mbtns" id="mbtns"></div></div>';
  const bt = $('mbtns');
  (buttons || [{ t: 'OK', primary: true }]).forEach(b => {
    const el = document.createElement('button');
    el.className = 'btn' + (b.primary ? '' : ' ghost');
    el.textContent = b.t;
    el.onclick = () => { hideModal(); if (b.fn) b.fn(); };
    bt.appendChild(el);
  });
}
function hideModal() { const m = $('modal'); if (m) m.classList.add('hidden'); }

function openPanel(id) {
  closePanels(); hideModal();
  const p = $(id); if (!p) return;
  const map = { pShop: buildShop, pPets: buildPets, pQuests: buildQuests, pAch: buildAch, pHelp: buildHelp };
  if (map[id]) map[id]();
  p.classList.add('open');
  $('shade').classList.remove('hidden');
}
function closePanels() {
  document.querySelectorAll('.panel.open').forEach(p => p.classList.remove('open'));
  const sh = $('shade'); if (sh) sh.classList.add('hidden');
}

function updateHUD() {
  $('coins').textContent = fmt(S.coins);
  $('lvlBadge').textContent = 'Nv ' + S.level;
  $('xpfill').style.width = clamp(S.xp / xpNeed(S.level) * 100, 0, 100) + '%';
  $('rbCount').textContent = S.rebirths;
}
function updateQuestChip() {
  const q = S.quests.find(x => x && !x.done) || S.quests.find(Boolean);
  const el = $('questChip');
  if (!q) { el.textContent = '📜 …'; return; }
  el.textContent = q.e + ' ' + q.txt + ' · ' + Math.min(q.prog, q.goal) + '/' + q.goal + (q.done ? ' ✔' : '');
}
function buildHotbar() {
  const hb = $('hotbar');
  const ids = ownedSeedIds();
  if (!ids.length) {
    sel = null;
    hb.innerHTML = '<button class="cta" id="ctaShop">🛒 Comprar semillas</button>';
    $('ctaShop').onclick = () => { SND.click(); openPanel('pShop'); };
    return;
  }
  if (!sel || !ids.includes(sel)) sel = ids[0];
  let h = '';
  ids.forEach((id, i) => {
    const P = PLANT(id);
    h += '<button class="slot ' + (id === sel ? 'on' : '') + '" data-id="' + id + '">' +
      '<span class="k">' + (i + 1) + '</span><span class="e">' + P.e + '</span>' +
      '<span class="c">' + S.seeds[id] + '</span></button>';
  });
  hb.innerHTML = h;
  hb.querySelectorAll('.slot').forEach(el => {
    el.onclick = () => { sel = el.dataset.id; SND.click(); buildHotbar(); };
  });
}

/* ---- Tienda ---- */
function buildShop() {
  const b = $('pShopBody');
  let h = '<div class="shop-note">Reabastecimiento en <b id="stockTimer">' + fmtT(S.stockT) +
    '</b> · Las mejores semillas siempre a la vista, aunque estén agotadas 🌟</div><div class="vgrid">';
  for (const P of [...PLANTS].sort((a, b2) => b2.cost - a.cost)) {
    const st = fin(S.stock[P.id], 0);
    const own = fin(S.seeds[P.id], 0);
    const r = RAR_OF(P.r);
    h += '<div class="vcard" style="--rc:' + r.c + '">' +
      '<div class="vband"></div>' +
      '<div class="vtop"><span class="ve">' + P.e + '</span>' +
      '<div class="vnames"><b>' + P.n + '</b><i class="vrar" style="color:' + r.c + '">' + r.n + '</i></div>' +
      '<span class="stock ' + (st > 0 ? 'ok' : 'no') + '">' + (st > 0 ? '×' + st : 'Agotado') + '</span></div>' +
      '<div class="vinfo">Vende ' + fmt(P.sMin) + '–' + fmt(P.sMax) + ' · Crece ' + P.grow + 's' +
      (P.multi > 1 ? ' · ×' + P.multi + ' cosechas' : '') + ' · +' + P.xp + ' XP</div>' +
      '<div class="vrow"><span class="price">🪙 ' + fmt(P.cost) + '</span>' +
      '<span class="own">' + (own ? 'Tienes ×' + own : '') + '</span></div>' +
      '<div class="vbtns"><button class="btn buy1" data-p="' + P.id + '"' + (st > 0 && S.coins >= P.cost ? '' : ' disabled') + '>Comprar</button>' +
      '<button class="btn buy5" data-p="' + P.id + '"' + (st >= 5 && S.coins >= P.cost * 5 ? '' : ' disabled') + '>+5</button></div>' +
      '</div>';
  }
  h += '</div>';
  b.innerHTML = h;
  b.querySelectorAll('.buy1').forEach(el => el.onclick = () => buySeed(el.dataset.p, 1));
  b.querySelectorAll('.buy5').forEach(el => el.onclick = () => buySeed(el.dataset.p, 5));
}
/* ---- Mascotas ---- */
function buildPets() {
  const b = $('pPetsBody');
  let h = '<div class="sect">🎒 Equipadas (' + S.petsEq.length + '/3) — te siguen por el huerto</div>';
  if (!S.petsEq.length) h += '<p style="font-size:12px;color:#7a6234;margin-bottom:8px">Aún no tienes mascotas equipadas. Adopta una abajo 👇</p>';
  for (const id of S.petsEq) {
    const P = PET(id); if (!P) continue;
    h += '<div class="petrow eq"><span class="pe">' + P.e + '</span>' +
      '<div class="pn"><b>' + P.n + '</b><small>' + P.d + '</small></div>' +
      '<button class="btn ghost" data-uneq="' + id + '">Quitar</button></div>';
  }
  h += '<div class="sect">🐣 Adopta nuevas mascotas</div>';
  for (const P of PETS) {
    if (S.petsOwned.includes(P.id) && !S.petsEq.includes(P.id)) {
      h += '<div class="petrow"><span class="pe">' + P.e + '</span>' +
        '<div class="pn"><b>' + P.n + '</b><small>' + P.d + '</small></div>' +
        '<button class="btn" data-eq="' + P.id + '">Equipar</button></div>';
    } else if (!S.petsOwned.includes(P.id)) {
      h += '<div class="petrow"><span class="pe">' + P.e + '</span>' +
        '<div class="pn"><b>' + P.n + '</b><small>' + P.d + '</small></div>' +
        '<span style="font-weight:800;color:#8a5a10;font-size:13px">🪙 ' + fmt(P.cost) + '</span>' +
        '<button class="btn" data-buy="' + P.id + '"' + (S.coins >= P.cost ? '' : ' disabled') + '>Adoptar</button></div>';
    }
  }
  b.innerHTML = h;
  b.querySelectorAll('[data-eq]').forEach(el => el.onclick = () => togglePet(el.dataset.eq));
  b.querySelectorAll('[data-uneq]').forEach(el => el.onclick = () => togglePet(el.dataset.uneq));
  b.querySelectorAll('[data-buy]').forEach(el => el.onclick = () => togglePet(el.dataset.buy));
}
/* ---- Misiones ---- */
function buildQuests() {
  ensureQuests();
  const b = $('pQuestsBody');
  let h = '';
  S.quests.forEach((q, i) => {
    const pc = clamp(q.prog / q.goal * 100, 0, 100);
    h += '<div class="qrow"><span class="qe">' + q.e + '</span>' +
      '<div class="qn"><b>' + q.txt + '</b>' +
      '<div class="qbar"><i style="width:' + pc + '%"></i></div>' +
      '<small>' + Math.min(q.prog, q.goal) + '/' + q.goal + ' · Recompensa: 🪙 ' + fmt(q.rc) + ' y +' + q.rx + ' XP</small></div>' +
      '<button class="btn" data-q="' + i + '"' + (q.done ? '' : ' disabled') + '>' + (q.done ? 'Reclamar ✔' : 'En curso') + '</button></div>';
  });
  h += '<p style="font-size:11px;color:#7a6234;margin-top:6px">Las misiones se completan solas al jugar. ¡Reclama y recibirás una nueva!</p>';
  b.innerHTML = h;
  b.querySelectorAll('[data-q]').forEach(el => el.onclick = () => claimQuest(+el.dataset.q));
  updateQuestChip();
}
/* ---- Logros ---- */
function buildAch() {
  const b = $('pAchBody');
  let h = '<div class="agrid">';
  for (const a of ACHS) {
    const got = !!S.ach[a.id];
    h += '<div class="acard' + (got ? '' : ' lock') + '"><span class="ae">' + (got ? a.e : '🔒') + '</span>' +
      '<div><b>' + a.n + '</b><small>' + a.d + '</small></div></div>';
  }
  h += '</div>';
  h += '<p style="font-size:11px;color:#7a6234;margin-top:10px">Desbloqueados: ' +
    Object.keys(S.ach).length + '/' + ACHS.length + '</p>';
  b.innerHTML = h;
}
/* ---- Ayuda ---- */
function buildHelp() {
  const b = $('pHelpBody');
  b.innerHTML =
    '<div class="help">' +
    '<h3>🎮 Cómo jugar</h3>' +
    '<ul>' +
    '<li><b>Moverte:</b> <kbd>WASD</kbd> / flechas, o <b>arrastra</b> por el mapa para caminar hacia donde toques.</li>' +
    '<li><b>Zoom:</b> rueda del ratón o pellizco con dos dedos (la cámara te sigue).</li>' +
    '<li><b>Plantar:</b> elige una semilla en la barra inferior y toca una parcela (o acércate y pulsa <kbd>E</kbd>).</li>' +
    '<li><b>Regar</b> acelera el crecimiento ×2 (×3 con la Oveja). <b>Cosecha</b> cuando aparezcan las ✨.</li>' +
    '<li><b>Mutaciones:</b> cada clima puede dar una mutación a los cultivos maduros: Lluvia 💧×2, Nevada ❄️×2, Tormenta de hielo 🧊×10, Meteoros 🌟×20, Auroras 🌈×50, Tormenta ⚡×100 y Lunar 🌙×4 de noche (20:00–6:00).</li>' +
    '<li><b>Tienda:</b> el stock cambia cada 3 min. ¡Las mejores semillas siempre se muestran!</li>' +
    '<li><b>Parcelas:</b> toca un cartel 🔒 para comprar más tierra (hasta 30).</li>' +
    '<li><b>Renacer:</b> desde nivel 15 puedes reiniciar monedas y parcelas a cambio de +25% de valor permanente. Las mascotas y logros se conservan.</li>' +
    '</ul>' +
    '<h3>⌨️ Atajos</h3>' +
    '<p><kbd>E</kbd> interactuar · <kbd>1–8</kbd> elegir semilla · <kbd>Esc</kbd> cerrar ventanas</p>' +
    '<h3>💾 Tu partida</h3>' +
    '<p>Se guarda automáticamente en este navegador cada 12 s y al cerrar la pestaña. Los cultivos <b>siguen creciendo mientras no estás</b>.</p>' +
    '<div class="hbtns">' +
    '<button class="btn" id="hRebirth"' + (S.level >= 15 ? '' : ' disabled') + '>🔁 Renacer (nivel 15)</button>' +
    '<button class="btn ghost" id="hDaily">🎁 Recompensa diaria</button>' +
    '<button class="btn danger" id="hReset">🗑️ Reiniciar progreso</button>' +
    '</div>' +
    '<p style="margin-top:14px;font-size:11px;color:#a08b4e">Grow a Garden ES v3.1 · hecho con cariño para GitHub Pages 🌱</p>' +
    '</div>';
  $('hRebirth').onclick = doRebirth;
  $('hDaily').onclick = () => {
    const st = dailyState();
    if (st.can) showModal('🎁 Recompensa diaria',
      'Racha: día ' + st.day + ' de 7.<br>Recompensa de hoy: <b>🪙 ' + fmt(DAILY[st.day - 1]) + '</b>',
      [{ t: 'Ahora no' }, { t: '¡Reclamar!', primary: true, fn: claimDaily }]);
    else showModal('🎁 Recompensa diaria',
      'Ya reclamaste hoy.<br>Vuelve en <b>' + fmtT((st.wait || 0) / 1000) + '</b> para la siguiente.<br>Racha actual: día ' + st.day + '.',
      [{ t: 'OK', primary: true }]);
  };
  $('hReset').onclick = resetSave;
}

/* ================= 15. ARRANQUE ================= */
function resize() {
  dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  vw = window.innerWidth; vh = window.innerHeight;
  canvas.width = Math.max(1, Math.floor(vw * dpr));
  canvas.height = Math.max(1, Math.floor(vh * dpr));
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
let lastFatal = 0;
function fatalOnce(err) {
  const t = Date.now();
  if (t - lastFatal < 5000) return;
  lastFatal = t;
  const el = $('fatal');
  if (!el) return;
  $('fatalMsg').textContent = '⚠️ ' + ((err && err.message) || 'Error interno (el juego sigue funcionando)');
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 8000);
}
function bindUI() {
  $('btnShop').onclick = () => { SND.click(); openPanel('pShop'); };
  $('btnPets').onclick = () => { SND.click(); openPanel('pPets'); };
  $('btnQuests').onclick = () => { SND.click(); openPanel('pQuests'); };
  $('btnAch').onclick = () => { SND.click(); openPanel('pAch'); };
  $('btnHelp').onclick = () => { SND.click(); openPanel('pHelp'); };
  $('btnMute').onclick = () => { S.muted = !S.muted; refreshMute(); save(); if (!S.muted) SND.click(); };
  $('questChip').onclick = () => { SND.click(); openPanel('pQuests'); };
  $('weatherChip').onclick = () => openPanel('pHelp');
  $('rbChip').onclick = () => {
    if (S.level >= 15) doRebirth();
    else showModal('⭐ Renacimientos',
      'Los renacimientos multiplican el valor de TODAS tus cosechas un +25% cada uno.<br><br>' +
      'Necesitas <b>nivel 15</b> para renacer (estás en el ' + S.level + ').<br>Renacimientos actuales: <b>' + S.rebirths + '</b> (×' + (1 + 0.25 * S.rebirths).toFixed(2) + ').',
      [{ t: '¡Entendido!', primary: true }]);
  };
  document.querySelectorAll('.pclose').forEach(el => el.onclick = closePanels);
  $('shade').onclick = closePanels;
  $('fatalClose').onclick = () => $('fatal').classList.add('hidden');
  refreshMute();
}
function refreshMute() { $('btnMute').innerHTML = (S.muted ? '🔇' : '🔊') + '<span>Sonido</span>'; }

function offlineFlow() {
  const elapsed = Math.min(43200, Math.max(0, (Date.now() - fin(S.time, Date.now())) / 1000));
  if (elapsed > 120) {
    let ready = 0, grown = 0;
    for (const p of S.plots) {
      if (!p.c) continue;
      const before = p.left;
      p.c.left = Math.max(0, p.c.left - elapsed * perk.grow);
      if (p.c.left <= 0.05 && before > 0.05) ready++;
      else if (p.c.left > 0.05 && before > p.c.left) grown++;
    }
    showModal('🌱 ¡Bienvenido de vuelta!',
      'Estuviste fuera <b>' + fmtT(elapsed) + '</b> y tus cultivos siguieron creciendo:<br>' +
      '🌱 <b>' + grown + '</b> avanzaron<br>✨ <b>' + ready + '</b> están listos para cosechar',
      [{ t: '¡A cosechar!', primary: true }]);
  }
  const st = dailyState();
  if (st.can) {
    setTimeout(() => {
      showModal('🎁 Recompensa diaria',
        'Racha: día ' + st.day + ' de 7.<br>Recompensa de hoy: <b>🪙 ' + fmt(DAILY[st.day - 1]) + '</b>' +
        (st.reset ? '<br><small>(Tu racha anterior expiró, ¡empezamos una nueva!)</small>' : ''),
        [{ t: 'Ahora no' }, { t: '¡Reclamar!', primary: true, fn: claimDaily }]);
    }, 450);
  }
}
function introFlow() {
  if (S.seenIntro) return;
  S.seenIntro = true;
  setTimeout(() => toast('👋 ¡Hola, granjero! Muévete con WASD, flechas o arrastrando el dedo'), 700);
  setTimeout(() => toast('👆 Toca una parcela para plantar, regar o cosechar'), 3600);
  setTimeout(() => toast('🛒 Abre la Tienda y planta tu primera zanahoria'), 6600);
  setTimeout(() => toast('🌦️ El clima cambia: cada uno da mutaciones diferentes'), 9600);
}

function init() {
  canvas = $('game');
  if (!canvas || !canvas.getContext) {
    document.body.innerHTML = '<p style="padding:20px;font-family:sans-serif">Tu navegador no soporta canvas 😢</p>';
    return;
  }
  ctx = canvas.getContext('2d');
  S = buildState(loadSave());
  calcPerks();
  ensureQuests();
  if (!Object.keys(S.stock).length) restock(true);
  else if (S.stockT <= 0) restock(true);
  deco = makeDeco();
  zoom = 1;
  cam = { x: player.x, y: player.y };
  setWeather(WEATHERS[0], true);
  resize();
  window.addEventListener('resize', resize);
  initInput();
  bindUI();
  buildHotbar(); updateHUD(); updateQuestChip();
  offlineFlow();
  introFlow();
  save();
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('error', ev => { if (ev && ev.error) fatalOnce(ev.error); });
  requestAnimationFrame(t => { lastT = t; requestAnimationFrame(frame); });
}
init();
