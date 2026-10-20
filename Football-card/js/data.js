/* ============================================================
   FOOTBALL CARD OPENER 2026 — Base de datos editable
   ➤ Jugadores FICTICIOS (nombres inventados, clubes inventados).
   ➤ Puedes editar/añadir/quitar libremente esta lista.
   Campos de cada jugador:
     id  : identificador único
     n   : nombre
     p   : posición (POR, DFC, LI, LD, MCD, MC, MCO, EI, ED, DC)
     c   : código de país (ver COUNTRIES)
     cl  : club (ficticio)
     r   : rareza (comun | especial | rara | epica | legendaria)
     a   : atributos [RIT, TIR, PAS, REG, DEF, FÍS]
     m   : media total (calculated a mano, editable)
   ============================================================ */

const COUNTRIES = {
  AR:{n:"Argentina",f:"🇦🇷"}, ES:{n:"España",f:"🇪🇸"}, BR:{n:"Brasil",f:"🇧🇷"},
  FR:{n:"Francia",f:"🇫🇷"},   DE:{n:"Alemania",f:"🇩🇪"}, IT:{n:"Italia",f:"🇮🇹"},
  EN:{n:"Inglaterra",f:"🇬🇧"}, SE:{n:"Suecia",f:"🇸🇪"},  MA:{n:"Marruecos",f:"🇲🇦"},
  RS:{n:"Serbia",f:"🇷🇸"},    PT:{n:"Portugal",f:"🇵🇹"},  JP:{n:"Japón",f:"🇯🇵"},
  HR:{n:"Croacia",f:"🇭🇷"},    CL:{n:"Chile",f:"🇨🇱"},     NO:{n:"Noruega",f:"🇳🇴"},
  UY:{n:"Uruguay",f:"🇺🇾"},    SN:{n:"Senegal",f:"🇸🇳"},   NG:{n:"Nigeria",f:"🇳🇬"},
  CM:{n:"Camerún",f:"🇨🇲"},    CO:{n:"Colombia",f:"🇨🇴"},  GH:{n:"Ghana",f:"🇬🇭"},
  DZ:{n:"Argelia",f:"🇩🇿"},    RO:{n:"Rumanía",f:"🇷🇴"}
};

/* Rarezas: color, glow y multiplicador de valor de venta */
const RARITIES = {
  comun:      { nombre:"Común",      color:"#b8a48a", venta:2  },
  especial:   { nombre:"Especial",   color:"#cfe0f2", venta:3  },
  rara:       { nombre:"Rara",       color:"#ffcc4d", venta:5  },
  epica:      { nombre:"Épica",      color:"#ff9a3d", venta:8  },
  legendaria: { nombre:"Legendaria", color:"#ffe9b0", venta:15 }
};
const RAR_ORDER = ["comun","especial","rara","epica","legendaria"];

