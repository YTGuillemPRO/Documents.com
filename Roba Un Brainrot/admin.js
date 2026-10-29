/* =========================================================
   ¡ROBA EL MEME! 3D — admin.js
   Panel de administración con Firebase (opcional):
   login con Google, edición de economía, ranking en la nube,
   anuncios en vivo y lista de baneados.
   Sin Firebase configurado funciona en MODO LOCAL.
   ========================================================= */
(function () {
'use strict';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg = window.FIREBASE_CONFIG || {};
const EMAILS = (window.ADMIN_EMAILS || []).map(e => e.toLowerCase());
const cfgValida = !!(cfg.apiKey && cfg.projectId) && !/REEMPLAZA|TU[-_ ]|PON[-_ ]|CAMBIA|XXXX/i.test(JSON.stringify(cfg));
const LKEY = 'rem_adminLocal';
const FB_VER = '10.12.2';
const BASE_GSTATIC = `https://www.gstatic.com/firebasejs/${FB_VER}`;

let fb = null;        // { app, auth, db, modAuth, modFs }
let usuario = null;   // usuario con sesión abierta
let pestActiva = 'panel';
let escuchandoAnuncios = false;

const refs = {
  fondo: $('#admin-fondo'),
  login: $('#admin-login'),
  contenido: $('#admin-contenido'),
  cuerpo: $('#admin-cuerpo'),
  estado: $('#admin-estado'),
  aviso: $('#admin-aviso')
};

const REGLAS = `rules_version = '2';
service cloud.firestore {
  function esAdmin() {
    return request.auth != null
      && request.auth.token.email in ['${EMAILS.join("', '")}'];
  }
  match /databases/{database}/documents {
    match /config/{docId} {
      allow read: if true;
      allow write: if esAdmin();
    }
    match /anuncios/{docId} {
      allow read: if true;
      allow write: if esAdmin();
    }
    match /ranking/{docId} {
      allow read: if true;
      allow create: if request.resource.data.puntos is number
        && request.resource.data.puntos >= 0
        && request.resource.data.puntos <= 100000000
        && request.resource.data.nombre is string
        && request.resource.data.nombre.size() > 0
        && request.resource.data.nombre.size() <= 20;
      allow update, delete: if esAdmin();
    }
  }
}`;

function cfgLocal() {
  try { return JSON.parse(localStorage.getItem(LKEY) || '{}'); } catch (e) { return {}; }
}
function guardarCfgLocal(c) {
  try { localStorage.setItem(LKEY, JSON.stringify(c)); } catch (e) {}
}

/* ---------- Apertura y cierre ---------- */
function abrir() {
  refs.fondo.classList.remove('oculto');
  refs.aviso.innerHTML = '';
  if (!cfgValida) {
    refs.estado.textContent = 'local';
    refs.estado.className = 'chip-admin';
    mostrarAvisoConfig();
    modoLocal();
  } else {
    cargarFB().catch(err => {
      refs.estado.textContent = 'sin conexión';
      refs.estado.className = 'chip-admin';
      mostrarAvisoConfig('No se pudo conectar con Firebase: ' + esc(err.message || err) +
        '<br><br>El panel funciona en <b>modo local</b> mientras tanto.');
      modoLocal();
    });
  }
}
function cerrar() { refs.fondo.classList.add('oculto'); }
$('#btn-cerrar-admin').addEventListener('click', cerrar);
refs.fondo.addEventListener('click', e => { if (e.target === refs.fondo) cerrar(); });
window.addEventListener('hashchange', () => { if (location.hash === '#admin') abrir(); });
if (location.hash === '#admin') setTimeout(abrir, 800);
window.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && (e.code === 'KeyA')) { e.preventDefault(); abrir(); }
});

