import * as THREE from 'three';
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, runTransaction, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* ════════════════════════════════════════════════════════════════
   ⚙️ FIREBASE — Si tu web YA inicializa Firebase en otro script,
   no toques nada (lo detecta solo). Si este game.js va solo,
   pega tu firebaseConfig aquí:
════════════════════════════════════════════════════════════════ */
var FIREBASE_CONFIG=null; // ej: {apiKey:"...",databaseURL:"...",projectId:"..."}

/* 👑 ADMIN (exactamente como tus rules) */
var ADMIN_EMAILS=['guillevarelacors@gmail.com','guillempro07@gmail.com','ovarela@ietemple.cat'];
var SUPER_EMAILS=['guillevarelacors@gmail.com','guillempro07@gmail.com'];

// ===== MUNDOS (16) =====
var WORLDS=[
{id:'bosque',name:'Bosque Encantado',icon:'🌲',desc:'El inicio de tu aventura.',color:'#10b981',color2:'#84cc16',bonus:1,cost:0,eggs:['basico','dorado'],particles:'leaves'},
{id:'pradera',name:'Pradera Dorada',icon:'🌾',desc:'Campos magicos.',color:'#84cc16',color2:'#a3e635',bonus:1.3,cost:25000,eggs:['campestre','arcano'],particles:'leaves'},
{id:'jungla',name:'Jungla Profunda',icon:'🌴',desc:'Criaturas entre lianas.',color:'#22c55e',color2:'#84cc16',bonus:1.5,cost:2e5,eggs:['salvaje','toxico'],particles:'leaves'},
{id:'oceano',name:'Oceano Profundo',icon:'🌊',desc:'Bestias del mar.',color:'#06b6d4',color2:'#3b82f6',bonus:1.7,cost:1e6,eggs:['marino','abisal'],particles:'bubbles'},
{id:'desierto',name:'Desierto Faraonico',icon:'🏜️',desc:'Tesoros bajo la arena.',color:'#f59e0b',color2:'#fb923c',bonus:1.9,cost:8e6,eggs:['dunas','faraon'],particles:'stars'},
{id:'cristal',name:'Cueva Cristal',icon:'💎',desc:'Gemas brillantes.',color:'#d946ef',color2:'#ec4899',bonus:2.2,cost:5e7,eggs:['cristalino','gema'],particles:'stars'},
{id:'tundra',name:'Tundra Helada',icon:'❄️',desc:'El hielo guarda secretos.',color:'#38bdf8',color2:'#7dd3fc',bonus:2.6,cost:4e8,eggs:['glacial','polar'],particles:'stars'},
{id:'volcan',name:'Volcan Infernal',icon:'🌋',desc:'Rios de lava.',color:'#f97316',color2:'#ef4444',bonus:3,cost:2e9,eggs:['magmatico','infernal'],particles:'embers'},
{id:'cementerio',name:'Cementerio Antiguo',icon:'🪦',desc:'Los muertos despiertan.',color:'#a78bfa',color2:'#c084fc',bonus:3.6,cost:1.5e10,eggs:['tumba','maldito'],particles:'wisps'},
{id:'templo',name:'Templo Sagrado',icon:'🏛️',desc:'Dioses ancestrales.',color:'#eab308',color2:'#f59e0b',bonus:4.5,cost:1e11,eggs:['divino','ancestral'],particles:'stars'},
{id:'dulces',name:'Reino de Dulces',icon:'🍭',desc:'Un mundo comestible.',color:'#f472b6',color2:'#fb7185',bonus:5.3,cost:5e11,eggs:['goloso','pastel'],particles:'stars'},
{id:'neon',name:'Ciudad Neon',icon:'🌃',desc:'Luces y datos sin fin.',color:'#22d3ee',color2:'#e879f9',bonus:6.2,cost:2e12,eggs:['neon','virtual'],particles:'stars'},
{id:'cosmos',name:'Cosmos Infinito',icon:'🪐',desc:'Vacio entre estrellas.',color:'#a855f7',color2:'#ec4899',bonus:7,cost:5e12,eggs:['cosmico','estelar'],particles:'stars'},
{id:'dragonico',name:'Nido Draconico',icon:'🐲',desc:'Donde duermen los dragones.',color:'#ef4444',color2:'#f97316',bonus:9,cost:4e13,eggs:['draconico','wyrm'],particles:'embers'},
{id:'abismo',name:'Abismo Eterno',icon:'🌑',desc:'La dimension oscura.',color:'#6366f1',color2:'#06b6d4',bonus:12,cost:3e14,eggs:['umbral','absoluto'],particles:'wisps'},
{id:'eterno',name:'Reino Eterno',icon:'⚔️',desc:'El trono final del universo.',color:'#fde047',color2:'#fbbf24',bonus:16,cost:5e15,eggs:['eterno','omega'],particles:'wisps'}
];

