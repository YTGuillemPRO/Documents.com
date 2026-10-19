/* ============================================================
   ¡ROBA EL MEME! · game.js
   Motor del juego: mundo, jugador, rivales con IA, economía,
   robos, escudos, eventos, logros, guardado y render canvas.

   Arquitectura (pensada para futuro multijugador):
     - ESTADO serializable (E, BASES[].memes, rivales)  → guardar()/cargar()
     - SIMULACIÓN (actualizar) sobre el estado
     - ENTRADAS (teclado/joystick) separadas de la IA (pensarRival)
     - RENDER (dibujar) solo lee el estado
   Ver la capa Net al final del archivo y el README.md.
   ============================================================ */
'use strict';

/* ---------- Constantes del mundo ---------- */
const MUNDO = { W: 1600, H: 1000 };
const PLAZA = { cx: 800, cy: 500, r: 250, anillo: 165, slots: 8 };
const CLAVE = 'robaElMeme.v1';
const GRACIA = 25;          // segundos iniciales sin robos de la IA

const BASES = [
  { id: 0, nombre: 'TÚ',          color: '#4f9df7', claro: '#bfe0ff', oscuro: '#2f6fb8', x: 70,   y: 690,  w: 360, h: 240, memes: [], escudo: 0, escudoCd: 0 },
  { id: 1, nombre: 'ROSA ROBO',   color: '#ff6fa5', claro: '#ffd3e4', oscuro: '#c74f7d', x: 70,   y: 70,   w: 360, h: 240, memes: [], escudo: 0, escudoCd: 0 },
  { id: 2, nombre: 'KEVIN-3000',  color: '#3ec6b8', claro: '#c2f0ea', oscuro: '#2b9488', x: 1170, y: 70,   w: 360, h: 240, memes: [], escudo: 0, escudoCd: 0 },
  { id: 3, nombre: 'DON AHORRO',  color: '#57b14b', claro: '#d2eccb', oscuro: '#3c7f34', x: 1170, y: 690,  w: 360, h: 240, memes: [], escudo: 0, escudoCd: 0 },
];

const CFG_RIVALES = [
  { id: 'rosa',  baseId: 1, personalidad: 'agresiva',    roboCd: 18, escudoP: 0.85 },
  { id: 'kevin', baseId: 2, personalidad: 'equilibrado', roboCd: 32, escudoP: 0.55 },
  { id: 'don',   baseId: 3, personalidad: 'ahorrador',   roboCd: 50, escudoP: 0.70 },
];

/* ---------- Globales ---------- */
let T = 0;                          // tiempo de juego (s)
let E = null;                       // estado persistente
const rivales = [];
let jugador = null;
let plazaMemes = [];                // Memes libres en la plaza
let uidCont = 0;
let queso = null;                   // entidad del evento "Queso Dorado"
const particulas = [];
const flotantes = [];
const cam = { escala: 1, ox: 0, oy: 0 };
let cv, cx;                         // canvas y contexto
const dom = {};                      // referencias DOM en caché
let accionObj = null;                // objetivo de la acción actual (E / botón)
let pausado = false, tutoAbierto = false;
let acumEcon = 0, acumSave = 0, acumChip = 0, spawnT = 3;
let ultimoAvisoLlena = -10;
let tiendaAbierta = false, pestActiva = 'mejoras';
let ventaPendiente = null;
const teclas = new Set();
let joyVec = { x: 0, y: 0 }, joyActivo = false;

