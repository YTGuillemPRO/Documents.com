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
}/* ================= 7. ANFITRIÓN ================= */
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

/* ================= 8. INVITADO ================= */
function joinRoom(def) {
  if (!window.Peer) { toast('⚠️ Módulo multijugador no disponible', 'warn'); return; }
  busy('Conectando a la sala');
  const peer = new Peer({ debug: 0 });
  net.peer = peer;
  let done = false;
  const fail = m => {
    if (done) return; done = true;
    clearBusy();
    if (m) toast(m, 'warn');
    destroyPeer();
    net.role = 'off'; net.joined = false; net.conn = null;
    chip(); renderSrv();
  };
  peer.on('open', id => {
    net.me = id;
    const conn = peer.connect(PREFIX + def.rid, { reliable: true });
    net.conn = conn;
    conn.on('open', () => { try { conn.send({ t: 'J', name: mpName() }); } catch (e) { } });
    conn.on('data', d => { try { guestData(d); } catch (e) { } });
    conn.on('close', () => {
      if (net.joined) { toast('🔌 Conexión perdida con la sala', 'warn'); leaveRoom(true); }
      else fail('No se pudo conectar: la sala se cerró');
    });
    conn.on('error', () => { });
    setTimeout(() => { if (net.peer === peer && !net.joined) fail('⏱️ La sala no respondió. ¿Es correcto el código?'); }, 9000);
  });
  peer.on('error', e => {
    if (e && e.type === 'peer-unavailable') { fail('🔑 No hay ninguna sala con ese código'); return; }
    fail('⚠️ ' + peerErrText(e));
  });
}
function guestData(msg) {
  if (!msg || typeof msg !== 'object') return;
  switch (msg.t) {
    case 'W': {
      if (net.joined) return;
      net.joined = true;
      net.role = 'guest';
      net.room = {
        pub: !!(msg.room && msg.room.pub), rid: '', name: (msg.room && msg.room.name) || 'Sala',
        code: (msg.room && msg.room.code) || '', hostName: msg.host || '?',
      };
      /* guardamos TU granja real antes de sustituirla por la del anfitrión */
      net.myPlots = S.plots; net.myStock = S.stock; net.myStockT = S.stockT;
      applySnap(msg.snap);
      const own = (msg.players || []).find(pl => pl.id === (msg.you || net.me));
      if (own && isFinite(own.x) && isFinite(own.y)) {
        player.x = own.x; player.y = own.y; walkTarget = null; pending = null;
      }
      (msg.players || []).forEach(updRemote);
      net.chat = [];
      pushChat('sys', 'Te has unido a ' + net.room.name + ' (anfitrión: ' + net.room.hostName + ')', 'sys');
      toast('✅ ¡Conectado! Estás en la granja de ' + net.room.hostName, 'gold');
      clearBusy(); chip();
      break;
    }
    case 'S': applySnap(msg); break;
    case 'PL':
      (msg.players || []).forEach(updRemote);
      chip();
      break;
    case 'C':
      pushChat(msg.f, msg.m);
      if (msg.id !== net.me) setBub(msg.id, msg.m);
      break;
    case 'K':
      toast('🚪 ' + (msg.m || 'Te han expulsado de la sala'), 'warn');
      leaveRoom(true);
      break;
  }
}
function applySnap(s) {
  if (!s || !Array.isArray(s.plots)) return;
  S.plots = unpackPlots(s.plots);
  if (s.stock && typeof s.stock === 'object') S.stock = s.stock;
  if (typeof s.stockT === 'number' && isFinite(s.stockT)) S.stockT = clamp(s.stockT, 1, 9999);
  if (s.wid) {
    const w = WEATHERS.find(x => x.id === s.wid);
    if (w) {
      if (!curWeather || curWeather.id !== s.wid) { net.hostW = true; setWeather(w); }
      else weatherT = Math.max(1, s.wt || 5);
    }
  }
  const ps = $('pShop');
  if (ps && ps.classList.contains('open')) buildShop();
  if (s.ev) {
    const pp = plotPos(s.ev.i | 0);
    if (s.ev.k === 'h') {
      floatText(pp.x, pp.y - 58, s.ev.e || '🌾', '#fde047');
      sparkBurst(pp.x, pp.y - 10, '#fde047', 10);
      if (s.ev.n) toast('🌾 ' + s.ev.n + ' cosechó');
    } else if (s.ev.k === 'p') {
      floatText(pp.x, pp.y - 46, s.ev.e || '🌱', '#a3e635');
      if (s.ev.n) toast('🌱 ' + s.ev.n + ' plantó');
    }
  }
}
function updRemote(p) {
  if (!p || !p.id || p.id === net.me) return;
  let r = net.remotes.get(p.id);
  if (!r) {
    r = { x: fin(p.x, 0), y: fin(p.y, 0), tx: 0, ty: 0, dir: 1, mv: 0, step: Math.random() * 9, name: cleanName(p.name), col: colorOf(p.id), host: !!p.host, bub: '', bubT: 0 };
    r.tx = r.x; r.ty = r.y;
    net.remotes.set(p.id, r);
  }
  r.tx = fin(p.x, r.tx); r.ty = fin(p.y, r.ty);
  r.dir = p.dir === -1 ? -1 : 1;
  r.mv = p.mv ? 1 : 0;
  if (p.name) r.name = cleanName(p.name);
  r.host = !!p.host;
}
function setBub(id, m) {
  const r = net.remotes.get(id);
  if (r) { r.bub = String(m || '').slice(0, 42); r.bubT = 4; }
}

