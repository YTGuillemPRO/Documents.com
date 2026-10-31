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
      ".indexOn": [
        "username"
      ],
      "$uid": {
        ".write": "auth != null && (auth.uid === $uid || auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com' || auth.token.email === 'ovarela@ietemple.cat')",
        "friends": {
          "$f": {
            ".write": "auth != null"
          }
        },
        "friendRequests": {
          "$r": {
            ".write": "auth != null"
          }
        },
        "online": {
          ".write": "auth != null"
        },
        "currentGame": {
          ".write": "auth != null"
        }
      }
    },
    "userFavorites": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "gameLikes": {
      ".read": true,
      "$g": {
        ".write": "auth != null"
      }
    },
    "updateLog": {
      ".read": true,
      "$id": {
        ".write": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')",
        "reactions": {
          "$e": {
            "$u": {
              ".write": "auth != null && auth.uid === $u"
            }
          }
        }
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
    "stats": {
      ".read": true,
      ".write": true
    },
    "presence": {
      ".read": true,
      ".write": true
    },
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
            "t": {
              ".validate": "newData.isNumber()"
            },
            "sesiones": {
              ".validate": "newData.isNumber()"
            },
            "comprasTotales": {
              ".validate": "newData.isNumber()"
            },
            "robosTotales": {
              ".validate": "newData.isNumber()"
            },
            "renacimientosTotales": {
              ".validate": "newData.isNumber()"
            },
            "$otro": {
              ".validate": false
            }
          }
        },
        "regalos": {
          ".read": true,
          "$regalo": {
            ".write": "auth != null && (auth.token.email === 'guillevarelacors@gmail.com' || auth.token.email === 'guillempro07@gmail.com')",
            "canjeados": {
              ".write": true,
              ".validate": "newData.isNumber()"
            }
          }
        },
        "cuentas": {
          ".read": true,
          "$cuenta": {
            ".write": true,
            "pin": {
              ".validate": "newData.isString() && newData.val().length >= 8 && newData.val().length <= 20"
            },
            "datos": {
              ".validate": "newData.isString() && newData.val().length <= 40000"
            },
            "t": {
              ".validate": "newData.isNumber()"
            },
            "$otro": {
              ".validate": false
            }
          }
        },
        "servidores": {
          ".read": true,
          "$srv": {
            "jugadores": {
              "$jug": {
                ".write": true,
                ".validate": "newData.hasChildren(['nick','t'])",
                "nick": {
                  ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 14"
                },
                "t": {
                  ".validate": "newData.isNumber()"
                },
                "x": {
                  ".validate": "newData.isNumber()"
                },
                "z": {
                  ".validate": "newData.isNumber()"
                },
                "r": {
                  ".validate": "newData.isNumber()"
                },
                "base": {
                  ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 3"
                },
                "nivel": {
                  ".validate": "newData.isNumber()"
                },
                "ren": {
                  ".validate": "newData.isNumber()"
                },
                "color": {
                  ".validate": "newData.isString() && newData.val().length <= 9"
                },
                "llevando": {
                  ".validate": "newData.isString() && newData.val().length <= 20"
                },
                "esc": {
                  ".validate": "newData.isNumber()"
                },
                "slots": {
                  ".validate": "newData.isString() && newData.val().length <= 400"
                },
                "$otro": {
                  ".validate": false
                }
              }
            },
            "eventos": {
              "$ev": {
                ".write": true,
                ".validate": "newData.hasChildren(['tipo','t'])",
                "tipo": {
                  ".validate": "newData.isString() && newData.val().length <= 12"
                },
                "t": {
                  ".validate": "newData.isNumber()"
                },
                "victima": {
                  ".validate": "newData.isString() && newData.val().length <= 20"
                },
                "por": {
                  ".validate": "newData.isString() && newData.val().length <= 20"
                },
                "nick": {
                  ".validate": "newData.isString() && newData.val().length <= 14"
                },
                "slot": {
                  ".validate": "newData.isNumber()"
                },
                "meme": {
                  ".validate": "newData.isString() && newData.val().length <= 20"
                },
                "$otro": {
                  ".validate": false
                }
              }
            },
            "chat": {
              "$msj": {
                ".write": true,
                ".validate": "newData.hasChildren(['nick','txt','t'])",
                "nick": {
                  ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 14"
                },
                "txt": {
                  ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 60"
                },
                "t": {
                  ".validate": "newData.isNumber()"
                },
                "de": {
                  ".validate": "newData.isString() && newData.val().length <= 20"
                },
                "$otro": {
                  ".validate": false
                }
              }
            },
            "$otro": {
              ".validate": false
            }
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

let auth = null, db = null, fdb = null, cerrarSesion = null, nombreAdmin = '';

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
    nombreAdmin = (u.displayName || email.split('@')[0] || 'Admin').slice(0, 24);
    $('quien').innerHTML =
      (u.photoURL ? `<img class="avatar" src="${u.photoURL}" alt="">` : '') +
      `<span>${u.displayName || email.split('@')[0]} · cuenta de la web</span>`;
    aviso('¡Conectado con tu cuenta de la web!');
    cargarTodo();
  });

  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('activa'));
    t.classList.add('activa');
    $('sec-dar').hidden = t.dataset.t !== 'dar';
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

