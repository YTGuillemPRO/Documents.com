/* ============ ¡ROBA EL MEME! — motor 3D (Three.js) ============ */
/* Three.js lo carga el "cargador con plan B" de index.html (carpeta local
   o CDN de respaldo) y lo deja en window.THREE ANTES de importar esto. */
if (!window.THREE) throw new Error('Three.js no está en window.THREE (cargador de index.html)');
const THREE = window.THREE;

/* ---------- utilidades ---------- */
/* $ acepta '#id' (estilo jQuery) o 'id' — ambas formas funcionan */
const $ = id => document.getElementById(String(id).replace(/^#/, ''));
window.__rem = () => E;   /* solo depuración: escribe __rem() en la consola */
window.__dbg = {          /* solo depuración: bases, bots y jugador */
  get bases() { return bases; }, get bots() { return bots; }, get jugador() { return jugador; }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const azar = (a, b) => a + Math.random() * (b - a);
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M'
  : n >= 1e4 ? (n / 1e3).toFixed(1).replace('.', ',') + ' k'
  : Math.floor(n).toLocaleString('es-ES');
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, t);
}

const MEMES = window.MEMES;
const RAREZAS = window.RAREZAS;
const MEJORAS = window.MEJORAS;
const LOGROS = window.LOGROS;
const CONF = window.CONFIG_JUEGO;
const defDe = id => MEMES.find(m => m.id === id) || MEMES[0];
const nombreDe = id => defDe(id).nombre;
const rarezaDe = id => defDe(id).rareza;
const CLAVE = 'robameme-guardado-v2';
const CLAVE_V1 = 'robameme-guardado-v1';

/* ---------- soniditos (WebAudio, sin archivos) ---------- */
let AC = null, sonando = true;
function beep(f = 600, d = .07, tipo = 'square', vol = .1, slide = 0) {
  if (!sonando) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = tipo; o.frequency.value = f;
    if (slide) o.frequency.linearRampToValueAtTime(f + slide, AC.currentTime + d);
    g.gain.setValueAtTime(vol, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + d);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + d);
  } catch (e) { }
}
const sonMoneda = () => beep(880, .06, 'square', .07);
const sonCompra = () => { beep(523, .07, 'triangle', .12); setTimeout(() => beep(659, .07, 'triangle', .12), 80); setTimeout(() => beep(784, .1, 'triangle', .12), 160); };
const sonRobo = () => beep(340, .18, 'sawtooth', .13, -180);
const sonPillado = () => { beep(150, .14, 'square', .16); setTimeout(() => beep(110, .18, 'square', .16), 130); };
const sonLogro = () => { beep(660, .1, 'triangle', .13); setTimeout(() => beep(990, .14, 'triangle', .13), 110); };
const sonEvento = () => beep(700, .14, 'triangle', .11, 220);
const sonRenacer = () => [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .16, 'triangle', .14), i * 110));

/* ---------- estado ---------- */
const E = {
  t: 0, pausado: true, enMenu: true, monedas: 0, nivel: 1,
  renacimientos: 0, record: 0, vioTutorial: false,
  tiendaAbierta: false, rebajas: false, joy: { x: 0, y: 0 },
  stats: { compras: 0, robos: 0, recuperados: 0, monedasLluvia: 0, eventos: 0, ganadas: 0, ganadasVida: 0, offline: 0 },
  mejoras: { zapatos: 0, guante: 0, iman: 0, base: 0 },
  escudosComprados: 0, logros: new Set()
};
const BASES_DEF = [
  { nombre: 'TU BASE', color: 0xf2c14e, css: '#f2c14e', x: -34, z: -34, esJugador: true, agres: 0 },
  { nombre: 'Base Roqui', color: 0xe25555, css: '#e25555', x: 34, z: -34, agres: .35 },
  { nombre: 'Base Verdi', color: 0x57b657, css: '#57b657', x: -34, z: 34, agres: .5 },
  { nombre: 'Base Azzur', color: 0x4a7fd4, css: '#4a7fd4', x: 34, z: 34, agres: .65 }
];

/* ---------- progresión: renacer, rangos ---------- */
const renacerMult = () => 1 + CONF.renacerBonus * E.renacimientos;
const ingresoDe = id => defDe(id).ingreso * CONF.multIngresos * renacerMult();
const monedasIniciales = () => Math.round(CONF.monedasIniciales + CONF.renacerMonedas * E.renacimientos);
const capJugador = () => Math.min(14, 6 + 2 * E.mejoras.base + Math.min(2, (E.renacimientos / 2) | 0));
const RANGOS = [[8, 'DIOS DEL MEME'], [5, 'Mito'], [3, 'Leyenda'], [2, 'Maestro'], [1, 'Ladrón Pro'], [0, 'Novato']];
const rangoDe = n => RANGOS.find(r => n >= r[0])[1];
const radioIman = () => 2.4 + 1.2 * E.mejoras.iman;
const velJugador = () => 8 * (1 + .08 * E.mejoras.zapatos);
const penalCarga = () => Math.max(.1, .30 - .04 * E.mejoras.guante);
const nivelDesde = g => Math.floor(Math.sqrt(g / 120)) + 1;
const precioFinal = m => Math.round(m.precio * (E.rebajas ? 1 - CONF.rebaja : 1));
function precioMejora(m) {
  const nv = m.id === 'escudo' ? E.escudosComprados : E.mejoras[m.id] || 0;
  return Math.round(m.base * Math.pow(m.mult, nv) / 5) * 5;
}

/* ---------- escena Three.js ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('#juego').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9adcf5);
const cam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 300);
let zoom = 1;

scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x7a9a56, .85));
scene.add(new THREE.AmbientLight(0xffffff, .35));
const sol = new THREE.DirectionalLight(0xfff3d6, 2.1);
sol.position.set(35, 55, 20);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -62, right: 62, top: 62, bottom: -62, near: 10, far: 140 });
sol.shadow.camera.updateProjectionMatrix();
scene.add(sol);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
});

/* ---------- materiales toon + sprites ---------- */
const gTex = new THREE.DataTexture(new Uint8Array([70, 135, 205, 255]), 4, 1, THREE.RedFormat);
gTex.needsUpdate = true; gTex.minFilter = gTex.magFilter = THREE.NearestFilter;
const cacheMat = new Map(), cacheBrillo = new Map();
const matToon = c => { if (!cacheMat.has(c)) cacheMat.set(c, new THREE.MeshToonMaterial({ color: c, gradientMap: gTex })); return cacheMat.get(c); };
const matBrillo = c => { if (!cacheBrillo.has(c)) cacheBrillo.set(c, new THREE.MeshBasicMaterial({ color: c })); return cacheBrillo.get(c); };
const matLinea = new THREE.MeshBasicMaterial({ color: 0x2b211c, side: THREE.BackSide });
const matDomo = new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide });

const p = (geo, c) => { const m = new THREE.Mesh(geo, matToon(c)); m.castShadow = true; return m; };
const br = (geo, c) => new THREE.Mesh(geo, matBrillo(c));
const contorno = (m, k = 1.07) => { const o = new THREE.Mesh(m.geometry, matLinea); o.scale.setScalar(k); m.add(o); return m; };
const esf = (r, c, n = 18) => p(new THREE.SphereGeometry(r, n, Math.max(8, n * .75 | 0)), c);
const cajaM = (a, b, d, c) => p(new THREE.BoxGeometry(a, b, d), c);
const cono = (r, h, c, s = 12) => p(new THREE.ConeGeometry(r, h, s), c);
const cil = (r1, r2, h, c, s = 14) => p(new THREE.CylinderGeometry(r1, r2, h, s), c);
const caps = (r, l, c) => p(new THREE.CapsuleGeometry(r, l, 5, 10), c);
const aro = (r, t, c, arc = Math.PI * 2) => p(new THREE.TorusGeometry(r, t, 8, 22, arc), c);