/* ---------- Utilidades ---------- */
const azar = () => Math.random();
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function fmt(n){
  n = Math.max(0, n);
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace('.', ',') + ' MM';
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace('.', ',') + ' M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.', ',') + ' k';
  if (n >= 100 || Number.isInteger(n)) return Math.round(n).toString();
  return n.toFixed(1).replace('.', ',');
}
function mmss(t){
  const s = Math.max(0, Math.ceil(t));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function textoTiempo(s){
  if (s < 3600) return Math.floor(s / 60) + ' min';
  return Math.floor(s / 3600) + ' h ' + Math.floor((s % 3600) / 60) + ' min';
}
function centroBase(id){
  const b = BASES[id];
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}
function dentroBase(id, x, y){
  const b = BASES[id];
  return x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
}
function limitar(p){
  p.x = Math.max(40, Math.min(MUNDO.W - 40, p.x));
  p.y = Math.max(40, Math.min(MUNDO.H - 40, p.y));
}
function nivelMejora(id){ return E && E.mejoras[id] ? E.mejoras[id] : 0; }
function costeMejora(mj){ return Math.round(mj.base * Math.pow(mj.mult, nivelMejora(mj.id)) / 5) * 5; }
function capacidadBase(b){ return b.id === 0 ? 6 + 2 * nivelMejora('base') : 8; }
function baseLlena(id){ return BASES[id].memes.length >= capacidadBase(BASES[id]); }
function aplicarTamanoBase0(){
  BASES[0].w = 360 + 36 * nivelMejora('base');
  BASES[0].h = 240 + 26 * nivelMejora('base');
}
function posSlotBase(b, i){
  const cap = capacidadBase(b);
  const cols = Math.min(5, cap);
  const filas = Math.ceil(cap / cols);
  const col = i % cols, fila = Math.floor(i / cols);
  return {
    x: b.x + b.w / 2 + (col - (cols - 1) / 2) * 66,
    y: b.y + b.h / 2 + (fila - (filas - 1) / 2) * 62 + 6,
  };
}
function posMemeColocado(m){
  const b = BASES[m.baseId];
  return posSlotBase(b, b.memes.indexOf(m));
}
function posSlotPlaza(i){
  const ang = i * (Math.PI * 2 / PLAZA.slots) - Math.PI / 2;
  return { x: PLAZA.cx + Math.cos(ang) * PLAZA.anillo, y: PLAZA.cy + Math.sin(ang) * PLAZA.anillo };
}
function velocidadDe(p){
  let v = p === jugador ? 250 * (1 + 0.12 * nivelMejora('zapatos')) : p.velBase;
  if (p.llevando) v *= p === jugador ? Math.min(1, 0.7 + 0.075 * nivelMejora('guante')) : 0.78;
  if (p.turbo > 0) v *= 1.16;
  return v;
}
function sumarIps(b){
  let s = 0;
  for (const m of b.memes) s += MEME[m.tipo].ips;
  return s;
}
function costeDe(m){
  if (m.regalo) return 0;   // los regalos del tutorial son gratis
  return Math.round(MEME[m.tipo].precio * (m.descuento ? 0.4 : 1));
}
function fiebreActiva(){ return ev.fase === 'activa' && ev.tipo === 'fiebre'; }
function ipsEfectivaJugador(){
  return sumarIps(BASES[0]) * Math.pow(1.15, nivelMejora('grana')) * (fiebreActiva() ? 2 : 1);
}

/* ---------- Sonido (WebAudio generado, sin archivos) ---------- */
const Sonido = {
  activo: true, ctx: null,
  listo(){
    if (!this.ctx){
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return false; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return !!this.ctx;
  },
  tono(f, d = 0.12, tipo = 'square', v = 0.10, f2 = null, retraso = 0){
    if (!this.activo || !this.listo()) return;
    try {
      const t0 = this.ctx.currentTime + retraso;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = tipo;
      o.frequency.setValueAtTime(f, t0);
      if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + d);
      g.gain.setValueAtTime(v, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t0); o.stop(t0 + d + 0.03);
    } catch (e) { /* audio bloqueado por el navegador */ }
  },
  compra(){ this.tono(520, .08, 'square', .09); this.tono(780, .14, 'square', .09, null, .07); },
  moneda(){ this.tono(1180, .07, 'triangle', .08, 1600); },
  robo(){ this.tono(300, .2, 'sawtooth', .11, 120); },
  alarma(){ this.tono(880, .12, 'square', .09); this.tono(660, .12, 'square', .09, null, .14); this.tono(880, .12, 'square', .09, null, .28); },
  escudo(){ this.tono(220, .25, 'sine', .13, 440); },
  bloqueo(){ this.tono(140, .12, 'square', .11, 90); },
  nivel(){ [523, 659, 784, 1046].forEach((f, i) => this.tono(f, .14, 'triangle', .11, null, i * .09)); },
  logro(){ this.tono(660, .1, 'triangle', .10); this.tono(990, .2, 'triangle', .10, null, .1); },
  evento(){ this.tono(196, .3, 'sawtooth', .09, 392); this.tono(294, .3, 'sawtooth', .09, 588, .05); },
  recup(){ this.tono(440, .1, 'square', .09); this.tono(880, .15, 'square', .09, null, .08); },
  colocar(){ this.tono(392, .09, 'triangle', .09, 523); },
  queso(){ this.tono(880, .07, 'square', .08); this.tono(1320, .18, 'triangle', .11, null, .06); },
};

/* ---------- Estado persistente ---------- */
function estadoInicial(){
  return {
    v: 1, monedas: 30, nivel: 1, xp: 0, tiempo: 0,
    stats: { compras: 0, robos: 0, robosRecibidos: 0, recuperaciones: 0, bloqueos: 0, total: 0, quesos: 0, mejoras: 0 },
    mejoras: {}, logros: new Set(),
    ajustes: { sonido: true, particulas: 'alta', tutorialHecho: false },
  };
}

/* ---------- Guardar / cargar (localStorage) ---------- */
function serializar(){
  return {
    v: 1,
    monedas: E.monedas, nivel: E.nivel, xp: E.xp, tiempo: E.tiempo,
    stats: E.stats, mejoras: E.mejoras, logros: [...E.logros], ajustes: E.ajustes,
    memesJugador: BASES[0].memes.map(m => m.tipo),
    rivales: rivales.map(r => ({ id: r.id, monedas: r.monedas, memes: BASES[r.baseId].memes.map(m => m.tipo) })),
  };
}
function guardar(){
  try { localStorage.setItem(CLAVE, JSON.stringify(serializar())); }
  catch (e) { /* modo privado o almacenamiento lleno: se ignora */ }
}
function nuevoMemeColocado(baseId, tipo){
  return { uid: ++uidCont, tipo, estado: 'colocado', baseId, slotPlaza: null, regalo: false, descuento: false, nace: 0, origen: null };
}
function cargar(){
  let d = null;
  try { d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) { d = null; }
  if (!d || d.v !== 1) return false;
  try {
    E.monedas = Math.max(0, +d.monedas || 0);
    E.nivel = Math.max(1, +d.nivel || 1);
    E.xp = Math.max(0, +d.xp || 0);
    E.tiempo = Math.max(0, +d.tiempo || 0);
    Object.assign(E.stats, d.stats || {});
    E.mejoras = {};
    for (const k in (d.mejoras || {})){
      const mj = MEJORAS.find(m => m.id === k);
      if (mj) E.mejoras[k] = Math.min(mj.max, Math.max(0, +d.mejoras[k] || 0));
    }
    E.logros = new Set((d.logros || []).filter(id => LOGROS.some(L => L.id === id)));
    if (d.ajustes) Object.assign(E.ajustes, d.ajustes);
    (d.memesJugador || []).forEach(tipo => {
      if (MEME[tipo] && BASES[0].memes.length < 12) BASES[0].memes.push(nuevoMemeColocado(0, tipo));
    });
    (d.rivales || []).forEach(rd => {
      const r = rivales.find(x => x.id === rd.id);
      if (!r) return;
      r.monedas = Math.max(0, +rd.monedas || 0);
      (rd.memes || []).forEach(tipo => {
        if (MEME[tipo] && BASES[r.baseId].memes.length < 8) BASES[r.baseId].memes.push(nuevoMemeColocado(r.baseId, tipo));
      });
    });
    return true;
  } catch (e) { return false; }
}
function reiniciarPartida(){
  try { localStorage.removeItem(CLAVE); } catch (e) { /* sin almacenamiento */ }
  location.reload();
}

/* ---------- Creación de personajes ---------- */
function crearJugador(){
  const c = centroBase(0);
  jugador = {
    esJugador: true, nombre: 'TÚ', color: '#4f9df7', oscuro: '#2f6fb8', gorro: '#ffc93c',
    x: c.x, y: c.y, kbx: 0, kby: 0, mira: 1, fase: 0, moviendo: false, llevando: null, turbo: 0,
  };
}
function crearRivales(){
  rivales.length = 0;
  for (const cfg of CFG_RIVALES){
    const b = BASES[cfg.baseId];
    const c = centroBase(b.id);
    rivales.push({
      esRival: true, id: cfg.id, baseId: cfg.baseId, cfg,
      nombre: b.nombre, color: b.oscuro, oscuro: b.oscuro, claro: b.claro, gorro: b.color,
      x: c.x + (azar() - 0.5) * 80, y: c.y + (azar() - 0.5) * 60,
      kbx: 0, kby: 0, mira: 1, fase: azar() * 6, moviendo: false, llevando: null, turbo: 0,
      monedas: 0, velBase: 205 + Math.min(45, E.nivel * 3),
      estado: 'descanso', destino: { x: c.x, y: c.y },
      pensarT: azar() * 0.5, roboT: GRACIA + cfg.roboCd * azar(), chaseT: 0,
      objetivo: null, objetivoMeme: null, wanderT: 0, aburrido: 0,
    });
  }
}

/* ---------- Memes: aparición en la plaza ---------- */
function pesosRareza(){
  const s = nivelMejora('suerte');
  return [
    ['comun', Math.max(20, 52 - 7 * s)],
    ['raro', 30 + 2 * s],
    ['epico', 12 + 2.5 * s],
    ['legendario', 4.5 + 1.2 * s],
    ['mitico', 0.9 + 0.7 * s],
    ['secreto', 0.1 + 0.35 * s],
  ];
}
function elegirRarezaPonderada(pesos){
  let tot = 0;
  for (const e of pesos) tot += e[1];
  let r = azar() * tot;
  for (const e of pesos){ if ((r -= e[1]) <= 0) return e[0]; }
  return pesos[0][0];
}
function memeAleatorioDeRareza(rz){
  const lista = MEMES.filter(m => m.rareza === rz);
  return lista[Math.floor(azar() * lista.length)];
}
function tipoAleatorioPonderado(){ return memeAleatorioDeRareza(elegirRarezaPonderada(pesosRareza())).id; }
function elegirRarezaEspecial(){ // Memes de la OFERTA FLASH
  return elegirRarezaPonderada([['raro', 45], ['epico', 35], ['legendario', 15], ['mitico', 5]]);
}
function spawnPlaza(tipo, extra){
  const usados = new Set(plazaMemes.map(m => m.slotPlaza));
  const libres = [];
  for (let i = 0; i < PLAZA.slots; i++) if (!usados.has(i)) libres.push(i);
  if (!libres.length) return null;
  const m = {
    uid: ++uidCont, tipo, estado: 'libre', baseId: null,
    slotPlaza: libres[Math.floor(azar() * libres.length)],
    regalo: !!(extra && extra.regalo), descuento: !!(extra && extra.descuento),
    nace: T, origen: null,
  };
  plazaMemes.push(m);
  const p = posSlotPlaza(m.slotPlaza);
  anillo(p.x, p.y, RAREZAS[MEME[tipo].rareza].color);
  const rz = MEME[tipo].rareza;
  if (rz === 'secreto' || rz === 'mitico'){
    aviso('¡Ha aparecido un ' + RAREZAS[rz].nombre.toUpperCase() + ' en la plaza!', 'logro', 'i-estrella');
    Sonido.logro();
  }
  return m;
}
function actualizarPlaza(dt){
  spawnT -= dt;
  if (spawnT <= 0){
    spawnT = 6 + azar() * 6;
    if (plazaMemes.length < 6) spawnPlaza(tipoAleatorioPonderado(), {});
  }
  // Los comunes/raros sin comprar se van tras un rato (los regalos y ofertas se quedan)
  for (let i = plazaMemes.length - 1; i >= 0; i--){
    const m = plazaMemes[i];
    const rz = MEME[m.tipo].rareza;
    if (!m.regalo && !m.descuento && (rz === 'comun' || rz === 'raro') && T - m.nace > 50){
      const p = posSlotPlaza(m.slotPlaza);
      anillo(p.x, p.y, '#98a2ab');
      plazaMemes.splice(i, 1);
    }
  }
}

/* ---------- Memes: comprar, colocar, robar, recuperar, vender ---------- */
function comprarLibre(p, m){
  if (p.llevando || m.estado !== 'libre') return false;
  const b = BASES[p === jugador ? 0 : p.baseId];
  if (b.memes.length >= capacidadBase(b)){
    if (p === jugador){ aviso('¡Tu base está llena! Vende un Meme o amplíala (T)', 'warn', 'i-x'); Sonido.bloqueo(); }
    return false;
  }
  const coste = costeDe(m);
  const esJug = p === jugador;
  if ((esJug ? E.monedas : p.monedas) < coste){
    if (esJug){ aviso('Te faltan monedas para ' + MEME[m.tipo].nombre, 'warn', 'i-moneda'); Sonido.bloqueo(); }
    return false;
  }
  if (esJug){
    E.monedas -= coste; E.stats.compras++;
    ganarXP(3 + coste / 30);
    Sonido.compra();
    const pos = posSlotPlaza(m.slotPlaza);
    flotante(pos.x, pos.y - 40, '-' + fmt(coste), '#e2574c');
    aviso('¡' + MEME[m.tipo].nombre + ' es tuyo! Llévalo a tu base', 'ok', 'i-check');
  } else {
    p.monedas -= coste;
  }
  const pos = posSlotPlaza(m.slotPlaza);
  confeti(pos.x, pos.y, 12);
  plazaMemes.splice(plazaMemes.indexOf(m), 1);
  p.llevando = m; m.estado = 'transportado'; m.baseId = null; m.origen = null;
  chequearLogros(); guardar();
  return true;
}

function colocarMeme(p){
  const b = BASES[p === jugador ? 0 : p.baseId];
  if (b.memes.length >= capacidadBase(b)) return false;
  const m = p.llevando;
  if (!m) return false;
  p.llevando = null;
  m.estado = 'colocado'; m.baseId = b.id; m.origen = null;
  m.slotPlaza = null; m.regalo = false; m.descuento = false;
  b.memes.push(m);
  const pos = posMemeColocado(m);
  confeti(pos.x, pos.y, 14);
  anillo(pos.x, pos.y, RAREZAS[MEME[m.tipo].rareza].color);
  if (p === jugador){
    Sonido.colocar();
    ganarXP(2 + MEME[m.tipo].precio / 40);
    if (tiendaAbierta && pestActiva === 'inv') renderInv();
  }
  chequearLogros();
  return true;
}

function intentarRobo(p, m){
  const b = BASES[m.baseId];
  if (!b || m.estado !== 'colocado' || !b.memes.includes(m)) return false;
  const pos = posMemeColocado(m);
  // Escudo activo: robo bloqueado y empujón hacia fuera
  if (b.escudo > 0){
    if (b.id === 0){ E.stats.bloqueos++; chequearLogros(); }
    Sonido.bloqueo();
    if (p === jugador) aviso('¡La base de ' + b.nombre + ' está protegida por su escudo!', 'warn', 'i-escudo');
    const c = centroBase(b.id);
    const d = Math.hypot(p.x - c.x, p.y - c.y) || 1;
    p.kbx = (p.x - c.x) / d * 480;
    p.kby = (p.y - c.y) / d * 480;
    return false;
  }
  // Robo efectivo
  b.memes.splice(b.memes.indexOf(m), 1);
  p.llevando = m;
  m.estado = 'transportado'; m.baseId = null; m.origen = b.id;
  anillo(pos.x, pos.y, '#e2574c');
  if (p === jugador){
    E.stats.robos++;
    ganarXP(20 + MEME[m.tipo].precio / 150);
    Sonido.robo();
    aviso('¡Has robado a ' + MEME[m.tipo].nombre + ' de la base de ' + b.nombre + '! ¡Corre a tu base!', 'ok', 'i-rayo');
  } else if (b.id === 0){
    E.stats.robosRecibidos++;
    Sonido.alarma();
    aviso('¡' + p.nombre + ' te ha robado a ' + MEME[m.tipo].nombre + '! Tócalo para recuperarlo', 'warn', 'i-escudo');
  }
  return true;
}

/* El dueño original recupera su Meme tocando al ladrón que lo lleva */
function intentarRecuperar(a, b){
  const m = b.llevando;
  if (!m || m.origen === null || m.origen === undefined || a.llevando) return;
  const miBase = a === jugador ? 0 : a.baseId;
  if (m.origen !== miBase) return;
  if (dist(a, b) > 46) return;
  b.llevando = null;
  a.llevando = m;
  m.origen = null;
  a.turbo = 0; b.turbo = 0;
  anillo(a.x, a.y - 30, '#57b14b');
  if (a === jugador){
    E.stats.recuperaciones++;
    ganarXP(40);
    Sonido.recup();
    aviso('¡Has recuperado a ' + MEME[m.tipo].nombre + '! Llévalo a tu base', 'ok', 'i-check');
    chequearLogros();
  } else if (b === jugador){
    Sonido.alarma();
    aviso(a.nombre + ' te ha quitado a ' + MEME[m.tipo].nombre, 'warn', 'i-x');
  }
}

function colisionesPersonajes(){
  const todos = [jugador, ...rivales];
  for (let i = 0; i < todos.length; i++){
    for (let j = i + 1; j < todos.length; j++){
      const a = todos[i], b = todos[j];
      intentarRecuperar(a, b);
      intentarRecuperar(b, a);
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d < 44 && d > 0.001){
        const empuje = (44 - d) / 2, nx = dx / d, ny = dy / d;
        a.x -= nx * empuje; a.y -= ny * empuje;
        b.x += nx * empuje; b.y += ny * empuje;
      }
    }
  }
}

/* La IA vende su Meme más flojo para hacer hueco */
function venderPeorMeme(b){
  if (!b.memes.length) return;
  const peor = b.memes.reduce((a, m) => MEME[m.tipo].ips < MEME[a.tipo].ips ? m : a);
  b.memes.splice(b.memes.indexOf(peor), 1);
  const duenio = rivales.find(r => r.baseId === b.id);
  if (duenio) duenio.monedas += Math.round(MEME[peor.tipo].precio * 0.5);
}

