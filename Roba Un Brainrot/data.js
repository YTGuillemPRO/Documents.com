/* =========================================================
   ¡ROBA EL MEME! 3D — data.js
   Definiciones de juego: rarezas, 24 Memes originales
   (recetas 3D que el motor construye con Three.js),
   mejoras, logros, eventos y bots rivales.
   Todos los nombres y diseños son originales.
   ========================================================= */

window.DATOS = {

  /* ================= RAREZAS =================
     peso  → probabilidad de aparecer en la zona central
     mult  → bonificación de ingresos por rareza             */
  RAREZAS: {
    comun:      { nombre:'Común',      color:0x9aa5ad, css:'#9aa5ad', peso:54,   mult:1    },
    raro:       { nombre:'Raro',       color:0x4d9de0, css:'#4d9de0', peso:26,   mult:1.15 },
    epico:      { nombre:'Épico',      color:0x9b59d0, css:'#9b59d0', peso:12,   mult:1.3  },
    legendario: { nombre:'Legendario', color:0xe67e22, css:'#e67e22', peso:5.2,  mult:1.5  },
    mitico:     { nombre:'Mítico',     color:0xe84393, css:'#e84393', peso:1.5,  mult:1.8  },
    secreto:    { nombre:'Secreto',    color:0x00c2a8, css:'#00c2a8', peso:0.3,  mult:2.2  }
  },

  /* ================= MEMES (24) =================
     receta.cuerpo.forma: caja | bola | ovo | cono | cil | toro
     receta.ojos.estilo : normal feliz dormido triste enojado
                          robot estrella ciclope (sep:0)
     receta.boca.estilo : sonrisa triste abierta lengua serio
                          grande o
     extras: piezas sueltas {forma,color,tam,pos,rot}          */
  MEMES: [

    /* ---------- COMUNES ---------- */
    { id:'tostada', nombre:'Tostada Turista', rareza:'comun', precio:25, ips:0.5,
      receta:{
        cuerpo:{ forma:'caja', color:0xe8b06a, tam:[1.25,1.05,0.42] },
        ojos:{ estilo:'normal', y:0.26, sep:0.21, r:0.12 },
        boca:{ estilo:'sonrisa', y:0.05 },
        extras:[
          { forma:'caja', color:0xffc93c, tam:[0.55,0.15,0.34], pos:[0,0.58,0] }
        ]
      }},

    { id:'patito', nombre:'Patito de Goma', rareza:'comun', precio:40, ips:0.8,
      receta:{
        cuerpo:{ forma:'bola', color:0xffd93b, tam:[1.15,1.05,1.15] },
        ojos:{ estilo:'normal', y:0.34, sep:0.25, r:0.11 },
        extras:[
          { forma:'cono', color:0xf08c2e, tam:[0.3,0.42,0.3], pos:[0,0.28,0.55], rot:[1.35,0,0] },
          { forma:'caja', color:0xf5c518, tam:[0.3,0.5,0.55], pos:[-0.62,0.1,0], rot:[0,0,0.35] },
          { forma:'caja', color:0xf5c518, tam:[0.3,0.5,0.55], pos:[0.62,0.1,0], rot:[0,0,-0.35] }
        ]
      }},

    { id:'nube', nombre:'Nube Dormilona', rareza:'comun', precio:60, ips:1.2,
      receta:{
        cuerpo:{ forma:'bola', color:0xf4faff, tam:[1.5,1.0,1.15] },
        ojos:{ estilo:'dormido', y:0.28, sep:0.27, r:0.12 },
        boca:{ estilo:'abierta', y:0.02 },
        extras:[
          { forma:'bola', color:0xf4faff, tam:[0.85,0.7,0.8], pos:[-0.6,0.02,0.08] },
          { forma:'bola', color:0xf4faff, tam:[0.85,0.7,0.8], pos:[0.6,0.02,0.08] },
          { forma:'cono', color:0x4d9de0, tam:[0.55,0.5,0.55], pos:[0,0.66,0] }
        ]
      }},

    { id:'papa', nombre:'Papa Triste', rareza:'comun', precio:50, ips:1.0,
      receta:{
        cuerpo:{ forma:'ovo', color:0x9c7a4f, tam:[1.05,1.3,0.95] },
        ojos:{ estilo:'triste', y:0.5, sep:0.2, r:0.12 },
        boca:{ estilo:'triste', y:0.26 },
        extras:[
          { forma:'bola', color:0x8a6a43, tam:[0.26,0.2,0.26], pos:[-0.38,0.95,0.1] },
          { forma:'bola', color:0x8a6a43, tam:[0.2,0.16,0.2], pos:[0.4,1.05,-0.15] }
        ]
      }},

    { id:'ladrillo', nombre:'Ladrillo Bromista', rareza:'comun', precio:75, ips:1.5,
      receta:{
        cuerpo:{ forma:'caja', color:0xc1553f, tam:[1.3,0.85,0.8] },
        ojos:{ estilo:'feliz', y:0.26, sep:0.24, r:0.13 },
        boca:{ estilo:'grande', y:-0.05 },
        extras:[
          { forma:'caja', color:0x2b211c, tam:[0.52,0.07,0.1], pos:[0,0.5,0.42] }
        ]
      }},

    { id:'cactus', nombre:'Cactus Chistoso', rareza:'comun', precio:70, ips:1.4,
      receta:{
        cuerpo:{ forma:'cil', color:0x4caf50, tam:[0.95,1.35,0.95] },
        ojos:{ estilo:'normal', y:0.52, sep:0.17, r:0.11 },
        boca:{ estilo:'sonrisa', y:0.32 },
        extras:[
          { forma:'cil', color:0x4caf50, tam:[0.5,0.6,0.5], pos:[-0.62,0.4,0], rot:[0,0,0.9] },
          { forma:'cil', color:0x4caf50, tam:[0.5,0.6,0.5], pos:[0.62,0.4,0], rot:[0,0,-0.9] },
          { forma:'bola', color:0xf06292, tam:[0.3,0.3,0.3], pos:[0,0.83,0] }
        ]
      }},

    { id:'gomita', nombre:'Gomita Feliz', rareza:'comun', precio:55, ips:1.1,
      receta:{
        cuerpo:{ forma:'ovo', color:0xe74c3c, tam:[1.0,1.25,0.9] },
        ojos:{ estilo:'normal', y:0.46, sep:0.2, r:0.12 },
        boca:{ estilo:'lengua', y:0.24 },
        mejillas:true
      }},

    /* ---------- RAROS ---------- */
    { id:'gato', nombre:'Gato Mantequilla', rareza:'raro', precio:150, ips:3,
      receta:{
        cuerpo:{ forma:'bola', color:0xf59e4c, tam:[1.2,1.15,1.05] },
        ojos:{ estilo:'normal', y:0.42, sep:0.23, r:0.13 },
        boca:{ estilo:'lengua', y:0.2 },
        mejillas:true,
        extras:[
          { forma:'cono', color:0xf59e4c, tam:[0.4,0.5,0.4], pos:[-0.34,0.72,0], rot:[0,0,0.25] },
          { forma:'cono', color:0xf59e4c, tam:[0.4,0.5,0.4], pos:[0.34,0.72,0], rot:[0,0,-0.25] },
          { forma:'cono', color:0xf08c2e, tam:[0.18,0.18,0.18], pos:[0,0.28,0.52], rot:[1.5,0,0] },
          { forma:'cil', color:0xf59e4c, tam:[0.22,0.75,0.22], pos:[-0.52,0.0,-0.5], rot:[0.7,0,0.5] }
        ]
      }},

    { id:'banana', nombre:'Banana Ninja', rareza:'raro', precio:220, ips:4.5,
      receta:{
        cuerpo:{ forma:'cono', color:0xffe135, tam:[0.85,1.45,0.85] },
        ojos:{ estilo:'normal', y:0.5, sep:0.15, r:0.1 },
        boca:{ estilo:'serio', y:0.32 },
        extras:[
          { forma:'caja', color:0x2b211c, tam:[0.78,0.22,0.78], pos:[0,0.66,0] },
          { forma:'cono', color:0x7a5230, tam:[0.2,0.28,0.2], pos:[0,0.84,0] }
        ]
      }},

    { id:'robotin', nombre:'Robot Chiquitín', rareza:'raro', precio:260, ips:5.5,
      receta:{
        cuerpo:{ forma:'caja', color:0x8fa6b8, tam:[1.0,1.05,0.85] },
        ojos:{ estilo:'robot', y:0.42, sep:0.2, r:0.12 },
        boca:{ estilo:'serio', y:0.2 },
        extras:[
          { forma:'cil', color:0x5d7488, tam:[0.1,0.42,0.1], pos:[0,0.75,0] },
          { forma:'bola', color:0xe2574c, tam:[0.2,0.2,0.2], pos:[0,1.0,0] },
          { forma:'caja', color:0x5d7488, tam:[0.42,0.3,0.45], pos:[-0.63,0.35,0] },
          { forma:'caja', color:0x5d7488, tam:[0.42,0.3,0.45], pos:[0.63,0.35,0] },
          { forma:'caja', color:0xffc93c, tam:[0.3,0.2,0.1], pos:[0,0.18,0.45] }
        ]
      }},

    { id:'fantasma', nombre:'Fantasma Tímido', rareza:'raro', precio:300, ips:6,
      receta:{
        cuerpo:{ forma:'ovo', color:0xeef3ff, tam:[1.15,1.4,1.0], op:0.82 },
        ojos:{ estilo:'triste', y:0.55, sep:0.2, r:0.12 },
        boca:{ estilo:'o', y:0.3 }
      }},

    { id:'zombie', nombre:'Zombie Gamer', rareza:'raro', precio:380, ips:8,
      receta:{
        cuerpo:{ forma:'caja', color:0x7cb342, tam:[1.0,1.2,0.8] },
        ojos:{ estilo:'dormido', y:0.46, sep:0.22, r:0.12 },
        boca:{ estilo:'serio', y:0.24 },
        extras:[
          { forma:'cil', color:0x37474f, tam:[0.3,0.5,0.3], pos:[-0.56,0.62,0], rot:[0,0,1.57] },
          { forma:'cil', color:0x37474f, tam:[0.3,0.5,0.3], pos:[0.56,0.62,0], rot:[0,0,1.57] },
          { forma:'caja', color:0x37474f, tam:[0.9,0.14,0.3], pos:[0,0.75,0] },
          { forma:'caja', color:0x5d4037, tam:[0.3,0.36,0.1], pos:[0.58,0.15,0.38], rot:[0,-0.4,0] }
        ]
      }},

    /* ---------- ÉPICOS ---------- */
    { id:'unicornio', nombre:'Unicornio Chuleta', rareza:'epico', precio:800, ips:18,
      receta:{
        cuerpo:{ forma:'bola', color:0xfdfdfd, tam:[1.2,1.2,1.05] },
        ojos:{ estilo:'feliz', y:0.42, sep:0.23, r:0.13 },
        boca:{ estilo:'sonrisa', y:0.2 },
        mejillas:true,
        extras:[
          { forma:'cono', color:0xffc93c, tam:[0.26,0.62,0.26], pos:[0,0.88,0.12] },
          { forma:'cono', color:0xfdfdfd, tam:[0.3,0.35,0.3], pos:[-0.34,0.66,0.05], rot:[0,0,0.4] },
          { forma:'cono', color:0xfdfdfd, tam:[0.3,0.35,0.3], pos:[0.34,0.66,0.05], rot:[0,0,-0.4] },
          { forma:'bola', color:0xf06292, tam:[0.55,0.5,0.5], pos:[-0.3,0.5,-0.5] },
          { forma:'bola', color:0xba68c8, tam:[0.55,0.5,0.5], pos:[0,0.42,-0.62] },
          { forma:'bola', color:0x64b5f6, tam:[0.55,0.5,0.5], pos:[0.3,0.5,-0.5] }
        ]
      }},

    { id:'taco', nombre:'Taco Supremo', rareza:'epico', precio:950, ips:21,
      receta:{
        cuerpo:{ forma:'cono', color:0xe8a33d, tam:[1.05,1.3,1.05], rot:[Math.PI,0,0] },
        ojos:{ estilo:'normal', y:0.4, sep:0.22, r:0.12 },
        boca:{ estilo:'sonrisa', y:0.2 },
        extras:[
          { forma:'bola', color:0x7ac74f, tam:[0.5,0.32,0.5], pos:[0,1.02,0.1] },
          { forma:'bola', color:0xe2574c, tam:[0.32,0.28,0.32], pos:[-0.3,1.0,0.18] },
          { forma:'bola', color:0xfff3c4, tam:[0.3,0.24,0.3], pos:[0.3,1.0,0.18] }
        ]
      }},

    { id:'llama', nombre:'Llama Dramática', rareza:'epico', precio:1100, ips:25,
      receta:{
        cuerpo:{ forma:'bola', color:0xf48fb1, tam:[0.95,1.1,0.85] },
        ojos:{ estilo:'enojado', y:0.48, sep:0.18, r:0.11 },
        boca:{ estilo:'triste', y:0.26 },
        extras:[
          { forma:'cil', color:0xf48fb1, tam:[0.5,0.75,0.5], pos:[0,0.85,0] },
          { forma:'bola', color:0xf8bbd0, tam:[0.72,0.62,0.66], pos:[0,1.42,0.08] },
          { forma:'cono', color:0xf8bbd0, tam:[0.16,0.22,0.16], pos:[-0.18,1.78,0.05] },
          { forma:'cono', color:0xf8bbd0, tam:[0.16,0.22,0.16], pos:[0.18,1.78,0.05] },
          { forma:'caja', color:0x4d9de0, tam:[1.05,0.8,0.28], pos:[0,0.4,-0.52] },
          { forma:'bola', color:0x81d4fa, tam:[0.13,0.19,0.13], pos:[0.28,0.36,0.44] }
        ]
      }},

    { id:'cangrejo', nombre:'Cangrejo Disco', rareza:'epico', precio:1300, ips:29,
      receta:{
        cuerpo:{ forma:'bola', color:0xe53935, tam:[1.3,0.85,1.0] },
        ojos:{ estilo:'estrella', y:0.55, sep:0.16, r:0.11 },
        boca:{ estilo:'lengua', y:0.22 },
        extras:[
          { forma:'bola', color:0xb39ddb, tam:[0.52,0.52,0.52], pos:[0,0.72,0] },
          { forma:'caja', color:0xe53935, tam:[0.48,0.32,0.36], pos:[-0.88,0.28,0.1], rot:[0,0.5,0] },
          { forma:'caja', color:0xe53935, tam:[0.48,0.32,0.36], pos:[0.88,0.28,0.1], rot:[0,-0.5,0] },
          { forma:'cil', color:0xc62828, tam:[0.16,0.5,0.16], pos:[-0.5,-0.15,0.4], rot:[0.9,0,0] },
          { forma:'cil', color:0xc62828, tam:[0.16,0.5,0.16], pos:[0.5,-0.15,0.4], rot:[0.9,0,0] }
        ]
      }},

    { id:'nabo', nombre:'Ninja Rábano', rareza:'epico', precio:1500, ips:34,
      receta:{
        cuerpo:{ forma:'cono', color:0xf5f0e6, tam:[0.9,1.35,0.9] },
        ojos:{ estilo:'normal', y:0.48, sep:0.16, r:0.1 },
        boca:{ estilo:'serio', y:0.3 },
        extras:[
          { forma:'cono', color:0x66bb6a, tam:[0.22,0.45,0.22], pos:[-0.14,0.95,0], rot:[0,0,0.3] },
          { forma:'cono', color:0x66bb6a, tam:[0.22,0.45,0.22], pos:[0.14,0.95,0], rot:[0,0,-0.3] },
          { forma:'cono', color:0x66bb6a, tam:[0.22,0.4,0.22], pos:[0,1.02,0.12] },
          { forma:'caja', color:0xe2574c, tam:[0.85,0.2,0.85], pos:[0,0.72,0] }
        ]
      }},

    /* ---------- LEGENDARIOS ---------- */
    { id:'dragon', nombre:'Dragón Nacho', rareza:'legendario', precio:3200, ips:78,
      receta:{
        cuerpo:{ forma:'bola', color:0x43a047, tam:[1.25,1.25,1.05] },
        ojos:{ estilo:'enojado', y:0.5, sep:0.23, r:0.12 },
        boca:{ estilo:'abierta', y:0.22 },
        extras:[
          { forma:'cono', color:0xfdfdfd, tam:[0.18,0.4,0.18], pos:[-0.26,0.85,0.05], rot:[-0.3,0,0.3] },
          { forma:'cono', color:0xfdfdfd, tam:[0.18,0.4,0.18], pos:[0.26,0.85,0.05], rot:[-0.3,0,-0.3] },
          { forma:'caja', color:0xe2574c, tam:[0.85,0.5,0.12], pos:[-0.95,0.6,-0.25], rot:[0,0.4,0.5] },
          { forma:'caja', color:0xe2574c, tam:[0.85,0.5,0.12], pos:[0.95,0.6,-0.25], rot:[0,-0.4,-0.5] },
          { forma:'cono', color:0x2e7d32, tam:[0.28,0.9,0.28], pos:[0,0.1,-0.65], rot:[-1.1,0,0] },
          { forma:'cono', color:0xff9800, tam:[0.3,0.5,0.3], pos:[0,0.2,0.62], rot:[1.45,0,0] }
        ]
      }},

    { id:'gallo', nombre:'Gallo Matrix', rareza:'legendario', precio:4500, ips:112,
      receta:{
        cuerpo:{ forma:'caja', color:0xfafafa, tam:[1.0,1.2,0.85] },
        ojos:{ estilo:'normal', y:0.52, sep:0.2, r:0.11 },
        boca:null,
        extras:[
          { forma:'cono', color:0xe53935, tam:[0.16,0.3,0.16], pos:[-0.24,1.28,0] },
          { forma:'cono', color:0xe53935, tam:[0.16,0.38,0.16], pos:[0,1.34,0] },
          { forma:'cono', color:0xe53935, tam:[0.16,0.3,0.16], pos:[0.24,1.28,0] },
          { forma:'cono', color:0xf08c2e, tam:[0.3,0.42,0.3], pos:[0,0.38,0.52], rot:[1.4,0,0] },
          { forma:'caja', color:0x2b211c, tam:[0.34,0.2,0.1], pos:[-0.21,0.55,0.44] },
          { forma:'caja', color:0x2b211c, tam:[0.34,0.2,0.1], pos:[0.21,0.55,0.44] },
          { forma:'caja', color:0x2b211c, tam:[0.16,0.08,0.1], pos:[0,0.55,0.44] },
          { forma:'caja', color:0xf08c2e, tam:[0.14,0.3,0.14], pos:[-0.2,0.05,0.1] },
          { forma:'caja', color:0xf08c2e, tam:[0.14,0.3,0.14], pos:[0.2,0.05,0.1] },
          { forma:'caja', color:0xef6c00, tam:[0.5,0.55,0.12], pos:[0,0.55,-0.5], rot:[0.5,0,0.3] }
        ]
      }},

    { id:'roboton', nombre:'Robot Gigantón', rareza:'legendario', precio:6000, ips:155,
      receta:{
        cuerpo:{ forma:'caja', color:0x4a6fa5, tam:[1.45,1.6,1.0] },
        ojos:{ estilo:'robot', y:0.95, sep:0.26, r:0.14 },
        boca:{ estilo:'serio', y:0.72 },
        extras:[
          { forma:'bola', color:0x37474f, tam:[0.5,0.5,0.5], pos:[-0.9,1.4,0] },
          { forma:'bola', color:0x37474f, tam:[0.5,0.5,0.5], pos:[0.9,1.4,0] },
          { forma:'cil', color:0x37474f, tam:[0.1,0.5,0.1], pos:[0.35,1.85,0] },
          { forma:'bola', color:0xe2574c, tam:[0.22,0.22,0.22], pos:[0.35,2.13,0] },
          { forma:'bola', color:0xe2574c, tam:[0.3,0.3,0.14], pos:[0,0.5,0.52] },
          { forma:'caja', color:0xffc93c, tam:[0.2,0.5,0.2], pos:[-0.95,0.45,0] },
          { forma:'caja', color:0xffc93c, tam:[0.2,0.5,0.2], pos:[0.95,0.45,0] }
        ]
      }},

    /* ---------- MÍTICOS ---------- */
    { id:'kraken', nombre:'Kraken de Sopa', rareza:'mitico', precio:12500, ips:340,
      receta:{
        cuerpo:{ forma:'ovo', color:0x7e57c2, tam:[1.05,1.05,1.0] },
        ojos:{ estilo:'estrella', y:0.6, sep:0.2, r:0.12 },
        boca:{ estilo:'grande', y:0.34 },
        extras:[
          { forma:'cil', color:0xfafafa, tam:[1.75,0.85,1.75], pos:[0,0.42,0] },
          { forma:'toro', color:0xfafafa, tam:[0.42,0.42,0.42], pos:[1.0,0.45,0], rot:[0,0,0] },
          { forma:'cil', color:0x7e57c2, tam:[0.24,0.85,0.24], pos:[-0.62,0.12,0.35], rot:[0.9,0,0.5] },
          { forma:'cil', color:0x7e57c2, tam:[0.24,0.85,0.24], pos:[0.62,0.12,0.35], rot:[0.9,0,-0.5] },
          { forma:'cil', color:0x7e57c2, tam:[0.24,0.85,0.24], pos:[-0.55,0.12,-0.5], rot:[-0.9,0,-0.5] },
          { forma:'cil', color:0x7e57c2, tam:[0.24,0.85,0.24], pos:[0.55,0.12,-0.5], rot:[-0.9,0,0.5] },
          { forma:'cil', color:0x7e57c2, tam:[0.24,0.85,0.24], pos:[0,0.05,0.75], rot:[1.2,0,0] },
          { forma:'bola', color:0xf4faff, tam:[0.3,0.3,0.3], pos:[-0.25,1.45,0], op:0.6 },
          { forma:'bola', color:0xf4faff, tam:[0.4,0.4,0.4], pos:[0.25,1.6,0.1], op:0.55 }
        ]
      }},

    { id:'fenix', nombre:'Fénix Fideo', rareza:'mitico', precio:20000, ips:560,
      receta:{
        cuerpo:{ forma:'bola', color:0xf4511e, tam:[1.1,1.25,1.0] },
        ojos:{ estilo:'feliz', y:0.5, sep:0.2, r:0.12 },
        boca:{ estilo:'abierta', y:0.24 },
        extras:[
          { forma:'cono', color:0xffb300, tam:[0.26,0.6,0.26], pos:[0,0.95,0] },
          { forma:'cono', color:0xff6f00, tam:[0.2,0.45,0.2], pos:[-0.25,0.85,0.1], rot:[0,0,0.5] },
          { forma:'cono', color:0xff6f00, tam:[0.2,0.45,0.2], pos:[0.25,0.85,0.1], rot:[0,0,-0.5] },
          { forma:'cono', color:0xff9800, tam:[0.3,0.85,0.3], pos:[-0.85,0.5,0], rot:[0,0,1.2] },
          { forma:'cono', color:0xffb300, tam:[0.26,0.7,0.26], pos:[-1.05,0.3,0], rot:[0,0,1.45] },
          { forma:'cono', color:0xff9800, tam:[0.3,0.85,0.3], pos:[0.85,0.5,0], rot:[0,0,-1.2] },
          { forma:'cono', color:0xffb300, tam:[0.26,0.7,0.26], pos:[1.05,0.3,0], rot:[0,0,-1.45] },
          { forma:'cono', color:0xff5722, tam:[0.24,0.8,0.24], pos:[-0.2,0.05,-0.6], rot:[-1.3,0,0.3] },
          { forma:'cono', color:0xff5722, tam:[0.24,0.8,0.24], pos:[0.2,0.05,-0.6], rot:[-1.3,0,-0.3] },
          { forma:'cil', color:0xffe082, tam:[0.09,0.55,0.09], pos:[-0.16,0.0,0.55], rot:[0.35,0,0.15] },
          { forma:'cil', color:0xffe082, tam:[0.09,0.55,0.09], pos:[0.16,0.0,0.55], rot:[0.35,0,-0.15] }
        ]
      }},

    /* ---------- SECRETOS ---------- */
    { id:'glu', nombre:'Señor Glú', rareza:'secreto', precio:50000, ips:1500,
      receta:{
        cuerpo:{ forma:'bola', color:0x26c6da, tam:[1.35,1.55,1.3], op:0.85 },
        ojos:{ estilo:'ciclope', y:0.72, sep:0, r:0.34 },
        boca:{ estilo:'grande', y:0.38 },
        extras:[
          { forma:'toro', color:0xffd54f, tam:[0.95,0.95,0.95], pos:[0,1.85,0], rot:[Math.PI/2,0,0] },
          { forma:'cil', color:0x0097a7, tam:[0.09,0.35,0.09], pos:[-0.42,1.7,0] },
          { forma:'cil', color:0x0097a7, tam:[0.09,0.35,0.09], pos:[0.42,1.7,0] },
          { forma:'bola', color:0xb2ebf2, tam:[0.24,0.24,0.24], pos:[-0.42,1.92,0] },
          { forma:'bola', color:0xb2ebf2, tam:[0.24,0.24,0.24], pos:[0.42,1.92,0] }
        ]
      }},

    { id:'patata', nombre:'Patata Divina', rareza:'secreto', precio:75000, ips:2400,
      receta:{
        cuerpo:{ forma:'ovo', color:0xffd54f, tam:[1.2,1.45,1.1] },
        ojos:{ estilo:'feliz', y:0.62, sep:0.22, r:0.13 },
        boca:{ estilo:'lengua', y:0.36 },
        mejillas:true,
        extras:[
          { forma:'cil', color:0xffc107, tam:[0.6,0.38,0.6], pos:[0,1.6,0] },
          { forma:'cono', color:0xffc107, tam:[0.16,0.3,0.16], pos:[-0.2,1.9,0] },
          { forma:'cono', color:0xffc107, tam:[0.16,0.36,0.16], pos:[0,1.94,0] },
          { forma:'cono', color:0xffc107, tam:[0.16,0.3,0.16], pos:[0.2,1.9,0] },
          { forma:'caja', color:0xfdfdfd, tam:[0.85,0.5,0.1], pos:[-1.05,1.0,0], rot:[0,0.3,0.55] },
          { forma:'caja', color:0xfdfdfd, tam:[0.85,0.5,0.1], pos:[1.05,1.0,0], rot:[0,-0.3,-0.55] },
          { forma:'toro', color:0xfff176, tam:[1.05,1.05,1.05], pos:[0,2.15,0], rot:[Math.PI/2,0,0] }
        ]
      }}
  ],

  /* ================= MEJORAS ================= */
  MEJORAS: [
    { id:'zapato',   nombre:'Zapatos Turbo',      icono:'#i-zapato',   color:'#4d9de0',
      desc:'+0,9 de velocidad por nivel',          max:5, base:120,  mult:2.2 },
    { id:'guante',   nombre:'Guante Ladrón',      icono:'#i-guante',  color:'#57b14b',
      desc:'Corres más rápido cargando un meme',   max:5, base:200,  mult:2.4 },
    { id:'iman',     nombre:'Imán de Monedas',    icono:'#i-iman',    color:'#e2574c',
      desc:'+1,5 de radio al recoger la olla',     max:5, base:150,  mult:2.1 },
    { id:'escudo',   nombre:'Escudo Reforzado',   icono:'#i-escudo',  color:'#3ec6b8',
      desc:'+2 s de escudo y −3 s de recarga',     max:5, base:250,  mult:2.5 },
    { id:'expandir', nombre:'Ampliar Base',       icono:'#i-expandir',color:'#9b59d0',
      desc:'+4 huecos para memes en tu base',      max:3, base:400,  mult:3.0 }
  ],

  /* ================= LOGROS ================= */
  LOGROS: [
    { id:'primera_compra', nombre:'Primera Compra',    desc:'Compra tu primer meme',                  premio:{monedas:50, xp:60},
      cond:s=>s.compras>=1 },
    { id:'cartera',        nombre:'Cartera Contenta',  desc:'Gana 1.000 monedas en total',            premio:{monedas:120, xp:120},
      cond:s=>s.monedasTotales>=1000 },
    { id:'ladron_novel',   nombre:'Ladrón Novel',      desc:'Roba tu primer meme a un bot',           premio:{monedas:150, xp:160},
      cond:s=>s.robos>=1 },
    { id:'recuperador',    nombre:'Justiciero',        desc:'Recupera un meme robándoselo a un bot',  premio:{monedas:250, xp:220},
      cond:s=>s.recuperaciones>=1 },
    { id:'zoologico',      nombre:'Mi Zoológico',      desc:'Ten 10 memes a la vez en tu base',       premio:{monedas:400, xp:400},
      cond:s=>s.memesActuales>=10 },
    { id:'coleccionista',  nombre:'Coleccionista Pro', desc:'Consigue 15 memes distintos (histórico)',premio:{monedas:800, xp:700},
      cond:s=>s.memesDistintos>=15 },
    { id:'nivel_10',       nombre:'Cara Radiante',     desc:'Alcanza el nivel 10',                    premio:{monedas:1000, xp:0},
      cond:s=>s.nivel>=10 },
    { id:'turbo',          nombre:'Corredor Turbo',    desc:'Zapatos Turbo al nivel máximo',          premio:{monedas:600, xp:600},
      cond:s=>s.mejoraZapato>=5 },
    { id:'burbuja',        nombre:'Burbuja Total',     desc:'Usa el escudo 10 veces',                 premio:{monedas:500, xp:500},
      cond:s=>s.escudosUsados>=10 },
    { id:'cazador',        nombre:'Cazador Dorado',    desc:'Compra un meme DORADO de evento',        premio:{monedas:1200, xp:900},
      cond:s=>s.dorados>=1 },
    { id:'mafioso',        nombre:'Mafioso del Meme',  desc:'Roba 25 memes en total',                 premio:{monedas:2500, xp:2000},
      cond:s=>s.robos>=25 },
    { id:'millonario',     nombre:'Millonario',        desc:'Gana 100.000 monedas en total',          premio:{monedas:10000, xp:5000},
      cond:s=>s.monedasTotales>=100000 },
    { id:'secreto',        nombre:'El Secreto',        desc:'Consigue un meme SECRETO',               premio:{monedas:20000, xp:10000},
      cond:s=>s.tieneSecreto }
  ],

  /* ================= EVENTOS ESPECIALES ================= */
  EVENTOS: [
    { id:'turbo',   nombre:'¡FIESTA TURBO!',       desc:'Todos corren x1,6 durante 25 s',      dur:25 },
    { id:'lluvia',  nombre:'¡LLUVIA DE MONEDAS!',  desc:'Llueven monedas sobre tu base',       dur:8  },
    { id:'rebajas', nombre:'¡REBAJAS LOCAS!',      desc:'Memes del centro al 50% durante 35 s',dur:35 },
    { id:'dorado',  nombre:'¡MEME DORADO!',        desc:'Aparece un meme dorado que produce x5',dur:45 }
  ],

  /* ================= BOTS RIVALES ================= */
  BOTS: [
    { nombre:'BOT BRUNO', color:0xe2574c, cara:'enojado' },
    { nombre:'BOT VERO',  color:0x9b59d0, cara:'normal'  },
    { nombre:'BOT NILO',  color:0xf39c33, cara:'feliz'   }
  ]
};
