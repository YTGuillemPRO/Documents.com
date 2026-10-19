/* ============================================================
   ¡ROBA EL MEME! · data.js
   Datos del juego: rarezas, los 24 Memes originales (dibujados
   con canvas, sin imágenes externas), mejoras y logros.
   Cada Meme se dibuja centrado en (0,0) dentro de ~±28 px.
   ============================================================ */
'use strict';

/* ---------- Helpers de dibujo (usados por los Memes y el motor) ---------- */
const TINTA = '#2b211c';

function trazo(c){ c.strokeStyle = TINTA; c.lineWidth = 3.4; c.lineJoin = 'round'; c.lineCap = 'round'; }

/* Rectángulo redondeado (compatible con navegadores antiguos) */
function rrect(c, x, y, w, h, r){
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* Círculo relleno con contorno de tinta */
function bola(c, x, y, r, relleno){
  trazo(c);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = relleno; c.fill(); c.stroke();
}

/* Caja redondeada rellena con contorno */
function caja(c, x, y, an, al, relleno, r = 8){
  trazo(c);
  rrect(c, x, y, an, al, r);
  c.fillStyle = relleno; c.fill(); c.stroke();
}

/* Elipse rellena con contorno */
function elipse(c, x, y, rx, ry, relleno, rot = 0){
  trazo(c);
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fillStyle = relleno; c.fill(); c.stroke();
}

/* Ojo abierto con pupila (mx, my = hacia dónde mira) */
function ojo(c, x, y, r = 4, mx = 0, my = 0){
  bola(c, x, y, r, '#ffffff');
  c.fillStyle = TINTA;
  c.beginPath(); c.arc(x + mx, y + my, r * 0.55, 0, Math.PI * 2); c.fill();
}

/* Par de ojos cerrados (arcos felices o dormidos) */
function ojosCerrados(c, x, y, sep = 9){
  trazo(c);
  c.beginPath(); c.arc(x - sep / 2, y, 5, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
  c.beginPath(); c.arc(x + sep / 2, y, 5, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
}

/* Sonrisa */
function sonrisa(c, x, y, an = 12){
  trazo(c);
  c.beginPath(); c.arc(x, y, an, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
}

/* Cejas enfadadas */
function bravo(c, x, y, sep = 11){
  trazo(c); c.lineWidth = 4;
  c.beginPath(); c.moveTo(x - sep, y - 8); c.lineTo(x - sep * 0.35, y - 3); c.stroke();
  c.beginPath(); c.moveTo(x + sep, y - 8); c.lineTo(x + sep * 0.35, y - 3); c.stroke();
}

/* Estrella de 5 puntas */
function estrella(c, x, y, r, relleno){
  trazo(c);
  c.beginPath();
  for (let i = 0; i < 10; i++){
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.45 : r;
    if (i === 0) c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath(); c.fillStyle = relleno; c.fill(); c.stroke();
}

/* ---------- Rarezas ---------- */
const RAREZAS = {
  comun:      { nombre: 'Común',      color: '#98a2ab' },
  raro:       { nombre: 'Raro',       color: '#4f9df7' },
  epico:      { nombre: 'Épico',      color: '#a55eea' },
  legendario: { nombre: 'Legendario', color: '#ffb020' },
  mitico:     { nombre: 'Mítico',     color: '#ff4d6d' },
  secreto:    { nombre: 'Secreto',    color: '#00e5c3', arcoiris: true },
};
const ORDEN_RAREZA = ['comun', 'raro', 'epico', 'legendario', 'mitico', 'secreto'];

/* ---------- Los 24 Memes ---------- */
const MEMES = [

  /* ===== COMUNES ===== */
  {
    id: 'pato', nombre: 'Pato con Gorra', rareza: 'comun', precio: 15, ips: 0.6,
    dibujo(c, t){
      bola(c, -20, 4, 7, '#ffd23f'); bola(c, 20, 4, 7, '#ffd23f');      // alas
      bola(c, 0, 0, 21, '#ffd23f');                                      // cuerpo
      trazo(c); c.beginPath(); c.moveTo(-9, 6); c.lineTo(9, 6); c.lineTo(0, 15);
      c.closePath(); c.fillStyle = '#ff9330'; c.fill(); c.stroke();       // pico
      ojo(c, -8, -6); ojo(c, 8, -6);
      trazo(c); c.beginPath(); c.arc(0, -13, 13, Math.PI, 0);            // gorra
      c.fillStyle = '#4f9df7'; c.fill(); c.stroke();
      caja(c, -14, -14, 28, 6, '#4f9df7', 3);
      sonrisa(c, 0, 4, 5);
    }
  },
  {
    id: 'papa', nombre: 'Papa Triste', rareza: 'comun', precio: 25, ips: 1,
    dibujo(c){
      elipse(c, 0, 2, 22, 19, '#c98d4e');                                // cuerpo papa
      trazo(c); c.fillStyle = '#b07a3f';                                 // manchitas
      [[-12, -4], [10, 8], [4, -10]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 3, 0, Math.PI * 2); c.fill(); });
      trazo(c); c.lineWidth = 3;                                         // ojos caídos
      c.beginPath(); c.arc(-8, -2, 5, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.beginPath(); c.arc(8, -2, 5, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      trazo(c); c.beginPath(); c.arc(0, 10, 6, Math.PI * 1.2, Math.PI * 1.8); c.stroke(); // boca triste
      trazo(c); c.beginPath(); c.moveTo(0, -17); c.lineTo(-3, -25); c.lineTo(3, -27); c.strokeStyle = '#57b14b'; c.stroke(); // brote
      bola(c, 5, -28, 4, '#57b14b');
      elipse(c, -13, 3, 3, 4.5, '#7fd8ff');                              // lagrimón
    }
  },
  {
    id: 'banana', nombre: 'Banana Curiosa', rareza: 'comun', precio: 40, ips: 1.5,
    dibujo(c){
      trazo(c); c.beginPath(); c.arc(0, -6, 20, Math.PI * 0.25, Math.PI * 0.75); // media luna
      c.arc(0, -1, 16, Math.PI * 0.72, Math.PI * 0.28, true);
      c.closePath(); c.fillStyle = '#ffe135'; c.fill(); c.stroke();
      bola(c, -16, 4, 3.5, '#8a6a2f'); bola(c, 16, 4, 3.5, '#8a6a2f');   // puntas
      trazo(c); c.lineWidth = 2.6;                                       // gafas
      c.beginPath(); c.arc(-7, 2, 6, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(7, 2, 6, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(-1, 2); c.lineTo(1, 2); c.stroke();
      ojo(c, -7, 2, 3.2); ojo(c, 7, 2, 3.2);
      sonrisa(c, 0, 12, 6);
    }
  },
  {
    id: 'tostada', nombre: 'Tostada Voladora', rareza: 'comun', precio: 55, ips: 2,
    dibujo(c, t){
      const a = Math.sin(t * 9) * 0.5;
      c.save(); c.translate(-26, -4); c.rotate(-0.5 + a); elipse(c, 0, 0, 12, 6, '#ffffff'); c.restore();
      c.save(); c.translate(26, -4); c.rotate(0.5 - a); elipse(c, 0, 0, 12, 6, '#ffffff'); c.restore();
      caja(c, -19, -14, 38, 32, '#e8a45c', 9);                           // tostada
      caja(c, -8, -8, 16, 10, '#ffe135', 3);                             // mantequilla
      ojo(c, -8, 6); ojo(c, 8, 6);
      sonrisa(c, 0, 9, 6);
    }
  },
  {
    id: 'gato', nombre: 'Gato Bostezo', rareza: 'comun', precio: 70, ips: 2.4,
    dibujo(c){
      trazo(c);                                                          // orejas
      c.beginPath(); c.moveTo(-18, -12); c.lineTo(-22, -28); c.lineTo(-6, -20); c.closePath();
      c.fillStyle = '#a9adb5'; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(18, -12); c.lineTo(22, -28); c.lineTo(6, -20); c.closePath();
      c.fill(); c.stroke();
      bola(c, 0, 0, 21, '#a9adb5');
      ojosCerrados(c, 0, -5, 11);                                        // dormido/bostezando
      elipse(c, 0, 8, 6.5, 8, '#7c2f3a');                                // boca abierta
      elipse(c, 0, 12, 4, 4, '#ff8fa3');                                 // lengua
      trazo(c); c.lineWidth = 2;                                         // bigotes
      [[-1, 1], [1, 1]].forEach(s => {
        c.beginPath(); c.moveTo(s[0] * 20, 2); c.lineTo(s[0] * 32, -2); c.stroke();
        c.beginPath(); c.moveTo(s[0] * 20, 6); c.lineTo(s[0] * 32, 7); c.stroke();
      });
    }
  },
  {
    id: 'cactus', nombre: 'Cactus Bailarín', rareza: 'comun', precio: 90, ips: 3,
    dibujo(c, t){
      const m = Math.sin(t * 5) * 0.25;
      caja(c, -14, -22, 28, 46, '#4caf50', 14);                          // cuerpo
      c.save(); c.translate(-14, -6); c.rotate(-0.4 + m); caja(c, -14, -6, 12, 22, '#4caf50', 6); c.restore(); // brazo izq
      c.save(); c.translate(14, -6); c.rotate(0.4 - m); caja(c, 2, -6, 12, 22, '#4caf50', 6); c.restore();     // brazo der
      trazo(c); c.lineWidth = 2.4;                                       // líneas
      c.beginPath(); c.moveTo(0, -16); c.lineTo(0, 18); c.stroke();
      caja(c, -11, -14, 22, 7, '#2b211c', 3);                            // gafas de sol
      ojo(c, -5.5, -10.5, 2.4, 0, 0); ojo(c, 5.5, -10.5, 2.4, 0, 0);
      sonrisa(c, 0, 4, 7);
      bola(c, 6, -26, 5, '#ff8fa3');                                     // flor
    }
  },

  /* ===== RAROS ===== */
  {
    id: 'perro', nombre: 'Perro Detective', rareza: 'raro', precio: 150, ips: 5,
    dibujo(c){
      elipse(c, -20, -6, 7, 12, '#8a5a33'); elipse(c, 20, -6, 7, 12, '#8a5a33'); // orejas caídas
      bola(c, 0, 0, 21, '#b0734a');                                      // cabeza
      elipse(c, 0, 12, 10, 7, '#d9a977');                                // hocico
      bola(c, 0, 9, 4, '#2b211c');                                       // nariz
      ojo(c, -8, -4); ojo(c, 8, -4);
      caja(c, -17, -30, 34, 10, '#6d5335', 4);                           // sombrero
      elipse(c, 0, -20, 22, 6, '#6d5335');
      caja(c, -3, 18, 6, 4, '#2b211c', 2);                               // lupa
      trazo(c); c.beginPath(); c.arc(0, 28, 8, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(6, 30); c.lineTo(14, 38); c.stroke();
    }
  },
  {
    id: 'pinguino', nombre: 'Pingüino Frenético', rareza: 'raro', precio: 220, ips: 6.5,
    dibujo(c, t){
      const d = Math.sin(t * 14) * 2.5;
      bola(c, 0, 0, 22, '#3b4a5a');
      elipse(c, 0, 5, 13, 14, '#ffffff');                                // barriga
      ojo(c, -8, -6, 4, d, 0); ojo(c, 8, -6, 4, -d, 0);                  // ojos alocados
      trazo(c); c.beginPath(); c.moveTo(-5, 2); c.lineTo(5, 2); c.lineTo(0, 9);
      c.closePath(); c.fillStyle = '#ff9330'; c.fill(); c.stroke();       // pico
      trazo(c); c.lineWidth = 4;                                         // aletas arriba
      c.beginPath(); c.moveTo(-20, -4); c.lineTo(-30, -16); c.stroke();
      c.beginPath(); c.moveTo(20, -4); c.lineTo(30, -16); c.stroke();
      trazo(c); c.lineWidth = 2.2; c.strokeStyle = '#7fd8ff';            // gotas de estrés
      c.beginPath(); c.moveTo(16, -22); c.lineTo(20, -28); c.stroke();
      c.beginPath(); c.moveTo(22, -18); c.lineTo(27, -22); c.stroke();
    }
  },
  {
    id: 'abuela', nombre: 'Abuela Turbo', rareza: 'raro', precio: 320, ips: 8.5,
    dibujo(c, t){
      trazo(c); c.lineWidth = 3; c.strokeStyle = '#cfd4da';              // líneas de velocidad
      c.beginPath(); c.moveTo(-26, 10); c.lineTo(-38, 10); c.stroke();
      c.beginPath(); c.moveTo(-26, 18); c.lineTo(-36, 18); c.stroke();
      caja(c, -14, -6, 28, 26, '#8f5aa8', 9);                            // cuerpo (chal)
      bola(c, 0, -16, 14, '#ffd9b3');                                    // cabeza
      bola(c, 0, -30, 7, '#cfd4da');                                     // moño canoso
      trazo(c); c.lineWidth = 2.4;                                       // gafas
      c.beginPath(); c.arc(-6, -18, 5, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(6, -18, 5, 0, Math.PI * 2); c.stroke();
      ojo(c, -6, -18, 2.8); ojo(c, 6, -18, 2.8);
      sonrisa(c, 0, -10, 5);
      caja(c, -20, 20, 40, 8, '#57b14b', 4);                             // monopatín
      const g = t * 10;                                                  // ruedas girando
      [[-12, 30], [12, 30]].forEach(p => {
        bola(c, p[0], p[1], 5, '#2b211c');
        c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath();
        c.moveTo(p[0] - 3 * Math.cos(g), p[1] - 3 * Math.sin(g));
        c.lineTo(p[0] + 3 * Math.cos(g), p[1] + 3 * Math.sin(g)); c.stroke();
      });
    }
  },
  {
    id: 'robot', nombre: 'Robot Chiquitín', rareza: 'raro', precio: 450, ips: 11,
    dibujo(c, t){
      trazo(c); c.beginPath(); c.moveTo(0, -22); c.lineTo(0, -32); c.stroke(); // antena
      bola(c, 0, -34, 4, (Math.floor(t * 2) % 2) ? '#ff4d6d' : '#3ec6b8');
      caja(c, -16, -20, 32, 30, '#9fb3c8', 9);                           // cabeza-cuerpo
      caja(c, -11, -12, 22, 9, '#2b211c', 3);                            // visor
      c.fillStyle = '#3ec6b8';
      c.fillRect(-7, -10.5, 5, 6); c.fillRect(2, -10.5, 5, 6);           // ojos LED
      trazo(c); c.lineWidth = 2.2;                                       // boca rejilla
      for (let i = -1; i <= 1; i++){ c.beginPath(); c.moveTo(i * 6 - 2, 2); c.lineTo(i * 6 + 2, 2); c.stroke(); }
      caja(c, -24, -14, 7, 12, '#7f95a8', 3); caja(c, 17, -14, 7, 12, '#7f95a8', 3); // orejas
      caja(c, -10, 12, 20, 10, '#7f95a8', 4);                            // oruga base
    }
  },
  {
    id: 'taco', nombre: 'Taco Volador', rareza: 'raro', precio: 600, ips: 14,
    dibujo(c, t){
      const a = Math.sin(t * 9) * 0.5;
      c.save(); c.translate(-24, -8); c.rotate(-0.5 + a); elipse(c, 0, 0, 11, 5.5, '#ffffff'); c.restore();
      c.save(); c.translate(24, -8); c.rotate(0.5 - a); elipse(c, 0, 0, 11, 5.5, '#ffffff'); c.restore();
      trazo(c); c.beginPath(); c.arc(0, -4, 24, Math.PI * 0.05, Math.PI * 0.95); // tortilla
      c.closePath(); c.fillStyle = '#f2b05e'; c.fill(); c.stroke();
      trazo(c); c.strokeStyle = '#57b14b'; c.lineWidth = 5;              // lechuga
      c.beginPath(); c.arc(0, 2, 17, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
      bola(c, -9, 9, 3.5, '#e2574c'); bola(c, 0, 11, 3.5, '#e2574c'); bola(c, 9, 9, 3.5, '#e2574c'); // tomate
      ojo(c, -8, 14, 3); ojo(c, 8, 14, 3);
    }
  },

  /* ===== ÉPICOS ===== */
  {
    id: 'loro', nombre: 'Loro Rapero', rareza: 'epico', precio: 1200, ips: 22,
    dibujo(c, t){
      bola(c, 0, 2, 22, '#e2483d');
      elipse(c, -9, -6, 7, 8, '#ffffff'); elipse(c, 9, -6, 7, 8, '#ffffff'); // parches
      ojo(c, -9, -6); ojo(c, 9, -6);
      trazo(c); c.beginPath(); c.moveTo(-7, 6); c.quadraticCurveTo(0, 20, 7, 6); // pico curvo
      c.quadraticCurveTo(0, 10, -7, 6); c.closePath(); c.fillStyle = '#ffb020'; c.fill(); c.stroke();
      trazo(c); c.beginPath(); c.arc(0, -22, 12, Math.PI, 0); c.fillStyle = '#7a4fd0'; c.fill(); c.stroke(); // gorra
      caja(c, -16, -23, 32, 6, '#7a4fd0', 3);
      for (let i = 0; i < 5; i++) bola(c, -12 + i * 6, 22 + Math.sin(i) * 2, 3.2, '#ffd23f'); // cadena
      trazo(c); c.lineWidth = 5; c.strokeStyle = '#c93c32';              // ala con micro
      c.beginPath(); c.moveTo(-20, 4); c.lineTo(-28, 14); c.stroke();
      bola(c, -28, 16, 4, '#2b211c');
      const p = Math.sin(t * 6) * 2;
      c.save(); c.translate(24, 10 + p); c.rotate(0.3); caja(c, -3, 0, 6, 12, '#2b211c', 3); c.restore(); // micro
    }
  },
  {
    id: 'cacahuete', nombre: 'Cacahuete Furioso', rareza: 'epico', precio: 1700, ips: 29,
    dibujo(c){
      bola(c, 0, -8, 15, '#d9a15c'); bola(c, 0, 10, 16, '#d9a15c');      // cacahuete
      trazo(c); c.lineWidth = 2; c.strokeStyle = '#b07a3f';              // textura
      c.beginPath(); c.arc(-11, -8, 7, Math.PI * 0.6, Math.PI * 1.1); c.stroke();
      c.beginPath(); c.arc(11, 10, 7, Math.PI * 1.6, Math.PI * 2.1); c.stroke();
      bravo(c, 0, -10, 9);
      ojo(c, -5, -8); ojo(c, 5, -8);
      caja(c, -6, 2, 12, 5, '#ffffff', 2);                               // dientes apretados
      trazo(c); c.strokeStyle = '#e2574c'; c.lineWidth = 3;              // marcas de furia
      [[-1, 0], [1, 0]].forEach(s => {
        c.beginPath(); c.moveTo(s[0] * 24, -18); c.lineTo(s[0] * 30, -22); c.stroke();
        c.beginPath(); c.moveTo(s[0] * 24, -12); c.lineTo(s[0] * 31, -13); c.stroke();
      });
      bola(c, -24, 8, 6, '#d9a15c'); bola(c, 24, 8, 6, '#d9a15c');       // puños
    }
  },
  {
    id: 'ninja', nombre: 'Ninja Fideo', rareza: 'epico', precio: 2400, ips: 38,
    dibujo(c, t){
      trazo(c); c.strokeStyle = TINTA; c.lineWidth = 17;                  // fideo (contorno)
      c.beginPath(); c.moveTo(0, 26);
      c.quadraticCurveTo(-14, 8, 0, -4);
      c.quadraticCurveTo(14, -14, 0, -22); c.stroke();
      trazo(c); c.strokeStyle = '#e8c26a'; c.lineWidth = 11;
      c.beginPath(); c.moveTo(0, 26);
      c.quadraticCurveTo(-14, 8, 0, -4);
      c.quadraticCurveTo(14, -14, 0, -22); c.stroke();
      caja(c, -12, -28, 24, 8, '#e2574c', 3);                            // cinta
      const f = Math.sin(t * 7) * 4;
      trazo(c); c.strokeStyle = '#e2574c'; c.lineWidth = 5;               // cintas volando
      c.beginPath(); c.moveTo(-12, -25); c.lineTo(-24, -20 + f); c.stroke();
      c.beginPath(); c.moveTo(12, -25); c.lineTo(24, -20 - f); c.stroke();
      c.fillStyle = '#ffffff';                                           // ojos ninja
      c.fillRect(-8, -22, 6, 3.4); c.fillRect(2, -22, 6, 3.4);
      estrella(c, 22, 6, 7, '#cfd4da');                                  // shuriken
    }
  },
  {
    id: 'unicornio', nombre: 'Unicornio Rareta', rareza: 'epico', precio: 3400, ips: 50,
    dibujo(c, t){
      bola(c, 0, 2, 21, '#fdf6f0');
      trazo(c); c.beginPath(); c.moveTo(0, -18); c.lineTo(-4, -34); c.lineTo(4, -30); // cuerno
      c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); c.stroke();
      trazo(c); c.lineWidth = 7; c.lineCap = 'round';                    // crín pastel
      c.strokeStyle = '#ff8fa3'; c.beginPath(); c.moveTo(-6, -16); c.quadraticCurveTo(-16, -10, -12, 2); c.stroke();
      c.strokeStyle = '#9ad7ff'; c.beginPath(); c.moveTo(4, -17); c.quadraticCurveTo(14, -10, 11, 3); c.stroke();
      c.strokeStyle = '#c9b2f0'; c.beginPath(); c.moveTo(0, -19); c.quadraticCurveTo(0, -8, 2, 6); c.stroke();
      ojo(c, -8, -2); ojo(c, 8, -2);
      sonrisa(c, 0, 8, 7);
      const a = t * 2;
      estrella(c, -22, -18 + Math.sin(a) * 3, 4.5, '#ffd23f');
      estrella(c, 22, -24 + Math.cos(a) * 3, 3.5, '#9ad7ff');
    }
  },
  {
    id: 'cangrejo', nombre: 'Cangrejo Boxeador', rareza: 'epico', precio: 4800, ips: 65,
    dibujo(c, t){
      const g = Math.sin(t * 8) * 3;
      bola(c, -26, -6 + g, 9, '#e2574c'); bola(c, 26, -6 - g, 9, '#e2574c'); // guantes
      elipse(c, 0, 2, 20, 15, '#e2574c');                                // cuerpo
      bravo(c, 0, -6, 9);
      ojo(c, -7, -4); ojo(c, 7, -4);
      sonrisa(c, 0, 5, 6);
      trazo(c); c.lineWidth = 3;                                         // patitas
      for (let i = -1; i <= 1; i++){
        c.beginPath(); c.moveTo(i * 10, 14); c.lineTo(i * 12, 22); c.stroke();
      }
      caja(c, -12, 9, 24, 6, '#ffd23f', 3);                              // cinturón campeón
    }
  },

  /* ===== LEGENDARIOS ===== */
  {
    id: 'tiburon', nombre: 'Tiburón Chandal', rareza: 'legendario', precio: 9000, ips: 95,
    dibujo(c){
      trazo(c); c.beginPath(); c.moveTo(-4, -16); c.lineTo(-2, -30); c.lineTo(6, -18); c.closePath(); // aleta
      c.fillStyle = '#7f95a8'; c.fill(); c.stroke();
      elipse(c, 0, 0, 25, 17, '#7f95a8');                                // cuerpo
      elipse(c, 2, 6, 15, 8, '#eef3f7');                                 // barriga
      ojo(c, -13, -5); ojo(c, 13, -5);
      trazo(c); c.beginPath(); c.moveTo(-18, 6); c.lineTo(18, 6); c.stroke(); // boca
      trazo(c); c.lineWidth = 2.2;                                       // dientes
      for (let i = 0; i < 5; i++){
        const x = -14 + i * 7;
        c.beginPath(); c.moveTo(x, 6); c.lineTo(x + 3.5, 11); c.lineTo(x + 7, 6); c.stroke();
      }
      caja(c, -14, -26, 28, 7, '#e2574c', 3);                            // cinta frontal
      caja(c, -16, 20, 14, 9, '#e2574c', 4); caja(c, 2, 20, 14, 9, '#e2574c', 4); // zapatillas
      trazo(c); c.lineWidth = 2; c.strokeStyle = '#ffffff';
      c.beginPath(); c.moveTo(-11, 23); c.lineTo(-7, 26); c.moveTo(-7, 23); c.lineTo(-11, 26); c.stroke();
      c.beginPath(); c.moveTo(5, 23); c.lineTo(9, 26); c.moveTo(9, 23); c.lineTo(5, 26); c.stroke();
    }
  },
  {
    id: 'dragon', nombre: 'Dragón Sofá', rareza: 'legendario', precio: 14000, ips: 130,
    dibujo(c){
      caja(c, -28, -6, 56, 28, '#57b14b', 10);                           // sillón
      trazo(c); c.lineWidth = 2.4; c.strokeStyle = '#3c7f34';            // cojines
      c.beginPath(); c.moveTo(-28, 8); c.lineTo(28, 8); c.stroke();
      c.beginPath(); c.moveTo(0, -6); c.lineTo(0, 22); c.stroke();
      caja(c, -30, -12, 9, 34, '#57b14b', 5); caja(c, 21, -12, 9, 34, '#57b14b', 5); // reposabrazos
      bola(c, 0, -22, 14, '#57b14b');                                    // cabeza dragón
      caja(c, -7, -18, 14, 9, '#57b14b', 4);                             // hocico
      bola(c, 0, -14, 3, '#2b211c');                                     // fosas
      ojo(c, -6, -26); ojo(c, 6, -26);
      trazo(c); c.beginPath(); c.moveTo(-10, -32); c.lineTo(-12, -40); c.moveTo(10, -32); c.lineTo(12, -40); c.stroke(); // cuernos
      trazo(c); c.beginPath(); c.moveTo(28, 4); c.quadraticCurveTo(42, 0, 38, 14); c.strokeStyle = '#57b14b'; c.lineWidth = 8; c.stroke(); // cola
    }
  },
  {
    id: 'pollo', nombre: 'Pollo Radiactivo', rareza: 'legendario', precio: 21000, ips: 175,
    dibujo(c, t){
      const brillo = 0.35 + Math.sin(t * 5) * 0.18;
      c.fillStyle = `rgba(158,232,60,${brillo})`;                        // aura
      c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); c.fill();
      bola(c, 0, 2, 22, '#9ee83c');                                      // cuerpo
      bola(c, 0, -22, 10, '#9ee83c');                                    // cabeza
      trazo(c); c.beginPath(); c.moveTo(-5, -16); c.lineTo(5, -16); c.lineTo(0, -10);
      c.closePath(); c.fillStyle = '#ff9330'; c.fill(); c.stroke();       // pico
      bola(c, -3, -8, 3, '#e2574c'); bola(c, 3, -8, 3, '#e2574c');       // barbillas
      ojo(c, -4, -25); ojo(c, 4, -25);
      bola(c, -18, 0, 8, '#9ee83c'); bola(c, 18, 0, 8, '#9ee83c');       // alas
      caja(c, -8, -4, 16, 16, '#2b211c', 8);                             // símbolo radiactivo
      c.fillStyle = '#ffd23f';
      for (let i = 0; i < 3; i++){
        const a = t * 0.4 + i * Math.PI * 2 / 3 - Math.PI / 2;
        c.beginPath(); c.moveTo(0, 4); c.arc(0, 4, 7, a - 0.5, a + 0.5); c.closePath(); c.fill();
      }
    }
  },
  {
    id: 'albondiga', nombre: 'Albóndiga Final', rareza: 'legendario', precio: 32000, ips: 240,
    dibujo(c, t){
      trazo(c); c.strokeStyle = '#e8c26a'; c.lineWidth = 7;              // fideos alrededor
      [[-26, -10], [26, -6], [-22, 16], [24, 18]].forEach((p, i) => {
        c.beginPath(); c.moveTo(p[0], p[1]);
        c.quadraticCurveTo(p[0] * 0.4, p[1] + 14 * Math.sin(t * 3 + i), -p[0] * 0.3, p[1] + 6);
        c.stroke();
      });
      bola(c, 0, 2, 23, '#a1663f');                                      // albóndiga
      caja(c, -15, -8, 30, 9, '#2b211c', 4);                             // gafas de sol
      c.fillStyle = '#3ec6b8'; c.fillRect(-11, -6.5, 6, 6); c.fillRect(5, -6.5, 6, 6);
      sonrisa(c, 0, 8, 8);
      c.fillStyle = '#ffffff';                                           // parmesano
      [[-8, 16], [4, 18], [10, 12]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 1.8, 0, Math.PI * 2); c.fill(); });
    }
  },

  /* ===== MÍTICOS ===== */
  {
    id: 'gatocosmico', nombre: 'Gato Cósmico', rareza: 'mitico', precio: 55000, ips: 350,
    dibujo(c, t){
      c.fillStyle = 'rgba(120,80,255,.30)';                               // aura galaxia
      c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); c.fill();
      trazo(c);                                                          // orejas
      c.beginPath(); c.moveTo(-16, -12); c.lineTo(-20, -27); c.lineTo(-6, -19); c.closePath();
      c.fillStyle = '#3a2f55'; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(16, -12); c.lineTo(20, -27); c.lineTo(6, -19); c.closePath();
      c.fill(); c.stroke();
      bola(c, 0, 0, 21, '#3a2f55');
      c.fillStyle = '#ffffff';                                           // estrellas del pelaje
      [[-10, -8, 1.6], [8, -4, 2], [-4, 10, 1.4], [12, 12, 1.6], [0, -14, 1.8]].forEach(e => {
        c.beginPath(); c.arc(e[0], e[1], e[2], 0, Math.PI * 2); c.fill();
      });
      const tw = 0.5 + Math.sin(t * 4) * 0.5;
      c.fillStyle = `rgba(158,216,255,${tw})`;
      c.beginPath(); c.arc(-14, 6, 2.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(14, -10, 2, 0, Math.PI * 2); c.fill();
      c.save(); c.shadowColor = '#00e5c3'; c.shadowBlur = 10;            // ojos brillantes
      ojo(c, -8, -3, 4.2, 0, 0); ojo(c, 8, -3, 4.2, 0, 0);
      c.restore();
      trazo(c); c.strokeStyle = '#00e5c3'; c.lineWidth = 3;              // bigotes de neón
      c.beginPath(); c.moveTo(-18, 5); c.lineTo(-30, 2); c.stroke();
      c.beginPath(); c.moveTo(18, 5); c.lineTo(30, 2); c.stroke();
      sonrisa(c, 0, 6, 7);
      trazo(c); c.strokeStyle = '#c9b2f0'; c.lineWidth = 6;              // cola espiral estelar
      c.beginPath(); c.moveTo(19, 12); c.quadraticCurveTo(34, 8, 30, -6); c.stroke();
      bola(c, 30, -8, 3.4, '#ffd23f');
    }
  },
  {
    id: 'pina', nombre: 'Piña Galáctica', rareza: 'mitico', precio: 85000, ips: 480,
    dibujo(c, t){
      trazo(c);                                                          // corona
      [-18, -9, 0, 9, 18].forEach((x, i) => {
        c.beginPath(); c.moveTo(x - 5, -20); c.lineTo(x, -34 - (i === 2 ? 6 : 0)); c.lineTo(x + 5, -20);
        c.closePath(); c.fillStyle = '#3ec6b8'; c.fill(); c.stroke();
      });
      elipse(c, 0, 6, 19, 24, '#f2c94c');                                // cuerpo
      c.save();                                                        // textura romboidal
      c.beginPath(); c.ellipse(0, 6, 19, 24, 0, 0, Math.PI * 2); c.clip();
      trazo(c); c.strokeStyle = '#c79323'; c.lineWidth = 2.4;
      for (let i = -3; i <= 3; i++){
        c.beginPath(); c.moveTo(i * 12 - 20, -20); c.lineTo(i * 12 + 20, 32); c.stroke();
        c.beginPath(); c.moveTo(i * 12 + 20, -20); c.lineTo(i * 12 - 20, 32); c.stroke();
      }
      c.restore();
      caja(c, -14, -2, 28, 8, '#2b211c', 4);                             // gafas
      c.fillStyle = '#ff4d6d'; c.fillRect(-10, -0.5, 6, 5); c.fillRect(4, -0.5, 6, 5);
      sonrisa(c, 0, 10, 6);
      const a = t * 1.6;                                                 // planeta orbitando
      const px = Math.cos(a) * 30, py = -6 + Math.sin(a) * 12;
      bola(c, px, py, 5.5, '#ff9330');
      trazo(c); c.strokeStyle = '#ffd23f'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(px, py, 9, 3.2, a, 0, Math.PI * 2); c.stroke();
    }
  },
  {
    id: 'nu', nombre: 'Ñu Samurai', rareza: 'mitico', precio: 130000, ips: 680,
    dibujo(c){
      trazo(c); c.strokeStyle = '#e8e3d8'; c.lineWidth = 5;              // cuernos curvos
      c.beginPath(); c.moveTo(-14, -14); c.quadraticCurveTo(-26, -24, -20, -34); c.stroke();
      c.beginPath(); c.moveTo(14, -14); c.quadraticCurveTo(26, -24, 20, -34); c.stroke();
      bola(c, 0, 0, 21, '#6b7f9e');                                      // cabeza
      elipse(c, 0, 12, 12, 8, '#4d5d75');                                // hocico
      bola(c, 0, 9, 3.6, '#2b211c');
      ojo(c, -8, -4); ojo(c, 8, -4);
      trazo(c); c.lineWidth = 2.4;                                       // cicatriz
      c.beginPath(); c.moveTo(6, -14); c.lineTo(11, -4); c.stroke();
      bola(c, 0, -22, 6, '#2b211c');                                     // moño samurai
      caja(c, -8, -28, 16, 5, '#e2574c', 2);                             // cinta del moño
      caja(c, 16, -30, 26, 7, '#e2574c', 3);                             // empuñadura katana
      caja(c, -42, -30, 26, 5, '#e8e3d8', 2);                            // hoja al hombro
      sonrisa(c, 0, 15, 5);
    }
  },

  /* ===== SECRETO ===== */
  {
    id: 'queso', nombre: 'El Queso Eterno', rareza: 'secreto', precio: 250000, ips: 1200,
    dibujo(c, t){
      const matiz = (t * 90) % 360;                                      // contorno arcoíris
      c.save();
      trazo(c); c.strokeStyle = `hsl(${matiz},90%,60%)`; c.lineWidth = 5;
      c.beginPath(); c.moveTo(-20, -14); c.lineTo(20, -14); c.lineTo(12, 22); c.lineTo(-12, 22);
      c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); c.stroke();
      c.restore();
      bola(c, -6, -2, 3.4, '#e8b325'); bola(c, 7, 8, 4, '#e8b325'); bola(c, 8, -6, 2.6, '#e8b325'); // agujeros
      ojo(c, -8, -7, 3.6); ojo(c, 8, -7, 3.6);
      sonrisa(c, 0, 4, 7);
      const f = Math.sin(t * 6) * 3;                                     // aura y alas
      c.save(); c.translate(-24, -12); c.rotate(-0.5 + f * 0.04); elipse(c, 0, 0, 10, 5, '#ffffff'); c.restore();
      c.save(); c.translate(24, -12); c.rotate(0.5 - f * 0.04); elipse(c, 0, 0, 10, 5, '#ffffff'); c.restore();
      trazo(c); c.strokeStyle = `hsl(${(matiz + 120) % 360},90%,65%)`; c.lineWidth = 4; // halo
      c.beginPath(); c.ellipse(0, -34 + f * 0.5, 12, 4, 0, 0, Math.PI * 2); c.stroke();
      estrella(c, -20, -30, 3.5, `hsl(${(matiz + 60) % 360},90%,70%)`);
      estrella(c, 22, -26, 3, `hsl(${(matiz + 240) % 360},90%,70%)`);
    }
  },
];

/* Índice rápido por id */
const MEME = {};
MEMES.forEach(m => { MEME[m.id] = m; });

/* ---------- Mejoras de la tienda ---------- */
const MEJORAS = [
  { id: 'zapatos', nombre: 'Zapatillas Turbo', icono: 'i-zapato', color: '#4f9df7',
    desc: '+12% de velocidad por nivel.', base: 120, mult: 2.2, max: 5 },
  { id: 'guante', nombre: 'Guante Firme', icono: 'i-guante', color: '#a55eea',
    desc: 'Cargar un Meme te frena menos.', base: 200, mult: 2.4, max: 4 },
  { id: 'escudo', nombre: 'Escudo Reforzado', icono: 'i-escudo', color: '#3ec6b8',
    desc: '+3 s de escudo por nivel.', base: 260, mult: 2.3, max: 4 },
  { id: 'base', nombre: 'Ampliar Base', icono: 'i-expandir', color: '#57b14b',
    desc: '+2 huecos para Memes y base más grande.', base: 500, mult: 3, max: 3 },
  { id: 'grana', nombre: 'Multiplicador', icono: 'i-moneda', color: '#ffc93c',
    desc: '+15% de ingresos por nivel.', base: 400, mult: 2.6, max: 5 },
  { id: 'suerte', nombre: 'Suerte Absurda', icono: 'i-estrella', color: '#ff6fa5',
    desc: 'Aparecen Memes más raros en la plaza.', base: 350, mult: 2.5, max: 4 },
];

/* ---------- Logros (cond y prog reciben una instantánea "s" de estadísticas) ---------- */
const LOGROS = [
  { id: 'meme1', nombre: 'Primer Meme', desc: 'Compra tu primer Meme en la plaza.', monedas: 100,
    cond: s => s.compras >= 1, prog: s => [s.compras, 1] },
  { id: 'coleccion', nombre: 'Colección Crece', desc: 'Ten 10 Memes colocados a la vez.', monedas: 750,
    cond: s => s.colocados >= 10, prog: s => [s.colocados, 10] },
  { id: 'zoo', nombre: 'Zoológico Absurdo', desc: 'Ten 20 Memes colocados a la vez.', monedas: 5000,
    cond: s => s.colocados >= 20, prog: s => [s.colocados, 20] },
  { id: 'robo1', nombre: 'Manos Rápidas', desc: 'Roba tu primer Meme.', monedas: 150,
    cond: s => s.robos >= 1, prog: s => [s.robos, 1] },
  { id: 'ladron', nombre: 'Rey del Cambalache', desc: 'Completa 10 robos.', monedas: 3000,
    cond: s => s.robos >= 10, prog: s => [s.robos, 10] },
  { id: 'justiciero', nombre: 'Justiciero', desc: 'Recupera un Meme que te robaron.', monedas: 250,
    cond: s => s.recuperaciones >= 1, prog: s => [s.recuperaciones, 1] },
  { id: 'rico', nombre: 'Rico Ratón', desc: 'Gana 10.000 monedas en total.', monedas: 500,
    cond: s => s.total >= 1e4, prog: s => [Math.min(s.total, 1e4), 1e4] },
  { id: 'magnate', nombre: 'Magnate del Meme', desc: 'Gana 100.000 monedas en total.', monedas: 10000,
    cond: s => s.total >= 1e5, prog: s => [Math.min(s.total, 1e5), 1e5] },
  { id: 'leyenda', nombre: 'Leyenda Urbana', desc: 'Alcanza el nivel 10.', monedas: 2000,
    cond: s => s.nivel >= 10, prog: s => [s.nivel, 10] },
  { id: 'midas', nombre: 'Toque de Midas', desc: 'Ten colocado un Meme legendario o superior.', monedas: 4000,
    cond: s => s.mejorRareza >= 3, prog: s => [Math.min(s.mejorRareza, 3), 3] },
  { id: 'queso', nombre: 'Cazador de Queso', desc: 'Atrapa al Queso Dorado en un evento.', monedas: 1500,
    cond: s => s.quesos >= 1, prog: s => [s.quesos, 1] },
  { id: 'muro', nombre: 'Muro Invisible', desc: 'Bloquea 5 robos con tu escudo.', monedas: 600,
    cond: s => s.bloqueos >= 5, prog: s => [s.bloqueos, 5] },
  { id: 'mejorador', nombre: 'Adicto a las Mejoras', desc: 'Compra 6 niveles de mejora.', monedas: 800,
    cond: s => s.mejoras >= 6, prog: s => [s.mejoras, 6] },
  { id: 'imperio', nombre: 'Imperio Absurdo', desc: 'Alcanza 500 monedas por segundo.', monedas: 10000,
    cond: s => s.ips >= 500, prog: s => [Math.min(Math.floor(s.ips), 500), 500] },
];