/* ---------- Economía, XP y niveles ---------- */
function xpNecesario(n){ return Math.round(40 * Math.pow(n, 1.35)); }

function ganarXP(n){
  E.xp += n;
  while (E.xp >= xpNecesario(E.nivel)){
    E.xp -= xpNecesario(E.nivel);
    E.nivel++;
    const premio = 60 * E.nivel;
    E.monedas += premio;
    E.stats.total += premio;
    aviso('¡NIVEL ' + E.nivel + '! Recompensa: +' + fmt(premio) + ' monedas', 'logro', 'i-estrella');
    Sonido.nivel();
    confeti(jugador.x, jugador.y - 30, 30);
    for (const r of rivales) r.velBase = 205 + Math.min(45, E.nivel * 3);
  }
}

function tickSegundo(){
  // Ingresos del jugador
  const mult = Math.pow(1.15, nivelMejora('grana'));
  const gana = sumarIps(BASES[0]) * mult * (fiebreActiva() ? 2 : 1);
  if (gana > 0){
    E.monedas += gana;
    E.stats.total += gana;
    const c = centroBase(0);
    flotante(c.x + (azar() - 0.5) * 80, c.y - 24, '+' + fmt(gana), '#ffd23f');
    ganarXP(gana * 0.05);
  }
  // Ingresos de los rivales (algo menores, con goma elástica si van muy por detrás)
  for (const r of rivales){
    const ipsR = sumarIps(BASES[r.baseId]);
    const goma = sumarIps(BASES[0]) * mult > ipsR * 1.8 ? 1.3 : 1;
    r.monedas += ipsR * 0.9 * goma * (fiebreActiva() ? 2 : 1);
  }
  E.tiempo++;
  actualizarRanking();
  chequearLogros();
}

/* ---------- Logros ---------- */
function instantaneaStats(){
  return {
    ...E.stats,
    colocados: BASES[0].memes.length,
    ips: ipsEfectivaJugador(),
    nivel: E.nivel,
    mejorRareza: BASES[0].memes.reduce((mx, m) => Math.max(mx, ORDEN_RAREZA.indexOf(MEME[m.tipo].rareza)), -1),
    mejoras: Object.values(E.mejoras).reduce((a, b) => a + b, 0),
  };
}
function chequearLogros(){
  const s = instantaneaStats();
  for (const L of LOGROS){
    if (E.logros.has(L.id)) continue;
    let ok = false;
    try { ok = L.cond(s); } catch (e) { ok = false; }
    if (ok){
      E.logros.add(L.id);
      E.monedas += L.monedas;
      E.stats.total += L.monedas;
      aviso('¡Logro conseguido: ' + L.nombre + '! +' + fmt(L.monedas) + ' monedas', 'logro', 'i-trofeo');
      Sonido.logro();
      confeti(jugador.x, jugador.y - 30, 26);
      guardar();
      if (tiendaAbierta && pestActiva === 'logros') renderLogros();
    }
  }
}

/* ---------- Eventos especiales con cuenta atrás ---------- */
const EVENTOS = {
  oferta: { titulo: '¡OFERTA FLASH!', sub: '3 Memes raros al 60% de descuento en la plaza', dur: 25 },
  fiebre: { titulo: '¡FIEBRE DEL ORO!', sub: 'Ingresos x2 para todos durante 30 segundos', dur: 30 },
  queso:  { titulo: '¡QUESO DORADO!', sub: 'Atrápalo antes de que escape: gran recompensa', dur: 20 },
};
const ev = { fase: 'espera', t: 75, tipo: null };

function actualizarEventos(dt){
  ev.t -= dt;
  if (ev.fase === 'espera'){
    if (ev.t <= 0){
      ev.tipo = ['oferta', 'fiebre', 'queso'][Math.floor(azar() * 3)];
      ev.fase = 'anuncio';
      ev.t = 4;
      const d = EVENTOS[ev.tipo];
      anunciar(d.titulo, d.sub);
      Sonido.evento();
    }
  } else if (ev.fase === 'anuncio'){
    if (ev.t <= 0){
      ev.fase = 'activa';
      ev.t = EVENTOS[ev.tipo].dur;
      iniciarEvento(ev.tipo);
    }
  } else {
    actualizarQueso(dt);
    if (ev.t <= 0){
      terminarEvento();
      ev.fase = 'espera';
      ev.tipo = null;
      ev.t = 70 + azar() * 50;
    }
  }
}
function iniciarEvento(tipo){
  if (tipo === 'oferta'){
    let n = 0;
    while (n < 3 && plazaMemes.length < PLAZA.slots){
      spawnPlaza(memeAleatorioDeRareza(elegirRarezaEspecial()).id, { descuento: true });
      n++;
    }
    aviso('¡Memes en oferta esperando en la plaza!', 'logro', 'i-carrito');
  } else if (tipo === 'queso'){
    queso = { x: PLAZA.cx, y: PLAZA.cy, t: 0 };
  }
}
function terminarEvento(){
  if (ev.tipo === 'oferta'){
    for (const m of plazaMemes.filter(m => m.descuento)){
      const p = posSlotPlaza(m.slotPlaza);
      anillo(p.x, p.y, '#98a2ab');
    }
    plazaMemes = plazaMemes.filter(m => !m.descuento);
  }
  queso = null;
}

/* El Queso Dorado huye del personaje más cercano */
function actualizarQueso(dt){
  if (!queso) return;
  queso.t += dt;
  let cxp = 0, cyp = 0, md = 1e9;
  for (const p of [jugador, ...rivales]){
    const d = dist(p, queso);
    if (d < md){ md = d; cxp = p.x; cyp = p.y; }
  }
  let dx = queso.x - cxp, dy = queso.y - cyp;
  const d = Math.hypot(dx, dy) || 1;
  dx = dx / d + Math.sin(queso.t * 3.3) * 0.6;
  dy = dy / d + Math.cos(queso.t * 2.7) * 0.6;
  const n = Math.hypot(dx, dy) || 1;
  queso.x = Math.max(60, Math.min(MUNDO.W - 60, queso.x + dx / n * 300 * dt));
  queso.y = Math.max(60, Math.min(MUNDO.H - 60, queso.y + dy / n * 300 * dt));
  if (md < 52){
    const premio = 600 + E.nivel * 120;
    E.monedas += premio;
    E.stats.total += premio;
    E.stats.quesos++;
    flotante(queso.x, queso.y - 34, '+' + fmt(premio), '#ffd23f');
    confeti(queso.x, queso.y, 30);
    Sonido.queso();
    aviso('¡Queso Dorado capturado! +' + fmt(premio) + ' monedas', 'logro', 'i-trofeo');
    ganarXP(60);
    queso = null;
    chequearLogros();
    guardar();
  }
}

/* ---------- Partículas y textos flotantes ---------- */
function confeti(x, y, n = 18){
  if (E.ajustes.particulas === 'baja') n = Math.max(3, Math.round(n * 0.4));
  const colores = ['#ffc93c', '#e2574c', '#57b14b', '#4f9df7', '#ff6fa5', '#3ec6b8'];
  for (let i = 0; i < n; i++){
    particulas.push({
      tipo: 'c', x, y,
      vx: (azar() - 0.5) * 300, vy: -azar() * 230 - 70, g: 520,
      vida: 0.8 + azar() * 0.6, edad: 0,
      color: colores[i % colores.length], tam: 5 + azar() * 4,
      rot: azar() * 6, vr: (azar() - 0.5) * 12,
    });
  }
}
function anillo(x, y, color){
  if (particulas.length > 160) particulas.shift();
  particulas.push({ tipo: 'a', x, y, vida: 0.5, edad: 0, color, r: 12 });
}
function flotante(x, y, txt, color){
  if (flotantes.length > 40) flotantes.shift();
  flotantes.push({ x, y, txt, color, vida: 1.25, edad: 0 });
}
function actualizarParticulas(dt){
  for (let i = particulas.length - 1; i >= 0; i--){
    const p = particulas[i];
    p.edad += dt;
    if (p.edad >= p.vida){ particulas.splice(i, 1); continue; }
    if (p.tipo === 'c'){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.rot += p.vr * dt; }
    else { p.r += 90 * dt; }
  }
  for (let i = flotantes.length - 1; i >= 0; i--){
    const f = flotantes[i];
    f.edad += dt;
    if (f.edad >= f.vida) flotantes.splice(i, 1);
  }
}

/* ---------- Escudos ---------- */
function activarEscudo(b){
  if (!b || b.escudo > 0 || b.escudoCd > 0) return;
  b.escudo = b.id === 0 ? 8 + 3 * nivelMejora('escudo') : 5 + Math.min(15, E.nivel * 0.4);
  b.escudoCd = 30;
  const c = centroBase(b.id);
  anillo(c.x, c.y, '#7fd8ff');
  if (b.id === 0){ Sonido.escudo(); aviso('¡Escudo activado! Tus Memes están protegidos', 'ok', 'i-escudo'); }
}
function botonEscudo(){
  const b = BASES[0];
  if (b.escudo > 0){
    b.escudo = 0;                        // desactivar antes de tiempo
    Sonido.bloqueo();
    aviso('Escudo desactivado', 'info', 'i-escudo');
    return;
  }
  if (b.escudoCd > 0) return;
  activarEscudo(b);
}

/* ---------- IA de los rivales ----------
   Estados: descanso · comprar · robar · perseguir · volver        */
function ladronDeMiMeme(r){
  for (const a of [jugador, ...rivales]){
    if (a !== r && a.llevando && a.llevando.origen === r.baseId) return a;
  }
  return null;
}
function intrusoEnBase(b){
  for (const a of [jugador, ...rivales]){
    const miBase = a === jugador ? 0 : a.baseId;
    if (miBase !== b.id && dentroBase(b.id, a.x, a.y)) return true;
  }
  return false;
}
function elegirRobo(r){
  const cand = [];
  for (const b of BASES){
    if (b.id === r.baseId || !b.memes.length || b.escudo > 0) continue;
    const mejor = b.memes.reduce((a, m) => MEME[m.tipo].ips > MEME[a.tipo].ips ? m : a);
    cand.push({ b, m: mejor });
  }
  if (!cand.length) return null;
  let ele = null;
  if (r.cfg.personalidad === 'agresiva'){
    const pc = cand.find(c => c.b.id === 0);
    ele = (pc && azar() < 0.75) ? pc : cand[Math.floor(azar() * cand.length)];
  } else if (r.cfg.personalidad === 'ahorrador'){
    cand.sort((x, y) => MEME[y.m.tipo].ips - MEME[x.m.tipo].ips);
    ele = MEME[cand[0].m.tipo].ips >= 8 ? cand[0] : null;   // solo caza piezas valiosas
  } else {
    ele = cand[Math.floor(azar() * cand.length)];
  }
  return ele ? ele.m : null;
}
function elegirCompra(r){
  let candidatos = plazaMemes.filter(m => !m.regalo && r.monedas >= costeDe(m));
  if (!candidatos.length) return null;
  if (r.cfg.personalidad === 'agresiva'){
    const buenos = candidatos.filter(m => ['epico', 'legendario', 'mitico', 'secreto'].includes(MEME[m.tipo].rareza));
    if (buenos.length) candidatos = buenos;
  }
  return candidatos.reduce((a, m) => MEME[m.tipo].ips > MEME[a.tipo].ips ? m : a);
}
function puntoVaguear(r){
  const c = centroBase(r.baseId);
  if (azar() < 0.6){
    return {
      x: Math.max(60, Math.min(MUNDO.W - 60, c.x + (azar() - 0.5) * 460)),
      y: Math.max(60, Math.min(MUNDO.H - 60, c.y + (azar() - 0.5) * 360)),
    };
  }
  const ang = azar() * Math.PI * 2;
  return { x: PLAZA.cx + Math.cos(ang) * (PLAZA.r + 60), y: PLAZA.cy + Math.sin(ang) * (PLAZA.r + 60) };
}