/* ================= 9. SALIR / ERRORES ================= */
function peerErrText(e) {
  if (!e) return 'Error de red desconocido';
  if (e.type === 'network') return 'Sin conexión con el servidor de salas. Revisa tu internet.';
  if (e.type === 'browser-incompatible') return 'Tu navegador no soporta WebRTC 😢';
  if (e.type === 'server-error') return 'El servidor de salas está ocupado. Prueba en un rato.';
  if (e.type === 'webrtc') return 'Tu red bloquea las conexiones P2P (VPN o firewall).';
  return 'Error de conexión (' + (e.type || '?') + ')';
}
function destroyPeer() {
  try { if (net.conn) net.conn.close(); } catch (e) { }
  try { if (net.peer) net.peer.destroy(); } catch (e) { }
  net.conn = null; net.peer = null;
}
function leaveRoom(auto) {
  const wasGuest = net.role === 'guest';
  const name = net.room ? net.room.name : '';
  if (net.role === 'host') broadcast({ t: 'K', m: 'El anfitrión ha cerrado la sala' });
  destroyPeer();
  net.role = 'off'; net.joined = false; net.room = null;
  net.conns = new Map(); net.remotes = new Map(); net.chat = [];
  if (wasGuest) {
    if (net.myPlots) S.plots = net.myPlots;
    if (net.myStock) S.stock = net.myStock;
    if (net.myStockT) S.stockT = net.myStockT;
    net.myPlots = null; net.myStock = null; net.myStockT = 0;
    try { save(); } catch (e) { }
    const ps = $('pShop');
    if (ps && ps.classList.contains('open')) buildShop();
  }
  chip();
  renderSrv();
  if (!auto) toast('🚪 Has salido' + (name ? ' de ' + name : ''));
}