// ===== MASCOTAS (199) =====
var PETS=[
{ic:'fa-solid fa-paw',n:'Raton',r:'common',e:2,eg:['basico'],c:'#78716c'},{ic:'fa-solid fa-dog',n:'Perro',r:'common',e:3,eg:['basico'],c:'#a0845c'},{ic:'fa-solid fa-cat',n:'Gato',r:'common',e:4,eg:['basico'],c:'#c9956b'},{ic:'fa-solid fa-paw',n:'Conejo',r:'common',e:5,eg:['basico'],c:'#d4a574'},{ic:'fa-solid fa-piggy-bank',n:'Cerdo',r:'common',e:7,eg:['basico'],c:'#e8879a'},{ic:'fa-solid fa-dove',n:'Pollito',r:'common',e:8,eg:['basico'],c:'#e8c84a'},{ic:'fa-solid fa-feather',n:'Pato',r:'rare',e:15,eg:['basico'],c:'#34d399'},{ic:'fa-solid fa-paw',n:'Zorro',r:'rare',e:20,eg:['basico'],c:'#f97316'},
{ic:'fa-solid fa-paw',n:'Oso',r:'rare',e:25,eg:['dorado'],c:'#8b6f47'},{ic:'fa-solid fa-paw',n:'Panda',r:'rare',e:30,eg:['dorado'],c:'#d1d5db'},{ic:'fa-solid fa-paw',n:'Koala',r:'rare',e:35,eg:['dorado'],c:'#9ca3af'},{ic:'fa-solid fa-feather-pointed',n:'Aguila',r:'epic',e:55,eg:['dorado'],c:'#a855f7'},{ic:'fa-solid fa-paw',n:'Leon',r:'epic',e:65,eg:['dorado'],c:'#eab308'},{ic:'fa-solid fa-paw',n:'Tigre',r:'epic',e:75,eg:['dorado'],c:'#ea580c'},{ic:'fa-solid fa-dragon',n:'Dragon',r:'god',e:130,eg:['dorado'],c:'#dc2626'},
{ic:'fa-solid fa-paw',n:'Ardilla',r:'common',e:8,eg:['campestre'],c:'#a16207'},{ic:'fa-solid fa-paw',n:'Mapache',r:'common',e:12,eg:['campestre'],c:'#71717a'},{ic:'fa-solid fa-horse',n:'Ciervo',r:'common',e:15,eg:['campestre'],c:'#92400e'},{ic:'fa-solid fa-otter',n:'Nutria',r:'rare',e:35,eg:['campestre'],c:'#0d9488'},{ic:'fa-solid fa-dove',n:'Cisne',r:'rare',e:45,eg:['campestre'],c:'#cbd5e1'},{ic:'fa-solid fa-feather-pointed',n:'Pavo Real',r:'epic',e:80,eg:['campestre'],c:'#2563eb'},{ic:'fa-solid fa-tree',n:'Arbol Vivo',r:'god',e:180,eg:['campestre'],c:'#16a34a'},
{ic:'fa-solid fa-crow',n:'Buho',r:'epic',e:90,eg:['arcano'],c:'#7c3aed'},{ic:'fa-solid fa-dog',n:'Lobo',r:'epic',e:110,eg:['arcano'],c:'#475569'},{ic:'fa-solid fa-horse',n:'Unicornio',r:'god',e:220,eg:['arcano'],c:'#d946ef'},{ic:'fa-solid fa-wand-magic-sparkles',n:'Brujo',r:'god',e:300,eg:['arcano'],c:'#6d28d9'},{ic:'fa-solid fa-eye',n:'Oraculo',r:'legendary',e:500,eg:['arcano'],c:'#a855f7'},
{ic:'fa-solid fa-fish',n:'Pez Payaso',r:'common',e:12,eg:['marino'],c:'#ea580c'},{ic:'fa-solid fa-shrimp',n:'Pulpo',r:'rare',e:50,eg:['marino'],c:'#c026d3'},{ic:'fa-solid fa-fish-fins',n:'Tiburon',r:'rare',e:65,eg:['marino'],c:'#475569'},{ic:'fa-solid fa-water',n:'Ballena',r:'epic',e:130,eg:['marino'],c:'#0284c7'},{ic:'fa-solid fa-water',n:'Sirena',r:'god',e:300,eg:['marino'],c:'#0891b2'},{ic:'fa-solid fa-gem',n:'Perla',r:'legendary',e:650,eg:['marino'],c:'#e0e7ff'},
{ic:'fa-solid fa-worm',n:'Calamar',r:'epic',e:150,eg:['abisal'],c:'#db2777'},{ic:'fa-solid fa-fish-fins',n:'Serpiente Mar',r:'god',e:350,eg:['abisal'],c:'#0d9488'},{ic:'fa-solid fa-fish-fins',n:'Megalodon',r:'god',e:450,eg:['abisal'],c:'#1e3a5f'},{ic:'fa-solid fa-water',n:'Leviatan',r:'legendary',e:800,eg:['abisal'],c:'#0284c7'},{ic:'fa-solid fa-ghost',n:'Fantasma Mar',r:'legendary',e:1000,eg:['abisal'],c:'#67e8f9'},{ic:'fa-solid fa-burst',n:'Kraken',r:'mythic',e:2500,eg:['abisal'],c:'#06b6d4'},
{ic:'fa-solid fa-gem',n:'Golem Cristal',r:'rare',e:100,eg:['cristalino'],c:'#c026d3'},{ic:'fa-solid fa-wand-sparkles',n:'Hada',r:'epic',e:220,eg:['cristalino'],c:'#d946ef'},{ic:'fa-solid fa-feather',n:'Mariposa Cristal',r:'epic',e:300,eg:['cristalino'],c:'#a855f7'},{ic:'fa-solid fa-dragon',n:'Draco Cristal',r:'god',e:550,eg:['cristalino'],c:'#7c3aed'},{ic:'fa-solid fa-crown',n:'Reina Cristal',r:'legendary',e:1100,eg:['cristalino'],c:'#ec4899'},{ic:'fa-solid fa-diamond',n:'Prisma',r:'mythic',e:3500,eg:['cristalino'],c:'#e879f9'},
{ic:'fa-solid fa-gem',n:'Rubi',r:'god',e:600,eg:['gema'],c:'#b91c1c'},{ic:'fa-solid fa-gem',n:'Esmeralda',r:'god',e:750,eg:['gema'],c:'#15803d'},{ic:'fa-solid fa-gem',n:'Zafiro',r:'legendary',e:1200,eg:['gema'],c:'#1d4ed8'},{ic:'fa-solid fa-gem',n:'Amatista',r:'legendary',e:1500,eg:['gema'],c:'#7e22ce'},{ic:'fa-solid fa-diamond',n:'Diamante',r:'mythic',e:4000,eg:['gema'],c:'#bfdbfe'},{ic:'fa-solid fa-eye',n:'Ojo Cosmos',r:'secret',e:9000,eg:['gema'],c:'#06b6d4'},
{ic:'fa-solid fa-fire',n:'Salamandra',r:'rare',e:130,eg:['magmatico'],c:'#c2410c'},{ic:'fa-solid fa-fire-flame-curved',n:'Ifrit',r:'epic',e:320,eg:['magmatico'],c:'#b91c1c'},{ic:'fa-solid fa-mountain',n:'Golem Lava',r:'god',e:650,eg:['magmatico'],c:'#991b1b'},{ic:'fa-solid fa-volcano',n:'Titan',r:'legendary',e:1400,eg:['magmatico'],c:'#ea580c'},{ic:'fa-solid fa-dragon',n:'Dragon Lava',r:'mythic',e:4500,eg:['magmatico'],c:'#dc2626'},{ic:'fa-solid fa-meteor',n:'Meteorito',r:'secret',e:10000,eg:['magmatico'],c:'#eab308'},
{ic:'fa-solid fa-spider',n:'Escorpion',r:'epic',e:350,eg:['infernal'],c:'#b91c1b'},{ic:'fa-solid fa-skull',n:'Diablo',r:'god',e:750,eg:['infernal'],c:'#7f1d1d'},{ic:'fa-solid fa-ghost',n:'Demonio',r:'legendary',e:1700,eg:['infernal'],c:'#450a0a'},{ic:'fa-solid fa-fire',n:'Fuego Eterno',r:'mythic',e:5500,eg:['infernal'],c:'#ea580c'},{ic:'fa-solid fa-skull-crossbones',n:'Muerte',r:'secret',e:13000,eg:['infernal'],c:'#cbd5e1'},{ic:'fa-solid fa-crown',n:'Senor Infierno',r:'og',e:32000,eg:['infernal'],c:'#ca8a04'},
{ic:'fa-solid fa-dove',n:'Paloma',r:'epic',e:380,eg:['divino'],c:'#e0e7ff'},{ic:'fa-solid fa-sun',n:'Serafin',r:'god',e:800,eg:['divino'],c:'#eab308'},{ic:'fa-solid fa-bolt',n:'Rayo Divino',r:'legendary',e:1800,eg:['divino'],c:'#fbbf24'},{ic:'fa-solid fa-star',n:'Estrella Divina',r:'mythic',e:6000,eg:['divino'],c:'#fde68a'},{ic:'fa-solid fa-shield-halved',n:'Arcangel',r:'secret',e:15000,eg:['divino'],c:'#bae6fd'},{ic:'fa-solid fa-sun',n:'Dios Sol',r:'og',e:45000,eg:['divino'],c:'#d97706'},
{ic:'fa-solid fa-landmark',n:'Guardian',r:'god',e:850,eg:['ancestral'],c:'#92400e'},{ic:'fa-solid fa-book',n:'Sabio',r:'legendary',e:2000,eg:['ancestral'],c:'#b45309'},{ic:'fa-solid fa-monument',n:'Esfinge',r:'mythic',e:6500,eg:['ancestral'],c:'#ca8a04'},{ic:'fa-solid fa-hourglass-half',n:'Tiempo',r:'mythic',e:8000,eg:['ancestral'],c:'#7c3aed'},{ic:'fa-solid fa-hat-wizard',n:'Oraculo Supremo',r:'secret',e:20000,eg:['ancestral'],c:'#9333ea'},{ic:'fa-solid fa-infinity',n:'Creador',r:'og',e:55000,eg:['ancestral'],c:'#d97706'},
{ic:'fa-solid fa-rocket',n:'OVNI',r:'epic',e:420,eg:['cosmico'],c:'#0891b2'},{ic:'fa-solid fa-star',n:'Estrella Fugaz',r:'god',e:900,eg:['cosmico'],c:'#eab308'},{ic:'fa-solid fa-globe',n:'Planeta',r:'legendary',e:2500,eg:['cosmico'],c:'#7c3aed'},{ic:'fa-solid fa-cloud',n:'Nebulosa',r:'mythic',e:10000,eg:['cosmico'],c:'#9333ea'},{ic:'fa-solid fa-bolt',n:'Zeus',r:'mythic',e:12000,eg:['cosmico'],c:'#eab308'},{ic:'fa-solid fa-virus',n:'Glitch',r:'secret',e:28000,eg:['cosmico'],c:'#06b6d4'},{ic:'fa-solid fa-crown',n:'EL REY OG',r:'og',e:70000,eg:['cosmico'],c:'#ca8a04'},
{ic:'fa-solid fa-explosion',n:'Supernova',r:'legendary',e:3000,eg:['estelar'],c:'#ea580c'},{ic:'fa-solid fa-circle',n:'Agujero Negro',r:'mythic',e:14000,eg:['estelar'],c:'#1e1b4b'},{ic:'fa-solid fa-meteor',n:'Cometa',r:'mythic',e:16000,eg:['estelar'],c:'#0284c7'},{ic:'fa-solid fa-satellite',n:'Pulsar',r:'secret',e:35000,eg:['estelar'],c:'#0891b2'},{ic:'fa-solid fa-explosion',n:'Big Bang',r:'og',e:90000,eg:['estelar'],c:'#db2777'},
{ic:'fa-solid fa-ghost',n:'Entidad',r:'mythic',e:15000,eg:['umbral'],c:'#4f46e5'},{ic:'fa-solid fa-eye',n:'Vigilante',r:'mythic',e:18000,eg:['umbral'],c:'#3730a3'},{ic:'fa-solid fa-moon',n:'Sombra',r:'secret',e:40000,eg:['umbral'],c:'#312e81'},{ic:'fa-solid fa-circle-nodes',n:'Abismo',r:'og',e:110000,eg:['umbral'],c:'#4338ca'},
{ic:'fa-solid fa-circle-xmark',n:'Nada Final',r:'secret',e:50000,eg:['absoluto'],c:'#1e1b4b'},{ic:'fa-solid fa-infinity',n:'Todo',r:'og',e:200000,eg:['absoluto'],c:'#c026d3'},
{ic:'fa-solid fa-paw',n:'Mono',r:'common',e:12,eg:['salvaje'],c:'#a16207'},
{ic:'fa-solid fa-worm',n:'Serpiente',r:'common',e:16,eg:['salvaje'],c:'#4d7c0f'},
{ic:'fa-solid fa-paw',n:'Jaguar',r:'rare',e:42,eg:['salvaje'],c:'#d97706'},
{ic:'fa-solid fa-paw',n:'Gorila',r:'rare',e:55,eg:['salvaje'],c:'#57534e'},
{ic:'fa-solid fa-paw',n:'Pantera',r:'epic',e:95,eg:['salvaje'],c:'#1f2937'},
{ic:'fa-solid fa-worm',n:'Anaconda',r:'epic',e:115,eg:['salvaje'],c:'#166534'},
{ic:'fa-solid fa-crown',n:'Rey Jungla',r:'god',e:230,eg:['salvaje'],c:'#65a30d'},
{ic:'fa-solid fa-tree',n:'Arbol Milenario',r:'legendary',e:600,eg:['salvaje'],c:'#3f6212'},
{ic:'fa-solid fa-frog',n:'Sapo Veneno',r:'rare',e:60,eg:['toxico'],c:'#84cc16'},
{ic:'fa-solid fa-bug',n:'Escarabajo',r:'rare',e:78,eg:['toxico'],c:'#a3e635'},
{ic:'fa-solid fa-spider',n:'Tarantula',r:'epic',e:150,eg:['toxico'],c:'#4c1d95'},
{ic:'fa-solid fa-leaf',n:'Planta Carnivora',r:'god',e:320,eg:['toxico'],c:'#dc2626'},
{ic:'fa-solid fa-radiation',n:'Esporas Vivas',r:'legendary',e:800,eg:['toxico'],c:'#22c55e'},
{ic:'fa-solid fa-skull',n:'Guardian Toxico',r:'mythic',e:2000,eg:['toxico'],c:'#166534'},
{ic:'fa-solid fa-vial-virus',n:'Virus Mutante',r:'secret',e:5000,eg:['toxico'],c:'#a3e635'},
{ic:'fa-solid fa-paw',n:'Jerbo',r:'common',e:30,eg:['dunas'],c:'#d4a574'},
{ic:'fa-solid fa-paw',n:'Camello',r:'common',e:40,eg:['dunas'],c:'#b45309'},
{ic:'fa-solid fa-paw',n:'Feneco',r:'rare',e:90,eg:['dunas'],c:'#fdba74'},
{ic:'fa-solid fa-feather-pointed',n:'Halcon',r:'rare',e:110,eg:['dunas'],c:'#92400e'},
{ic:'fa-solid fa-paw',n:'Chacal',r:'epic',e:200,eg:['dunas'],c:'#78716c'},
{ic:'fa-solid fa-worm',n:'Cobra',r:'epic',e:260,eg:['dunas'],c:'#166534'},
{ic:'fa-solid fa-wand-magic',n:'Djinn',r:'god',e:550,eg:['dunas'],c:'#0ea5e9'},
{ic:'fa-solid fa-fire-flame-curved',n:'Fenix Menor',r:'legendary',e:1100,eg:['dunas'],c:'#f97316'},
{ic:'fa-solid fa-cat',n:'Gato Egipcio',r:'rare',e:180,eg:['faraon'],c:'#eab308'},
{ic:'fa-solid fa-bug',n:'Escarabajo Dorado',r:'epic',e:380,eg:['faraon'],c:'#fbbf24'},
{ic:'fa-solid fa-worm',n:'Uraeus',r:'epic',e:450,eg:['faraon'],c:'#16a34a'},
{ic:'fa-solid fa-dog',n:'Anubis',r:'god',e:950,eg:['faraon'],c:'#78716c'},
{ic:'fa-solid fa-crown',n:'Esfinge Real',r:'legendary',e:2400,eg:['faraon'],c:'#d97706'},
{ic:'fa-solid fa-ankh',n:'Faraon',r:'mythic',e:6500,eg:['faraon'],c:'#eab308'},
{ic:'fa-solid fa-sun',n:'Ra',r:'secret',e:16000,eg:['faraon'],c:'#f59e0b'},
{ic:'fa-solid fa-paw',n:'Pinguino',r:'common',e:150,eg:['glacial'],c:'#334155'},
{ic:'fa-solid fa-paw',n:'Foca',r:'common',e:190,eg:['glacial'],c:'#94a3b8'},
{ic:'fa-solid fa-paw',n:'Zorro Nevada',r:'rare',e:420,eg:['glacial'],c:'#e2e8f0'},
{ic:'fa-solid fa-paw',n:'Lobo Nieve',r:'rare',e:520,eg:['glacial'],c:'#cbd5e1'},
{ic:'fa-solid fa-paw',n:'Oso Polar',r:'epic',e:1000,eg:['glacial'],c:'#f8fafc'},
{ic:'fa-solid fa-snowflake',n:'Yeti',r:'god',e:2400,eg:['glacial'],c:'#bae6fd'},
{ic:'fa-solid fa-wind',n:'Wendigo',r:'legendary',e:6000,eg:['glacial'],c:'#7dd3fc'},
{ic:'fa-solid fa-water',n:'Morsa',r:'rare',e:900,eg:['polar'],c:'#94a3b8'},
{ic:'fa-solid fa-fish-fins',n:'Narval',r:'epic',e:1800,eg:['polar'],c:'#38bdf8'},
{ic:'fa-solid fa-water',n:'Leviatan Glacial',r:'god',e:3800,eg:['polar'],c:'#0284c7'},
{ic:'fa-solid fa-snowflake',n:'Reina de Hielo',r:'legendary',e:9500,eg:['polar'],c:'#a5f3fc'},
{ic:'fa-solid fa-dragon',n:'Dragon Glacial',r:'mythic',e:24000,eg:['polar'],c:'#60a5fa'},
{ic:'fa-solid fa-temperature-low',n:'Cero Absoluto',r:'secret',e:60000,eg:['polar'],c:'#e0f2fe'},
{ic:'fa-solid fa-crow',n:'Murcielago',r:'common',e:400,eg:['tumba'],c:'#334155'},
{ic:'fa-solid fa-crow',n:'Cuervo',r:'common',e:480,eg:['tumba'],c:'#1f2937'},
{ic:'fa-solid fa-cat',n:'Gato Negro',r:'rare',e:900,eg:['tumba'],c:'#0f172a'},
{ic:'fa-solid fa-ghost',n:'Zombie',r:'rare',e:1200,eg:['tumba'],c:'#4d7c0f'},
{ic:'fa-solid fa-skull',n:'Esqueleto',r:'epic',e:2400,eg:['tumba'],c:'#e5e7eb'},
{ic:'fa-solid fa-ghost',n:'Vampiro',r:'god',e:5200,eg:['tumba'],c:'#7f1d1d'},
{ic:'fa-solid fa-book-skull',n:'Liche',r:'legendary',e:13000,eg:['tumba'],c:'#a78bfa'},
{ic:'fa-solid fa-crown',n:'Conde Nocturno',r:'mythic',e:28000,eg:['tumba'],c:'#4c1d95'},
{ic:'fa-solid fa-bandage',n:'Momia',r:'epic',e:3800,eg:['maldito'],c:'#d6d3d1'},
{ic:'fa-solid fa-bone',n:'Golem de Hueso',r:'god',e:8000,eg:['maldito'],c:'#a8a29e'},
{ic:'fa-solid fa-chess-knight',n:'Caballero Caido',r:'legendary',e:19000,eg:['maldito'],c:'#64748b'},
{ic:'fa-solid fa-skull',n:'Segador',r:'mythic',e:32000,eg:['maldito'],c:'#475569'},
{ic:'fa-solid fa-eye',n:'Sombra Antigua',r:'secret',e:45000,eg:['maldito'],c:'#312e81'},
{ic:'fa-solid fa-hourglass',n:'Parca',r:'og',e:90000,eg:['maldito'],c:'#a78bfa'},
{ic:'fa-solid fa-paw',n:'Oso Gominola',r:'common',e:900,eg:['goloso'],c:'#f472b6'},
{ic:'fa-solid fa-cat',n:'Gato Caramelo',r:'common',e:1100,eg:['goloso'],c:'#fb7185'},
{ic:'fa-solid fa-dog',n:'Perro Chicle',r:'rare',e:2400,eg:['goloso'],c:'#f9a8d4'},
{ic:'fa-solid fa-paw',n:'Conejo Masmallow',r:'rare',e:3000,eg:['goloso'],c:'#fbcfe8'},
{ic:'fa-solid fa-paw',n:'Foca Gelatina',r:'epic',e:5500,eg:['goloso'],c:'#fda4af'},
{ic:'fa-solid fa-star',n:'Arcoiris Dulce',r:'god',e:12000,eg:['goloso'],c:'#a5f3fc'},
{ic:'fa-solid fa-cake-candles',n:'Pastel Vivo',r:'legendary',e:30000,eg:['goloso'],c:'#f472b6'},
{ic:'fa-solid fa-bread-slice',n:'Croissant',r:'rare',e:5000,eg:['pastel'],c:'#d9a05b'},
{ic:'fa-solid fa-ice-cream',n:'Helado Vivo',r:'epic',e:9000,eg:['pastel'],c:'#fbcfe8'},
{ic:'fa-solid fa-cookie-bite',n:'Rey Donut',r:'god',e:18000,eg:['pastel'],c:'#b45309'},
{ic:'fa-solid fa-crown',n:'Emperador Pastel',r:'legendary',e:38000,eg:['pastel'],c:'#ec4899'},
{ic:'fa-solid fa-cookie',n:'Dulce Final',r:'mythic',e:55000,eg:['pastel'],c:'#f472b6'},
{ic:'fa-solid fa-star',n:'Azucar Pura',r:'secret',e:68000,eg:['pastel'],c:'#fde68a'},
{ic:'fa-solid fa-robot',n:'Robot',r:'rare',e:6000,eg:['neon'],c:'#94a3b8'},
{ic:'fa-solid fa-satellite',n:'Drone',r:'rare',e:7500,eg:['neon'],c:'#22d3ee'},
{ic:'fa-solid fa-gear',n:'Cyborg',r:'epic',e:12000,eg:['neon'],c:'#7dd3fc'},
{ic:'fa-solid fa-user-secret',n:'Hacker',r:'epic',e:15000,eg:['neon'],c:'#a78bfa'},
{ic:'fa-solid fa-motorcycle',n:'Moto Neón',r:'god',e:26000,eg:['neon'],c:'#e879f9'},
{ic:'fa-solid fa-brain',n:'IA Viva',r:'legendary',e:48000,eg:['neon'],c:'#f0abfc'},
{ic:'fa-solid fa-bolt',n:'Overclock',r:'mythic',e:75000,eg:['neon'],c:'#fbbf24'},
{ic:'fa-solid fa-code',n:'Codigo Perdido',r:'secret',e:90000,eg:['neon'],c:'#22d3ee'},
{ic:'fa-solid fa-cube',n:'Pixel',r:'epic',e:18000,eg:['virtual'],c:'#a3e635'},
{ic:'fa-solid fa-user-astronaut',n:'Avatar',r:'god',e:28000,eg:['virtual'],c:'#34d399'},
{ic:'fa-solid fa-virus',n:'Virus Digital',r:'legendary',e:48000,eg:['virtual'],c:'#22c55e'},
{ic:'fa-solid fa-shield-halved',n:'Firewall',r:'mythic',e:70000,eg:['virtual'],c:'#0d9488'},
{ic:'fa-solid fa-diagram-project',n:'Singularidad Datos',r:'secret',e:85000,eg:['virtual'],c:'#06b6d4'},
{ic:'fa-solid fa-database',n:'Mainframe',r:'og',e:95000,eg:['virtual'],c:'#0891b2'},
{ic:'fa-solid fa-dragon',n:'Dragon Bebe',r:'rare',e:22000,eg:['draconico'],c:'#4ade80'},
{ic:'fa-solid fa-dragon',n:'Wyvern',r:'epic',e:38000,eg:['draconico'],c:'#f97316'},
{ic:'fa-solid fa-dragon',n:'Dragon Jade',r:'god',e:60000,eg:['draconico'],c:'#16a34a'},
{ic:'fa-solid fa-dragon',n:'Dragon Sangre',r:'legendary',e:85000,eg:['draconico'],c:'#dc2626'},
{ic:'fa-solid fa-dragon',n:'Dragon Ancestral',r:'mythic',e:100000,eg:['draconico'],c:'#991b1b'},
{ic:'fa-solid fa-dragon',n:'Dragon Oculto',r:'secret',e:120000,eg:['draconico'],c:'#1e293b'},
{ic:'fa-solid fa-dragon',n:'Dracolich',r:'god',e:95000,eg:['wyrm'],c:'#334155'},
{ic:'fa-solid fa-dragon',n:'Dragon Estelar',r:'legendary',e:130000,eg:['wyrm'],c:'#a855f7'},
{ic:'fa-solid fa-crown',n:'Rey Dragon',r:'mythic',e:170000,eg:['wyrm'],c:'#ca8a04'},
{ic:'fa-solid fa-meteor',n:'Rompemundos',r:'secret',e:210000,eg:['wyrm'],c:'#ea580c'},
{ic:'fa-solid fa-dragon',n:'Alfa Dragon',r:'og',e:260000,eg:['wyrm'],c:'#facc15'},
{ic:'fa-solid fa-chess-rook',n:'Caballero Eterno',r:'god',e:220000,eg:['eterno'],c:'#fbbf24'},
{ic:'fa-solid fa-dove',n:'Angel Guardian',r:'legendary',e:300000,eg:['eterno'],c:'#fde68a'},
{ic:'fa-solid fa-sun',n:'Titan de Luz',r:'mythic',e:400000,eg:['eterno'],c:'#fde047'},
{ic:'fa-solid fa-bolt-lightning',n:'Espada Viva',r:'secret',e:520000,eg:['eterno'],c:'#fef3c7'},
{ic:'fa-solid fa-crown',n:'Centinela Eterno',r:'og',e:650000,eg:['eterno'],c:'#f59e0b'},
{ic:'fa-solid fa-infinity',n:'Omega',r:'mythic',e:750000,eg:['omega'],c:'#c026d3'},
{ic:'fa-solid fa-seedling',n:'Genesis',r:'secret',e:950000,eg:['omega'],c:'#34d399'},
{ic:'fa-solid fa-crown',n:'EL UNO',r:'og',e:1250000,eg:['omega'],c:'#fde047'}
];
var WEIGHTS={
basico:{common:65,rare:30,epic:4,god:1},dorado:{rare:12,epic:30,god:40,legendary:13,mythic:4,secret:.8,og:.2},
campestre:{common:30,rare:28,epic:22,god:14,legendary:4.5,mythic:1,secret:.4,og:.1},
salvaje:{common:50,rare:30,epic:14,god:5,legendary:1},
toxico:{rare:40,epic:32,god:18,legendary:7,mythic:2.5,secret:.5},
arcano:{epic:25,god:35,legendary:28,mythic:9,secret:2,og:1},
marino:{common:10,rare:20,epic:25,god:25,legendary:13,mythic:5,secret:1.5,og:.5},
abisal:{epic:10,god:18,legendary:30,mythic:28,secret:8,og:6},
dunas:{common:45,rare:32,epic:16,god:6,legendary:1},
faraon:{rare:30,epic:28,god:24,legendary:12,mythic:5,secret:1},
cristalino:{rare:8,epic:18,god:28,legendary:25,mythic:14,secret:4,og:3},
gema:{god:10,legendary:25,mythic:35,secret:18,og:12},
glacial:{common:40,rare:30,epic:20,god:8,legendary:2},
polar:{rare:26,epic:26,god:24,legendary:14,mythic:8,secret:2},
magmatico:{rare:5,epic:14,god:22,legendary:25,mythic:18,secret:9,og:7},
infernal:{epic:8,god:14,legendary:22,mythic:28,secret:14,og:14},
tumba:{common:28,rare:28,epic:22,god:14,legendary:6,mythic:2},
maldito:{epic:22,god:22,legendary:20,mythic:17,secret:10,og:9},
divino:{epic:6,god:12,legendary:20,mythic:28,secret:18,og:16},
ancestral:{god:8,legendary:18,mythic:30,secret:22,og:22},
goloso:{common:35,rare:30,epic:20,god:12,legendary:3},
pastel:{rare:28,epic:26,god:24,legendary:15,mythic:5.5,secret:1.5},
neon:{rare:32,epic:26,god:20,legendary:14,mythic:7,secret:1},
virtual:{epic:20,god:22,legendary:20,mythic:15,secret:12,og:11},
cosmico:{epic:4,god:8,legendary:15,mythic:28,secret:22,og:23},
estelar:{legendary:8,mythic:28,secret:28,og:36},
draconico:{rare:18,epic:24,god:22,legendary:19,mythic:13,secret:4},
wyrm:{god:16,legendary:20,mythic:24,secret:20,og:20},
umbral:{mythic:28,secret:30,og:42},
absoluto:{secret:35,og:65},
eterno:{god:14,legendary:20,mythic:26,secret:24,og:16},
omega:{mythic:25,secret:35,og:40}
};
var RCOL={common:'#9ca3af',rare:'#38bdf8',epic:'#c084fc',god:'#fbbf24',legendary:'#f87171',mythic:'#f472b6',secret:'#22d3ee',og:'#fbbf24'};
var RNAME={common:'Comun',rare:'Raro',epic:'Epico',god:'Dios',legendary:'Legendario',mythic:'Mitico',secret:'Secreto',og:'OG'};
var RORD={common:1,rare:2,epic:3,god:4,legendary:5,mythic:6,secret:7,og:8};
var RKEYS=['common','rare','epic','god','legendary','mythic','secret','og'];
var ESCLS={basico:'es-bas',dorado:'es-dor',campestre:'es-cam',arcano:'es-arc',marino:'es-mar',abisal:'es-abi',cristalino:'es-cri',gema:'es-gem',magmatico:'es-mag',infernal:'es-inf',divino:'es-div',ancestral:'es-anc',cosmico:'es-cos',estelar:'es-est',umbral:'es-umb',absoluto:'es-abs',salvaje:'es-sal',toxico:'es-tox',dunas:'es-dun',faraon:'es-far',glacial:'es-gla',polar:'es-pol',tumba:'es-tum',maldito:'es-mal',goloso:'es-gol',pastel:'es-pas',neon:'es-neo',virtual:'es-vir',draconico:'es-dra',wyrm:'es-wyr',eterno:'es-ete',omega:'es-ome'};
var ENAMES={basico:'Basico',dorado:'Dorado',campestre:'Campestre',arcano:'Arcano',marino:'Marino',abisal:'Abisal',cristalino:'Cristalino',gema:'Gema',magmatico:'Magmatico',infernal:'Infernal',divino:'Divino',ancestral:'Ancestral',cosmico:'Cosmico',estelar:'Estelar',umbral:'Umbral',absoluto:'Absoluto',salvaje:'Salvaje',toxico:'Toxico',dunas:'Dunas',faraon:'Faraon',glacial:'Glacial',polar:'Polar',tumba:'Tumba',maldito:'Maldito',goloso:'Goloso',pastel:'Pastel',neon:'Neon',virtual:'Virtual',draconico:'Draconico',wyrm:'Wyrm',eterno:'Eterno',omega:'Omega'};
var E3DG={basico:'linear-gradient(145deg,#f8fafc,#cbd5e1,#94a3b8)',dorado:'linear-gradient(145deg,#fef3c7,#f59e0b,#d97706)',campestre:'linear-gradient(145deg,#065f46,#10b981,#84cc16)',arcano:'linear-gradient(145deg,#4c1d95,#8b5cf6,#c084fc)',marino:'linear-gradient(145deg,#0c4a6e,#0ea5e9,#22d3ee)',abisal:'linear-gradient(145deg,#0f172a,#1e3a5f,#0ea5e9)',cristalino:'linear-gradient(145deg,#ec4899,#f0abfc,#e879f9)',gema:'linear-gradient(145deg,#f43f5e,#a855f7,#3b82f6)',magmatico:'linear-gradient(145deg,#7c2d12,#ea580c,#facc15)',infernal:'linear-gradient(145deg,#7f1d1d,#dc2626,#f97316)',divino:'linear-gradient(145deg,#fef9c3,#fde68a,#fff)',ancestral:'linear-gradient(145deg,#92400e,#d97706,#fbbf24)',cosmico:'linear-gradient(145deg,#1e1b4b,#7c3aed,#06b6d4)',estelar:'linear-gradient(145deg,#1e1b4b,#7c3aed,#ec4899)',umbral:'linear-gradient(145deg,#0f0f23,#312e81,#000)',absoluto:'conic-gradient(from 0deg,#f43f5e,#a855f7,#3b82f6,#10b981,#fbbf24,#f43f5e)',salvaje:'linear-gradient(145deg,#14532d,#16a34a,#84cc16)',toxico:'linear-gradient(145deg,#365314,#65a30d,#a3e635)',dunas:'linear-gradient(145deg,#92400e,#fbbf24,#fde68a)',faraon:'linear-gradient(145deg,#78350f,#f59e0b,#fbbf24)',glacial:'linear-gradient(145deg,#0c4a6e,#38bdf8,#e0f2fe)',polar:'linear-gradient(145deg,#082f49,#0ea5e9,#a5f3fc)',tumba:'linear-gradient(145deg,#1c1917,#525252,#a8a29e)',maldito:'linear-gradient(145deg,#2e1065,#7c3aed,#a78bfa)',goloso:'linear-gradient(145deg,#be185d,#f472b6,#fbcfe8)',pastel:'linear-gradient(145deg,#9d174d,#ec4899,#f9a8d4)',neon:'linear-gradient(145deg,#0f172a,#e879f9,#22d3ee)',virtual:'linear-gradient(145deg,#052e16,#22c55e,#a3e635)',draconico:'linear-gradient(145deg,#450a0a,#dc2626,#f97316)',wyrm:'linear-gradient(145deg,#1c1917,#7c2d12,#facc15)',eterno:'linear-gradient(145deg,#fef9c3,#fffbeb,#fbbf24)',omega:'conic-gradient(from 0deg,#fbbf24,#f472b6,#22d3ee,#a3e635,#e879f9,#fbbf24)'};
var CLICKS=5;