function rectondo(g, x, y, w, h, r) {
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
}
function spriteTexto(txt, o = {}) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  const fondo = o.fondo !== undefined ? o.fondo : 'rgba(43,33,28,.82)';
  if (fondo) {
    g.fillStyle = fondo; rectondo(g, 8, 10, 240, 44, 18); g.fill();
    g.strokeStyle = 'rgba(255,246,227,.85)'; g.lineWidth = 3; rectondo(g, 8, 10, 240, 44, 18); g.stroke();
  }
  g.font = `800 ${o.tam || 30}px Nunito, Arial, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = o.color || '#ffd93b';
  g.fillText(txt, 128, 34, 232);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  spr.scale.set(2.9, .73, 1);
  return spr;
}

/* ---------- fábrica procedural de memes 3D ---------- */
function fabricarMeme(id) {
  const def = defDe(id), M = def.modelo || {};
  const extras = M.extra || [];
  const colCab = M.cab !== undefined ? M.cab : M.c;
  const anim = [];
  const fase = Math.random() * 10;
  const g = new THREE.Group();

  const yc = 1.05;
  let cuerpo;
  if (M.cuerpo === 'caja') cuerpo = cajaM(1.6, 1.7, 1.15, M.c);
  else if (M.cuerpo === 'capsula') cuerpo = caps(.62, .95, M.c);
  else if (M.cuerpo === 'esfera') cuerpo = esf(.85, M.c);
  else { cuerpo = esf(.78, M.c); cuerpo.scale.set(1, 1.12, .92); }
  cuerpo.position.y = yc;
  contorno(cuerpo, M.cuerpo === 'caja' ? 1.06 : 1.08);
  g.add(cuerpo);
  if (M.panza) { const pan = esf(.5, M.panza); pan.scale.set(1, 1.25, .55); pan.position.set(0, yc - .15, .52); g.add(pan); }

  const yCab = yc + (M.cuerpo === 'caja' ? 1.45 : 1.25);
  let cabeza;
  if (M.cabezaCaja) cabeza = cajaM(1.05, 1, 1, colCab);
  else cabeza = esf(.62, colCab);
  cabeza.position.y = yCab;
  contorno(cabeza, M.cabezaCaja ? 1.07 : 1.09);
  g.add(cabeza);

  const tipoOjos = M.ojos || 'normal';
  if (tipoOjos === 'feliz') {
    for (const s of [-1, 1]) { const o = aro(.11, .032, 0x2b211c, Math.PI); o.position.set(.22 * s, yCab + .12, .5); g.add(o); }
  } else if (tipoOjos === 'led') {
    for (const s of [-1, 1]) { const o = br(new THREE.BoxGeometry(.15, .08, .06), 0x4df3ff); o.position.set(.2 * s, yCab + .07, .55); g.add(o); }
  } else if (tipoOjos === 'rojo') {
    for (const s of [-1, 1]) { const o = br(new THREE.SphereGeometry(.12, 10, 8), 0xff2b2b); o.position.set(.22 * s, yCab + .08, .48); g.add(o); }
  } else {
    const rg = tipoOjos === 'grande' ? .2 : .13, rp = tipoOjos === 'grande' ? .09 : .055;
    for (const s of [-1, 1]) {
      const o = esf(rg, 0xffffff, 12); o.castShadow = false;
      o.position.set((tipoOjos === 'grande' ? .26 : .22) * s, yCab + .08, tipoOjos === 'grande' ? .42 : .48);
      const pu = esf(rp, 0x2b211c, 8); pu.castShadow = false; pu.position.set(0, 0, rg * .75);
      o.add(pu); g.add(o);
    }
  }
  if (tipoOjos === 'enfado') {
    for (const s of [-1, 1]) { const c = cajaM(.17, .05, .03, 0x2b211c); c.position.set(.22 * s, yCab + .3, .48); c.rotation.z = -.45 * s; g.add(c); }
  }

  if (M.hocico === 'pico') {
    const pi = cono(.17, .38, 0xf08a24); pi.rotation.x = Math.PI / 2;
    pi.position.set(0, yCab - .04, .62); g.add(pi);
  } else if (M.hocico === 'hocico') {
    const h = esf(.21, 0xfff0dd, 12); h.scale.set(1, .8, .7); h.position.set(0, yCab - .16, .5); g.add(h);
    const n = esf(.07, 0x2b211c, 8); n.position.set(0, yCab - .1, .68); g.add(n);
  } else {
    const b = esf(.08, 0x2b211c, 8); b.scale.set(1.4, .7, .6); b.position.set(0, yCab - .24, .48); g.add(b);
  }

  if (M.orejas === 'puntas') {
    for (const s of [-1, 1]) { const o = cono(.16, .42, colCab); o.position.set(.3 * s, yCab + .55, 0); o.rotation.z = -.28 * s; g.add(o); }
  } else if (M.orejas === 'largas') {
    for (const s of [-1, 1]) { const o = caps(.11, .55, colCab); o.position.set(.2 * s, yCab + .78, -.04); o.rotation.z = -.14 * s; g.add(o); }
  } else if (M.orejas === 'redondas') {
    for (const s of [-1, 1]) { const o = esf(.17, colCab, 12); o.position.set(.34 * s, yCab + .5, 0); g.add(o); }
  } else if (M.orejas === 'caidas') {
    for (const s of [-1, 1]) { const o = esf(.19, colCab, 12); o.scale.set(1, .75, .8); o.position.set(.56 * s, yCab - .02, .08); o.rotation.z = -.5 * s; g.add(o); }
  } else if (M.orejas === 'cuernitos') {
    for (const s of [-1, 1]) { const o = cono(.09, .28, 0xf3ead3); o.position.set(.26 * s, yCab + .5, -.08); o.rotation.z = -.6 * s; g.add(o); }
  }

  const sc = M.sombreroC !== undefined ? M.sombreroC : 0x2b211c;
  if (M.sombrero === 'copa') {
    const t = cil(.3, .3, .5, sc); t.position.y = yCab + .75; g.add(t);
    const al = cil(.52, .52, .07, sc); al.position.y = yCab + .5; g.add(al);
  } else if (M.sombrero === 'gorro') {
    const t = p(new THREE.SphereGeometry(.52, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), sc); t.position.y = yCab + .42; g.add(t);
    const v = cajaM(.5, .06, .3, sc); v.position.set(0, yCab + .47, .45); v.rotation.x = -.15; g.add(v);
  } else if (M.sombrero === 'chef') {
    const t = cil(.34, .3, .6, 0xfdfaf2); t.position.y = yCab + .82; g.add(t);
    const pu = esf(.38, 0xfdfaf2, 14); pu.position.y = yCab + 1.2; g.add(pu);
  } else if (M.sombrero === 'corona') {
    const t = cil(.36, .42, .24, 0xffd93b); t.position.y = yCab + .6; g.add(t);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const pico = cono(.07, .2, 0xffd93b, 6); pico.position.set(Math.cos(a) * .32, yCab + .76, Math.sin(a) * .32); g.add(pico); }
  } else if (M.sombrero === 'casco') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.78, 18, 14), new THREE.MeshToonMaterial({ color: 0xbfe8ff, gradientMap: gTex, transparent: true, opacity: .35 }));
    b.position.y = yCab + .12; g.add(b);
  } else if (M.sombrero === 'cono') {
    const t = cono(.3, .58, sc); t.position.y = yCab + .72; g.add(t);
    const bol = br(new THREE.SphereGeometry(.1, 10, 8), 0xffd93b); bol.position.y = yCab + 1.04; g.add(bol);
  }

  const extC = M.extraC !== undefined ? M.extraC : colCab;
  for (const e of extras) {
    if (e === 'alas') {
      const alas = [];
      for (const s of [-1, 1]) {
        const a = esf(.42, extC, 12); a.scale.set(.16, .6, .42);
        a.position.set(.78 * s, yc + .38, -.05); a.rotation.z = -.5 * s;
        g.add(a); alas.push({ m: a, s });
      }
      anim.push(t => alas.forEach(({ m, s }) => m.rotation.z = -.5 * s + Math.sin(t * 3.2 + fase) * .22 * s));
    } else if (e === 'cola') {
      const piv = new THREE.Group(); piv.position.set(0, yc + .2, -.55); piv.rotation.x = -.9;
      const c = cono(.15, .72, extC); c.position.y = .35; piv.add(c);
      const tip = esf(.11, extC, 10); tip.position.y = .72; piv.add(tip);
      g.add(piv); anim.push(t => piv.rotation.y = Math.sin(t * 3 + fase) * .35);
    } else if (e === 'tentaculos') {
      const legs = [];
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        const l = caps(.08, .42, extC);
        l.position.set(Math.cos(a) * .5, yc - .72, Math.sin(a) * .5 + .12);
        l.rotation.x = .18; g.add(l); legs.push(l);
      }
      anim.push(t => legs.forEach((l, i) => l.rotation.z = Math.sin(t * 2.4 + i + fase) * .18));
    } else if (e === 'antena') {
      const a = cil(.035, .035, .55, 0x2b211c); a.position.set(0, yCab + .68, -.28); a.rotation.x = -.25; g.add(a);
      const luz = br(new THREE.SphereGeometry(.11, 10, 8), extC); luz.position.set(0, yCab + .95, -.34); g.add(luz);
      anim.push(t => luz.scale.setScalar(1 + Math.sin(t * 5 + fase) * .18));
    } else if (e === 'auriculares') {
      const b = aro(.6, .06, 0x2b211c); b.rotation.x = Math.PI / 2; b.position.y = yCab + .12; g.add(b);
      for (const s of [-1, 1]) { const o = esf(.16, extC, 12); o.position.set(.6 * s, yCab + .05, 0); g.add(o); }
    } else if (e === 'gafasSol') {
      for (const s of [-1, 1]) { const o = esf(.17, 0x2b211c, 12); o.scale.set(1, .75, .6); o.position.set(.22 * s, yCab + .08, .5); g.add(o); }
      const pu = cajaM(.16, .03, .03, 0x2b211c); pu.position.set(0, yCab + .1, .58); g.add(pu);
    } else if (e === 'gafas') {
      for (const s of [-1, 1]) { const o = aro(.13, .035, 0x2b211c); o.position.set(.22 * s, yCab + .08, .53); g.add(o); }
      const pu = cajaM(.14, .03, .03, 0x2b211c); pu.position.set(0, yCab + .1, .53); g.add(pu);
    } else if (e === 'cuerno') {
      const c = cono(.13, .5, 0xffd93b); c.position.set(0, yCab + .62, .18); c.rotation.x = -.35; g.add(c);
    } else if (e === 'cuernos') {
      for (const s of [-1, 1]) { const c = cono(.1, .34, 0xf3ead3); c.position.set(.34 * s, yCab + .55, 0); c.rotation.z = -.75 * s; g.add(c); }
    } else if (e === 'branquias') {
      const brs = [];
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
        const c = cono(.06, .3, extC, 6); c.position.set(.62 * s, yCab + .22 - i * .22, 0);
        c.rotation.z = s * Math.PI / 2; g.add(c); brs.push(c);
      }
      anim.push(t => brs.forEach((c, i) => c.rotation.x = Math.sin(t * 3 + i + fase) * .25));
    } else if (e === 'aleta') {
      const a = cono(.24, .55, extC, 4); a.scale.set(.45, 1, .3);
      a.position.set(0, yc + .95, -.38); a.rotation.x = -.3; g.add(a);
    } else if (e === 'llamas') {
      const cols = [0xffba08, 0xff5400, 0xffd93b, 0xff5400, 0xffba08, 0xffd93b];
      const pos = [[.3, yCab + .6, 0], [-.3, yCab + .6, 0], [0, yCab + .68, .25], [0, yCab + .55, -.3], [.2, yc + .85, -.5], [-.25, yc + .75, -.45]];
      const ll = pos.map((ps, i) => { const f = br(new THREE.ConeGeometry(.16, .5, 8), cols[i]); f.position.set(...ps); g.add(f); return f; });
      anim.push(t => ll.forEach((f, i) => f.scale.y = .8 + Math.sin(t * 9 + i * 1.7 + fase) * .3));
    } else if (e === 'melena') {
      const cols = [0xff5d8f, 0xffba08, 0xfff06a, 0x7ae582, 0x4ea8de, 0x9b5de5];
      [150, 210, 270, 330, 30].forEach((deg, i) => {
        const a = deg * Math.PI / 180;
        const c = cono(.13, .5, cols[i], 8);
        c.position.set(Math.cos(a) * .56, yCab + .42, Math.sin(a) * .56);
        c.rotation.z = -Math.cos(a) * .5; c.rotation.x = Math.sin(a) * .5;
        g.add(c);
      });
    } else if (e === 'musgo') {
      [[.32, yc + .82, .1], [-.3, yc + .78, .15], [0, yc + .9, .38]].forEach(ps => {
        const m = esf(.17, 0x57b657, 10); m.scale.set(1, .5, 1); m.position.set(...ps); g.add(m);
      });
    } else if (e === 'manchas') {
      [[.35, yc + .45, .42], [-.4, yc + .2, .35], [.1, yc + .75, .45], [-.2, yc - .1, .5]].forEach(ps => {
        const m = esf(.2, extC, 10); m.scale.set(1, 1, .5); m.position.set(...ps); g.add(m);
      });
    } else if (e === 'estrellas') {
      [[.32, yc + .5, .45], [-.35, yc + .2, .4], [.2, yc + .75, .2], [-.1, yc + .35, .55]].forEach(ps => {
        const s = br(new THREE.SphereGeometry(.07, 8, 6), 0xffe066); s.position.set(...ps); g.add(s);
      });
    } else if (e === 'glitch') {
      const c1 = cajaM(.5, .3, .55, 0x2b211c); c1.position.set(.55, yc + .4, .25); c1.rotation.y = .5; g.add(c1);
      const c2 = cajaM(.42, .22, .5, 0x2b211c); c2.position.set(-.5, yc + .8, -.3); c2.rotation.z = .4; g.add(c2);
      const c3 = br(new THREE.BoxGeometry(.3, .12, .3), 0x35f0ff); c3.position.set(.42, yc + .92, .2); g.add(c3);
      anim.push(t => { c3.position.x = .42 + Math.sin(t * 13 + fase) * .08; c1.rotation.y = .5 + Math.sin(t * 7 + fase) * .1; });
    } else if (e === 'musculos') {
      for (const s of [-1, 1]) { const b = caps(.21, .5, M.c); b.position.set(.95 * s, yc + .25, .1); b.rotation.z = -.15 * s; g.add(b); }
    } else if (e === 'bufanda') {
      const b = aro(.5, .11, extC); b.rotation.x = Math.PI / 2; b.position.y = yc + .68; g.add(b);
      const cola = cajaM(.17, .5, .06, extC); cola.position.set(.18, yc + .32, .52); cola.rotation.x = .15; g.add(cola);
    } else if (e === 'cinta') {
      const b = aro(.64, .055, 0x2b211c); b.rotation.x = Math.PI / 2; b.position.y = yCab + .12; g.add(b);
      for (const s of [-1, 1]) { const t = cajaM(.1, .32, .03, 0xe25555); t.position.set(.12 * s, yCab - .05, -.62); t.rotation.z = .3 * s; g.add(t); }
    } else if (e === 'corbata') {
      const c1 = cono(.15, .38, 0xe25555, 4); c1.rotation.x = Math.PI; c1.position.set(0, yc + .42, .6); g.add(c1);
      const c2 = cono(.11, .3, 0xe25555, 4); c2.rotation.x = Math.PI; c2.position.set(0, yc + .08, .62); g.add(c2);
    } else if (e === 'micro') {
      const p1 = cil(.05, .05, .5, 0x2b211c); p1.position.set(.68, yc + .38, .15); p1.rotation.z = .9; g.add(p1);
      const p2 = esf(.12, 0x3a3a3a, 10); p2.position.set(.9, yc + .58, .15); g.add(p2);
    } else if (e === 'mazo') {
      const m1 = cajaM(.09, .45, .09, 0x8b5a2b); m1.position.set(.62, yc + .15, .25); m1.rotation.z = -.4; g.add(m1);
      const m2 = cajaM(.32, .22, .22, 0xc9a06a); m2.position.set(.75, yc + .38, .25); m2.rotation.z = -.4; g.add(m2);
    } else if (e === 'pelo') {
      [[0, yCab + .6, 0], [.25, yCab + .5, .1], [-.25, yCab + .5, .1], [0, yCab + .48, .3]].forEach(ps => {
        const h = esf(.14, 0xe8e8e8, 10); h.position.set(...ps); g.add(h);
      });
    }
  }

  g.userData.animar = t => {
    cabeza.rotation.y = Math.sin(t * 1.6 + fase) * .14;
    cabeza.position.y = yCab + Math.sin(t * 2.2 + fase) * .03;
    for (const f of anim) f(t);
  };
  return g;
}

/* ---------- avatares (jugador y bots) + aura de renacimiento ---------- */
function fabricarAvatar(color, conGorra = true) {
  const g = new THREE.Group();
  const cuerpo = caps(.5, .85, color); cuerpo.position.y = 1.15; contorno(cuerpo, 1.07); g.add(cuerpo);
  const cabeza = esf(.55, 0xffd7b0); cabeza.position.y = 2.15; contorno(cabeza, 1.09); g.add(cabeza);
  for (const s of [-1, 1]) {
    const o = esf(.11, 0xffffff, 10); o.castShadow = false; o.position.set(.2 * s, 2.2, .45); g.add(o);
    const pu = esf(.05, 0x2b211c, 8); pu.castShadow = false; pu.position.set(.2 * s, 2.2, .54); g.add(pu);
  }
  const boca = esf(.07, 0x2b211c, 8); boca.castShadow = false; boca.scale.set(1.5, .6, .6); boca.position.set(0, 1.98, .5); g.add(boca);
  if (conGorra) {
    const gorr = p(new THREE.SphereGeometry(.58, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xffd93b); gorr.position.y = 2.3; g.add(gorr);
    const vis = cajaM(.55, .07, .34, 0xffd93b); vis.position.set(0, 2.28, .46); vis.rotation.x = -.12; g.add(vis);
  } else {
    const gor = p(new THREE.SphereGeometry(.56, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), color); gor.position.y = 2.28; g.add(gor);
    const pom = esf(.13, 0xfff6e3, 10); pom.position.y = 2.62; g.add(pom);
  }
  for (const s of [-1, 1]) {
    const pie = esf(.18, 0x2b211c, 10); pie.position.set(.22 * s, .12, .12); g.add(pie);
    const brazo = caps(.13, .4, color); brazo.position.set(.62 * s, 1.35, 0); brazo.rotation.z = -.2 * s; g.add(brazo);
  }
  return g;
}

function decorarAvatar(g) {
  if (g.userData.aura) { g.remove(g.userData.aura); g.userData.aura = null; }
  const n = E.renacimientos;
  if (n <= 0) return;
  const nivel = Math.min(n, 10);
  const aura = new THREE.Group();
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.05 + nivel * .05, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xffd93b, transparent: true, opacity: .12 + nivel * .012, depthWrite: false }));
  halo.position.y = 1.35; aura.add(halo);
  const anillo = aro(1.15 + nivel * .04, .055, 0xffd93b, 30);
  anillo.rotation.x = Math.PI / 2; anillo.position.y = .3; aura.add(anillo);
  if (n >= 3) {
    const base = cil(.32, .38, .2, 0xffd93b); base.position.y = 2.98; aura.add(base);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      const pico = cono(.055, .17, 0xffd93b, 6);
      pico.position.set(Math.cos(a) * .29, 3.12, Math.sin(a) * .29); aura.add(pico);
    }
  }
  if (n >= 5) {
    const divino = aro(.55, .045, 0x6ee7ff, 26);
    divino.rotation.x = Math.PI / 2.4; divino.position.y = 3.5; aura.add(divino);
  }
  g.add(aura);
  g.userData.aura = aura;
}

/* ---------- construcción del mundo ---------- */
const bases = [], bots = [];
const muros = [], arboles = [];
const monedasLluvia = [], flotantes = [];
const geoPed = new THREE.CylinderGeometry(1.05, 1.15, .5, 14);

function posSlot(b, i) {
  if (i < 12) { const gx = i % 4, gz = (i / 4) | 0; return { x: b.x + (gx - 1.5) * 3.6, z: b.z + (gz - 1) * 3.6 }; }
  const k = i - 12;
  return { x: b.x - 2.2 + k * 2.2, z: b.z - Math.sign(b.z) * 7.2 };
}
const colorMezcla = (base, otro, k) => new THREE.Color(base).lerp(new THREE.Color(otro), k).getHex();

function construirMundo() {
  const cesped = new THREE.Mesh(new THREE.PlaneGeometry(132, 132), matToon(0x82c95c));
  cesped.rotation.x = -Math.PI / 2; cesped.receiveShadow = true; scene.add(cesped);
  const borde = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), matToon(0x5e9e46));
  borde.rotation.x = -Math.PI / 2; borde.position.y = -.08; scene.add(borde);

  const geoCamino = new THREE.PlaneGeometry(5, 44); geoCamino.rotateX(-Math.PI / 2);
  for (let k = 0; k < 4; k++) {
    const c = new THREE.Mesh(geoCamino, matToon(0xf0d9a8));
    c.rotation.y = Math.PI / 4 + k * Math.PI / 2;
    c.position.set(Math.cos(Math.PI / 4 + k * Math.PI / 2) * 17, .06, Math.sin(Math.PI / 4 + k * Math.PI / 2) * 17);
    c.receiveShadow = true; scene.add(c);
  }
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(8.5, 26), matToon(0xf0d9a8));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = .05; plaza.receiveShadow = true; scene.add(plaza);

  const podio = cil(6, 6.6, .7, 0xf0d9a8, 20); podio.position.y = .35; podio.receiveShadow = true; scene.add(podio);
  const kiosco = cajaM(3.4, 2.6, 2.6, 0xe25555); kiosco.position.y = 2; kiosco.castShadow = true; scene.add(kiosco);
  for (let i = 0; i < 5; i++) {
    const t = cajaM(.78, .12, 3.4, i % 2 ? 0xfff6e3 : 0xe25555);
    t.position.set(-1.56 + i * .78, 3.42, 0); scene.add(t);
  }
  const mostrador = cajaM(3.1, .9, .4, 0xfff6e3); mostrador.position.set(0, 1.6, 1.5); scene.add(mostrador);
  const cartel = spriteTexto('TIENDA', { fondo: '#e25555', tam: 34 }); cartel.position.set(0, 4.7, 0); scene.add(cartel);

  const posArboles = [[-22, -44], [22, -44], [-44, -22], [-44, 22], [44, -22], [44, 20], [0, -44], [0, 44], [-44, 0], [44, 0]];
  for (const [x, z] of posArboles) {
    const tr = cil(.25, .35, 1.2, 0x8b5a2b); tr.position.set(x, .6, z); scene.add(tr);
    const c1 = cono(1.3, 2.2, 0x3e8e41, 10); c1.position.set(x, 2.2, z); scene.add(c1);
    const c2 = cono(.9, 1.6, 0x4ca04f, 10); c2.position.set(x, 3.3, z); scene.add(c2);
    arboles.push({ x, z });
  }
  for (let i = 0; i < 16; i++) {
    const a = azar(0, Math.PI * 2), r = azar(50, 58);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const c1 = cono(azar(1.1, 1.7), azar(2, 3), 0x3e8e41, 9); c1.position.set(x, 1.4, z); scene.add(c1);
  }
  [[12, 28], [-12, 28], [28, 12], [28, -12], [-12, -28], [-28, -12]].forEach(([x, z]) => {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(azar(.5, .9)), matToon(0xb8c0c8));
    r.position.set(x, .3, z); r.castShadow = true; r.rotation.set(azar(0, 3), azar(0, 3), 0); scene.add(r);
  });
  for (let i = 0; i < 40; i++) {
    let x, z, ok = false;
    for (let k = 0; k < 12 && !ok; k++) {
      x = azar(-44, 44); z = azar(-44, 44);
      ok = Math.hypot(x, z) > 10 && Math.abs(x - z) > 3.5 && Math.abs(x + z) > 3.5 &&
        !BASES_DEF.some(b => Math.abs(x - b.x) < 10 && Math.abs(z - b.z) < 10);
    }
    if (!ok) continue;
    const f = esf(.09, [0xfff6e3, 0xffd93b, 0xff9ff3][i % 3], 8); f.castShadow = false;
    f.position.set(x, .12, z); scene.add(f);
  }

  BASES_DEF.forEach((d, i) => {
    const b = { ...d, idx: i, slots: [], escudoHasta: 0, bot: null };
    const sx = Math.sign(b.x), sz = Math.sign(b.z);
    const suelo = cajaM(18, .5, 18, colorMezcla(b.color, 0xffffff, .45));
    suelo.position.set(b.x, .25, b.z); suelo.receiveShadow = true; scene.add(suelo);
    const cMuro = colorMezcla(b.color, 0x2b211c, .3);
    const m1 = cajaM(1, 2.4, 18, cMuro); m1.position.set(b.x + sx * 8.5, 1.45, b.z); scene.add(m1);
    const m2 = cajaM(18, 2.4, 1, cMuro); m2.position.set(b.x, 1.45, b.z + sz * 8.5); scene.add(m2);
    muros.push({ x: b.x + sx * 8.5, z: b.z, ex: .5, ez: 9 }, { x: b.x, z: b.z + sz * 8.5, ex: 9, ez: .5 });
    const poste = cil(.08, .08, 2.4, 0x8b5a2b); poste.position.set(b.x - sx * 6.5, 1.7, b.z - sz * 6.5); scene.add(poste);
    const nom = spriteTexto(b.nombre, { fondo: b.css, color: '#fff6e3', tam: 26 });
    nom.position.set(b.x - sx * 6.5, 3.1, b.z - sz * 6.5); scene.add(nom);
    const domo = new THREE.Mesh(new THREE.SphereGeometry(10.6, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), matDomo);
    domo.position.set(b.x, .2, b.z); domo.visible = false; scene.add(domo);
    b.domo = domo;
    bases.push(b);
  });
}

/* ---------- colisiones ---------- */
function resolverMuros(pos, r) {
  for (const m of muros) {
    const dx = pos.x - m.x, dz = pos.z - m.z;
    const px = m.ex + r - Math.abs(dx), pz = m.ez + r - Math.abs(dz);
    if (px > 0 && pz > 0) {
      if (px < pz) pos.x = m.x + Math.sign(dx || 1) * (m.ex + r);
      else pos.z = m.z + Math.sign(dz || 1) * (m.ez + r);
    }
  }
  const dc = Math.hypot(pos.x, pos.z);
  if (dc < 7.4 + r && dc > .001) { const f = (7.4 + r) / dc; pos.x *= f; pos.z *= f; }
  for (const a of arboles) {
    const dx = pos.x - a.x, dz = pos.z - a.z, d = Math.hypot(dx, dz);
    if (d < 1.1 + r && d > .001) { const f = (1.1 + r) / d; pos.x = a.x + dx * f; pos.z = a.z + dz * f; }
  }
  pos.x = clamp(pos.x, -46, 46); pos.z = clamp(pos.z, -46, 46);
}

/* ---------- slots y economía ---------- */
function instalarMeme(b, id, mesh) {
  const i = b.slots.length;
  if (i >= 14) { return null; }
  const ps = posSlot(b, i);
  const ped = new THREE.Mesh(geoPed, matToon(colorMezcla(b.color, 0xffffff, .2)));
  ped.position.set(ps.x, .25, ps.z); ped.castShadow = ped.receiveShadow = true; scene.add(ped);
  const m = mesh || fabricarMeme(id);
  if (m.parent) m.parent.remove(m);
  m.position.set(ps.x, .5, ps.z);
  m.rotation.y = Math.atan2(-ps.x, -ps.z);
  const spr = spriteTexto('0');
  spr.position.set(ps.x, 3.5, ps.z);
  scene.add(m); scene.add(spr);
  const slot = { id, acum: 0, mesh: m, ped, sprite: spr, mostrado: 0, tSpr: 0 };
  b.slots.push(slot);
  return slot;
}
function quitarSprite(spr) {
  if (!spr) return;
  scene.remove(spr);
  if (spr.material.map) spr.material.map.dispose();
  spr.material.dispose();
}
function textoFlotante(txt, x, z, color = '#ffd93b') {
  const spr = spriteTexto(txt, { color, fondo: 'rgba(43,33,28,.7)', tam: 34 });
  spr.position.set(x, 2.7, z);
  scene.add(spr); flotantes.push({ spr, vida: 1 });
}

/* ---------- jugador y bots ---------- */
const jugador = { pos: new THREE.Vector3(-34, 0, -34), grupo: null, llevando: null, stun: 0 };

function crearEntidades() {
  jugador.grupo = fabricarAvatar(0x4a7fd4, true);
  jugador.grupo.position.copy(jugador.pos);
  scene.add(jugador.grupo);
  decorarAvatar(jugador.grupo);
  for (let i = 1; i < 4; i++) {
    const b = bases[i];
    const bot = {
      baseIdx: i, nombre: b.nombre.replace('Base ', ''), grupo: null,
      pos: new THREE.Vector3(b.x, 0, b.z), estado: 'base', timer: azar(2, 5),
      monedas: 80 + i * 45, agres: b.agres, llevando: null, objetivo: null, slotIdx: 0,
      destino: { x: b.x, z: b.z }, ladron: null, rendirse: 0, fueraZona: 0,
      tEsperaCompra: azar(6, 18), tEsperaRobo: azar(35, 70),
      velocidad: 7.2 * (0.92 + b.agres * .3)
    };
    bot.grupo = fabricarAvatar(b.color, false);
    bot.grupo.position.copy(bot.pos);
    const nom = spriteTexto(bot.nombre, { fondo: b.css, color: '#fff6e3', tam: 24 });
    nom.position.y = 3.5; bot.grupo.add(nom);
    scene.add(bot.grupo);
    b.bot = bot; bots.push(bot);
  }
}

/* ---------- robar, soltar, depositar ---------- */
function agarrar(ent, vb, idx) {
  const slot = vb.slots.splice(idx, 1)[0];
  if (!slot) return;
  scene.remove(slot.ped); quitarSprite(slot.sprite);
  ent.llevando = { id: slot.id, mesh: slot.mesh, origen: vb.idx };
  ent.grupo.add(slot.mesh);
  slot.mesh.position.set(0, 3.15, 0); slot.mesh.rotation.set(0, 0, 0);
  if (ent === jugador) {
    E.stats.robos++; sonRobo(); statFB('robosTotales');
    toast(`¡Has robado a ${nombreDe(slot.id)}! ¡Corre a tu base!`);
    if (vb.bot) { vb.bot.estado = 'perseguir'; vb.bot.ladron = { ref: jugador }; vb.bot.rendirse = 12; vb.bot.fueraZona = 0; }
  } else {
    if (vb.esJugador) {
      toast(`¡${ent.nombre} te está robando a ${nombreDe(slot.id)}! ¡Persíguelo dentro de tu base!`, 'mal');
      beep(240, .16, 'sawtooth', .14);
    } else if (vb.bot) {
      vb.bot.estado = 'perseguir'; vb.bot.ladron = { ref: ent }; vb.bot.rendirse = 12; vb.bot.fueraZona = 0;
    }
  }
}
function soltar(ent) {
  const lv = ent.llevando; if (!lv) return;
  const vb = bases[lv.origen];
  if (vb.slots.length >= 14) {
    ent.grupo.remove(lv.mesh); quitarMesh(lv.mesh);
    toast(`${nombreDe(lv.id)} se perdió en el rescate…`, 'mal');
  } else {
    instalarMeme(vb, lv.id, lv.mesh);
  }
  ent.llevando = null;
  if (ent === jugador) {
    jugador.stun = 2.4; sonPillado();
    toast('¡Te han pillado! El meme vuelve a su base.', 'mal');
  } else {
    ent.estado = 'huir';
    if (vb.esJugador) { E.stats.recuperados++; sonLogro(); toast(`¡Has recuperado a ${nombreDe(lv.id)}!`); }
  }
}
function quitarMesh(m) {
  scene.remove(m);
  m.traverse(o => { if (o.isMesh && o.geometry !== geoPed) o.geometry.dispose(); });
}
function actualizarCapturas() {
  const portadores = [];
  if (jugador.llevando) portadores.push(jugador);
  for (const b of bots) if (b.llevando) portadores.push(b);
  for (const c of portadores) {
    const vb = bases[c.llevando.origen];
    const dueno = vb.esJugador ? jugador : vb.bot;
    if (dueno === c) continue;
    const enZona = Math.hypot(c.pos.x - vb.x, c.pos.z - vb.z) < 13;
    const cerca = Math.hypot(dueno.pos.x - c.pos.x, dueno.pos.z - c.pos.z) < 2.9;
    if (enZona && cerca) {
      soltar(c);
      if (dueno !== jugador && dueno.estado === 'perseguir') { dueno.estado = 'base'; dueno.timer = 2; dueno.ladron = null; }
    }
  }
}

/* ---------- IA de los bots ---------- */
function moverHacia(ent, x, z, dt, mult = 1) {
  const dx = x - ent.pos.x, dz = z - ent.pos.z, d = Math.hypot(dx, dz);
  if (d < .45) return true;
  let vx = dx / d, vz = dz / d;
  const dc = Math.hypot(ent.pos.x, ent.pos.z);
  if (dc < 11.5 && dc > .01) {
    const rx = ent.pos.x / dc, rz = ent.pos.z / dc;
    if (vx * -rx + vz * -rz > .25) {
      const lado = (vx * rz - vz * rx) >= 0 ? 1 : -1;
      vx += -rz * lado * 1.3; vz += rx * lado * 1.3;
      const n = Math.hypot(vx, vz); vx /= n; vz /= n;
    }
  }
  const sp = ent.velocidad * mult * (ent.llevando ? .75 : 1);
  ent.pos.x += vx * sp * dt; ent.pos.z += vz * sp * dt;
  resolverMuros(ent.pos, .85);
  ent.grupo.position.set(ent.pos.x, 0, ent.pos.z);
  ent.grupo.rotation.y = lerpAngle(ent.grupo.rotation.y, Math.atan2(vx, vz), dt * 9);
  return false;
}
function comprarBot(bot, b) {
  bot.tEsperaCompra = E.t + azar(16, 26);
  const permitidas = ['comun', 'raro'];
  if (E.t > 150) permitidas.push('epico');
  if (E.t > 360) permitidas.push('legendario');
  if (E.t > 600) permitidas.push('mitico');
  if (b.slots.length >= 8) return;
  const opciones = MEMES.filter(m => permitidas.includes(m.rareza) && m.precio <= bot.monedas);
  if (!opciones.length) return;
  opciones.sort((a, c) => (c.ingreso / c.precio) - (a.ingreso / a.precio));
  const m = Math.random() < .3 ? opciones[Math.min(opciones.length - 1, 1 + (Math.random() * 3 | 0))] : opciones[0];
  bot.monedas -= m.precio;
  instalarMeme(b, m.id);
}
function decidirBot(bot) {
  const b = bases[bot.baseIdx];
  bot.timer = azar(2.5, 4.5);
  const ag = CONF.botAgresividad * bot.agres * (E.t < MINI.caosHasta ? 3 : 1);
  if (bot.monedas >= 60 && b.slots.length < 8 && E.t > bot.tEsperaCompra) { bot.estado = 'comprar'; return; }
  if (Math.random() < .45 * ag && E.t > bot.tEsperaRobo) {
    const cand = bases.filter(x => x !== b && x.escudoHasta < E.t && x.slots.length > 0 && !(x.esJugador && MINI.fantasma));
    if (cand.length) {
      const bolsa = [];
      cand.forEach(x => { for (let i = 0; i < (x.esJugador ? 2 : 1); i++) bolsa.push(x); });
      const vb = bolsa[(Math.random() * bolsa.length) | 0];
      let mejor = 0;
      vb.slots.forEach((s, i) => { if (ingresoDe(s.id) > ingresoDe(vb.slots[mejor].id)) mejor = i; });
      bot.objetivo = vb; bot.slotIdx = mejor; bot.estado = 'robar'; return;
    }
  }
  if (bot.monedas > 900 && b.slots.length >= 3 && Math.random() < .3) {
    bot.monedas -= 200; b.escudoHasta = E.t + 45; return;
  }
  bot.estado = 'pasear';
  bot.destino = { x: clamp(azar(-38, 38), -44, 44), z: clamp(azar(-38, 38), -44, 44) };
}
function actualizarBot(bot, dt) {
  const b = bases[bot.baseIdx];
  if (Math.hypot(bot.pos.x - b.x, bot.pos.z - b.z) < 10) {
    for (const s of b.slots) { const v = Math.floor(s.acum); if (v > 0) { bot.monedas += v; s.acum -= v; } }
  }
  bot.timer -= dt;
  switch (bot.estado) {
    case 'base':
      moverHacia(bot, b.x, b.z, dt, .9);
      if (bot.timer <= 0) decidirBot(bot);
      break;
    case 'pasear':
      if (moverHacia(bot, bot.destino.x, bot.destino.z, dt, .8)) { bot.estado = 'base'; bot.timer = azar(1.5, 3.5); }
      break;
    case 'comprar':
      if (moverHacia(bot, b.x * .13, b.z * .13, dt, 1)) { comprarBot(bot, b); bot.estado = 'volver'; }
      break;
    case 'robar': {
      const vb = bot.objetivo;
      const slot = vb && vb.slots[bot.slotIdx];
      if (!vb || !slot || vb.escudoHasta > E.t) { bot.estado = 'base'; bot.timer = 2; break; }
      const ps = slot.mesh.position;
      if (moverHacia(bot, ps.x, ps.z, dt, 1.05)) {
        const idx = vb.slots.indexOf(slot);
        if (idx >= 0 && vb.escudoHasta < E.t) agarrar(bot, vb, idx);
        bot.estado = 'volver';
      }
      break;
    }
    case 'perseguir': {
      const l = bot.ladron;
      if (!l || !l.ref.llevando) { bot.estado = 'base'; bot.timer = 2; bot.ladron = null; break; }
      bot.rendirse -= dt;
      const enZona = Math.hypot(l.ref.pos.x - b.x, l.ref.pos.z - b.z) < 14;
      bot.fueraZona = enZona ? 0 : bot.fueraZona + dt;
      if (bot.rendirse <= 0 || bot.fueraZona > 2.5) { bot.estado = 'base'; bot.timer = 3; bot.ladron = null; break; }
      moverHacia(bot, l.ref.pos.x, l.ref.pos.z, dt, 1.12);
      break;
    }
    case 'volver':
      if (moverHacia(bot, b.x, b.z, dt, 1)) {
        if (bot.llevando) {
          if (b.slots.length >= 10) { bot.grupo.remove(bot.llevando.mesh); quitarMesh(bot.llevando.mesh); bot.llevando = null; }
          else { instalarMeme(b, bot.llevando.id, bot.llevando.mesh); bot.llevando = null; }
        }
        bot.estado = 'base'; bot.timer = azar(2, 4);
      }
      break;
    case 'huir':
      if (moverHacia(bot, b.x, b.z, dt, 1.15)) { bot.estado = 'base'; bot.timer = 2; }
      break;
  }
}

/* ============ game.js — PARTE 2 (continuación) ============ */

/* ---------- eventos ---------- */
let evento = null, proximoEvento = CONF.eventoCada * azar(.75, 1.25);
const NOMBRES_EVENTO = {
  lluvia: 'Lluvia de Monedas', rebajas: 'Rebajas Locas',
  fiebre: 'Fiebre del Oro', escudos: 'Escuadrón Anti-Robo'
};
const multEvento = () => evento && evento.tipo === 'fiebre' ? CONF.fiebre : 1;
function lanzarEvento() {
  const tipos = ['lluvia', 'rebajas', 'fiebre', 'escudos'];
  const tipo = tipos[(Math.random() * tipos.length) | 0];
  evento = { tipo, hasta: E.t + CONF.eventoDuracion };
  if (tipo === 'lluvia') {
    for (let i = 0; i < CONF.lluviaMonedas; i++) {
      let x = 0, z = 0;
      for (let k = 0; k < 10; k++) { x = azar(-40, 40); z = azar(-40, 40); if (Math.hypot(x, z) > 10) break; }
      const m = br(new THREE.CylinderGeometry(.5, .5, .14, 12), 0xffd93b);
      m.position.set(x, .8, z); scene.add(m);
      monedasLluvia.push({ mesh: m, fase: azar(0, 9) });
    }
  } else if (tipo === 'rebajas') { E.rebajas = true; }
  else if (tipo === 'escudos') { for (const b of bases) b.escudoHasta = E.t + 15; }
  toast(`¡EVENTO: ${NOMBRES_EVENTO[tipo]}!`, 'logro'); sonEvento();
  if (E.tiendaAbierta) renderMemes();
}
function finEvento() {
  if (evento.tipo === 'lluvia') for (const c of monedasLluvia) scene.remove(c.mesh);
  monedasLluvia.length = 0;
  E.rebajas = false;
  E.stats.eventos++;
  evento = null;
  proximoEvento = CONF.eventoCada * azar(.8, 1.2);
  if (E.tiendaAbierta) renderMemes();
}
function actualizarEventos(dt) {
  if (!evento) {
    proximoEvento -= dt;
    if (proximoEvento <= 0) lanzarEvento();
    return;
  }
  if (E.t > evento.hasta) { finEvento(); return; }
  if (evento.tipo === 'lluvia') {
    for (let i = monedasLluvia.length - 1; i >= 0; i--) {
      const c = monedasLluvia[i];
      c.mesh.rotation.y += dt * 3;
      c.mesh.position.y = .8 + Math.sin(E.t * 3 + c.fase) * .15;
      if (Math.hypot(jugador.pos.x - c.mesh.position.x, jugador.pos.z - c.mesh.position.z) < 1.8) {
        const v = CONF.lluviaValor + E.nivel * 2;
        E.monedas += v; E.stats.ganadas += v; E.stats.monedasLluvia++;
        textoFlotante('+' + v, c.mesh.position.x, c.mesh.position.z);
        sonMoneda();
        scene.remove(c.mesh); monedasLluvia.splice(i, 1);
      }
    }
  }
}

/* ---------- niveles y logros ---------- */
const CONDS = {
  primer: () => E.stats.compras >= 1,
  coleccion: () => bases[0].slots.length >= 10,
  ladron: () => E.stats.robos >= 1,
  maestro: () => E.stats.robos >= 10,
  rico: () => E.stats.ganadas >= 1000,
  magnate: () => E.stats.ganadas >= 25000,
  nivel5: () => E.nivel >= 5,
  leyenda: () => bases[0].slots.some(s => ['legendario', 'mitico', 'secreto'].includes(rarezaDe(s.id))),
  mito: () => bases[0].slots.some(s => ['mitico', 'secreto'].includes(rarezaDe(s.id))),
  evento3: () => E.stats.eventos >= 3,
  lluvia25: () => E.stats.monedasLluvia >= 25,
  lleno: () => bases[0].slots.length >= capJugador() && capJugador() > 0,
  renacer1: () => E.renacimientos >= 1,
  renacer3: () => E.renacimientos >= 3,
  record10k: () => E.record >= 10000,
  nocturno: () => (E.stats.offline || 0) >= 1
};
function revisarNivel() {
  const n = nivelDesde(E.stats.ganadas);
  if (n > E.nivel) {
    E.nivel = n;
    toast(`¡Nivel ${n}!`, 'logro'); sonLogro();
    for (const k in RAREZAS) if (RAREZAS[k].nivel === n) toast(`¡Rareza desbloqueada: ${RAREZAS[k].nombre}!`, 'logro');
    if (n === CONF.renacerNivel) toast('¡Ya puedes RENACER! Mira la pestaña Renacer de la tienda.', 'logro');
    if (E.tiendaAbierta) renderRenacer();
  }
}
function revisarLogros() {
  for (const l of LOGROS) {
    if (!E.logros.has(l.id) && CONDS[l.id] && CONDS[l.id]()) {
      E.logros.add(l.id);
      E.monedas += l.premio; E.stats.ganadas += l.premio; E.record = Math.max(E.record, E.monedas);
      toast(`¡Logro: ${l.nombre}! +${l.premio} monedas`, 'logro');
      sonLogro();
    }
  }
}

/* ---------- tienda: memes, mejoras, logros, renacer ---------- */
function renderMemes() {
  const c = $('#lista-memes'); c.innerHTML = '';
  for (const r in RAREZAS) {
    const grupo = MEMES.filter(m => m.rareza === r);
    if (!grupo.length) continue;
    c.insertAdjacentHTML('beforeend', `<div class="cab-grupo" style="--rc:${RAREZAS[r].color}">${RAREZAS[r].nombre}</div>`);
    for (const m of grupo) {
      const bloqueado = E.nivel < RAREZAS[r].nivel;
      const excl = m.reqRenacer && E.renacimientos < m.reqRenacer;
      const poseidos = bases[0].slots.filter(s => s.id === m.id).length;
      const precio = precioFinal(m);
      const sinDinero = E.monedas < precio;
      c.insertAdjacentHTML('beforeend', `
        <div class="tarjeta ${bloqueado || excl ? 'bloq' : ''}" style="--rc:${RAREZAS[r].color}">
          <div class="info">
            <b>${m.nombre}${poseidos ? ` <span class="veces">×${poseidos}</span>` : ''}</b>
            <small>${m.desc}</small>
            <div class="meta"><span class="ingreso">+${fmt(m.ingreso * CONF.multIngresos * renacerMult())}/s</span>
            ${excl ? `<span class="bloq-renacer">Renacer ×${m.reqRenacer}</span>`
              : bloqueado ? `<span class="bloq-nivel">Nivel ${RAREZAS[r].nivel}</span>` : ''}</div>
          </div>
          ${bloqueado || excl ? '' : `<button class="btn btn-comprar" data-id="${m.id}" ${sinDinero ? 'disabled' : ''}>${fmt(precio)}</button>`}
        </div>`);
    }
  }
}
function renderMejoras() {
  const c = $('#lista-mejoras'); c.innerHTML = '';
  for (const m of MEJORAS) {
    const nv = m.id === 'escudo' ? 0 : (E.mejoras[m.id] || 0);
    const alMax = m.max > 0 && nv >= m.max;
    const precio = precioMejora(m);
    const pips = m.max > 0 ? Array.from({ length: m.max }, (_, i) => `<i class="${i < nv ? 'on' : ''}"></i>`).join('') : '';
    c.insertAdjacentHTML('beforeend', `
      <div class="fila-mejora">
        <span class="ico-circulo"><svg class="ico"><use href="#${m.icono}"/></svg></span>
        <div class="info"><b>${m.nombre}</b><small>${m.desc}</small>${pips ? `<div class="pips">${pips}</div>` : ''}</div>
        <button class="btn btn-comprar" data-mejora="${m.id}" ${alMax || E.monedas < precio ? 'disabled' : ''}>${alMax ? 'MAX' : fmt(precio)}</button>
      </div>`);
  }
}
function renderLogros() {
  const c = $('#lista-logros'); c.innerHTML = '';
  for (const l of LOGROS) {
    const hecho = E.logros.has(l.id);
    c.insertAdjacentHTML('beforeend', `
      <div class="logro ${hecho ? 'hecho' : ''}">
        <svg class="ico"><use href="#i-estrella"/></svg>
        <div class="info"><b>${l.nombre}</b><small>${l.desc}</small></div>
        <span class="premio">${hecho ? 'Conseguido' : '+' + fmt(l.premio)}</span>
      </div>`);
  }
}
function renderRenacer() {
  const c = $('#lista-renacer');
  const n = E.renacimientos;
  const puede = E.nivel >= CONF.renacerNivel;
  const regalos = Math.min(n, 3);
  c.innerHTML = `
    <div class="renacer-caja">
      <small>Renacimientos</small>
      <div class="renacer-num">×${n}</div>
      <div class="renacer-sub">Rango <b>${rangoDe(n)}</b> · Ingresos <b>×${renacerMult().toFixed(2)}</b></div>
      <ul class="renacer-lista">
        <li>×${CONF.renacerBonus} de ingresos PERMANENTE por renacimiento (ahora ×${renacerMult().toFixed(2)})</li>
        <li>+${CONF.renacerMonedas} monedas de arranque (ahora ${fmt(monedasIniciales())})</li>
        <li>+1 pedestal cada 2 renacimientos (ahora ${capJugador()})</li>
        <li>Regalo de meme común al renacer (ya ${regalos}/3)</li>
        <li>Aura dorada visible · corona desde ×3 · halo divino desde ×5</li>
        <li>Exclusivos: Meme Dorado (×2) y DIOS DEL MEME (×5)</li>
      </ul>
      <button class="btn renacer-btn" id="btn-renacer" ${puede ? '' : 'disabled'}>
        ${puede ? '¡RENACER AHORA!' : `Necesitas nivel ${CONF.renacerNivel} (vas por el ${E.nivel})`}
      </button>
      <p class="renacer-nota">Pierdes memes, mejoras, nivel y monedas. Mantienes logros, récord y renacimientos.</p>
    </div>`;
  if (puede) c.querySelector('#btn-renacer').onclick = hacerRenacer;
}

/* ---------- RENACER ---------- */
async function hacerRenacer() {
  const next = 1 + CONF.renacerBonus * (E.renacimientos + 1);
  const ok = await preguntar('¿RENACER?',
    `Vuelves a empezar sin memes ni mejoras, pero tus ingresos pasan a ×${next.toFixed(2)} PARA SIEMPRE. ¿Lo haces?`,
    '¡Renacer!', 'Todavía no');
  if (!ok) return;
  E.renacimientos++;
  statFB('renacimientosTotales');
  E.monedas = monedasIniciales();
  E.nivel = 1;
  E.stats.ganadas = 0; E.stats.compras = 0;
  E.mejoras = { zapatos: 0, guante: 0, iman: 0, base: 0 };
  E.escudosComprados = 0;
  for (const s of bases[0].slots) { scene.remove(s.ped); quitarSprite(s.sprite); quitarMesh(s.mesh); }
  bases[0].slots.length = 0;
  const baratos = MEMES.filter(m => m.rareza === 'comun');
  for (let i = 0; i < Math.min(E.renacimientos, 3); i++) instalarMeme(bases[0], baratos[(Math.random() * baratos.length) | 0].id);
  evento = null; E.rebajas = false; proximoEvento = CONF.eventoCada * azar(.8, 1.2);
  jugador.pos.set(bases[0].x, 0, bases[0].z);
  jugador.llevando = null;
  decorarAvatar(jugador.grupo);
  sonRenacer();
  toast(`¡RENACISTE! Rango ${rangoDe(E.renacimientos)} · ingresos ×${renacerMult().toFixed(2)}`, 'logro');
  renderRenacer(); renderMemes(); renderMejoras(); renderLogros();
  guardarPartida();
}

/* ---------- Firebase por REST: Realtime Database (el mismo proyecto que la web) ---------- */
const FB = window.FIREBASE_CONFIG || {};
const fbListo = !!FB.databaseURL;
const RAIZ_FB = `${FB.databaseURL}/juegos/robameme`;
const SID = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
let statsFB = {};
function statFB(campo, n = 1) { if (fbListo) statsFB[campo] = (statsFB[campo] || 0) + n; }
async function subirStatsFB() {
  if (!fbListo || !Object.keys(statsFB).length) return;
  const copia = Object.assign({ t: Date.now(), sesiones: 1 }, statsFB);
  statsFB = {};
  try {
    await fetch(`${RAIZ_FB}/partidas/${SID}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(copia)
    });
  } catch (e) { /* sin conexión o sin reglas: se pierde en silencio */ }
}
setInterval(subirStatsFB, 20000);
addEventListener('beforeunload', subirStatsFB);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') subirStatsFB(); });
async function cargarConfigFB() {
  if (!fbListo) return;
  try {
    const r = await fetch(`${RAIZ_FB}/config.json`);
    if (r.ok) {
      const cam = await r.json() || {};
      for (const k in CONF) if (cam[k] !== undefined && !isNaN(+cam[k])) CONF[k] = +cam[k];
    }
    const r2 = await fetch(`${RAIZ_FB}/memes.json`);
    if (r2.ok) {
      const map = await r2.json() || {};
      for (const m of MEMES) {
        const v = map[m.id];
        if (!v) continue;
        if (v.precio !== undefined && !isNaN(+v.precio)) m.precio = +v.precio;
        if (v.ingreso !== undefined && !isNaN(+v.ingreso)) m.ingreso = +v.ingreso;
      }
    }
    if (E.tiendaAbierta) renderMemes();
    renderRenacer();
  } catch (e) { /* sin conexión: valores locales */ }
}