function pensarRival(r){
  // 1) Si llevo un Meme, vuelvo a mi base
  if (r.llevando){ r.estado = 'volver'; r.destino = centroBase(r.baseId); return; }
  // 2) Si me han robado, persigo al ladrón
  const ladron = ladronDeMiMeme(r);
  if (ladron){
    if (r.estado !== 'perseguir'){ r.estado = 'perseguir'; r.chaseT = 12; }
    r.objetivo = ladron;
    return;
  } else if (r.estado === 'perseguir'){
    r.estado = 'descanso'; r.objetivo = null;
  }
  // 3) Escudo reactivo si entra un intruso
  const miBase = BASES[r.baseId];
  if (miBase.escudo <= 0 && miBase.escudoCd <= 0 && intrusoEnBase(miBase) && azar() < r.cfg.escudoP){
    activarEscudo(miBase);
  }
  // 3b) Misión en curso: se mantiene mientras siga siendo válida
  //     (así un robo o compra decidida no se sobrescribe al pensar de nuevo)
  if (r.estado === 'robar'){
    const m = r.objetivoMeme;
    if (m && m.estado === 'colocado' && m.baseId !== r.baseId && BASES[m.baseId].memes.includes(m)) return;
    r.estado = 'descanso'; r.objetivoMeme = null;
  }
  if (r.estado === 'comprar'){
    const m = r.objetivoMeme;
    if (m && m.estado === 'libre' && !m.regalo && plazaMemes.includes(m) && r.monedas >= costeDe(m)) return;
    r.estado = 'descanso'; r.objetivoMeme = null;
  }
  // 4) Robo programado (con cooldown según personalidad). Aunque su base
  //    esté llena, roba si la pieza merece la pena: al volver vende su peor
  //    Meme para hacerle hueco (ver colocarMeme/venderPeorMeme).
  if (T > GRACIA && T > r.roboT){
    const obj = elegirRobo(r);
    if (obj){
      r.estado = 'robar';
      r.objetivoMeme = obj;
      r.aburrido = 0;
      r.roboT = T + r.cfg.roboCd * (0.8 + azar() * 0.4);
      return;
    }
  }
  // 5) Comprar en la plaza
  const compra = elegirCompra(r);
  if (compra){ r.estado = 'comprar'; r.objetivoMeme = compra; return; }
  // 6) Descansar / deambular
  if (r.estado !== 'descanso' || r.wanderT <= 0 || dist(r, r.destino) < 30){
    r.estado = 'descanso';
    r.destino = puntoVaguear(r);
    r.wanderT = 3 + azar() * 4;
  }
}

function actualizarRival(r, dt){
  r.pensarT -= dt;
  if (r.pensarT <= 0){ r.pensarT = 0.35 + azar() * 0.2; pensarRival(r); }
  r.wanderT -= dt;
  if (r.turbo > 0) r.turbo -= dt;

  let destino = null;
  switch (r.estado){
    case 'volver':
      destino = centroBase(r.baseId);
      break;
    case 'perseguir': {
      const o = r.objetivo;
      if (o && o.llevando && o.llevando.origen === r.baseId){
        destino = o;
        r.turbo = 0.2;
        r.chaseT -= dt;
        if (r.chaseT <= 0){ r.estado = 'descanso'; r.objetivo = null; }   // se rinde
      } else {
        r.estado = 'descanso'; r.objetivo = null;
      }
      break;
    }
    case 'comprar': {
      const m = r.objetivoMeme;
      if (m && m.estado === 'libre' && plazaMemes.includes(m) && r.monedas >= costeDe(m)){
        destino = posSlotPlaza(m.slotPlaza);
        if (dist(r, destino) < 62){
          if (comprarLibre(r, m)) r.estado = 'volver';
          else { r.estado = 'descanso'; r.objetivoMeme = null; }
        }
      } else {
        r.estado = 'descanso'; r.objetivoMeme = null;
      }
      break;
    }
    case 'robar': {
      const m = r.objetivoMeme;
      const b = (m && m.estado === 'colocado') ? BASES[m.baseId] : null;
      if (b && b.memes.includes(m) && m.baseId !== r.baseId){
        if (b.escudo > 0){
          // espera fuera de la base a que caiga el escudo (hasta 9 segundos)
          r.aburrido += dt;
          const c = centroBase(b.id);
          destino = { x: c.x + (r.x < c.x ? -(b.w / 2 + 90) : b.w / 2 + 90), y: c.y };
          if (r.aburrido > 9){ r.estado = 'descanso'; r.objetivoMeme = null; }
        } else {
          destino = posMemeColocado(m);
          if (dist(r, destino) < 62){
            intentarRobo(r, m);
            r.estado = r.llevando ? 'volver' : 'descanso';
            r.objetivoMeme = null;
          }
        }
      } else {
        r.estado = 'descanso'; r.objetivoMeme = null;
      }
      break;
    }
    default:
      destino = r.destino;
  }

  if (destino){
    const dx = destino.x - r.x, dy = destino.y - r.y;
    const d = Math.hypot(dx, dy);
    if (d > 6){
      const v = velocidadDe(r);
      r.x += dx / d * v * dt;
      r.y += dy / d * v * dt;
      r.moviendo = true;
      r.mira = dx >= 0 ? 1 : -1;
      r.fase += v * dt * 0.05;
    } else r.moviendo = false;
  } else r.moviendo = false;

  // Inercia del empujón y límites del mundo
  r.x += r.kbx * dt; r.y += r.kby * dt;
  r.kbx *= Math.max(0, 1 - 6 * dt); r.kby *= Math.max(0, 1 - 6 * dt);
  limitar(r);

  // Al llegar a su base con un Meme, lo coloca (y si está llena, vende el peor)
  if (r.llevando && dentroBase(r.baseId, r.x, r.y)){
    if (!colocarMeme(r)){
      venderPeorMeme(BASES[r.baseId]);
      colocarMeme(r);
    }
  }
}

/* ---------- Interacción del jugador (botón grande / tecla E) ---------- */
function refrescarAccion(){
  let obj = null, mejor = 1e9;
  if (!jugador.llevando){
    for (const m of plazaMemes){
      const p = posSlotPlaza(m.slotPlaza);
      const d = dist(jugador, p);
      if (d < 80 && d < mejor){ mejor = d; obj = { tipo: 'comprar', m }; }
    }
    for (const b of BASES){
      if (b.id === 0) continue;
      for (const m of b.memes){
        const p = posMemeColocado(m);
        const d = dist(jugador, p);
        if (d < 80 && d < mejor){
          mejor = d;
          obj = b.escudo > 0 ? { tipo: 'protegida' } : { tipo: 'robar', m };
        }
      }
    }
  }
  accionObj = obj;

  // Pintar el botón según el contexto
  let etiqueta = '…', activo = false;
  if (jugador.llevando){
    etiqueta = '¡A TU BASE!';
  } else if (obj){
    if (obj.tipo === 'protegida') etiqueta = 'PROTEGIDA';
    else if (obj.tipo === 'comprar'){
      const m = obj.m;
      if (baseLlena(0)) etiqueta = 'BASE LLENA';
      else if (m.regalo){ etiqueta = 'COGER REGALO'; activo = true; }
      else if (E.monedas >= costeDe(m)){ etiqueta = 'COMPRAR · ' + fmt(costeDe(m)); activo = true; }
      else etiqueta = 'FALTAN ' + fmt(costeDe(m) - E.monedas);
    } else if (obj.tipo === 'robar'){
      if (baseLlena(0)) etiqueta = 'BASE LLENA';
      else { etiqueta = '¡ROBAR!'; activo = true; }
    }
  }
  if (dom.accionTxt && dom.accionTxt.textContent !== etiqueta) dom.accionTxt.textContent = etiqueta;
  if (dom.btnAccion) dom.btnAccion.disabled = !activo;
}
function ejecutarAccion(){
  if (!accionObj) return;
  if (accionObj.tipo === 'comprar') comprarLibre(jugador, accionObj.m);
  else if (accionObj.tipo === 'robar') intentarRobo(jugador, accionObj.m);
}

/* ---------- Bucle de simulación ---------- */
function actualizar(dt){
  T += dt;
  // Escudos y cooldowns
  for (const b of BASES){
    if (b.escudo > 0) b.escudo = Math.max(0, b.escudo - dt);
    if (b.escudoCd > 0) b.escudoCd = Math.max(0, b.escudoCd - dt);
  }
  // Entrada del jugador (teclado + joystick)
  let ix = 0, iy = 0;
  if (teclas.has('w') || teclas.has('arrowup')) iy -= 1;
  if (teclas.has('s') || teclas.has('arrowdown')) iy += 1;
  if (teclas.has('a') || teclas.has('arrowleft')) ix -= 1;
  if (teclas.has('d') || teclas.has('arrowright')) ix += 1;
  ix += joyVec.x; iy += joyVec.y;
  const mag = Math.hypot(ix, iy);
  if (mag > 0.15){
    if (mag > 1){ ix /= mag; iy /= mag; }
    const v = velocidadDe(jugador);
    jugador.x += ix * v * dt;
    jugador.y += iy * v * dt;
    jugador.moviendo = true;
    jugador.mira = ix >= 0 ? 1 : -1;
    jugador.fase += v * dt * 0.05;
  } else {
    jugador.moviendo = false;
  }
  if (jugador.turbo > 0) jugador.turbo -= dt;
  jugador.x += jugador.kbx * dt; jugador.y += jugador.kby * dt;
  jugador.kbx *= Math.max(0, 1 - 6 * dt); jugador.kby *= Math.max(0, 1 - 6 * dt);
  limitar(jugador);

  // Al entrar en mi base con un Meme, se coloca solo
  if (jugador.llevando && dentroBase(0, jugador.x, jugador.y)){
    if (!colocarMeme(jugador) && T - ultimoAvisoLlena > 4){
      ultimoAvisoLlena = T;
      aviso('¡Base llena! Vende Memes o amplíala en la tienda (T)', 'warn', 'i-x');
    }
  }

  for (const r of rivales) actualizarRival(r, dt);
  colisionesPersonajes();

  // Economía (un tic por segundo)
  acumEcon += dt;
  while (acumEcon >= 1){ acumEcon -= 1; tickSegundo(); }

  actualizarPlaza(dt);
  actualizarEventos(dt);
  actualizarParticulas(dt);
  refrescarAccion();
  actualizarHUD();

  // Autoguardado
  acumSave += dt;
  if (acumSave > 5){ acumSave = 0; guardar(); }
  acumChip += dt;
  if (acumChip > 0.25){ acumChip = 0; actualizarChipEvento(); }
}