function defPr(){return{basico:10,dorado:500,campestre:2000,arcano:20000,salvaje:8000,toxico:6e4,marino:5e4,abisal:4e5,dunas:3e5,faraon:2e6,cristalino:2e6,gema:15e6,glacial:3e7,polar:1.2e8,magmatico:8e6,infernal:5e8,tumba:1e9,maldito:5e9,divino:5e9,ancestral:3e10,goloso:3e10,pastel:1.5e11,neon:1.2e11,virtual:8e11,cosmico:3e11,estelar:2e12,umbral:2e13,absoluto:2e14,draconico:3e12,wyrm:1.6e13,eterno:4e14,omega:2e15}}

// ===== ESTADO =====
var G={money:10,dm:10,rb:0,mult:1,pets:[],disc:[],pr:defPr(),uw:['bosque'],tot:0,te:0,mut:false,nid:1,pn:'Mi Base',ao:false,aon:false,world:'bosque',x3:false,upg:{luck:0,inc:0,disc:0,fast:0,auto:0},achs:[],lastDaily:0,dailyStreak:0,lastSeen:Date.now(),boostUntil:0,combo:0,comboBest:0,quests:[],redeemed:{},playtime:0,feverUntil:0,webMult:1};
var selE='basico',rbC=false,rbT=null,aTab='game',cfCb=null,hSt={pet:null,cl:0,rev:false,bur:false,egg:null,multi:1,paid:0};
var boostActive=false,boostTimeout=null;
var eventMult=1,luckyBoost=false,eggSale=false,evtCur=null,evtEnd=0,evtT=null,multiList=null;
var IS_ADM=false,IS_SUPER=false,ME=null;

// ===== UTILIDADES =====
function el(id){return document.getElementById(id)}
function fmt(n){
    if(isNaN(n)||!isFinite(n))return'0';
    n=Number(n);
    if(n<0)return'-'+fmt(-n);
    var sx=['','K','M','B','T','Qd','Qn','Sx','Sp','Oc','No','Dc','UDd','DDd','TDd','QaD','QiD'];
    var tier=Math.floor(Math.log10(Math.max(1,n))/3);
    if(tier<=0)return Math.floor(n).toLocaleString();
    if(tier>=sx.length)tier=sx.length-1;
    var suf=sx[tier];
    var scale=Math.pow(10,tier*3);
    var scaled=n/scale;
    if(scaled>=1000&&tier<sx.length-1){tier++;suf=sx[tier];scale=Math.pow(10,tier*3);scaled=n/scale}
    return scaled.toFixed(scaled<10?2:scaled<100?1:0)+suf;
}
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
function fmtT(ms){var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?h+'h '+m+'m':m?m+'m '+(s%60)+'s':s+'s'}
function toNum(s){s=(''+(s==null?'':s)).trim().toLowerCase();var m=s.match(/^(-?[\d.]+)\s*([kmbtq])(?![a-z])/);
 if(m){var f={k:1e3,m:1e6,b:1e9,t:1e12,q:1e15}[m[2]];return(parseFloat(m[1])||0)*f}
 var n=parseFloat(s);return isNaN(n)?0:n}
function ensureEl(id,cls,html,parent){var e=el(id);if(!e){e=document.createElement('div');e.id=id;if(cls)e.className=cls;e.innerHTML=html||'';(parent||document.body).appendChild(e)}return e}
function toast(m,t){var c=ensureEl('toasts');var e=document.createElement('div');e.className='toast t-'+(t||'inf');e.textContent=m;c.appendChild(e);setTimeout(function(){e.remove()},3200)}
function floatM(a){var g=el('game')||document.body;var e=document.createElement('div');e.className='fm';e.textContent='+$'+fmt(a);e.style.left=(Math.random()*130+90)+'px';e.style.top='170px';g.appendChild(e);setTimeout(function(){e.remove()},1200)}
function showCf(i,t,m,cb){ensureConfirm();el('confirmIcon').textContent=i;el('confirmTitle').textContent=t;el('confirmMsg').textContent=m;cfCb=cb;el('confirmBox').classList.add('show')}
function hideCf(){var b=el('confirmBox');if(b)b.classList.remove('show');cfCb=null}
function ensureConfirm(){if(el('confirmBox'))return;
 var d=document.createElement('div');d.id='confirmBox';d.className='modal';
 d.innerHTML='<div class="mbox"><div id="confirmIcon" style="font-size:40px"></div><h3 id="confirmTitle" style="margin:8px 0 4px"></h3><p id="confirmMsg" style="color:#9fb3c8;font-size:13px;line-height:1.5"></p><div style="display:flex;gap:8px;margin-top:14px;justify-content:center"><button class="btn" id="cfNo">Cancelar</button><button class="btn gold" id="cfYes">Confirmar</button></div></div>';
 document.body.appendChild(d);
 el('cfYes').onclick=function(){var cb=cfCb;hideCf();if(cb)cb()};
 el('cfNo').onclick=hideCf}
function gW(){for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===G.world)return WORLDS[i];return WORLDS[0]}
function isUW(w){return G.uw.indexOf(w)!==-1}
function eggCost(e){return Math.floor(G.pr[e]*(1-(G.upg?G.upg.disc:0)*.04-(eggSale?.5:0)))}
function rollVariant(){var r=Math.random();if(r<.002)return 2;if(r<.012)return 1;return 0}
function pE(p){return(p.be||1)*(1+.2*((p.lv||1)-1))*(p.v===2?3:p.v===1?1.6:1)*(G.mult||1)*(gW().bonus||1)*(boostActive?2:1)*(1+(G.upg?G.upg.inc:0)*.1)}
function tI(){var s=0;for(var i=0;i<G.pets.length;i++)s+=pE(G.pets[i]);
 var f=(G.webMult||1);if(Date.now()<(G.feverUntil||0))f*=2;if(IS_ADM)f*=1.25;
 return s*eventMult*f}
function rbCo(){return Math.floor(5e5*Math.pow(2,G.rb))}
function uCo(p){return Math.floor((p.be||1)*25*(p.lv||1))}
function sellVal(p){return Math.floor((p.be||1)*8*(p.v===2?3:p.v===1?1.6:1)*(1+G.rb*.1))}
function sphH(p,sz){var c=sz==='xs'?'sph-xs':'sph-sm',v=p.v===2?' rbw':p.v===1?' gld':'';return'<div class="sph '+p.r+' '+c+v+'"><div class="sph-base" style="background-color:'+p.c+'"></div><div class="sph-light"></div><div class="sph-icon"><i class="'+p.ic+'"></i></div><div class="sph-shadow"></div></div>'}
function needTaps(){return Math.max(2,CLICKS-(G.upg.fast||0))}
function effMulti(){return G.x3?3:1}

// ===== SONIDO =====
var snd={cx:null,go:function(){try{if(!this.cx)this.cx=new(window.AudioContext||window.webkitAudioContext)();if(this.cx.state==='suspended')this.cx.resume()}catch(e){}},t:function(f,d,tp,v){if(!this.cx||G.mut)return;try{var o=this.cx.createOscillator(),g=this.cx.createGain();o.type=tp||'sine';o.frequency.setValueAtTime(f,this.cx.currentTime);g.gain.setValueAtTime(v||.08,this.cx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.cx.currentTime+d);o.connect(g);g.connect(this.cx.destination);o.start();o.stop(this.cx.currentTime+d)}catch(e){}},hatch:function(r){this.go();var x=RKEYS.indexOf(r),s=this;if(x<=1){this.t(523,.12);setTimeout(function(){s.t(659,.15)},80)}else if(x<=3){this.t(659,.1);setTimeout(function(){s.t(784,.1)},70);setTimeout(function(){s.t(988,.15)},140)}else{[523,659,784,988,1047,1175,1319].forEach(function(f,i){setTimeout(function(){s.t(f,.2,'triangle',.06)},i*50)})}},crack:function(n,mx){this.go();this.t(300+(n/mx)*800,.06,'square',.05)},burst:function(){this.go();var s=this;[800,1000,1200].forEach(function(f,i){setTimeout(function(){s.t(f,.15,'triangle',.07)},i*40)})},click:function(){this.go();this.t(800,.04,'square',.03)},err:function(){this.go();this.t(200,.15,'sawtooth',.04)},world:function(){this.go();var s=this;[440,554,659,880].forEach(function(f,i){setTimeout(function(){s.t(f,.15,'triangle',.06)},i*80)})}};

// ===== ROLL (CON SUERTE) =====
function roll(egg){
  var luck=1+(G.upg?G.upg.luck:0)*.06+(luckyBoost?1:0);
  var w=WEIGHTS[egg];if(!w)return PETS[0];
  var ks=Object.keys(w),aw={},t=0;
  for(var i=0;i<ks.length;i++){aw[ks[i]]=w[ks[i]]*Math.pow(luck,(RORD[ks[i]]-1)/7);t+=aw[ks[i]]}
  var r=Math.random()*t,ch=ks[0];
  for(var i=0;i<ks.length;i++){r-=aw[ks[i]];if(r<=0){ch=ks[i];break}}
  var pool=[];
  for(var i=0;i<PETS.length;i++){if(PETS[i].r===ch&&PETS[i].eg.indexOf(egg)!==-1)pool.push(PETS[i])}
  if(!pool.length)return PETS[0];
  return pool[Math.floor(Math.random()*pool.length)]
}

// ===== GRIETAS =====
var crCx=null,crD=[],CW=220,CH=280;
function initCC(){var c=el('crackCanvas');if(!c)return;c.width=CW;c.height=CH;crCx=c.getContext('2d');crD=[];crCx.clearRect(0,0,CW,CH)}
function gCr(pr){var sx=.15+Math.random()*.7,sy=.1+Math.random()*.8,a=Math.random()*Math.PI*2,sg=[],br=[],cx=sx,cy=sy;var ns=3+Math.floor(Math.random()*(2+pr*4)),sl=.04+pr*.1;for(var j=0;j<ns;j++){a+=(Math.random()-.5)*1.6;cx+=Math.cos(a)*sl;cy+=Math.sin(a)*sl;cx=Math.max(.03,Math.min(.97,cx));cy=Math.max(.03,Math.min(.97,cy));sg.push({x:cx,y:cy});if(Math.random()<.3+pr*.5){var ba=a+(Math.random()>.5?1:-1)*(.5+Math.random()*.9),bl=sl*(.25+Math.random()*.5)*(.5+pr*.5);br.push({fx:cx,fy:cy,tx:Math.max(.03,Math.min(.97,cx+Math.cos(ba)*bl)),ty:Math.max(.03,Math.min(.97,cy+Math.sin(ba)*bl))})}}return{sx:sx,sy:sy,segs:sg,branches:br,thick:pr>.4}}
function addCr(pr){if(!crCx)return;for(var i=0;i<Math.floor(3+pr*8);i++)crD.push(gCr(pr));drCr()}
function drCr(){if(!crCx)return;var w=CW,h=CH;crCx.clearRect(0,0,w,h);for(var i=0;i<crD.length;i++){var c=crD[i],tk=c.thick;crCx.save();crCx.strokeStyle=tk?'rgba(255,240,180,0.95)':'rgba(255,255,255,0.88)';crCx.lineWidth=tk?3:1.8;crCx.shadowBlur=tk?16:8;crCx.shadowColor=tk?'rgba(255,200,80,0.95)':'rgba(255,255,200,0.75)';crCx.lineCap='round';crCx.lineJoin='round';crCx.beginPath();crCx.moveTo(c.sx*w,c.sy*h);for(var j=0;j<c.segs.length;j++)crCx.lineTo(c.segs[j].x*w,c.segs[j].y*h);crCx.stroke();for(var j=0;j<c.branches.length;j++){var b=c.branches[j];crCx.beginPath();crCx.moveTo(b.fx*w,b.fy*h);crCx.lineTo(b.tx*w,b.ty*h);crCx.lineWidth=tk?2:1.2;crCx.stroke()}crCx.restore()}}
function drFull(){if(!crCx)return;var w=CW,h=CH;crCx.save();for(var i=0;i<50;i++){var x1=Math.random()*w,y1=Math.random()*h,a=Math.random()*Math.PI*2,cx2=x1,cy2=y1,ln=25+Math.random()*70;crCx.beginPath();crCx.moveTo(x1,y1);for(var s=0;s<2+Math.floor(Math.random()*3);s++){a+=(Math.random()-.5)*1.4;cx2+=Math.cos(a)*ln/3;cy2+=Math.sin(a)*ln/3;crCx.lineTo(cx2,cy2)}crCx.strokeStyle='rgba(255,240,180,0.92)';crCx.lineWidth=1.5+Math.random()*2.5;crCx.shadowBlur=18;crCx.shadowColor='rgba(255,200,50,1)';crCx.lineCap='round';crCx.stroke()}crCx.fillStyle='rgba(255,255,200,0.15)';crCx.fillRect(0,0,w,h);crCx.restore()}

// ===== FONDO =====
var bgCx,bgW,bgH,bgP=[];
function initBg(){var c=el('bgCanvas');if(!c){c=document.createElement('canvas');c.id='bgCanvas';c.style.cssText='position:fixed;inset:0;z-index:0;pointer-events:none';document.body.insertBefore(c,document.body.firstChild)}
 bgCx=c.getContext('2d');function rs(){c.width=innerWidth;c.height=innerHeight;bgW=c.width;bgH=c.height}rs();addEventListener('resize',rs);for(var i=0;i<60;i++)bgP.push(mkBP());requestAnimationFrame(drBg)}
function mkBP(){var w=gW();return{x:Math.random()*bgW,y:Math.random()*bgH,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.3-.1,sz:Math.random()*3+1,a:Math.random()*.4+.1,col:w.color,l:Math.random()*200+100,ml:300,tp:w.particles}}
function drBg(){if(!bgCx)return;var w=gW();bgCx.clearRect(0,0,bgW,bgH);var g=bgCx.createRadialGradient(bgW/2,bgH/2,0,bgW/2,bgH/2,bgW*.7);g.addColorStop(0,w.color+'18');g.addColorStop(.5,'#060e1a');g.addColorStop(1,'#030810');bgCx.fillStyle=g;bgCx.fillRect(0,0,bgW,bgH);for(var i=0;i<bgP.length;i++){var p=bgP[i];p.x+=p.vx;p.y+=p.vy;p.l--;if(p.l<=0||p.x<-10||p.x>bgW+10||p.y<-10||p.y>bgH+10){bgP[i]=mkBP();bgP[i].y=bgH+5;bgP[i].l=bgP[i].ml;continue}var al=p.a*(p.l/p.ml);bgCx.globalAlpha=al;bgCx.fillStyle=p.col;bgCx.beginPath();if(p.tp==='bubbles'){bgCx.strokeStyle=p.col;bgCx.lineWidth=.5;bgCx.arc(p.x,p.y,p.sz*1.5,0,Math.PI*2);bgCx.stroke()}else if(p.tp==='embers'){bgCx.arc(p.x,p.y,p.sz,0,Math.PI*2);bgCx.fill();bgCx.globalAlpha=al*.3;bgCx.beginPath();bgCx.arc(p.x,p.y,p.sz*3,0,Math.PI*2);bgCx.fill()}else if(p.tp==='stars'){bgCx.globalAlpha=al*(Math.sin(p.l*.1)*.3+.7);bgCx.fillStyle='#fff';bgCx.beginPath();bgCx.arc(p.x,p.y,p.sz*.7,0,Math.PI*2);bgCx.fill()}else if(p.tp==='wisps'){bgCx.arc(p.x+Math.sin(p.l*.08)*8,p.y,p.sz*1.5,0,Math.PI*2);bgCx.fill()}else{bgCx.ellipse(p.x,p.y,p.sz*2,p.sz,Math.sin(p.l*.05)*.5,0,Math.PI*2);bgCx.fill()}}bgCx.globalAlpha=1;requestAnimationFrame(drBg)}

