/* =========================================================
   ¡ROBA EL MEME! 3D — game.js
   Motor Three.js: mundo 3D, jugador, bots con IA, economía,
   robos con transporte, escudos, eventos, logros, tutorial y
   guardado en localStorage. Español 100%.
   ========================================================= */
(() => {
'use strict';

/* ---------- Captura de errores para depuración ---------- */
window.__errores = [];
window.addEventListener('error', e => { window.__errores.push(String(e.message)); });

/* ---------- Guardas básicas ---------- */
const $ = s => document.querySelector(s);
if (!window.THREE) {
  const err = $('#error-webgl');
  err.classList.remove('oculto');
  err.querySelector('p').textContent = 'No se pudo cargar el motor 3D (lib/three.min.js). Vuelve a descargar la carpeta completa del juego.';
  $('#cargando').classList.add('oculto');
  return;
}
const D = window.DATOS;

/* ---------- Utilidades ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const dist2D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const fmt = n => {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + 'MM';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.', ',') + 'k';
  return n.toLocaleString('es-ES');
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defPorId = id => D.MEMES.find(m => m.id === id);

function aleatorioPonderado(items, pesoDe) {
  const total = items.reduce((t, it) => t + pesoDe(it), 0);
  let r = Math.random() * total;
  for (const it of items) { r -= pesoDe(it); if (r <= 0) return it; }
  return items[items.length - 1];
}

/* ---------- Audio (WebAudio generado, sin archivos) ---------- */
let ctxAudio = null;
function tono(f, dur, tipo = 'square', vol = .12, retardo = 0) {
  if (!E.sonido) return;
  try {
    ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
    if (ctxAudio.state === 'suspended') ctxAudio.resume();
    const t0 = ctxAudio.currentTime + retardo;
    const o = ctxAudio.createOscillator(), g = ctxAudio.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + .012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctxAudio.destination);
    o.start(t0); o.stop(t0 + dur + .05);
  } catch (e) { /* audio no disponible */ }
}
const Sonidos = {
  moneda: () => { tono(920, .07, 'square', .07); tono(1420, .1, 'square', .06, .06); },
  compra: () => { tono(523, .09, 'triangle', .13); tono(659, .1, 'triangle', .12, .08); tono(880, .14, 'triangle', .11, .16); },
  robo:   () => { tono(330, .1, 'sawtooth', .09); tono(220, .16, 'sawtooth', .09, .09); tono(440, .1, 'sawtooth', .07, .2); },
  error:  () => { tono(170, .16, 'square', .11); tono(120, .2, 'square', .1, .1); },
  logro:  () => { [523, 659, 784, 1046].forEach((f, i) => tono(f, .15, 'triangle', .12, i * .1)); },
  escudo: () => { tono(320, .28, 'sine', .15); tono(512, .22, 'sine', .11, .1); },
  evento: () => { tono(880, .09, 'square', .1); tono(880, .09, 'square', .1, .14); tono(1175, .16, 'square', .1, .28); },
  nivel:  () => { tono(392, .12, 'triangle', .12); tono(523, .12, 'triangle', .12, .1); tono(784, .2, 'triangle', .12, .2); }
};

/* ---------- Toasts ---------- */
const contToasts = $('#toasts');
function toast(txt, tipo = 'info') {
  const el = document.createElement('div');
  el.className = 'toast toast-' + tipo;
  const icono = tipo === 'logro' ? 'i-trofeo' : tipo === 'error' ? 'i-x' : tipo === 'exito' ? 'i-check' : 'i-info';
  el.innerHTML = `<svg class="ico" viewBox="0 0 24 24"><use href="#${icono}"/></svg><span>${esc(txt)}</span>`;
  contToasts.appendChild(el);
  while (contToasts.children.length > 4) contToasts.firstChild.remove();
  setTimeout(() => { el.classList.add('toast-sale'); setTimeout(() => el.remove(), 380); }, 3200);
}

/* ---------- Anuncio grande de evento ---------- */
let tAnuncio = null;
function anuncio(titulo, sub) {
  const el = $('#anuncio');
  $('#anuncio-titulo').textContent = titulo;
  $('#anuncio-sub').textContent = sub || '';
  el.classList.add('visible');
  clearTimeout(tAnuncio);
  tAnuncio = setTimeout(() => el.classList.remove('visible'), 4200);
}

/* ---------- Modal genérico ---------- */
const modalFondo = $('#modal-fondo'), modalEl = $('#modal');
function abrirModal({ titulo, html = '', botones = [], alCerrar = null }) {
  modalEl.innerHTML = `<h2>${esc(titulo)}</h2>${html}<div class="botones-modal" id="modal-botones"></div>`;
  const cont = modalEl.querySelector('#modal-botones');
  botones.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn-modal ' + (b.clase || '');
    btn.textContent = b.texto;
    btn.addEventListener('click', () => { if (b.accion) b.accion(); if (!b.mantener) cerrarModal(); });
    cont.appendChild(btn);
  });
  modalFondo.classList.remove('oculto');
  modalEl._alCerrar = alCerrar;
}
function cerrarModal() {
  modalFondo.classList.add('oculto');
  if (modalEl._alCerrar) { modalEl._alCerrar(); modalEl._alCerrar = null; }
}
modalFondo.addEventListener('click', e => { if (e.target === modalFondo) cerrarModal(); });

/* ---------- Estado del juego ---------- */
const CLAVE = 'robaElMeme3D';
const E = {
  monedas: 150, pot: 0,
  nivel: 1, xp: 0,
  nombre: 'Jugador',
  sonido: true, sombras: true,
  tutorialHecho: false,
  mejoras: { zapato: 0, guante: 0, iman: 0, escudo: 0, expandir: 0 },
  stats: { compras: 0, robos: 0, robosSufridos: 0, recuperaciones: 0, monedasTotales: 0, escudosUsados: 0, dorados: 0 },
  logros: [],
  memesDistintos: [],
  evento: { tipo: null, tFin: 0, tProximo: 75 },
  escudo: { activo: false, tFin: 0, tDisp: 0, cdDur: 42 },
  cfgEco: {}
};
let puedeGuardar = true;
try { localStorage.setItem('__prueba', '1'); localStorage.removeItem('__prueba'); }
catch (e) { puedeGuardar = false; setTimeout(() => toast('Tu navegador bloquea el guardado local.', 'error'), 2500); }

function snapshotGuardado() {
  return {
    v: 2,
    monedas: Math.floor(E.monedas), pot: E.pot,
    nivel: E.nivel, xp: Math.round(E.xp),
    nombre: E.nombre, sonido: E.sonido, sombras: E.sombras,
    tutorialHecho: E.tutorialHecho,
    mejoras: { ...E.mejoras },
    stats: { ...E.stats },
    logros: [...E.logros],
    memesDistintos: [...E.memesDistintos],
    memes: baseJugador ? baseJugador.memesInstalados.map(m => ({ id: m.def.id, slot: m.slotIdx, dorado: !!m.dorado })) : [],
    bots: bots.map(b => ({
      monedas: Math.floor(b.monedas),
      memes: b.base.memesInstalados.map(m => ({ id: m.def.id, slot: m.slotIdx }))
    }))
  };
}
let sucio = false;
function marcarSucio() { sucio = true; }
function guardar() {
  if (!puedeGuardar) return;
  try { localStorage.setItem(CLAVE, JSON.stringify(snapshotGuardado())); sucio = false; }
  catch (e) { /* cuota llena: se ignora */ }
}
setInterval(() => { if (sucio) guardar(); }, 5000);
window.addEventListener('beforeunload', guardar);

function cargarGuardado() {
  if (!puedeGuardar) return null;
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const g = JSON.parse(crudo);
    if (!g || g.v !== 2) return null;
    E.monedas = g.monedas ?? 150; E.pot = g.pot ?? 0;
    E.nivel = g.nivel ?? 1; E.xp = g.xp ?? 0;
    E.nombre = (g.nombre || 'Jugador').slice(0, 16);
    E.sonido = g.sonido !== false; E.sombras = g.sombras !== false;
    E.tutorialHecho = !!g.tutorialHecho;
    Object.assign(E.mejoras, g.mejoras || {});
    Object.assign(E.stats, g.stats || {});
    E.logros = Array.isArray(g.logros) ? g.logros : [];
    E.memesDistintos = Array.isArray(g.memesDistintos) ? g.memesDistintos : [];
    return g;
  } catch (e) { return null; }
}

/* Economía con overrides del panel admin (local o nube) */
function precioDe(def) {
  const p = (E.cfgEco.precios && E.cfgEco.precios[def.id] != null) ? E.cfgEco.precios[def.id] : def.precio;
  return Math.max(1, Math.round(p * (E.cfgEco.mult || 1)));
}
function ipsDe(def) {
  const v = (E.cfgEco.ips && E.cfgEco.ips[def.id] != null) ? E.cfgEco.ips[def.id] : def.ips;
  return v * (E.cfgEco.multIps || 1);
}
function costeMejora(m) { return Math.round(m.base * Math.pow(m.mult, E.mejoras[m.id])); }
function xpNecesaria(n) { return Math.round(120 + (n - 1) * 90 + Math.pow(n - 1, 1.8) * 14); }
function multNivel() { return 1 + (E.nivel - 1) * 0.03; }
function velocidadTurbo() { return E.evento.tipo === 'turbo' ? 1.6 : 1; }

/* =========================================================
   ESCENA 3D
   ========================================================= */
const lienzo = $('#juego');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
} catch (e) { renderer = null; }
if (!renderer || !renderer.getContext()) {
  $('#error-webgl').classList.remove('oculto');
  $('#cargando').classList.add('oculto');
  return;
}
const esMovil = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, esMovil ? 1.8 : 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const escena = new THREE.Scene();
escena.background = new THREE.Color(0x7ec8f2);
escena.fog = new THREE.Fog(0x7ec8f2, 95, 210);

const camara = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
camara.position.set(0, 18, 40);

const luzAmb = new THREE.HemisphereLight(0xfff2cf, 0x3a5a3a, 0.8);
escena.add(luzAmb);
const luzSol = new THREE.DirectionalLight(0xfff4d6, 0.95);
luzSol.position.set(38, 60, 22);
luzSol.castShadow = true;
luzSol.shadow.mapSize.set(esMovil ? 1024 : 2048, esMovil ? 1024 : 2048);
luzSol.shadow.camera.left = -70; luzSol.shadow.camera.right = 70;
luzSol.shadow.camera.top = 70; luzSol.shadow.camera.bottom = -70;
luzSol.shadow.camera.far = 200;
luzSol.shadow.bias = -0.0004;
escena.add(luzSol);

window.addEventListener('resize', () => {
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
});

/* ---------- Kit de materiales toon (cel-shading) ---------- */
const formatoGrad = renderer.capabilities.isWebGL2 ? THREE.RedFormat : THREE.LuminanceFormat;
const gradiente = new THREE.DataTexture(new Uint8Array([90, 180, 255]), 3, 1, formatoGrad);
gradiente.minFilter = THREE.NearestFilter; gradiente.magFilter = THREE.NearestFilter;
gradiente.needsUpdate = true;
const _cacheToon = new Map();
function toonMat(color, op) {
  if (op !== undefined) {
    return new THREE.MeshToonMaterial({ color, gradientMap: gradiente, transparent: true, opacity: op });
  }
  let m = _cacheToon.get(color);
  if (!m) { m = new THREE.MeshToonMaterial({ color, gradientMap: gradiente }); _cacheToon.set(color, m); }
  return m;
}
const matContorno = new THREE.MeshBasicMaterial({ color: 0x2b211c, side: THREE.BackSide });

/* geometrías unitarias compartidas */
const G = {
  caja: new THREE.BoxGeometry(1, 1, 1),
  bola: new THREE.SphereGeometry(0.5, 18, 14),
  cono: new THREE.ConeGeometry(0.5, 1, 16),
  cil: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  toro: new THREE.TorusGeometry(0.5, 0.16, 10, 24)
};
function pieza(forma, color, tam, pos, rot, op) {
  const m = new THREE.Mesh(G[forma], toonMat(color, op));
  m.scale.set(tam[0], tam[1], tam[2]);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true;
  return m;
}
function contorno(m, factor = 1.08) {
  const c = new THREE.Mesh(m.geometry, matContorno);
  c.scale.copy(m.scale).multiplyScalar(factor);
  c.position.copy(m.position); c.rotation.copy(m.rotation);
  return c;
}
function oscurecer(color, f) {
  return new THREE.Color(color).multiplyScalar(f).getHex();
}