/* 60 jugadores ficticios */
const PLAYERS = [
  /* ---- LEGENDARIAS ---- */
  {id:"l01",n:"Leo Santoro",    p:"DC", c:"AR",cl:"Corona FC",     r:"legendaria",a:[94,97,86,95,38,80],m:99},
  {id:"l02",n:"Kai Vázquez",    p:"MCO",c:"ES",cl:"Corona FC",     r:"legendaria",a:[88,90,97,96,55,72],m:97},
  {id:"l03",n:"Zico Marins",    p:"EI", c:"BR",cl:"Aurora SC",    r:"legendaria",a:[95,89,88,97,35,70],m:96},
  {id:"l04",n:"Noah Delacroix", p:"MCO",c:"FR",cl:"Nova City",    r:"legendaria",a:[87,88,95,95,60,74],m:95},
  {id:"l05",n:"Viktor Sturm",   p:"DFC",c:"DE",cl:"Titán United", r:"legendaria",a:[82,45,80,72,96,94],m:94},
  {id:"l06",n:"Marco Belfiore", p:"POR",c:"IT",cl:"Olimpo FC",    r:"legendaria",a:[78,30,70,66,97,92],m:93},
  /* ---- ÉPICAS ---- */
  {id:"e01",n:"Jaden Okafor",     p:"ED", c:"EN",cl:"Delta Rovers", r:"epica",a:[93,88,84,91,40,76],m:89},
  {id:"e02",n:"Thiago Molina",    p:"MCD",c:"ES",cl:"Atlético Marino",r:"epica",a:[80,68,88,84,89,88],m:88},
  {id:"e03",n:"Ragnar Lindqvist", p:"DFC",c:"SE",cl:"Fénix FC",    r:"epica",a:[84,50,78,70,92,91],m:88},
  {id:"e04",n:"Cauã Ribeiro",     p:"DC", c:"BR",cl:"Fénix FC",    r:"epica",a:[90,90,74,86,35,85],m:87},
  {id:"e05",n:"Amine Zerrouki",   p:"MCD",c:"MA",cl:"Vértigo FC",  r:"epica",a:[82,72,87,86,85,84],m:86},
  {id:"e06",n:"Luka Petrov",      p:"MCO",c:"RS",cl:"Estrella FC", r:"epica",a:[84,84,88,89,55,73],m:86},
  {id:"e07",n:"Henrique Sousa",   p:"ED", c:"PT",cl:"Nova City",   r:"epica",a:[92,86,82,89,42,72],m:85},
  {id:"e08",n:"Yuto Nakamura",    p:"MCO",c:"JP",cl:"Aurora SC",   r:"epica",a:[83,80,90,91,58,68],m:85},
  {id:"e09",n:"Bruno Cardoso",    p:"POR",c:"BR",cl:"Vértigo FC",  r:"epica",a:[72,28,66,60,89,87],m:85},
  {id:"e10",n:"Dario Krstić",     p:"DFC",c:"HR",cl:"Estrella FC", r:"epica",a:[81,44,76,68,90,90],m:85},
  /* ---- RARAS ---- */
  {id:"r01",n:"Alejandro Ruiz",  p:"DC", c:"ES",cl:"Deportivo Sol",r:"rara",a:[88,86,70,82,32,80],m:84},
  {id:"r02",n:"Mamadou Diallo",  p:"LI", c:"SN",cl:"Vértigo FC",   r:"rara",a:[92,64,78,85,74,80],m:84},
  {id:"r03",n:"Pietro Ventura",  p:"MC", c:"IT",cl:"Olimpo FC",    r:"rara",a:[82,76,87,84,72,76],m:83},
  {id:"r04",n:"Erik Johansen",   p:"MCD",c:"NO",cl:"Fénix FC",     r:"rara",a:[78,62,84,76,85,86],m:83},
  {id:"r05",n:"Diego Ferreyra",  p:"MCO",c:"UY",cl:"Delta Rovers", r:"rara",a:[84,82,84,87,48,70],m:82},
  {id:"r06",n:"Callum Whitaker", p:"LI", c:"EN",cl:"Delta Rovers", r:"rara",a:[90,58,80,84,76,78],m:82},
  {id:"r07",n:"Nicolás Guzmán",  p:"ED", c:"CL",cl:"Estrella FC",  r:"rara",a:[89,80,76,86,40,68],m:81},
  {id:"r08",n:"Jonas Weber",     p:"MC", c:"DE",cl:"Titán United",r:"rara",a:[80,78,86,83,70,78],m:81},
  {id:"r09",n:"Rafael Duarte",   p:"MCO",c:"PT",cl:"Nova City",    r:"rara",a:[82,80,85,87,50,70],m:81},
  {id:"r10",n:"Hugo Marchand",   p:"POR",c:"FR",cl:"Nova City",    r:"rara",a:[68,26,62,58,86,84],m:80},
  {id:"r11",n:"Iker Etxebarri",  p:"LI", c:"ES",cl:"Atlético Marino",r:"rara",a:[88,55,79,82,78,79],m:80},
  {id:"r12",n:"Samuel Okoye",    p:"DC", c:"NG",cl:"Titán United",r:"rara",a:[86,74,62,78,80,86],m:80},
  {id:"r13",n:"Kylian Mvogo",    p:"EI", c:"CM",cl:"Aurora SC",   r:"rara",a:[91,78,80,88,36,66],m:79},
  {id:"r14",n:"Lorenzo Bianchi", p:"ED", c:"IT",cl:"Olimpo FC",   r:"rara",a:[87,79,78,85,42,70],m:79},
  /* ---- ESPECIALES ---- */
  {id:"s01",n:"Marc Vidal",       p:"MC", c:"ES",cl:"Deportivo Sol",r:"especial",a:[78,72,80,79,66,72],m:77},
  {id:"s02",n:"Tomás Herrera",    p:"MCO",c:"CL",cl:"Estrella FC", r:"especial",a:[80,76,78,80,44,64],m:76},
  {id:"s03",n:"Felix Neumann",    p:"DFC",c:"DE",cl:"Titán United",r:"especial",a:[76,40,70,62,82,84],m:76},
  {id:"s04",n:"Olivier Garnier",  p:"LI", c:"FR",cl:"Nova City",   r:"especial",a:[84,52,74,78,72,74],m:75},
  {id:"s05",n:"Kenji Watanabe",   p:"DFC",c:"JP",cl:"Aurora SC",   r:"especial",a:[74,38,72,64,80,80],m:75},
  {id:"s06",n:"Ivan Petrović",    p:"MCD",c:"RS",cl:"Estrella FC", r:"especial",a:[72,58,78,72,81,82],m:75},
  {id:"s07",n:"Ben Acheampong",   p:"MC", c:"GH",cl:"Vértigo FC",  r:"especial",a:[80,70,76,80,64,74],m:74},
  {id:"s08",n:"Diego Millán",     p:"LI", c:"UY",cl:"Delta Rovers",r:"especial",a:[82,54,72,78,70,72],m:74},
  {id:"s09",n:"Stian Bakke",      p:"POR",c:"NO",cl:"Fénix FC",    r:"especial",a:[64,24,58,54,79,78],m:74},
  {id:"s10",n:"Luca Moretti",     p:"ED", c:"IT",cl:"Olimpo FC",   r:"especial",a:[80,72,72,80,38,66],m:73},
  {id:"s11",n:"Anthony Cole",     p:"MC", c:"EN",cl:"Delta Rovers",r:"especial",a:[76,70,78,76,66,74],m:73},
  {id:"s12",n:"Nabil Cherif",     p:"MCO",c:"DZ",cl:"Vértigo FC",  r:"especial",a:[78,74,76,80,42,62],m:73},
  {id:"s13",n:"Vlad Popescu",     p:"DFC",c:"RO",cl:"Fénix FC",    r:"especial",a:[74,42,68,60,77,80],m:72},
  {id:"s14",n:"Andrés Pinto",     p:"MC", c:"CO",cl:"Olimpo FC",   r:"especial",a:[74,68,78,76,58,70],m:72},
  /* ---- COMUNES ---- */
  {id:"c01",n:"Jorge Cabral",    p:"DC", c:"PT",cl:"Nova City",    r:"comun",a:[74,70,56,68,30,66],m:69},
  {id:"c02",n:"Liam Turner",     p:"LI", c:"EN",cl:"Delta Rovers",r:"comun",a:[76,44,66,70,64,66],m:68},
  {id:"c03",n:"Sergio Álvarez",  p:"MCD",c:"ES",cl:"Deportivo Sol",r:"comun",a:[70,54,72,66,72,72],m:68},
  {id:"c04",n:"Yannick Costa",   p:"LI", c:"BR",cl:"Aurora SC",   r:"comun",a:[78,58,64,74,28,60],m:67},
  {id:"c05",n:"Tobias Vogel",    p:"DFC",c:"DE",cl:"Titán United",r:"comun",a:[70,36,64,56,73,76],m:67},
  {id:"c06",n:"Marco Simões",    p:"MC", c:"PT",cl:"Nova City",   r:"comun",a:[70,64,74,72,56,64],m:66},
  {id:"c07",n:"Enzo Villalba",   p:"MCO",c:"AR",cl:"Deportivo Sol",r:"comun",a:[72,68,70,74,36,58],m:66},
  {id:"c08",n:"Kofi Mensah",     p:"MC", c:"GH",cl:"Vértigo FC",  r:"comun",a:[72,62,70,72,54,66],m:65},
  {id:"c09",n:"Pierre Dubois",   p:"DFC",c:"FR",cl:"Nova City",   r:"comun",a:[68,38,64,58,70,74],m:65},
  {id:"c10",n:"Samir Hadad",     p:"LI", c:"MA",cl:"Vértigo FC",  r:"comun",a:[74,48,66,70,62,64],m:64},
  {id:"c11",n:"Daniele Ricci",   p:"POR",c:"IT",cl:"Olimpo FC",   r:"comun",a:[58,22,54,50,68,70],m:64},
  {id:"c12",n:"Lucas Rojas",     p:"ED", c:"CL",cl:"Estrella FC", r:"comun",a:[72,64,62,70,34,60],m:63},
  {id:"c13",n:"Hans Larsen",     p:"MCD",c:"NO",cl:"Fénix FC",    r:"comun",a:[66,50,68,62,68,72],m:63},
  {id:"c14",n:"Pedro Assunção",  p:"MC", c:"BR",cl:"Aurora SC",   r:"comun",a:[68,62,68,70,52,62],m:62},
  {id:"c15",n:"Greg Stone",      p:"DFC",c:"EN",cl:"Delta Rovers",r:"comun",a:[64,34,60,54,68,74],m:61},
  {id:"c16",n:"Ibrahima Sy",     p:"MC", c:"SN",cl:"Vértigo FC",  r:"comun",a:[66,58,66,68,50,64],m:61}
];