function mostrarAvisoConfig(extra = '') {
  refs.aviso.innerHTML = `<div class="aviso-config">
    <b>Firebase no está configurado todavía.</b> El juego y este panel funcionan al 100% en local,
    pero si quieres la nube (login, ranking, anuncios y economía remota):<br>
    <ol>
      <li>Crea un proyecto gratis en <b>console.firebase.google.com</b>.</li>
      <li>Añade una <b>app web</b> (icono &lt;/&gt;) y copia su <code>firebaseConfig</code>.</li>
      <li>Pégalo en <code>firebase-config.js</code> (sustituye los valores REEMPLAZA_*).</li>
      <li>Activa <b>Authentication → Google</b> y <b>Firestore Database</b>.</li>
      <li>Pega las reglas de seguridad (botón «Copiar reglas» de la pestaña Panel).</li>
      <li>Añade tu dominio de GitHub Pages en <b>Authentication → Settings → Authorized domains</b>.</li>
    </ol>
    <b>Cuentas admin ya configuradas:</b><br>
    <code>${esc(EMAILS.join('<br>'))}</code>
    ${extra}
  </div>`;
}

function modoLocal() {
  refs.login.classList.add('oculto');
  refs.contenido.classList.remove('oculto');
  renderPest(pestActiva);
}

/* ---------- Carga diferida del SDK de Firebase ---------- */
async function cargarFB() {
  if (fb) return fb;
  const [modApp, modAuth, modFs] = await Promise.all([
    import(`${BASE_GSTATIC}/firebase-app.js`),
    import(`${BASE_GSTATIC}/firebase-auth.js`),
    import(`${BASE_GSTATIC}/firebase-firestore.js`)
  ]);
  const app = modApp.initializeApp(cfg);
  fb = { app, auth: modAuth.getAuth(app), db: modFs.getFirestore(app), modAuth, modFs };
  refs.estado.textContent = 'conectado';
  refs.estado.className = 'chip-admin ok';
  modAuth.onAuthStateChanged(fb.auth, u => {
    usuario = u;
    refrescarVista();
  });
  escucharAnuncios();
  return fb;
}
function esAdmin(u) {
  return !!(u && u.email && EMAILS.includes(u.email.toLowerCase()));
}
function refrescarVista() {
  if (!cfgValida) return; // modo local: sin login
  refs.login.classList.toggle('oculto', !!usuario);
  refs.contenido.classList.toggle('oculto', !(usuario && esAdmin(usuario)));
  if (usuario && !esAdmin(usuario)) {
    refs.aviso.innerHTML = `<div class="aviso-config">
      <b>${esc(usuario.email)} no es una cuenta administradora.</b><br>
      Solo pueden entrar: <code>${esc(EMAILS.join('<br>'))}</code>
    </div>`;
  } else if (usuario) {
    refs.aviso.innerHTML = '';
  }
  if (usuario && esAdmin(usuario)) renderPest(pestActiva);
}

$('#btn-google').addEventListener('click', async () => {
  if (!fb) {
    toastJuego('Cargando Firebase…', 'info');
    try { await cargarFB(); } catch (e) { toastJuego('No se pudo cargar Firebase.', 'error'); return; }
  }
  try {
    const proveedor = new fb.modAuth.GoogleAuthProvider();
    await fb.modAuth.signInWithPopup(fb.auth, proveedor);
  } catch (e) {
    const msg = (e && e.code === 'auth/popup-blocked')
      ? 'El navegador bloqueó la ventana emergente. Permitela e inténtalo otra vez.'
      : 'No se pudo iniciar sesión: ' + esc(e.message || e);
    toastJuego(msg, 'error');
  }
});

function toastJuego(t, tipo) {
  if (window.Juego && window.Juego.toast) window.Juego.toast(t, tipo);
}

/* ---------- Pestañas ---------- */
document.querySelectorAll('.apest').forEach(btn => {
  btn.addEventListener('click', () => {
    pestActiva = btn.dataset.ap;
    document.querySelectorAll('.apest').forEach(b => b.classList.toggle('activa', b === btn));
    renderPest(pestActiva);
  });
});
function renderPest(cual) {
  if (cual === 'economia') renderEconomia();
  else if (cual === 'ranking') renderRanking();
  else if (cual === 'anuncios') renderAnuncios();
  else if (cual === 'jugadores') renderJugadores();
  else renderPanel();
}