/* ---------- Sprites de texto (lienzos → texturas) ---------- */
function rectRedondo(x, X, Y, W, H, R) {
  x.beginPath();
  x.moveTo(X + R, Y);
  x.arcTo(X + W, Y, X + W, Y + H, R);
  x.arcTo(X + W, Y + H, X, Y + H, R);
  x.arcTo(X, Y + H, X, Y, R);
  x.arcTo(X, Y, X + W, Y, R);
  x.closePath();
}
const _fuente = (tam) => `900 ${tam}px "Lilita One","Nunito",system-ui,sans-serif`;
function spriteTexto(texto, opciones = {}) {
  const { tam = 30, color = '#fff', fondo = 'rgba(43,33,28,.85)', alto = 0.62, borde = null } = opciones;
  const c = document.createElement('canvas');
  let x = c.getContext('2d');
  x.font = _fuente(tam);
  const ancho = Math.max(10, Math.ceil(x.measureText(String(texto)).width)) + 30;
  c.width = ancho; c.height = tam + 26;
  x = c.getContext('2d');
  x.font = _fuente(tam);
  if (fondo) {
    x.fillStyle = fondo;
    rectRedondo(x, 1, 1, c.width - 2, c.height - 2, 14); x.fill();
    if (borde) { x.strokeStyle = borde; x.lineWidth = 5; x.stroke(); }
  }
  x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(String(texto), c.width / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  const esc = alto / c.height;
  spr.scale.set(c.width * esc, alto, 1);
  return spr;
}
/* etiqueta de la tienda central: nombre + moneda + precio */
function spriteEtiquetaTienda(def, precio, dorado) {
  const rz = D.RAREZAS[def.rareza];
  const c = document.createElement('canvas');
  c.width = 300; c.height = 118;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(43,33,28,.88)';
  rectRedondo(x, 2, 2, 296, 114, 18); x.fill();
  x.strokeStyle = '#' + rz.color.toString(16).padStart(6, '0'); x.lineWidth = 7; x.stroke();
  x.fillStyle = dorado ? '#ffd54f' : '#fff';
  x.font = _fuente(30); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(def.nombre, 150, 34);
  // moneda
  x.beginPath(); x.arc(96, 80, 20, 0, Math.PI * 2);
  x.fillStyle = '#ffc93c'; x.fill(); x.lineWidth = 4; x.strokeStyle = '#2b211c'; x.stroke();
  x.beginPath(); x.arc(96, 80, 11, 0, Math.PI * 2);
  x.strokeStyle = '#c79323'; x.lineWidth = 4; x.stroke();
  x.fillStyle = '#fff';
  x.font = _fuente(40);
  x.fillText(fmt(precio), 172, 82);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  spr.scale.set(2.6, 1.02, 1);
  return spr;
}

/* textura de cara para los personajes (cabeza cuadrada) */
const _cacheCaras = new Map();
function texturaCara(colorHex, estilo) {
  const clave = colorHex + '_' + estilo;
  if (_cacheCaras.has(clave)) return _cacheCaras.get(clave);
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  const css = '#' + colorHex.toString(16).padStart(6, '0');
  x.fillStyle = css; x.fillRect(0, 0, 128, 128);
  const tinta = '#2b211c';
  const dibujarOjo = (cx, pupilaDy, pupilaColor = tinta) => {
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(cx, 54, 15, 0, Math.PI * 2); x.fill();
    x.lineWidth = 4; x.strokeStyle = tinta; x.stroke();
    x.fillStyle = pupilaColor;
    x.beginPath(); x.arc(cx, 54 + pupilaDy, 7, 0, Math.PI * 2); x.fill();
  };
  if (estilo === 'dormido') {
    x.strokeStyle = tinta; x.lineWidth = 7; x.lineCap = 'round';
    [[42], [86]].forEach(([cx]) => { x.beginPath(); x.moveTo(cx - 12, 54); x.lineTo(cx + 12, 54); x.stroke(); });
  } else if (estilo === 'feliz') {
    x.strokeStyle = tinta; x.lineWidth = 7; x.lineCap = 'round';
    [[42], [86]].forEach(([cx]) => { x.beginPath(); x.arc(cx, 58, 12, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); });
  } else if (estilo === 'enojado') {
    dibujarOjo(42, 2); dibujarOjo(86, 2);
    x.strokeStyle = tinta; x.lineWidth = 7; x.lineCap = 'round';
    x.beginPath(); x.moveTo(28, 34); x.lineTo(54, 42); x.stroke();
    x.beginPath(); x.moveTo(100, 34); x.lineTo(74, 42); x.stroke();
  } else {
    dibujarOjo(42, 0); dibujarOjo(86, 0);
  }
  // boca
  x.strokeStyle = tinta; x.lineWidth = 6; x.lineCap = 'round';
  if (estilo === 'enojado') { x.beginPath(); x.moveTo(48, 92); x.quadraticCurveTo(64, 84, 80, 92); x.stroke(); }
  else if (estilo === 'feliz') { x.beginPath(); x.arc(64, 84, 17, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke(); }
  else { x.beginPath(); x.arc(64, 82, 15, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  _cacheCaras.set(clave, tex);
  return tex;
}

/* ---------- Personajes (muñecos estilo bloques, 100% originales) ---------- */
G.toroArco = new THREE.TorusGeometry(0.5, 0.18, 10, 16, Math.PI);

function crearPersonaje({ color = 0xe2574c, cara = 'normal', nombre = '', gorra = null } = {}) {
  const g = new THREE.Group();
  const ud = {};
  const pant = oscurecer(color, 0.55);
  // piernas (pivote arriba para balancear)
  const geoPierna = new THREE.BoxGeometry(0.3, 0.56, 0.3); geoPierna.translate(0, -0.28, 0);
  const matPant = toonMat(pant);
  ud.piernaI = new THREE.Mesh(geoPierna, matPant); ud.piernaI.position.set(-0.19, 0.56, 0);
  ud.piernaD = new THREE.Mesh(geoPierna, matPant); ud.piernaD.position.set(0.19, 0.56, 0);
  // brazos
  const geoBrazo = new THREE.BoxGeometry(0.24, 0.6, 0.24); geoBrazo.translate(0, -0.3, 0);
  const matColor = toonMat(color);
  ud.brazoI = new THREE.Mesh(geoBrazo, matColor); ud.brazoI.position.set(-0.55, 1.22, 0);
  ud.brazoD = new THREE.Mesh(geoBrazo, matColor); ud.brazoD.position.set(0.55, 1.22, 0);
  // torso
  ud.torso = pieza('caja', color, [0.82, 0.74, 0.5], [0, 0.93, 0]);
  const contTorso = contorno(ud.torso, 1.06);
  // cabeza con cara pintada en la cara frontal (+z)
  const matLado = toonMat(color);
  const matCara = new THREE.MeshToonMaterial({ map: texturaCara(color, cara), gradientMap: gradiente });
  ud.cabeza = new THREE.Mesh(G.caja, [matLado, matLado, matLado, matLado, matCara, matLado]);
  ud.cabeza.scale.set(0.78, 0.72, 0.78); ud.cabeza.position.y = 1.66;
  const contCabeza = new THREE.Mesh(G.caja, matContorno);
  contCabeza.scale.set(0.83, 0.77, 0.83); contCabeza.position.y = 1.66;
  // gorra opcional (el jugador lleva gorra amarilla)
  if (gorra) {
    const copa = pieza('caja', gorra, [0.8, 0.24, 0.8], [0, 2.06, 0]);
    const visera = pieza('caja', gorra, [0.7, 0.1, 0.42], [0, 2.0, 0.52]);
    g.add(copa, visera);
  }
  [ud.piernaI, ud.piernaD, ud.brazoI, ud.brazoD, ud.torso, ud.cabeza].forEach(m => { m.castShadow = true; });
  g.add(ud.piernaI, ud.piernaD, contTorso, ud.torso, ud.brazoI, ud.brazoD, contCabeza, ud.cabeza);
  // etiqueta de nombre flotante
  if (nombre) {
    const et = spriteTexto(nombre, { tam: 30, alto: 0.48, color: '#fff' });
    et.position.y = 2.5; et.material.depthTest = false; et.renderOrder = 8;
    ud.etiqueta = et; g.add(et);
  }
  g.userData = ud;
  return g;
}
function animarPersonaje(g, t, intensidad) {
  const ud = g.userData;
  if (!ud || !ud.piernaI) return;
  const k = clamp(intensidad, 0, 1.4);
  const sw = Math.sin(t * 9) * 0.62 * k;
  ud.piernaI.rotation.x = sw; ud.piernaD.rotation.x = -sw;
  ud.brazoI.rotation.x = -sw * 0.85; ud.brazoD.rotation.x = sw * 0.85;
  ud.cabeza.position.y = 1.66 + Math.abs(Math.sin(t * 9)) * 0.045 * k + Math.sin(t * 2.2) * 0.012;
}

/* ---------- Constructor de memes a partir de la receta ---------- */
function frenteDe(cuerpo) {
  if (cuerpo.forma === 'cono') return cuerpo.tam[2] * 0.34;
  return cuerpo.tam[2] / 2;
}
function construirMeme(def, escala = 1) {
  const r = def.receta;
  const g = new THREE.Group();
  // cuerpo
  const cuerpo = pieza(r.cuerpo.forma === 'ovo' ? 'bola' : r.cuerpo.forma, r.cuerpo.color, r.cuerpo.tam, [0, r.cuerpo.tam[1] / 2, 0], r.cuerpo.rot, r.cuerpo.op);
  if (r.cuerpo.forma === 'ovo') cuerpo.scale.y *= 1.18;
  g.add(contorno(cuerpo, 1.09));
  g.add(cuerpo);
  const hCuerpo = r.cuerpo.tam[1] * (r.cuerpo.forma === 'ovo' ? 1.18 : 1);
  const frenteZ = frenteDe(r.cuerpo) * (r.cuerpo.forma === 'ovo' ? 1 : 1);
  const tinta = 0x2b211c;

  // ojos
  if (r.ojos) {
    const o = r.ojos, y = o.y, sep = o.sep || 0, er = o.r || 0.12;
    const lados = sep === 0 ? [0] : [-1, 1];
    lados.forEach(s => {
      const px = sep * s;
      if (o.estilo === 'dormido') {
        g.add(pieza('caja', tinta, [er * 1.9, er * 0.18, er * 0.5], [px, y, frenteZ * 0.9]));
      } else if (o.estilo === 'feliz') {
        const a = pieza('toroArco', tinta, [er * 1.5, er * 1.5, er * 0.9], [px, y + er * 0.3, frenteZ * 0.88]);
        g.add(a);
      } else if (o.estilo === 'robot') {
        g.add(pieza('caja', 0xffffff, [er * 1.8, er * 1.8, er * 0.6], [px, y, frenteZ * 0.86]));
        g.add(pieza('caja', 0xe2574c, [er * 0.8, er * 0.8, er * 0.3], [px, y, frenteZ * 0.92]));
      } else {
        const blanco = pieza('bola', 0xffffff, [er * 2, er * 2, er * 1.2], [px, y, frenteZ * 0.86]);
        g.add(blanco);
        const pupilas = o.estilo === 'estrella' ? 0xffc93c : tinta;
        const dy = o.estilo === 'triste' ? er * 0.45 : 0;
        g.add(pieza('bola', pupilas, [er, er, er * 0.55], [px, y - dy, frenteZ * 0.97]));
        if (o.estilo === 'enojado') {
          g.add(pieza('caja', tinta, [er * 1.6, er * 0.22, er * 0.3], [px, y + er * 1.5, frenteZ * 0.8], [0, 0, s * -0.45]));
        }
      }
    });
  }
  // boca
  if (r.boca) {
    const b = r.boca, by = b.y;
    switch (b.estilo) {
      case 'sonrisa':
        g.add(pieza('toroArco', tinta, [0.42, 0.42, 0.26], [0, by, frenteZ * 0.9], [0, 0, Math.PI]));
        break;
      case 'triste':
        g.add(pieza('toroArco', tinta, [0.42, 0.42, 0.26], [0, by + 0.1, frenteZ * 0.9]));
        break;
      case 'grande':
        g.add(pieza('toroArco', tinta, [0.62, 0.62, 0.3], [0, by, frenteZ * 0.92], [0, 0, Math.PI]));
        break;
      case 'abierta':
        g.add(pieza('bola', tinta, [0.3, 0.24, 0.12], [0, by, frenteZ * 0.92]));
        break;
      case 'lengua':
        g.add(pieza('bola', tinta, [0.3, 0.22, 0.12], [0, by, frenteZ * 0.92]));
        g.add(pieza('bola', 0xf48fb1, [0.18, 0.13, 0.09], [0, by - 0.1, frenteZ * 0.96]));
        break;
      case 'o':
        g.add(pieza('bola', tinta, [0.16, 0.2, 0.1], [0, by, frenteZ * 0.92]));
        break;
      default: // serio
        g.add(pieza('caja', tinta, [0.34, 0.06, 0.08], [0, by, frenteZ * 0.92]));
    }
  }
  // mejillas
  if (r.mejillas && r.ojos) {
    const sep = (r.ojos.sep || 0.2) + 0.16;
    [-1, 1].forEach(s => {
      g.add(pieza('bola', 0xf8a5c2, [0.17, 0.13, 0.09], [sep * s, (r.ojos.y || 0.4) - 0.16, frenteZ * 0.8]));
    });
  }
  // extras sueltos
  (r.extras || []).forEach(e => {
    const p = pieza(e.forma, e.color, e.tam, e.pos, e.rot, e.op);
    if (e.forma !== 'toro' && e.op === undefined) g.add(contorno(p, 1.12));
    g.add(p);
  });
  // chispas para legendario+
  if (['legendario', 'mitico', 'secreto'].includes(def.rareza)) {
    const chis = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(G.bola, new THREE.MeshBasicMaterial({ color: 0xfff8d6 }));
      s.scale.setScalar(0.1 + Math.random() * 0.07);
      s.position.set(Math.cos(i * Math.PI / 2) * 1.0, rand(0.25, hCuerpo + 0.5), Math.sin(i * Math.PI / 2) * 1.0);
      chis.add(s);
    }
    g.userData.chispas = chis;
    g.add(chis);
  }
  g.userData.def = def;
  g.scale.setScalar(escala);
  g.userData.fase = rand(0, Math.PI * 2);
  return g;
}
/* caparazón dorado para el evento Meme Dorado */
function dorarMeme(grupo) {
  if (grupo.userData.dorado) return;
  const s = new THREE.Mesh(G.bola, new THREE.MeshBasicMaterial({
    color: 0xffc93c, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  s.scale.setScalar(1.4); s.position.y = 0.75;
  grupo.add(s);
  grupo.userData.dorado = s;
}

/* =========================================================
   MUNDO
   ========================================================= */
const ARENA = { x: 50, z: 36 };
const DEF_BASES_POS = [
  { x: 0, z: 26, color: 0x3ec6b8, nombre: 'TU BASE', esJugador: true },
  { x: -36, z: -8, color: 0xe2574c, nombre: 'BASE DE BRUNO' },
  { x: 36, z: -8, color: 0x9b59d0, nombre: 'BASE DE VERO' },
  { x: 0, z: -27, color: 0xf39c33, nombre: 'BASE DE NILO' }
];

/* suelo */
{
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(170, 130), toonMat(0x58b368));
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  escena.add(suelo);
  // parches de hierba más oscura
  for (let i = 0; i < 16; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(rand(7, 18), rand(6, 14)), toonMat(0x4fa75e));
    p.rotation.x = -Math.PI / 2; p.rotation.z = rand(0, Math.PI);
    p.position.set(rand(-70, 70), 0.02, rand(-50, 50));
    p.receiveShadow = true;
    escena.add(p);
  }
}
/* vallas perimetrales */
{
  const matValla = toonMat(0xe8d9b5), matBola = toonMat(0xffc93c);
  const tramos = [
    { tam: [100.5, 1.1, 0.7], pos: [0, 0.55, 36.2] }, { tam: [100.5, 1.1, 0.7], pos: [0, 0.55, -36.2] },
    { tam: [0.7, 1.1, 72.5], pos: [50.2, 0.55, 0] }, { tam: [0.7, 1.1, 72.5], pos: [-50.2, 0.55, 0] }
  ];
  tramos.forEach(t => {
    const m = new THREE.Mesh(G.caja, matValla);
    m.scale.set(t.tam[0], t.tam[1], t.tam[2]); m.position.set(t.pos[0], t.pos[1], t.pos[2]);
    m.castShadow = true; escena.add(m);
    const n = Math.floor((t.tam[0] > t.tam[2] ? t.tam[0] : t.tam[2]) / 8);
    for (let i = 0; i <= n; i++) {
      const b = new THREE.Mesh(G.bola, matBola);
      b.scale.setScalar(0.42);
      const f = -0.5 + i / n;
      b.position.set(t.pos[0] + (t.tam[0] > 1 ? f * t.tam[0] : 0), 1.2, t.pos[2] + (t.tam[2] > 1 ? f * t.tam[2] : 0));
      escena.add(b);
    }
  });
}
/* decoración: árboles, rocas y matorrales */
{
  const dentroDeZona = (x, z) => Math.abs(x) < 53 && Math.abs(z) < 39;
  let puestos = 0, intentos = 0;
  while (puestos < 14 && intentos < 300) {
    intentos++;
    const x = rand(-72, 72), z = rand(-55, 55);
    if (dentroDeZona(x, z)) continue;
    const arbol = new THREE.Group();
    const tronco = pieza('cil', 0x8a6a43, [0.8, 2.2, 0.8], [0, 1.1, 0]);
    arbol.add(tronco);
    if (Math.random() < 0.5) {
      arbol.add(pieza('bola', Math.random() < .5 ? 0x4caf50 : 0x66bb6a, [3.4, 2.9, 3.4], [0, 3.4, 0]));
    } else {
      arbol.add(pieza('cono', 0x43a047, [3.1, 3.8, 3.1], [0, 3.6, 0]));
      arbol.add(pieza('cono', 0x4caf50, [2.3, 2.8, 2.3], [0, 4.6, 0]));
    }
    arbol.position.set(x, 0, z);
    escena.add(arbol);
    puestos++;
  }
  for (let i = 0; i < 8; i++) {
    const x = rand(-70, 70), z = rand(-52, 52);
    if (dentroDeZona(x, z)) continue;
    const roca = pieza('bola', 0xb0a08c, [rand(1.2, 2.4), rand(0.8, 1.4), rand(1.2, 2.2)], [x, 0.4, z]);
    escena.add(roca);
  }
  // matorrales dentro de la arena, lejos de bases y centro
  const libreDeBases = (x, z) => {
    if (Math.hypot(x, z) < 14) return false;
    return DEF_BASES_POS.every(b => Math.abs(x - b.x) > 13 || Math.abs(z - b.z) > 10);
  };
  let arbustos = 0; intentos = 0;
  while (arbustos < 10 && intentos < 300) {
    intentos++;
    const x = rand(-47, 47), z = rand(-33, 33);
    if (!libreDeBases(x, z)) continue;
    const m = pieza('bola', Math.random() < .5 ? 0x3e9142 : 0x57b14b, [rand(1.1, 1.7), rand(0.8, 1.2), rand(1.1, 1.7)], [x, 0.4, z]);
    escena.add(m);
    arbustos++;
  }
}
/* nubes flotantes */
const nubes = [];
for (let i = 0; i < 8; i++) {
  const n = new THREE.Group();
  const matNube = toonMat(0xffffff, 0.95);
  for (let j = 0; j < 3; j++) {
    const b = new THREE.Mesh(G.bola, matNube);
    b.scale.set(rand(3, 4.6), rand(1.4, 2), rand(2, 3));
    b.position.set(j * rand(1.6, 2.4) - 2, rand(-0.4, 0.4), rand(-0.8, 0.8));
    n.add(b);
  }
  n.position.set(rand(-80, 80), rand(24, 34), rand(-55, 55));
  n.userData.vel = rand(0.4, 1.1);
  nubes.push(n);
  escena.add(n);
}

/* ---------- Bases ---------- */
const POS_SLOTS = [];
for (let fila = 0; fila < 4; fila++) {
  for (let col = 0; col < 6; col++) {
    POS_SLOTS.push({ x: -5 + col * 2, z: -2.85 + fila * 1.9 });
  }
}
const bases = [];
let baseJugador = null;

function altoEn(x, z) {
  for (const b of bases) {
    if (Math.abs(x - b.def.x) <= 11 && Math.abs(z - b.def.z) <= 7.5) return 0.8;
  }
  if (Math.hypot(x, z) <= 9.2) return 0.6;
  return 0;
}

function construirBase(def, cap) {
  const grupo = new THREE.Group();
  grupo.position.set(def.x, 0, def.z);
  // plataforma
  const plat = new THREE.Mesh(G.caja, toonMat(def.color));
  plat.scale.set(22, 0.8, 15); plat.position.y = 0.4;
  plat.receiveShadow = true;
  grupo.add(plat);
  // canto superior
  const canto = new THREE.Mesh(G.caja, toonMat(oscurecer(def.color, 0.75)));
  canto.scale.set(22.5, 0.22, 15.5); canto.position.y = 0.83;
  grupo.add(canto);
  // postes de esquina
  [[-10.4, -7], [10.4, -7], [-10.4, 7], [10.4, 7]].forEach(([px, pz]) => {
    grupo.add(pieza('caja', oscurecer(def.color, 0.6), [0.5, 1.7, 0.5], [px, 0.85, pz]));
    grupo.add(pieza('bola', 0xffc93c, [0.55, 0.55, 0.55], [px, 1.8, pz]));
  });
  // letrero flotante
  const letrero = spriteTexto(def.nombre, { tam: 34, alto: 1.05, color: '#fff', borde: '#2b211c' });
  letrero.position.set(0, 3.1, 0);
  letrero.material.depthTest = false; letrero.renderOrder = 7;
  grupo.add(letrero);
  // domo de escudo
  const domo = new THREE.Mesh(
    new THREE.SphereGeometry(10.9, 26, 13, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false })
  );
  domo.position.y = 0.8; domo.visible = false;
  grupo.add(domo);
  escena.add(grupo);
  const base = { def, grupo, slots: [], memesInstalados: [], domo, escudoActivo: false, escudoFin: 0 };
  fijarSlots(base, cap);
  bases.push(base);
  if (def.esJugador) baseJugador = base;
  return base;
}
function fijarSlots(base, cap) {
  // elimina marcadores actuales
  base.grupo.children.slice().forEach(h => { if (h.userData.esMarcador) base.grupo.remove(h); });
  base.slots = POS_SLOTS.slice(0, cap).map(p => ({ ...p, libre: true }));
  base.slots.forEach(s => {
    const mar = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.72, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
    );
    mar.rotation.x = -Math.PI / 2;
    mar.position.set(s.x, 0.84, s.z);
    mar.userData.esMarcador = true;
    base.grupo.add(mar);
  });
  // conserva los huecos ocupados por memes ya instalados
  base.memesInstalados.forEach(m => { if (base.slots[m.slotIdx]) base.slots[m.slotIdx].libre = false; });
}
function capSlotsJugador() { return 12 + E.mejoras.expandir * 4; }

/* ---------- Colocación de memes en bases ---------- */
function colocarMeme(base, def, opciones = {}) {
  const { slotIdx = -1, dorado = false, grupoExistente = null } = opciones;
  let idx = slotIdx;
  if (idx < 0 || !base.slots[idx] || !base.slots[idx].libre) idx = base.slots.findIndex(s => s.libre);
  if (idx < 0) return null;
  const grupo = grupoExistente || construirMeme(def, 0.8);
  if (grupo.parent) grupo.parent.remove(grupo);
  base.grupo.add(grupo);
  grupo.position.set(base.slots[idx].x, 0.8, base.slots[idx].z);
  grupo.rotation.set(0, rand(-0.5, 0.5), 0);
  base.slots[idx].libre = false;
  if (dorado) dorarMeme(grupo);
  const inst = { def, grupo, slotIdx: idx, dorado, base, fase: rand(0, 6.28) };
  base.memesInstalados.push(inst);
  return inst;
}
function quitarMemeInstalado(inst) {
  const base = inst.base;
  base.memesInstalados = base.memesInstalados.filter(m => m !== inst);
  if (base.slots[inst.slotIdx]) base.slots[inst.slotIdx].libre = true;
  if (inst.grupo.parent) inst.grupo.parent.remove(inst.grupo);
}
function destruirMeme(inst) {
  quitarMemeInstalado(inst);
  inst.grupo.traverse(o => {
    if (o.isSprite) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
  });
}
function activarEscudo(base, duracion) {
  base.escudoActivo = true;
  base.escudoFin = tJuego + duracion;
  base.domo.visible = true;
}
function actualizarEscudosBase(dt) {
  bases.forEach(b => {
    if (b.escudoActivo) {
      if (tJuego >= b.escudoFin) { b.escudoActivo = false; b.domo.visible = false; }
      else {
        b.domo.scale.setScalar(1 + Math.sin(tJuego * 4) * 0.015);
        const queda = b.escudoFin - tJuego;
        b.domo.material.opacity = queda < 2 ? 0.12 + Math.abs(Math.sin(tJuego * 8)) * 0.16 : 0.26;
      }
    }
  });
}

/* ---------- Zona central de memes (tienda) ---------- */
const CENTRO = { radio: 9.2 };
const pedestales = [];
const memesTienda = [];
{
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.6, 0.6, 36), toonMat(0xe6b422));
  plat.position.y = 0.3; plat.receiveShadow = true;
  escena.add(plat);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(9.2, 0.35, 10, 40), toonMat(0xc98f1e));
  aro.rotation.x = Math.PI / 2; aro.position.y = 0.62;
  escena.add(aro);
  for (let i = 0; i < 5; i++) {
    const a = i * (Math.PI * 2 / 5) + Math.PI / 10;
    const px = Math.cos(a) * 5.8, pz = Math.sin(a) * 5.8;
    const p = new THREE.Group();
    p.add(pieza('cil', 0xfafafa, [2.0, 0.35, 2.0], [0, 0.775, 0]));
    p.add(pieza('cil', 0xffedc7, [1.15, 1.15, 1.15], [0, 1.525, 0]));
    p.add(pieza('cil', 0xe2574c, [1.5, 0.18, 1.5], [0, 2.19, 0]));
    p.position.set(px, 0, pz);
    escena.add(p);
    pedestales.push({ x: px, z: pz, posTop: new THREE.Vector3(px, 2.28, pz), item: null });
  }
  const cartel = spriteTexto('ZONA DE MEMES', { tam: 40, alto: 1.1, color: '#fff', fondo: 'rgba(43,33,28,.8)', borde: '#ffc93c' });
  cartel.position.set(0, 6.4, 0);
  cartel.material.depthTest = false; cartel.renderOrder = 7;
  escena.add(cartel);
}
function precioTienda(item) {
  return Math.max(1, Math.round(precioDe(item.def) * (E.evento.tipo === 'rebajas' && !item.dorado ? 0.5 : 1)));
}
function refrescarEtiqueta(item) {
  if (item.etiqueta) {
    escena.remove(item.etiqueta);
    item.etiqueta.material.map.dispose(); item.etiqueta.material.dispose();
  }
  item.etiqueta = spriteEtiquetaTienda(item.def, precioTienda(item), item.dorado);
  item.etiqueta.position.copy(item.pos).y += item.flotante ? 2.6 : 1.9;
  escena.add(item.etiqueta);
}
function aparecerEnTienda(def, dorado = false) {
  let pedestal = null;
  if (dorado) {
    pedestal = null;
  } else {
    pedestal = pedestales.find(p => !p.item);
    if (!pedestal) return null;
  }
  const grupo = construirMeme(def, 1.05);
  const item = {
    def, grupo, pedestal, dorado,
    flotante: dorado,
    pos: dorado ? new THREE.Vector3(0, 1.7, 0) : pedestal.posTop.clone()
  };
  grupo.position.copy(item.pos);
  escena.add(grupo);
  pedestal && (pedestal.item = item);
  memesTienda.push(item);
  refrescarEtiqueta(item);
  return item;
}
function quitarDeTienda(item) {
  const i = memesTienda.indexOf(item);
  if (i >= 0) memesTienda.splice(i, 1);
  if (item.pedestal) item.pedestal.item = null;
  escena.remove(item.grupo);
  if (item.etiqueta) {
    escena.remove(item.etiqueta);
    item.etiqueta.material.map.dispose(); item.etiqueta.material.dispose();
  }
}
function elegirDefTienda() {
  for (let intento = 0; intento < 8; intento++) {
    const def = aleatorioPonderado(D.MEMES, m => D.RAREZAS[m.rareza].peso);
    if (!memesTienda.some(it => it.def.id === def.id)) return def;
  }
  return aleatorioPonderado(D.MEMES, m => D.RAREZAS[m.rareza].peso);
}
let tSpawnTienda = 6;
function actualizarTienda(dt) {
  tSpawnTienda -= dt;
  const normales = memesTienda.filter(it => !it.dorado).length;
  if (tSpawnTienda <= 0 && normales < 5 && pedestales.some(p => !p.item)) {
    aparecerEnTienda(elegirDefTienda());
    tSpawnTienda = rand(16, 26);
  }
}

