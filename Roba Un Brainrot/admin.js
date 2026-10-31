<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Roba el Meme — Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800&display=swap" rel="stylesheet">
<style>
:root{--tinta:#2b211c;--crema:#fff6e3;--amarillo:#ffd93b;--rojo:#e25555;--verde:#82c95c}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Nunito','Trebuchet MS',sans-serif;color:var(--tinta);background:var(--verde);
  min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:22px}
.tarj,.ancho{background:var(--crema);border:4px solid var(--tinta);border-radius:22px;box-shadow:0 8px 0 var(--tinta);padding:26px}
.tarj{max-width:420px;width:100%;text-align:center;margin-top:8vh}
h1,h2,.btn{font-family:'Lilita One','Arial Rounded MT Bold',sans-serif}
.tarj h1{font-size:2rem}
.tarj h2{font-size:1.05rem;color:var(--rojo);margin-bottom:6px}
.sub{font-weight:700;opacity:.75;margin-bottom:18px;line-height:1.45}
.btn{display:block;width:100%;margin-top:10px;padding:12px;border:3px solid var(--tinta);
  border-radius:13px;box-shadow:0 4px 0 var(--tinta);font-size:1rem;cursor:pointer;background:var(--amarillo);
  color:var(--tinta);text-align:center;text-decoration:none}