// ===== HABITAT 3D =====
var hR,hS,hC,hM=[],hGnd=null;
function initH3D(){
    var ct=el('habitat');if(!ct)return;var w=ct.clientWidth||300,h=ct.clientHeight||240;
    try{hR=new THREE.WebGLRenderer({alpha:true,antialias:true})}catch(e){return}
    hR.setSize(w,h);hR.setPixelRatio(Math.min(devicePixelRatio,2));hR.setClearColor(0,0);ct.insertBefore(hR.domElement,ct.firstChild);
    hS=new THREE.Scene();hC=new THREE.PerspectiveCamera(40,w/h,.1,100);hC.position.set(0,1.8,5.5);hC.lookAt(0,0,0);
    hS.add(new THREE.AmbientLight(0xffffff,.7));var dl=new THREE.DirectionalLight(0xffffff,1.2);dl.position.set(3,5,4);hS.add(dl);hS.add(new THREE.HemisphereLight(0x88ffaa,0x224466,.3));
    var gg=new THREE.CircleGeometry(3.5,48);var gm=new THREE.MeshStandardMaterial({color:0x1a3a20,roughness:.85});var gnd=new THREE.Mesh(gg,gm);gnd.rotation.x=-Math.PI/2;gnd.position.y=-.5;hS.add(gnd);hGnd=gnd;
    anH();
}
function refHP(){
    if(!hS)return;
    hM.forEach(function(m){hS.remove(m);if(m.geometry)m.geometry.dispose();if(m.material)m.material.dispose()});hM=[];
    var s=G.pets.slice().sort(function(a,b){return pE(b)-pE(a)}).slice(0,8);
    s.forEach(function(p,i){
        var col=new THREE.Color(p.c);var rd=RORD[p.r]>=7?.42:RORD[p.r]>=5?.35:.28;rd=Math.max(.1,rd);
        var geo=new THREE.SphereGeometry(rd,32,32);
        var mat=new THREE.MeshPhysicalMaterial({color:col,metalness:RORD[p.r]>=5?.25:.08,roughness:RORD[p.r]>=5?.08:.18,clearcoat:1,clearcoatRoughness:.04,emissive:col,emissiveIntensity:RORD[p.r]>=5?.12:.03});
        var mesh=new THREE.Mesh(geo,mat);
        var an=(i/Math.max(s.length,1))*Math.PI*2;var d=s.length<=1?0:1+((i%2)*.4);
        mesh.position.set(Math.cos(an)*d,0,Math.sin(an)*d);
        mesh.userData={by:0,bo:Math.random()*6.28,bs:1+Math.random()*.5};
        hS.add(mesh);hM.push(mesh);
    });
}
function anH(){requestAnimationFrame(anH);if(!hR)return;var t=performance.now()*.001;hM.forEach(function(m){m.position.y=m.userData.by+Math.sin(t*m.userData.bs+m.userData.bo)*.12;m.rotation.y=t*.5});hC.position.x=Math.sin(t*.15)*.3;hC.lookAt(0,0,0);hR.render(hS,hC)}
function rsH(){if(!hR)return;var ct=el('habitat');if(!ct)return;var w=ct.clientWidth,h=ct.clientHeight;if(w<10||h<10)return;hR.setSize(w,h);hC.aspect=w/h;hC.updateProjectionMatrix()}

// ===== REVELAR 3D =====
var vR,vS,vC,vM=null,vA=false;
function initR3D(){
    var ct=el('revSphere3d');if(!ct)return;
    try{vR=new THREE.WebGLRenderer({alpha:true,antialias:true})}catch(e){return}
    vR.setSize(120,120);vR.setPixelRatio(Math.min(devicePixelRatio,2));vR.setClearColor(0,0);ct.appendChild(vR.domElement);
    vS=new THREE.Scene();vC=new THREE.PerspectiveCamera(40,1,.1,100);vC.position.set(0,0,3.5);
    vS.add(new THREE.AmbientLight(0xffffff,.6));var dl=new THREE.DirectionalLight(0xffffff,1.5);dl.position.set(2,3,4);vS.add(dl);vS.add(new THREE.PointLight(0xffffff,.5,10));
}
function showR3D(p){
    if(!vS)return;
    if(vM){vS.remove(vM);vM.geometry.dispose();vM.material.dispose();vM=null}
    var col=new THREE.Color(p.c);var geo=new THREE.SphereGeometry(1,48,48);
    var mat=new THREE.MeshPhysicalMaterial({color:col,metalness:RORD[p.r]>=5?.35:.1,roughness:RORD[p.r]>=5?.05:.15,clearcoat:1,clearcoatRoughness:.02,emissive:col,emissiveIntensity:RORD[p.r]>=5?.2:.05});
    vM=new THREE.Mesh(geo,mat);vM.userData.v=p.v||0;vS.add(vM);vA=true;anR();
}
function stopR(){vA=false}
function anR(){if(!vA)return;requestAnimationFrame(anR);var t=performance.now()*.001;
 if(vM){vM.rotation.y=t*.8;vM.rotation.x=Math.sin(t*.5)*.15;
  if(vM.userData.v===2){var c=new THREE.Color();c.setHSL((t*.15)%1,.85,.6);vM.material.color.copy(c);vM.material.emissive.copy(c)}
  else if(vM.userData.v===1){vM.material.emissiveIntensity=.25+Math.sin(t*4)*.15}}
 if(vR&&vS&&vC)vR.render(vS,vC)}

// ===== PARTICULAS / CONFETTI =====
var hCx,hP=[];
function spHP(rar){var c=el('hatchCanvas');if(!c)return;var r=c.parentElement.getBoundingClientRect();c.width=r.width*2;c.height=r.height*2;hCx=c.getContext('2d');hCx.scale(2,2);var w=r.width,h=r.height,col=RCOL[rar]||'#fff';var hi=RORD[rar]>=5;var ct=hi?140:40;var cols=hi?['#fbbf24','#f472b6','#22d3ee','#a78bfa','#34d399',col]:[col];hP=[];for(var i=0;i<ct;i++){var an=Math.random()*Math.PI*2,sp=Math.random()*9+2;hP.push({x:w/2,y:h/2,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-2,sz:Math.random()*(hi?7:5)+1,col:cols[Math.floor(Math.random()*cols.length)],l:Math.random()*50+30,ml:80,g:.08,rot:Math.random()*6,vr:(Math.random()-.5)*.3,shape:hi&&Math.random()<.5?'rect':'dot'})}anHP(w,h)}
function anHP(w,h){if(!hCx||!hP.length)return;hCx.clearRect(0,0,w,h);var al=false;for(var i=0;i<hP.length;i++){var p=hP[i];if(p.l<=0)continue;al=true;p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.l--;p.vx*=.98;p.rot+=p.vr;var a=p.l/p.ml;hCx.globalAlpha=a;hCx.fillStyle=p.col;if(p.shape==='rect'){hCx.save();hCx.translate(p.x,p.y);hCx.rotate(p.rot);hCx.fillRect(-p.sz/2,-p.sz*.3,p.sz,p.sz*.6);hCx.restore()}else{hCx.beginPath();hCx.arc(p.x,p.y,Math.max(.5,p.sz*a),0,Math.PI*2);hCx.fill()}}hCx.globalAlpha=1;if(al)requestAnimationFrame(function(){anHP(w,h)})}

// ===== TEMA =====
function apTh(){var w=gW(),r=document.documentElement;r.style.setProperty('--wa',w.color);r.style.setProperty('--wa2',w.color2);r.style.setProperty('--wabg',w.color+'18');r.style.setProperty('--wbd',w.color+'30');r.style.setProperty('--wsh',w.color+'40');r.style.setProperty('--wg',w.color+'20');var wb=el('worldBadge');if(wb){wb.textContent=w.name.split(' ')[0].toUpperCase();wb.style.color=w.color}var hl=el('habLabel');if(hl)hl.textContent='Habitat - '+w.name;var sw=el('sWB');if(sw)sw.textContent='x'+w.bonus.toFixed(1);if(hGnd){try{hGnd.material.color.set(w.color);hGnd.material.color.multiplyScalar(.35)}catch(e){}}}

// ===== SAVE/LOAD =====
var SK='PetSimUltra_v38';
function save(){try{localStorage.setItem(SK,JSON.stringify({money:G.money,rb:G.rb,mult:G.mult,pets:G.pets,disc:G.disc,pr:G.pr,uw:G.uw,tot:G.tot,te:G.te,mut:G.mut,nid:G.nid,pn:G.pn,ao:G.ao,aon:G.aon,world:G.world,x3:G.x3,upg:G.upg,achs:G.achs,lastDaily:G.lastDaily,dailyStreak:G.dailyStreak,lastSeen:Date.now(),boostUntil:G.boostUntil,comboBest:G.comboBest,quests:G.quests,redeemed:G.redeemed,playtime:G.playtime,feverUntil:G.feverUntil}))}catch(e){}}
function load(){var raw=null;try{raw=localStorage.getItem(SK)}catch(e){return}if(!raw)return;try{var d=JSON.parse(raw);if(!d)return;
G.money=d.money||10;G.dm=G.money;G.rb=d.rb||0;G.mult=d.mult||1;G.mut=!!d.mut;G.tot=d.tot||0;G.te=d.te||0;G.nid=d.nid||1;G.pn=d.pn||'Mi Base';G.ao=!!d.ao;G.aon=!!d.aon;G.world=d.world||'bosque';G.x3=!!d.x3;G.uw=d.uw||['bosque'];if(d.pr)for(var pk in d.pr)G.pr[pk]=d.pr[pk];G.disc=d.disc||[];
G.upg=d.upg||{luck:0,inc:0,disc:0,fast:0,auto:0};G.achs=d.achs||[];G.lastDaily=d.lastDaily||0;G.dailyStreak=d.dailyStreak||0;G.lastSeen=d.lastSeen||Date.now();G.boostUntil=d.boostUntil||0;
G.comboBest=d.comboBest||0;G.quests=d.quests||[];G.redeemed=d.redeemed||{};G.playtime=d.playtime||0;G.feverUntil=d.feverUntil||0;
G.pets=[];
if(d.pets){for(var i=0;i<d.pets.length;i++){var p=d.pets[i];if(!p)continue;G.pets.push({ic:p.ic||'fa-solid fa-paw',n:p.n,r:p.r,be:p.be||p.e||1,lv:p.lv||1,id:p.id||G.nid++,c:p.c||'#888',eg:p.eg||[],v:p.v||0})}}}catch(e){}}
function resetG(){try{localStorage.removeItem(SK)}catch(e){}
G={money:10,dm:10,rb:0,mult:1,pets:[],disc:[],pr:defPr(),uw:['bosque'],tot:0,te:0,mut:false,nid:1,pn:'Mi Base',ao:false,aon:false,world:'bosque',x3:false,upg:{luck:0,inc:0,disc:0,fast:0,auto:0},achs:[],lastDaily:0,dailyStreak:0,lastSeen:Date.now(),boostUntil:0,combo:0,comboBest:0,quests:[],redeemed:{},playtime:0,feverUntil:0,webMult:G.webMult||1};
selE='basico';rbC=false;CLICKS=5;multiList=null;eventMult=1;luckyBoost=false;eggSale=false;if(boostTimeout)clearTimeout(boostTimeout);boostActive=false;if(evtCur)endEvent();
clearGoldEgg();apTh();refHP();updateUI();renderTab(aTab);toast('Reiniciado','inf')}

// ===== RANKING =====
var NM=['xXDarkWolfXx','PetMaster99','DragonSlayer','ProGamer2k','NeonBlade','ShadowHunter','CrystalQueen','FireLord77','IcePhoenix','StormBreaker','LunaStar','CosmicDust','ThunderBolt','SilverFang','GoldenEagle','NightHawk','StarDust42','ViperStrike','MysticMage','BlazeKing','ArcticFox','CrimsonTide','DiamondHand','EmeraldWind','RubyHeart','SapphireEye','IronFist01','SteelNerve','BronzeShield','PlatinumAce','GhostRider','PhantomX','Spectre007','WraithLord','ElTigre','LaFiera','ElDragon','LaBestia','SpeedDemon','TurboBoost','NitroFlame','RapidFire','QuickSilver','MegaBoss','UltraKing','SuperNova','HyperDrive','GigaChad','TinyTitan','MiniMight','AlphaWolf','OmegaForce','GammaRay','DeltaStrike','VolcanicAsh','GlacierIce','TornadoX','Earthquake9','Tsunami7','Wildfire3','Avalanche5','Monsoon8','Blizzard1','NoobSlayer','AFKAndWin','LuckyDraw','PetCollector','EggHunter','RareFinder','MythicChaser','LegendSeeker','GalacticOwl','NebulaCat','CometDog','PulsarFox','QuasarBear','DarkMatter7','SingularityX','QuantumLeap','ChaosLord','OrderKeeper','ZenMaster','SakuraPet','MatchaKing','RamenLord','SushiDog','WasabiCat','MisoPanda','TofuFox','MelonPan','StrawbDog','ChocoCat','VanillaFox','CaramelBear','CookieOwl','BrownieBun','Pudding7','FlanKing','Macaron6','Tiramisu7','Gelato6','Sorbet2','Nutella7','Pistachio5','Chestnut3','Acorn8','Coconut7','JadeWarrior','AmberLight','CoralReef','PearlDiver','OpalDream','OnyxBlade','TopazSun','GarnetRose','PeridotEye','QuartzMind','ObsidianX','PixelKing','RetroGamer','NeoPlayer','CyberNinja','RoboMaster','AtomicFlux','StringTheo','Multiverse9','DimensionX','ParallelP','EntropyKing','BalanceX','Samsara99','KarmaKing','DharmaDog','TaoMaster','YinYang7','FengShui5','IChing3','Bagua8','WuXing5','TaiChi9','QiGong7','ZenGarden','BonsaiAce','Hojicha7','Genmaicha','Sencha9','Kinako7','Anko5','Yomogi3','Kuzumochi','Mitsumame','Anmitsu7','CreamAnko'];
var rP=[];
function initRk(){for(var i=0;i<199;i++){var nm=NM[i%NM.length]+(i>=NM.length?Math.floor(i/NM.length):'');var rb=Math.floor(Math.random()*15);var bi=Math.pow(10,Math.random()*8+1)*(1+rb*.8);rP.push({name:nm,income:bi,rb:rb,pets:Math.floor(Math.random()*200+5),trend:(Math.random()-.5)*.02})}}
function updRk(){rP.forEach(function(p){p.income*=(1+p.trend+(Math.random()-.5)*.04);p.income=Math.max(1,p.income);if(Math.random()<.08)p.trend=(Math.random()-.5)*.02})}
function getFR(){var all=[{name:G.pn,income:tI(),rb:G.rb,pets:G.pets.length,isMe:true}];for(var i=0;i<rP.length;i++)all.push(rP[i]);all.sort(function(a,b){return b.income-a.income});return all}
function rkI(p,idx){var pos=idx+1;var pc=pos===1?'p1':pos===2?'p2':pos===3?'p3':'';return'<div class="rk-i'+(p.isMe?' me':'')+'"><div class="rk-pos '+pc+'">'+pos+'</div><div class="rk-body"><div class="rk-top"><span class="rk-n">'+esc(p.name)+(p.isMe?' <span class="rk-you">TU</span>':'')+'</span><span class="rk-rb">RB '+p.rb+'</span></div><div class="rk-bot"><span class="rk-pc">'+p.pets+' mascotas</span><span class="rk-earn">$'+fmt(p.income)+'/s</span></div></div></div>'}
function renderRk(){if(!el('rkList'))return;var all=getFR();var mi=0;for(var i=0;i<all.length;i++){if(all[i].isMe){mi=i;break}}if(el('rkPos'))el('rkPos').textContent='#'+(mi+1);if(el('rkMyEarn'))el('rkMyEarn').textContent='$'+fmt(tI())+'/s';var h='';var ss=Math.max(0,mi-2),se=Math.min(all.length-1,mi+2);if(ss>3){for(var i=0;i<3;i++)h+=rkI(all[i],i);h+='<div class="rk-sep">. . .</div>'}else ss=0;if(se<all.length-4){for(var i=ss;i<=se;i++)h+=rkI(all[i],i);h+='<div class="rk-sep">. . .</div>';for(var i=all.length-3;i<all.length;i++)h+=rkI(all[i],i)}else{for(var i=ss;i<all.length;i++)h+=rkI(all[i],i)}h+='<div class="rk-total">'+all.length+' jugadores en linea</div>';el('rkList').innerHTML=h}

