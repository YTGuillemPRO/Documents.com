/* ============================================================
   🌱 GROW A GARDEN ES — mp.js · v3.3 MULTIJUGADOR (P2P WebRTC)
   ------------------------------------------------------------
   Navegador de servidores estilo clásico (1001 juegos):
   · 5 servidores públicos con estado EN VIVO (🟢 n jugadores)
   · Salas PRIVADAS con código de 5 letras
   · Entrar con código, chat, hasta 8 jugadores por sala
   · Todos juegan en la GRANJA DEL ANFITRIÓN (co-op real)
   · Tus monedas, semillas, mascotas y misiones siguen siendo tuyas
   ------------------------------------------------------------
   No modifica game.js: se engancha encima (wrappers).
   Requiere PeerJS desde CDN (index.html). Sin internet,
   el juego sigue funcionando en modo 1 jugador.
   ============================================================ */
(function () {
'use strict';

/* ================= 1. UTILIDADES ================= */
const MP = { ok: false };
window.MP = MP;

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function mkCode() {
  let c = '';
  for (let i = 0; i < 5; i++) c += CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)];
  return c;
}
function cleanName(s) {
  return String(s || '').replace(/[<>]/g, '').trim().slice(0, 14) || 'Granjero';
}
function cleanTxt(s) { return String(s || '').replace(/[<>]/g, '').trim().slice(0, 90); }

const COLORS = ['#e2574c', '#e2894c', '#d4b13c', '#7bb661', '#5cb8a5',
  '#5b9bd5', '#8b7bd5', '#d57bb0', '#9c8b7b', '#6b8f9c'];