/* ---------- toasts y modal ---------- */
function toast(msg, tipo = '') {
  const cont = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + tipo; t.textContent = msg;
  cont.appendChild(t);
  while (cont.children.length > 4) cont.firstChild.remove();
  setTimeout(() => t.classList.add('fuera'), 2600);
  setTimeout(() => t.remove(), 3000);
}
let modalRes = null;
function preguntar(titulo, texto, si = 'Sí', no = 'No') {
  return new Promise(res => {
    $('#modal-titulo').textContent = titulo;
    $('#modal-texto').textContent = texto;
    $('#modal-si').textContent = si; $('#modal-no').textContent = no;
    $('#capa-modal').hidden = false; E.pausado = true; modalRes = res;
  });
}
function cerrarModal(v) {
  $('#capa-modal').hidden = true;
  if (!E.enMenu && $('#tutorial').hidden) E.pausado = false;
  if (modalRes) { modalRes(v); modalRes = null; }
}
$('#modal-si').onclick = () => cerrarModal(true);
$('#modal-no').onclick = () => cerrarModal(false);

/* ---------- tutorial ---------- */
const TUT = [
  { ico: 'i-zapato', t: '¡Bienvenido a Roba el Meme!', x: 'Muévete con WASD (o el joystick). Los memes que compres generan monedas solos, sobre sus pedestales.' },
  { ico: 'i-tienda', t: 'La tienda central', x: 'Pulsa T o el botón de la tienda para comprar memes. Pásate por tus pedestales para recoger las monedas con el imán.' },
  { ico: 'i-guante', t: 'Roba como un campeón', x: 'Acércate a la base de un bot y pulsa E (o ROBAR) para cargar su mejor meme… ¡y corre a tu base sin que te pillen!' },
  { ico: 'i-corona', t: 'Renace y domina', x: 'Al nivel 8 puedes RENACER: pierdes todo, pero tus ingresos suben ×1,3 para siempre, con aura dorada y rangos. ¡Suerte!' }
];
let tutIdx = 0;
function mostrarTut(i = 0) {
  tutIdx = i; const p = TUT[i];
  $('#tut-use').setAttribute('href', '#' + p.ico);
  $('#tut-titulo').textContent = p.t;
  $('#tut-texto').textContent = p.x;
  $('#tut-btn').textContent = i === TUT.length - 1 ? '¡A robar!' : 'Siguiente';
  $('#tutorial').hidden = false; E.pausado = true;
}
$('#tut-btn').onclick = () => {
  if (++tutIdx >= TUT.length) {
    $('#tutorial').hidden = true;
    E.vioTutorial = true; guardarPartida();
    if (!E.enMenu) E.pausado = false;
  } else mostrarTut(tutIdx);
};