function cargarTodo() { cargarConfig(); cargarMemes(); cargarStats(); cargarRegalos(); }

/* ---- DAR COSAS: el formulario de regalos ---- */
function filaNum(nom, id, def, min, max) {
  return `<label class="fila"><span>${nom}</span>
    <input type="number" id="${id}" value="${def}" min="${min}" max="${max}"></label>`;
}
function pintarCamposDar() {
  const tipo = $('dar-tipo').value;
  const c = $('dar-campos');
  c.innerHTML = '';
  if (tipo === 'monedas') {
    c.innerHTML = filaNum('¿Cuántas monedas?', 'dar-n', 500, 1, 1000000);
  } else if (tipo === 'meme') {
    let ops = '';
    for (const r in window.RAREZAS) {
      ops += `<optgroup label="${window.RAREZAS[r].nombre}">` +
        window.MEMES.filter(m => m.rareza === r)
          .map(m => `<option value="${m.id}">${m.nombre}${m.reqRenacer ? ' · renacer ' + m.reqRenacer : ''}</option>`).join('') +
        '</optgroup>';
    }
    c.innerHTML = `<label class="fila"><span>¿Qué meme?</span><select id="dar-meme">${ops}</select></label>`;
  } else if (tipo === 'pack') {
    const ops = Object.keys(window.RAREZAS).map(r => `<option value="${r}">${window.RAREZAS[r].nombre}</option>`).join('');
    c.innerHTML = `<label class="fila"><span>¿De qué rareza?</span><select id="dar-rareza">${ops}</select></label>` +
      filaNum('¿Cuántos memes?', 'dar-n', 3, 1, 10);
  } else if (tipo === 'mejora') {
    const ops = window.MEJORAS.filter(m => m.max > 0).map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
    c.innerHTML = `<label class="fila"><span>¿Qué mejora?</span><select id="dar-mejora">${ops}</select></label>` +
      filaNum('¿Cuántos niveles?', 'dar-n', 1, 1, 5);
  } else if (tipo === 'escudo') {
    c.innerHTML = filaNum('¿Cuántos escudos?', 'dar-n', 1, 1, 20);
  }
}
$('dar-tipo').onchange = pintarCamposDar;
pintarCamposDar();

/* servidor destino del regalo (para «Solo a UN servidor») */
(function () {
  const sel = $('dar-servidor');
  if (!sel) return;
  sel.innerHTML = (window.SERVIDORES || []).map(s =>
    `<option value="${s.id}">${s.emoji} ${s.nombre}</option>`).join('');
  $('dar-destino').addEventListener('change', () => {
    $('fila-dar-servidor').hidden = $('dar-destino').value !== 'servidor';
  });
})();
function nombreServidorAdmin(id) {
  const s = (window.SERVIDORES || []).find(x => x.id === id);
  return s ? (s.emoji + ' ' + s.nombre) : (id || '?');
}