// ===== MEJORAS / LOGROS / EVENTOS / DIARIO =====
var UPGS=[
{id:'luck',n:'Suerte',d:'Mejora probabilidades de rarezas altas',ic:'fa-clover',max:10,fx:function(l){return'+'+(l*6)+'% suerte'},co:function(l){return Math.floor(5e4*Math.pow(2.6,l))}},
{id:'inc',n:'Ingresos',d:'Aumenta todo tu ingreso global',ic:'fa-chart-line',max:10,fx:function(l){return'x'+(1+l*.1).toFixed(1)+' ingreso'},co:function(l){return Math.floor(1e5*Math.pow(3,l))}},
{id:'disc',n:'Descuento',d:'Reduce el precio de todos los huevos',ic:'fa-tags',max:5,fx:function(l){return'-'+(l*4)+'% precio'},co:function(l){return Math.floor(2.5e5*Math.pow(4,l))}},
{id:'fast',n:'Rotura Rapida',d:'Menos toques para romper huevos',ic:'fa-hand-sparkles',max:4,fx:function(l){return(5-l)+' toques'},co:function(l){return Math.floor(5e5*Math.pow(4,l))}},
{id:'auto',n:'Auto Turbo',d:'Auto abre mas huevos por segundo',ic:'fa-gauge-high',max:3,fx:function(l){return(1+l)+' huevos/s'},co:function(l){return Math.floor(1e10*Math.pow(6,l))}}
];
var ACHS=[
{id:'e1',n:'Aprendiz',d:'Abre 25 huevos',ic:'fa-egg',goal:25,st:'tot',rw:500},
{id:'e2',n:'Incansable',d:'Abre 500 huevos',ic:'fa-box-open',goal:500,st:'tot',rw:5e3},
{id:'e3',n:'Obsesionado',d:'Abre 5,000 huevos',ic:'fa-fire',goal:5000,st:'tot',rw:1e5},
{id:'e4',n:'Maestro Absoluto',d:'Abre 25,000 huevos',ic:'fa-medal',goal:25000,st:'tot',rw:2e6},
{id:'rb1',n:'Renacer',d:'Haz 2 rebirths',ic:'fa-arrows-rotate',goal:2,st:'rb',rw:1e4},
{id:'rb2',n:'Ciclo Eterno',d:'Haz 10 rebirths',ic:'fa-infinity',goal:10,st:'rb',rw:5e5},
{id:'rb3',n:'Transcendencia',d:'Haz 25 rebirths',ic:'fa-yin-yang',goal:25,st:'rb',rw:5e7},
{id:'wd1',n:'Explorador',d:'Desbloquea 6 mundos',ic:'fa-map-location-dot',goal:6,st:'uw',rw:2e4},
{id:'wd2',n:'Conquistador',d:'Desbloquea TODOS los mundos',ic:'fa-earth-americas',goal:WORLDS.length,st:'uw',rw:5e10},
{id:'mo1',n:'Magnate',d:'Gana $10M en total',ic:'fa-sack-dollar',goal:1e7,st:'te',rw:1e4},
{id:'mo2',n:'Emperador',d:'Gana $100B en total',ic:'fa-money-bill-wave',goal:1e11,st:'te',rw:1e6},
{id:'mo3',n:'Mas Alla del Dinero',d:'Gana $100T en total',ic:'fa-gem',goal:1e14,st:'te',rw:1e8},
{id:'mo4',n:'Dueno del Universo',d:'Gana $1Qa en total',ic:'fa-crown',goal:1e18,st:'te',rw:5e9},
{id:'pt1',n:'Equipo Completo',d:'Ten 25 mascotas',ic:'fa-paw',goal:25,st:'pets',rw:5e3},
{id:'pt2',n:'Zoologico',d:'Ten 100 mascotas',ic:'fa-hippo',goal:100,st:'pets',rw:5e5},
{id:'co1',n:'Coleccionista',d:'Descubre 100 mascotas',ic:'fa-book',goal:100,st:'disc',rw:2e5},
{id:'co2',n:'Enciclopedia Viva',d:'Descubre TODAS las mascotas',ic:'fa-trophy',goal:PETS.length,st:'disc',rw:5e11},
{id:'go1',n:'Toque de Midas',d:'Consigue 5 mascotas DORADAS',ic:'fa-star',goal:5,st:'v1',rw:1e5},
{id:'go2',n:'Prisma Viviente',d:'Consigue 3 mascotas ARCOIRIS',ic:'fa-rainbow',goal:3,st:'v2',rw:1e7},
{id:'cb1',n:'Combinacion',d:'Alcanza combo x25',ic:'fa-fire-flame-curved',goal:25,st:'comboBest',rw:5e4},
{id:'up1',n:'Maximizador',d:'Compra 15 niveles de mejoras',ic:'fa-arrow-up-right-dots',goal:15,st:'upg',rw:1e8}
];
var EVENTS=[
{id:'rain',n:'LLUVIA DE DINERO x3',ic:'fa-solid fa-cloud-showers-heavy',dur:60,apply:function(){eventMult=3},end:function(){eventMult=1}},
{id:'lucky',n:'SUERTE DIVINA',ic:'fa-solid fa-clover',dur:45,apply:function(){luckyBoost=true},end:function(){luckyBoost=false}},
{id:'sale',n:'REBAJA 50%!',ic:'fa-solid fa-tags',dur:30,apply:function(){eggSale=true;renderTab('shop')},end:function(){eggSale=false;renderTab('shop')}},
{id:'gold',n:'HUEVO DORADO!',ic:'fa-solid fa-egg',dur:15,apply:spawnGoldEgg,end:function(){clearGoldEgg()}}
];
function startEvent(){
  if(evtCur)return;
  var ev=EVENTS[Math.floor(Math.random()*EVENTS.length)];
  evtCur=ev;evtEnd=Date.now()+ev.dur*1000;
  try{ev.apply()}catch(e){}
  ensureEl('evtBar');updateEvtBar();toast('🎉 ¡EVENTO! '+ev.n,'god');snd.world();renderBuffs();
  if(evtT)clearInterval(evtT);evtT=setInterval(function(){if(!evtCur){clearInterval(evtT);evtT=null;return}
   if(Date.now()>=evtEnd)endEvent();else updateEvtBar()},1000);
}
function endEvent(){if(evtCur){try{evtCur.end()}catch(e){}toast('⏹️ Evento terminado: '+evtCur.n,'inf')}evtCur=null;var b=el('evtBar');if(b)b.style.display='none';if(evtT){clearInterval(evtT);evtT=null}renderBuffs()}
function updateEvtBar(){var b=ensureEl('evtBar');if(!evtCur){b.style.display='none';return}b.style.display='flex';b.innerHTML='<i class="'+evtCur.ic+'"></i> '+evtCur.n+' · <b>'+Math.max(0,Math.ceil((evtEnd-Date.now())/1000))+'s</b>'}
function spawnGoldEgg(){clearGoldEgg();var e=document.createElement('button');e.id='goldEggBtn';e.textContent='🥚';e.style.cssText='position:fixed;z-index:9650;font-size:52px;background:none;border:none;cursor:pointer;filter:drop-shadow(0 0 14px gold);animation:psuFloat 2s ease-in-out infinite';
 e.style.left=(10+Math.random()*70)+'vw';e.style.top=(15+Math.random()*55)+'vh';
 e.onclick=function(ev){ev.stopPropagation();var v=Math.max(2e4,tI()*45);G.money+=v;G.te+=v;toast('🌟 ¡HUEVO DORADO! +$'+fmt(v),'god');coinBurst(16);snd.hatch('mythic');clearGoldEgg();evtEnd=Math.min(evtEnd,Date.now()+400);updateUI()};
 document.body.appendChild(e)}
function clearGoldEgg(){var b=el('goldEggBtn');if(b)b.remove()}

// ===== DIARIO =====
function checkDaily(){var now=Date.now();
 if(now-(G.lastDaily||0)<20*3600e3)return;
 var cont=now-(G.lastDaily||0)<48*3600e3;
 var streak=cont?((G.dailyStreak||0)+1):1;
 var rw=Math.floor(2000*Math.pow(2.5,Math.min(streak-1,9))*(1+G.rb*.4)+500);
 var d=ensureEl('psuDaily','modal');d.innerHTML='<div class="mbox"><div style="font-size:44px">🎁</div><h3 style="margin:8px 0 4px">¡Recompensa Diaria!</h3><p style="color:#9fb3c8;font-size:13px">Dia <b>'+streak+'</b> de racha 🔥</p><div style="font-size:26px;font-weight:900;color:#fbbf24;margin:10px 0">+$'+fmt(rw)+'</div><p style="color:#9fb3c8;font-size:12px">⚡ + BOOST x2 durante 2 horas</p><button class="btn gold" style="width:100%;margin-top:10px" id="psuDailyOk">🎉 RECLAMAR</button></div>';
 d.classList.add('show');
 el('psuDailyOk').onclick=function(){G.money+=rw;G.te+=rw;G.lastDaily=Date.now();G.dailyStreak=streak;G.boostUntil=Date.now()+2*3600e3;boostActive=true;
  d.classList.remove('show');coinBurst(20);snd.hatch('god');toast('🎁 Diario: +$'+fmt(rw)+' · BOOST x2 2h','gold');save();updateUI();renderBuffs()};
 snd.world()}

// ===== COMBOS / MONEDAS / BUFFS =====
var comboTm=null;
function bumpCombo(){G.combo=(G.combo||0)+1;if(G.combo>G.comboBest)G.comboBest=G.combo;
 clearTimeout(comboTm);comboTm=setTimeout(function(){G.combo=0;drawCombo()},1300);drawCombo();
 if(G.combo===10||G.combo===25||G.combo===50||G.combo===100||G.combo===200){
  var bonus=Math.max(tI()*2,150)*(G.combo/8);G.money+=bonus;G.te+=bonus;
  toast('🔥 COMBO x'+G.combo+' · +$'+fmt(bonus),'gold');coinBurst(10);snd.burst();
  if(navigator.vibrate)navigator.vibrate(15);updateUI()}}
function drawCombo(){var cb=ensureEl('comboBar');if(!G.combo){cb.style.display='none';return}
 cb.style.display='block';cb.innerHTML='<div class="cb-t">COMBO x'+G.combo+'</div><div class="cb-b"><div class="cb-f" style="width:'+Math.min(100,G.combo)+'%"></div></div>'}
function coinBurst(n){n=n||12;for(var i=0;i<n;i++){var c=document.createElement('span');c.className='coinP';c.textContent=['🪙','💰','💵','🤑'][Math.floor(Math.random()*4)];
 c.style.left=(35+Math.random()*45)+'vw';c.style.top=(45+Math.random()*35)+'vh';c.style.animationDuration=(0.9+Math.random()*0.7)+'s';
 document.body.appendChild(c);(function(cc){setTimeout(function(){cc.remove()},1700)})(c)}}
function renderBuffs(){var bb=ensureEl('buffBar');var h='';
 if((G.webMult||1)!==1)h+='<span class="buff">🌐 WEB x'+fmt(G.webMult)+'</span>';
 var f=(G.feverUntil||0)-Date.now();if(f>0)h+='<span class="buff">🔥 FIEBRE x2 · '+fmtT(f)+'</span>';
 if(evtCur)h+='<span class="buff">🎉 '+evtCur.n+'</span>';
 if(boostActive)h+='<span class="buff">⚡ BOOST x2 · '+fmtT(Math.max(0,G.boostUntil-Date.now()))+'</span>';
 if(IS_ADM)h+='<span class="buff">👑 ADMIN +25%</span>';
 if(luckyBoost)h+='<span class="buff">🍀 SUERTE</span>';
 bb.innerHTML=h}

// ===== MISIONES =====
var QTMPL=[
 {icn:'🥚',n:'Abre {n} huevos',st:'tot',base:15,mul:2.4,rwm:45,abs:false},
 {icn:'💰',n:'Gana ${n}',st:'te',base:6e3,mul:3.2,rwm:.55,abs:false},
 {icn:'🐾',n:'Ten {n} mascotas',st:'pets',base:6,mul:1.5,rwm:260,abs:true},
 {icn:'📖',n:'Descubre {n} especies',st:'disc',base:3,mul:1.45,rwm:900,abs:true},
 {icn:'🔥',n:'Alcanza combo x{n}',st:'comboBest',base:8,mul:1.35,rwm:180,abs:true}];
function qVal(s){if(s==='tot')return G.tot||0;if(s==='te')return G.te||0;if(s==='pets')return G.pets.length;if(s==='disc')return G.disc.length;if(s==='comboBest')return G.comboBest||0;return 0}
function newQuest(){var t=QTMPL[Math.floor(Math.random()*QTMPL.length)];var lvl=1+Math.floor((G.tot||0)/60);
 var n=Math.max(1,Math.floor(t.base*Math.pow(t.mul,Math.min(lvl,12))*(.8+Math.random()*.5)));
 return{name:t.n.replace('{n}',fmt(n)),icn:t.icn,st:t.st,n:n,start:qVal(t.st),rw:Math.max(150,Math.floor(n*t.rwm)),abs:t.abs}}
function qProg(q){var c=qVal(q.st);return Math.max(0,q.abs?c:c-q.start)}
function ensureQuests(){if(!G.quests)G.quests=[];var g=0;while(G.quests.length<3&&g++<5)G.quests.push(newQuest())}
function tickQuests(){ensureQuests();
 for(var i=G.quests.length-1;i>=0;i--){var q=G.quests[i];
  if(qProg(q)>=q.n){G.money+=q.rw;G.te+=q.rw;toast('📜 Misión completada '+q.icn+' · +$'+fmt(q.rw),'gold');snd.hatch('epic');coinBurst(8);G.quests.splice(i,1)}}
 ensureQuests()}

// ===== CÓDIGOS =====
var CODES_LOCAL={GLM:{t:'money',v:1e5,hint:'💰 dinero'},BIENVENIDA:{t:'money',v:2500,hint:'💰 para empezar'},SUERTE:{t:'luck',v:5,hint:'🍀 suerte 5min'},FEVER:{t:'fever',v:120,hint:'🔥 fiebre x2 2min'},V2RULES:{t:'fever',v:300,hint:'🔥 fiebre x2 5min'}};
function allCodes(){var cs={};for(var k in CODES_LOCAL)cs[k]=CODES_LOCAL[k];var srv=window.__psuSrvCodes||{};for(var k2 in srv)cs[k2]=srv[k2];return cs}
function usedCodes(){try{return JSON.parse(localStorage.getItem('psuCodesUsed')||'{}')}catch(e){return{}}}
function redeem(code){code=(''+(code||'')).trim().toUpperCase();if(!code)return;
 var c=allCodes()[code];if(!c){toast('❌ Código no válido','err');snd.err();return}
 var u=usedCodes();if(u[code]){toast('⚠️ Ya canjeado','err');return}
 u[code]=Date.now();try{localStorage.setItem('psuCodesUsed',JSON.stringify(u))}catch(e){}
 if(c.t==='money'){G.money+=c.v;G.dm=G.money;G.te+=c.v;toast('✅ Código: +$'+fmt(c.v),'gold')}
 else if(c.t==='rb'){G.rb=(G.rb||0)+c.v;G.mult=1+G.rb*.25;toast('✅ +'+c.v+' Rebirths','gold')}
 else if(c.t==='pet'){givePets(c.r||'god',c.v||1)}
 else if(c.t==='fever'){G.feverUntil=Date.now()+c.v*1000;toast('🔥 ¡FIEBRE x2 por '+c.v+'s!','gold')}
 else if(c.t==='luck'){luckyBoost=true;(function(v){setTimeout(function(){luckyBoost=false;renderBuffs()},v*60000)})(c.v);toast('🍀 Suerte divina '+c.v+' min','gold')}
 snd.burst();coinBurst(10);renderBuffs();renderTab('extras');updateUI();save()}

// ===== FUSIÓN =====
function fuse(r){var i=RKEYS.indexOf(r);
 if(i<0||i>=RKEYS.length-1){toast('Esa rareza no puede fusionarse más','err');return}
 var pool=G.pets.filter(function(p){return p.r===r});
 if(pool.length<3){toast('Necesitas 3 mascotas '+RNAME[r],'err');snd.err();return}
 pool.sort(function(a,b){return pE(a)-pE(b)});
 var rem=pool.slice(0,3),maxLv=1;
 rem.forEach(function(p){maxLv=Math.max(maxLv,p.lv||1);var ix=G.pets.indexOf(p);if(ix>-1)G.pets.splice(ix,1)});
 var nx=RKEYS[i+1],np=PETS.filter(function(p){return p.r===nx});
 var b=np[Math.floor(Math.random()*np.length)];
 G.pets.push({ic:b.ic,n:b.n,r:b.r,be:b.e,lv:maxLv,id:G.nid++,c:b.c,eg:(b.eg||[]).slice(),v:rollVariant()});
 if(G.disc.indexOf(b.n)===-1)G.disc.push(b.n);
 toast('⚗️ ¡FUSIÓN! → '+b.n+' ('+RNAME[nx]+')','god');snd.hatch(nx);coinBurst(14);
 refHP();renderTab('pets');checkAchs();updateUI();save()}
function givePets(rar,q){q=Math.max(1,q|0);var pool=PETS.filter(function(p){return p.r===rar});
 if(!pool.length){toast('Sin mascotas de esa rareza','inf');return}
 for(var i=0;i<q;i++){var b=pool[Math.floor(Math.random()*pool.length)];
  G.pets.push({ic:b.ic,n:b.n,r:b.r,be:b.e,lv:1,id:G.nid++,c:b.c,eg:(b.eg||[]).slice(),v:rollVariant()});
  if(G.disc.indexOf(b.n)<0)G.disc.push(b.n)}
 try{snd.hatch(rar)}catch(e){}refHP();renderTab('pets');updateUI();save()}

// ===== LOGROS =====
function achVal(st){switch(st){
 case'tot':return G.tot;case'rb':return G.rb;case'uw':return G.uw.length;case'te':return G.te;
 case'pets':return G.pets.length;case'disc':return G.disc.length;case'comboBest':return G.comboBest||0;
 case'v1':return G.pets.filter(function(p){return p.v===1}).length;
 case'v2':return G.pets.filter(function(p){return p.v===2}).length;
 case'upg':return G.upg.luck+G.upg.inc+G.upg.disc+G.upg.fast+G.upg.auto}return 0}
function checkAchs(){var ch=false;
 for(var i=0;i<ACHS.length;i++){var a=ACHS[i];
 if(G.achs.indexOf(a.id)===-1&&achVal(a.st)>=a.goal){G.achs.push(a.id);G.money+=a.rw;G.te+=a.rw;
 toast('🏆 Logro: '+a.n+' · +$'+fmt(a.rw),'gold');snd.hatch('god');coinBurst(10);ch=true}}
 if(ch){renderTab('achs');save()}}

// ===== OFFLINE =====
function checkOffline(){var dt=Date.now()-(G.lastSeen||Date.now());
 if(dt>60000&&G.pets.length){var earn=Math.floor(tI()*Math.min(dt,8*36e5)/1000*.5);
  if(earn>0){G.money+=earn;G.te+=earn;
   var d=ensureEl('psuOffline','modal');d.innerHTML='<div class="mbox"><div style="font-size:44px">😴</div><h3 style="margin:8px 0 4px">¡Bienvenido de nuevo!</h3><p style="color:#9fb3c8;font-size:13px">Fuiste fuera <b>'+fmtT(dt)+'</b>. Tus mascotas siguieron trabajando (50%):</p><div style="font-size:26px;font-weight:900;color:#fbbf24;margin:10px 0">+$'+fmt(earn)+'</div><button class="btn gold" style="width:100%" id="psuOffOk">🎉 ¡RECLAMAR!</button></div>';
   d.classList.add('show');el('psuOffOk').onclick=function(){d.classList.remove('show');snd.hatch('god');coinBurst(22);updateUI()};
   snd.world()}}
 checkDaily()}

// ===== TIENDA / UI RENDER =====
function worldOfEgg(eg){for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].eggs.indexOf(eg)!==-1)return WORLDS[i];return WORLDS[0]}
function renderShop(){var host=el('panel-shop');if(!host)return;var h='<h2 class="ph">🥚 Tienda de Huevos</h2>';
 if(eggSale)h+='<div class="evchip">🏷️ ¡REBAJA 50% ACTIVA!</div>';
 var m=effMulti();
 WORLDS.forEach(function(w){var un=isUW(w.id);
 h+='<div class="wsep'+(un?'':' dim')+'">'+w.icon+' '+w.name+' <span class="wbchip">x'+w.bonus.toFixed(1)+'</span>'+(un?'':' <span class="lk">🔒 $'+fmt(w.cost)+'</span>')+'</div><div class="egg-grid">';
 w.eggs.forEach(function(eg){var c=eggCost(eg);
 var ks=(WEIGHTS[eg]?Object.keys(WEIGHTS[eg]):[]).slice().sort(function(a,b){return RORD[a]-RORD[b]});
 var chips=ks.map(function(r){return'<span class="rchip" style="color:'+RCOL[r]+';border-color:'+RCOL[r]+'55">'+RNAME[r]+'</span>'}).join('');
 h+='<div class="card egg-card'+(un?'':' dim')+'"><div class="egg-visual" style="background:'+E3DG[eg]+'"></div><div class="egg-name">Huevo '+ENAMES[eg]+'</div><div class="egg-price">$'+fmt(c)+'</div><div class="rchips">'+chips+'</div><button class="btn gold" style="width:100%" data-open="'+eg+'"'+(un?'':' disabled')+'>▶ Abrir'+(m>1?' x3':'')+' · $'+fmt(c*m)+'</button></div>'});
 h+='</div>'});
 host.innerHTML=h}