/* ---------- Pestaña: Panel (estado y utilidades) ---------- */
function renderPanel() {
  const j = window.Juego ? window.Juego.estado() : null;
  const nube = cfgValida ? (usuario ? (esAdmin(usuario) ? '<span style="color:#8fd3ff">conectado como ' + esc(usuario.email) + '</span>' : 'sin permisos') : 'sin sesión') : 'no configurada';
  refs.cuerpo.innerHTML = `
    <div class="admin-grid">
      <div class="a-carta">
        <h3>Firebase</h3>
        <p>${nube}</p>
        <div class="a-acciones">
          <button class="btn-admin" id="ad-copiar-reglas">Copiar reglas de seguridad</button>
        </div>
      </div>
      <div class="a-carta">
        <h3>Partida actual</h3>
        <p>Monedas: <span>${j ? j.monedas.toLocaleString('es-ES') : '—'}</span><br>
        Nivel <span>${j ? j.nivel : '—'}</span> · Memes <span>${j ? j.memes : '—'}</span> · <span>+${j ? Math.floor(j.ips) : 0}/s</span></p>
      </div>
      <div class="a-carta">
        <h3>Estadísticas</h3>
        <p>Compras <span>${j ? j.stats.compras : 0}</span> · Robos <span>${j ? j.stats.robos : 0}</span><br>
        Monedas ganadas <span>${j ? j.stats.monedasTotales.toLocaleString('es-ES') : 0}</span><br>
        Logros <span>${j ? j.logros : 0}/13</span></p>
      </div>
      <div class="a-carta">
        <h3>Utilidades de prueba</h3>
        <p>Trampas para testear el juego:</p>
        <div class="a-acciones">
          <button class="btn-admin bien" id="ad-dinero">+1.000 monedas</button>
          <button class="btn-admin" id="ad-evento">Provocar evento</button>
        </div>
      </div>
    </div>
    <p class="a-nota">El panel de economía guarda los valores en Firestore (colección <code>config</code>) y el juego los aplica al cargar.
    El ranking y los anuncios usan las colecciones <code>ranking</code> y <code>anuncios</code>.</p>`;
  $('#ad-copiar-reglas').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(REGLAS);
      toastJuego('Reglas copiadas al portapapeles.', 'exito');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = REGLAS; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toastJuego('Reglas copiadas.', 'exito'); } catch (e2) { toastJuego('Copia manual:', 'info'); }
      ta.remove();
    }
  });
  $('#ad-dinero').addEventListener('click', () => {
    if (window.Juego) { window.Juego.darMonedas(1000); toastJuego('+1.000 monedas de prueba.', 'exito'); renderPanel(); }
  });
  $('#ad-evento').addEventListener('click', () => {
    if (window.Juego) { window.Juego.debugEvento(); toastJuego('Evento provocado.', 'info'); }
  });
}