/* ---------- compras ---------- */
function comprarMeme(id) {
  const m = defDe(id), b = bases[0];
  if (E.nivel < RAREZAS[m.rareza].nivel) return;
  if (m.reqRenacer && E.renacimientos < m.reqRenacer) return;
  if (b.slots.length >= capJugador()) { toast('¡Base llena! Compra Base XL en Mejoras o renacer.'); return; }
  const precio = precioFinal(m);
  if (E.monedas < precio) return;
  E.monedas -= precio; E.stats.compras++;
  statFB('comprasTotales');
  instalarMeme(b, id);
  sonCompra(); renderMemes(); guardarPartida();
}
function comprarMejora(id) {
  const m = MEJORAS.find(x => x.id === id);
  const precio = precioMejora(m);
  if (E.monedas < precio) return;
  if (id === 'escudo') {
    E.escudosComprados++;
    bases[0].escudoHasta = E.t + CONF.escudoDuracion;
    toast('¡Escudo activado! Tu base está protegida.', 'logro');
  } else {
    const nv = (E.mejoras[id] || 0) + 1;
    if (m.max > 0 && nv > m.max) return;
    E.mejoras[id] = nv;
  }
  E.monedas -= precio;
  sonCompra(); renderMejoras(); renderMemes(); guardarPartida();
}
$('#lista-memes').addEventListener('click', ev => {
  const b = ev.target.closest('[data-id]'); if (b) comprarMeme(b.dataset.id);
});
$('#lista-mejoras').addEventListener('click', ev => {
  const b = ev.target.closest('[data-mejora]'); if (b) comprarMejora(b.dataset.mejora);
});

