/* Panel de administración de ¡Roba el Meme!
   Se conecta con la MISMA sesión que tu web: mismo proyecto Firebase
   (inici-de-sessio) y mismo dominio (ytguillempro.github.io), así que
   si ya iniciaste sesión en Documents.com, aquí entras directo. */
window.__adminCargando = true;   /* señal para el vigilante de admin.html */

const $ = id => document.getElementById(id);
const ADMINS = ['guillevarelacors@gmail.com', 'guillempro07@gmail.com'];
const RAIZ = 'juegos/robameme';
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
/* Reglas COMPLETAS del Realtime Database: las de tu web + las del juego,
   ya fusionadas. El panel las enseña con «Copiar reglas completas» para
   pegarlas en la consola sustituyendo TODO (nada de fusionar a mano). */
const REGLAS = `{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".indexOn": ["username"],
      "$uid": {
        ".write": "auth != null && (auth.uid === $uid || auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com' || auth.token.email === 'ovarela@ietemple.cat')",
        "friends": { "$f": { ".write": "auth != null" } },
        "friendRequests": { "$r": { ".write": "auth != null" } },
        "online": { ".write": "auth != null" },
        "currentGame": { ".write": "auth != null" }
      }
    },
    "userFavorites": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "gameLikes": { ".read": true, "$g": { ".write": "auth != null" } },
    "updateLog": {
      ".read": true,
      "$id": {
        ".write": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')",
        "reactions": { "$e": { "$u": { ".write": "auth != null && auth.uid === $u" } } }
      }
    },
    "adminBroadcast": {
      ".read": true,
      ".write": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')"
    },
    "maintenance": {
      ".read": true,
      ".write": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')"
    },
    "bannedUsers": {
      ".read": "auth != null",
      ".write": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')"
    },
    "stats": { ".read": true, ".write": true },
    "presence": { ".read": true, ".write": true },
    "juegos": {
      "robameme": {
        "config": {
          ".read": true,
          ".write": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')"
        },
        "memes": {
          ".read": true,
          ".write": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')"
        },
        "partidas": {
          ".read": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')",
          ".write": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')",
          "$partida": {
            ".write": true,
            "t": { ".validate": "newData.isNumber()" },
            "sesiones": { ".validate": "newData.isNumber()" },
            "comprasTotales": { ".validate": "newData.isNumber()" },
            "robosTotales": { ".validate": "newData.isNumber()" },
            "renacimientosTotales": { ".validate": "newData.isNumber()" },
            "$otro": { ".validate": false }
          }
        }
      }
    }
  }
}`;

let tAviso = null;
function aviso(msg, mal = false) {
  const a = $('aviso');
  a.textContent = msg; a.classList.toggle('mal', mal); a.hidden = false;
  clearTimeout(tAviso); tAviso = setTimeout(() => a.hidden = true, 3400);
}
function vista(nombre) {
  $('conectando').hidden = true;
  $('sinSesion').hidden = nombre !== 'sinSesion';
  $('noAdmin').hidden = nombre !== 'noAdmin';
  $('panel').hidden = nombre !== 'panel';
}
/* conTimeout: si la base de datos tarda demasiado (o rechaza al usuario),
   no dejamos el panel media eternidad esperando */
function conTimeout(promesa, ms = 12000) {
  return Promise.race([
    promesa,
    new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo-agotado')), ms))
  ]);
}
function errorFB(e) {
  const c = String(e && (e.code || e.message) || e);
  if (c.includes('permission') || c.includes('Permission') || c.includes('tiempo-agotado')) {
    $('reglasTxt').value = REGLAS;
    $('cajaReglas').hidden = false;
    return true;
  }
  return false;
}

/* ---- cargar el SDK de Firebase: gstatic → jsdelivr (plan B) ---- */
async function cargarSDK() {
  const bases = ['https://www.gstatic.com/firebasejs/10.12.0',
                 'https://cdn.jsdelivr.net/npm/firebase@10.12.0'];
  for (const b of bases) {
    const suf = b.includes('jsdelivr') ? '/+esm' : '';
    try {
      const app = await import(`${b}/firebase-app.js${suf}`);
      const auth = await import(`${b}/firebase-auth.js${suf}`);
      const db = await import(`${b}/firebase-database.js${suf}`);
      return { app, auth, db };
    } catch (e) { /* probamos la siguiente fuente */ }
  }
  return null;
}

let auth = null, db = null, fdb = null, cerrarSesion = null;