/* ================= 10. AVATARES REMOTOS ================= */
function MPDraw() {
  if (net.role === 'off' || net.remotes.size === 0) return;
  for (const r of net.remotes.values()) drawAvatar(r);
}
function drawAvatar(r) {
  const s = w2s(r.x, r.y), z = zoom;
  if (s.x < -90 || s.x > vw + 90 || s.y < -120 || s.y > vh + 90) return;
  const bob = r.mv ? Math.abs(Math.sin(r.step)) * 3 * z : 0;
  ctx.fillStyle = 'rgba(40,60,30,0.35)';
  ctx.beginPath(); ctx.ellipse(s.x, s.y + 20 * z, 20 * z, 7 * z, 0, 0, 7); ctx.fill();
  ctx.save();
  ctx.translate(s.x, s.y - bob);
  if (r.dir < 0) ctx.scale(-1, 1);
  const lg = r.mv ? Math.sin(r.step * 2) * 5 * z : 0;
  ctx.fillStyle = '#3b5a8f';
  roundRect(-8 * z, 8 * z, 7 * z, 14 * z + lg, 3 * z); ctx.fill();
  roundRect(1 * z, 8 * z, 7 * z, 14 * z - lg, 3 * z); ctx.fill();
  ctx.fillStyle = r.col;
  roundRect(-13 * z, -14 * z, 26 * z, 26 * z, 8 * z); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  roundRect(-13 * z, -2 * z, 26 * z, 8 * z, 4 * z); ctx.fill();
  ctx.fillStyle = '#f0c090';
  roundRect(-17 * z, -10 * z, 5 * z, 14 * z, 2.5 * z); ctx.fill();
  roundRect(12 * z, -10 * z, 5 * z, 14 * z, 2.5 * z); ctx.fill();
  ctx.fillStyle = '#f7cf9e';
  ctx.beginPath(); ctx.arc(0, -22 * z, 11 * z, 0, 7); ctx.fill();
  ctx.fillStyle = '#3b2f1e';
  ctx.beginPath(); ctx.arc(3 * z, -24 * z, 1.6 * z, 0, 7); ctx.arc(8 * z, -24 * z, 1.6 * z, 0, 7); ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath(); ctx.ellipse(0, -30 * z, 16 * z, 5 * z, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -32 * z, 10 * z, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#b8842e';
  ctx.fillRect(-10 * z, -32 * z, 20 * z, 3 * z);
  ctx.restore();
  /* etiqueta con el nombre */
  ctx.save();
  ctx.textAlign = 'center';
  const label = (r.host ? '👑 ' : '') + r.name;
  const fs = Math.round(11 * Math.max(0.9, z));
  ctx.font = '800 ' + fs + 'px system-ui, sans-serif';
  const tw = ctx.measureText(label).width + 14;
  const ty = s.y - 44 * z - bob;
  ctx.fillStyle = 'rgba(255,248,225,.96)';
  roundRect(s.x - tw / 2, ty - fs - 6, tw, fs + 10, 8); ctx.fill();
  ctx.strokeStyle = '#b98d54'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#3b2f1e';
  ctx.fillText(label, s.x, ty);
  /* burbuja de chat */
  if (r.bubT > 0 && r.bub) {
    ctx.globalAlpha = Math.min(1, r.bubT / 0.5);
    const bf = Math.round(12 * Math.max(0.9, z));
    ctx.font = '700 ' + bf + 'px system-ui, sans-serif';
    const bw = ctx.measureText(r.bub).width + 18;
    const bh = bf + 10;
    const by = ty - fs - 14 - bh;
    ctx.fillStyle = 'rgba(255,255,255,.97)';
    roundRect(s.x - bw / 2, by, bw, bh, 9); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s.x - 6, by + bh); ctx.lineTo(s.x + 6, by + bh); ctx.lineTo(s.x, by + bh + 7);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3b2f1e';
    ctx.fillText(r.bub, s.x, by + bf + 2);
  }
  ctx.restore();
}