.btn.g{background:#fff}.btn.b{background:var(--rojo);color:var(--crema)}
.btn:active{transform:translateY(3px);box-shadow:0 1px 0 var(--tinta)}
.girando{width:38px;height:38px;margin:4px auto 14px;border:6px solid #d9cca9;border-top-color:var(--tinta);border-radius:50%;animation:gira 1s linear infinite}
@keyframes gira{to{transform:rotate(1turn)}}
.nota{font-size:.75rem;opacity:.7;margin-top:10px;line-height:1.4}
.ancho{max-width:640px;width:100%}
.ancho header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ancho h1{font-size:1.4rem;flex:1}
#quien{font-weight:800;font-size:.85rem;opacity:.8;display:flex;align-items:center;gap:6px}
.avatar{width:28px;height:28px;border-radius:50%;border:2px solid var(--tinta)}
#btnSalir{width:auto;margin:0;padding:8px 14px;font-size:.9rem}
.tabs{display:flex;gap:6px;margin-top:16px}
.tab{flex:1;padding:9px 4px;border:3px solid var(--tinta);border-bottom:none;border-radius:12px 12px 0 0;
  background:#e8dcc2;font-weight:800;font-size:.9rem;opacity:.6;cursor:pointer}
.tab.activa{background:var(--amarillo);opacity:1}
.estado{font-size:.85rem;font-weight:700;opacity:.75;padding:10px 2px 0}
.fila{display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:2px dashed #d9cca9}
.fila span{flex:1;font-weight:800;font-size:.92rem}
.fila small{display:block;font-weight:700;opacity:.6;font-size:.7rem}
.fila input{width:110px;padding:8px;border:3px solid var(--tinta);border-radius:10px;font:inherit;font-weight:800;text-align:right}
.acciones{display:flex;gap:10px;margin-top:16px}
.acciones .btn{margin:0;width:auto;flex:1}
.mtar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 8px 8px 14px;margin-top:8px;
  background:#fffdf6;border:3px solid var(--tinta);border-left:9px solid var(--rc);border-radius:13px}
.mtar b{font-family:'Lilita One',sans-serif;font-weight:400;flex:1;min-width:110px}
.mtar small{width:100%;font-size:.72rem;opacity:.65;font-weight:800}
.mtar label{font-size:.72rem;font-weight:800;display:flex;align-items:center;gap:5px}
.mtar input{width:84px;padding:6px;border:3px solid var(--tinta);border-radius:9px;font:inherit;font-weight:800;text-align:right}
.stat{display:flex;justify-content:space-between;padding:10px 4px;border-bottom:2px dashed #d9cca9;font-weight:800}
.stat b{font-family:'Lilita One',sans-serif;font-size:1.1rem;text-align:right}
.espera{padding:14px 4px;font-weight:700;opacity:.7}
#aviso{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--tinta);
  color:var(--crema);padding:12px 22px;border-radius:999px;font-weight:800;z-index:9;max-width:90vw}
#aviso.mal{background:var(--rojo)}
[hidden]{display:none !important}
#cajaReglas{margin-top:14px;background:#fffdf6;border:3px solid var(--rojo);border-radius:13px;padding:12px 14px}
#cajaReglas h3{font-family:'Lilita One',sans-serif;color:var(--rojo);font-size:1rem;margin-bottom:4px}
#cajaReglas p{font-size:.78rem;font-weight:700;line-height:1.5;margin-bottom:8px}
#cajaReglas textarea{width:100%;font:12px/1.4 ui-monospace,Consolas,monospace;border:3px solid var(--tinta);
  border-radius:9px;padding:8px;background:#fff;resize:vertical;white-space:pre-wrap;word-break:break-all;margin-top:10px}
#cajaReglas .acciones{margin-top:6px}
a.enlace{color:var(--rojo);font-weight:800}
</style>
</head>
<body>

<!-- Estado 1: comprobando la sesión de la web -->
<div id="conectando" class="tarj">
  <h1>ROBA EL MEME</h1>
  <h2>Panel de Administración</h2>
  <div class="girando"></div>
  <p class="sub">Conectando con tu cuenta de la web…</p>
</div>

<!-- Estado 2: todavía sin sesión en la web -->
<div id="sinSesion" class="tarj" hidden>
  <h1>ROBA EL MEME</h1>
  <h2>Panel de Administración</h2>
  <p class="sub">Este panel usa la misma cuenta que tu web.<br>Todavía no has iniciado sesión.</p>
  <a id="btnIrWeb" class="btn" href="https://ytguillempro.github.io/Documents.com/">Abrir la web e iniciar sesión</a>
  <button id="btnReintentar" class="btn g">Ya he entrado · volver a comprobar</button>
  <p class="nota">Inicia sesión en la web, vuelve aquí (botón atrás del navegador) y pulsa «volver a comprobar».</p>
</div>

<!-- Estado 3: cuenta de la web sin permiso de admin -->
<div id="noAdmin" class="tarj" hidden>
  <h1>ROBA EL MEME</h1>
  <h2>Cuenta sin permiso</h2>
  <p class="sub" id="noAdminTxt"></p>
  <button id="btnSalirNoAdmin" class="btn b">Cerrar sesión</button>
  <p class="nota">Cuentas autorizadas: guillevarelacors@gmail.com y guillempro07@gmail.com.</p>
</div>

<!-- Estado 4: el panel -->
<div id="panel" class="ancho" hidden>
  <header>
    <h1>Roba el Meme — Admin</h1>
    <span id="quien"></span>
    <button id="btnSalir" class="btn b">Salir</button>
  </header>
  <nav class="tabs">
    <button class="tab activa" data-t="cfg">Configuración</button>
    <button class="tab" data-t="mem">Memes</button>
    <button class="tab" data-t="sta">Estadísticas</button>
  </nav>
  <div id="cajaReglas" hidden>
    <h3>La base de datos no deja entrar</h3>
    <p>Lo más habitual es que falte el bloque de reglas del juego en el <b>Realtime Database</b> del proyecto
    <b>inici-de-sessio</b> (la misma que usa tu web). Copia las reglas y pégalas en:
    <a class="enlace" href="https://console.firebase.google.com/project/inici-de-sessio/database" target="_blank" rel="noopener">console.firebase.google.com → inici-de-sessio → Realtime Database → Reglas</a>,
    añade el bloque <b>juegos</b> dentro de <b>rules</b> (sin borrar las que ya tengas), publica y recarga aquí.
    Si ya tenías las reglas puestas, era la conexión: recarga.</p>
    <div class="acciones">
      <button id="btnCopiarReglas" class="btn g">Copiar reglas</button>
      <button id="btnVerReglas" class="btn">Ver las reglas</button>
    </div>
    <textarea id="reglasTxt" readonly spellcheck="false" hidden></textarea>
  </div>
  <section id="sec-cfg">
    <p id="cfgEstado" class="estado"></p>
    <div id="cfgLista"></div>
    <div class="acciones">
      <button id="btnGuardarCfg" class="btn g">Guardar configuración</button>
      <button id="btnBorrarCfg" class="btn b">Restaurar por defecto</button>
    </div>
  </section>
  <section id="sec-mem" hidden>
    <p class="estado">Cambia precios e ingresos: la próxima partida que se abra usará estos valores.</p>
    <div id="memLista"></div>
    <div class="acciones"><button id="btnGuardarMemes" class="btn g">Guardar memes</button></div>
  </section>
  <section id="sec-sta" hidden>
    <div id="staLista"></div>
    <div class="acciones">
      <button id="btnRefrescar" class="btn">Refrescar</button>
      <button id="btnResetStats" class="btn b">Poner a cero</button>
    </div>
  </section>
</div>

<div id="aviso" hidden></div>

<script src="firebase-config.js?v=3"></script>
<script src="data.js?v=3"></script>
<script>
/* Vigilante del panel: distingue "falta admin.js" de "la red no responde" */
(function () {
  function mal(titulo, detalle) {
    var c = document.getElementById('conectando');
    if (!c || window.__adminListo) return;
    c.innerHTML = '<h1>ROBA EL MEME</h1><h2>' + titulo + '</h2><p class="sub">' + detalle + '</p>';
  }
  /* caza archivos que no cargan (404 de admin.js, firebase-config.js…) */
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && t.tagName === 'SCRIPT' && (t.src || t.href)) {
      mal('Falta un archivo', 'No se pudo cargar <b>' + (t.src || t.href) + '</b>.<br>' +
        'Sube la carpeta del juego COMPLETA a GitHub (admin.js, firebase-config.js, data.js…) y recarga con <b>Ctrl+Shift+R</b>.');
    }
  }, true);
  setTimeout(function () {
    if (window.__adminListo) return;
    if (!window.__adminCargando) {
      mal('Falta admin.js', 'No se encontró <b>admin.js</b> en el servidor. Sube TODOS los archivos de la ' +
        'carpeta del juego a GitHub y recarga con <b>Ctrl+Shift+R</b>.');
    } else {
      mal('Firebase no responde', 'No se pudo cargar Firebase desde internet (gstatic.com / jsdelivr.net). ' +
        'Revisa la conexión o prueba en otra red, y recarga la página.');
    }
  }, 15000);
})();
</script>
<script type="module" src="admin.js?v=3"></script>
</body>
</html>
