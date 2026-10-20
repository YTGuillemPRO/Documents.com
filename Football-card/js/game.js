/* ============================================================
   FOOTBALL CARD OPENER 2026 — Motor del juego
   Economía · Tienda · Apertura cinematográfica · Mi Club ·
   Mercado · Misiones · Historial · Stats · Ajustes · Tutorial
   ============================================================ */

/* ---------- Estado + persistencia ---------- */
const SAVE_KEY = "fco2026_save_v1";
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const DEFAULT_STATE = {
  monedas: 500,
  coleccion: {},            // id -> { qty, fav }
  historial: [],            // últimas 50 aperturas
  stats: { packs:0, cartas:0, legendarias:0, epicas:0,
           gastado:0, ganado:0, vendidas:0, mejor:null, inicio:Date.now() },
  diario: { fecha:"", racha:0 },
  misiones: { fecha:"", progreso:{ abiertos:0, nuevas:0, raras:0, vendidas:0, club:0 }, reclamadas:[] },
  ajustes: { sfx:true, amb:true, vol:0.7, reducido:false },
  tutorial: false,
  ofertas: []
};
let S = cargar();

function cargar(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return Object.assign(structuredClone(DEFAULT_STATE), JSON.parse(raw));
  } catch(e){}
  return structuredClone(DEFAULT_STATE);
}
function guardar(){ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }

const hoy     = () => { const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const ayer    = () => new Date(Date.now()-864e5).toISOString().slice(0,10);
const fmtFecha= ts => new Date(ts).toLocaleString("es",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const valorVenta = p => Math.round(p.m * RARITIES[p.r].venta / 5) * 5; // precio redondeado a 5

/* ---------- Toasts ---------- */
function toast(msg, tipo=""){
  const t = document.createElement("div");
  t.className = "toast " + tipo;
  t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

/* ---------- Avatar SVG generado (sin enlaces externos) ---------- */
function avatarSVG(p){
  const c = RARITIES[p.r].color;
  const ini = p.n.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="gr-${p.r}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c}" stop-opacity=".28"/>
      <stop offset=".55" stop-color="#0a1220"/>
      <stop offset="1" stop-color="${c}" stop-opacity=".14"/>
    </linearGradient></defs>
    <rect width="100" height="100" fill="url(#gr-${p.r})"/>
    <circle cx="50" cy="36" r="15" fill="rgba(0,0,0,.5)"/>
    <path d="M22 88 Q50 56 78 88 L78 94 22 94 Z" fill="rgba(0,0,0,.5)"/>
    <text x="50" y="93" text-anchor="middle" font-size="13" font-weight="800"
      fill="${c}" opacity=".85" font-family="Segoe UI,sans-serif">${ini}</text>
  </svg>`;
}

/* ---------- HTML de una carta ---------- */
function cardHTML(p, opts = {}){
  const col = (S.coleccion[p.id] || {});
  const qty = opts.qty ?? col.qty ?? 0;
  const attrs = ["RIT","TIR","PAS","REG","DEF","FÍS"]
    .map((n,i)=>`<div class="pc-stat"><span>${n}</span><b>${p.a[i]}</b></div>`).join("");
  return `<div class="pcard" data-r="${p.r}" data-id="${p.id}">
    <div class="pc-badges">
      ${col.fav ? "⭐" : ""}
      ${qty > 1 ? `<span class="qty">×${qty}</span>` : ""}
    </div>
    ${opts.nueva ? `<div class="pc-new">NUEVA</div>` : ""}
    <div class="pc-top">
      <span class="pc-rating">${p.m}</span><span class="pc-pos">${p.p}</span>
      <span class="pc-flag">${COUNTRIES[p.c].f}</span>
    </div>
    <div class="pc-avatar">${avatarSVG(p)}</div>
    <div class="pc-name">${p.n}</div>
    <div class="pc-club">${p.cl} · ${COUNTRIES[p.c].n}</div>
    <div class="pc-stats">${attrs}</div>
  </div>`;
}

/* ---------- Tilt 3D suave (factor ASMR táctil) ---------- */
function activarTilt(container){
  if (S.ajustes.reducido) return;
  container.querySelectorAll(".pcard").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotateY(${x*9}deg) rotateX(${-y*9}deg) translateY(-4px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}

/* ---------- Partículas flotantes de fondo ---------- */
(function crearParticulas(){
  const bg = $("#bg-particles");
  for (let i = 0; i < 24; i++){
    const s = document.createElement("span");
    const size = 3 + Math.random() * 7;
    s.style.width = s.style.height = size + "px";
    s.style.left = Math.random() * 100 + "vw";
    s.style.setProperty("--dx", (Math.random()*120-60) + "px");
    s.style.animationDuration = (12 + Math.random() * 16) + "s";
    s.style.animationDelay = (-Math.random() * 20) + "s";
    bg.appendChild(s);
  }
})();

/* ---------- Navegación ---------- */
function switchScreen(name){
  $$(".screen").forEach(sc => sc.classList.remove("active"));
  $("#screen-" + name).classList.add("active");
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.screen === name));
  if (name === "club"){ S.misiones.progreso.club = Math.max(S.misiones.progreso.club, 1); resetMisionesSiNuevoDia(); renderClub(); }
  if (name === "tienda") renderTienda();
  if (name === "mercado") renderMercado();
  if (name === "misiones") renderMisiones();
  if (name === "historial") renderHistorial();
  if (name === "stats") renderStats();
  guardar();
}

/* ---------- Header ---------- */
function renderMonedas(){
  $("#coins-num").textContent = S.monedas.toLocaleString("es");
  const dip = $("#daily-dot");
  dip.classList.toggle("on", S.diario.fecha !== hoy());
}

/* ---------- Menú ---------- */
function renderMenu(){
  const unicas = Object.keys(S.coleccion).length;
  const totales = Object.values(S.coleccion).reduce((a,c)=>a+c.qty,0);
  $("#menu-stats").innerHTML =
    `<span>🃏 <b>${totales}</b> cartas</span>
     <span>🛡️ <b>${unicas}/${PLAYERS.length}</b> colección</span>
     <span>🎁 <b>${S.stats.packs}</b> packs abiertos</span>`;
}

/* ---------- Tienda ---------- */
function renderTienda(){
  $("#packs-grid").innerHTML = PACKS.map(pk => {
    const chips = Object.entries(pk.probs)
      .filter(([,v]) => v > 0)
      .map(([r,v]) => `<span class="pchip" style="color:${RARITIES[r].color}">${RARITIES[r].nombre} ${v}%</span>`)
      .join("");
    return `<div class="pack-card" style="--pc:${pk.color};--pcg:${pk.color}44">
      <div class="pack-mini" style="background:${pk.grad};border:2px solid ${pk.color}">${pk.emoji}</div>
      <div class="pack-name">${pk.nombre}</div>
      <div class="pack-info">${pk.cartas} cartas · ${pk.garantia ? "garantiza <b style='color:"+RARITIES[pk.garantia].color+"'>"+RARITIES[pk.garantia].nombre+"</b>" : "sin garantía"}<div class="pack-probs">${chips}</div></div>
      <button class="btn btn-primary" data-buy="${pk.id}">🪙 ${pk.precio.toLocaleString("es")}</button>
    </div>`;
  }).join("");
  $$("#packs-grid [data-buy]").forEach(b =>
    b.addEventListener("click", () => comprarPack(b.dataset.buy)));
}

/* ---------- Compra + apertura ---------- */
function comprarPack(id){
  AudioASM.init();
  const pk = PACKS.find(p => p.id === id);
  if (S.monedas < pk.precio){
    AudioASM.error();
    toast("No tienes monedas suficientes 🪙 Completa misiones o vende duplicados.", "bad");
    return;
  }
  S.monedas -= pk.precio;
  S.stats.gastado += pk.precio;
  AudioASM.coin();
  renderMonedas(); guardar();
  abrirPack(pk);      // 🎬 secuencia cinematográfica
}

/* Elige una rareza con las probabilidades del pack */
function tirarRareza(probs){
  let r = Math.random() * 100;
  for (const [rar, p] of Object.entries(probs)){
    if ((r -= p) <= 0) return rar;
  }
  return "comun";
}
function jugadorAleatorio(rareza){
  const pool = PLAYERS.filter(p => p.r === rareza);
  return pool[Math.floor(Math.random() * pool.length)];
}
function generarCartas(pk){
  const cartas = [];
  for (let i = 0; i < pk.cartas; i++)
    cartas.push(jugadorAleatorio(tirarRareza(pk.probs)));
  /* Garantía de rareza mínima */
  if (pk.garantiza){
    const min = RAR_ORDER.indexOf(pk.garantiza);
    if (!cartas.some(c => RAR_ORDER.indexOf(c.r) >= min))
      cartas[Math.floor(Math.random() * cartas.length)] = jugadorAleatorio(pk.garantiza);
  }
  return cartas;
}

/* ---------- ⏱ Utilidades de la secuencia ---------- */
let SKIP = false;
const wait = ms => new Promise(r => setTimeout(r, SKIP ? Math.min(ms, 60) : ms));

function spawnSparks(n, color){
  if (S.ajustes.reducido) return;
  for (let i = 0; i < n; i++){
    const s = document.createElement("div");
    s.className = "spark";
    s.style.setProperty("--sc", color);
    s.style.left = "50%"; s.style.top = "50%";
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 240;
    s.style.setProperty("--sx", Math.cos(ang) * dist + "px");
    s.style.setProperty("--sy", Math.sin(ang) * dist + "px");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1400);
  }
}
function spawnSmoke(n){
  if (S.ajustes.reducido) return;
  const stage = $("#opening-stage");
  for (let i = 0; i < n; i++){
    const s = document.createElement("div");
    s.className = "smoke";
    s.style.left = 42 + Math.random() * 16 + "%";
    s.style.top  = 46 + Math.random() * 10 + "%";
    s.style.setProperty("--sx", (Math.random() * 160 - 80) + "px");
    stage.appendChild(s);
    setTimeout(() => s.remove(), 2500);
  }
}
function countUp(el, target){
  return new Promise(res => {
    const dur = S.ajustes.reducido || SKIP ? 250 : 1300;
    const t0 = performance.now();
    (function paso(t){
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(target * eased);
      el.textContent = v;
      if (!SKIP && Math.random() < 0.34) AudioASM.tick(v);
      if (k < 1) requestAnimationFrame(paso); else res();
    })(t0);
  });
}

/* ============================================================
   🎬 SECUENCIA CINEMATOGRÁFICA DE APERTURA (10 pasos)
   ============================================================ */
async function abrirPack(pk){
  SKIP = false;
  const cartas = generarCartas(pk);
  const mejor = cartas.reduce((a,b) => RAR_ORDER.indexOf(b.r) >= RAR_ORDER.indexOf(a.r) ? b : a);
  const rColor = RARITIES[mejor.r].color;

  const ov = $("#opening");
  const packEl = $("#opening-pack");
  const slot = $("#opening-card-slot");
  const actions = $("#opening-actions");

  /* preparar overlay */
  ov.classList.remove("hidden");
  ov.classList.add("cine");
  $("#screen-tint").style.background = "transparent";
  $("#screen-tint").style.opacity = 0;
  $("#light-beam").style.opacity = 0;
  slot.innerHTML = ""; actions.innerHTML = "";
  $("#rating-count").className = ""; $("#rating-count").textContent = "";
  $("#reveal-info").className = ""; $("#reveal-info").innerHTML = "";
  packEl.className = "";
  packEl.style.setProperty("--pg", rColor + "66");
  packEl.querySelector(".op-body").textContent = pk.emoji;
  packEl.querySelector(".op-body").style.background = pk.grad;
  packEl.querySelector(".op-body").style.borderColor = pk.color;

  /* 1-2. Modo cine + pack entra flotando con luz dinámica */
  AudioASM.tension();
  packEl.classList.add("pack-in");
  await wait(1500);

  /* 3. El pack respira y brilla */
  packEl.classList.add("pack-breathe");
  AudioASM.tension();
  await wait(2200);

  /* 4. Vibración + partículas + rayo de luz */
  packEl.classList.remove("pack-breathe");
  packEl.classList.add("pack-shake");
  const beam = $("#light-beam");
  beam.style.opacity = 0.9;
  beam.style.background = `linear-gradient(180deg, transparent, ${rColor}55 45%, transparent)`;
  spawnSparks(mejor.r === "legendaria" ? 26 : 14, rColor);
  await wait(1600);

  /* 5. Flash + la pantalla se tiñe del color de la rareza */
  const fl = document.createElement("div");
  fl.className = "open-flash";
  ov.appendChild(fl); setTimeout(() => fl.remove(), 1000);
  AudioASM.whoosh();
  const tint = $("#screen-tint");
  tint.style.background = `radial-gradient(circle at 50% 45%, ${rColor}33, transparent 65%)`;
  tint.style.opacity = 1;

  /* 6. El pack estalla → humo */
  packEl.classList.remove("pack-shake");
  packEl.classList.add("pack-explode");
  spawnSmoke(10);
  if (mejor.r === "legendaria" || mejor.r === "epica") spawnSparks(20, rColor);
  await wait(950);
  packEl.style.display = "none";
  await wait(500);

  /* 7-10. Revelado carta a carta */
  const obtenidas = [];
  for (let i = 0; i < cartas.length; i++){
    await revelarCarta(cartas[i], i, cartas.length, obtenidas, rColor);
  }

  /* Resumen final */
  const nuevas = obtenidas.filter(o => o.nueva).length;
  slot.innerHTML = `<div style="text-align:center">
    <h2 style="margin-bottom:4px">Pack completado ✅</h2>
    <p style="color:var(--muted);margin-bottom:14px">
      ${obtenidas.length} cartas · ${nuevas} nuevas · ganaste 🪙 ${obtenidas.filter(o=>o.vendida).reduce((a,o)=>a+o.valor,0)} vendiendo</p>
    <div class="cards-grid cards-sm" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));justify-content:center">
      ${cartas.map(c => `<div style="pointer-events:none">${cardHTML(c)}</div>`).join("")}
    </div></div>`;
  AudioASM.success();
  actions.innerHTML = "";
  const btnFin = document.createElement("button");
  btnFin.className = "btn btn-primary btn-lg";
  btnFin.textContent = "⬅ VOLVER AL JUEGO";
  btnFin.onclick = () => { AudioASM.click(); cerrarOpening(); };
  actions.appendChild(btnFin);
}

/* Revelado de UNA carta (pasos 7→10) */
async function revelarCarta(p, idx, total, obtenidas, rColor){
  const rc = $("#rating-count"), ri = $("#reveal-info"), slot = $("#opening-card-slot");
  slot.innerHTML = ""; actions.innerHTML = "";
  ri.className = ""; ri.innerHTML = "";
  rc.className = "";

  /* 7. Contador de media con ticks ASMR */
  rc.className = "show";
  rc.style.color = RARITIES[p.r].color;
  rc.style.textShadow = `0 0 44px ${RARITIES[p.r].color}aa`;
  await countUp(rc, p.m);
  await wait(500);

  /* 8. Nacionalidad · posición · nombre aparecen en secuencia */
  ri.innerHTML = `<span class="ri-item" style="animation-delay:.0s">${COUNTRIES[p.c].f} ${COUNTRIES[p.c].n}</span>
    <span class="ri-item" style="animation-delay:.35s">${p.p}</span>
    <span class="ri-item" style="animation-delay:.7s;color:${RARITIES[p.r].color}">${p.n}</span>`;
  ri.className = "show";
  AudioASM.hover();
  await wait(1300);

  /* 9. La carta entra con giro épico */
  rc.className = ""; ri.className = "";
  slot.innerHTML = cardHTML(p, { nueva: !S.coleccion[p.id] });
  AudioASM.reveal(p.r);
  if (p.r === "legendaria" || p.r === "epica") spawnSparks(p.r === "legendaria" ? 30 : 16, RARITIES[p.r].color);
  activarTilt(slot);
  await wait(SKIP ? 200 : 1600);

  /* 10. Botones GUARDAR / VENDER / CONTINUAR */
  const valor = valorVenta(p);
  return new Promise(res => {
    const ya = !!S.coleccion[p.id];
    const fin = (accion) => {
      if (accion === "vender"){
        S.monedas += valor; S.stats.ganado += valor; S.stats.vendidas++;
        S.misiones.progreso.vendidas++;
        AudioASM.coin();
        toast(`+🪙 ${valor} por vender a ${p.n}`, "gold");
        obtenidas.push({ nueva:false, vendida:true, valor });
      } else {
        const era = !!S.coleccion[p.id];
        const c = S.coleccion[p.id] || { qty:0, fav:false };
        c.qty++; S.coleccion[p.id] = c;
        if (!era){
          S.stats.cartas++; S.misiones.progreso.nuevas++;
          if (RAR_ORDER.indexOf(p.r) >= 2) S.misiones.progreso.raras++;
          if (!S.stats.mejor || p.m > PBY[S.stats.mejor].m) S.stats.mejor = p.id;
        }
        if (p.r === "legendaria") S.stats.legendarias++;
        if (p.r === "epica") S.stats.epicas++;
        AudioASM.save();
        obtenidas.push({ nueva:!era, vendida:false, valor });
      }
      registrarPackSiTermina(); guardar(); renderMonedas();
      res();
    };

    const mk = (txt, cls, fn) => {
      const b = document.createElement("button");
      b.className = "btn " + cls; b.textContent = txt;
      b.onclick = () => { AudioASM.click(); fin(fn); };
      return b;
    };
    actions.append(
      mk("💾 GUARDAR", "btn-primary", "guardar"),
      mk(`💰 VENDER (🪙${valor})`, "btn-ghost", "vender"),
      mk(idx + 1 < total ? "➡️ CONTINUAR" : "✅ FINALIZAR", "btn-ghost", "guardar")
    );
    if (ya) actions.insertBefore(
      Object.assign(document.createElement("span"),
        { className:"pc-new", style:"position:static;padding:10px;color:var(--muted)" }),
      actions.firstChild).textContent = "duplicado ×" + S.coleccion[p.id].qty;
  });
}

/* Registrar el pack en historial/stats/misiones al terminar */
let packEnCurso = null;
function registrarPackSiTermina(){
  if (!packEnCurso) return;
}

function cerrarOpening(){
  /* Historial + stats del pack (se registran al cerrar) */
  $("#opening").classList.add("hidden");
  $("#opening").classList.remove("cine");
  $("#opening-pack").style.display = "";
  $("#screen-tint").style.opacity = 0;
  $("#light-beam").style.opacity = 0;
  SKIP = false;
  renderMenu(); renderMonedas();
  switchScreen($(".tab.active").dataset.screen || "menu");
}

/* ---------- Mi Club ---------- */
function cartasFiltradas(){
  const r = $("#f-rareza").value, pos = $("#f-pos").value,
        ord = $("#f-orden").value, q = $("#f-search").value.trim().toLowerCase();
  let list = Object.keys(S.coleccion)
    .map(id => ({ p:PBY[id], c:S.coleccion[id] }))
    .filter(x => !r || x.p.r === r)
    .filter(x => !pos || x.p.p === pos)
    .filter(x => !q || x.p.n.toLowerCase().includes(q) || x.p.cl.toLowerCase().includes(q));
  const sorts = {
    "media-desc": (a,b)=>b.p.m-a.p.m, "media-asc": (a,b)=>a.p.m-b.p.m,
    "rareza-desc":(a,b)=>RAR_ORDER.indexOf(b.p.r)-RAR_ORDER.indexOf(a.p.r),
    "nombre":     (a,b)=>a.p.n.localeCompare(b.p.n)
  };
  return list.sort(sorts[ord]);
}
function renderClub(){
  const list = cartasFiltradas();
  const grid = $("#club-grid");
  grid.innerHTML = list.map(x => cardHTML(x.p)).join("") ||
    `<p class="empty" style="grid-column:1/-1">Ninguna carta coincide con los filtros 🔍</p>`;
  $("#club-empty").classList.toggle("hidden", Object.keys(S.coleccion).length > 0);
  const total = list.reduce((a,x)=>a + valorVenta(x.p) * x.c.qty, 0);
  const unicas = list.length;
  const favs = list.filter(x=>x.c.fav).length;
  $("#club-count").textContent = unicas + " únicas · " +
    list.reduce((a,x)=>a+x.c.qty,0) + " totales";
  $("#club-value").innerHTML = `Valor: <b>🪙 ${total.toLocaleString("es")}</b>`;
  $("#club-fav").textContent = "⭐ " + favs;
  activarTilt(grid);
  /* clic → detalle */
  grid.querySelectorAll(".pcard").forEach(el =>
    el.addEventListener("click", () => mostrarDetalle(el.dataset.id)));
}
function mostrarDetalle(id){
  const p = PBY[id], c = S.coleccion[id];
  const valor = valorVenta(p);
  const btns = [];
  btns.push({ txt: c.fav ? "💔 Quitar favorito" : "⭐ Marcar favorito", cls:"btn-ghost", fn(){
    c.fav = !c.fav; guardar(); AudioASM.click(); cerrarModal(); renderClub(); renderMenu();
  }});
  if (c.qty > 1) btns.push({ txt:`💰 Vender duplicado (🪙${valor})`, cls:"btn-primary", fn(){
    c.qty--; S.monedas += valor; S.stats.ganado += valor; S.stats.vendidas++;
    S.misiones.progreso.vendidas++;
    AudioASM.coin(); toast(`+🪙 ${valor} · ${p.n} vendido`, "gold");
    guardar(); cerrarModal(); renderMonedas(); renderClub();
  }});
  btns.push({ txt:"Cerrar", cls:"btn-ghost", fn(){ cerrarModal(); AudioASM.click(); }});
  abrirModal(`${p.n} — ${p.m} ${RARITIES[p.r].nombre}`, cardHTML(p), btns);
}

/* ---------- Modal genérico ---------- */
function abrirModal(titulo, bodyHTML, botones){
  $("#modal-title").textContent = titulo;
  $("#modal-body").innerHTML = bodyHTML;
  const acts = $("#modal-actions"); acts.innerHTML = "";
  botones.forEach(b => {
    const el = document.createElement("button");
    el.className = "btn " + b.cls; el.textContent = b.txt; el.onclick = b.fn;
    acts.appendChild(el);
  });
  $("#modal-backdrop").classList.remove("hidden");
}
function cerrarModal(){ $("#modal-backdrop").classList.add("hidden"); }

/* ---------- Mercado ---------- */
function ofertasValidas(){
  if (!S.ofertas || S.ofertas.length !== 3)
    S.ofertas = [randomPonderado(), randomPonderado(), randomPonderado()].map(p=>p.id);
  return S.ofertas.map(id => PBY[id]);
}
function randomPonderado(){
  const w = { comun:50, especial:28, rara:15, epica:5.5, legendaria:1.5 };
  let r = Math.random() * 100;
  for (const [rar,p] of Object.entries(w)) if ((r -= p) <= 0) return jugadorAleatorio(rar);
  return jugadorAleatorio("comun");
}
function renderMercado(){
  const ofs = ofertasValidas();
  const grid = $("#mercado-ofertas");
  grid.innerHTML = ofs.map((p,i) => {
    const precio = Math.round(valorVenta(p) * 2.2 / 10) * 10;
    return `<div>${cardHTML(p)}
      <button class="btn btn-primary btn-sm" style="width:100%;margin-top:8px" data-of="${i}">
        🪙 ${precio.toLocaleString("es")}</button></div>`;
  }).join("");
  grid.querySelectorAll("[data-of]").forEach(b => b.addEventListener("click", () => {
    const i = +b.dataset.of, p = PBY[S.ofertas[i]];
    const precio = Math.round(valorVenta(p) * 2.2 / 10) * 10;
    AudioASM.init();
    if (S.monedas < precio){ AudioASM.error(); toast("Monedas insuficientes 🪙","bad"); return; }
    S.monedas -= precio; S.stats.gastado += precio;
    const c = S.coleccion[p.id] || { qty:0, fav:false };
    c.qty++; S.coleccion[p.id] = c;
    if (!S.stats.mejor || p.m > PBY[S.stats.mejor].m) S.stats.mejor = p.id;
    S.ofertas[i] = randomPonderado().id;   // reponer hueco
    AudioASM.coin(); toast(`¡${p.n} (${p.m}) comprado! 🛒`, "good");
    guardar(); renderMonedas(); renderMercado();
  }));
  activarTilt(grid);

  /* lista de duplicados vendibles */
  const dups = Object.keys(S.coleccion)
    .map(id => ({ p:PBY[id], c:S.coleccion[id] }))
    .filter(x => x.c.qty > 1)
    .sort((a,b)=>b.p.m-a.p.m);
  const lista = $("#mercado-vender");
  lista.innerHTML = dups.map(x => `<div class="sell-row">
    <div class="sr-ava">${avatarSVG(x.p)}</div>
    <div class="sr-info"><div class="sr-name">${x.p.n} <small style="color:${RARITIES[x.p.r].color}">${x.p.m}</small></div>
      <div class="sr-sub">${x.p.p} · ${x.p.cl} · ×${x.c.qty}</div></div>
    <div class="sr-price">🪙 ${valorVenta(x.p)}</div>
    <button class="btn btn-ghost btn-sm" data-sell="${x.p.id}">Vender</button>
  </div>`).join("");
  $("#sell-empty").style.display = dups.length ? "none" : "block";
  lista.querySelectorAll("[data-sell]").forEach(b => b.addEventListener("click", () => {
    const p = PBY[b.dataset.sell], c = S.coleccion[p.id];
    c.qty--; S.monedas += valorVenta(p);
    S.stats.ganado += valorVenta(p); S.stats.vendidas++;
    S.misiones.progreso.vendidas++;
    AudioASM.coin(); toast(`+🪙 ${valorVenta(p)} · ${p.n} vendido`, "gold");
    guardar(); renderMonedas(); renderMercado();
  }));
}

/* ---------- Misiones + recompensa diaria ---------- */
function resetMisionesSiNuevoDia(){
  if (S.misiones.fecha !== hoy()){
    S.misiones = { fecha:hoy(), progreso:{ abiertos:0, nuevas:0, raras:0, vendidas:0, club:0 }, reclamadas:[] };
    guardar();
  }
}
function claimDiario(){
  AudioASM.init();
  if (S.diario.fecha === hoy()){ toast("Ya reclamaste hoy 🔒 vuelve mañana", "bad"); return; }
  resetMisionesSiNuevoDia();
  S.diario.racha = (S.diario.fecha === ayer()) ? S.diario.racha + 1 : 1;
  const premio = 250 + Math.min(S.diario.racha - 1, 5) * 50;
  S.diario.fecha = hoy();
  S.monedas += premio; S.stats.ganado += premio;
  AudioASM.coin();
  toast(`🎁 Recompensa diaria: +🪙 ${premio} · racha ${S.diario.racha}🔥`, "gold");
  guardar(); renderMonedas();
}
function renderMisiones(){
  resetMisionesSiNuevoDia();
  const db = $("#daily-box");
  const disponible = S.diario.fecha !== hoy();
  db.innerHTML = `<div style="font-size:2.2rem">🎁</div>
    <div><h3>Recompensa diaria</h3>
    <p>${disponible ? "¡Disponible ahora! Racha actual: " + S.diario.racha + "🔥"
       : "Ya reclamada hoy. Vuelve mañana 🌙"}</p></div>
    <button class="btn ${disponible ? "btn-primary" : "btn-ghost"}" id="btn-claim-daily"
      ${disponible ? "" : "disabled style='opacity:.5'"}>🪙 ${250 + Math.min(S.diario.racha,5)*50}</button>`;
  $("#btn-claim-daily").onclick = claimDiario;

  $("#misiones-list").innerHTML = MISSIONS.map(m => {
    const prog = Math.min(S.misiones.progreso[m.campo], m.meta);
    const completa = prog >= m.meta;
    const reclamada = S.misiones.reclamadas.includes(m.id);
    return `<div class="mission ${completa ? "done" : ""}">
      <div class="m-row">
        <div class="m-icon">${m.icon}</div>
        <div class="m-info">
          <div class="m-name">${m.txt}</div>
          <div class="m-reward">🪙 ${m.recompensa}</div>
        </div>
        ${completa && !reclamada
          ? `<button class="btn btn-primary btn-sm m-claim" data-claim="${m.id}">RECLAMAR</button>`
          : `<span style="color:var(--muted);font-size:.8rem">${prog}/${m.meta}${reclamada?" ✔":""}</span>`}
      </div>
      <div class="m-bar"><div class="m-fill" style="width:${(prog/m.meta)*100}%"></div></div>
    </div>`;
  }).join("");
  $$("[data-claim]").forEach(b => b.addEventListener("click", () => {
    const m = MISSIONS.find(x => x.id === b.dataset.claim);
    if (S.misiones.reclamadas.includes(m.id)) return;
    S.misiones.reclamadas.push(m.id);
    S.monedas += m.recompensa; S.stats.ganado += m.recompensa;
    AudioASM.coin();
    toast(`Misión completada: +🪙 ${m.recompensa} 🎯`, "gold");
    guardar(); renderMonedas(); renderMisiones();
  }));
}

/* ---------- Historial ---------- */
function renderHistorial(){
  const list = $("#historial-list");
  list.innerHTML = S.historial.map(h => `<div class="hist-item">
    <div class="hi-top">
      <span class="hi-pack">${h.pack}</span>
      <span class="hi-date">${h.fecha}</span>
    </div>
    <div class="hi-cards">${h.cartas.map(c =>
      `<span class="hi-chip" style="color:${RARITIES[c.r].color};border-color:${RARITIES[c.r].color}55">
        ${c.m} ${c.n}${c.nueva ? " ✦" : ""}</span>`).join("")}</div>
  </div>`).join("");
  $("#hist-empty").style.display = S.historial.length ? "none" : "block";
}

/* ---------- Stats ---------- */
function renderStats(){
  const unicas = Object.keys(S.coleccion).length;
  const totales = Object.values(S.coleccion).reduce((a,c)=>a+c.qty,0);
  const st = S.stats;
  const caja = (n,l) => `<div class="stat-box"><div class="stat-num">${n}</div><div class="stat-label">${l}</div></div>`;
  $("#stats-grid").innerHTML =
    caja(st.packs, "packs abiertos") +
    caja(unicas + "/" + PLAYERS.length, "colección") +
    caja(totales, "cartas totales") +
    caja(st.legendarias, "legendarias") +
    caja(st.epicas, "épicas") +
    caja("🪙 " + st.gastado.toLocaleString("es"), "gastado") +
    caja("🪙 " + st.ganado.toLocaleString("es"), "ganado") +
    caja(st.vendidas, "cartas vendidas");
  $("#best-card-box").innerHTML = st.mejor
    ? `<h3 class="col-title" style="justify-content:center">🏆 Tu mejor carta</h3>${cardHTML(PBY[st.mejor])}`
    : `<p class="empty">Abre packs para conseguir tu mejor carta…</p>`;
  activarTilt($("#stats-grid"));
}

/* ---------- Ajustes ---------- */
function aplicarAjustes(){
  document.body.classList.toggle("reduced", S.ajustes.reducido);
  AudioASM.toggleSFX(S.ajustes.sfx);
  AudioASM.toggleAmb(S.ajustes.amb && S.ajustes.sfx);
  AudioASM.setVolume(S.ajustes.vol);
  $("#btn-sound").textContent = S.ajustes.sfx ? "🔊" : "🔇";
}
function confirmarReset(){
  AudioASM.click();
  abrirModal("⚠️ ¿Borrar todo el progreso?", 
    "Se eliminarán tus monedas, cartas, misiones y estadísticas. Esta acción no se puede deshacer.",
    [
      { txt:"Cancelar", cls:"btn-ghost", fn:cerrarModal },
      { txt:"🗑️ Sí, borrar todo", cls:"btn-danger", fn(){
        localStorage.removeItem(SAVE_KEY);
        location.reload();
      }}
    ]);
}

/* ---------- Tutorial ---------- */
const TUTORIAL = [
  { t:"👋 ¡Bienvenido a FC Opener 2026!", b:"Abre packs de cartas de fútbol, colecciona jugadores de todo el mundo y completa tu álbum. Empiezas con <b>🪙 500</b>." },
  { t:"🛒 Tienda y packs", b:"Hay <b>6 tipos de pack</b> (del Bronce al Legendario). Cuanto mejor el pack, más cartas y mayores probabilidades de rareza alta. Las probabilidades se muestran en cada pack." },
  { t:"🎬 La apertura", b:"Cada pack se abre con una <b>secuencia cinematográfica</b>: vibración, luces, humo… y decides carta a carta si <b>guardarla</b> o <b>venderla</b>. Las mejores cartas tienen efectos extra." },
  { t:"🎯 Monedas y misiones", b:"Gana monedas con la <b>recompensa diaria</b>, las <b>misiones</b> y vendiendo duplicados en el <b>Mercado</b>. ¡Suerte, entrenador!" }
];
function verTutorial(){
  let i = 0;
  const paso = () => {
    const s = TUTORIAL[i];
    abrirModal(s.t, s.b, [
      ...(i < TUTORIAL.length - 1
        ? [{ txt:"Siguiente →", cls:"btn-primary", fn(){ AudioASM.click(); i++; paso(); } }]
        : [{ txt:"¡A jugar! 🎮", cls:"btn-primary", fn(){ AudioASM.success(); S.tutorial = true; guardar(); cerrarModal(); }}])
    ]);
  };
  paso();
}

/* ---------- Sonido header ---------- */
function toggleSound(){
  AudioASM.init();
  S.ajustes.sfx = !S.ajustes.sfx;
  if (S.ajustes.sfx) AudioASM.click();
  aplicarAjustes(); guardar();
}

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
function init(){
  /* Registrar el pack recién abierto en historial/stats/misiones
     (se llama al INICIO de la secuencia) */
  const abrirPackOriginal = abrirPack;

  resetMisionesSiNuevoDia();
  renderMonedas(); renderMenu(); aplicarAjustes();

  /* nav */
  $$(".tab").forEach(t => t.addEventListener("click", () => {
    AudioASM.init(); AudioASM.click(); switchScreen(t.dataset.screen);
  }));
  $("#btn-jugar").onclick   = () => { AudioASM.init(); AudioASM.click(); switchScreen("tienda"); };
  $("#btn-coleccion").onclick = () => { AudioASM.init(); AudioASM.click(); switchScreen("club"); };
  $("#btn-daily").onclick   = claimDiario;
  $("#btn-sound").onclick   = toggleSound;
  $("#btn-skip")?.addEventListener?.("click", ()=>{});

  /* saltar animación */
  $("#opening-skip").onclick = () => { SKIP = true; AudioASM.click(); };

  /* filtros club */
  ["#f-rareza","#f-pos","#f-orden"].forEach(s =>
    $(s).addEventListener("change", () => { AudioASM.hover(); renderClub(); }));
  $("#f-search").addEventListener("input", renderClub);

  /* mercado */
  $("#btn-rotate").onclick = () => {
    AudioASM.click();
    S.ofertas = [randomPonderado(), randomPonderado(), randomPonderado()].map(p=>p.id);
    guardar(); renderMercado();
    toast("Ofertas rotadas 🔄", "good");
  };
  $("#btn-vender-comunes").onclick = () => {
    const dups = Object.keys(S.coleccion).map(id => ({p:PBY[id], c:S.coleccion[id]}))
      .filter(x => x.c.qty > 1 && x.p.r === "comun");
    if (!dups.length){ AudioASM.error(); toast("No tienes comunes duplicados.", "bad"); return; }
    let total = 0;
    dups.forEach(x => {
      total += valorVenta(x.p) * (x.c.qty - 1);
      S.misiones.progreso.vendidas += (x.c.qty - 1);
      S.stats.vendidas += (x.c.qty - 1);
      x.c.qty = 1;
    });
    S.monedas += total; S.stats.ganado += total;
    AudioASM.coin();
    toast(`♻️ Vendiste duplicados comunes: +🪙 ${total}`, "gold");
    guardar(); renderMonedas(); renderMercado();
  };

  /* ajustes */
  $("#set-sfx").checked  = S.ajustes.sfx;
  $("#set-amb").checked  = S.ajustes.amb;
  $("#set-vol").value    = S.ajustes.vol * 100;
  $("#set-red").checked  = S.ajustes.reducido;
  $("#set-sfx").onchange = e => { S.ajustes.sfx = e.target.checked; AudioASM.init(); aplicarAjustes(); guardar(); if(e.target.checked){AudioASM.click();} };
  $("#set-amb").onchange = e => { S.ajustes.amb = e.target.checked; AudioASM.init(); aplicarAjustes(); guardar(); };
  $("#set-vol").oninput  = e => { S.ajustes.vol = e.target.value / 100; AudioASM.init(); AudioASM.setVolume(S.ajustes.vol); guardar(); };
  $("#set-red").onchange = e => { S.ajustes.reducido = e.target.checked; aplicarAjustes(); guardar(); };
  $("#btn-tutorial").onclick = verTutorial;
  $("#btn-reset").onclick = confirmarReset;

  /* hover ASMR en todos los botones (solo dispositivos con ratón) */
  if (window.matchMedia("(hover:hover)").matches){
    document.addEventListener("mouseover", e => {
      if (e.target.closest(".btn,.tab,.icon-btn,.pack-card")) AudioASM.hover();
    });
  }

  /* hook: registrar pack al comprar (wrap para historial/stats) */
  window.abrirPack = pk => {
    S.stats.packs++;
    S.misiones.progreso.abiertos++;
    S.historial.unshift({ pack:pk.nombre, fecha:fmtFecha(Date.now()), cartas:[] });
    if (S.historial.length > 50) S.historial.pop();
    guardar();
    abrirPackOriginal(pk);
  };

  /* al terminar cada carta, anotarla en el historial del pack actual */
  const revelarOriginal = revelarCarta;
  window.__anotar = (p, nueva) => {
    if (S.historial[0]) S.historial[0].cartas.push({ n:p.n, m:p.m, r:p.r, nueva });
    guardar();
  };

  if (!S.tutorial) setTimeout(verTutorial, 600);
}
document.addEventListener("DOMContentLoaded", init);