/* ---------- Pestaña: Economía ---------- */
function renderEconomia() {
  const D = window.DATOS;
  const local = cfgLocal();
  const precios = local.precios || {};
  const ipsCfg = local.ips || {};
  const filas = D.MEMES.map(m => {
    const rz = D.RAREZAS[m.rareza];
    return `<tr>
      <td>${esc(m.nombre)}</td>
      <td><span class="rz-chip" style="background:${rz.css}">${rz.nombre}</span></td>
      <td><input type="number" min="1" step="1" data-precio="${m.id}" value="${precios[m.id] != null ? precios[m.id] : m.precio}"></td>
      <td><input type="number" min="0" step="0.1" data-ips="${m.id}" value="${ipsCfg[m.id] != null ? ipsCfg[m.id] : m.ips}"></td>
    </tr>`;
  }).join('');
  refs.cuerpo.innerHTML = `
    <p class="a-nota">Cambia precios y producción de cada meme. «Aplicar local» afecta a esta partida;
    «Guardar en la nube» lo aplica a todos los jugadores (requiere Firebase y sesión admin).</p>
    <div class="fila-admin">
      <label class="a-nota">Multiplicador de precios:
        <input type="number" id="eco-mult" min="0.1" step="0.1" value="${local.mult || 1}" style="width:90px;background:#0e0a18;border:2px solid #4d3f75;border-radius:8px;color:#8fd3ff;font-weight:800;padding:4px 7px">
      </label>
      <label class="a-nota">Multiplicador de producción:
        <input type="number" id="eco-multips" min="0.1" step="0.1" value="${local.multIps || 1}" style="width:90px;background:#0e0a18;border:2px solid #4d3f75;border-radius:8px;color:#8fd3ff;font-weight:800;padding:4px 7px">
      </label>
    </div>
    <div class="tabla-envolver"><table class="tabla-admin">
      <thead><tr><th>Meme</th><th>Rareza</th><th>Precio</th><th>Prod./s</th></tr></thead>
      <tbody>${filas}</tbody>
    </table></div>
    <div class="fila-admin">
      <button class="btn-admin bien" id="eco-aplicar">Aplicar local</button>
      <button class="btn-admin" id="eco-nube" ${cfgValida ? '' : 'disabled'}>Guardar en la nube</button>
      <button class="btn-admin peligro" id="eco-reset">Restablecer valores originales</button>
    </div>`;
  $('#eco-aplicar').addEventListener('click', () => {
    const c = leerEconomia();
    guardarCfgLocal(c);
    if (window.Juego) window.Juego.aplicarConfigEconomia(c);
    toastJuego('Economía aplicada en local.', 'exito');
  });
  $('#eco-nube').addEventListener('click', async () => {
    if (!fb || !usuario || !esAdmin(usuario)) { toastJuego('Entra como administrador primero.', 'error'); return; }
    const c = leerEconomia();
    try {
      const { doc, setDoc } = fb.modFs;
      await setDoc(doc(fb.db, 'config', 'economia'), c);
      guardarCfgLocal(c);
      if (window.Juego) window.Juego.aplicarConfigEconomia(c);
      toastJuego('Economía guardada en la nube.', 'exito');
    } catch (e) {
      toastJuego('Error al guardar (revisa las reglas de Firestore): ' + esc(e.message || e), 'error');
    }
  });
  $('#eco-reset').addEventListener('click', () => {
    guardarCfgLocal({});
    if (window.Juego) window.Juego.aplicarConfigEconomia({});
    toastJuego('Valores originales restablecidos.', 'info');
    renderEconomia();
  });
}
function leerEconomia() {
  const c = { precios: {}, ips: {}, mult: 1, multIps: 1 };
  document.querySelectorAll('[data-precio]').forEach(inp => {
    const v = parseFloat(inp.value);
    if (!isNaN(v) && v > 0) c.precios[inp.dataset.precio] = v;
  });
  document.querySelectorAll('[data-ips]').forEach(inp => {
    const v = parseFloat(inp.value);
    if (!isNaN(v) && v >= 0) c.ips[inp.dataset.ips] = v;
  });
  const m1 = parseFloat($('#eco-mult') && $('#eco-mult').value);
  const m2 = parseFloat($('#eco-multips') && $('#eco-multips').value);
  if (!isNaN(m1) && m1 > 0) c.mult = m1;
  if (!isNaN(m2) && m2 > 0) c.multIps = m2;
  return c;
}