function renderPets(){var host=el('panel-pets');if(!host)return;
 var sorted=G.pets.slice().sort(function(a,b){return pE(b)-pE(a)});var best=sorted[0];
 var h='<h2 class="ph">🐾 Mascotas ('+G.pets.length+') · 📖 '+G.disc.length+'/'+PETS.length+'</h2>';
 if(best)h+='<div class="evchip">💪 Mejor: <b style="color:'+RCOL[best.r]+'">'+esc(best.n)+'</b> · $'+fmt(pE(best))+'/s</div>';
 h+='<h3 class="ph2">⚗️ Fusión (3 iguales → 1 superior)</h3><div class="card">';
 var cnt={};RKEYS.forEach(function(r){cnt[r]=0});G.pets.forEach(function(p){if(cnt[p.r]!=null)cnt[p.r]++});
 for(var i=0;i<RKEYS.length-1;i++){var r=RKEYS[i],nx=RKEYS[i+1];
 h+='<div class="fu-row"><span style="color:'+RCOL[r]+';font-weight:700">'+RNAME[r]+' <b>x'+cnt[r]+'</b></span><span><button class="btn sm danger" data-bulk="'+r+'">💰 Vender</button> <button class="btn sm gold" data-fuse="'+r+'"'+(cnt[r]<3?' disabled':'')+'>⚗️ → '+RNAME[nx]+'</button></span></div>'}
 h+='</div><h3 class="ph2">Colección</h3><div class="pet-grid">';
 var lim=Math.min(sorted.length,120);
 for(i=0;i<lim;i++){var p=sorted[i];
 h+='<div class="pet-card">'+sphH(p,'xs')+'<div class="pet-name">'+esc(p.n)+(p.v===2?' 🌈':p.v===1?' ⭐':'')+'</div><div class="pet-rar" style="color:'+RCOL[p.r]+'">'+RNAME[p.r]+' Nv'+p.lv+'</div><div class="pet-inc">$'+fmt(pE(p))+'/s</div><div style="display:flex;gap:4px;margin-top:4px"><button class="sell" data-lv="'+p.id+'"'+(p.lv>=25?' disabled':'')+'>⬆️ $'+fmt(uCo(p))+'</button><button class="sell" data-sell="'+p.id+'">💰 $'+fmt(sellVal(p))+'</button></div></div>'}
 h+='</div>';
 if(sorted.length>120)h+='<div class="hint">…y '+fmt(sorted.length-120)+' más. Vende o fusiona para ordenar.</div>';
 host.innerHTML=h}
function renderWorlds(){var host=el('panel-worlds');if(!host)return;var h='<h2 class="ph">🗺️ Mundos</h2>';
 WORLDS.forEach(function(w){var un=isUW(w.id),cur=G.world===w.id;
 h+='<div class="card world-card'+(un?'':' dim')+'"><div class="w-ic">'+w.icon+'</div><div class="w-info"><div class="w-name">'+w.name+' <span class="wbchip">x'+w.bonus.toFixed(1)+'</span></div><div class="w-desc">'+w.desc+'</div></div><div class="w-right">'+(cur?'<span class="tag here">ACTUAL</span>':un?'<button class="btn sm gold" data-go="'+w.id+'">✈️ Viajar</button>':'<button class="btn sm gold" data-unlock="'+w.id+'">🔓 $'+fmt(w.cost)+'</button>')+'</div></div>'});
 host.innerHTML=h}
function renderUpgs(){var host=el('panel-upgs');if(!host)return;var h='<h2 class="ph">⬆️ Mejoras</h2>';
 UPGS.forEach(function(u){var lvl=G.upg[u.id],maxed=lvl>=u.max,cost=maxed?0:u.co(lvl);
 h+='<div class="card upg-card"><div class="u-ic"><i class="fa-solid '+u.ic+'"></i></div><div class="u-info"><div class="u-name">'+u.n+' <span class="lvl">Nv '+lvl+'/'+u.max+'</span></div><div class="u-desc">'+u.d+'</div><div class="fx">Ahora: '+u.fx(lvl)+(maxed?'':' → '+u.fx(lvl+1))+'</div></div>'+(maxed?'<span class="tag here">MAX</span>':'<button class="btn sm gold" data-upg="'+u.id+'">$'+fmt(cost)+'</button>')+'</div>'});
 host.innerHTML=h}
function renderAchs(){var host=el('panel-achs');if(!host)return;var h='<h2 class="ph">🏆 Logros ('+G.achs.length+'/'+ACHS.length+')</h2>';
 ACHS.forEach(function(a){var cur=Math.min(achVal(a.st),a.goal),done=G.achs.indexOf(a.id)!==-1,pc=a.goal?Math.floor(cur/a.goal*100):100;
 h+='<div class="card ach-row'+(done?' done':'')+'"><div class="a-ic">'+(done?'🏅':'<i class="fa-solid '+a.ic+'"></i>')+'</div><div class="a-info"><div class="a-name">'+a.n+'</div><div class="a-desc">'+a.d+' · <span class="rw">+$'+fmt(a.rw)+'</span></div><div class="pbar"><div class="pfill" style="width:'+pc+'%"></div></div><div class="lvl">'+fmt(cur)+' / '+fmt(a.goal)+'</div></div></div>'});
 host.innerHTML=h}
function renderExtras(){var host=el('panel-extras');if(!host)return;
 var cs=allCodes(),u=usedCodes();
 var h='<h2 class="ph">🎟️ Códigos</h2><div class="card"><div style="display:flex;gap:8px"><input id="codeInp" class="inp" placeholder="Escribe un código..." maxlength="20" style="flex:1"><button class="btn gold" id="codeBtn">Canjear</button></div><div style="margin-top:10px">';
 Object.keys(cs).forEach(function(k){
  if(u[k])h+='<div class="st-row"><span style="text-decoration:line-through;opacity:.55">'+esc(k)+'</span><b>✅</b></div>';
  else h+='<div class="st-row"><span>🔒 <b>'+esc(k)+'</b></span><span style="opacity:.7;font-size:11px">'+(cs[k].hint||'')+'</span></div>'});
 h+='</div><div class="hint">💡 El admin publica códigos nuevos. Prueba GLM o FEVER…</div></div>';
 h+='<h2 class="ph">📜 Misiones</h2>';
 ensureQuests();
 G.quests.forEach(function(q){var p=Math.min(qProg(q),q.n),pc=Math.floor(p/q.n*100);
  h+='<div class="card"><div class="fu-row"><span>'+q.icn+' '+esc(q.name)+'</span><span style="color:#fbbf24;font-weight:700">$'+fmt(q.rw)+'</span></div><div class="pbar"><div class="pfill" style="width:'+pc+'%"></div></div><div class="lvl">'+fmt(p)+' / '+fmt(q.n)+'</div></div>'});
 var rows=[['💵 Dinero','$'+fmt(G.money)],['📈 Ingreso','$'+fmt(tI())+'/s'],['🥚 Huevos',fmt(G.tot)],['💰 Total ganado','$'+fmt(G.te)],['🔥 Mejor combo','x'+(G.comboBest||0)],['⏱️ Jugado',fmtT(G.playtime*1000)],['👑 Admin',IS_ADM?'SÍ':'No']];
 h+='<h2 class="ph">📊 Stats</h2><div class="card">'+rows.map(function(r){return'<div class="st-row"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'}).join('')+'</div>';
 host.innerHTML=h;
 var cb=el('codeBtn');if(cb)cb.onclick=function(){redeem(el('codeInp').value);el('codeInp').value=''};var ci=el('codeInp');if(ci)ci.onkeydown=function(e){if(e.key==='Enter'){redeem(ci.value);ci.value=''}}}
function renderSettings(){var host=el('panel-settings');if(!host)return;
 var h='<h2 class="ph">⚙️ Ajustes</h2><div class="card"><div class="st-row"><span>👤 Nombre</span></div><div style="display:flex;gap:8px;margin-top:8px"><input id="nameInp" class="inp" maxlength="16" value="'+esc(G.pn)+'" style="flex:1"><button class="btn gold" id="setNameBtn">OK</button></div></div>';
 h+='<div class="card"><div class="st-row"><span>🔊 Sonido</span><button class="btn sm" id="setMute">'+(G.mut?'OFF':'ON')+'</button></div><div class="st-row"><span>💾 Guardar</span><button class="btn sm" id="saveNow">Guardar</button></div><div class="st-row"><span>📤 Exportar</span><button class="btn sm" id="btnExport">Copiar</button></div><div class="st-row"><span>📥 Importar</span><button class="btn sm" id="btnImport">Pegar</button></div><div class="st-row"><span>🗑️ Reiniciar TODO</span><button class="btn sm danger" id="btnReset">Borrar</button></div></div>';
 h+='<div class="card"><div class="st-row"><span>Versión</span><b>v39</b></div><div class="st-row"><span>👑 Admin</span><b>'+(IS_ADM?'ACTIVO':'No')+'</b></div><div class="st-row"><span>🌐 Mult web</span><b>x'+(G.webMult||1)+'</b></div></div>';
 host.innerHTML=h;
 el('setNameBtn').onclick=function(){var v=el('nameInp').value.trim().slice(0,16);if(v){G.pn=v;toast('✅ Nombre: '+v,'gold');save()}};
 el('setMute').onclick=function(){G.mut=!G.mut;renderSettings();updateUI();save()};
 el('saveNow').onclick=function(){save();toast('💾 Guardado','inf')};
 el('btnExport').onclick=function(){save();var d=localStorage.getItem(SK)||'';try{navigator.clipboard.writeText(d).then(function(){toast('📋 Copiado','gold')},function(){prompt('Copia tu save:',d)})}catch(e){prompt('Copia tu save:',d)}};
 el('btnImport').onclick=function(){var d=prompt('Pega tu save:');if(!d)return;try{JSON.parse(d);localStorage.setItem(SK,d);toast('✅ Recargando...','gold');setTimeout(function(){location.reload()},700)}catch(e){toast('❌ Inválido','err')}};
 el('btnReset').onclick=function(){showCf('⚠️','¿Reiniciar TODO?','Se borra todo tu progreso.',function(){hideCf();resetG()})}}
function renderTab(t){if(t==='shop')renderShop();else if(t==='pets')renderPets();else if(t==='worlds')renderWorlds();
 else if(t==='upgs')renderUpgs();else if(t==='achs')renderAchs();else if(t==='extras')renderExtras();else if(t==='settings')renderSettings();else if(t==='rank')renderRk()}

// ===== TABS / PANELES =====
var TABDEFS=[['game','🏠 Base'],['shop','🥚 Huevos'],['pets','🐾 Mascotas'],['worlds','🗺️ Mundos'],['upgs','⬆️ Mejoras'],['achs','🏆 Logros'],['rank','🏛️ Top'],['extras','🎁 Extras'],['settings','⚙️']];
function buildTabs(){ensureEl('psuTabs');var t=el('psuTabs');t.innerHTML='';
 TABDEFS.forEach(function(d){var b=document.createElement('button');b.className='ptab'+(aTab===d[0]?' on':'');b.textContent=d[1];b.dataset.t=d[0];t.appendChild(b)});
 t.onclick=function(e){var b=e.target.closest('.ptab');if(b)switchTab(b.dataset.t)}}
function switchTab(t){aTab=t;buildTabs();
 document.querySelectorAll('.psu-panel').forEach(function(p){p.style.display='none'});
 var g=el('game');if(g)g.style.display=(t==='game')?'':'none';
 if(t!=='game'){var p=ensureEl('panel-'+t,'psu-panel');p.style.display='block';renderTab(t)}
 if(t==='game')setTimeout(rsH,60);snd.click()}
function buildPanels(){['shop','pets','worlds','upgs','achs','rank','extras','settings'].forEach(function(t){var p=ensureEl('panel-'+t,'psu-panel');p.style.display='none'});
 // rank necesita ids del HTML original si existen; si no, dentro del panel
 if(!el('rkList')){el('panel-rank').innerHTML='<div class="card rk-head2"><div><div class="ph2">TU PUESTO</div><div id="rkPos" style="font-size:30px;font-weight:900;color:var(--wa)">#—</div></div><div style="text-align:right"><div class="ph2">INGRESO</div><div id="rkMyEarn" style="font-weight:800"></div></div></div><div id="rkList"></div>'}}

// ===== ABRIR HUEVOS =====
function buildEggModal(){if(el('psuEggModal'))return;
 var d=document.createElement('div');d.id='psuEggModal';d.className='modal';
 d.innerHTML='<div class="mbox"><button class="m-x" id="psuEggX">✕</button><h3 id="eggTitle">Huevo</h3><div class="hint" id="eggSub"></div><div class="egg-stage" id="eggStage"><div id="eggBig"></div><canvas id="crackCanvas"></canvas><canvas id="hatchCanvas"></canvas></div><div class="hint" id="eggHint"></div></div>';
 document.body.appendChild(d);
 var old=el('crackCanvas'); // si tu HTML ya tenía, se manda al nuevo modal
 // (los canvas nuevos ya están; si existían viejos, los ignoramos)
 el('psuEggX').onclick=cancelEgg;
 el('eggStage').addEventListener('pointerdown',function(e){e.preventDefault();eggTap()})}
function buildRevModal(){if(el('psuRevModal'))return;
 var d=document.createElement('div');d.id='psuRevModal';d.className='modal';
 d.innerHTML='<div class="mbox"><div id="revSphere3d" style="width:120px;height:120px;margin:8px auto;display:none"></div><div id="revName" style="font-size:22px;font-weight:900"></div><div id="revRar" style="font-size:12px;font-weight:800;letter-spacing:2px;margin-top:2px"></div><div id="revInc" style="color:#7ee2a8;margin:6px 0;font-weight:700"></div><div id="revMulti" style="display:flex;gap:14px;justify-content:center;margin:12px 0;flex-wrap:wrap"></div><div id="revNew"></div><div style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button class="btn gold" id="btnRevOk">¡GENIAL! 😎</button><button class="btn" id="btnRevAgain">🔁 Otra</button></div></div>';
 document.body.appendChild(d);
 el('btnRevOk').onclick=closeReveal;
 el('btnRevAgain').onclick=function(){var cost=eggCost(hSt.egg)*hSt.multi;
  if(G.money<cost){toast('💸 Te falta dinero','err');snd.err();return}
  el('psuRevModal').classList.remove('show');stopR();openEgg(hSt.egg,hSt.multi)}}
function openEgg(egg,multi){multi=multi||1;
 var cost=eggCost(egg)*multi;
 if(G.money<cost){toast('💸 Te falta dinero ($'+fmt(cost)+')','err');snd.err();return}
 G.money-=cost;selE=egg;
 hSt={egg:egg,multi:multi,cl:0,rev:false,bur:false,pet:null,paid:cost};
 el('eggTitle').textContent='Huevo '+ENAMES[egg];
 el('eggSub').textContent='Pagaste $'+fmt(cost)+(multi>1?' (x3)':'');
 el('eggBig').style.background=E3DG[egg]||'#999';
 el('eggHint').textContent='👆 Toca el huevo '+needTaps()+' veces';
 initCC();el('psuEggModal').classList.add('show');updateUI();save()}
function eggTap(){if(!hSt.egg||hSt.rev||hSt.bur)return;
 hSt.cl++;snd.crack(hSt.cl,needTaps());addCr(hSt.cl/needTaps());
 if(hSt.cl>=needTaps()){hSt.bur=true;drFull();snd.burst();el('eggHint').textContent='✨ ¡ECLOSIONANDO!';setTimeout(doReveal,480)}}
function cancelEgg(){if(hSt.cl===0&&!hSt.bur&&!hSt.rev&&hSt.paid){G.money+=hSt.paid;toast('↩️ Devuelto $'+fmt(hSt.paid),'inf')}
 el('psuEggModal').classList.remove('show');hSt={egg:null,multi:1,cl:0,rev:false,bur:false,pet:null,paid:0};updateUI()}
function doReveal(){var multi=hSt.multi||1,list=[],anyNew=false,bestR='common',bestP=null;
 var prevBest=0;for(var i=0;i<G.pets.length;i++){var v0=pE(G.pets[i]);if(v0>prevBest)prevBest=v0}
 for(var j=0;j<multi;j++){var def=roll(hSt.egg);var isNew=G.disc.indexOf(def.n)===-1;
  if(isNew)G.disc.push(def.n);
  var inst={ic:def.ic,n:def.n,r:def.r,be:def.e,lv:1,id:G.nid++,c:def.c,eg:(def.eg||[]).slice(),v:rollVariant()};
  G.pets.push(inst);list.push(inst);
  if(RORD[def.r]>RORD[bestR]){bestR=def.r;bestP=inst}}
 hSt.pet=list[0];hSt.rev=true;multiList=list;G.tot+=multi;
 var record=bestP&&pE(bestP)>prevBest&&G.pets.length>multi;
 el('psuEggModal').classList.remove('show');
 el('revNew').innerHTML=anyNew?'<span class="badge-new">✨ ¡NUEVO DESCUBRIMIENTO!</span>':'';
 if(multi===1&&list[0]){var p=list[0];
  el('revSphere3d').style.display='block';showR3D(p);
  el('revName').textContent=p.n;el('revName').style.color=RCOL[p.r];
  el('revRar').textContent=RNAME[p.r]+(p.v===2?' · 🌈 ARCOIRIS':p.v===1?' · ⭐ DORADA':'');el('revRar').style.color=RCOL[p.r];
  el('revInc').textContent='$'+fmt(pE(p))+'/s';el('revMulti').innerHTML='';spHP(p.r)}
 else{el('revSphere3d').style.display='none';stopR();
  el('revName').textContent=multi+' MASCOTAS!';el('revName').style.color='#fff';el('revRar').textContent='';el('revInc').textContent='';
  el('revMulti').innerHTML=list.map(function(pp){return'<div style="text-align:center;font-size:11px;font-weight:700">'+sphH(pp,'sm')+'<div style="color:'+RCOL[pp.r]+'">'+pp.n+'</div></div>'}).join('');spHP(bestR)}
 snd.hatch(bestR);if(record)coinBurst(16);
 var cost=eggCost(hSt.egg)*hSt.multi;
 el('btnRevAgain').textContent='🔁 Otra ($'+fmt(cost)+')';el('btnRevAgain').disabled=G.money<cost;
 el('psuRevModal').classList.add('show');
 if(navigator.vibrate&&RORD[bestR]>=5)navigator.vibrate(30);
 refHP();checkAchs();renderTab('pets');updateUI();save()}
function closeReveal(){el('psuRevModal').classList.remove('show');stopR();
 if(G.aon&&G.upg.auto>0&&G.money>=eggCost(hSt.egg)*hSt.multi)setTimeout(function(){openEgg(hSt.egg,hSt.multi)},450)}