/* ================= 11. ENGAUCHES SOBRE game.js ================= */
function worldSig() {
  try { return JSON.stringify(S.plots) + '|' + JSON.stringify(S.stock); } catch (e) { return ''; }
}
function installHooks() {
  const _update = window.update, _render = window.render, _save = window.save;
  const _plantSeed = window.plantSeed, _harvest = window.harvest, _buySeed = window.buySeed;
  const _buyPlot = window.buyPlot, _doRebirth = window.doRebirth, _restock = window.restock;
  const _setWeather = window.setWeather;

  /* guardar: los invitados NUNCA guardan la granja del anfitrión */
  window.save = function () {
    if (net.role !== 'guest' || !net.myPlots) return _save();
    const hp = S.plots, hs = S.stock, ht = S.stockT;
    S.plots = net.myPlots; S.stock = net.myStock; S.stockT = net.myStockT;
    try { _save(); } finally { S.plots = hp; S.stock = hs; S.stockT = ht; }
  };
  /* el anfitrión es el único que reabastece / cambia el clima */
  window.restock = function (silent) {
    if (net.role === 'guest') { S.stockT = Math.max(S.stockT, 10); return; }
    _restock(silent);
    if (net.role === 'host') broadcast(snapPacket());
  };
  window.setWeather = function (w, silent) {
    if (net.role === 'guest' && !net.hostW) { weatherT = 5; return; }
    net.hostW = false;
    return _setWeather(w, silent);
  };
  /* acciones co-op */
  window.plantSeed = function (i, pid) {
    const b = worldSig();
    _plantSeed(i, pid);
    if (worldSig() === b) return;
    if (net.role === 'guest') gsend({ t: 'P', i, pid });
    else if (net.role === 'host') broadcast(snapPacket({ i, k: 'p', n: mpName() }));
  };
  window.harvest = function (i) {
    const b = worldSig();
    _harvest(i);
    if (worldSig() === b) return;
    if (net.role === 'guest') gsend({ t: 'H', i });
    else if (net.role === 'host') broadcast(snapPacket({ i, k: 'h', n: mpName() }));
  };
  window.buySeed = function (pid, qty) {
    const b = worldSig();
    _buySeed(pid, qty);
    if (worldSig() === b) return;
    if (net.role === 'guest') gsend({ t: 'B', pid, qty: Math.max(1, qty | 0) });
    else if (net.role === 'host') broadcast(snapPacket());
  };
  window.buyPlot = function (i) {
    if (net.role === 'guest') {
      toast('🔒 Solo el anfitrión puede desbloquear parcelas de SU granja', 'warn');
      return false;
    }
    const b = worldSig();
    const r = _buyPlot(i);
    if (worldSig() !== b && net.role === 'host') broadcast(snapPacket());
    return r;
  };
  window.doRebirth = function () {
    if (net.role === 'guest') { toast('⭐ Sal de la sala antes de renacer', 'warn'); return; }
    _doRebirth();
    if (net.role === 'host') broadcast(snapPacket());
  };
  /* bucle: lógica MP por fotograma */
  window.update = function (dt) {
    _update(dt);
    try { tick(dt); } catch (e) { }
  };
  /* render: avatares remotos por encima de todo */
  window.render = function () {
    _render();
    try { MPDraw(); } catch (e) { }
  };
}

/* ================= 12. BUCLE MP ================= */
function tick(dt) {
  if (net.role === 'off') return;
  net.sendT += dt;
  if (net.sendT >= 0.12) {
    net.sendT = 0;
    if (net.role === 'host') {
      const pk = plPacket();
      broadcast({ t: 'PL', players: pk });
      pk.forEach(updRemote); /* el anfitrión también ve a sus invitados */
    } else if (net.conn && net.joined) {
      gsend({
        t: 'M',
        x: Math.round(player.x * 10) / 10, y: Math.round(player.y * 10) / 10,
        dir: player.dir, mv: player.moving ? 1 : 0,
      });
    }
  }
  if (net.role === 'host') {
    net.snapT += dt;
    if (net.snapT >= 3) { net.snapT = 0; broadcast(snapPacket()); }
  }
  const k = 1 - Math.pow(0.002, dt);
  for (const r of net.remotes.values()) {
    r.x += (r.tx - r.x) * k;
    r.y += (r.ty - r.y) * k;
    if (r.mv) r.step += dt * 11;
    if (r.bubT > 0) r.bubT -= dt;
  }
}