/* ---------- tienda ---------- */
function abrirTienda() {
  E.tiendaAbierta = true;
  document.body.classList.add('tienda-abierta');
  firmaTienda = '';
  renderMemes(); renderMejoras(); renderLogros(); renderRenacer();
}
function cerrarTienda() {
  E.tiendaAbierta = false;
  document.body.classList.remove('tienda-abierta');
}
function alternarTienda() { E.tiendaAbierta ? cerrarTienda() : abrirTienda(); }
$('#btn-tienda').onclick = alternarTienda;
$('#cerrar-tienda').onclick = cerrarTienda;
document.querySelectorAll('.pestanya').forEach(p => p.onclick = () => {
  document.querySelectorAll('.pestanya').forEach(x => x.classList.remove('activa'));
  p.classList.add('activa');
  $('#lista-memes').classList.toggle('oculto', p.dataset.tab !== 'memes');
  $('#lista-mejoras').classList.toggle('oculto', p.dataset.tab !== 'mejoras');
  $('#lista-logros').classList.toggle('oculto', p.dataset.tab !== 'logros');
  $('#lista-renacer').classList.toggle('oculto', p.dataset.tab !== 'renacer');
});

/* ---------- controles ---------- */
const teclas = new Set();
addEventListener('keydown', ev => {
  /* escribiendo un código de regalo: las teclas no mueven al jugador */
  const tgt = ev.target;
  if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
  const k = ev.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) ev.preventDefault();
  if (ev.repeat) return;
  teclas.add(k);
  if (E.enMenu) return;
  if (k === 't') alternarTienda();
  if (k === 'escape') cerrarTienda();
  if (k === 'r') pedirReset();
  if (k === 'm') alternarSonido();
  if (k === 'e' || k === 'enter') intentarAccion();
});
addEventListener('keyup', ev => teclas.delete(ev.key.toLowerCase()));
addEventListener('blur', () => teclas.clear());