function autoOpen(){if(!(G.aon&&G.upg.auto>0))return;
 var m=effMulti(),cost=eggCost(selE)*m;
 if(G.money<cost)return;
 G.money-=cost;var bestR='common',names=[];
 for(var j=0;j<m;j++){var def=roll(selE);var isNew=G.disc.indexOf(def.n)===-1;if(isNew)G.disc.push(def.n);
  G.pets.push({ic:def.ic,n:def.n,r:def.r,be:def.e,lv:1,id:G.nid++,c:def.c,eg:(def.eg||[]).slice(),v:rollVariant()});
  if(RORD[def.r]>RORD[bestR])bestR=def.r;names.push(def.n)}
 G.tot+=m;refHP();checkAchs();
 toast('⚡ Auto: '+names.join(', '),'inf');if(RORD[bestR]>=5)snd.hatch(bestR);
 updateUI();renderTab('pets');save()}

// ===== CLICK / REBIRTH =====
function clickVal(){return Math.max(15,tI()*.1)}
function doClick(){var v=clickVal();G.money+=v;G.te+=v;floatM(v);snd.click();bumpCombo();
 var b=el('btnBreak');if(b){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}}
function doRebirth(){var c=rbCo();
 if(G.money<c){toast('💸 Rebirth cuesta $'+fmt(c),'err');snd.err();return}
 showCf('♻️','¿Hacer REBIRTH?','Pierdes dinero y mascotas. Ganas +25% de ingreso PERMANENTE.',function(){
 hideCf();G.rb++;G.mult=1+G.rb*.25;G.money=25;G.dm=25;G.pets=[];G.nid=1;
 refHP();apTh();renderTab('pets');checkAchs();updateUI();save();
 coinBurst(25);snd.hatch('og');toast('♻️ REBIRTH #'+G.rb+' · x'+G.mult.toFixed(2),'god')})}
function buildGameControls(){var g=el('game');if(!g)return;
 if(!el('btnBreak')){var b=document.createElement('button');b.id='btnBreak';b.innerHTML='<span style="font-size:30px">💥</span><br><b id="clickValLbl">+$0</b><br><span style="font-size:9px;letter-spacing:2px;opacity:.7">TOCA</span>';
  b.style.cssText='width:130px;height:130px;border-radius:50%;border:none;cursor:pointer;color:#04121f;font-weight:900;background:radial-gradient(circle at 32% 28%,#fff8,transparent 42%),linear-gradient(145deg,var(--wa2,#7dd3fc),var(--wa,#22d3ee));box-shadow:0 12px 30px rgba(0,0,0,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;margin:14px auto;font-size:15px';
  b.addEventListener('pointerdown',function(e){e.preventDefault();doClick()});g.appendChild(b)}
 var row=document.createElement('div');row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:10px 0';
 row.innerHTML='<button class="btn gold" id="btnQuickEgg">🥚 Abrir</button><button class="btn gold" id="btnRebirth">♻️ Rebirth <span id="rbCostLbl"></span></button><button class="btn tgl" id="tglX3">x3: OFF</button><button class="btn tgl" id="tglAuto" style="display:none">⚡ Auto: OFF</button>';
 if(!el('btnQuickEgg'))g.appendChild(row);
 el('btnQuickEgg').onclick=function(){openEgg(selE,effMulti())};
 el('btnRebirth').onclick=doRebirth;
 el('tglX3').onclick=function(){G.x3=!G.x3;updateUI();renderTab('shop');save();snd.click()};
 el('tglAuto').onclick=function(){G.aon=!G.aon;updateUI();save();snd.click()};}

// ===== UPDATE UI =====
function updateUI(){
 var ids=['hMoney','money','moneyVal','cash'];ids.forEach(function(id){var e=el(id);if(e)e.textContent='$'+fmt(G.dm)});
 var ii=['hIncome','income','incVal'];ii.forEach(function(id){var e=el(id);if(e)e.textContent='$'+fmt(tI())+'/s'});
 var rr=['hRB','rbVal'];rr.forEach(function(id){var e=el(id);if(e)e.textContent=fmt(G.rb)});
 var cv=el('clickValLbl');if(cv)cv.textContent='+$'+fmt(clickVal());
 var rl=el('rbCostLbl');if(rl)rl.textContent='$'+fmt(rbCo());
 var tx=el('tglX3');if(tx){tx.textContent='x3: '+(G.x3?'ON':'OFF');tx.classList.toggle('on',G.x3)}
 var ta=el('tglAuto');if(ta){ta.style.display=G.upg.auto>0?'':'none';ta.textContent='⚡ Auto: '+(G.aon?'ON':'OFF');ta.classList.toggle('on',G.aon)}
 var qe=el('btnQuickEgg');if(qe)qe.textContent='🥚 Abrir '+ENAMES[selE]+(G.x3?' x3':'')+' · $'+fmt(eggCost(selE)*effMulti());
 if(evtCur)updateEvtBar()}
function hudLoop(){requestAnimationFrame(hudLoop);
 G.dm+=(G.money-G.dm)*.18;if(Math.abs(G.money-G.dm)<1)G.dm=G.money;
 var e=el('hMoney')||el('money');if(e)e.textContent='$'+fmt(G.dm)}

// ===== ACCIONES DE PANELES (delegación) =====
function sellPet(id){var p=null;for(var i=0;i<G.pets.length;i++)if(G.pets[i].id===id){p=G.pets[i]}if(!p)return;
 var v=sellVal(p);G.money+=v;G.pets.splice(G.pets.indexOf(p),1);snd.click();refHP();renderTab('pets');updateUI();save();toast('💰 +$'+fmt(v),'gold')}
function lvPet(id){var p=null;for(var i=0;i<G.pets.length;i++)if(G.pets[i].id===id){p=G.pets[i]}if(!p||p.lv>=25)return;
 var c=uCo(p);if(G.money<c){toast('💸 Te falta $'+fmt(c-G.money),'err');snd.err();return}
 G.money-=c;p.lv++;snd.hatch('epic');renderTab('pets');updateUI();save();toast('⬆️ '+p.n+' Nv'+p.lv,'gold')}
function bulkSell(r){var list=G.pets.filter(function(p){return p.r===r});if(!list.length)return;
 var sum=0;list.forEach(function(p){sum+=sellVal(p)});
 showCf('💰','Vender '+list.length+' '+RNAME[r],'Ganarás $'+fmt(sum),function(){
 G.pets=G.pets.filter(function(p){return p.r!==r});G.money+=sum;refHP();renderTab('pets');updateUI();save();hideCf();coinBurst(10);snd.burst();toast('💰 +$'+fmt(sum),'gold')})}
function unlockWorld(id){var w=null;for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===id)w=WORLDS[i];if(!w||isUW(id))return;
 if(G.money<w.cost){toast('💸 Necesitas $'+fmt(w.cost),'err');snd.err();return}
 showCf('🗺️','Desbloquear '+w.name,'Coste: $'+fmt(w.cost),function(){
 if(G.money<w.cost){hideCf();return}
 G.money-=w.cost;G.uw.push(id);hideCf();snd.world();coinBurst(16);toast('🗺️ ¡'+w.name+' desbloqueado!','gold');apTh();renderTab('worlds');renderTab('shop');checkAchs();updateUI();save()})}
function buyUpg(id){var u=null;for(var i=0;i<UPGS.length;i++)if(UPGS[i].id===id)u=UPGS[i];if(!u)return;
 var lvl=G.upg[id];if(lvl>=u.max)return;var cost=u.co(lvl);
 if(G.money<cost){toast('💸 Te falta $'+fmt(cost-G.money),'err');snd.err();return}
 G.money-=cost;G.upg[id]++;snd.hatch('epic');coinBurst(6);toast('⬆️ '+u.n+' Nv'+G.upg[id],'gold');renderTab('upgs');checkAchs();updateUI();save()}

// ═══════════ 🔑 ADMIN (tus rules) ═══════════
var FB={app:null,auth:null,db:null,ok:false,M:{}};
function fbInit(){if(FB.ok)return true;
 try{var app=null;try{app=getApps().length?getApps()[0]:null}catch(e){}
 if(!app&&FIREBASE_CONFIG)app=initializeApp(FIREBASE_CONFIG);
 if(!app)return false;
 FB.app=app;FB.auth=getAuth(app);FB.db=getDatabase(app);
 FB.M={ref:ref,onValue:onValue,runTransaction:runTransaction,set:set,remove:remove,onAuthStateChanged:onAuthStateChanged};
 FB.ok=true}catch(e){console.warn('[PSU-admin]',e.message)}
 return FB.ok}
function fbSet(path,val,msg){if(!FB.ok||!IS_SUPER)return;
 try{FB.M.set(FB.M.ref(FB.db,path),val).then(function(){toast(msg,'gold')}).catch(function(){toast('❌ Sin permiso (rules)','err')})}catch(e){}}
function webAnnounce(t){if(!t)return;fbSet('adminBroadcast/text',t,'📣 Anuncio publicado')}
function webMult(m){fbSet('adminBroadcast/globalMult',Math.max(1,m||1),'🌐 Mult GLOBAL x'+m)}
function webPubCode(n,t,v){n=(''+n).trim().toUpperCase();if(!n)return;
 var rw=t==='money'?{t:'money',v:v}:t==='rb'?{t:'rb',v:v}:t==='pet'?{t:'pet',r:'god',v:1}:{t:'fever',v:v};
 fbSet('adminBroadcast/codes/'+n,rw,'🎟️ Código '+n+' publicado')}
function webBan(uid){if(uid)fbSet('bannedUsers/'+uid,true,'🚫 Baneado')}
function webUnban(uid){if(uid)fbSet('bannedUsers/'+uid,null,'✅ Desbaneado')}
function webMant(on){fbSet('maintenance/psuGame',on?{on:true,msg:el('admAnn')?el('admAnn').value:''}:null,on?'🛠️ Mantenimiento ON':'🛠️ OFF')}

function setAdm(a,s){a=!!a;s=!!s&&a;if(a===IS_ADM&&s===IS_SUPER)return;
 IS_ADM=a;IS_SUPER=s;
 var b=el('psuAdmBtn');if(b)b.style.display=a?'block':'none';
 var sec=el('admSec');if(sec)sec.style.display=a?'':'none';
 var sup=el('supSec');if(sup)sup.style.display=s?'':'none';
 if(a){toast('👑 ¡ADMIN detectado! (🛡️ o tecla A)','god');snd.world()}else{var p=el('psuAdmPanel');if(p)p.classList.remove('open')}
 renderBuffs();renderTab('extras')}
function watchFB(){
 if(!FB.ok)return;
 FB.M.onAuthStateChanged(FB.auth,function(u){ME=u||null;
  if(!u||!u.email){setAdm(false,false);return}
  var em=(''+u.email).toLowerCase();
  setAdm(ADMIN_EMAILS.indexOf(em)!==-1,SUPER_EMAILS.indexOf(em)!==-1)});
 FB.M.onValue(FB.M.ref(FB.db,'adminBroadcast'),function(s){var v=s.val();if(!v)return;
  if(v.text)showBanner(v.text);if(v.globalMult!=null){G.webMult=(+v.globalMult)||1;renderBuffs();updateUI()}
  if(v.codes)window.__psuSrvCodes=v.codes},function(){});
 FB.M.onValue(FB.M.ref(FB.db,'adminBroadcast/codes'),function(s){window.__psuSrvCodes=s.val()||{}},function(){});
 FB.M.onValue(FB.M.ref(FB.db,'adminBroadcast/globalMult'),function(s){G.webMult=(+s.val())||1;renderBuffs();updateUI()},function(){});
 FB.M.onValue(FB.M.ref(FB.db,'bannedUsers'),function(s){var v=s.val();
  if(ME&&v&&v[ME.uid])showOv('psuBanOv','<div style="font-size:44px">🚫</div><h2>Estás baneado</h2><p>Contacta con un administrador.</p>');
  else hideOv('psuBanOv')},function(){});
 FB.M.onValue(FB.M.ref(FB.db,'maintenance'),function(s){var v=s.val();var act=false,msg='';
  if(v){if(v.on===true){act=true;msg=v.msg||''}else{for(var k in v){if(v[k]&&v[k].on){act=true;msg=v[k].msg||'';break}}}}
  if(act&&ME)showOv('psuMantOv','<div style="font-size:44px">🛠️</div><h2>Mantenimiento</h2><p>'+esc(msg||'Volvemos en un rato')+'</p>');
  else hideOv('psuMantOv')},function(){})}
function showOv(id,html){var o=el(id);if(!o){o=document.createElement('div');o.id=id;o.className='psu-ov';document.body.appendChild(o)}o.innerHTML='<div class="psu-ovc">'+html+'</div>';o.style.display='flex'}
function hideOv(id){var o=el(id);if(o)o.style.display='none'}
function showBanner(txt){var b=ensureEl('psuBanner');if(!txt){b.style.display='none';return}
 b.innerHTML='📢 '+esc(txt)+'<button class="bx">✕</button>';b.style.display='block';
 b.querySelector('.bx').onclick=function(){b.style.display='none'}}
function buildAdminUI(){
 // botones flotantes
 var wa=ensureEl('psuAdmBtn');wa.textContent='🛡️';wa.title='Panel Admin (A)';wa.style.display='none';wa.onclick=function(){el('psuAdmPanel').classList.toggle('open')};
 var wc=ensureEl('psuCodeBtn');wc.textContent='🎟️';wc.title='Códigos';
 wc.onclick=function(){switchTab('extras')};
 // panel
 var p=document.createElement('div');p.id='psuAdmPanel';document.body.appendChild(p);
 p.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="color:#fbbf24">🛡️ PANEL ADMIN</b><button class="ab" id="admX">✕</button></div>'
 +'<div id="admSec" style="display:none">'
 +'<div class="ah">👤 '+(ME?esc(ME.email):'')+'</div>'
 +'<div class="ah">💰 Dinero</div><div class="arow"><input id="admMoney" placeholder="1e12 · 50b · 3t" value="1e9"></div><div class="arow"><button class="ab g" data-a="addM">➕ Añadir</button><button class="ab g" data-a="setM">= Fijar</button></div>'
 +'<div class="ah">🐾 Mascotas</div><div class="arow"><select id="admRar">'+RKEYS.map(function(r){return'<option value="'+r+'">'+RNAME[r]+'</option>'}).join('')+'</select><input id="admQty" style="max-width:50px" value="1"><button class="ab" data-a="pet">Dar</button></div><div class="arow"><button class="ab" data-a="dex">📖 Dex 100%</button><button class="ab" data-a="wipe">🗑️ Borrar pets</button></div>'
 +'<div class="ah">⚡ Poder</div><div class="arow"><button class="ab" data-a="upg">⬆️ Max mejoras</button><button class="ab" data-a="worlds">🗺️ Mundos</button></div><div class="arow"><input id="admMult" placeholder="Mult" value="10"><button class="ab" data-a="mult">✖️</button></div><div class="arow"><input id="admRb" placeholder="Rebirths" value="50"><button class="ab" data-a="rb">♻️</button></div>'
 +'<div class="ah">🎉 Eventos</div><div class="arow"><select id="admEvt">'+EVENTS.map(function(e){return'<option value="'+e.id+'">'+e.n+'</option>'}).join('')+'</select><button class="ab" data-a="evt">▶️</button></div>'
 +'<div class="ah">😈</div><div class="arow"><button class="ab r" data-a="god">Dios x1M</button><button class="ab r" data-a="ungod">Normal</button></div>'
 +'</div>'
 +'<div id="supSec" style="display:none">'
 +'<div class="ah">🌐 WEB · para TODOS</div>'
 +'<div class="arow"><input id="admAnn" placeholder="Anuncio global..."><button class="ab g" data-a="announce">📣</button></div>'
 +'<div class="arow"><input id="admGM" placeholder="Mult global" value="2"><button class="ab g" data-a="gMult">🌐 ON</button><button class="ab r" data-a="gMultOff">OFF</button></div>'
 +'<div class="ah">🎟️ Publicar código</div><div class="arow"><input id="admCn" placeholder="NOMBRE" maxlength="12"></div><div class="arow"><select id="admCt"><option value="money">💰 Dinero</option><option value="rb">♻️ RB</option><option value="pet">🐾 Pet Dios</option><option value="fever">🔥 Fiebre</option></select><input id="admCv" value="1000000"><button class="ab g" data-a="pubCode">OK</button></div>'
 +'<div class="ah">🚫 Moderación</div><div class="arow"><input id="admBan" placeholder="UID jugador"><button class="ab r" data-a="ban">🚫</button><button class="ab" data-a="unban">✅</button></div>'
 +'<div class="arow"><button class="ab r" data-a="mantOn">🛠️ Mant. ON</button><button class="ab" data-a="mantOff">OFF</button></div>'
 +'</div>';
 el('admX').onclick=function(){p.classList.remove('open')};
 p.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;var a=b.dataset.a;snd.click();
  var V=function(id){var x=el(id);return x?x.value:''};
  if(a==='addM'){G.money+=toNum(V('admMoney'));G.dm=G.money;toast('💰 +$'+fmt(G.money),'gold');updateUI();save()}
  else if(a==='setM'){G.money=toNum(V('admMoney'));G.dm=G.money;toast('💵 $'+fmt(G.money),'gold');updateUI();save()}
  else if(a==='pet')givePets(V('admRar'),toNum(V('admQty')));
  else if(a==='dex'){G.disc=PETS.map(function(x){return x.n});toast('📖 100%','god');renderTab('pets');save()}
  else if(a==='upg'){G.upg={luck:10,inc:10,disc:5,fast:4,auto:3};toast('⬆️ MAX','god');renderTab('upgs');updateUI();save()}
  else if(a==='worlds'){G.uw=WORLDS.map(function(w){return w.id});apTh();toast('🗺️ Todos','god');renderTab('worlds');updateUI();save()}
  else if(a==='mult'){G.mult=Math.max(1,toNum(V('admMult'))||1);toast('✖️ x'+fmt(G.mult),'god');updateUI();save()}
  else if(a==='rb'){G.rb=toNum(V('admRb'))|0;G.mult=1+G.rb*.25;toast('♻️ '+fmt(G.rb),'gold');updateUI();save()}
  else if(a==='evt'){var id=V('admEvt');var ev=null;for(var i=0;i<EVENTS.length;i++)if(EVENTS[i].id===id)ev=EVENTS[i];
   if(ev){if(evtCur)endEvent();evtCur=ev;evtEnd=Date.now()+ev.dur*1000;try{ev.apply()}catch(e){}ensureEl('evtBar');updateEvtBar();
    if(evtT)clearInterval(evtT);evtT=setInterval(function(){if(!evtCur){clearInterval(evtT);evtT=null;return}if(Date.now()>=evtEnd)endEvent();else updateEvtBar()},1000);
    toast('🎉 Forzado: '+ev.n,'god');renderBuffs()}}
  else if(a==='god'){G.mult=1e6;toast('😈 x1M','god');updateUI();save()}
  else if(a==='ungod'){G.mult=1;toast('😇 x1','god');updateUI();save()}
  else if(a==='wipe'){showCf('🗑️','Borrar mascotas','¿Seguro?',function(){G.pets=[];refHP();renderTab('pets');updateUI();save();hideCf()})}
  else if(a==='announce')webAnnounce(V('admAnn'));
  else if(a==='gMult')webMult(toNum(V('admGM')));
  else if(a==='gMultOff')webMult(1);
  else if(a==='pubCode')webPubCode(V('admCn'),V('admCt'),Math.max(1,toNum(V('admCv'))||1));
  else if(a==='ban')webBan(V('admBan').trim());
  else if(a==='unban')webUnban(V('admBan').trim());
  else if(a==='mantOn')webMant(true);
  else if(a==='mantOff')webMant(false)});
 addEventListener('keydown',function(e){var t=e.target;if(t&&/^(input|textarea|select)$/i.test(t.tagName))return;
  if((e.key||'').toLowerCase()==='a'&&IS_ADM)el('psuAdmPanel').classList.toggle('open')});
 try{if(localStorage.getItem('psu_admin_dev')==='1')setAdm(true,true)}catch(e){} // ⚠️ flag dev (borra en producción)
}