/* ---------- Pestaña: Ranking ---------- */
async function renderRanking() {
  let local = null;
  try { local = JSON.parse(localStorage.getItem('rem_mejorLocal') || 'null'); } catch (e) {}
  let html = `
    <div class="fila-admin">
      <button class="btn-admin bien" id="rk-enviar">Enviar mi puntuación</button>
      <span class="a-nota">Puntos = nivel × 1000 + monedas ganadas + robos × 250</span>
    </div>
    <p class="titulo-sec">Tu récord local</p>`;
  html += local
    ? `<div class="tabla-envolver"><table class="tabla-admin"><tbody>
        <tr><td>${esc(local.nombre)}</td><td>${local.puntos.toLocaleString('es-ES')} pts</td>
        <td>${new Date(local.fecha).toLocaleString('es-ES')}</td></tr>
      </tbody></table></div>`
    : '<p class="a-nota">Todavía no hay récord local. ¡Juega y envía tu puntuación!</p>';
  html += '<p class="titulo-sec">Ranking de la nube' + (cfgValida ? '' : ' (requiere Firebase)') + '</p><div id="rk-nube"><p class="a-nota">Cargando…</p></div>';
  refs.cuerpo.innerHTML = html;
  $('#rk-enviar').addEventListener('click', async () => {
    try {
      const r = await enviarPuntuacion();
      toastJuego(r && r.local ? 'Récord local guardado.' : '¡Puntuación enviada a la nube!', 'exito');
      renderRanking();
    } catch (e) { toastJuego('No se pudo enviar: ' + esc(e.message || e), 'error'); }
  });
  if (!cfgValida) {
    $('#rk-nube').innerHTML = '<p class="a-nota">Configura Firebase para ver el ranking global de todos los jugadores.</p>';
    return;
  }
  try {
    await cargarFB();
    const { collection, query, orderBy, limit, getDocs } = fb.modFs;
    const datos = await getDocs(query(collection(fb.db, 'ranking'), orderBy('puntos', 'desc'), limit(50)));
    if (datos.empty) {
      $('#rk-nube').innerHTML = '<p class="a-nota">Aún no hay puntuaciones. ¡Sé el primero!</p>';
      return;
    }
    let filas = '';
    let pos = 0;
    datos.forEach(docSnap => {
      pos++;
      const d = docSnap.data();
      const puedeBorrar = usuario && esAdmin(usuario);
      filas += `<tr>
        <td>${pos}º</td>
        <td>${esc(d.nombre || 'Anónimo')}</td>
        <td>${(d.puntos || 0).toLocaleString('es-ES')}</td>
        <td>${d.fecha ? new Date(d.fecha).toLocaleDateString('es-ES') : '—'}</td>
        ${puedeBorrar ? `<td><button class="btn-admin peligro" data-borrar-rk="${docSnap.id}">Borrar</button></td>` : ''}
      </tr>`;
    });
    $('#rk-nube').innerHTML = `<div class="tabla-envolver"><table class="tabla-admin">
      <thead><tr><th>#</th><th>Jugador</th><th>Puntos</th><th>Fecha</th>${usuario && esAdmin(usuario) ? '<th></th>' : ''}</tr></thead>
      <tbody>${filas}</tbody></table></div>`;
    document.querySelectorAll('[data-borrar-rk]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!fb) return;
        try {
          const { doc, deleteDoc } = fb.modFs;
          await deleteDoc(doc(fb.db, 'ranking', btn.dataset.borrarRk));
          toastJuego('Entrada borrada.', 'exito');
          renderRanking();
        } catch (e) { toastJuego('No se pudo borrar: ' + esc(e.message || e), 'error'); }
      });
    });
  } catch (e) {
    $('#rk-nube').innerHTML = '<p class="a-nota">No se pudo leer el ranking: ' + esc(e.message || e) + '</p>';
  }
}