(async () => {
  if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
    $('conectando').innerHTML = '<h1>ROBA EL MEME</h1><h2>Falta la configuración</h2>' +
      '<p class="sub">Sube <b>firebase-config.js</b> (el nuevo) a la carpeta del juego y recarga.</p>';
    return;
  }
  const sdk = await cargarSDK();
  if (!sdk) return; /* el vigilante de admin.html ya está avisando */
  const app = sdk.app.initializeApp(window.FIREBASE_CONFIG);
  auth = sdk.auth.getAuth(app);
  db = sdk.db.getDatabase(app);
  fdb = sdk.db;
  cerrarSesion = sdk.auth.signOut;
  window.__adminListo = true;

  $('btnReintentar').onclick = () => location.reload();
  $('btnSalirNoAdmin').onclick = () => cerrarSesion(auth);
  $('btnSalir').onclick = async () => {
    if (confirm('¿Cerrar sesión? También se cerrará en la web.')) cerrarSesion(auth);
  };
  $('btnCopiarReglas').onclick = async () => {
    try { await navigator.clipboard.writeText($('reglasTxt').value); }
    catch (e) {
      $('reglasTxt').hidden = false;
      $('reglasTxt').select();
      document.execCommand('copy');
    }
    aviso('Reglas copiadas: en la consola, borra TODO, pega y publica.');
  };
  $('btnVerReglas').onclick = () => {
    const t = $('reglasTxt');
    t.hidden = !t.hidden;
    if (!t.hidden) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 16) + 'px'; }
  };

  /* ---- la magia: la sesión de la web llega sola (mismo proyecto + dominio) ---- */
  sdk.auth.onAuthStateChanged(auth, u => {
    if (!u) { vista('sinSesion'); return; }
    const email = (u.email || '').toLowerCase();
    if (!ADMINS.includes(email)) {
      $('noAdminTxt').innerHTML = `La cuenta <b>${u.email || 'sin email'}</b> no es administradora.`;
      vista('noAdmin');
      return;
    }
    vista('panel');
    $('quien').innerHTML =
      (u.photoURL ? `<img class="avatar" src="${u.photoURL}" alt="">` : '') +
      `<span>${u.displayName || email.split('@')[0]} · cuenta de la web</span>`;
    aviso('¡Conectado con tu cuenta de la web!');
    cargarTodo();
  });

  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('activa'));
    t.classList.add('activa');
    $('sec-cfg').hidden = t.dataset.t !== 'cfg';
    $('sec-mem').hidden = t.dataset.t !== 'mem';
    $('sec-sta').hidden = t.dataset.t !== 'sta';
  });
})();

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
    const s = await conTimeout(fdb.get(fdb.ref(db, RAIZ + '/config')));
    pintarConfig(s.exists() ? s.val() : null);
    $('cfgEstado').textContent = s.exists()
      ? 'Configuración activa en la base de datos'
      : 'Usando valores por defecto (todavía no has guardado ninguna)';
  } catch (e) {
    errorFB(e);
    $('cfgEstado').textContent = 'Sin permiso de lectura: pega las reglas de abajo.';
    pintarConfig(null);
  }
}
 $('btnGuardarCfg').onclick = async () => {
  const datos = {};
  for (const [k] of CAMPOS) {
    let v = parseFloat($('cf_' + k).value);
    if (isNaN(v)) v = window.CONFIG_JUEGO[k];
    datos[k] = v;
  }
  try {
    await fdb.set(fdb.ref(db, RAIZ + '/config'), datos);
    aviso('Configuración guardada: la próxima partida ya la usa.');
  } catch (e) { aviso('No se pudo guardar: ' + (e.code || e.message), true); }
};
 $('btnBorrarCfg').onclick = async () => {
  if (!confirm('¿Borrar la configuración y volver a los valores por defecto?')) return;
  try { await fdb.remove(fdb.ref(db, RAIZ + '/config')); aviso('Configuración borrada.'); cargarConfig(); }
  catch (e) { aviso('No se pudo borrar: ' + (e.code || e.message), true); }
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
  try {
    const s = await conTimeout(fdb.get(fdb.ref(db, RAIZ + '/memes')));
    if (s.exists()) over = s.val();
  } catch (e) { errorFB(e); }
  pintarMemes(over);
}
 $('btnGuardarMemes').onclick = async () => {
  const datos = {};
  for (const m of window.MEMES) {
    const p = parseFloat($('mp_' + m.id).value), i = parseFloat($('mi_' + m.id).value);
    datos[m.id] = { precio: isNaN(p) ? m.precio : p, ingreso: isNaN(i) ? m.ingreso : i };
  }
  try { await fdb.set(fdb.ref(db, RAIZ + '/memes'), datos); aviso('Memes guardados.'); }
  catch (e) { aviso('No se pudo guardar: ' + (e.code || e.message), true); }
};

/* ---- estadísticas (suma de todas las partidas guardadas) ---- */
const NOMBRES_STAT = {
  sesiones: 'Partidas jugadas', comprasTotales: 'Memes comprados',
  robosTotales: 'Robos realizados', renacimientosTotales: 'Renacimientos'
};
const fmtN = n => Number(n || 0).toLocaleString('es-ES');
async function cargarStats() {
  const c = $('staLista'); c.innerHTML = '<p class="espera">Cargando…</p>';
  try {
    const s = await conTimeout(fdb.get(fdb.ref(db, RAIZ + '/partidas')));
    const val = s.exists() ? (s.val() || {}) : {};
    if (!Object.keys(val).length) {
      c.innerHTML = '<p class="espera">Todavía no hay datos: juega una partida (con las reglas puestas) y vuelve.</p>';
      return;
    }
    const tot = { sesiones: 0, comprasTotales: 0, robosTotales: 0, renacimientosTotales: 0 };
    let ultima = 0;
    for (const k in val) {
      const p = val[k] || {};
      for (const campo in tot) tot[campo] += +p[campo] || 0;
      if (p.t && p.t > ultima) ultima = +p.t;
    }
    c.innerHTML = '';
    for (const k in NOMBRES_STAT) c.insertAdjacentHTML('beforeend', `<div class="stat"><span>${NOMBRES_STAT[k]}</span><b>${fmtN(tot[k])}</b></div>`);
    if (ultima) c.insertAdjacentHTML('beforeend', `<div class="stat"><span>Última partida</span><b>${new Date(ultima).toLocaleString('es-ES')}</b></div>`);
  } catch (e) {
    errorFB(e);
    c.innerHTML = '<p class="espera">Sin permiso de lectura: pega las reglas de arriba.</p>';
  }
}
 $('btnRefrescar').onclick = cargarStats;
 $('btnResetStats').onclick = async () => {
  if (!confirm('¿Poner a cero todas las estadísticas?')) return;
  try { await fdb.remove(fdb.ref(db, RAIZ + '/partidas')); aviso('Estadísticas a cero.'); cargarStats(); }
  catch (e) { aviso('No se pudo: ' + (e.code || e.message), true); }
};

function cargarTodo() { cargarConfig(); cargarMemes(); cargarStats(); }