/* ---------- Partículas (monedas y confeti) ---------- */
const particulas = [];
const texMoneda = (() => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  x.beginPath(); x.arc(32, 32, 28, 0, Math.PI * 2);
  x.fillStyle = '#ffc93c'; x.fill(); x.lineWidth = 6; x.strokeStyle = '#2b211c'; x.stroke();
  x.beginPath(); x.arc(32, 32, 15, 0, Math.PI * 2);
  x.lineWidth = 5; x.strokeStyle = '#c79323'; x.stroke();
  return new THREE.CanvasTexture(c);
})();
const matSpriteMoneda = new THREE.SpriteMaterial({ map: texMoneda, transparent: true });
const _matsConfeti = new Map();
function matConfeti(color) {
  if (!_matsConfeti.has(color)) _matsConfeti.set(color, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  return _matsConfeti.get(color);
}
function spawnMonedas(pos, n = 8) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(matSpriteMoneda);
    s.position.set(pos.x + rand(-0.8, 0.8), pos.y + 1.2, pos.z + rand(-0.8, 0.8));
    s.scale.setScalar(rand(0.4, 0.6));
    particulas.push({
      obj: s, t: rand(0.8, 1.2), dur: 1.2, esSprite: true,
      vx: rand(-1.4, 1.4), vy: rand(4.5, 6.5), vz: rand(-1.4, 1.4)
    });
    escena.add(s);
  }
}
function spawnConfeti(pos, n = 16) {
  const colores = [0xe2574c, 0xffc93c, 0x57b14b, 0x4d9de0, 0x9b59d0];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(G.caja, matConfeti(colores[i % colores.length]));
    m.scale.set(0.24, 0.24, 0.06);
    m.position.set(pos.x + rand(-0.6, 0.6), pos.y + 1.4, pos.z + rand(-0.6, 0.6));
    particulas.push({
      obj: m, t: rand(0.9, 1.5), dur: 1.5, esSprite: false,
      vx: rand(-2.4, 2.4), vy: rand(3.5, 6), vz: rand(-2.4, 2.4),
      rx: rand(-6, 6), rz: rand(-6, 6)
    });
    escena.add(m);
  }
}
function lluviaSobreBase(base, n = 26) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(matSpriteMoneda);
    s.scale.setScalar(rand(0.45, 0.65));
    s.position.set(base.def.x + rand(-8, 8), rand(7, 13), base.def.z + rand(-5.5, 5.5));
    particulas.push({ obj: s, t: rand(1.6, 2.6), dur: 2.6, esSprite: true, vx: 0, vy: rand(-5.5, -4), vz: 0, llueve: true });
    escena.add(s);
  }
}
function actualizarParticulas(dt) {
  for (let i = particulas.length - 1; i >= 0; i--) {
    const p = particulas[i];
    p.t -= dt;
    if (p.t <= 0) { escena.remove(p.obj); particulas.splice(i, 1); continue; }
    if (!p.llueve) p.vy -= 10 * dt;
    p.obj.position.x += p.vx * dt;
    p.obj.position.y += p.vy * dt;
    p.obj.position.z += p.vz * dt;
    if (p.llueve && p.obj.position.y < 1) { p.obj.position.y = 1; p.vy = 0; }
    if (!p.esSprite) { p.obj.rotation.x += p.rx * dt; p.obj.rotation.z += p.rz * dt; }
    const k = clamp(p.t / 0.4, 0, 1);
    p.obj.scale.setScalar((p.esSprite ? 0.55 : 0.24) * k);
  }
}