/* ================= 13. EVENTOS DE UI ================= */
function sendChat() {
  const el = $('mpChatIn');
  if (!el) return;
  const m = cleanTxt(el.value);
  el.value = '';
  if (!m) return;
  if (net.role === 'host') {
    pushChat(mpName(), m, 'me');
    broadcast({ t: 'C', id: net.me, f: mpName(), m });
  } else if (net.role === 'guest' && net.joined) {
    pushChat(mpName(), m, 'me');
    gsend({ t: 'C', m });
  }
}
function doJoinCode() {
  const el = $('mpCodeIn');
  const code = String(el && el.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  if (code.length < 4) { toast('🔑 Introduce el código de 5 letras de la sala', 'warn'); return; }
  if (net.role !== 'off') leaveRoom(true);
  joinRoom({ pub: false, rid: code, name: 'Sala privada' });
}
function copyCode() {
  const c = net.room && net.room.code;
  if (!c) return;
  const ok = () => toast('📋 Código copiado: ' + c);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(ok, () => toast('Código de la sala: ' + c));
    else toast('Código de la sala: ' + c);
  } catch (e) { toast('Código de la sala: ' + c); }
}
function wireSrv() {
  const guardIn = el => {
    if (!el) return;
    el.addEventListener('keydown', e => e.stopPropagation());
    el.addEventListener('keyup', e => e.stopPropagation());
  };
  guardIn($('mpNameIn')); guardIn($('mpCodeIn')); guardIn($('mpChatIn'));

  const nameIn = $('mpNameIn');
  if (nameIn) nameIn.addEventListener('change', e => {
    const v = cleanName(e.target.value);
    e.target.value = v; net.name = v;
    try { localStorage.setItem('gag_mp_name', v); } catch (x) { }
    toast('🧑‍🌾 Nombre guardado: ' + v);
  });

  document.querySelectorAll('#pServersBody [data-pub]').forEach(el => {
    el.onclick = () => {
      const r = PUB_ROOMS.find(x => x.id === el.dataset.pub);
      if (!r) return;
      if (net.role !== 'off') leaveRoom(true);
      startHost({ pub: true, rid: r.id, name: r.n });
    };
  });
  const bind = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  bind('btnNewRoom', () => {
    if (net.role !== 'off') leaveRoom(true);
    startHost({ pub: false, rid: mkCode(), name: 'Sala de ' + mpName() });
  });
  bind('btnJoinCode', doJoinCode);
  const codeIn = $('mpCodeIn');
  if (codeIn) codeIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') doJoinCode(); });
  bind('btnCopyCode', copyCode);
  bind('btnLeave', () => leaveRoom(false));
  bind('btnSend', sendChat);
  const chatIn = $('mpChatIn');
  if (chatIn) chatIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') sendChat(); });
}

/* ================= 14. INICIO ================= */
function mpInit() {
  try {
    if (typeof S === 'undefined' || typeof $ !== 'function' || typeof plantSeed !== 'function') return;
    installHooks();
    const b = $('btnServers');
    if (b) b.onclick = () => {
      SND.click(); openPanel('pServers');
      renderSrv(); pingRooms();
    };
    const chipEl = document.createElement('button');
    chipEl.id = 'mpChip';
    chipEl.className = 'mpchip hidden';
    chipEl.title = 'Sala multijugador';
    chipEl.onclick = () => { SND.click(); openPanel('pServers'); renderSrv(); };
    const hud = $('hud');
    if (hud) hud.appendChild(chipEl);
    window.addEventListener('beforeunload', () => { try { if (net.role !== 'off') leaveRoom(true); } catch (e) { } });
    MP.ok = true;
  } catch (e) { console.warn('[MP] init:', e); }
}
mpInit();
})();