/* ============================================================
   PACKS — Sistema de probabilidades 100% CONFIGURABLE
   probs: % de probabilidad de cada rareza por carta.
   garantiza: rareza mínima asegurada en el pack (opcional).
   ============================================================ */
const PACKS = [
  { id:"bronce",    nombre:"Pack Bronce",    precio:100,
    cartas:3, emoji:"🥉", color:"#b8a48a", grad:"linear-gradient(160deg,#3d332a,#1c150e)",
    probs:{comun:70, especial:24, rara:5,  epica:1,   legendaria:0} },

  { id:"plata",     nombre:"Pack Plata",     precio:300,
    cartas:4, emoji:"🥈", color:"#cfe0f2", grad:"linear-gradient(160deg,#2c3947,#131a21)",
    probs:{comun:50, especial:35, rara:11, epica:3.5, legendaria:0.5} },

  { id:"oro",       nombre:"Pack Oro",       precio:750,
    cartas:4, emoji:"🥇", color:"#ffcc4d", grad:"linear-gradient(160deg,#4a3a12,#1f1808)",
    probs:{comun:30, especial:40, rara:22, epica:6.5, legendaria:1.5} },

  { id:"premium",   nombre:"Pack Premium",   precio:1500,
    cartas:5, emoji:"💠", color:"#38e8c9", grad:"linear-gradient(160deg,#0d3f38,#07171a)",
    probs:{comun:15, especial:38, rara:32, epica:12,  legendaria:3},
    garantiza:"rara" },

  { id:"ultimate",  nombre:"Pack Ultimate",  precio:3500,
    cartas:5, emoji:"🔥", color:"#ff9a3d", grad:"linear-gradient(160deg,#432312,#1c0e07)",
    probs:{comun:0,  especial:30, rara:42, epica:22,  legendaria:6},
    garantiza:"epica" },

  { id:"legendario",nombre:"Pack Legendario",precio:7000,
    cartas:6, emoji:"👑", color:"#ffe9b0", grad:"linear-gradient(160deg,#423410,#1a1305)",
    probs:{comun:0,  especial:15, rara:40, epica:33,  legendaria:12},
    garantiza:"legendaria" }
];

/* Misiones diarias — también configurables */
const MISSIONS = [
  { id:"m1", icon:"🎁", txt:"Abre 3 packs",            meta:3, campo:"abiertos", recompensa:150 },
  { id:"m2", icon:"🃏", txt:"Consigue 5 cartas",        meta:5, campo:"nuevas",   recompensa:200 },
  { id:"m3", icon:"💎", txt:"Consigue 2 cartas Rara+",  meta:2, campo:"raras",    recompensa:250 },
  { id:"m4", icon:"💰", txt:"Vende 2 cartas",           meta:2, campo:"vendidas", recompensa:100 },
  { id:"m5", icon:"🛡️", txt:"Visita Mi Club",           meta:1, campo:"club",     recompensa:50  }
];

/* Índice rápido: id -> jugador */
const PBY = {};
PLAYERS.forEach(p => PBY[p.id] = p);