/* ---------- Render (Canvas 2D) ---------- */
function redimensionar(){
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(innerWidth * dpr);
  cv.height = Math.round(innerHeight * dpr);
  cv.style.width = innerWidth + 'px';
  cv.style.height = innerHeight + 'px';
  cam.escala = Math.min(cv.width / MUNDO.W, cv.height / MUNDO.H);
  cam.ox = (cv.width - MUNDO.W * cam.escala) / 2;
  cam.oy = (cv.height - MUNDO.H * cam.escala) / 2;
}

function etiquetaTexto(c, x, y, texto, fondo, color, fuente, pad){
  pad = pad || 7;
  c.font = fuente;
  const w = c.measureText(texto).width + pad * 2;
  // Que la etiqueta no se salga del mundo (bordes derecho/izquierdo)
  x = Math.max(w / 2 + 6, Math.min(MUNDO.W - w / 2 - 6, x));
  c.save();
  rrect(c, x - w / 2, y - 10, w, 20, 10);
  c.globalAlpha = 0.94;
  c.fillStyle = fondo; c.fill();
  c.globalAlpha = 1;
  c.lineWidth = 2.5; c.strokeStyle = TINTA; c.stroke();
  c.fillStyle = color;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(texto, x, y + 1);
  c.restore();
}