function clampN(v, min, max, def) {
  v = Math.round(+v);
  if (isNaN(v)) v = def;
  return Math.min(max, Math.max(min, v));
}
$('btnDar').onclick = async () => {
  const tipo = $('dar-tipo').value;
  const g = { t: Date.now(), tipo, de: nombreAdmin };
  const msj = ($('dar-mensaje').value || '').trim();
  if (msj) g.mensaje = msj.slice(0, 70);
  const val = +$('dar-validez').value;
  if (val) g.expira = Date.now() + val;
  if (tipo === 'monedas') g.cantidad = clampN($('dar-n').value, 1, 1000000, 500);
  if (tipo === 'meme') g.memeId = $('dar-meme').value;
  if (tipo === 'pack') { g.rareza = $('dar-rareza').value; g.cantidad = clampN($('dar-n').value, 1, 10, 3); }
  if (tipo === 'mejora') { g.mejoraId = $('dar-mejora').value; g.cantidad = clampN($('dar-n').value, 1, 5, 1); }
  if (tipo === 'escudo') g.cantidad = clampN($('dar-n').value, 1, 20, 1);
  if ($('dar-destino').value === 'servidor') {
    g.ambito = 'servidor';
    g.servidor = $('dar-servidor') ? $('dar-servidor').value : '';
  }
  if ($('dar-destino').value === 'codigo') {
    const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   /* sin letras que se confunden */
    g.codigo = 'ROBA-' + Array.from({ length: 4 }, () => ABC[(Math.random() * ABC.length) | 0]).join('');
  }
  window.__ultimoRegalo = g;   /* gancho para pruebas automáticas */
  const btn = $('btnDar');
  btn.disabled = true; btn.textContent = 'Enviando…';
  try {
    const id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await fdb.set(fdb.ref(db, RAIZ + '/regalos/' + id), g);
    if (g.codigo) {
      try { await navigator.clipboard.writeText(g.codigo); aviso('¡Código creado y copiado: ' + g.codigo + '! Compártelo con quien quieras.'); }
      catch (e) { aviso('¡Código creado: ' + g.codigo + '! Cópialo de la lista de abajo.'); }
    } else if (g.ambito === 'servidor') {
      aviso('¡Regalo enviado al servidor ' + nombreServidorAdmin(g.servidor) + '! Solo lo cobran los de ahí.');
    } else {
      aviso('¡Regalo enviado! Les aparecerá a los jugadores en unos segundos.');
    }
  } catch (e) {
    errorFB(e);
    aviso('No se pudo dar el regalo: ' + (e.code || e.message) +
      (String(e.code || e.message).includes('permission') ? ' → pega las reglas nuevas y vuelve a probar.' : ''), true);
  }
  btn.disabled = false; btn.textContent = '¡DAR REGALO!';
};
$('btnReglas').onclick = () => {
  $('reglasTxt').value = REGLAS;
  $('cajaReglas').hidden = false;
  $('reglasTxt').hidden = true;
  $('cajaReglas').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

/* ---- lista de regalos (en directo) ---- */
function describirRegaloAdmin(g) {
  if (g.tipo === 'monedas') return '+' + fmtN(g.cantidad) + ' monedas';
  if (g.tipo === 'meme') {
    const m = window.MEMES.find(x => x.id === g.memeId);
    return 'Meme: ' + (m ? m.nombre : g.memeId);
  }
  if (g.tipo === 'pack') return 'Pack: ' + (g.cantidad || 1) + ' memes ' +
    (window.RAREZAS[g.rareza] ? window.RAREZAS[g.rareza].nombre : '');
  if (g.tipo === 'mejora') {
    const m = window.MEJORAS.find(x => x.id === g.mejoraId);
    return 'Mejora: ' + (m ? m.nombre : g.mejoraId) + ' ×' + (g.cantidad || 1);
  }
  if (g.tipo === 'escudo') return 'Escudo anti-robo ×' + (g.cantidad || 1);
  return 'Regalo';
}
function dentroDe(ms) {
  const h = Math.floor(ms / 3600000), m = Math.round((ms % 3600000) / 60000);
  return h ? 'en ' + h + ' h' : 'en ' + Math.max(1, m) + ' min';
}
let desusRegalos = false;
function pintarRegalos(val) {
  const c = $('darLista');
  const ids = Object.keys(val || {}).sort((a, b) => (val[b].t || 0) - (val[a].t || 0));
  if (!ids.length) {
    c.innerHTML = '<p class="espera">Todavía no hay regalos. ¡Estrena el formulario de arriba!</p>';
    return;
  }
  const ahora = Date.now();
  c.innerHTML = '';
  for (const id of ids) {
    const g = val[id] || {};
    const cad = g.expira && +g.expira < ahora;
    const dura = g.expira ? (cad ? 'CADUCADO' : 'caduca ' + dentroDe(+g.expira - ahora)) : 'sin caducidad';
    const quien = g.ambito === 'servidor' ? 'Solo servidor ' + nombreServidorAdmin(g.servidor)
      : g.codigo ? 'Con código' : 'Para todos';
    c.insertAdjacentHTML('beforeend', `<div class="gtar ${cad ? 'caducado' : ''}" data-id="${id}">
      <b>🎁 ${describirRegaloAdmin(g)}</b>
      <small>${quien} · ${dura}${g.de ? ' · de ' + g.de : ''}${g.mensaje ? ' · «' + g.mensaje + '»' : ''}
        ${(+g.canjeados || 0) ? ' · canjeado ' + fmtN(g.canjeados) + ' veces' : ''}</small>
      ${g.codigo ? `<span class="cod"><code>${g.codigo}</code>
        <button class="btn copiar-cod">Copiar</button></span>` : ''}
      <button class="btn b quitar">Quitar</button>
    </div>`);
  }
  c.querySelectorAll('.quitar').forEach(b => b.onclick = async () => {
    const id = b.closest('.gtar').dataset.id;
    if (!confirm('¿Quitar este regalo? Los jugadores que ya lo tienen, se lo quedan.')) return;
    try { await fdb.remove(fdb.ref(db, RAIZ + '/regalos/' + id)); }
    catch (e) { aviso('No se pudo quitar: ' + (e.code || e.message), true); }
  });
  c.querySelectorAll('.copiar-cod').forEach(b => b.onclick = async () => {
    const cod = b.closest('.gtar').querySelector('code').textContent;
    try { await navigator.clipboard.writeText(cod); aviso('Código copiado: ' + cod); }
    catch (e) { aviso('Copia a mano: ' + cod); }
  });
}
function cargarRegalos() {
  if (desusRegalos || !db) return;
  desusRegalos = true;
  try {
    fdb.onValue(fdb.ref(db, RAIZ + '/regalos'), snap => pintarRegalos(snap.val() || {}),
      e => { errorFB(e); $('darLista').innerHTML = '<p class="espera">Sin permiso de lectura: pega las reglas de abajo.</p>'; });
  } catch (e) {
    errorFB(e);
    $('darLista').innerHTML = '<p class="espera">Sin permiso de lectura: pega las reglas de abajo.</p>';
  }
}