const esTacto = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (esTacto) document.body.classList.add('tacto');
else addEventListener('wheel', ev => { zoom = clamp(zoom + Math.sign(ev.deltaY) * .12, .55, 1.7); });

(() => {
  const base = $('#joy-base'), palo = $('#joy-palo');
  let idActivo = null;
  const mover = ev => {
    let t = ev;
    if (ev.changedTouches) {
      t = null;
      for (const c of ev.changedTouches) if (c.identifier === idActivo) t = c;
      if (!t) return;
    }
    const r = base.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
    const max = r.width / 2 - 10, d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    palo.style.transform = `translate(${dx}px,${dy}px)`;
    E.joy.x = dx / max; E.joy.y = dy / max;
  };
  const soltar = () => { idActivo = null; E.joy.x = E.joy.y = 0; palo.style.transform = 'translate(0,0)'; };
  base.addEventListener('touchstart', ev => { ev.preventDefault(); idActivo = ev.changedTouches[0].identifier; mover(ev); }, { passive: false });
  base.addEventListener('touchmove', ev => { ev.preventDefault(); mover(ev); }, { passive: false });
  base.addEventListener('touchend', soltar);
  base.addEventListener('touchcancel', soltar);
})();
$('#btn-accion').onclick = intentarAccion;

/* ---------- jugador ---------- */
function objetivoCercano() {
  if (jugador.llevando || E.pausado || E.enMenu) return null;
  for (let i = 1; i < 4; i++) {
    const b = bases[i];
    if (b.escudoHasta > E.t || !b.slots.length) continue;
    let mejor = -1, md = 2.4;
    b.slots.forEach((s, k) => {
      const d = Math.hypot(jugador.pos.x - s.mesh.position.x, jugador.pos.z - s.mesh.position.z);
      if (d < md) { md = d; mejor = k; }
    });
    if (mejor >= 0) return { base: b, idx: mejor, slot: b.slots[mejor] };
  }
  return null;
}
function intentarAccion() {
  if (E.pausado || E.enMenu) return;
  const obj = objetivoCercano();
  if (obj) agarrar(jugador, obj.base, obj.idx);
}
let tAvisoLlena = 0;
function actualizarJugador(dt) {
  if (jugador.stun > 0) jugador.stun -= dt;
  let vx = 0, vz = 0;
  if (teclas.has('w') || teclas.has('arrowup')) vz -= 1;
  if (teclas.has('s') || teclas.has('arrowdown')) vz += 1;
  if (teclas.has('a') || teclas.has('arrowleft')) vx -= 1;
  if (teclas.has('d') || teclas.has('arrowright')) vx += 1;
  vx += E.joy.x; vz += E.joy.y;
  const n = Math.hypot(vx, vz);
  const moviendo = n > .15 && jugador.stun <= 0;
  if (moviendo) {
    const vel = velJugador() * (MINI.turbo ? 2 : 1) * (jugador.llevando ? (1 - penalCarga()) : 1);
    jugador.pos.x += vx / n * vel * dt;
    jugador.pos.z += vz / n * vel * dt;
    resolverMuros(jugador.pos, .85);
    jugador.grupo.rotation.y = lerpAngle(jugador.grupo.rotation.y, Math.atan2(vx, vz), dt * 12);
  }
  jugador.grupo.position.set(jugador.pos.x, moviendo ? Math.abs(Math.sin(E.t * 11)) * .09 : 0, jugador.pos.z);
  if (jugador.llevando) {
    const b = bases[0];
    if (Math.hypot(jugador.pos.x - b.x, jugador.pos.z - b.z) < 8.6) {
      if (b.slots.length >= 14) {
        if (E.t > tAvisoLlena) { tAvisoLlena = E.t + 5; toast('¡Base llena! Vende o amplía antes.', 'mal'); }
      } else {
        const lv = jugador.llevando;
        jugador.grupo.remove(lv.mesh);
        instalarMeme(b, lv.id, lv.mesh);
        jugador.llevando = null;
        sonCompra();
        toast(`¡${nombreDe(lv.id)} trabaja para ti ahora!`, 'logro');
        guardarPartida();
      }
    }
  }
}