function dibujarSuelo(c){
  c.fillStyle = '#7cbf56';
  c.fillRect(0, 0, MUNDO.W, MUNDO.H);
  c.fillStyle = '#74b650';
  for (let gx = 0; gx < 16; gx++)
    for (let gy = 0; gy < 10; gy++)
      if ((gx + gy) % 2 === 0) c.fillRect(gx * 100, gy * 100, 100, 100);
  // Seto perimetral
  c.lineWidth = 26; c.strokeStyle = '#3f7a33';
  c.strokeRect(13, 13, MUNDO.W - 26, MUNDO.H - 26);
  // Flores fijas
  const fl = [[300, 320], [1200, 330], [260, 760], [1230, 780], [620, 190], [980, 850], [500, 570], [1090, 440], [860, 130], [420, 880]];
  for (const f of fl){
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++){
      const a = i * Math.PI * 2 / 5;
      c.beginPath(); c.arc(f[0] + Math.cos(a) * 5, f[1] + Math.sin(a) * 5, 3.4, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#ffd23f';
    c.beginPath(); c.arc(f[0], f[1], 3, 0, Math.PI * 2); c.fill();
  }
}
function dibujarCaminos(c){
  c.lineCap = 'round';
  c.strokeStyle = '#e8d5a3'; c.lineWidth = 64;
  for (const b of BASES){
    const c0 = centroBase(b.id);
    c.beginPath(); c.moveTo(c0.x, c0.y); c.lineTo(PLAZA.cx, PLAZA.cy); c.stroke();
  }
  // Línea discontinua animada (efecto cinta transportadora)
  c.setLineDash([24, 18]);
  c.lineDashOffset = -T * 50;
  c.strokeStyle = '#cdb37e'; c.lineWidth = 5;
  for (const b of BASES){
    const c0 = centroBase(b.id);
    c.beginPath(); c.moveTo(c0.x, c0.y); c.lineTo(PLAZA.cx, PLAZA.cy); c.stroke();
  }
  c.setLineDash([]);
}
function dibujarPlaza(c){
  c.fillStyle = '#f0dcae';
  c.beginPath(); c.arc(PLAZA.cx, PLAZA.cy, PLAZA.r, 0, Math.PI * 2); c.fill();
  c.lineWidth = 10; c.strokeStyle = '#d9bd7c'; c.stroke();
  // Anillo giratorio
  c.save();
  c.setLineDash([26, 16]);
  c.lineDashOffset = -T * 70;
  c.lineWidth = 7; c.strokeStyle = '#c9ab5f';
  c.beginPath(); c.arc(PLAZA.cx, PLAZA.cy, PLAZA.anillo, 0, Math.PI * 2); c.stroke();
  c.restore();
  // Monumento central: la Estrella del Meme
  caja(c, PLAZA.cx - 26, PLAZA.cy - 12, 52, 36, '#d9bd7c', 8);
  trazo(c);
  c.beginPath(); c.moveTo(PLAZA.cx - 20, PLAZA.cy + 6); c.lineTo(PLAZA.cx - 20, PLAZA.cy + 24);
  c.moveTo(PLAZA.cx + 20, PLAZA.cy + 6); c.lineTo(PLAZA.cx + 20, PLAZA.cy + 24); c.stroke();
  estrella(c, PLAZA.cx, PLAZA.cy - 30, 22, '#ffd23f');
}

function dibujarMemeEn(c, m, x, y, escala){
  escala = escala || 1;
  const mm = MEME[m.tipo], rz = RAREZAS[mm.rareza];
  c.save();
  c.translate(x, y + Math.sin(T * 2.6 + m.uid * 1.7) * 3.5);
  c.globalAlpha = 0.26;
  c.fillStyle = rz.color;
  c.beginPath(); c.arc(0, 4, 30 * escala, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  if (rz.arcoiris){
    trazo(c);
    c.strokeStyle = 'hsl(' + ((T * 90) % 360) + ',90%,60%)';
    c.lineWidth = 3.5;
    c.beginPath(); c.arc(0, 4, 31 * escala, 0, Math.PI * 2); c.stroke();
  }
  c.scale(escala, escala);
  mm.dibujo(c, T);
  c.restore();
  etiquetaTexto(c, x, y + 44 * escala, mm.nombre, '#ffffff', TINTA, '900 10.5px Nunito, sans-serif', 6);
}

function dibujarBase(c, b){
  // Plataforma
  rrect(c, b.x, b.y, b.w, b.h, 20);
  c.fillStyle = b.claro; c.fill();
  c.lineWidth = 7; c.strokeStyle = b.oscuro; c.stroke();
  rrect(c, b.x + 10, b.y + 10, b.w - 20, b.h - 20, 14);
  c.lineWidth = 2.5; c.strokeStyle = 'rgba(43,33,28,.22)'; c.stroke();
  // Huecos libres
  const cap = capacidadBase(b);
  c.save();
  c.setLineDash([7, 7]);
  c.lineWidth = 2; c.strokeStyle = 'rgba(43,33,28,.30)';
  for (let i = b.memes.length; i < cap; i++){
    const p = posSlotBase(b, i);
    c.beginPath(); c.arc(p.x, p.y, 17, 0, Math.PI * 2); c.stroke();
  }
  c.restore();
  // Memes colocados
  for (const m of b.memes){
    const p = posMemeColocado(m);
    dibujarMemeEn(c, m, p.x, p.y, 0.92);
  }
  // Placa con nombre e ingresos
  const cxp = b.x + b.w / 2;
  etiquetaTexto(c, cxp, b.y - 28, b.nombre, b.color, '#ffffff', '400 15px "Lilita One", sans-serif', 10);
  etiquetaTexto(c, cxp, b.y - 6, '+' + fmt(sumarIps(b)) + '/s', '#fff6e3', TINTA, '900 11px Nunito, sans-serif', 7);
  // Cúpula del escudo
  if (b.escudo > 0){
    c.save();
    c.beginPath();
    c.ellipse(cxp, b.y + b.h / 2, b.w / 2 + 14, b.h / 2 + 20, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(127,216,255,.16)'; c.fill();
    c.lineWidth = 4; c.strokeStyle = '#7fd8ff'; c.stroke();
    c.setLineDash([10, 12]);
    c.lineDashOffset = -T * 40;
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.7)';
    c.beginPath(); c.ellipse(cxp, b.y + b.h / 2, b.w / 2 + 8, b.h / 2 + 14, 0, 0, Math.PI * 2); c.stroke();
    c.restore();
    etiquetaTexto(c, cxp, b.y - 52, Math.ceil(b.escudo) + 's', '#7fd8ff', '#0c312d', '900 11px Nunito, sans-serif', 6);
  }
}

function dibujarMemesLibres(c){
  for (const m of plazaMemes){
    const p = posSlotPlaza(m.slotPlaza);
    dibujarMemeEn(c, m, p.x, p.y, 1);
    const txt = m.regalo ? '¡REGALO!' : fmt(costeDe(m));
    etiquetaTexto(
      c, p.x, p.y - 56, txt,
      m.regalo ? '#57b14b' : (m.descuento ? '#e2574c' : '#ffd23f'),
      (m.regalo || m.descuento) ? '#ffffff' : TINTA,
      '900 12px Nunito, sans-serif', 8
    );
    if (m.descuento) etiquetaTexto(c, p.x, p.y - 76, '-60%', '#e2574c', '#ffffff', '900 10px Nunito, sans-serif', 5);
  }
}

function dibujarQueso(c){
  if (!queso) return;
  c.save();
  c.translate(queso.x, queso.y);
  const s = 1.1 + Math.sin(T * 6) * 0.06;
  c.scale(s, s);
  c.globalAlpha = 0.35;
  c.fillStyle = '#ffd23f';
  c.beginPath(); c.arc(0, 0, 36, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  MEME.queso.dibujo(c, T);
  c.restore();
  etiquetaTexto(c, queso.x, queso.y - 54, '¡ATRAPA!', '#ff6fa5', '#ffffff', '400 13px "Lilita One", sans-serif', 8);
}

function dibujarPersona(c, p){
  const paso = p.moviendo ? Math.sin(p.fase) * 6 : 0;
  c.save();
  c.translate(p.x, p.y);
  // Sombra
  c.fillStyle = 'rgba(30,50,20,.28)';
  c.beginPath(); c.ellipse(0, 27, 19, 6.5, 0, 0, Math.PI * 2); c.fill();
  // Estelas si va con turbo
  if (p.turbo > 0){
    trazo(c);
    c.strokeStyle = 'rgba(255,201,60,.8)'; c.lineWidth = 3;
    for (let i = 0; i < 3; i++){
      const y = -8 + i * 8;
      c.beginPath(); c.moveTo(-p.mira * 24, y); c.lineTo(-p.mira * (36 + i * 6), y + 3); c.stroke();
    }
  }
  // Piernas
  caja(c, -12, 10 + Math.max(0, paso), 9, 15, p.oscuro, 4);
  caja(c, 3, 10 + Math.max(0, -paso), 9, 15, p.oscuro, 4);
  // Cuerpo
  caja(c, -16, -13, 32, 26, p.color, 10);
  // Brazos
  if (p.llevando){
    trazo(c); c.strokeStyle = TINTA; c.lineWidth = 9;
    c.beginPath(); c.moveTo(-13, -6); c.lineTo(p.mira * 20, 2); c.stroke();
    c.beginPath(); c.moveTo(13, -6); c.lineTo(p.mira * 20, 2); c.stroke();
    trazo(c); c.strokeStyle = p.color; c.lineWidth = 5.5;
    c.beginPath(); c.moveTo(-13, -6); c.lineTo(p.mira * 20, 2); c.stroke();
    c.beginPath(); c.moveTo(13, -6); c.lineTo(p.mira * 20, 2); c.stroke();
  } else {
    bola(c, -19, 2 + paso * 0.6, 5, p.color);
    bola(c, 19, 2 - paso * 0.6, 5, p.color);
  }
  // Cabeza y gorra
  bola(c, 0, -27, 14.5, '#ffd9b3');
  trazo(c);
  c.beginPath(); c.arc(0, -29, 15, Math.PI, 0);
  c.fillStyle = p.gorro; c.fill(); c.stroke();
  caja(c, p.mira > 0 ? -2 : -17, -31, 19, 5.5, p.gorro, 3);
  // Ojos mirando hacia el movimiento
  ojo(c, -5 + p.mira * 2, -27, 3);
  ojo(c, 5 + p.mira * 2, -27, 3);
  // Meme cargado (abrazado al pecho)
  if (p.llevando){
    const rz = RAREZAS[MEME[p.llevando.tipo].rareza];
    c.save();
    c.translate(p.mira * 13, -2);
    c.scale(0.72, 0.72);
    c.globalAlpha = 0.25;
    c.fillStyle = rz.color;
    c.beginPath(); c.arc(0, 4, 30, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
    MEME[p.llevando.tipo].dibujo(c, T);
    c.restore();
  }
  // Alerta si lleva un Meme robado
  if (p.llevando && p.llevando.origen !== null && p.llevando.origen !== undefined){
    const s = 1 + Math.sin(T * 8) * 0.12;
    c.save();
    c.translate(0, -68);
    c.scale(s, s);
    bola(c, 0, 0, 9, '#e2574c');
    c.fillStyle = '#ffffff';
    c.font = '900 13px Nunito, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('!', 0, 1);
    c.restore();
  }
  c.restore();
  // Etiqueta del nombre
  etiquetaTexto(c, p.x, p.y - 50, p.nombre, p.color, '#ffffff', '900 11px Nunito, sans-serif', 8);
}

function dibujarParticulas(c){
  for (const p of particulas){
    const rest = Math.max(0, 1 - p.edad / p.vida);
    c.save();
    c.globalAlpha = rest;
    if (p.tipo === 'c'){
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      c.fillRect(-p.tam / 2, -p.tam / 2, p.tam, p.tam * 0.6);
    } else {
      trazo(c);
      c.strokeStyle = p.color;
      c.lineWidth = 3 * rest + 1;
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.stroke();
    }
    c.restore();
  }
}
function dibujarFlotantes(c){
  for (const f of flotantes){
    const rest = Math.max(0, 1 - f.edad / f.vida);
    c.save();
    c.globalAlpha = Math.min(1, rest * 1.4);
    c.font = '400 17px "Lilita One", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const y = f.y - f.edad * 46;
    c.lineWidth = 4; c.strokeStyle = TINTA;
    c.strokeText(f.txt, f.x, y);
    c.fillStyle = f.color;
    c.fillText(f.txt, f.x, y);
    c.restore();
  }
}
function dibujarIndicadores(c){
  // Anillo en el objetivo de la acción
  if (accionObj && accionObj.m){
    const pos = accionObj.tipo === 'comprar' ? posSlotPlaza(accionObj.m.slotPlaza) : posMemeColocado(accionObj.m);
    if (pos){
      const r = 36 + Math.sin(T * 5) * 4;
      trazo(c);
      c.strokeStyle = '#ffffff'; c.lineWidth = 3.5;
      c.beginPath(); c.arc(pos.x, pos.y, r, 0, Math.PI * 2); c.stroke();
    }
  }
  // Flecha hacia la base si llevo un Meme
  if (jugador.llevando){
    const c0 = centroBase(0);
    const dx = c0.x - jugador.x, dy = c0.y - jugador.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 120){
      c.save();
      c.translate(jugador.x + dx / d * 64, jugador.y + dy / d * 64);
      c.rotate(Math.atan2(dy, dx));
      trazo(c);
      c.beginPath();
      c.moveTo(15, 0); c.lineTo(-8, -10); c.lineTo(-3, 0); c.lineTo(-8, 10);
      c.closePath();
      c.fillStyle = '#ffc93c'; c.fill(); c.stroke();
      c.restore();
    }
  }
}

function dibujar(){
  const c = cx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#24401f';
  c.fillRect(0, 0, cv.width, cv.height);
  c.setTransform(cam.escala, 0, 0, cam.escala, cam.ox, cam.oy);
  dibujarSuelo(c);
  dibujarCaminos(c);
  dibujarPlaza(c);
  for (const b of BASES) dibujarBase(c, b);
  dibujarMemesLibres(c);
  dibujarQueso(c);
  const pers = [jugador, ...rivales].sort((a, b) => a.y - b.y);
  for (const p of pers) dibujarPersona(c, p);
  dibujarParticulas(c);
  dibujarFlotantes(c);
  dibujarIndicadores(c);
}

/* ---------- HUD ---------- */
let ultMonMostrada = -1, ultIpsMostrada = '';
function actualizarHUD(){
  if (!dom.hudMonedas) return;
  const m = Math.floor(E.monedas);
  if (m !== ultMonMostrada){
    ultMonMostrada = m;
    dom.hudMonedas.textContent = fmt(E.monedas);
    if (tiendaAbierta) dom.tiendaMonedas.textContent = fmt(E.monedas);
  }
  const ipsTxt = '+' + fmt(ipsEfectivaJugador()) + '/s' + (fiebreActiva() ? ' x2' : '');
  if (ipsTxt !== ultIpsMostrada){
    ultIpsMostrada = ipsTxt;
    dom.hudIps.textContent = ipsTxt;
    dom.hudIps.classList.toggle('fiebre', fiebreActiva());
  }
  dom.hudNivel.textContent = E.nivel;
  dom.hudXp.style.width = Math.min(100, E.xp / xpNecesario(E.nivel) * 100) + '%';
  // Botón de escudo
  const b = BASES[0];
  if (b.escudo > 0){
    dom.escudoTxt.textContent = Math.ceil(b.escudo) + 's';
    dom.btnEscudo.disabled = false;
    dom.escudoCd.style.height = '0%';
  } else if (b.escudoCd > 0){
    dom.escudoTxt.textContent = 'ESCUDO';
    dom.btnEscudo.disabled = true;
    dom.escudoCd.style.height = Math.min(100, b.escudoCd / 30 * 100) + '%';
  } else {
    dom.escudoTxt.textContent = 'ESCUDO';
    dom.btnEscudo.disabled = false;
    dom.escudoCd.style.height = '0%';
  }
}
function actualizarChipEvento(){
  if (!dom.hudEventoTxt) return;
  let txt = 'Evento en --:--';
  if (ev.fase === 'espera') txt = 'Evento en ' + mmss(ev.t);
  else if (ev.fase === 'anuncio') txt = '¡Evento en ' + Math.ceil(ev.t) + 's!';
  else txt = EVENTOS[ev.tipo].titulo + ' · ' + mmss(ev.t);
  if (dom.hudEventoTxt.textContent !== txt) dom.hudEventoTxt.textContent = txt;
  dom.hudEvento.classList.toggle('fase-activa', ev.fase === 'activa');
}
function actualizarRanking(){
  if (!dom.ranking) return;
  const items = [{ n: 'TÚ', c: '#4f9df7', v: ipsEfectivaJugador() }];
  for (const r of rivales) items.push({ n: r.nombre, c: r.gorro, v: sumarIps(BASES[r.baseId]) });
  items.sort((a, b) => b.v - a.v);
  dom.ranking.innerHTML = items.map(i =>
    '<span class="rk' + (i.n === 'TÚ' ? ' yo' : '') + '"><i style="background:' + i.c + '"></i>' + i.n +
    '<b>' + fmt(i.v) + '/s</b></span>'
  ).join('');
}

/* ---------- Interfaz: avisos y anuncios ---------- */
function aviso(texto, tipo, icono){
  tipo = tipo || 'info';
  icono = icono || 'i-info';
  const cont = dom.toasts;
  if (!cont) return;
  while (cont.children.length >= 4) cont.firstChild.remove();
  const d = document.createElement('div');
  d.className = 'aviso ' + tipo;
  d.innerHTML = '<svg class="ico"><use href="#' + icono + '"/></svg><span>' + texto + '</span>';
  cont.appendChild(d);
  setTimeout(() => {
    d.classList.add('fuera');
    setTimeout(() => d.remove(), 380);
  }, 3400);
}
let anuncioTimer = null;
function anunciar(titulo, sub){
  dom.anuncioTitulo.textContent = titulo;
  dom.anuncioSub.textContent = sub;
  dom.anuncio.classList.add('ver');
  clearTimeout(anuncioTimer);
  anuncioTimer = setTimeout(() => dom.anuncio.classList.remove('ver'), 3000);
}

/* ---------- Interfaz: tienda ---------- */
const cacheMini = {};
function miniatura(tipo){
  if (cacheMini[tipo]) return cacheMini[tipo];
  const off = document.createElement('canvas');
  off.width = 84; off.height = 84;
  const c = off.getContext('2d');
  c.translate(42, 44);
  c.scale(1.3, 1.3);
  const rz = RAREZAS[MEME[tipo].rareza];
  c.globalAlpha = 0.25;
  c.fillStyle = rz.color;
  c.beginPath(); c.arc(0, 4, 30, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  MEME[tipo].dibujo(c, 0.8);
  cacheMini[tipo] = off.toDataURL();
  return cacheMini[tipo];
}
function alternarTienda(){ tiendaAbierta ? cerrarTienda() : abrirTienda(); }
function abrirTienda(pest){
  if (pest) pestActiva = pest;
  tiendaAbierta = true;
  dom.tienda.classList.add('abierta');
  dom.tiendaMonedas.textContent = fmt(E.monedas);
  seleccionarPestanna(pestActiva);
}
function cerrarTienda(){
  tiendaAbierta = false;
  dom.tienda.classList.remove('abierta');
}
function seleccionarPestanna(pest){
  pestActiva = pest;
  dom.pestBotones.forEach(b => b.classList.toggle('activa', b.dataset.pest === pest));
  dom.pestCuerpos.forEach(s => s.classList.toggle('activa', s.id === 'pest-' + pest));
  renderPestanna();
}
function renderPestanna(){
  if (pestActiva === 'mejoras') renderMejoras();
  else if (pestActiva === 'inv') renderInv();
  else renderLogros();
}
function renderMejoras(){
  dom.tiendaMonedas.textContent = fmt(E.monedas);
  let html = '<div class="pista-plaza">Los <b>Memes</b> se compran en la <b>plaza central</b>: acércate a uno y pulsa <kbd>E</kbd>. Aquí venden mejoras y puedes vender Memes en la pestaña «Mis Memes».</div>';
  html += MEJORAS.map(mj => {
    const lvl = nivelMejora(mj.id);
    const max = lvl >= mj.max;
    const coste = costeMejora(mj);
    const puntos = Array.from({ length: mj.max }, (_, i) => '<span class="punto' + (i < lvl ? ' lleno' : '') + '"></span>').join('');
    return '<article class="tarjeta' + (max ? ' max' : '') + '">' +
      '<div class="t-ico" style="--c:' + mj.color + '"><svg class="ico"><use href="#' + mj.icono + '"/></svg></div>' +
      '<div class="t-info"><b>' + mj.nombre + '</b><p>' + mj.desc + '</p><div class="puntos">' + puntos + '</div></div>' +
      '<button class="btn btn-comp" data-mejora="' + mj.id + '"' + (max || E.monedas < coste ? ' disabled' : '') + '>' +
      (max ? 'MÁX' : '<svg class="ico"><use href="#i-moneda"/></svg>' + fmt(coste)) +
      '</button></article>';
  }).join('');
  dom.pestMejoras.innerHTML = html;
}
function comprarMejora(id){
  const mj = MEJORAS.find(x => x.id === id);
  if (!mj) return;
  const lvl = nivelMejora(id);
  if (lvl >= mj.max) return;
  const coste = costeMejora(mj);
  if (E.monedas < coste){ aviso('Te faltan monedas para esa mejora', 'warn', 'i-moneda'); return; }
  E.monedas -= coste;
  E.mejoras[id] = lvl + 1;
  E.stats.mejoras++;
  if (id === 'base') aplicarTamanoBase0();
  Sonido.compra();
  confeti(jugador.x, jugador.y - 30, 16);
  aviso('¡' + mj.nombre + ' nivel ' + (lvl + 1) + '!', 'ok', 'i-check');
  ganarXP(6);
  chequearLogros();
  guardar();
  renderMejoras();
}
function renderInv(){
  dom.tiendaMonedas.textContent = fmt(E.monedas);
  const lista = BASES[0].memes;
  if (!lista.length){
    dom.pestInv.innerHTML = '<div class="vacio">Aún no tienes Memes.<br>¡Compra tu primero en la plaza central!<br>Huecos libres: ' + capacidadBase(BASES[0]) + '</div>';
    return;
  }
  ventaPendiente = null;
  dom.pestInv.innerHTML = lista.map(m => {
    const mm = MEME[m.tipo], rz = RAREZAS[mm.rareza];
    return '<article class="tarjeta-meme" style="--c:' + rz.color + '">' +
      '<img src="' + miniatura(m.tipo) + '" alt="' + mm.nombre + '">' +
      '<div class="m-info"><b>' + mm.nombre + '</b>' +
      '<span class="chip-rareza" style="--c:' + rz.color + '">' + rz.nombre + '</span>' +
      '<span class="chip-ips">+' + fmt(mm.ips) + '/s</span></div>' +
      '<button class="btn-vender" data-uid="' + m.uid + '"><svg class="ico"><use href="#i-moneda"/></svg>Vender ' + fmt(mm.precio * 0.5) + '</button>' +
      '</article>';
  }).join('') + '<div class="vacio" style="padding:8px">Huecos usados: ' + lista.length + '/' + capacidadBase(BASES[0]) + '</div>';
}
function venderFlujo(uid){
  const m = BASES[0].memes.find(x => x.uid === uid);
  if (!m) return;
  if (ventaPendiente !== uid){
    ventaPendiente = uid;
    const b = dom.pestInv.querySelector('[data-uid="' + uid + '"]');
    if (b){ b.classList.add('confirmando'); b.textContent = '¿Seguro?'; }
    setTimeout(() => { if (ventaPendiente === uid){ ventaPendiente = null; renderInv(); } }, 2500);
    return;
  }
  const mm = MEME[m.tipo];
  BASES[0].memes.splice(BASES[0].memes.indexOf(m), 1);
  const medio = Math.round(mm.precio * 0.5);
  E.monedas += medio;
  ventaPendiente = null;
  Sonido.compra();
  aviso(mm.nombre + ' vendido por ' + fmt(medio) + ' monedas', 'info', 'i-moneda');
  flotante(jugador.x, jugador.y - 40, '+' + fmt(medio), '#ffd23f');
  chequearLogros();
  guardar();
  renderInv();
}
function renderLogros(){
  dom.tiendaMonedas.textContent = fmt(E.monedas);
  const s = instantaneaStats();
  dom.pestLogros.innerHTML = LOGROS.map(L => {
    const hecha = E.logros.has(L.id);
    let prog = '';
    if (!hecha && L.prog){
      const par = L.prog(s);
      const cur = Math.min(par[0], par[1]), max = par[1];
      prog = '<div class="progreso"><i style="width:' + Math.min(100, cur / max * 100) + '%"></i></div>' +
             '<p style="margin-top:3px">' + fmt(cur) + ' / ' + fmt(max) + '</p>';
    }
    return '<article class="fila-logro' + (hecha ? ' hecha' : '') + '">' +
      '<div class="logro-ico"><svg class="ico"><use href="#i-trofeo"/></svg></div>' +
      '<div class="l-info"><b>' + L.nombre + '</b><p>' + L.desc + '</p>' + prog + '</div>' +
      '<div class="l-estado"><span class="recompensa"><svg class="ico"><use href="#i-moneda"/></svg>' + fmt(L.monedas) + '</span>' +
      (hecha ? '<svg class="ico hecho"><use href="#i-check"/></svg>' : '<svg class="ico nohecho"><use href="#i-candado"/></svg>') +
      '</div></article>';
  }).join('');
}

/* ---------- Interfaz: modales ---------- */
function abrirModal(html){
  dom.modal.innerHTML = html;
  dom.modalFondo.classList.remove('oculto');
}
function cerrarModal(){
  dom.modalFondo.classList.add('oculto');
  dom.modal.innerHTML = '';
}
function abrirAyuda(){
  abrirModal(
    '<h3>¿Cómo se juega?</h3>' +
    '<div class="seccion"><b>Moverse</b><p>Teclado: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o flechas. Móvil: joystick táctil. <kbd>E</kbd> comprar/robar · <kbd>R</kbd> escudo · <kbd>T</kbd> tienda · <kbd>M</kbd> sonido.</p></div>' +
    '<div class="seccion"><b>Ganar monedas</b><p>Los Memes colocados en tu base generan monedas cada segundo. Cuanto más rara es la rareza, más ingresan: Común → Raro → Épico → Legendario → Mítico → Secreto.</p></div>' +
    '<div class="seccion"><b>Comprar y robar</b><p>Compra Memes en la plaza central y llévalos a tu base: al entrar se colocan sol. Entra en bases rivales y llévate sus Memes; el dueño te perseguirá y, si te toca, recuperará su Meme. Si te roban a ti, toca al ladrón para recuperarlo.</p></div>' +
    '<div class="seccion"><b>Escudo y eventos</b><p><kbd>R</kbd> activa o desactiva el escudo de tu base (protege de robos un rato, luego se recarga). Cada poco llega un evento con cuenta atrás: Oferta Flash, Fiebre del Oro y el Queso Dorado.</p></div>' +
    '<div class="seccion"><b>Guardado</b><p>La partida se guarda sola en este navegador (localStorage). Desde Ajustes puedes ver estadísticas o reiniciarla.</p></div>' +
    '<div class="modal-pie"><button class="btn btn-sec" data-cerrar="1">Cerrar</button><button class="btn" data-accion="tutorial">Ver tutorial</button></div>'
  );
}
function abrirAjustes(){
  const st = E.stats;
  abrirModal(
    '<h3>Ajustes</h3>' +
    '<div class="fila-conf"><span>Sonido</span><button class="btn ' + (Sonido.activo ? '' : 'btn-sec') + '" data-accion="sonido">' + (Sonido.activo ? 'SÍ' : 'NO') + '</button></div>' +
    '<div class="fila-conf"><span>Partículas</span><span class="grupo">' +
      '<button class="btn ' + (E.ajustes.particulas === 'alta' ? '' : 'btn-sec') + '" data-accion="particulas-alta">Alta</button>' +
      '<button class="btn ' + (E.ajustes.particulas === 'baja' ? '' : 'btn-sec') + '" data-accion="particulas-baja">Baja</button>' +
    '</span></div>' +
    '<div class="seccion"><b>Tus estadísticas</b><div class="stats-lista">' +
      '<div><span>Tiempo de juego</span><span>' + textoTiempo(E.tiempo) + '</span></div>' +
      '<div><span>Compras</span><span>' + st.compras + '</span></div>' +
      '<div><span>Robos logrados</span><span>' + st.robos + '</span></div>' +
      '<div><span>Robos recibidos</span><span>' + st.robosRecibidos + '</span></div>' +
      '<div><span>Recuperaciones</span><span>' + st.recuperaciones + '</span></div>' +
      '<div><span>Monedas ganadas</span><span>' + fmt(st.total) + '</span></div>' +
      '<div><span>Logros</span><span>' + E.logros.size + '/' + LOGROS.length + '</span></div>' +
    '</div></div>' +
    '<div class="modal-pie"><button class="btn btn-peligro" data-accion="reiniciar">Reiniciar partida</button>' +
    '<button class="btn btn-sec" data-cerrar="1">Cerrar</button></div>'
  );
}
function confirmarReinicio(){
  dom.modal.innerHTML =
    '<h3>¿Reiniciar la partida?</h3>' +
    '<p>Se borrarán <b>todas</b> tus monedas, Memes, mejoras, logros y estadísticas. Esta acción no se puede deshacer.</p>' +
    '<div class="modal-pie">' +
      '<button class="btn btn-peligro" data-accion="reiniciar-si">Sí, borrar todo</button>' +
      '<button class="btn btn-sec" data-accion="reiniciar-no">Cancelar</button>' +
    '</div>';
}
function alternarSonido(){
  Sonido.activo = !Sonido.activo;
  E.ajustes.sonido = Sonido.activo;
  dom.usoSonido.setAttribute('href', Sonido.activo ? '#i-son-on' : '#i-son-off');
  if (Sonido.activo) Sonido.moneda();
  guardar();
}

/* ---------- Tutorial ---------- */
const TUTO_PASOS = [
  { meme: 'papa', titulo: '¡Bienvenido a Roba el Meme!',
    texto: 'Tu misión: hacerte rico con los Memes más absurdos del barrio. Muévete con WASD o las flechas (en móvil, con el joystick de la izquierda).' },
  { meme: 'taco', titulo: 'Compra en la plaza',
    texto: 'Los Memes aparecen en la plaza central. Acércate a uno y pulsa E (o el botón grande de la derecha) para comprarlo. Después llévalo andando hasta tu base azul: al entrar, se coloca solo.' },
  { meme: 'gato', titulo: 'Los Memes generan monedas',
    texto: 'Cada Meme colocado en tu base gana monedas cada segundo. Cuanto más raro es, más ingresa: Común, Raro, Épico, Legendario, Mítico y… el Secreto.' },
  { meme: 'tiburon', titulo: '¡Roba sin vergüenza!',
    texto: 'Entra en las bases de ROSA, KEVIN y DON y llévate sus Memes. ¡Ojo! Te perseguirán: si te tocan mientras lo llevas, recuperan su Meme. Si te roban a ti, toca al ladrón para recuperarlo.' },
  { meme: 'queso', titulo: 'Escudo, tienda y eventos',
    texto: 'Pulsa R para el escudo, T para la tienda (mejoras y venta de Memes). Cada poco llega un evento con cuenta atrás: ofertas flash, fiebre del oro y el Queso Dorado. ¡Tu progreso se guarda solo!' },
];
let tutoPaso = 0;
function abrirTutorial(){
  tutoPaso = 0;
  tutoAbierto = true;
  dom.tutorial.classList.remove('oculto');
  pintarPasoTutorial();
}
function terminarTutorial(){
  tutoAbierto = false;
  dom.tutorial.classList.add('oculto');
  if (!E.ajustes.tutorialHecho){
    E.ajustes.tutorialHecho = true;
    guardar();
    if (spawnPlaza('papa', { regalo: true })){
      aviso('¡Hay un REGALO esperándote en la plaza!', 'logro', 'i-estrella');
    }
  }
}
function pintarPasoTutorial(){
  const p = TUTO_PASOS[tutoPaso];
  dom.tutoTitulo.textContent = p.titulo;
  dom.tutoTexto.textContent = p.texto;
  dom.tutoAnt.style.visibility = tutoPaso === 0 ? 'hidden' : 'visible';
  dom.tutoSig.textContent = tutoPaso === TUTO_PASOS.length - 1 ? '¡A jugar!' : 'Siguiente';
  dom.tutoPuntos.innerHTML = TUTO_PASOS.map((_, i) => '<i class="' + (i === tutoPaso ? 'act' : '') + '"></i>').join('');
}
function animarMemeTutorial(){
  const p = TUTO_PASOS[tutoPaso];
  const c = dom.tutoMeme.getContext('2d');
  c.clearRect(0, 0, 150, 150);
  c.save();
  c.translate(75, 82 + Math.sin(T * 2.4) * 4);
  c.scale(2.1, 2.1);
  const rz = RAREZAS[MEME[p.meme].rareza];
  c.globalAlpha = 0.25;
  c.fillStyle = rz.color;
  c.beginPath(); c.arc(0, 4, 30, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  MEME[p.meme].dibujo(c, T);
  c.restore();
}

/* ---------- Entradas (teclado, joystick, botones) ---------- */
function instalarListeners(){
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    teclas.add(k);
    if (e.repeat) return;
    if (k === 'e') ejecutarAccion();
    else if (k === 'r') botonEscudo();
    else if (k === 't') alternarTienda();
    else if (k === 'm') alternarSonido();
    else if (k === 'escape'){
      if (!dom.modalFondo.classList.contains('oculto')) cerrarModal();
      else if (tiendaAbierta) cerrarTienda();
    }
  });
  addEventListener('keyup', e => teclas.delete(e.key.toLowerCase()));
  addEventListener('blur', () => teclas.clear());
  addEventListener('contextmenu', e => e.preventDefault());

  // Desbloqueo del audio con el primer gesto del usuario
  const gesto = () => {
    Sonido.listo();
    removeEventListener('pointerdown', gesto);
    removeEventListener('keydown', gesto);
  };
  addEventListener('pointerdown', gesto);
  addEventListener('keydown', gesto);

  // Botones del HUD
  dom.btnTienda.addEventListener('click', alternarTienda);
  dom.btnLogros.addEventListener('click', () => abrirTienda('logros'));
  dom.btnAyuda.addEventListener('click', abrirAyuda);
  dom.btnSonido.addEventListener('click', alternarSonido);
  dom.btnAjustes.addEventListener('click', abrirAjustes);
  dom.btnCerrarTienda.addEventListener('click', cerrarTienda);
  dom.btnAccion.addEventListener('click', ejecutarAccion);
  dom.btnEscudo.addEventListener('click', botonEscudo);
  dom.pestBotones.forEach(b => b.addEventListener('click', () => seleccionarPestanna(b.dataset.pest)));
  dom.pestMejoras.addEventListener('click', e => {
    const b = e.target.closest('[data-mejora]');
    if (b) comprarMejora(b.dataset.mejora);
  });
  dom.pestInv.addEventListener('click', e => {
    const b = e.target.closest('[data-uid]');
    if (b) venderFlujo(+b.dataset.uid);
  });

  // Modal (delegación de acciones)
  dom.modal.addEventListener('click', e => {
    if (e.target.closest('[data-cerrar]')){ cerrarModal(); return; }
    const a = e.target.closest('[data-accion]');
    if (!a) return;
    const acc = a.dataset.accion;
    if (acc === 'sonido'){ alternarSonido(); abrirAjustes(); }
    else if (acc === 'particulas-alta'){ E.ajustes.particulas = 'alta'; guardar(); abrirAjustes(); }
    else if (acc === 'particulas-baja'){ E.ajustes.particulas = 'baja'; guardar(); abrirAjustes(); }
    else if (acc === 'tutorial'){ cerrarModal(); abrirTutorial(); }
    else if (acc === 'reiniciar'){ confirmarReinicio(); }
    else if (acc === 'reiniciar-si'){ reiniciarPartida(); }
    else if (acc === 'reiniciar-no'){ abrirAjustes(); }
  });
  dom.modalFondo.addEventListener('click', e => { if (e.target === dom.modalFondo) cerrarModal(); });

  // Tutorial
  dom.tutoAnt.addEventListener('click', () => { if (tutoPaso > 0){ tutoPaso--; pintarPasoTutorial(); } });
  dom.tutoSig.addEventListener('click', () => {
    if (tutoPaso < TUTO_PASOS.length - 1){ tutoPaso++; pintarPasoTutorial(); }
    else terminarTutorial();
  });
  dom.tutoSaltar.addEventListener('click', terminarTutorial);

  // Joystick táctil
  function moverJoystick(e){
    const rect = dom.joyBase.getBoundingClientRect();
    const cxp = rect.left + rect.width / 2, cyp = rect.top + rect.height / 2;
    let dx = e.clientX - cxp, dy = e.clientY - cyp;
    const d = Math.hypot(dx, dy), max = rect.width / 2 - 18;
    if (d > max && d > 0){ dx = dx / d * max; dy = dy / d * max; }
    dom.joyPalanca.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    joyVec = { x: dx / max, y: dy / max };
  }
  const soltarJoystick = () => {
    joyActivo = false;
    joyVec = { x: 0, y: 0 };
    dom.joyPalanca.style.transform = 'translate(-50%,-50%)';
  };
  dom.joyBase.addEventListener('pointerdown', e => {
    e.preventDefault();
    try { dom.joyBase.setPointerCapture(e.pointerId); } catch (err) { }
    joyActivo = true;
    moverJoystick(e);
  });
  dom.joyBase.addEventListener('pointermove', e => { if (joyActivo) moverJoystick(e); });
  dom.joyBase.addEventListener('pointerup', soltarJoystick);
  dom.joyBase.addEventListener('pointercancel', soltarJoystick);

  addEventListener('resize', redimensionar);
  addEventListener('beforeunload', guardar);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){ pausado = true; guardar(); }
    else { pausado = false; ultimoTs = 0; }
  });
}