function colorOf(id) {
  let h = 0; const s = String(id || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

const PREFIX = 'gag33-';
const MAXP = 8;
const PUB_ROOMS = [
  { id: 'pub1', ic: '🌱', n: 'Plaza Central', d: 'El clásico · charla y co-op' },
  { id: 'pub2', ic: '🌻', n: 'Granja del Sol', d: 'Cultivo tranquilo para nuevos' },
  { id: 'pub3', ic: '🍓', n: 'Valle Fresas', d: 'Intercambio de semillas' },
  { id: 'pub4', ic: '🌙', n: 'Huerto Lunar', d: 'Noche · mutaciones raras' },
  { id: 'pub5', ic: '🏰', n: 'Cortijo del Rey', d: 'Para granjeros expertos' },
];

/* ================= 2. ESTADO MP ================= */
const net = {
  role: 'off',            /* 'off' | 'host' | 'guest' */
  peer: null, conn: null,
  conns: new Map(),       /* host: peerId -> {conn,name,x,y,dir,mv} */
  remotes: new Map(),     /* id -> avatar remoto */
  me: null,
  room: null,             /* {pub,rid,name,code,hostName} */
  joined: false,
  name: '',
  chat: [],
  myPlots: null, myStock: null, myStockT: 0,
  hostW: false,
  sendT: 0, snapT: 0,
  busyTxt: '',
};
let chipCache = '';

/* ================= 3. NOMBRE ================= */
function mpName() {
  if (net.name) return net.name;
  let n = '';
  try { n = localStorage.getItem('gag_mp_name') || ''; } catch (e) { n = ''; }
  if (!n) {
    n = 'Granjero' + (100 + Math.floor(Math.random() * 900));
    try { localStorage.setItem('gag_mp_name', n); } catch (e) { }
  }
  net.name = n;
  return n;
}

/* ================= 4. PROTOCOLO ================= */
function packPlots() {
  return S.plots.map(p => p.c
    ? [p.u ? 1 : 0, 1, p.c.id, Math.round(p.c.left * 10) / 10, p.c.total, p.c.multi | 0, p.c.watered ? 1 : 0, p.c.mut || 0]
    : [p.u ? 1 : 0, 0]);
}
function unpackPlots(a) {
  const out = [];
  for (let i = 0; i < 30; i++) {
    const q = Array.isArray(a) ? a[i] : null;
    const u = q && q[0] ? true : (i < 6);
    let c = null;
    if (q && q[1]) {
      const P = PLANT(q[2]);
      if (P) c = {
        id: P.id, total: fin(q[4], P.grow),
        left: clamp(fin(q[3], 0), 0, Math.max(P.grow, 0.01)),
        multi: clamp(fin(q[5], P.multi), 0, 99) | 0,
        watered: !!q[6],
        mut: MUT(q[7]) ? q[7] : null,
      };
    }
    out.push({ u, c });
  }
  return out;
}
function snapPacket(ev) {
  return {
    t: 'S',
    plots: packPlots(),
    stock: S.stock,
    stockT: Math.round(S.stockT),
    wid: curWeather ? curWeather.id : null,
    wt: Math.round(weatherT),
    ev: ev || null,
  };
}
function plPacket() {
  const out = [{
    id: net.me, name: mpName(), host: 1,
    x: Math.round(player.x), y: Math.round(player.y),
    dir: player.dir, mv: player.moving ? 1 : 0,
  }];
  net.conns.forEach(e => out.push({
    id: e.conn.peer, name: e.name,
    x: Math.round(e.x), y: Math.round(e.y),
    dir: e.dir, mv: e.mv,
  }));
  return out;
}
function trySend(c, o) { try { if (c && c.open) c.send(o); } catch (e) { } }
function broadcast(o, except) {
  if (net.role !== 'host') return;
  net.conns.forEach(e => { if (e.conn !== except) trySend(e.conn, o); });
}
function gsend(o) { try { if (net.conn && net.conn.open && net.joined) net.conn.send(o); } catch (e) { } }

/* ================= 5. VISTAS (UI) ================= */
function renderSrv() {
  const b = $('pServersBody');
  if (!b) return;
  if (net.role === 'host' || (net.role === 'guest' && net.joined)) {
    b.innerHTML = roomHtml();
    renderChat();
  } else if (net.busyTxt) {
    b.innerHTML = '<div class="mpbusy">⏳ ' + esc(net.busyTxt) + '…</div>';
  } else {
    b.innerHTML = lobbyHtml();
  }
  wireSrv();
}

function lobbyHtml() {
  let h = '';
  if (!window.Peer)
    h += '<p class="mpnote">⚠️ <b>Sin conexión:</b> no se pudo cargar el módulo multijugador (PeerJS). Revisa tu internet y recarga. El juego funciona perfectamente en 1 jugador.</p>';
  h += '<div class="mpname"><span>🧑‍🌾 Nombre:</span>' +
    '<input id="mpNameIn" maxlength="14" spellcheck="false" value="' + esc(mpName()) + '"></div>';
  h += '<p class="mpnote">🌍 En una sala todos juegan en la <b>granja del anfitrión</b>: plantad, regad y cosechad juntos. Tus monedas, semillas, mascotas y misiones son siempre tuyas. Máx. ' + MAXP + ' jugadores.</p>';
  h += '<div class="sect">🌍 Servidores públicos</div><div id="srvList">';
  for (const r of PUB_ROOMS) {
    h += '<div class="srvrow"><span class="srvic">' + r.ic + '</span>' +
      '<div class="srvinfo"><b>' + esc(r.n) + '</b><small>' + esc(r.d) + '</small></div>' +
      '<span class="srvstat busy" id="stat-' + r.id + '">…</span>' +
      '<button class="btn sbtn" data-pub="' + r.id + '"' + (window.Peer ? '' : ' disabled') + '>Entrar</button></div>';
  }
  h += '</div>';
  h += '<div class="sect">🔑 Sala privada</div>';
  h += '<div class="mprowbtns"><button class="btn" id="btnNewRoom"' + (window.Peer ? '' : ' disabled') + '>➕ Crear sala privada</button></div>';
  h += '<div class="mpjoin"><input id="mpCodeIn" maxlength="5" placeholder="CÓDIGO" autocapitalize="characters" spellcheck="false">' +
    '<button class="btn" id="btnJoinCode"' + (window.Peer ? '' : ' disabled') + '>Entrar</button></div>';
  h += '<p class="mpnote">💡 Crea una sala privada y pasa el <b>código de 5 letras</b> a tus amigos para que entren con él.</p>';
  return h;
}

function roomHtml() {
  const host = net.role === 'host';
  const rn = net.room ? net.room.name : 'Sala';
  let h = '<div class="mproomhead"><b>' + esc(rn) + '</b>' +
    '<span class="mprole">' + (host
      ? '👑 Eres el anfitrión: están en TU granja'
      : '🏠 Anfitrión: ' + esc((net.room && net.room.hostName) || '?')) + '</span>';
  if (net.room && net.room.code)
    h += '<div class="mpcode">Código: <b>' + esc(net.room.code) + '</b>' +
      '<button class="btn ghost sbtn" id="btnCopyCode">📋 Copiar</button></div>';
  h += '</div>';
  const n = (host ? net.conns.size : net.remotes.size) + 1;
  h += '<div class="sect">👥 Jugadores (' + n + '/' + MAXP + ')</div><div class="plist">';
  if (host) {
    h += '<span class="pchipx me host">👑 ' + esc(mpName()) + ' (tú)</span>';
    net.conns.forEach(e => { h += '<span class="pchipx">' + esc(e.name) + '</span>'; });
  } else {
    h += '<span class="pchipx me">' + esc(mpName()) + ' (tú)</span>';
    net.remotes.forEach(r => {
      h += '<span class="pchipx' + (r.host ? ' host' : '') + '">' + (r.host ? '👑 ' : '') + esc(r.name) + '</span>';
    });
  }
  h += '</div>';
  h += '<div class="sect">💬 Chat</div><div class="mpchat" id="mpChat"></div>';
  h += '<div class="mpjoin"><input id="mpChatIn" maxlength="80" placeholder="Escribe un mensaje…" autocomplete="off">' +
    '<button class="btn" id="btnSend">➤</button></div>';
  h += '<div class="mprowbtns"><button class="btn danger" id="btnLeave">🚪 Salir de la sala</button></div>';
  return h;
}

function renderChat() {
  const el = $('mpChat');
  if (!el) return;
  el.innerHTML = net.chat.map(c =>
    c.cls === 'sys'
      ? '<div class="chatline sys">🔎 ' + esc(c.m) + '</div>'
      : '<div class="chatline ' + (c.cls || '') + '"><b>' + esc(c.f) + ':</b> ' + esc(c.m) + '</div>'
  ).join('');
  el.scrollTop = el.scrollHeight;
}
function pushChat(f, m, cls) {
  net.chat.push({ f, m: String(m || '').slice(0, 90), cls: cls || '' });
  if (net.chat.length > 60) net.chat.shift();
  renderChat();
}

function chip() {
  const el = $('mpChip');
  if (!el) return;
  if (net.role === 'off' || !net.room) { el.classList.add('hidden'); chipCache = ''; return; }
  const n = (net.role === 'host' ? net.conns.size : net.remotes.size) + 1;
  const html = '👥 ' + n + ' · ' + esc(net.room.name);
  if (html === chipCache) return;
  chipCache = html;
  el.innerHTML = html;
  el.classList.remove('hidden');
  const pn = $('pServers');
  if (pn && pn.classList.contains('open')) renderSrv();
}

function busy(t) { net.busyTxt = t; toast('⏳ ' + t + '…'); renderSrv(); }
function clearBusy() { net.busyTxt = ''; renderSrv(); }

/* ================= 6. PINGER (estado público) ================= */
let pinger = null;
function setStat(id, cls, txt) {
  const el = $('stat-' + id);
  if (el) { el.textContent = txt; el.className = 'srvstat ' + cls; }
}
function pingRooms() {
  if (!window.Peer || net.role !== 'off' || pinger) return;
  PUB_ROOMS.forEach(r => setStat(r.id, 'busy', '⏳ …'));
  let p;
  try { p = new Peer({ debug: 0 }); } catch (e) { return; }
  pinger = p;
  let pend = PUB_ROOMS.length;
  const finOne = () => {
    pend--;
    if (pend <= 0) { try { p.destroy(); } catch (e) { } if (pinger === p) pinger = null; }
  };
  p.on('open', () => {
    PUB_ROOMS.forEach(r => {
      try {
        const c = p.connect(PREFIX + r.id, { reliable: true });
        let over = false;
        const done = (cls, txt) => {
          if (over) return; over = true;
          clearTimeout(tm); setStat(r.id, cls, txt);
          try { c.close(); } catch (e) { } finOne();
        };
        const tm = setTimeout(() => done('off', '⚪ Vacío'), 3500);
        c.on('open', () => { try { c.send({ t: 'Q' }); } catch (e) { } });
        c.on('data', d => { if (d && d.t === 'R') done('on', '🟢 ' + (d.n || 1) + ' jug.'); });
        c.on('error', () => done('off', '⚪ Vacío'));
        c.on('close', () => done('off', '⚪ Vacío'));
      } catch (e) { setStat(r.id, 'off', '⚪ Vacío'); finOne(); }
    });
  });
  p.on('error', e => {
    if (e && e.type === 'peer-unavailable') return; /* se maneja por conexión */
    if (e && e.type === 'unavailable-id') return;
    try { p.destroy(); } catch (x) { }
    if (pinger === p) pinger = null;
    PUB_ROOMS.forEach(r => setStat(r.id, 'off', '⚠️ Sin red'));
  });
}

/* ================= 7. ANFITRIÓN ================= */
function startHost(def) {
  if (!window.Peer) { toast('⚠️ Módulo multijugador no disponible', 'warn'); return; }
  busy('Creando sala');
  const peer = new Peer(PREFIX + def.rid, { debug: 0 });
  net.peer = peer;
  peer.on('open', () => {
    net.role = 'host';
    net.me = peer.id;
    net.room = { pub: def.pub, rid: def.rid, name: def.name, code: def.pub ? '' : def.rid, hostName: mpName() };
    net.conns = new Map(); net.remotes = new Map(); net.chat = []; net.joined = false;
    clearBusy();
    pushChat('sys', def.pub
      ? 'Sala pública creada. ¡Espera a que entren jugadores!'
      : 'Sala privada creada. Comparte el código ' + net.room.code, 'sys');
    toast(def.pub ? '👑 Sala pública creada · esperando jugadores…' : '👑 Sala privada creada · código: ' + net.room.code, 'gold');
    chip();
  });
  peer.on('connection', conn => {
    conn.on('data', d => { try { hostData(conn, d); } catch (e) { } });
    const bye = () => hostBye(conn);
    conn.on('close', bye);
    conn.on('error', bye);
  });
  peer.on('error', e => {
    if (e && e.type === 'unavailable-id') {
      /* la sala pública ya existe → entramos como invitados */
      destroyPeer();
      clearBusy();
      joinRoom({ pub: def.pub, rid: def.rid, name: def.name });
      return;
    }
    clearBusy();
    toast('⚠️ ' + peerErrText(e), 'warn');
    destroyPeer();
  });
}
function hostBye(conn) {
  const e = net.conns.get(conn.peer);
  if (!e) return;
  net.conns.delete(conn.peer);
  net.remotes.delete(conn.peer);
  pushChat('sys', e.name + ' ha salido de la sala', 'sys');
  toast('🚪 ' + e.name + ' ha salido');
  broadcast({ t: 'PL', players: plPacket() });
  chip();
}
function hostData(conn, msg) {
  if (!msg || typeof msg !== 'object') return;
  const ent = net.conns.get(conn.peer);

  /* ping de estado (antes de unirse) */
  if (msg.t === 'Q') {
    try { conn.send({ t: 'R', n: net.conns.size + 1 }); } catch (e) { }
    return;
  }
  /* unirse */
  if (msg.t === 'J') {
    if (ent) return;
    if (net.conns.size >= MAXP) {
      try { conn.send({ t: 'K', m: 'La sala está llena (' + MAXP + '/' + MAXP + ')' }); setTimeout(() => { try { conn.close(); } catch (e) { } }, 400); } catch (e) { }
      return;
    }
    const name = cleanName(msg.name);
    net.conns.set(conn.peer, { conn, name, x: rnd(-140, 140), y: 40 + rnd(0, 160), dir: 1, mv: 0 });
    try {
      conn.send({
        t: 'W', you: conn.peer, host: mpName(),
        room: { name: net.room.name, code: net.room.code, pub: net.room.pub },
        players: plPacket(), snap: snapPacket(),
      });
    } catch (e) { }
    broadcast({ t: 'PL', players: plPacket() }, conn);
    pushChat('sys', name + ' se ha unido a la sala', 'sys');
    toast('👥 ' + name + ' se ha unido');
    SND.click();
    chip();
    return;
  }
  if (!ent) return;

  switch (msg.t) {
    case 'M':
      ent.x = fin(msg.x, ent.x); ent.y = fin(msg.y, ent.y);
      ent.dir = msg.dir === -1 ? -1 : 1; ent.mv = msg.mv ? 1 : 0;
      break;
    case 'P': {
      const i = msg.i | 0, p = S.plots[i], P = PLANT(msg.pid);
      if (p && p.u && !p.c && P) {
        p.c = { id: P.id, total: P.grow, left: P.grow, multi: P.multi, mut: null, watered: false };
        broadcast(snapPacket({ i, k: 'p', n: ent.name, e: P.e }));
      }
      break;
    }
    case 'H': {
      const i = msg.i | 0, p = S.plots[i];
      if (p && p.c) {
        const P = PLANT(p.c.id);
        p.c = null;
        broadcast(snapPacket({ i, k: 'h', n: ent.name, e: P ? P.e : '🌾' }));
      }
      break;
    }
    case 'B': {
      const P = PLANT(msg.pid);
      const st = P ? fin(S.stock[P.id], 0) : 0;
      if (P && st > 0) {
        S.stock[P.id] = Math.max(0, st - Math.max(1, msg.qty | 0));
        broadcast(snapPacket());
        toast('🛒 ' + ent.name + ' compró ' + P.e);
      }
      break;
    }
    case 'C': {
      const m = cleanTxt(msg.m);
      if (!m) return;
      pushChat(ent.name, m);
      const pkt = { t: 'C', id: conn.peer, f: ent.name, m };
      net.conns.forEach(en => { if (en.conn !== conn) trySend(en.conn, pkt); });
      break;
    }
  }
}