/* =========================================================
   JUGADOR
   ========================================================= */
let tJuego = 0;
let tUltimaRecogida = 0;
const huecoLibre = base => base.slots.some(s => s.libre);
function registrarMemeDistinto(id) {
  if (!E.memesDistintos.includes(id)) { E.memesDistintos.push(id); marcarSucio(); }
}

const jugador = {
  grupo: crearPersonaje({ color: 0xffb300, cara: 'feliz', nombre: 'TÚ', gorra: 0xe2574c }),
  pos: new THREE.Vector3(0, 0, 26),
  yVisual: 0.8,
  cargando: null,
  aturdido: 0,
  animInt: 0
};
escena.add(jugador.grupo);
jugador.grupo.position.set(0, 0.8, 26);
jugador.grupo.rotation.y = Math.PI; // mirando al centro

/* colisión con pedestales centrales */
function evitarPedestales(pos) {
  for (const p of pedestales) {
    const dx = pos.x - p.x, dz = pos.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 1.8 && d > 0.0001) {
      const f = (1.8 - d) / d;
      pos.x += dx * f; pos.z += dz * f;
    }
  }
}

/* ---------- Entrada: teclado ---------- */
const teclas = {};
const MAPA_TECLAS = {
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
  ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd'
};
window.addEventListener('keydown', e => {
  const t = MAPA_TECLAS[e.code];
  if (t) { teclas[t] = true; e.preventDefault(); }
  if (e.repeat) return;
  switch (e.code) {
    case 'KeyE': ejecutarAccion(); break;
    case 'KeyR': activarEscudoJugador(); break;
    case 'KeyT': alternarTienda(); break;
    case 'KeyM': alternarSonido(); break;
    case 'Escape':
      cerrarTiendaUI();
      cerrarModal();
      if (window.Admin) window.Admin.cerrar();
      break;
  }
});
window.addEventListener('keyup', e => {
  const t = MAPA_TECLAS[e.code];
  if (t) teclas[t] = false;
});