// ===== TICK PRINCIPAL =====
var tickN=0;
function tick1s(){tickN++;
 var inc=tI();G.money+=inc;G.te+=inc;
 boostActive=Date.now()<G.boostUntil;
 G.playtime++;
 tickQuests();checkAchs();
 if(tickN%5===0){updRk();if(aTab==='rank')renderRk()}
 if(aTab==='extras'&&tickN%3===0)renderExtras();
 if(aTab==='pets'&&tickN%10===0)renderPets();
 if(tickN%25===0)save();
 renderBuffs();
 if(tickN%2===0)updateUI()}

// ===== BIND GLOBAL =====
function bindUI(){
 document.addEventListener('pointerdown',function(){snd.go()},true);
 document.addEventListener('pointerdown',function(e){var t=e.target;
  if(t.closest&&t.closest('.psu-panel,.modal,.psu-ov,#psuAdmPanel,#psuTabs,#topbar,#tabs,button,input,select,textarea,a,.toast,#psuBanner,#goldEggBtn'))return;
  bumpCombo()});
 // delegación paneles
 document.body.addEventListener('click',function(e){
  var ob=e.target.closest('[data-open]');if(ob){openEgg(ob.dataset.open,effMulti());return}
  var sl=e.target.closest('[data-sell]');if(sl){sellPet(+sl.dataset.sell);return}
  var lv=e.target.closest('[data-lv]');if(lv&&!lv.disabled){lvPet(+lv.dataset.lv);return}
  var fu=e.target.closest('[data-fuse]');if(fu&&!fu.disabled){fuse(fu.dataset.fuse);return}
  var bk=e.target.closest('[data-bulk]');if(bk){bulkSell(bk.dataset.bulk);return}
  var un=e.target.closest('[data-unlock]');if(un){unlockWorld(un.dataset.unlock);return}
  var go=e.target.closest('[data-go]');if(go){G.world=go.dataset.go;apTh();renderTab('worlds');save();snd.world();toast('✈️ '+gW().name,'inf');updateUI();return}
  var up=e.target.closest('[data-upg]');if(up){buyUpg(up.dataset.upg);return}});
 addEventListener('resize',rsH);
 addEventListener('keydown',function(e){var t=e.target;if(t&&/^(input|textarea|select)$/i.test(t.tagName))return;
  var k=(e.key||'').toLowerCase();
  if(k==='m'){G.mut=!G.mut;toast(G.mut?'🔇 OFF':'🔊 ON','inf');updateUI()}
  else if(k==='s'){save();toast('💾 Guardado','inf')}
  else if(k==='escape'){document.querySelectorAll('.modal.show').forEach(function(m){m.classList.remove('show')});stopR();var p=el('psuAdmPanel');if(p)p.classList.remove('open')}
  else if(k>='1'&&k<='9'){var d=TABDEFS[+k-1];if(d)switchTab(d[0])}});
 addEventListener('beforeunload',function(){try{save()}catch(e){}});
 document.addEventListener('visibilitychange',function(){if(document.hidden){try{save()}catch(e){}}})}

// ===== CSS INYECTADO (solo para lo nuevo) =====
(function injectCSS(){var st=document.createElement('style');st.textContent=
'#psuTabs{position:fixed;bottom:0;left:0;right:0;z-index:8800;display:flex;gap:4px;padding:7px 8px calc(7px + env(safe-area-inset-bottom));background:rgba(6,12,24,.92);backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,.1);overflow-x:auto;scrollbar-width:none}#psuTabs::-webkit-scrollbar{display:none}.ptab{flex:0 0 auto;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#cfe0f5;padding:7px 12px;border-radius:18px;font-size:12.5px;cursor:pointer;font-family:inherit}.ptab.on{background:var(--wa,#22d3ee);color:#04121f;font-weight:800;border-color:transparent}.psu-panel{position:fixed;top:56px;left:50%;transform:translateX(-50%);width:min(94vw,760px);max-height:calc(100vh - 150px);overflow-y:auto;z-index:8000;background:rgba(8,14,28,.96);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;backdrop-filter:blur(10px)}.ph{font-size:16px;margin:4px 0 10px;color:var(--wa,#22d3ee)}.ph2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--wa2,#7dd3fc);margin:14px 0 8px}.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px;margin-bottom:10px}.btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#fff;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}.btn:hover{background:rgba(255,255,255,.16)}.btn.gold{background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#231a00;border:none;font-weight:800}.btn.danger{background:rgba(239,68,68,.16);border-color:rgba(239,68,68,.4);color:#fca5a5}.btn.sm{padding:5px 10px;font-size:11px;border-radius:8px}.btn:disabled{opacity:.4;cursor:not-allowed}.btn.tgl.on{background:var(--wa,#22d3ee);color:#04121f}.inp{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:9px;padding:9px 11px;font-size:13px;outline:none;font-family:inherit}.modal{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;background:rgba(2,6,14,.75);backdrop-filter:blur(6px);padding:16px}.modal.show{display:flex}.mbox{background:linear-gradient(160deg,#0d1830,#0a1224);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:20px;max-width:380px;width:100%;text-align:center;position:relative;box-shadow:0 24px 70px rgba(0,0,0,.6)}.m-x{position:absolute;top:10px;right:12px;background:none;border:none;color:#8899aa;font-size:16px;cursor:pointer}.egg-stage{position:relative;width:220px;height:280px;margin:10px auto;cursor:pointer}#eggBig{position:absolute;left:50%;top:50%;width:170px;height:215px;transform:translate(-50%,-50%);border-radius:50% 50% 50% 50%/58% 58% 42% 42%;box-shadow:inset -10px -14px 24px rgba(0,0,0,.35),inset 10px 12px 20px rgba(255,255,255,.25),0 16px 40px rgba(0,0,0,.5)}.egg-stage:active #eggBig{transform:translate(-50%,-50%) scale(.94)}#crackCanvas,#hatchCanvas{position:absolute;left:0;top:0;width:220px;height:280px;pointer-events:none}#crackCanvas{z-index:3}#hatchCanvas{z-index:4}.hint{color:#8fa3b8;font-size:12px;margin-top:8px;line-height:1.5}.egg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.egg-card{text-align:center}.egg-visual{width:60px;height:78px;margin:6px auto 4px;border-radius:50% 50% 50% 50%/58% 58% 42% 42%;box-shadow:inset -6px -10px 16px rgba(0,0,0,.35),inset 6px 8px 14px rgba(255,255,255,.25)}.egg-name{font-size:12.5px;font-weight:700}.egg-price{font-size:13px;font-weight:800;color:#fde047;margin:2px 0 6px}.rchips{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:8px}.rchip{font-size:9px;padding:2px 6px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid;font-weight:700}.evchip{display:inline-block;background:rgba(251,191,36,.14);border:1px solid rgba(251,191,36,.4);color:#fde047;font-size:12px;font-weight:800;padding:6px 14px;border-radius:12px;margin-bottom:10px}.wsep{font-weight:800;font-size:13.5px;color:var(--wa2,#7dd3fc);margin:16px 0 8px}.wbchip{font-size:10.5px;background:rgba(255,255,255,.08);color:var(--wa,#22d3ee);padding:2px 8px;border-radius:10px}.lk{color:#fbbf24;font-size:11.5px}.dim{opacity:.45}.pet-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:10px}.pet-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px 6px 8px;display:flex;flex-direction:column;align-items:center}.pet-name{font-size:11.5px;font-weight:700;margin-top:4px;text-align:center}.pet-rar{font-size:9.5px;font-weight:800;letter-spacing:1px}.pet-inc{font-size:10.5px;color:#7ee2a8}.sell{font-size:10px;background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.4);color:#fca5a5;border-radius:8px;padding:3px 8px;cursor:pointer;font-family:inherit}.sell:disabled{opacity:.4}.world-card,.upg-card,.ach-row{display:flex;align-items:center;gap:12px}.w-ic,.u-ic,.a-ic{font-size:22px;width:48px;height:48px;flex:none;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);border-radius:14px}.w-info,.u-info,.a-info{flex:1;min-width:0}.w-name,.u-name,.a-name{font-weight:800;font-size:14px}.w-desc,.u-desc,.a-desc{font-size:11.5px;color:#8fa3b8;margin-top:2px}.w-right{flex:none}.lvl{font-size:11px;color:#8fa3b8}.fx{font-size:12px;color:#7ee2a8;margin-top:2px}.tag{font-size:10px;padding:3px 9px;border-radius:8px;font-weight:800}.tag.here{background:rgba(52,211,153,.2);color:#6ee7b7}.ach-row.done{border-color:rgba(251,191,36,.4)}.rw{color:#fbbf24;font-size:11px;font-weight:700}.pbar{height:7px;background:rgba(255,255,255,.09);border-radius:5px;overflow:hidden;margin:6px 0 3px}.pfill{height:100%;background:linear-gradient(90deg,var(--wa,#22d3ee),var(--wa2,#7dd3fc));transition:width .4s}.fu-row,.st-row{display:flex;justify-content:space-between;align-items:center;padding:7px 2px;border-bottom:1px dashed rgba(255,255,255,.08);font-size:12.5px;gap:8px}.st-row b{color:var(--wa2,#7dd3fc);text-align:right}.rk-i{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:8px 10px;margin-bottom:8px}.rk-i.me{border-color:var(--wa,#22d3ee);background:rgba(34,211,238,.08)}.rk-pos{width:34px;height:34px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;background:rgba(255,255,255,.08);font-size:13px}.rk-pos.p1{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#231a00}.rk-pos.p2{background:linear-gradient(135deg,#e2e8f0,#94a3b8);color:#1e293b}.rk-pos.p3{background:linear-gradient(135deg,#d97706,#92400e);color:#fff}.rk-body{flex:1;min-width:0}.rk-top{display:flex;justify-content:space-between;font-weight:700;font-size:13px}.rk-you{color:#fbbf24;font-size:10px}.rk-bot{display:flex;justify-content:space-between;font-size:11px;color:#8fa3b8;margin-top:2px}.rk-sep{text-align:center;color:#5b6b7d;letter-spacing:4px;margin:6px 0}.rk-total{text-align:center;color:#8fa3b8;font-size:11px;margin-top:10px}.rk-head2{display:flex;justify-content:space-between;align-items:center}#psuBanner{position:fixed;top:0;left:0;right:0;z-index:9800;display:none;padding:9px 40px 9px 14px;text-align:center;font-weight:700;font-size:13px;color:#04121f;background:linear-gradient(90deg,#22d3ee,#7dd3fc)}#psuBanner .bx{position:absolute;right:12px;top:6px;background:none;border:0;font-size:15px;cursor:pointer;color:#04121f}#buffBar{position:fixed;top:8px;left:8px;z-index:9600;display:flex;gap:6px;flex-wrap:wrap;max-width:60vw;pointer-events:none}.buff{background:rgba(10,16,30,.85);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:4px 10px;font-size:12px;font-weight:700;color:#fff;backdrop-filter:blur(6px)}#comboBar{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9500;display:none;text-align:center;pointer-events:none}#comboBar .cb-t{font-weight:900;font-size:20px;color:#fbbf24;text-shadow:0 0 14px rgba(251,191,36,.7)}#comboBar .cb-b{width:140px;height:5px;background:rgba(255,255,255,.12);border-radius:4px;margin:4px auto 0;overflow:hidden}#comboBar .cb-f{height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24)}#evtBar{position:fixed;top:44px;left:50%;transform:translateX(-50%);z-index:9400;display:none;padding:8px 16px;border-radius:14px;background:rgba(124,58,237,.25);border:1px solid rgba(124,58,237,.5);font-weight:700;font-size:13px;color:#fff;gap:6px;align-items:center}.coinP{position:fixed;z-index:9700;font-size:20px;pointer-events:none;animation:psuCoin 1.3s ease-in forwards}@keyframes psuCoin{to{transform:translateY(45vh) rotate(660deg);opacity:0}}@keyframes psuFloat{50%{transform:translateY(-14px) rotate(9deg)}}.fm{position:absolute;z-index:60;color:#fde047;font-weight:900;font-size:16px;text-shadow:0 2px 8px rgba(0,0,0,.6);pointer-events:none;animation:psuFm 1.2s ease-out forwards}@keyframes psuFm{to{transform:translateY(-90px);opacity:0}}#toasts{position:fixed;bottom:64px;left:50%;transform:translateX(-50%);z-index:9900;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;width:min(92vw,430px)}.toast{background:rgba(8,14,26,.93);border:1px solid rgba(255,255,255,.15);color:#fff;padding:10px 16px;border-radius:14px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.5);max-width:100%}.t-gold{border-color:rgba(251,191,36,.7);color:#fde68a}.t-err{border-color:rgba(239,68,68,.7);color:#fca5a5}.t-god{border-color:rgba(192,132,252,.7);color:#e9d5ff;box-shadow:0 0 20px rgba(192,132,252,.35)}.badge-new{display:inline-block;background:#fbbf24;color:#231a00;font-weight:900;font-size:11px;padding:3px 12px;border-radius:12px;margin:4px 0}.sph{--rc:#9ca3af;--gl:transparent;position:relative;border-radius:50%;border:2.5px solid var(--rc);background:#0b1322;box-shadow:0 4px 10px rgba(0,0,0,.5),0 0 12px var(--gl),inset 0 -8px 14px rgba(0,0,0,.5);width:72px;height:72px;flex:none}.sph-base{position:absolute;inset:3px;border-radius:50%}.sph-light{position:absolute;left:16%;top:10%;width:34%;height:24%;background:radial-gradient(ellipse at center,rgba(255,255,255,.75),transparent 70%);border-radius:50%;transform:rotate(-20deg)}.sph-icon{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.6)}.sph-shadow{position:absolute;left:15%;right:15%;bottom:-7px;height:8px;background:rgba(0,0,0,.4);border-radius:50%;filter:blur(2px)}.sph-xs{width:46px;height:46px}.sph-xs .sph-icon{font-size:17px}.sph-sm{width:60px;height:60px}.sph-sm .sph-icon{font-size:22px}.sph.common{--rc:#9ca3af;--gl:rgba(156,163,175,.25)}.sph.rare{--rc:#38bdf8;--gl:rgba(56,189,248,.3)}.sph.epic{--rc:#c084fc;--gl:rgba(192,132,252,.35)}.sph.god{--rc:#fbbf24;--gl:rgba(251,191,36,.45)}.sph.legendary{--rc:#f87171;--gl:rgba(248,113,113,.4)}.sph.mythic{--rc:#f472b6;--gl:rgba(244,114,182,.45)}.sph.secret{--rc:#22d3ee;--gl:rgba(34,211,238,.5)}.sph.og{--rc:#fbbf24;--gl:rgba(251,191,36,.9);animation:psuOg 1.4s ease-in-out infinite alternate}@keyframes psuOg{to{transform:scale(1.07)}}.sph.gld{--rc:#fbbf24;--gl:rgba(251,191,36,.8)}.sph.rbw{animation:psuHue 4s linear infinite}@keyframes psuHue{to{filter:hue-rotate(360deg)}}#psuAdmBtn,#psuCodeBtn{position:fixed;right:14px;z-index:9900;width:50px;height:50px;border-radius:50%;border:2px solid #fbbf24;background:rgba(20,14,2,.94);color:#fde047;font-size:22px;cursor:pointer;box-shadow:0 0 16px rgba(251,191,36,.45);transition:.15s;display:block}#psuAdmBtn{bottom:14px}#psuCodeBtn{bottom:74px;border-color:#22d3ee;color:#67e8f9;box-shadow:0 0 14px rgba(34,211,238,.35)}#psuAdmBtn:hover,#psuCodeBtn:hover{transform:scale(1.1)}#psuAdmPanel{position:fixed;top:0;right:-350px;width:330px;max-height:100vh;overflow-y:auto;background:rgba(10,10,18,.97);border-left:2px solid #fbbf24;z-index:9910;padding:14px;transition:right .25s;color:#eee;font-size:13px}#psuAdmPanel.open{right:0}.ah{margin:12px 0 5px;color:#fbbf24;font-size:11px;letter-spacing:1.5px;text-transform:uppercase}.arow{display:flex;gap:6px;margin-bottom:6px}.arow input,.arow select{flex:1;min-width:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#fff;border-radius:8px;padding:7px 9px;font-size:12px;outline:none}.ab{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:8px;padding:7px 10px;font-size:12px;cursor:pointer;white-space:nowrap;font-family:inherit}.ab:hover{background:#fbbf24;color:#231a00}.ab.g{background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#231a00;font-weight:700;border:0}.ab.r{background:rgba(239,68,68,.18);border-color:rgba(239,68,68,.4);color:#fca5a5}.psu-ov{position:fixed;inset:0;z-index:9995;background:rgba(2,4,10,.94);display:none;align-items:center;justify-content:center;color:#fff;text-align:center}.psu-ovc{background:#0d1424;border:1px solid #ef4444;border-radius:18px;padding:26px;max-width:340px}#goldEggBtn{animation:psuFloat 2s ease-in-out infinite}@media(max-width:640px){.psu-panel{width:96vw;top:50px;max-height:calc(100vh - 140px)}}';
document.head.appendChild(st)})();

// ===== BOOT =====
load();G.dm=G.money;ensureQuests();
initBg();apTh();
buildEggModal();buildRevModal();ensureConfirm();
initH3D();initR3D();refHP();initRk();
buildTabs();buildPanels();buildGameControls();
bindUI();switchTab('game');updateUI();renderBuffs();
buildAdminUI();
if(fbInit())watchFB();else setTimeout(function(){if(fbInit())watchFB()},2000);
checkOffline();
setInterval(tick1s,1000);
setInterval(function(){if(!evtCur&&Math.random()<.4)startEvent()},45000);
setInterval(autoOpen,900);
hudLoop();
window.__psu={G:function(){return G},setAdm:setAdm};
toast('🐾 ¡Pet Simulator ULTRA v39 listo! [1-9] tabs · [G] códigos · [S] guardar','gold');