/* ---------- Pestaña: Anuncios ---------- */
function renderAnuncios() {
  refs.cuerpo.innerHTML = `
    <p class="a-nota">Publica un anuncio que verán todos los jugadores en pantalla (en vivo si tienen el juego abierto).</p>
    <div class="fila-admin">
      <input type="text" id="an-titulo" maxlength="40" placeholder="Título (ej: ¡Actualización!)">
    </div>
    <div class="fila-admin">
      <textarea id="an-texto" maxlength="140" placeholder="Texto del anuncio…"></textarea>
    </div>
    <div class="fila-admin">
      <button class="btn-admin bien" id="an-publicar" ${cfgValida ? '' : 'disabled'}>Publicar en la nube</button>
    </div>
    <p class="titulo-sec">Últimos anuncios</p>
    <div id="an-lista"><p class="a-nota">Cargando…</p></div>`;
  $('#an-publicar').addEventListener('click', async () => {
    if (!fb || !usuario || !esAdmin(usuario)) { toastJuego('Entra como administrador primero.', 'error'); return; }
    const titulo = ($('#an-titulo').value || '').trim().slice(0, 40);
    const texto = ($('#an-texto').value || '').trim().slice(0, 140);
    if (!titulo && !texto) { toastJuego('Escribe algo primero.', 'error'); return; }
    try {
      const { collection, addDoc } = fb.modFs;
      await addDoc(collection(fb.db, 'anuncios'), { titulo: titulo || 'ANUNCIO', texto, fecha: Date.now() });
      $('#an-titulo').value = ''; $('#an-texto').value = '';
      toastJuego('Anuncio publicado.', 'exito');
      renderAnuncios();
    } catch (e) { toastJuego('No se pudo publicar: ' + esc(e.message || e), 'error'); }
  });
  if (!cfgValida) {
    $('#an-lista').innerHTML = '<p class="a-nota">Configura Firebase para publicar anuncios.</p>';
    return;
  }
  cargarFB().then(async () => {
    const { collection, query, orderBy, limit, getDocs } = fb.modFs;
    const datos = await getDocs(query(collection(fb.db, 'anuncios'), orderBy('fecha', 'desc'), limit(10)));
    if (datos.empty) { $('#an-lista').innerHTML = '<p class="a-nota">Sin anuncios.</p>'; return; }
    let filas = '';
    datos.forEach(docSnap => {
      const d = docSnap.data();
      filas += `<tr>
        <td><b>${esc(d.titulo)}</b><br><span class="a-nota">${esc(d.texto || '')}</span></td>
        <td>${d.fecha ? new Date(d.fecha).toLocaleString('es-ES') : '—'}</td>
        ${usuario && esAdmin(usuario) ? `<td><button class="btn-admin peligro" data-borrar-an="${docSnap.id}">Borrar</button></td>` : ''}
      </tr>`;
    });
    $('#an-lista').innerHTML = `<div class="tabla-envolver"><table class="tabla-admin"><tbody>${filas}</tbody></table></div>`;
    document.querySelectorAll('[data-borrar-an]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const { doc, deleteDoc } = fb.modFs;
          await deleteDoc(doc(fb.db, 'anuncios', btn.dataset.borrarAn));
          toastJuego('Anuncio borrado.', 'exito');
          renderAnuncios();
        } catch (e) { toastJuego('No se pudo borrar.', 'error'); }
      });
    });
  }).catch(e => {
    $('#an-lista').innerHTML = '<p class="a-nota">Sin conexión con Firebase.</p>';
  });
}
/* escucha anuncios en vivo y los muestra en el juego */
function escucharAnuncios() {
  if (!fb || escuchandoAnuncios) return;
  escuchandoAnuncios = true;
  const { collection, query, orderBy, limit, onSnapshot } = fb.modFs;
  onSnapshot(query(collection(fb.db, 'anuncios'), orderBy('fecha', 'desc'), limit(1)), snap => {
    snap.docChanges().forEach(cambio => {
      if (cambio.type !== 'added') return;
      const d = cambio.doc.data();
      const t = (d.fecha || 0);
      if (Date.now() - t < 60000 && window.Juego && window.Juego.anuncioAdmin) {
        window.Juego.anuncioAdmin('📢 ' + (d.titulo || 'ANUNCIO'), d.texto || '');
      }
    });
  }, () => { /* sin permisos de lectura: se ignora */ });
}

