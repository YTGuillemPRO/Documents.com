import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged, signOut }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const $ = id => document.getElementById(id);
const ADMINS = ['guillevarelacors@gmail.com', 'guillempro07@gmail.com'];
const CAMPOS = [
  ['monedasIniciales', 'Monedas iniciales', 0, 500],
  ['eventoCada', 'Segundos entre eventos', 30, 600],
  ['eventoDuracion', 'Duración del evento (s)', 10, 120],
  ['multIngresos', 'Multiplicador de ingresos', 0.5, 10],
  ['rebaja', 'Descuento en rebajas (0-0.9)', 0, 0.9],
  ['fiebre', 'Multiplicador fiebre del oro', 1, 5],
  ['escudoDuracion', 'Duración del escudo (s)', 20, 300],
  ['lluviaMonedas', 'Monedas en la lluvia', 4, 60],
  ['lluviaValor', 'Valor de cada moneda', 5, 200],
  ['botAgresividad', 'Agresividad de los bots', 0.2, 3],
  ['renacerNivel', 'Nivel para renacer', 3, 30],
  ['renacerBonus', 'Bonus por renacer (0.3 = +30%)', 0.1, 2],
  ['renacerMonedas', 'Monedas de arranque por renacer', 0, 1000],
  ['offlineHoras', 'Horas máx. de ganancias offline', 0, 48],
  ['offlinePorc', '% de ingresos offline (0-1)', 0, 1]
];

if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
  $('fError').textContent = 'Rellena firebase-config.js con tu configuración.';
  throw new Error('sin config');
}
const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

let tAviso = null;
function aviso(msg, mal = false) {
  const a = $('aviso');
  a.textContent = msg; a.classList.toggle('mal', mal); a.hidden = false;
  clearTimeout(tAviso); tAviso = setTimeout(() => a.hidden = true, 3200);
}
function traducirError(c) {
  if (String(c).includes('popup')) return 'El navegador bloqueó la ventana. Permite pop-ups y prueba otra vez.';
  if (String(c).includes('cancelled')) return 'Inicio de sesión cancelado.';
  if (String(c).includes('unauthorized-domain')) return 'Dominio no autorizado: Firebase Console → Authentication → Settings → Authorized domains (añade el de GitHub Pages).';
  return 'Error: ' + c;
}
async function entrar(proveedor) {
  $('fError').textContent = '';
  try { await signInWithPopup(auth, proveedor); }
  catch (e) { $('fError').textContent = traducirError(e.code || e.message); }
}
$('btnGoogle').onclick = () => entrar(new GoogleAuthProvider());
$('btnGitHub').onclick = () => entrar(new GithubAuthProvider());
$('btnSalir').onclick = async () => { await signOut(auth); location.reload(); };

onAuthStateChanged(auth, u => {
  if (!u) { $('login').hidden = false; $('panel').hidden = true; return; }
  const email = (u.email || '').toLowerCase();
  if (!ADMINS.includes(email)) {
    $('fError').innerHTML = `"${u.email || 'sin email'}" no está autorizado.<br>
      Si entraste con GitHub: github.com → Settings → Public profile → Public email →
      pon ${ADMINS[0]} y vuelve a entrar. O usa el botón de Google.`;
    signOut(auth); return;
  }
  $('login').hidden = true; $('panel').hidden = false;
  const proveedor = u.providerData[0] && u.providerData[0].providerId || '';
  $('quien').innerHTML =
    (u.photoURL ? `<img src="${u.photoURL}" alt="" style="width:26px;height:26px;border-radius:50%;vertical-align:-7px;margin-right:6px">` : '') +
    `${u.displayName || email.split('@')[0]}${proveedor.includes('github') ? ' · GitHub' : ''}`;
  aviso('¡Te reconozco, jefe! Sesión iniciada.');
  cargarTodo();
});

document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('activa'));
  t.classList.add('activa');
  $('sec-cfg').hidden = t.dataset.t !== 'cfg';
  $('sec-mem').hidden = t.dataset.t !== 'mem';
  $('sec-sta').hidden = t.dataset.t !== 'sta';
});