/* ---------- Bucle principal ---------- */
let ultimoTs = 0, rafId = 0;
function bucle(ts){
  rafId = requestAnimationFrame(bucle);
  if (!ultimoTs) ultimoTs = ts;
  let dt = (ts - ultimoTs) / 1000;
  ultimoTs = ts;
  if (dt > 0.05) dt = 0.05;              // evita saltos gigantes al volver de la pestaña
  if (!pausado && !tutoAbierto && !document.hidden) actualizar(dt);
  dibujar();
  if (tutoAbierto) animarMemeTutorial();
}

/* ---------- Arranque ---------- */
function camel(s){ return s.replace(/-(.)/g, (_, c) => c.toUpperCase()); }
function cacheDom(){
  const ids = ['juego', 'hud-monedas', 'hud-ips', 'hud-nivel', 'hud-xp', 'hud-evento', 'hud-evento-txt', 'ranking',
    'btn-tienda', 'btn-logros', 'btn-ayuda', 'btn-sonido', 'uso-sonido', 'btn-ajustes',
    'btn-escudo', 'escudo-txt', 'escudo-cd', 'btn-accion', 'accion-txt',
    'joy-base', 'joy-palanca', 'anuncio', 'anuncio-titulo', 'anuncio-sub', 'toasts',
    'tienda', 'tienda-monedas', 'btn-cerrar-tienda', 'pest-mejoras', 'pest-inv', 'pest-logros',
    'modal-fondo', 'modal', 'tutorial', 'tuto-meme', 'tuto-titulo', 'tuto-texto', 'tuto-puntos',
    'tuto-ant', 'tuto-sig', 'tuto-saltar'];
  ids.forEach(id => { dom[camel(id)] = document.getElementById(id); });
  dom.pestBotones = Array.from(document.querySelectorAll('.pest'));
  dom.pestCuerpos = [dom.pestMejoras, dom.pestInv, dom.pestLogros];
}
function iniciar(){
  cacheDom();
  cv = dom.juego;
  cx = cv.getContext('2d');
  E = estadoInicial();
  crearJugador();
  crearRivales();
  const cargo = cargar();
  aplicarTamanoBase0();
  Sonido.activo = E.ajustes.sonido !== false;
  dom.usoSonido.setAttribute('href', Sonido.activo ? '#i-son-on' : '#i-son-off');
  if (!cargo){
    // Partida nueva: los rivales arrancan con dos Memes comunes cada uno
    for (const r of rivales){
      r.monedas = 120;
      for (let i = 0; i < 2; i++){
        BASES[r.baseId].memes.push(nuevoMemeColocado(r.baseId, memeAleatorioDeRareza('comun').id));
      }
    }
    spawnPlaza('pato', {});
    spawnPlaza('gato', {});
    spawnPlaza('pinguino', {});
  }
  redimensionar();
  instalarListeners();
  actualizarHUD();
  actualizarRanking();
  actualizarChipEvento();
  if (!E.ajustes.tutorialHecho) abrirTutorial();
  else aviso('¡Bienvenido de nuevo! Tu partida se ha cargado.', 'ok', 'i-check');
  rafId = requestAnimationFrame(bucle);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();

/* ============================================================
   CAPA DE RED — preparada para multijugador real (futuro)
   GitHub Pages solo sirve archivos estáticos: NO puede alojar
   un servidor WebSocket ni ocultar una conexión online. Por eso
   hoy el juego es 1 jugador contra rivales con IA y NO finge
   ser online. Para añadir multijugador real con un servidor
   externo (Node + ws, por ejemplo):
     1. Net.conectar(url) abriría el WebSocket.
     2. Cada rival IA se sustituiría por un jugador remoto: en
        vez de pensarRival(r) se aplicaría su entrada recibida
        por mensaje, igual que el joystick aplica la tuya.
     3. El estado autoritativo se sincronizaría con Net.enviar().
   La separación estado / simulación / entradas / render de este
   archivo ya está pensada para ese cambio.
   ============================================================ */
const Net = {
  conectado: false,
  conectar(){ /* Requiere un servidor externo: ver README.md */ return false; },
  enviar(){ /* Sin conexión: sin efecto */ },
  recibir(){ /* Sin conexión: sin efecto */ },
};

/* Utilidades de prueba para la consola del navegador (no afectan al juego) */
window.__pruebas = {
  teletransportar(x, y){ jugador.x = x; jugador.y = y; },
  monedas(n){ E.monedas = n; },
  robar(){ const b = BASES[1]; if (b.memes.length) intentarRobo(jugador, b.memes[0]); },
  estado(){
    return {
      monedas: Math.floor(E.monedas), nivel: E.nivel,
      memes: BASES[0].memes.map(m => m.tipo),
      rivales: rivales.map(r => ({ n: r.nombre, monedas: Math.floor(r.monedas), memes: BASES[r.baseId].memes.length })),
    };
  },
};