/* ---------- Pestaña: Jugadores (baneos) ---------- */
function renderJugadores() {
  refs.cuerpo.innerHTML = `
    <p class="a-nota">Jugadores baneados: no podrán enviar puntuaciones al ranking (su partida local sigue funcionando).</p>
    <div class="fila-admin">
      <input type="text" id="ban-nombre" maxlength="20" placeholder="Nombre exacto del jugador">
      <button class="btn-admin peligro" id="ban-anadir" ${cfgValida ? '' : 'disabled'}>Añadir a la lista</button>
    </div>
    <p class="titulo-sec">Lista de baneados</p>
    <div id="ban-lista"><p class="a-nota">Cargando…</p></div>`;
  const pintarLista = nombres => {
    if (!nombres.length) { $('#ban-lista').innerHTML = '<p class="a-nota">No hay jugadores baneados.</p>'; return; }
    $('#ban-lista').innerHTML = `<div class="tabla-envolver"><table class="tabla-admin"><tbody>` +
      nombres.map(n => `<tr><td>${esc(n)}</td><td><button class="btn-admin" data-desban="${esc(n)}">Quitar</button></td></tr>`).join('') +
      `</tbody></table></div>`;
    document.querySelectorAll('[data-desban]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await guardarBaneados(nombres.filter(n => n !== btn.dataset.desban));
          toastJuego('Jugador desbaneado.', 'exito');
          renderJugadores();
        } catch (e) { toastJuego('No se pudo guardar.', 'error'); }
      });
    });
  };
  const guardarBaneados = async nombres => {
    const { doc, setDoc } = fb.modFs;
    await setDoc(doc(fb.db, 'config', 'baneados'), { nombres });
  };
  $('#ban-anadir').addEventListener('click', async () => {
    if (!fb || !usuario || !esAdmin(usuario)) { toastJuego('Entra como administrador primero.', 'error'); return; }
    const nombre = ($('#ban-nombre').value || '').trim().slice(0, 20);
    if (!nombre) { toastJuego('Escribe un nombre.', 'error'); return; }
    try {
      const { doc, getDoc, setDoc } = fb.modFs;
      const actual = await getDoc(doc(fb.db, 'config', 'baneados'));
      const nombres = (actual.data() && actual.data().nombres) || [];
      if (!nombres.includes(nombre)) nombres.push(nombre);
      await setDoc(doc(fb.db, 'config', 'baneados'), { nombres });
      toastJuego(`${nombre} baneado.`, 'exito');
      renderJugadores();
    } catch (e) { toastJuego('No se pudo guardar: ' + esc(e.message || e), 'error'); }
  });
  if (!cfgValida) {
    $('#ban-lista').innerHTML = '<p class="a-nota">Configura Firebase para gestionar baneos.</p>';
    return;
  }
  cargarFB().then(async () => {
    const { doc, getDoc } = fb.modFs;
    const snap = await getDoc(doc(fb.db, 'config', 'baneados'));
    pintarLista((snap.data() && snap.data().nombres) || []);
  }).catch(() => { $('#ban-lista').innerHTML = '<p class="a-nota">Sin conexión con Firebase.</p>'; });
}

/* ---------- Envío de puntuación (lo llama el juego) ---------- */
async function enviarPuntuacion() {
  const j = window.Juego;
  if (!j) return { ok: false };
  const datos = {
    nombre: (j.nombre() || 'Anónimo').slice(0, 20),
    puntos: Math.max(0, Math.floor(j.puntuacion())),
    fecha: Date.now()
  };
  if (!cfgValida) {
    try {
      const mejor = JSON.parse(localStorage.getItem('rem_mejorLocal') || 'null');
      if (!mejor || datos.puntos > (mejor.puntos || 0)) {
        localStorage.setItem('rem_mejorLocal', JSON.stringify(datos));
      }
    } catch (e) { /* almacenamiento no disponible */ }
    return { ok: true, local: true };
  }
  await cargarFB();
  // comprobar baneo
  try {
    const { doc, getDoc } = fb.modFs;
    const b = await getDoc(doc(fb.db, 'config', 'baneados'));
    const nombres = ((b.data() && b.data().nombres) || []).map(n => n.toLowerCase());
    if (nombres.includes(datos.nombre.toLowerCase())) return { ok: false, razon: 'baneado' };
  } catch (e) { /* sin lista de baneos */ }
  const { collection, addDoc } = fb.modFs;
  await addDoc(collection(fb.db, 'ranking'), datos);
  return { ok: true, local: false };
}

/* ---------- API pública + arranque ---------- */
window.Admin = {
  abrir,
  cerrar,
  enviarPuntuacion,
  configurado: cfgValida
};

/* si Firebase está configurado, aplicar la economía de la nube al arrancar */
if (cfgValida) {
  cargarFB().then(async () => {
    try {
      const { doc, getDoc } = fb.modFs;
      const snap = await getDoc(doc(fb.db, 'config', 'economia'));
      if (snap.exists() && snap.data() && window.Juego) {
        window.Juego.aplicarConfigEconomia(snap.data());
      }
    } catch (e) { /* sin permisos o sin documento */ }
  }).catch(() => { /* sin conexión: modo local */ });
}
})();