/* ---------- economía ---------- */
function fijarTexto(spr, txt, o = {}) {
  const cv = spr.material.map.image, g = cv.getContext('2d');
  g.clearRect(0, 0, cv.width, cv.height);
  const fondo = o.fondo !== undefined ? o.fondo : 'rgba(43,33,28,.82)';
  if (fondo) {
    g.fillStyle = fondo; rectondo(g, 8, 10, 240, 44, 18); g.fill();
    g.strokeStyle = 'rgba(255,246,227,.85)'; g.lineWidth = 3; rectondo(g, 8, 10, 240, 44, 18); g.stroke();
  }
  g.font = `800 ${o.tam || 30}px Nunito, Arial, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = o.color || '#ffd93b';
  g.fillText(txt, 128, 34, 232);
  spr.material.map.needsUpdate = true;
}
function actualizarEconomia(dt) {
  const me = multEvento();
  for (const b of bases) for (const s of b.slots) {
    s.acum += ingresoDe(s.id) * me * dt;
    s.tSpr -= dt;
    const v = Math.floor(s.acum);
    if (s.tSpr <= 0 && v !== s.mostrado) {
      s.mostrado = v; s.tSpr = .5;
      fijarTexto(s.sprite, v > 0 ? '+' + fmt(v) : '0');
    }
  }
  for (const s of bases[0].slots) {
    const d = Math.hypot(jugador.pos.x - s.mesh.position.x, jugador.pos.z - s.mesh.position.z);
    if (d < (MINI.imanX ? 14 : radioIman())) {
      const v = Math.floor(s.acum);
      if (v >= 1) {
        E.monedas += v; E.stats.ganadas += v; s.acum -= v;
        s.mostrado = -1; sonMoneda();
      }
    }
  }
  E.record = Math.max(E.record, E.monedas);
}

/* ---------- cámara y minimapa ---------- */
const tmpV = new THREE.Vector3();
function actualizarCamara(dt) {
  const d = 15 * zoom, alt = 13 * zoom;
  cam.position.lerp(tmpV.set(jugador.pos.x, alt, jugador.pos.z + d), 1 - Math.pow(.0001, dt));
  cam.lookAt(jugador.pos.x, 0, jugador.pos.z);
}
const mini = $('#minimapa').getContext('2d');
$('#minimapa').onclick = () => $('#minimapa').classList.toggle('chico');
function dibujarMinimapa() {
  const W = mini.canvas.width, S = W / 104;
  const px = x => (x + 52) * S, pz = z => (z + 52) * S;
  mini.fillStyle = '#6fae4f'; mini.fillRect(0, 0, W, W);
  mini.fillStyle = '#f0d9a8';
  mini.beginPath(); mini.arc(px(0), pz(0), 8.5 * S, 0, 7); mini.fill();
  for (const b of bases) {
    mini.fillStyle = b.css;
    mini.fillRect(px(b.x) - 9 * S, pz(b.z) - 9 * S, 18 * S, 18 * S);
    mini.fillStyle = '#fff6e3';
    for (const s of b.slots) mini.fillRect(px(s.mesh.position.x) - 1.5, pz(s.mesh.position.z) - 1.5, 3, 3);
    if (b.escudoHasta > E.t) {
      mini.strokeStyle = '#6ee7ff'; mini.lineWidth = 2.5;
      mini.strokeRect(px(b.x) - 10 * S, pz(b.z) - 10 * S, 20 * S, 20 * S);
    }
  }
  mini.fillStyle = '#2b211c';
  for (const bt of bots) { mini.beginPath(); mini.arc(px(bt.pos.x), pz(bt.pos.z), 3, 0, 7); mini.fill(); }
  mini.fillStyle = '#ffd93b';
  for (const c of monedasLluvia) { mini.beginPath(); mini.arc(px(c.mesh.position.x), pz(c.mesh.position.z), 2.2, 0, 7); mini.fill(); }
  mini.save();
  mini.translate(px(jugador.pos.x), pz(jugador.pos.z));
  mini.rotate(Math.PI - jugador.grupo.rotation.y);
  mini.fillStyle = '#ffffff'; mini.strokeStyle = '#2b211c'; mini.lineWidth = 2;
  mini.beginPath(); mini.moveTo(0, -6); mini.lineTo(4.5, 5); mini.lineTo(-4.5, 5); mini.closePath();
  mini.fill(); mini.stroke();
  mini.restore();
}

/* ---------- escudos, textos flotantes, HUD ---------- */
function actualizarEscudos() { for (const b of bases) b.domo.visible = b.escudoHasta > E.t; }
function actualizarFlotantes(dt) {
  for (let i = flotantes.length - 1; i >= 0; i--) {
    const f = flotantes[i];
    f.vida -= dt * .8;
    f.spr.position.y += dt * 1.4;
    f.spr.material.opacity = clamp(f.vida * 1.4, 0, 1);
    if (f.vida <= 0) { scene.remove(f.spr); quitarSprite(f.spr); flotantes.splice(i, 1); }
  }
}
let firmaTienda = '';
function actualizarHUD() {
  $('#hud-monedas').textContent = fmt(E.monedas);
  let ing = 0; for (const s of bases[0].slots) ing += ingresoDe(s.id);
  $('#hud-ingreso').textContent = '+' + fmt(ing * multEvento()) + '/s';
  $('#hud-nivel').textContent = 'Nivel ' + E.nivel;
  const g = E.stats.ganadas, a = Math.pow(E.nivel - 1, 2) * 120, b2 = Math.pow(E.nivel, 2) * 120;
  $('#hud-xp').style.width = clamp((g - a) / (b2 - a) * 100, 0, 100) + '%';
  const res = bases[0].escudoHasta - E.t;
  $('#hud-escudo').classList.toggle('oculto', res <= 0);
  if (res > 0) $('#hud-escudo-t').textContent = Math.ceil(res) + 's';
  const rc = $('#chip-rango');
  rc.classList.toggle('oculto', E.renacimientos <= 0);
  if (E.renacimientos > 0) $('#rango-nombre').textContent = rangoDe(E.renacimientos);
  if (evento) {
    $('#evento-nombre').textContent = NOMBRES_EVENTO[evento.tipo];
    $('#evento-tiempo').textContent = Math.ceil(evento.hasta - E.t) + 's';
    $('#chip-evento').classList.add('activo');
  } else {
    $('#evento-nombre').textContent = 'Próximo evento';
    $('#evento-tiempo').textContent = Math.ceil(proximoEvento) + 's';
    $('#chip-evento').classList.remove('activo');
  }
  const chip = $('#chip-accion');
  const obj = esTacto ? null : objetivoCercano();
  if (obj) {
    chip.classList.remove('oculto');
    chip.innerHTML = `ROBAR a ${nombreDe(obj.slot.id)} <b>E</b>`;
  } else chip.classList.add('oculto');
  if (E.tiendaAbierta) {
    $('#tienda-monedas').textContent = fmt(E.monedas);
    const f = MEMES.map(m => E.monedas >= precioFinal(m) && E.nivel >= RAREZAS[m.rareza].nivel && !(m.reqRenacer && E.renacimientos < m.reqRenacer) ? 1 : 0).join('')
      + '|' + MEJORAS.map(m => E.monedas >= precioMejora(m) ? 1 : 0).join('');
    if (f !== firmaTienda) { firmaTienda = f; renderMemes(); renderMejoras(); }
  }
}

/* ---------- menú principal ---------- */
function prepararMenu() {
  document.body.classList.add('en-menu');
  $('#menu-stats').innerHTML = `
    <div><small>Récord</small><b>${fmt(E.record)}</b></div>
    <div><small>Nivel</small><b>${E.nivel}</b></div>
    <div><small>Renacimientos</small><b>×${E.renacimientos}</b></div>
    <div><small>Logros</small><b>${E.logros.size}/${LOGROS.length}</b></div>`;
  $('#menu').hidden = false;
}
function empezarPartida() {
  document.body.classList.remove('en-menu');
  $('#menu').hidden = true;
  E.enMenu = false;
  if (!E.vioTutorial) mostrarTut(0);
  else E.pausado = false;
}
$('#btn-jugar').onclick = empezarPartida;
$('#btn-como').onclick = () => mostrarTut(0);

/* ---------- ganancias offline ---------- */
function cobrarOffline() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE));
    if (!d || !d.tGuardado) return;
    const seg = Math.min((Date.now() - d.tGuardado) / 1000, CONF.offlineHoras * 3600);
    if (seg < 60) return;
    let ing = 0; for (const s of bases[0].slots) ing += ingresoDe(s.id);
    const g = Math.floor(ing * seg * CONF.offlinePorc);
    if (g < 1) return;
    E.monedas += g; E.stats.ganadas += g; E.record = Math.max(E.record, E.monedas);
    E.stats.offline = (E.stats.offline || 0) + 1;
    const nota = $('#menu-offline');
    nota.textContent = `Mientras no estabas (${(seg / 3600).toFixed(1)} h), tus memes ganaron ${fmt(g)} monedas.`;
    nota.classList.remove('oculto');
  } catch (e) { }
}

/* ---------- guardado (v2 + migración desde v1) ---------- */
function guardarPartida() {
  if (window.__resetSolicitado) return;   /* no re-guardar tras un reinicio */
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      v: 2, monedas: E.monedas, nivel: E.nivel, renacimientos: E.renacimientos,
      record: E.record, vioTutorial: E.vioTutorial, stats: E.stats, mejoras: E.mejoras,
      escudos: E.escudosComprados, logros: [...E.logros],
      slots: bases[0].slots.map(s => s.id), tGuardado: Date.now()
    }));
  } catch (e) { }
}
function cargarPartida() {
  try {
    let d = JSON.parse(localStorage.getItem(CLAVE));
    if (!d) {
      const v1 = JSON.parse(localStorage.getItem(CLAVE_V1));
      if (v1) {
        d = { ...v1, renacimientos: 0, record: v1.monedas || 0 };
        localStorage.removeItem(CLAVE_V1);
      }
    }
    if (!d) { E.monedas = monedasIniciales(); return; }
    E.monedas = d.monedas || 0;
    E.nivel = d.nivel || 1;
    E.renacimientos = d.renacimientos || 0;
    E.record = d.record || d.monedas || 0;
    E.vioTutorial = !!d.vioTutorial;
    Object.assign(E.stats, d.stats || {});
    Object.assign(E.mejoras, d.mejoras || {});
    E.escudosComprados = d.escudos || 0;
    E.logros = new Set(d.logros || []);
    for (const id of d.slots || []) if (defDe(id) && bases[0].slots.length < 14) instalarMeme(bases[0], id);
  } catch (e) { }
}
async function pedirReset() {
  if (E.enMenu) return;
  const ok = await preguntar('¿Reiniciar todo?', 'Perderás tus monedas, memes, logros y RENACIMIENTOS. No hay vuelta atrás.', 'Borrar todo', 'Cancelar');
  if (ok) { window.__resetSolicitado = true; localStorage.removeItem(CLAVE); location.reload(); }
}
$('#btn-reset').onclick = pedirReset;
$('#btn-ayuda').onclick = () => mostrarTut(0);
function alternarSonido() {
  sonando = !sonando;
  $('#btn-sonido').classList.toggle('apagado', !sonando);
}
$('#btn-sonido').onclick = alternarSonido;

/* ---------- sembrar memes iniciales en bots ---------- */
function sembrarBots() {
  const baratos = MEMES.filter(m => m.rareza === 'comun' || m.rareza === 'raro');
  for (let i = 1; i < 4; i++) {
    const n = 2 + ((Math.random() * 2) | 0);
    for (let k = 0; k < n; k++) instalarMeme(bases[i], baratos[(Math.random() * baratos.length) | 0].id);
  }
}

/* ---------- bucle principal ---------- */
let ultimoT = performance.now(), tHUD = 0, tGuardado = 0, tMini = 0, angMenu = azar(0, 6);
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = clamp((ahora - ultimoT) / 1000, 0, .05);
  ultimoT = ahora;
  E.t += dt;
  if (!E.enMenu && !E.pausado) {
    actualizarJugador(dt);
    if (E.t >= MINI.hieloHasta) for (const bt of bots) actualizarBot(bt, dt);
    actualizarCapturas();
    actualizarEconomia(dt);
    actualizarEventos(dt);
    revisarNivel(); revisarLogros();
    tGuardado += dt;
    if (tGuardado > 6) { tGuardado = 0; guardarPartida(); }
  }
  for (const b of bases) for (const s of b.slots) if (s.mesh.userData.animar) s.mesh.userData.animar(E.t);
  if (jugador.llevando) jugador.llevando.mesh.rotation.y += dt * 2.5;
  actualizarEscudos();
  actualizarFlotantes(dt);
  if (E.enMenu) {
    angMenu += dt * .09;
    cam.position.set(Math.cos(angMenu) * 42, 27, Math.sin(angMenu) * 42);
    cam.lookAt(0, 0, 0);
  } else {
    actualizarCamara(dt);
    tHUD += dt; if (tHUD > .2) { tHUD = 0; actualizarHUD(); }
    tMini += dt; if (tMini > .12) { tMini = 0; dibujarMinimapa(); }
  }
  renderer.render(scene, cam);
}

/* ---------- init ---------- */
construirMundo();
crearEntidades();
sembrarBots();
cargarPartida();
cobrarOffline();
decorarAvatar(jugador.grupo);
statFB('sesiones');
cargarConfigFB();
addEventListener('beforeunload', guardarPartida);
document.addEventListener('visibilitychange', () => { if (document.hidden) guardarPartida(); });
cam.position.set(42, 27, 0);
cam.lookAt(0, 0, 0);
prepararMenu();
window.__juegoListo = true;          /* señal para el watchdog del index */
$('#cargando').remove();
requestAnimationFrame(t => { ultimoT = t; bucle(t); });

/* ---------- REGALOS DEL ADMIN (pestaña «Dar cosas» del panel) ----------
   El panel escribe regalos en juegos/robameme/regalos/<id> de la base de
   datos y aquí llegan solos, sin tocar nada del juego:
   · regalo «para todos»  → se aplica al momento (cada navegador recuerda
     en localStorage los que ya ha recibido, para no repetirlos);
   · regalo «con código»  → se consigue con el botón del regalo 🎁 del HUD
     o del menú escribiendo el código que dé el admin.                      */
const CLAVE_REGALOS = 'robameme-regalos';
function hechosDe() { try { return JSON.parse(localStorage.getItem(CLAVE_REGALOS)) || []; } catch (e) { return []; } }
function marcarHecho(id) { try { const h = hechosDe(); h.push(id); localStorage.setItem(CLAVE_REGALOS, JSON.stringify(h)); } catch (e) { } }

function aplicarRegalo(g) {
  /* devuelve { ok, texto } · ok=false sin texto = «aún no cabe, reintenta» */
  const partes = [];
  if (g.tipo === 'monedas') {
    const n = clamp(Math.round(+g.cantidad || 0), 1, 1000000);
    E.monedas += n; E.record = Math.max(E.record, E.monedas);
    partes.push('+' + fmt(n) + ' monedas');
  } else if (g.tipo === 'meme') {
    if (!MEMES.some(m => m.id === g.memeId)) return { ok: false, fatal: true };
    if (bases[0].slots.length >= capJugador()) return { ok: false };
    instalarMeme(bases[0], g.memeId); E.stats.compras++;
    partes.push(nombreDe(g.memeId) + ' en tu base');
  } else if (g.tipo === 'pack') {
    const pool = MEMES.filter(m => m.rareza === g.rareza && !(m.reqRenacer && E.renacimientos < m.reqRenacer));
    if (!pool.length) return { ok: false, fatal: true };
    const n = clamp(Math.round(+g.cantidad || 1), 1, 10);
    let puestos = 0;
    while (puestos < n && bases[0].slots.length < capJugador()) {
      instalarMeme(bases[0], pool[(Math.random() * pool.length) | 0].id);
      E.stats.compras++; puestos++;
    }
    if (!puestos) return { ok: false };
    partes.push(puestos + (puestos > 1 ? ' memes ' : ' meme ') +
      (RAREZAS[g.rareza] ? RAREZAS[g.rareza].nombre : '') + ' en tu base');
    if (puestos < n) partes.push('(' + (n - puestos) + ' no cabían)');
  } else if (g.tipo === 'mejora') {
    const m = MEJORAS.find(x => x.id === g.mejoraId && x.max > 0);
    if (!m) return { ok: false, fatal: true };
    const subir = clamp(Math.round(+g.cantidad || 1), 1, m.max);
    E.mejoras[m.id] = Math.min(m.max, (E.mejoras[m.id] || 0) + subir);
    partes.push(m.nombre + ' nivel ' + E.mejoras[m.id]);
    if (E.tiendaAbierta) renderMejoras();
  } else if (g.tipo === 'escudo') {
    const n = clamp(Math.round(+g.cantidad || 1), 1, 50);
    bases[0].escudoHasta = Math.max(bases[0].escudoHasta, E.t) + CONF.escudoDuracion * n;
    partes.push('escudo anti-robo ' + Math.round(CONF.escudoDuracion * n) + ' s');
  } else return { ok: false, fatal: true };
  actualizarHUD(); guardarPartida(); revisarLogros();
  return { ok: true, texto: partes.join(' · ') };
}

/* popup 🎁 con cola (si llegan varios regalos a la vez, van uno a uno) */
const colaRegalos = [];
function encolarRegalo(g, texto) {
  colaRegalos.push({ msj: g.mensaje || '', de: g.de || '', texto });
  if ($('#capa-regalo').hidden) siguienteRegalo();
}
function siguienteRegalo() {
  const x = colaRegalos.shift();
  if (!x) {
    $('#capa-regalo').hidden = true;
    if (!E.enMenu && $('#tutorial').hidden && $('#capa-modal').hidden && $('#capa-canjear').hidden) E.pausado = false;
    return;
  }
  $('#regalo-texto').textContent = x.texto;
  $('#regalo-msj').textContent = x.msj ? '«' + x.msj + '»' : '';
  $('#regalo-msj').hidden = !x.msj;
  $('#regalo-de').textContent = x.de ? '— de ' + x.de : '';
  $('#capa-regalo').hidden = false;
  E.pausado = true;
  sonLogro();
}
$('#regalo-btn').onclick = siguienteRegalo;

/* mirar cada poco si el admin ha dado algo (para todos) */
async function mirarRegalos() {
  if (!fbListo) return;
  try {
    const r = await fetch(`${RAIZ_FB}/regalos.json`);
    if (!r.ok) return;                     /* sin reglas o sin red: silencioso */
    const datos = await r.json() || {};
    const ahora = Date.now(), hechos = hechosDe();
    for (const id in datos) {
      const g = datos[id];
      if (!g || g.codigo || hechos.includes(id)) continue;
      if (g.expira && +g.expira < ahora) continue;
      const res = aplicarRegalo(g);
      if (!res.ok && !res.fatal) continue;  /* p. ej. base llena: reintenta luego */
      marcarHecho(id);
      if (res.ok) encolarRegalo(g, res.texto);
    }
  } catch (e) { /* sin conexión: se vuelve a intentar en la próxima pasada */ }
}
setInterval(mirarRegalos, 10000);
setTimeout(mirarRegalos, 3500);

/* canjear un código de regalo */
function abrirCanje() {
  $('#canjear-input').value = '';
  $('#capa-canjear').hidden = false;
  E.pausado = true;
  setTimeout(() => $('#canjear-input').focus(), 60);
}
function cerrarCanje() {
  $('#capa-canjear').hidden = true;
  if (!E.enMenu && $('#tutorial').hidden && $('#capa-modal').hidden && $('#capa-regalo').hidden) E.pausado = false;
}
$('#btn-regalo').onclick = abrirCanje;          /* botón 🎁 del HUD */
$('#btn-canjear-menu').onclick = abrirCanje;    /* botón del menú */
$('#canjear-no').onclick = cerrarCanje;
$('#canjear-input').addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') canjearCodigo();
  if (e.key === 'Escape') cerrarCanje();
});
async function canjearCodigo() {
  const cod = ($('#canjear-input').value || '').trim().toUpperCase();
  if (!cod) return;
  if (!fbListo) { toast('Sin conexión con la base de datos', 'mal'); return; }
  const btn = $('#canjear-si'); btn.disabled = true;
  try {
    const r = await fetch(`${RAIZ_FB}/regalos.json`);
    if (!r.ok) throw new Error('sin permiso o sin red');
    const datos = await r.json() || {};
    const ahora = Date.now();
    let g = null, id = '';
    for (const k in datos) {
      const gg = datos[k];
      if (gg && String(gg.codigo || '').toUpperCase() === cod) { g = gg; id = k; break; }
    }
    if (!g) { toast('Ese código no existe (revisa las letras)', 'mal'); return; }
    if (g.expira && +g.expira < ahora) { toast('Este código ya ha caducado', 'mal'); return; }
    if (hechosDe().includes(id)) { toast('Ya habías canjeado este código', 'mal'); return; }
    const res = aplicarRegalo(g);
    if (!res.ok) { toast('Tu base está llena: haz hueco y vuelve a probar', 'mal'); return; }
    marcarHecho(id);
    cerrarCanje();
    encolarRegalo(g, res.texto);
    toast('¡Código canjeado!', 'logro');
    /* contador de canjeos (best-effort, no pasa nada si falla) */
    try {
      await fetch(`${RAIZ_FB}/regalos/${id}/canjeados.json`,
        { method: 'PUT', body: JSON.stringify((+g.canjeados || 0) + 1) });
    } catch (e) { }
  } catch (e) {
    toast('No se pudo conectar: prueba otra vez', 'mal');
  } finally {
    btn.disabled = false;
  }
}
$('#canjear-si').onclick = canjearCodigo;

/* ---------- 👑 MINI ADMIN (botón de la corona: dar cosas y abusos) ----------
   El juego normal NO cambia: los poderes son solo marcas que están apagadas
   por defecto y que las funciones existentes consultan.
   Se desbloquea de dos maneras (la que llegue antes):
   · AUTOMÁTICO: sesión de la web abierta (Documents.com) y email en
     window.ADMINS (firebase-config.js) — se lee IndexedDB, sin cargar SDK;
   · CÓDIGO SECRETO: window.ADMIN_PIN (se recuerda en este navegador).      */
const MINI = {
  desbloqueado: false, porSesion: false, email: '',
  turbo: false, imanX: false, fantasma: false,
  hieloHasta: 0, caosHasta: 0, abusos: 0
};
const CLAVE_MINI = 'robameme-miniadmin';
window.__mini = MINI;   /* solo depuración */

/* mirar si en este navegador hay sesión de admin de la web (IndexedDB) */
function reconocerSesion() {
  return new Promise(res => {
    try {
      const r = indexedDB.open('firebaseLocalStorageDb');
      r.onsuccess = () => {
        const d = r.result;
        try {
          const q = d.transaction('firebaseLocalStorage', 'readonly')
            .objectStore('firebaseLocalStorage').getAll();
          q.onsuccess = () => {
            const adm = (window.ADMINS || []).map(x => String(x).toLowerCase());
            for (const rec of q.result || []) {
              const clave = String((rec && rec.fbase_key) || '');
              const email = String((rec && rec.value && rec.value.email) || '').toLowerCase();
              if (clave.indexOf('firebase:authUser:') === 0 && email && adm.includes(email)) {
                MINI.desbloqueado = true; MINI.porSesion = true; MINI.email = email;
                break;
              }
            }
            d.close(); res();
          };
          q.onerror = () => { d.close(); res(); };
        } catch (e) { d.close(); res(); }
      };
      r.onerror = () => res();
      r.onblocked = () => res();
    } catch (e) { res(); }
  });
}
try { if (localStorage.getItem(CLAVE_MINI) === '1') MINI.desbloqueado = true; } catch (e) { }
reconocerSesion().then(() => {
  if (MINI.desbloqueado && MINI.porSesion) toast('👑 Sesión de admin reconocida: ' + MINI.email, 'logro');
});

/* abrir: directo si está desbloqueado, y si no, pedir el código */
function abrirMini() {
  if (MINI.desbloqueado) { abrirPanelMini(); return; }
  $('#pin-input').value = '';
  $('#capa-pin').hidden = false;
  E.pausado = true;
  setTimeout(() => $('#pin-input').focus(), 60);
}
function cerrarPin() {
  $('#capa-pin').hidden = true;
  if (!E.enMenu && $('#tutorial').hidden && $('#capa-modal').hidden && $('#capa-regalo').hidden && $('#capa-canjear').hidden) E.pausado = false;
}
function probarPin() {
  const v = ($('#pin-input').value || '').trim();
  if (v && v === String(window.ADMIN_PIN || '')) {
    MINI.desbloqueado = true; MINI.porSesion = false;
    try { localStorage.setItem(CLAVE_MINI, '1'); } catch (e) { }
    $('#capa-pin').hidden = true;
    abrirPanelMini();
    toast('👑 Mini admin desbloqueado', 'logro'); sonLogro();
  } else {
    toast('Código equivocado', 'mal');
    $('#pin-input').value = '';
    setTimeout(() => $('#pin-input').focus(), 60);
  }
}
$('#pin-input').addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') probarPin();
  if (e.key === 'Escape') cerrarPin();
});
$('#pin-si').onclick = probarPin;
$('#pin-no').onclick = cerrarPin;

/* el panel en sí */
function abrirPanelMini() {
  $('#adm-quien').textContent = MINI.porSesion
    ? '👑 Sesión de la web: ' + MINI.email
    : '👑 Desbloqueado con el código secreto (recordado en este navegador)';
  pintarMini();
  $('#capa-admin').hidden = false;
  E.pausado = true;
}
function cerrarPanelMini() {
  $('#capa-admin').hidden = true;
  if (!E.enMenu && $('#tutorial').hidden && $('#capa-modal').hidden && $('#capa-regalo').hidden && $('#capa-canjear').hidden && $('#capa-pin').hidden) E.pausado = false;
}
$('#btn-admin').onclick = abrirMini;
$('#cerrar-admin').onclick = cerrarPanelMini;
$('#adm-bloquear').onclick = () => {
  MINI.desbloqueado = false; MINI.porSesion = false; MINI.email = '';
  MINI.turbo = MINI.imanX = MINI.fantasma = false;
  try { localStorage.removeItem(CLAVE_MINI); } catch (e) { }
  cerrarPanelMini();
  toast('Candado cerrado: mini admin bloqueado');
};
function pintarMini() {
  document.querySelectorAll('#capa-admin .poder').forEach(b => {
    const id = b.dataset.abuso;
    const on = id === 'turbo' ? MINI.turbo : id === 'iman' ? MINI.imanX : id === 'fantasma' ? MINI.fantasma : false;
    if (!b.dataset.txt) b.dataset.txt = b.textContent.trim();
    b.textContent = b.dataset.txt + (on ? ' · ON' : '');
    b.classList.toggle('encendido', on);
  });
  $('#adm-contador').textContent = MINI.abusos + (MINI.abusos === 1 ? ' abuso' : ' abusos');
}

/* los abusos */
function darMonedas(n) {
  E.monedas += n;
  E.record = Math.max(E.record, E.monedas);
}
function abuso(id) {
  if (!MINI.desbloqueado) return;
  let msg = '';
  switch (id) {
    case 'mon100': darMonedas(100); msg = '+100 monedas'; break;
    case 'mon1k': darMonedas(1000); msg = '+1.000 monedas'; break;
    case 'mon10k': darMonedas(10000); msg = '+10.000 monedas'; break;
    case 'doble': {
      const n = Math.max(0, Math.floor(E.monedas));
      darMonedas(n); msg = 'pasta duplicada (+' + fmt(n) + ')';
      break;
    }
    case 'meme': {
      const rz = ($('#adm-rareza') || {}).value || 'epico';
      const pool = MEMES.filter(m => m.rareza === rz);
      if (!pool.length) { toast('Esa rareza no existe', 'mal'); return; }
      if (bases[0].slots.length >= capJugador()) { toast('Tu base está llena: haz hueco primero', 'mal'); return; }
      const m = pool[(Math.random() * pool.length) | 0];
      instalarMeme(bases[0], m.id); E.stats.compras++;
      msg = nombreDe(m.id) + ' (' + RAREZAS[rz].nombre + ') en tu base';
      break;
    }
    case 'mejoras':
      for (const m of MEJORAS) if (m.max > 0) E.mejoras[m.id] = m.max;
      if (E.tiendaAbierta) renderMejoras();
      msg = 'todas las mejoras al máximo';
      break;
    case 'escudo5':
      bases[0].escudoHasta = Math.max(bases[0].escudoHasta, E.t) + 300;
      msg = 'escudo anti-robo 5 min';
      break;
    case 'escudo60':
      bases[0].escudoHasta = Math.max(bases[0].escudoHasta, E.t) + 3600;
      msg = 'escudo anti-robo 1 hora';
      break;
    case 'turbo':
      MINI.turbo = !MINI.turbo;
      msg = 'turbo ×2 ' + (MINI.turbo ? 'ACTIVADO' : 'apagado');
      break;
    case 'iman':
      MINI.imanX = !MINI.imanX;
      msg = 'imán gigante ' + (MINI.imanX ? 'ACTIVADO' : 'apagado');
      break;
    case 'fantasma':
      MINI.fantasma = !MINI.fantasma;
      msg = MINI.fantasma ? 'modo fantasma: los bots no pueden robarte' : 'fantasma apagado';
      break;
    case 'hielo':
      MINI.hieloHasta = E.t + 30;
      msg = 'bots congelados 30 s';
      break;
    case 'caos':
      MINI.caosHasta = E.t + 60;
      for (const bt of bots) bt.tEsperaRobo = 0;
      msg = '¡CAOS TOTAL! Los bots han perdido el miedo';
      break;
    case 'evento':
      if (evento) { evento.hasta = E.t + CONF.eventoDuracion; msg = 'evento alargado'; }
      else { lanzarEvento(); msg = ''; }
      break;
    case 'centro':
      jugador.pos.set(0, 0, 14);
      jugador.grupo.position.copy(jugador.pos);
      msg = 'teletransporte al centro';
      break;
    case 'impuesto': {
      let total = 0;
      for (const bt of bots) {
        const mitad = Math.floor(bt.monedas / 2);
        if (mitad > 0) { bt.monedas -= mitad; total += mitad; }
      }
      if (total > 0) darMonedas(total);
      msg = 'impuesto real cobrado: +' + fmt(total) + ' monedas';
      break;
    }
    case 'xp':
      E.stats.ganadas += 500;
      revisarNivel();
      msg = '+500 XP';
      break;
    default: return;
  }
  MINI.abusos++;
  if (msg) toast('👑 ' + msg, 'logro');
  beep(990, .07, 'square', .09, 260);
  pintarMini();
  actualizarHUD();
  guardarPartida();
}
document.querySelectorAll('#capa-admin [data-abuso]').forEach(b => {
  b.addEventListener('click', e => {
    if (e.target && e.target.tagName === 'SELECT') return;   /* elegir rareza no dispara el botón */
    abuso(b.dataset.abuso);
  });
});