/* ---------- Entrada: joystick táctil ---------- */
const joy = { activo: false, dx: 0, dy: 0, id: null, ox: 0, oy: 0 };
{
  const zona = $('#zona-movil'), joyBase = $('#joy-base'), palanca = $('#joy-palanca');
  const alTocar = e => {
    const t = e.changedTouches[0];
    joy.id = t.identifier; joy.activo = true;
    joy.ox = t.clientX; joy.oy = t.clientY; joy.dx = 0; joy.dy = 0;
    joyBase.classList.remove('oculto');
    joyBase.style.left = (t.clientX - 62) + 'px';
    joyBase.style.top = (t.clientY - 62) + 'px';
    e.preventDefault();
  };
  const alMover = e => {
    for (const t of e.changedTouches) {
      if (t.identifier !== joy.id) continue;
      let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy;
      const d = Math.hypot(dx, dy);
      if (d > 48) { dx = dx / d * 48; dy = dy / d * 48; }
      joy.dx = dx / 48; joy.dy = dy / 48;
      palanca.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
    e.preventDefault();
  };
  const alSoltar = e => {
    for (const t of e.changedTouches) {
      if (t.identifier !== joy.id) continue;
      joy.activo = false; joy.dx = 0; joy.dy = 0; joy.id = null;
      joyBase.classList.add('oculto');
      palanca.style.transform = 'translate(-50%,-50%)';
    }
  };
  zona.addEventListener('touchstart', alTocar, { passive: false });
  zona.addEventListener('touchmove', alMover, { passive: false });
  zona.addEventListener('touchend', alSoltar);
  zona.addEventListener('touchcancel', alSoltar);
  document.addEventListener('contextmenu', e => { if (e.target === lienzo) e.preventDefault(); });
}

/* ---------- Acción contextual (botón E) ---------- */
let accionActual = null;
function calcularAccion() {
  if (jugador.cargando) return { tipo: 'llevar' };
  if (jugador.aturdido > 0) return null;
  for (const it of memesTienda) {
    if (dist2D(jugador.pos, it.pos) < 2.9) return { tipo: 'comprar', it };
  }
  for (const b of bases) {
    if (b === baseJugador) continue;
    for (const inst of b.memesInstalados) {
      const posMeme = { x: b.def.x + b.slots[inst.slotIdx].x, z: b.def.z + b.slots[inst.slotIdx].z };
      if (dist2D(jugador.pos, posMeme) < 2.4) {
        if (b.escudoActivo) return { tipo: 'bloqueado' };
        const bot = bots.find(bt => bt.base === b);
        if (bot && dist2D(bot.pos, posMeme) < 3.8) return { tipo: 'vigilado' };
        if (!huecoLibre(baseJugador)) return { tipo: 'llena' };
        return { tipo: 'robar', inst };
      }
    }
  }
  if (E.pot >= 1 && dist2D(jugador.pos, baseJugador.def) < 5.5 + E.mejoras.iman * 1.5) return { tipo: 'recoger' };
  return null;
}
function ejecutarAccion() {
  const a = accionActual || calcularAccion();
  if (!a) { return; }
  switch (a.tipo) {
    case 'comprar': comprarItem(a.it); break;
    case 'robar': robarMeme(a.inst); break;
    case 'recoger': recogerPot(); break;
    case 'llevar': toast('¡Corre a TU BASE (turquesa) para guardarlo!', 'info'); break;
    case 'bloqueado': Sonidos.error(); toast('¡La base está protegida por su escudo!', 'error'); break;
    case 'vigilado': Sonidos.error(); toast('¡El dueño está vigilando! Espera a que se aleje…', 'error'); break;
    case 'llena': Sonidos.error(); toast('¡Tu base está llena! Amplíala o vende un meme (T).', 'error'); break;
  }
}

/* ---------- Comprar en la zona central ---------- */
function comprarItem(it) {
  const precio = precioTienda(it);
  if (E.monedas < precio) { Sonidos.error(); toast(`Te faltan monedas para ${it.def.nombre} (${fmt(precio)}).`, 'error'); return; }
  if (!huecoLibre(baseJugador)) { Sonidos.error(); toast('¡Tu base está llena! Vende un meme o amplía la base (T).', 'error'); return; }
  E.monedas -= precio;
  quitarDeTienda(it);
  colocarMeme(baseJugador, it.def, { dorado: it.dorado });
  spawnConfeti({ x: baseJugador.def.x, y: 1.6, z: baseJugador.def.z }, 14);
  Sonidos.compra();
  E.stats.compras++;
  registrarMemeDistinto(it.def.id);
  ganarXP(60);
  toast(`${it.def.nombre} → instalado. ${it.dorado ? '¡DORADO! ¡Produce x5!' : 'Produce ' + fmt(ipsDe(it.def)) + '/s'}`, 'exito');
  comprobarLogros();
  if (tutorialActivo && tutoPaso === 1) avanzarTutorial();
  guardar();
}

/* ---------- Robar / entregar / soltar ---------- */
function robarMeme(inst) {
  quitarMemeInstalado(inst);
  jugador.grupo.add(inst.grupo);
  inst.grupo.position.set(0, 2.55, 0);
  inst.grupo.rotation.set(0, 0, 0);
  jugador.cargando = { inst, origen: inst.base, slotOriginal: inst.slotIdx };
  Sonidos.robo();
  toast(`¡Has robado ${inst.def.nombre}! ¡CORRE A TU BASE!`, 'info');
  const dueno = bots.find(b => b.base === inst.base);
  if (dueno) { dueno.estado = 'perseguir'; dueno.tEstado = 8; }
}
function entregarMeme() {
  const c = jugador.cargando;
  if (!c) return;
  const ok = colocarMeme(baseJugador, c.inst.def, { grupoExistente: c.inst.grupo, dorado: c.inst.dorado });
  if (!ok) {
    colocarMeme(c.origen, c.inst.def, { slotIdx: c.slotOriginal, grupoExistente: c.inst.grupo });
    toast('¡Tu base se llenó y el meme volvió a su casa! Amplíala antes de robar.', 'error');
    Sonidos.error();
  } else {
    spawnConfeti({ x: baseJugador.def.x, y: 1.6, z: baseJugador.def.z }, 20);
    Sonidos.logro();
    E.stats.robos++;
    registrarMemeDistinto(c.inst.def.id);
    ganarXP(180);
    toast(`¡${c.inst.def.nombre} es TUYO! Robo perfecto.`, 'logro');
    comprobarLogros();
  }
  jugador.cargando = null;
  guardar();
}
function pillarJugador(bot) {
  const c = jugador.cargando;
  if (!c) return;
  const ok = colocarMeme(c.origen, c.inst.def, { slotIdx: c.slotOriginal, grupoExistente: c.inst.grupo });
  if (!ok) {
    jugador.grupo.remove(c.inst.grupo);
    c.inst.grupo.traverse(o => { if (o.isSprite) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
  }
  jugador.cargando = null;
  jugador.aturdido = 1.3;
  Sonidos.error();
  toast(`¡${bot.def.nombre} te ha pillado! El meme volvió a su base.`, 'error');
}

/* ---------- Recoger la olla de monedas ---------- */
function recogerPot() {
  if (E.pot < 1) return;
  const n = Math.floor(E.pot);
  E.pot -= n;
  E.monedas += n;
  E.stats.monedasTotales += n;
  spawnMonedas({ x: jugador.pos.x, y: jugador.yVisual + 0.6, z: jugador.pos.z }, 7);
  Sonidos.moneda();
  ganarXP(Math.max(1, Math.floor(n / 2)));
  comprobarLogros();
  marcarSucio();
}

/* ---------- Escudo del jugador ---------- */
function activarEscudoJugador() {
  if (baseJugador.escudoActivo) { toast('El escudo ya está activo.', 'info'); return; }
  if (tJuego < E.escudo.tDisp) {
    Sonidos.error();
    toast(`Escudo recargando: ${Math.ceil(E.escudo.tDisp - tJuego)} s…`, 'info');
    return;
  }
  const dur = 8 + E.mejoras.escudo * 2;
  E.escudo.cdDur = Math.max(22, 42 - E.mejoras.escudo * 3);
  E.escudo.tFin = tJuego + dur;
  E.escudo.tDisp = E.escudo.tFin + E.escudo.cdDur;
  activarEscudo(baseJugador, dur);
  Sonidos.escudo();
  E.stats.escudosUsados++;
  comprobarLogros();
  marcarSucio();
}

/* ---------- Actualización por fotograma ---------- */
function actualizarJugador(dt) {
  if (jugador.aturdido > 0) {
    jugador.aturdido -= dt;
    jugador.grupo.rotation.y += dt * 11;
    animarPersonaje(jugador.grupo, tJuego, 0);
    return;
  }
  let dx = 0, dz = 0;
  if (teclas.w) dz -= 1;
  if (teclas.s) dz += 1;
  if (teclas.a) dx -= 1;
  if (teclas.d) dx += 1;
  if (joy.activo) { dx += joy.dx; dz += joy.dy; }
  const len = Math.hypot(dx, dz);
  if (len > 0.12) {
    dx /= len; dz /= len;
    let vel = (8 + E.mejoras.zapato * 0.9) * velocidadTurbo();
    if (jugador.cargando) vel *= 0.75 + E.mejoras.guante * 0.05;
    jugador.pos.x = clamp(jugador.pos.x + dx * vel * dt, -48.4, 48.4);
    jugador.pos.z = clamp(jugador.pos.z + dz * vel * dt, -34.4, 34.4);
    evitarPedestales(jugador.pos);
    jugador.grupo.rotation.y = Math.atan2(dx, dz);
    jugador.animInt = clamp(vel / 8, 0, 1.3);
  } else {
    jugador.animInt = 0;
  }
  const objetivoY = altoEn(jugador.pos.x, jugador.pos.z);
  jugador.yVisual = lerp(jugador.yVisual, objetivoY, Math.min(1, dt * 12));
  jugador.grupo.position.set(jugador.pos.x, jugador.yVisual, jugador.pos.z);
  animarPersonaje(jugador.grupo, tJuego, jugador.animInt);
  if (jugador.cargando) {
    const g = jugador.cargando.inst.grupo;
    g.position.y = 2.55 + Math.sin(tJuego * 3.2) * 0.12;
    g.rotation.y += dt * 1.8;
    if (dist2D(jugador.pos, baseJugador.def) < 8.5) entregarMeme();
  }
  if (E.pot >= 1 && tJuego - tUltimaRecogida > 0.7 &&
      dist2D(jugador.pos, baseJugador.def) < 5.5 + E.mejoras.iman * 1.5) {
    tUltimaRecogida = tJuego;
    recogerPot();
  }
}

/* ---------- Cámara con seguimiento suave ---------- */
const camObjetivo = new THREE.Vector3();
function actualizarCamara(dt) {
  const p = jugador.pos;
  const alt = esMovil ? 20.5 : 16.5;
  const det = esMovil ? 17.5 : 18;
  camObjetivo.set(p.x, alt, p.z + det);
  camara.position.lerp(camObjetivo, 1 - Math.pow(0.0012, dt));
  camara.lookAt(p.x, 1.4, p.z - 2);
}

/* =========================================================
   BOTS RIVALES (IA)
   ========================================================= */
const bots = [];
function crearBots() {
  D.BOTS.forEach((def, i) => {
    const base = bases[i + 1];
    const grupo = crearPersonaje({ color: def.color, cara: def.cara, nombre: def.nombre });
    grupo.position.set(base.def.x, 0.8, base.def.z);
    escena.add(grupo);
    bots.push({
      def, base, grupo,
      pos: new THREE.Vector3(base.def.x, 0, base.def.z),
      yVisual: 0.8,
      estado: 'esperar', tEstado: rand(1, 4),
      destino: null, objetivoItem: null, objetivoBase: null,
      cargando: null,
      monedas: 260,
      animInt: 0, fase: rand(0, 6),
      tEscudo: rand(45, 90)
    });
  });
}
function ipsBot(bot) {
  return bot.base.memesInstalados.reduce((t, m) => t + ipsDe(m.def) * (m.dorado ? 5 : 1), 0);
}
function vagar(bot) {
  bot.destino = { x: rand(-40, 40), z: rand(-26, 26) };
  bot.estado = 'vagar';
}
function decidirBot(bot) {
  bot.tEstado = rand(2.5, 6);
  const asequibles = memesTienda.filter(it => bot.monedas >= precioTienda(it));
  const puedeRobar = huecoLibre(bot.base);
  const puedeRobarJugador = tJuego > 90 && baseJugador.memesInstalados.length >= 3 && !baseJugador.escudoActivo;
  const rivalesBot = bases.filter(b => b !== bot.base && b !== baseJugador && b.memesInstalados.length > 0 && !b.escudoActivo);
  const r = Math.random();
  if (puedeRobar && asequibles.length && (r < 0.62 || (!puedeRobarJugador && !rivalesBot.length))) {
    const it = asequibles.reduce((a, b) => precioTienda(a) >= precioTienda(b) ? a : b);
    bot.objetivoItem = it;
    bot.destino = { x: it.pos.x, z: it.pos.z };
    bot.estado = 'irComprar';
  } else if (puedeRobar && (puedeRobarJugador || rivalesBot.length) && r < 0.85) {
    let objetivo = null;
    if (puedeRobarJugador && (Math.random() < 0.65 || !rivalesBot.length)) objetivo = baseJugador;
    else objetivo = rivalesBot[Math.floor(Math.random() * rivalesBot.length)];
    if (objetivo) {
      bot.objetivoBase = objetivo;
      bot.destino = { x: objetivo.def.x, z: objetivo.def.z };
      bot.estado = 'irRobar';
    } else vagar(bot);
  } else {
    vagar(bot);
  }
}
function moverBotHacia(bot, objetivo, vel, dt) {
  const dx = objetivo.x - bot.pos.x, dz = objetivo.z - bot.pos.z;
  const d = Math.hypot(dx, dz);
  if (d < 1.0) { bot.animInt = 0; return true; }
  const nx = dx / d, nz = dz / d;
  bot.pos.x = clamp(bot.pos.x + nx * vel * dt, -48.4, 48.4);
  bot.pos.z = clamp(bot.pos.z + nz * vel * dt, -34.4, 34.4);
  evitarPedestales(bot.pos);
  bot.grupo.rotation.y = Math.atan2(nx, nz);
  bot.animInt = clamp(vel / 8, 0.3, 1.2);
  return false;
}
function depositarRobo(bot) {
  const c = bot.cargando;
  bot.estado = 'esperar';
  bot.tEstado = rand(2, 5);
  if (!c) return;
  const ok = colocarMeme(bot.base, c.inst.def, { grupoExistente: c.inst.grupo, dorado: c.inst.dorado });
  if (!ok) {
    // base llena: el bot se queda el dinero
    bot.grupo.remove(c.inst.grupo);
    c.inst.grupo.traverse(o => { if (o.isSprite) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    bot.monedas += Math.round(precioDe(c.inst.def) * 0.5);
  }
  bot.cargando = null;
  if (c.deJugador) guardar();
}
function recuperarMeme(bot) {
  const c = bot.cargando;
  bot.cargando = null;
  bot.estado = 'esperar';
  bot.tEstado = rand(2, 4);
  if (!c) return;
  const ok = colocarMeme(baseJugador, c.inst.def, { grupoExistente: c.inst.grupo, dorado: c.inst.dorado });
  if (!ok) {
    bot.grupo.remove(c.inst.grupo);
    c.inst.grupo.traverse(o => { if (o.isSprite) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
  }
  E.stats.recuperaciones++;
  ganarXP(120);
  Sonidos.compra();
  toast(`¡Has recuperado ${c.inst.def.nombre} de las manos de ${bot.def.nombre}!`, 'exito');
  comprobarLogros();
  guardar();
}
function actualizarBot(bot, dt) {
  // escudo propio automático
  if (!bot.base.escudoActivo) {
    bot.tEscudo -= dt;
    if (bot.tEscudo <= 0) {
      activarEscudo(bot.base, 8);
      bot.tEscudo = rand(55, 95);
    }
  }
  switch (bot.estado) {
    case 'esperar':
      bot.animInt = 0;
      bot.tEstado -= dt;
      if (bot.tEstado <= 0) decidirBot(bot);
      break;
    case 'vagar':
      if (moverBotHacia(bot, bot.destino, 3.6, dt)) { bot.estado = 'esperar'; bot.tEstado = rand(1, 3); }
      break;
    case 'irComprar': {
      const it = bot.objetivoItem;
      if (!it || !memesTienda.includes(it) || bot.monedas < precioTienda(it) || !huecoLibre(bot.base)) {
        bot.estado = 'esperar'; bot.tEstado = 0.5; bot.objetivoItem = null;
        break;
      }
      if (moverBotHacia(bot, it.pos, 5.2, dt)) { bot.estado = 'comprando'; bot.tEstado = 0.9; }
      break;
    }
    case 'comprando': {
      bot.animInt = 0;
      bot.tEstado -= dt;
      if (bot.tEstado <= 0) {
        const it = bot.objetivoItem;
        if (it && memesTienda.includes(it) && bot.monedas >= precioTienda(it) && huecoLibre(bot.base)) {
          bot.monedas -= precioTienda(it);
          quitarDeTienda(it);
          colocarMeme(bot.base, it.def);
          if (it.dorado) toast(`${bot.def.nombre} se ha llevado el meme DORADO…`, 'info');
        }
        bot.objetivoItem = null;
        bot.estado = 'volver';
        bot.destino = { x: bot.base.def.x, z: bot.base.def.z };
      }
      break;
    }
    case 'irRobar': {
      const obj = bot.objetivoBase;
      if (!obj || obj.memesInstalados.length === 0 || !huecoLibre(bot.base)) {
        bot.estado = 'esperar'; bot.tEstado = 1;
        break;
      }
      if (moverBotHacia(bot, bot.destino, 5.2, dt)) {
        bot.estado = 'agarrando';
        bot.tEstado = 1.1;
        if (obj === baseJugador) {
          toast(`¡${bot.def.nombre} está robando en TU BASE! ¡Activa el escudo (R) o persíguelo!`, 'error');
          Sonidos.robo();
        }
      }
      break;
    }
    case 'agarrando': {
      bot.animInt = 0;
      bot.tEstado -= dt;
      if (bot.tEstado <= 0) {
        const obj = bot.objetivoBase;
        if (obj && obj.memesInstalados.length && !obj.escudoActivo && huecoLibre(bot.base)) {
          const inst = obj.memesInstalados[Math.floor(Math.random() * obj.memesInstalados.length)];
          quitarMemeInstalado(inst);
          bot.grupo.add(inst.grupo);
          inst.grupo.position.set(0, 2.55, 0);
          bot.cargando = { inst, deJugador: obj === baseJugador };
          bot.estado = 'volver';
          bot.destino = { x: bot.base.def.x, z: bot.base.def.z };
          if (obj === baseJugador) {
            E.stats.robosSufridos++;
            toast(`¡${bot.def.nombre} te ha robado ${inst.def.nombre}! ¡Persíguelo para recuperarlo!`, 'error');
          }
        } else {
          if (obj === baseJugador && obj.escudoActivo) toast('¡Tu escudo ha impedido el robo!', 'exito');
          bot.estado = 'esperar'; bot.tEstado = 1;
        }
      }
      break;
    }
    case 'volver': {
      if (bot.cargando && bot.cargando.deJugador && jugador.aturdido <= 0 && dist2D(jugador.pos, bot.pos) < 1.7) {
        recuperarMeme(bot);
        break;
      }
      if (moverBotHacia(bot, bot.destino, 5.6, dt)) depositarRobo(bot);
      break;
    }
    case 'perseguir': {
      if (!jugador.cargando || jugador.cargando.origen !== bot.base) {
        bot.estado = 'esperar'; bot.tEstado = 1;
        break;
      }
      const vel = Math.min((8 + E.mejoras.zapato * 0.9) * 0.95, 11.5) * velocidadTurbo();
      moverBotHacia(bot, jugador.pos, vel, dt);
      if (dist2D(bot.pos, jugador.pos) < 1.5) pillarJugador(bot);
      break;
    }
  }
  if (bot.cargando) {
    const g = bot.cargando.inst.grupo;
    g.position.y = 2.55 + Math.sin(tJuego * 3 + bot.fase) * 0.12;
    g.rotation.y += dt * 2;
  }
  bot.yVisual = lerp(bot.yVisual, altoEn(bot.pos.x, bot.pos.z), Math.min(1, dt * 12));
  bot.grupo.position.set(bot.pos.x, bot.yVisual, bot.pos.z);
  animarPersonaje(bot.grupo, tJuego + bot.fase, bot.animInt);
}

/* =========================================================
   ECONOMÍA · XP · LOGROS · EVENTOS
   ========================================================= */
function ipsTotal() {
  return baseJugador.memesInstalados.reduce((t, m) => t + ipsDe(m.def) * (m.dorado ? 5 : 1), 0) * multNivel();
}
let acumEconomia = 0;
function tickEconomia() {
  E.pot += ipsTotal();
  bots.forEach(b => { b.monedas += ipsBot(b); });
}
function ganarXP(n) {
  E.xp += n;
  while (E.xp >= xpNecesaria(E.nivel)) {
    E.xp -= xpNecesaria(E.nivel);
    E.nivel++;
    Sonidos.nivel();
    spawnConfeti({ x: jugador.pos.x, y: jugador.yVisual + 1, z: jugador.pos.z }, 22);
    toast(`¡NIVEL ${E.nivel}! Ingresos +3%. ¡Sigue así!`, 'logro');
    if (window.Admin && window.Admin.enviarPuntuacion) {
      try { window.Admin.enviarPuntuacion(); } catch (e) { /* sin nube */ }
    }
  }
  marcarSucio();
}
function statsSnapshot() {
  return {
    ...E.stats,
    memesActuales: baseJugador.memesInstalados.length,
    memesDistintos: E.memesDistintos.length,
    nivel: E.nivel,
    mejoraZapato: E.mejoras.zapato,
    tieneSecreto: E.memesDistintos.some(id => (defPorId(id) || {}).rareza === 'secreto')
  };
}
function comprobarLogros() {
  const s = statsSnapshot();
  D.LOGROS.forEach(l => {
    if (E.logros.includes(l.id)) return;
    let ok = false;
    try { ok = l.cond(s); } catch (e) { ok = false; }
    if (ok) {
      E.logros.push(l.id);
      E.monedas += l.premio.monedas;
      Sonidos.logro();
      toast(`Logro: ${l.nombre} (+${fmt(l.premio.monedas)})`, 'logro');
      if (l.premio.xp) ganarXP(l.premio.xp);
      marcarSucio();
    }
  });
}

/* ---------- Eventos especiales ---------- */
function dispararEvento(idFijo) {
  const ev = idFijo ? D.EVENTOS.find(e => e.id === idFijo) : D.EVENTOS[Math.floor(Math.random() * D.EVENTOS.length)];
  E.evento.tipo = ev.id;
  E.evento.tFin = tJuego + ev.dur;
  E.evento.tProximo = E.evento.tFin + rand(90, 150);
  anuncio(ev.nombre, ev.desc);
  Sonidos.evento();
  switch (ev.id) {
    case 'lluvia': {
      const bonus = 30 + Math.round(ipsTotal() * 8);
      E.pot += bonus;
      lluviaSobreBase(baseJugador, 30);
      toast(`La lluvia ha añadido ${fmt(bonus)} monedas a tu olla. ¡Pásate por tu base!`, 'exito');
      break;
    }
    case 'rebajas':
      memesTienda.forEach(refrescarEtiqueta);
      break;
    case 'dorado': {
      const pool = D.MEMES.filter(m => ['raro', 'epico', 'legendario', 'mitico'].includes(m.rareza));
      const def = aleatorioPonderado(pool, m => D.RAREZAS[m.rareza].mult * 2);
      const it = aparecerEnTienda(def, true);
      if (it) dorarMeme(it.grupo);
      break;
    }
  }
  marcarSucio();
}
function terminarEvento() {
  if (E.evento.tipo === 'rebajas') memesTienda.forEach(refrescarEtiqueta);
  if (E.evento.tipo === 'dorado') {
    const d = memesTienda.find(it => it.dorado);
    if (d) quitarDeTienda(d);
  }
  E.evento.tipo = null;
}
function actualizarEventos() {
  const chip = $('#hud-evento'), chipTxt = $('#hud-evento-txt');
  if (E.evento.tipo) {
    const ev = D.EVENTOS.find(e => e.id === E.evento.tipo);
    const falta = Math.max(0, Math.ceil(E.evento.tFin - tJuego));
    chip.classList.remove('oculto');
    chipTxt.textContent = `${ev.nombre.replace(/[¡!]/g, '')} · ${falta}s`;
    if (tJuego >= E.evento.tFin) terminarEvento();
  } else if (tJuego >= E.evento.tProximo) {
    dispararEvento();
  } else {
    const falta = Math.ceil(E.evento.tProximo - tJuego);
    if (falta <= 30) {
      chip.classList.remove('oculto');
      chipTxt.textContent = `Evento en ${falta}s…`;
    } else {
      chip.classList.add('oculto');
    }
  }
}

/* =========================================================
   HUD · MINIMAPA · TIENDA · MODALES
   ========================================================= */
const hud = {
  monedas: $('#hud-monedas'), ips: $('#hud-ips'), nivel: $('#hud-nivel'), xp: $('#hud-xp'),
  accionTxt: $('#accion-txt'), btnAccion: $('#btn-accion'),
  btnEscudo: $('#btn-escudo'), cdEscudo: $('#escudo-cd'),
  tiendaMonedas: $('#tienda-monedas')
};
function actualizarHUD() {
  if (hud.monedas.textContent !== undefined) {
    const m = fmt(E.monedas);
    if (hud.monedas._v !== m) { hud.monedas.textContent = m; hud.monedas._v = m; }
    const ip = '+' + fmt(ipsTotal()) + '/s';
    if (hud.ips._v !== ip) { hud.ips.textContent = ip; hud.ips._v = ip; }
    const nv = String(E.nivel);
    if (hud.nivel._v !== nv) { hud.nivel.textContent = nv; hud.nivel._v = nv; }
    hud.xp.style.width = clamp(E.xp / xpNecesaria(E.nivel) * 100, 0, 100).toFixed(1) + '%';
  }
  // botón de acción contextual
  accionActual = calcularAccion();
  let etiq = 'Nada cerca…', activa = false;
  if (accionActual) {
    activa = ['comprar', 'robar', 'recoger'].includes(accionActual.tipo);
    switch (accionActual.tipo) {
      case 'comprar': etiq = `COMPRAR · ${fmt(precioTienda(accionActual.it))}`; break;
      case 'robar': etiq = '¡ROBAR!'; break;
      case 'recoger': etiq = `¡+${fmt(E.pot)}!`; break;
      case 'llevar': etiq = '¡A CASA!'; break;
      case 'bloqueado': etiq = 'ESCUDO RIVAL'; break;
      case 'vigilado': etiq = '¡VIGILADO!'; break;
      case 'llena': etiq = 'BASE LLENA'; break;
    }
  }
  if (hud.accionTxt._v !== etiq) { hud.accionTxt.textContent = etiq; hud.accionTxt._v = etiq; }
  hud.btnAccion.disabled = !activa;
  hud.btnAccion.classList.toggle('disponible', activa);
  // escudo
  if (baseJugador.escudoActivo) {
    hud.btnEscudo.classList.add('activo');
    hud.cdEscudo.style.height = '0%';
  } else {
    hud.btnEscudo.classList.remove('activo');
    if (tJuego < E.escudo.tDisp) {
      hud.cdEscudo.style.height = clamp((E.escudo.tDisp - tJuego) / E.escudo.cdDur * 100, 0, 100) + '%';
    } else {
      hud.cdEscudo.style.height = '0%';
    }
  }
  if (tiendaEl.classList.contains('abierta')) {
    const tm = fmt(E.monedas);
    if (hud.tiendaMonedas._v !== tm) { hud.tiendaMonedas.textContent = tm; hud.tiendaMonedas._v = tm; }
  }
}

/* ---------- Minimapa ---------- */
const mmCanvas = $('#minimapa');
const mmCtx = mmCanvas.getContext('2d');
const cssHex = n => '#' + n.toString(16).padStart(6, '0');
function dibujarMinimapa() {
  const W = mmCanvas.width, H = mmCanvas.height;
  const mx = x => (x + 50) / 100 * (W - 14) + 7;
  const my = z => (z + 36) / 72 * (H - 14) + 7;
  const ex = 22 / 100 * (W - 14), ez = 15 / 72 * (H - 14);
  mmCtx.clearRect(0, 0, W, H);
  // zona central
  mmCtx.beginPath();
  mmCtx.arc(mx(0), my(0), 9.2 / 100 * (W - 14), 0, Math.PI * 2);
  mmCtx.fillStyle = 'rgba(230,180,34,.75)'; mmCtx.fill();
  // bases
  bases.forEach(b => {
    mmCtx.fillStyle = cssHex(b.def.color) + 'dd';
    mmCtx.fillRect(mx(b.def.x) - ex / 2, my(b.def.z) - ez / 2, ex, ez);
    if (b.escudoActivo) {
      mmCtx.strokeStyle = '#ffc93c'; mmCtx.lineWidth = 2.5;
      mmCtx.strokeRect(mx(b.def.x) - ex / 2 - 2, my(b.def.z) - ez / 2 - 2, ex + 4, ez + 4);
    }
    // memes instalados
    b.memesInstalados.forEach(m => {
      mmCtx.fillStyle = D.RAREZAS[m.def.rareza].css;
      mmCtx.beginPath();
      mmCtx.arc(mx(b.def.x + b.slots[m.slotIdx].x), my(b.def.z + b.slots[m.slotIdx].z), 1.7, 0, Math.PI * 2);
      mmCtx.fill();
    });
  });
  // memes en la tienda central
  memesTienda.forEach(it => {
    mmCtx.fillStyle = it.dorado ? '#ffd54f' : '#fff';
    mmCtx.beginPath();
    mmCtx.arc(mx(it.pos.x), my(it.pos.z), 2.4 + Math.sin(tJuego * 5) * 0.6, 0, Math.PI * 2);
    mmCtx.fill();
  });
  // bots
  bots.forEach(b => {
    mmCtx.fillStyle = cssHex(b.def.color);
    mmCtx.beginPath(); mmCtx.arc(mx(b.pos.x), my(b.pos.z), 3.4, 0, Math.PI * 2); mmCtx.fill();
    mmCtx.strokeStyle = '#fff'; mmCtx.lineWidth = 1.4; mmCtx.stroke();
  });
  // jugador (flecha)
  const ry = jugador.grupo.rotation.y;
  const dirX = Math.sin(ry), dirZ = Math.cos(ry);
  const px = mx(jugador.pos.x), py = my(jugador.pos.z);
  mmCtx.beginPath();
  mmCtx.moveTo(px + dirX * 7, py + dirZ * 7);
  mmCtx.lineTo(px - dirX * 4 - dirZ * 4, py - dirZ * 4 + dirX * 4);
  mmCtx.lineTo(px - dirX * 4 + dirZ * 4, py - dirZ * 4 - dirX * 4);
  mmCtx.closePath();
  mmCtx.fillStyle = '#ffb300'; mmCtx.fill();
  mmCtx.strokeStyle = '#fff'; mmCtx.lineWidth = 1.6; mmCtx.stroke();
}

/* ---------- Tienda lateral ---------- */
const tiendaEl = $('#tienda');
let pestallaActiva = 'mejoras';
function alternarTienda() {
  if (tiendaEl.classList.contains('abierta')) cerrarTiendaUI();
  else abrirTiendaUI();
}
function abrirTiendaUI() {
  tiendaEl.classList.add('abierta');
  renderPestalla(pestallaActiva);
}
function cerrarTiendaUI() { tiendaEl.classList.remove('abierta'); }
document.querySelectorAll('.pest').forEach(btn => {
  btn.addEventListener('click', () => {
    pestallaActiva = btn.dataset.pest;
    document.querySelectorAll('.pest').forEach(b => b.classList.toggle('activa', b === btn));
    document.querySelectorAll('.pest-cuerpo').forEach(s => s.classList.toggle('activa', s.id === 'pest-' + pestallaActiva));
    renderPestalla(pestallaActiva);
  });
});
function renderPestalla(cual) {
  if (cual === 'mejoras') renderMejoras();
  else if (cual === 'inv') renderInventario();
  else renderLogros();
}
function renderMejoras() {
  const cont = $('#pest-mejoras');
  cont.innerHTML = D.MEJORAS.map(m => {
    const nivel = E.mejoras[m.id];
    const maximo = nivel >= m.max;
    const coste = costeMejora(m);
    const pips = Array.from({ length: m.max }, (_, i) => `<i class="${i < nivel ? 'llena' : ''}"></i>`).join('');
    return `<div class="tarjeta-mejora">
      <div class="tm-icono" style="background:${m.color}"><svg class="ico" viewBox="0 0 24 24"><use href="${m.icono}"/></svg></div>
      <div class="tm-datos">
        <h3>${esc(m.nombre)}</h3><p>${esc(m.desc)}</p>
        <div class="tm-pips">${pips}</div>
      </div>
      <button class="tm-precio ${maximo ? 'max' : ''}" data-mejora="${m.id}" ${maximo ? 'disabled' : ''}>
        ${maximo ? 'MÁXIMO' : `<svg class="ico" viewBox="0 0 24 24"><use href="#i-moneda"/></svg>${fmt(coste)}`}
      </button>
    </div>`;
  }).join('');
  cont.querySelectorAll('[data-mejora]').forEach(btn => {
    btn.addEventListener('click', () => comprarMejora(btn.dataset.mejora));
  });
}
function comprarMejora(id) {
  const m = D.MEJORAS.find(x => x.id === id);
  if (!m || E.mejoras[id] >= m.max) return;
  const coste = costeMejora(m);
  if (E.monedas < coste) { Sonidos.error(); toast(`Te faltan monedas para ${m.nombre} (${fmt(coste)}).`, 'error'); return; }
  E.monedas -= coste;
  E.mejoras[id]++;
  if (id === 'expandir') fijarSlots(baseJugador, capSlotsJugador());
  Sonidos.compra();
  toast(`¡${m.nombre} nivel ${E.mejoras[id]}!`, 'exito');
  comprobarLogros();
  renderMejoras();
  guardar();
}
function renderInventario() {
  const cont = $('#pest-inv');
  const items = baseJugador.memesInstalados;
  let html = `<p class="a-nota" style="margin-bottom:10px">Tus memes producen en total <b style="color:var(--verde-osc)">+${fmt(ipsTotal())}/s</b>. Véndelos al 60% si necesitas cash.</p><div class="grid-memes">`;
  items.forEach((m, i) => {
    const rz = D.RAREZAS[m.def.rareza];
    const colorCuerpo = cssHex(m.def.receta.cuerpo.color);
    const ips = ipsDe(m.def) * (m.dorado ? 5 : 1);
    const venta = Math.round(precioDe(m.def) * 0.6 * (m.dorado ? 3 : 1));
    html += `<div class="celda-meme">
      <div class="cm-barra" style="background:${rz.css}"></div>
      ${m.dorado ? '<svg class="cm-dorado" viewBox="0 0 24 24"><use href="#i-estrella"/></svg>' : ''}
      <div class="cm-cuerpo"><div class="cm-cara" style="background:${colorCuerpo}"></div></div>
      <h4>${esc(m.def.nombre)}</h4>
      <div class="cm-ips"><svg class="ico" viewBox="0 0 24 24"><use href="#i-rayo"/></svg>${fmt(ips)}/s</div>
      <button class="cm-vender" data-vender="${i}">Vender · ${fmt(venta)}</button>
    </div>`;
  });
  const vacios = baseJugador.slots.length - items.length;
  for (let i = 0; i < Math.min(vacios, 6); i++) html += `<div class="celda-vacia">hueco<br>libre</div>`;
  html += '</div>';
  if (!items.length) html = '<p class="a-nota">Aún no tienes memes. ¡Compra tu primero en la zona central!</p>' + html;
  cont.innerHTML = html;
  cont.querySelectorAll('[data-vender]').forEach(btn => {
    btn.addEventListener('click', () => venderMeme(Number(btn.dataset.vender)));
  });
}
function venderMeme(indice) {
  const inst = baseJugador.memesInstalados[indice];
  if (!inst) return;
  const venta = Math.round(precioDe(inst.def) * 0.6 * (inst.dorado ? 3 : 1));
  destruirMeme(inst);
  E.monedas += venta;
  Sonidos.moneda();
  toast(`${inst.def.nombre} vendido por ${fmt(venta)}.`, 'exito');
  renderInventario();
  guardar();
}
function renderLogros() {
  const cont = $('#pest-logros');
  const s = statsSnapshot();
  cont.innerHTML = D.LOGROS.map(l => {
    let hecho = false;
    try { hecho = E.logros.includes(l.id) || l.cond(s); } catch (e) {}
    return `<div class="logro ${hecho ? 'hecho' : ''}">
      <div class="l-icono"><svg class="ico" viewBox="0 0 24 24"><use href="#i-trofeo"/></svg></div>
      <div class="l-datos"><h3>${esc(l.nombre)}</h3><p>${esc(l.desc)}</p></div>
      <div class="l-premio">+${fmt(l.premio.monedas)}</div>
    </div>`;
  }).join('');
}

/* ---------- Sonido / pantalla completa ---------- */
function alternarSonido() {
  E.sonido = !E.sonido;
  $('#uso-sonido').setAttribute('href', E.sonido ? '#i-son-on' : '#i-son-off');
  if (E.sonido) Sonidos.compra();
  marcarSucio();
}
function alternarPantallaCompleta() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  } catch (e) { toast('Tu navegador bloquea la pantalla completa.', 'error'); }
}

/* ---------- Ayuda ---------- */
function abrirAyuda() {
  abrirModal({
    titulo: 'Cómo jugar',
    html: `<p><b>Objetivo:</b> compra memes, hazte rico y roba los memes de los bots.</p>
      <ul>
        <li><b>WASD / flechas</b> o joystick → moverte</li>
        <li><b>E</b> (o botón grande) → comprar / robar / recoger</li>
        <li><b>R</b> → escudo de tu base (bloquea robos)</li>
        <li><b>T</b> → tienda de mejoras, memes y logros</li>
        <li><b>M</b> → sonido on/off</li>
      </ul>
      <p>Si te roban, <b>persigue al ladrón y tócalo</b> para recuperar tu meme. Si robas tú, ¡corre a tu base antes de que te pillen! Roba cuando el dueño esté lejos de su base.</p>
      <p>Los eventos (turbo, lluvia, rebajas, meme dorado) saltan cada pocos minutos. ¡El dorado produce x5!</p>`,
    botones: [{ texto: '¡Entendido!', clase: 'btn-primario' }]
  });
}

/* ---------- Ajustes ---------- */
function aplicarSombras(on) {
  renderer.shadowMap.enabled = on;
  luzSol.castShadow = on;
  escena.traverse(o => {
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(mt => { mt.needsUpdate = true; });
  });
}
function abrirAjustes() {
  abrirModal({
    titulo: 'Ajustes',
    html: `
      <div class="fila-modal"><b>Tu nombre (ranking)</b><input type="text" id="inp-nombre" maxlength="16" value="${esc(E.nombre)}"></div>
      <div class="fila-modal"><b>Sonido</b><span class="interruptor"><button id="tg-sonido" class="${E.sonido ? 'on' : ''}">${E.sonido ? 'SÍ' : 'NO'}</button></span></div>
      <div class="fila-modal"><b>Sombras 3D</b><span class="interruptor"><button id="tg-sombras" class="${E.sombras ? 'on' : ''}">${E.sombras ? 'SÍ' : 'NO'}</button></span></div>
      <div class="fila-modal"><b>Puntuación en la nube</b><button class="btn-modal btn-mini" id="btn-enviar-puntos">Enviar ahora</button></div>
      <div class="fila-modal"><b>Panel de administración</b><button class="btn-modal btn-mini" id="btn-abrir-admin">Abrir</button></div>
      <div class="fila-modal"><b>Reiniciar partida</b><button class="btn-modal btn-mini btn-peligro" id="btn-reiniciar">Borrar todo</button></div>`,
    botones: [{ texto: 'Listo', clase: 'btn-primario', accion: guardar, mantener: false }],
    alCerrar: () => {
      const inp = $('#inp-nombre');
      if (inp) E.nombre = (inp.value || 'Jugador').trim().slice(0, 16) || 'Jugador';
      guardar();
    }
  });
  const tgS = $('#tg-sonido'), tgSo = $('#tg-sombras');
  tgS.addEventListener('click', () => {
    E.sonido = !E.sonido;
    tgS.classList.toggle('on', E.sonido); tgS.textContent = E.sonido ? 'SÍ' : 'NO';
    $('#uso-sonido').setAttribute('href', E.sonido ? '#i-son-on' : '#i-son-off');
  });
  tgSo.addEventListener('click', () => {
    E.sombras = !E.sombras;
    tgSo.classList.toggle('on', E.sombras); tgSo.textContent = E.sombras ? 'SÍ' : 'NO';
    aplicarSombras(E.sombras);
  });
  $('#btn-enviar-puntos').addEventListener('click', async () => {
    if (!window.Admin) return;
    try {
      const r = await window.Admin.enviarPuntuacion();
      toast(r && r.local ? 'Guardado como récord local (Firebase sin configurar).' : '¡Puntuación enviada a la nube!', 'exito');
    } catch (e) { toast('No se pudo enviar la puntuación.', 'error'); }
  });
  $('#btn-abrir-admin').addEventListener('click', () => {
    cerrarModal();
    if (window.Admin) window.Admin.abrir();
    else toast('El panel admin no está disponible.', 'error');
  });
  $('#btn-reiniciar').addEventListener('click', () => {
    abrirModal({
      titulo: '¿Reiniciar TODO?',
      html: '<p>Se borrarán tus monedas, memes, mejoras, nivel y logros. <b>No hay vuelta atrás.</b></p>',
      botones: [
        { texto: 'Cancelar' },
        {
          texto: 'Borrar y reiniciar', clase: 'btn-peligro',
          accion: () => { try { localStorage.removeItem(CLAVE); } catch (e) {} location.reload(); }
        }
      ]
    });
  });
}

/* ---------- Botones del HUD ---------- */
$('#btn-tienda').addEventListener('click', alternarTienda);
$('#btn-cerrar-tienda').addEventListener('click', cerrarTiendaUI);
$('#btn-ayuda').addEventListener('click', abrirAyuda);
$('#btn-sonido').addEventListener('click', alternarSonido);
$('#btn-pantalla').addEventListener('click', alternarPantallaCompleta);
$('#btn-ajustes').addEventListener('click', abrirAjustes);
hud.btnAccion.addEventListener('click', ejecutarAccion);
hud.btnEscudo.addEventListener('click', activarEscudoJugador);

/* =========================================================
   TUTORIAL
   ========================================================= */
const PASOS_TUTO = [
  { t: '¡Bienvenido a Roba el Meme 3D!', x: 'Muévete con WASD o las flechas (en móvil, toca la pantalla y arrastra). Tu meta: llenar tu base de memes… ¡y robar los de los bots!', res: null },
  { t: 'Compra tu primer meme', x: 'Acércate a la ZONA DE MEMES del centro y pulsa E (o el botón grande amarillo) junto a un meme para comprarlo. Empezará a producir monedas.', res: '#btn-accion' },
  { t: 'Recoge las monedas', x: 'Tus memes llenan la olla de TU BASE (la turquesa, abajo). Pásate por ella para recoger las monedas automáticamente.', res: null },
  { t: '¡Protégete!', x: 'Si un bot viene a robarte, pulsa R para activar el escudo de tu base durante unos segundos. Después tarda en recargarse.', res: '#btn-escudo' },
  { t: 'Conviértete en ladrón', x: 'Ve a la base de un bot, acércate a un meme y pulsa E para robarlo… ¡y corre a tu base! Si te pilla, lo pierdes. Roba cuando el dueño esté lejos.', res: null },
  { t: 'Mejoras y logros', x: 'Pulsa T para abrir la tienda: mejoras de velocidad, escudo, imán, ampliación de base, tus memes y logros. ¡A por el meme SECRETO!', res: '#btn-tienda' }
];
let tutorialActivo = false, tutoPaso = 0;
function iniciarTutorial() {
  tutorialActivo = true; tutoPaso = 0;
  $('#tutorial').classList.remove('oculto');
  pintarTutorial();
}
function pintarTutorial() {
  const p = PASOS_TUTO[tutoPaso];
  $('#tuto-titulo').textContent = p.t;
  $('#tuto-texto').textContent = p.x;
  $('#tuto-puntos').innerHTML = PASOS_TUTO.map((_, i) => `<i class="${i === tutoPaso ? 'actual' : ''}"></i>`).join('');
  document.querySelectorAll('.resaltar').forEach(el => el.classList.remove('resaltar'));
  if (p.res) { const el = $(p.res); if (el) el.classList.add('resaltar'); }
  $('#tuto-ant').style.visibility = tutoPaso === 0 ? 'hidden' : 'visible';
  $('#tuto-sig').textContent = tutoPaso === PASOS_TUTO.length - 1 ? '¡A JUGAR!' : 'Siguiente';
}
function avanzarTutorial() {
  if (!tutorialActivo) return;
  if (tutoPaso < PASOS_TUTO.length - 1) { tutoPaso++; pintarTutorial(); }
  else terminarTutorial();
}
function terminarTutorial() {
  tutorialActivo = false;
  $('#tutorial').classList.add('oculto');
  document.querySelectorAll('.resaltar').forEach(el => el.classList.remove('resaltar'));
  E.tutorialHecho = true;
  guardar();
}
$('#tuto-sig').addEventListener('click', avanzarTutorial);
$('#tuto-ant').addEventListener('click', () => { if (tutoPaso > 0) { tutoPaso--; pintarTutorial(); } });
$('#tuto-saltar').addEventListener('click', terminarTutorial);

/* =========================================================
   API PÚBLICA (para el panel de administración)
   ========================================================= */
window.Juego = {
  estado: () => ({
    monedas: Math.floor(E.monedas), nivel: E.nivel,
    memes: baseJugador ? baseJugador.memesInstalados.length : 0,
    ips: ipsTotal(), logros: E.logros.length, stats: { ...E.stats },
    pos: jugador ? [Math.round(jugador.pos.x * 10) / 10, Math.round(jugador.pos.z * 10) / 10] : null,
    aturdido: !!(jugador && jugador.aturdido > 0),
    cargando: !!(jugador && jugador.cargando)
  }),
  puntuacion: () => E.nivel * 1000 + Math.floor(E.stats.monedasTotales) + E.stats.robos * 250,
  nombre: () => E.nombre,
  darMonedas: n => { E.monedas += Math.max(0, Math.floor(n)); marcarSucio(); },
  aplicarConfigEconomia: cfg => {
    E.cfgEco = cfg && typeof cfg === 'object' ? cfg : {};
    memesTienda.forEach(refrescarEtiqueta);
  },
  anuncioAdmin: (t, s) => anuncio(t, s),
  toast: (t, tipo) => toast(t, tipo || 'info'),
  debugEvento: id => dispararEvento(id),
  debugTeleport: (x, z) => { jugador.pos.x = clamp(x, -48, 48); jugador.pos.z = clamp(z, -34, 34); }
};

/* =========================================================
   ARRANQUE Y BUCLE PRINCIPAL
   ========================================================= */
function iniciar() {
  DEF_BASES_POS.forEach((def, i) => construirBase(def, i === 0 ? capSlotsJugador() : 12));
  crearBots();
  const g = cargarGuardado();
  if (g) {
    (g.memes || []).forEach(m => {
      const def = defPorId(m.id);
      if (def) colocarMeme(baseJugador, def, { slotIdx: m.slot, dorado: m.dorado });
    });
    (g.bots || []).forEach((bd, i) => {
      if (!bots[i]) return;
      bots[i].monedas = bd.monedas ?? 260;
      (bd.memes || []).forEach(mm => {
        const def = defPorId(mm.id);
        if (def) colocarMeme(bots[i].base, def, { slotIdx: mm.slot });
      });
    });
    try {
      const cfgLocal = JSON.parse(localStorage.getItem('rem_adminLocal') || 'null');
      if (cfgLocal) E.cfgEco = cfgLocal;
    } catch (e) { /* sin config local */ }
  } else {
    bots.forEach(b => {
      for (let i = 0; i < 2; i++) {
        const pool = D.MEMES.filter(m => m.rareza === 'comun' || (m.rareza === 'raro' && Math.random() < 0.35));
        colocarMeme(b.base, pool[Math.floor(Math.random() * pool.length)]);
      }
    });
    setTimeout(() => toast('¡Bienvenido a ROBA EL MEME 3D! Compra tu primer meme en el centro.', 'info'), 1000);
  }
  // stock inicial de la tienda central
  aparecerEnTienda(D.MEMES.find(m => m.id === 'patito') || D.MEMES[0]);
  aparecerEnTienda(elegirDefTienda());
  aparecerEnTienda(elegirDefTienda());
  $('#uso-sonido').setAttribute('href', E.sonido ? '#i-son-on' : '#i-son-off');
  if (!E.sombras) aplicarSombras(false);
  if (!E.tutorialHecho) setTimeout(iniciarTutorial, 700);
  comprobarLogros();
  setTimeout(() => $('#cargando').classList.add('oculto'), 650);
  requestAnimationFrame(bucle);
}

let ultimoT = performance.now();
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = clamp((ahora - ultimoT) / 1000, 0, 0.05);
  ultimoT = ahora;
  tJuego += dt;
  actualizarJugador(dt);
  bots.forEach(b => actualizarBot(b, dt));
  acumEconomia += dt;
  while (acumEconomia >= 1) { acumEconomia -= 1; tickEconomia(); }
  actualizarTienda(dt);
  actualizarEventos();
  actualizarEscudosBase(dt);
  actualizarParticulas(dt);
  // animación de memes instalados
  bases.forEach(b => b.memesInstalados.forEach(m => {
    m.grupo.rotation.y = Math.sin(tJuego * 0.7 + m.fase) * 0.32;
    m.grupo.position.y = 0.8 + Math.abs(Math.sin(tJuego * 1.6 + m.fase)) * 0.06;
    if (m.grupo.userData.chispas) m.grupo.userData.chispas.rotation.y += dt * 2.2;
  }));
  // animación de memes en venta
  memesTienda.forEach(it => {
    it.grupo.position.y = it.pos.y + Math.sin(tJuego * 2 + it.grupo.userData.fase) * (it.flotante ? 0.25 : 0.12);
    it.grupo.rotation.y += dt * (it.flotante ? 1.6 : 0.55);
    if (it.grupo.userData.chispas) it.grupo.userData.chispas.rotation.y += dt * 2.2;
  });
  nubes.forEach(n => { n.position.x += n.userData.vel * dt; if (n.position.x > 88) n.position.x = -88; });
  actualizarCamara(dt);
  actualizarHUD();
  dibujarMinimapa();
  renderer.render(escena, camara);
  if (!window.__arranqueOK) window.__arranqueOK = true;
}

/* arranca cuando las fuentes estén listas (o tras 1,5 s) */
const fuentesListas = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
Promise.race([fuentesListas, new Promise(r => setTimeout(r, 1500))]).then(() => {
  try {
    iniciar();
  } catch (err) {
    window.__errores.push('inicio: ' + (err && err.message));
    console.error(err);
    const errEl = $('#error-webgl');
    errEl.classList.remove('oculto');
    errEl.querySelector('p').textContent = 'Error al iniciar el juego: ' + (err && err.message);
    $('#cargando').classList.add('oculto');
  }
});
})();