/* ---- configuración ---- */
function pintarConfig(datos) {
  const c = $('cfgLista'); c.innerHTML = '';
  for (const [k, nom, min, max] of CAMPOS) {
    const v = datos && datos[k] !== undefined ? datos[k] : window.CONFIG_JUEGO[k];
    c.insertAdjacentHTML('beforeend', `<label class="fila"><span>${nom}<small>${k}</small></span>
      <input type="number" id="cf_${k}" value="${v}" min="${min}" max="${max}" step="any"></label>`);
  }
}
async function cargarConfig() {
  try {
    const s = await getDoc(doc(db, 'config', 'juego'));
    pintarConfig(s.exists() ? s.data() : null);
    $('cfgEstado').textContent = s.exists() ? 'Configuración activa en Firestore' : 'Usando valores por defecto (todavía no has guardado ninguna)';
  } catch (e) { $('cfgEstado').textContent = 'Sin permiso de lectura: revisa las reglas de Firestore.'; }
}
$('btnGuardarCfg').onclick = async () => {
  const datos = {};
  for (const [k] of CAMPOS) {
    let v = parseFloat($('cf_' + k).value);
    if (isNaN(v)) v = window.CONFIG_JUEGO[k];
    datos[k] = v;
  }
  try { await setDoc(doc(db, 'config', 'juego'), datos); aviso('Configuración guardada: la próxima partida ya la usa.'); }
  catch (e) { aviso('No se pudo guardar: ' + e.code, true); }
};
$('btnBorrarCfg').onclick = async () => {
  if (!confirm('¿Borrar la configuración y volver a los valores por defecto?')) return;
  try { await deleteDoc(doc(db, 'config', 'juego')); aviso('Configuración borrada.'); cargarConfig(); }
  catch (e) { aviso('No se pudo borrar: ' + e.code, true); }
};

/* ---- memes ---- */
function pintarMemes(over) {
  const c = $('memLista'); c.innerHTML = '';
  for (const m of window.MEMES) {
    const o = over[m.id] || {};
    const r = window.RAREZAS[m.rareza];
    c.insertAdjacentHTML('beforeend', `<div class="mtar" style="--rc:${r.color}">
      <b>${m.nombre}</b><small>${r.nombre}${m.reqRenacer ? ' · exclusivo renacer ×' + m.reqRenacer : ''} — por defecto: ${m.precio} / ${m.ingreso}/s</small>
      <label>Precio <input type="number" id="mp_${m.id}" value="${o.precio !== undefined ? o.precio : m.precio}" min="1" step="any"></label>
      <label>Ingreso/s <input type="number" id="mi_${m.id}" value="${o.ingreso !== undefined ? o.ingreso : m.ingreso}" min="0" step="any"></label>
    </div>`);
  }
}
async function cargarMemes() {
  let over = {};
  try { const s = await getDoc(doc(db, 'config', 'memes')); if (s.exists()) over = s.data(); } catch (e) { }
  pintarMemes(over);
}
$('btnGuardarMemes').onclick = async () => {
  const datos = {};
  for (const m of window.MEMES) {
    const p = parseFloat($('mp_' + m.id).value), i = parseFloat($('mi_' + m.id).value);
    datos[m.id] = { precio: isNaN(p) ? m.precio : p, ingreso: isNaN(i) ? m.ingreso : i };
  }
  try { await setDoc(doc(db, 'config', 'memes'), datos); aviso('Memes guardados.'); }
  catch (e) { aviso('No se pudo guardar: ' + e.code, true); }
};

/* ---- estadísticas ---- */
const NOMBRES_STAT = {
  sesiones: 'Partidas jugadas', comprasTotales: 'Memes comprados',
  robosTotales: 'Robos realizados', renacimientosTotales: 'Renacimientos'
};
const fmtN = n => Number(n || 0).toLocaleString('es-ES');
async function cargarStats() {
  const c = $('staLista'); c.innerHTML = '<p class="espera">Cargando…</p>';
  try {
    const s = await getDoc(doc(db, 'stats', 'global'));
    c.innerHTML = '';
    if (!s.exists()) { c.innerHTML = '<p class="espera">Todavía no hay datos: juega una partida primero.</p>'; return; }
    const d = s.data();
    for (const k in NOMBRES_STAT) c.insertAdjacentHTML('beforeend', `<div class="stat"><span>${NOMBRES_STAT[k]}</span><b>${fmtN(d[k])}</b></div>`);
    for (const k in d) if (!NOMBRES_STAT[k]) c.insertAdjacentHTML('beforeend', `<div class="stat"><span>${k}</span><b>${fmtN(d[k])}</b></div>`);
  } catch (e) { c.innerHTML = '<p class="espera">Sin permiso de lectura: revisa las reglas.</p>'; }
}
$('btnRefrescar').onclick = cargarStats;
$('btnResetStats').onclick = async () => {
  if (!confirm('¿Poner a cero todas las estadísticas?')) return;
  try { await deleteDoc(doc(db, 'stats', 'global')); aviso('Estadísticas a cero.'); cargarStats(); }
  catch (e) { aviso('No se pudo: ' + e.code, true); }
};

function cargarTodo() { cargarConfig(); cargarMemes(); cargarStats(); }
window.__adminListo = true;   /* señal para el vigilante de admin.html */
