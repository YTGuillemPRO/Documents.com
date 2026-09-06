import * as THREE from 'three';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, runTransaction, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
// ===== NUEVAS: JUNGLA =====
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
// ===== NUEVAS: DESIERTO =====
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
// ===== NUEVAS: TUNDRA =====
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
// ===== NUEVAS: CEMENTERIO =====
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
// ===== NUEVAS: DULCES =====
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
// ===== NUEVAS: NEON =====
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
// ===== NUEVAS: DRAGONICO =====
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
// ===== NUEVAS: ETERNO =====
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

// ===== PRECIOS BASE DE HUEVOS =====
function defPr(){return{basico:10,dorado:500,campestre:2000,arcano:20000,salvaje:8000,toxico:6e4,marino:5e4,abisal:4e5,dunas:3e5,faraon:2e6,cristalino:2e6,gema:15e6,glacial:3e7,polar:1.2e8,magmatico:8e6,infernal:5e8,tumba:1e9,maldito:5e9,divino:5e9,ancestral:3e10,goloso:3e10,pastel:1.5e11,neon:1.2e11,virtual:8e11,cosmico:3e11,estelar:2e12,umbral:2e13,absoluto:2e14,draconico:3e12,wyrm:1.6e13,eterno:4e14,omega:2e15}}

// ===== ESTADO =====
var G={money:10,dm:10,rb:0,mult:1,pets:[],disc:[],pr:defPr(),uw:['bosque'],tot:0,te:0,mut:false,nid:1,pn:'Mi Base',ao:false,aon:false,world:'bosque',x3:false,upg:{luck:0,inc:0,disc:0,fast:0,auto:0},achs:[],lastDaily:0,dailyStreak:0,lastSeen:0,boostUntil:0};
var selE='basico',rbC=false,rbT=null,aTab='game',cfCb=null,hSt={pet:null,cl:0,rev:false,bur:false};
var boostActive=false,boostTimeout=null;
var eventMult=1,luckyBoost=false,eggSale=false,evtCur=null,evtEnd=0,evtT=null,multiList=null;

// ===== UTILIDADES =====
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
function toast(m,t){var c=document.getElementById('toasts'),e=document.createElement('div');e.className='toast t-'+(t||'inf');e.textContent=m;c.appendChild(e);setTimeout(function(){e.remove()},3000)}
function floatM(a){var e=document.createElement('div');e.className='fm';e.textContent='+$'+fmt(a);e.style.left=(Math.random()*130+90)+'px';e.style.top='170px';document.getElementById('game').appendChild(e);setTimeout(function(){e.remove()},1200)}
function showCf(i,t,m,cb){document.getElementById('confirmIcon').textContent=i;document.getElementById('confirmTitle').textContent=t;document.getElementById('confirmMsg').textContent=m;cfCb=cb;document.getElementById('confirmBox').classList.add('show')}
function hideCf(){document.getElementById('confirmBox').classList.remove('show');cfCb=null}
function gW(){for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===G.world)return WORLDS[i];return WORLDS[0]}
function isUW(w){return G.uw.indexOf(w)!==-1}
function eggCost(e){return Math.floor(G.pr[e]*(1-(G.upg?G.upg.disc:0)*.04-(eggSale?.5:0)))}
function rollVariant(){var r=Math.random();if(r<.002)return 2;if(r<.012)return 1;return 0}
function pE(p){return(p.be||1)*(1+.2*((p.lv||1)-1))*(p.v===2?3:p.v===1?1.6:1)*(G.mult||1)*(gW().bonus||1)*(boostActive?2:1)*(1+(G.upg?G.upg.inc:0)*.1)}
function tI(){var s=0;for(var i=0;i<G.pets.length;i++)s+=pE(G.pets[i]);return s*eventMult}
function rbCo(){return Math.floor(5e5*Math.pow(2,G.rb))}
function uCo(p){return Math.floor((p.be||1)*25*(p.lv||1))}
function sphH(p,sz){var c=sz==='xs'?'sph-xs':'sph-sm',v=p.v===2?' rbw':p.v===1?' gld':'';return'<div class="sph '+p.r+' '+c+v+'"><div class="sph-base" style="background-color:'+p.c+'"></div><div class="sph-light"></div><div class="sph-icon"><i class="'+p.ic+'"></i></div><div class="sph-shadow"></div></div>'}

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
function initCC(){var c=document.getElementById('crackCanvas');c.width=CW;c.height=CH;crCx=c.getContext('2d');crD=[];crCx.clearRect(0,0,CW,CH)}
function gCr(pr){var sx=.15+Math.random()*.7,sy=.1+Math.random()*.8,a=Math.random()*Math.PI*2,sg=[],br=[],cx=sx,cy=sy;var ns=3+Math.floor(Math.random()*(2+pr*4)),sl=.04+pr*.1;for(var j=0;j<ns;j++){a+=(Math.random()-.5)*1.6;cx+=Math.cos(a)*sl;cy+=Math.sin(a)*sl;cx=Math.max(.03,Math.min(.97,cx));cy=Math.max(.03,Math.min(.97,cy));sg.push({x:cx,y:cy});if(Math.random()<.3+pr*.5){var ba=a+(Math.random()>.5?1:-1)*(.5+Math.random()*.9),bl=sl*(.25+Math.random()*.5)*(.5+pr*.5);br.push({fx:cx,fy:cy,tx:Math.max(.03,Math.min(.97,cx+Math.cos(ba)*bl)),ty:Math.max(.03,Math.min(.97,cy+Math.sin(ba)*bl))})}}return{sx:sx,sy:sy,segs:sg,branches:br,thick:pr>.4}}
function addCr(pr){for(var i=0;i<Math.floor(3+pr*8);i++)crD.push(gCr(pr));drCr()}
function drCr(){if(!crCx)return;var w=CW,h=CH;crCx.clearRect(0,0,w,h);for(var i=0;i<crD.length;i++){var c=crD[i],tk=c.thick;crCx.save();crCx.strokeStyle=tk?'rgba(255,240,180,0.95)':'rgba(255,255,255,0.88)';crCx.lineWidth=tk?3:1.8;crCx.shadowBlur=tk?16:8;crCx.shadowColor=tk?'rgba(255,200,80,0.95)':'rgba(255,255,200,0.75)';crCx.lineCap='round';crCx.lineJoin='round';crCx.beginPath();crCx.moveTo(c.sx*w,c.sy*h);for(var j=0;j<c.segs.length;j++)crCx.lineTo(c.segs[j].x*w,c.segs[j].y*h);crCx.stroke();for(var j=0;j<c.branches.length;j++){var b=c.branches[j];crCx.beginPath();crCx.moveTo(b.fx*w,b.fy*h);crCx.lineTo(b.tx*w,b.ty*h);crCx.lineWidth=tk?2:1.2;crCx.stroke()}crCx.restore()}}
function drFull(){if(!crCx)return;var w=CW,h=CH;crCx.save();for(var i=0;i<50;i++){var x1=Math.random()*w,y1=Math.random()*h,a=Math.random()*Math.PI*2,cx2=x1,cy2=y1,ln=25+Math.random()*70;crCx.beginPath();crCx.moveTo(x1,y1);for(var s=0;s<2+Math.floor(Math.random()*3);s++){a+=(Math.random()-.5)*1.4;cx2+=Math.cos(a)*ln/3;cy2+=Math.sin(a)*ln/3;crCx.lineTo(cx2,cy2)}crCx.strokeStyle='rgba(255,240,180,0.92)';crCx.lineWidth=1.5+Math.random()*2.5;crCx.shadowBlur=18;crCx.shadowColor='rgba(255,200,50,1)';crCx.lineCap='round';crCx.stroke()}crCx.fillStyle='rgba(255,255,200,0.15)';crCx.fillRect(0,0,w,h);crCx.restore()}

// ===== FONDO =====
var bgCx,bgW,bgH,bgP=[];
function initBg(){var c=document.getElementById('bgCanvas');bgCx=c.getContext('2d');function rs(){c.width=innerWidth;c.height=innerHeight;bgW=c.width;bgH=c.height}rs();addEventListener('resize',rs);for(var i=0;i<60;i++)bgP.push(mkBP())}
function mkBP(){var w=gW();return{x:Math.random()*bgW,y:Math.random()*bgH,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.3-.1,sz:Math.random()*3+1,a:Math.random()*.4+.1,col:w.color,l:Math.random()*200+100,ml:300,tp:w.particles}}
function drBg(){if(!bgCx)return;var w=gW();bgCx.clearRect(0,0,bgW,bgH);var g=bgCx.createRadialGradient(bgW/2,bgH/2,0,bgW/2,bgH/2,bgW*.7);g.addColorStop(0,w.color+'18');g.addColorStop(.5,'#060e1a');g.addColorStop(1,'#030810');bgCx.fillStyle=g;bgCx.fillRect(0,0,bgW,bgH);for(var i=0;i<bgP.length;i++){var p=bgP[i];p.x+=p.vx;p.y+=p.vy;p.l--;if(p.l<=0||p.x<-10||p.x>bgW+10||p.y<-10||p.y>bgH+10){bgP[i]=mkBP();bgP[i].y=bgH+5;bgP[i].l=bgP[i].ml;continue}var al=p.a*(p.l/p.ml);bgCx.globalAlpha=al;bgCx.fillStyle=p.col;bgCx.beginPath();if(p.tp==='bubbles'){bgCx.strokeStyle=p.col;bgCx.lineWidth=.5;bgCx.arc(p.x,p.y,p.sz*1.5,0,Math.PI*2);bgCx.stroke()}else if(p.tp==='embers'){bgCx.arc(p.x,p.y,p.sz,0,Math.PI*2);bgCx.fill();bgCx.globalAlpha=al*.3;bgCx.beginPath();bgCx.arc(p.x,p.y,p.sz*3,0,Math.PI*2);bgCx.fill()}else if(p.tp==='stars'){bgCx.globalAlpha=al*(Math.sin(p.l*.1)*.3+.7);bgCx.fillStyle='#fff';bgCx.beginPath();bgCx.arc(p.x,p.y,p.sz*.7,0,Math.PI*2);bgCx.fill()}else if(p.tp==='wisps'){bgCx.arc(p.x+Math.sin(p.l*.08)*8,p.y,p.sz*1.5,0,Math.PI*2);bgCx.fill()}else{bgCx.ellipse(p.x,p.y,p.sz*2,p.sz,Math.sin(p.l*.05)*.5,0,Math.PI*2);bgCx.fill()}}bgCx.globalAlpha=1;requestAnimationFrame(drBg)}

// ===== HABITAT 3D =====
var hR,hS,hC,hM=[],hGnd=null;
function initH3D(){
    var ct=document.getElementById('habitat');var w=ct.clientWidth,h=ct.clientHeight;
    hR=new THREE.WebGLRenderer({alpha:true,antialias:true});hR.setSize(w,h);hR.setPixelRatio(Math.min(devicePixelRatio,2));hR.setClearColor(0,0);ct.insertBefore(hR.domElement,ct.firstChild);
    hS=new THREE.Scene();hC=new THREE.PerspectiveCamera(40,w/h,.1,100);hC.position.set(0,1.8,5.5);hC.lookAt(0,0,0);
    hS.add(new THREE.AmbientLight(0xffffff,.7));var dl=new THREE.DirectionalLight(0xffffff,1.2);dl.position.set(3,5,4);hS.add(dl);hS.add(new THREE.HemisphereLight(0x88ffaa,0x224466,.3));
    var gg=new THREE.CircleGeometry(3.5,48);var gm=new THREE.MeshStandardMaterial({color:0x1a3a20,roughness:.85});var gnd=new THREE.Mesh(gg,gm);gnd.rotation.x=-Math.PI/2;gnd.position.y=-.5;gnd.userData.isGround=true;hS.add(gnd);hGnd=gnd;
    anH();
}
function refHP(){
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
function anH(){requestAnimationFrame(anH);var t=performance.now()*.001;hM.forEach(function(m){m.position.y=m.userData.by+Math.sin(t*m.userData.bs+m.userData.bo)*.12;m.rotation.y=t*.5});hC.position.x=Math.sin(t*.15)*.3;hC.lookAt(0,0,0);hR.render(hS,hC)}
function rsH(){if(!hR)return;var ct=document.getElementById('habitat');var w=ct.clientWidth,h=ct.clientHeight;hR.setSize(w,h);hC.aspect=w/h;hC.updateProjectionMatrix()}

// ===== REVELAR 3D =====
var vR,vS,vC,vM=null,vA=false;
function initR3D(){
    var ct=document.getElementById('revSphere3d');
    vR=new THREE.WebGLRenderer({alpha:true,antialias:true});vR.setSize(120,120);vR.setPixelRatio(Math.min(devicePixelRatio,2));vR.setClearColor(0,0);ct.appendChild(vR.domElement);
    vS=new THREE.Scene();vC=new THREE.PerspectiveCamera(40,1,.1,100);vC.position.set(0,0,3.5);
    vS.add(new THREE.AmbientLight(0xffffff,.6));var dl=new THREE.DirectionalLight(0xffffff,1.5);dl.position.set(2,3,4);vS.add(dl);vS.add(new THREE.PointLight(0xffffff,.5,10));
}
function showR3D(p){
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
 vR.render(vS,vC)}

// ===== PARTICULAS / CONFETTI =====
var hCx,hP=[];
function spHP(rar){var c=document.getElementById('hatchCanvas');var r=c.parentElement.getBoundingClientRect();c.width=r.width*2;c.height=r.height*2;hCx=c.getContext('2d');hCx.scale(2,2);var w=r.width,h=r.height,col=RCOL[rar]||'#fff';var hi=RORD[rar]>=5;var ct=hi?140:40;var cols=hi?['#fbbf24','#f472b6','#22d3ee','#a78bfa','#34d399',col]:[col];hP=[];for(var i=0;i<ct;i++){var an=Math.random()*Math.PI*2,sp=Math.random()*9+2;hP.push({x:w/2,y:h/2,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-2,sz:Math.random()*(hi?7:5)+1,col:cols[Math.floor(Math.random()*cols.length)],l:Math.random()*50+30,ml:80,g:.08,rot:Math.random()*6,vr:(Math.random()-.5)*.3,shape:hi&&Math.random()<.5?'rect':'dot'})}anHP(w,h)}
function anHP(w,h){if(!hCx||!hP.length)return;hCx.clearRect(0,0,w,h);var al=false;for(var i=0;i<hP.length;i++){var p=hP[i];if(p.l<=0)continue;al=true;p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.l--;p.vx*=.98;p.rot+=p.vr;var a=p.l/p.ml;hCx.globalAlpha=a;hCx.fillStyle=p.col;if(p.shape==='rect'){hCx.save();hCx.translate(p.x,p.y);hCx.rotate(p.rot);hCx.fillRect(-p.sz/2,-p.sz*.3,p.sz,p.sz*.6);hCx.restore()}else{hCx.beginPath();hCx.arc(p.x,p.y,Math.max(.5,p.sz*a),0,Math.PI*2);hCx.fill()}}hCx.globalAlpha=1;if(al)requestAnimationFrame(function(){anHP(w,h)})}

// ===== TEMA =====
function apTh(){var w=gW(),r=document.documentElement;r.style.setProperty('--wa',w.color);r.style.setProperty('--wa2',w.color2);r.style.setProperty('--wabg',w.color+'18');r.style.setProperty('--wbd',w.color+'30');r.style.setProperty('--wsh',w.color+'40');r.style.setProperty('--wg',w.color+'20');document.getElementById('worldBadge').textContent=w.name.split(' ')[0].toUpperCase();document.getElementById('habLabel').textContent='Habitat - '+w.name;document.getElementById('sWB').textContent='x'+w.bonus.toFixed(1);document.getElementById('worldBadge').style.color=w.color;if(hGnd){try{hGnd.material.color.set(w.color);hGnd.material.color.multiplyScalar(.35)}catch(e){}}}

// ===== SAVE/LOAD =====
var SK='PetSimUltra_v38';
function save(){try{localStorage.setItem(SK,JSON.stringify({money:G.money,rb:G.rb,mult:G.mult,pets:G.pets,disc:G.disc,pr:G.pr,uw:G.uw,tot:G.tot,te:G.te,mut:G.mut,nid:G.nid,pn:G.pn,ao:G.ao,aon:G.aon,world:G.world,x3:G.x3,upg:G.upg,achs:G.achs,lastDaily:G.lastDaily,dailyStreak:G.dailyStreak,lastSeen:Date.now(),boostUntil:G.boostUntil}))}catch(e){}}
function load(){var raw=null;try{raw=localStorage.getItem(SK)}catch(e){return}if(!raw)return;try{var d=JSON.parse(raw);if(!d)return;
G.money=d.money||10;G.dm=G.money;G.rb=d.rb||0;G.mult=d.mult||1;G.mut=!!d.mut;G.tot=d.tot||0;G.te=d.te||0;G.nid=d.nid||1;G.pn=d.pn||'Mi Base';G.ao=!!d.ao;G.aon=!!d.aon;G.world=d.world||'bosque';G.x3=!!d.x3;G.uw=d.uw||['bosque'];if(d.pr)for(var pk in d.pr)G.pr[pk]=d.pr[pk];G.disc=d.disc||[];
G.upg=d.upg||{luck:0,inc:0,disc:0,fast:0,auto:0};G.achs=d.achs||[];G.lastDaily=d.lastDaily||0;G.dailyStreak=d.dailyStreak||0;G.lastSeen=d.lastSeen||0;G.boostUntil=d.boostUntil||0;
G.pets=[];
if(d.pets){for(var i=0;i<d.pets.length;i++){var p=d.pets[i];if(!p)continue;G.pets.push({ic:p.ic||'fa-solid fa-paw',n:p.n,r:p.r,be:p.be||p.e||1,lv:p.lv||1,id:p.id||G.nid++,c:p.c||'#888',eg:p.eg||[],v:p.v||0})}}}catch(e){}}
function resetG(){try{localStorage.removeItem(SK)}catch(e){}
G={money:10,dm:10,rb:0,mult:1,pets:[],disc:[],pr:defPr(),uw:['bosque'],tot:0,te:0,mut:false,nid:1,pn:'Mi Base',ao:false,aon:false,world:'bosque',x3:false,upg:{luck:0,inc:0,disc:0,fast:0,auto:0},achs:[],lastDaily:0,dailyStreak:0,lastSeen:0,boostUntil:0};
selE='basico';rbC=false;CLICKS=5;multiList=null;eventMult=1;luckyBoost=false;eggSale=false;if(boostTimeout)clearTimeout(boostTimeout);boostActive=false;if(evtCur)endEvent();
apTh();refHP();updateUI();toast('Reiniciado','inf')}

// ===== RANKING =====
var NM=['xXDarkWolfXx','PetMaster99','DragonSlayer','ProGamer2k','NeonBlade','ShadowHunter','CrystalQueen','FireLord77','IcePhoenix','StormBreaker','LunaStar','CosmicDust','ThunderBolt','SilverFang','GoldenEagle','NightHawk','StarDust42','ViperStrike','MysticMage','BlazeKing','ArcticFox','CrimsonTide','DiamondHand','EmeraldWind','RubyHeart','SapphireEye','IronFist01','SteelNerve','BronzeShield','PlatinumAce','GhostRider','PhantomX','Spectre007','WraithLord','ElTigre','LaFiera','ElDragon','LaBestia','SpeedDemon','TurboBoost','NitroFlame','RapidFire','QuickSilver','MegaBoss','UltraKing','SuperNova','HyperDrive','GigaChad','TinyTitan','MiniMight','AlphaWolf','OmegaForce','GammaRay','DeltaStrike','VolcanicAsh','GlacierIce','TornadoX','Earthquake9','Tsunami7','Wildfire3','Avalanche5','Monsoon8','Blizzard1','NoobSlayer','AFKAndWin','LuckyDraw','PetCollector','EggHunter','RareFinder','MythicChaser','LegendSeeker','GalacticOwl','NebulaCat','CometDog','PulsarFox','QuasarBear','DarkMatter7','SingularityX','QuantumLeap','ChaosLord','OrderKeeper','ZenMaster','SakuraPet','MatchaKing','RamenLord','SushiDog','WasabiCat','MisoPanda','TofuFox','MelonPan','StrawbDog','ChocoCat','VanillaFox','CaramelBear','CookieOwl','BrownieBun','Pudding7','FlanKing','Macaron6','Tiramisu7','Gelato6','Sorbet2','Nutella7','Pistachio5','Chestnut3','Acorn8','Coconut7','JadeWarrior','AmberLight','CoralReef','PearlDiver','OpalDream','OnyxBlade','TopazSun','GarnetRose','PeridotEye','QuartzMind','ObsidianX','PixelKing','RetroGamer','NeoPlayer','CyberNinja','RoboMaster','AtomicFlux','StringTheo','Multiverse9','DimensionX','ParallelP','EntropyKing','BalanceX','Samsara99','KarmaKing','DharmaDog','TaoMaster','YinYang7','FengShui5','IChing3','Bagua8','WuXing5','TaiChi9','QiGong7','ZenGarden','BonsaiAce','Hojicha7','Genmaicha','Sencha9','Kinako7','Anko5','Yomogi3','Kuzumochi','Mitsumame','Anmitsu7','CreamAnko','ChocoCat2','VanillaF2','CaramelB2','CookieO2','Brownie2','Pudding2','FlanK2','Macaron2','Tirami2','Gelato2','Sorbet3','Nutell2','Pistac2','Chestn2','Acorn2','Cocon2','JadeW2','Amber2','Coral2','Pearl2','Opal2','Onyx2','Topaz2','Garnet2','Perido2','Quartz2','Obsidi2','Pixel2','Retro2','Neo2','Cyber2','Robo2','Atom2','String2','Multi2','Dime2','Para2','Entro2','Balan2','Samsa2','Karma2','Dharm2','Tao2','Yin2','Feng2','ICh2','Bag2','Wu2','Tai2','Qi2','Zen2','Bon2','Hoj2','Gen2','Sen2','Kin2','Ank2','Yom2','Kuz2','Mit2','Anm2','Cre2','Cho2','Van2','Car2','Coo2','Bro2','Pud2','Fla2','Mac2','Tir2','Gel2','Sor2','Nut2','Pis2','Che2','Aco2','Coc2'];
var rP=[];
function initRk(){for(var i=0;i<199;i++){var nm=NM[i%NM.length]+(i>=NM.length?Math.floor(i/NM.length):'');var rb=Math.floor(Math.random()*15);var bi=Math.pow(10,Math.random()*8+1)*(1+rb*.8);rP.push({name:nm,income:bi,rb:rb,pets:Math.floor(Math.random()*200+5),trend:(Math.random()-.5)*.02})}}
function updRk(){rP.forEach(function(p){p.income*=(1+p.trend+(Math.random()-.5)*.04);p.income=Math.max(1,p.income);if(Math.random()<.08)p.trend=(Math.random()-.5)*.02})}
function getFR(){var all=[{name:G.pn,income:tI(),rb:G.rb,pets:G.pets.length,isMe:true}];for(var i=0;i<rP.length;i++)all.push(rP[i]);all.sort(function(a,b){return b.income-a.income});return all}
function rkI(p,idx){var pos=idx+1;var pc=pos===1?'p1':pos===2?'p2':pos===3?'p3':'';return'<div class="rk-i'+(p.isMe?' me':'')+'"><div class="rk-pos '+pc+'">'+pos+'</div><div class="rk-body"><div class="rk-top"><span class="rk-n">'+esc(p.name)+(p.isMe?' <span class="rk-you">TU</span>':'')+'</span><span class="rk-rb">RB '+p.rb+'</span></div><div class="rk-bot"><span class="rk-pc">'+p.pets+' mascotas</span><span class="rk-earn">$'+fmt(p.income)+'/s</span></div></div></div>'}
function renderRk(){var all=getFR();var mi=0;for(var i=0;i<all.length;i++){if(all[i].isMe){mi=i;break}}document.getElementById('rkPos').textContent='#'+(mi+1);document.getElementById('rkMyEarn').textContent='$'+fmt(tI())+'/s';var h='';var ss=Math.max(0,mi-2),se=Math.min(all.length-1,mi+2);if(ss>3){for(var i=0;i<3;i++)h+=rkI(all[i],i);h+='<div class="rk-sep">. . .</div>'}else ss=0;if(se<all.length-4){for(var i=ss;i<=se;i++)h+=rkI(all[i],i);h+='<div class="rk-sep">. . .</div>';for(var i=all.length-3;i<all.length;i++)h+=rkI(all[i],i)}else{for(var i=ss;i<all.length;i++)h+=rkI(all[i],i)}h+='<div class="rk-total">'+all.length+' jugadores en linea</div>';document.getElementById('rkList').innerHTML=h}

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
{id:'up1',n:'Maximizador',d:'Compra 15 niveles de mejoras',ic:'fa-arrow-up-right-dots',goal:15,st:'upg',rw:1e8}
];
var EVENTS=[
{id:'rain',n:'LLUVIA DE DINERO x3',ic:'fa-cloud-showers-heavy',dur:60,apply:function(){eventMult=3},end:function(){eventMult=1}},
{id:'lucky',n:'SUERTE DIVINA',ic:'fa-clover',dur:45,apply:function(){luckyBoost=true},end:function(){luckyBoost=false}},
{id:'sale',n:'REBAJA 50%!',ic:'fa-tags',dur:30,apply:function(){eggSale=true},end:function(){eggSale=false}},
{id:'gold',n:'HUEVO DORADO!',ic:'fa-egg',dur:15,apply:spawnGoldEgg,end:function(){}}
];
function startEvent(){
  if(evtCur)return;
  var ev=EVENTS[Math.floor(Math.random()*EVENTS.length)];
  evtCur=ev;evtEnd=Date.now()+ev.dur*1000;ev.apply();
  toast(ev.n+'!','rwd');snd.world();
  var b=document.getElementById('evtBanner');
  if(b){b.style.display='flex';b.innerHTML='<i class="fas '+ev.ic+'"></i><span>'+ev.n+'</span><span class="evt-t" id="evtT">'+ev.dur+'s</span>'}
  evtT=setInterval(function(){
    var s=Math.ceil((evtEnd-Date.now())/1000);
    if(s<=0){endEvent();return}
    var el=document.getElementById('evtT');if(el)el.textContent=s+'s';
  },500);
}
function endEvent(){
  if(!evtCur)return;
  evtCur.end();clearInterval(evtT);evtCur=null;
  var b=document.getElementById('evtBanner');if(b)b.style.display='none';
  updateUI();
}
function spawnGoldEgg(){
  var e=document.createElement('div');e.id='goldEgg';e.innerHTML='<i class="fas fa-egg"></i>';
  e.style.left=(Math.random()*260+40)+'px';e.style.top=(Math.random()*380+120)+'px';
  document.getElementById('game').appendChild(e);
  var claimed=false;
  e.addEventListener('click',function(ev){
    ev.stopPropagation();if(claimed)return;claimed=true;e.remove();
    var r=Math.random();
    if(r<.45){var amt=Math.max(5000,Math.floor(G.money*.15+10000));G.money+=amt;toast('JACKPOT +$'+fmt(amt),'rwd');snd.hatch('god')}
    else if(r<.85){
      var tpl=roll(selE);var np={ic:tpl.ic,n:tpl.n,r:tpl.r,be:tpl.e,lv:1,id:G.nid++,c:tpl.c,eg:tpl.eg,v:rollVariant()};
      G.pets.push(np);G.tot++;if(G.disc.indexOf(tpl.n)===-1)G.disc.push(tpl.n);
      toast('Huevo gratis!','rwd');save();updateUI();refHP();snd.hatch(np.r);showH(np);return;
    }
    else{activateBoost(120);toast('Boost x2 gratis!','rwd')}
    save();updateUI();
  });
  setTimeout(function(){if(e.parentNode)e.remove()},14000);
}
function dailyReward(){return Math.floor(2000*Math.pow(1.6,Math.min((G.dailyStreak||0)+1,12))*(1+G.rb*.5))}
function claimDaily(){
  if(Date.now()-G.lastDaily<82800000){snd.err();toast('Vuelve manana','err');return}
  var gap=Date.now()-G.lastDaily;
  G.dailyStreak=(G.lastDaily&&gap<172800000)?(G.dailyStreak||0)+1:1;
  G.lastDaily=Date.now();
  var r=dailyReward();G.money+=r;
  snd.hatch('god');toast('DIA '+G.dailyStreak+': +$'+fmt(r),'rwd');
  save();updateUI();
}
function buyUpg(id){
  var u=null;for(var i=0;i<UPGS.length;i++)if(UPGS[i].id===id)u=UPGS[i];
  if(!u)return;
  var lv=G.upg[id]||0;
  if(lv>=u.max){snd.err();toast('Nivel maximo','err');return}
  var c=u.co(lv);
  if(G.money<c){snd.err();toast('Necesitas $'+fmt(c),'err');return}
  G.money-=c;G.upg[id]=lv+1;
  if(id==='fast')CLICKS=Math.max(1,5-G.upg.fast);
  snd.hatch('god');toast(u.n+' Nv.'+(lv+1),'rwd');save();updateUI();
}
function achStat(id){
  switch(id){
    case 'tot':return G.tot;case 'rb':return G.rb;case 'uw':return G.uw.length;
    case 'te':return G.te;case 'pets':return G.pets.length;case 'disc':return G.disc.length;
    case 'v1':return G.pets.filter(function(p){return p.v===1}).length;
    case 'v2':return G.pets.filter(function(p){return p.v===2}).length;
    case 'upg':var s=0;for(var k in G.upg)s+=G.upg[k];return s;
    default:return 0;
  }
}
function checkAchs(){
  var got=[];
  for(var i=0;i<ACHS.length;i++){
    var a=ACHS[i];
    if(G.achs.indexOf(a.id)!==-1)continue;
    if(achStat(a.st)>=a.goal){G.achs.push(a.id);G.money+=a.rw;got.push(a)}
  }
  if(got.length){save();var shown=0;got.forEach(function(a){if(shown<3){toast('Logro: '+a.n+' +$'+fmt(a.rw),'rwd');shown++}});snd.hatch('og')}
}
function stCell(ic,v,l){return'<div class="stat-cell"><i class="fas '+ic+'"></i><b>'+v+'</b><span>'+l+'</span></div>'}
function renderHub(){
  if(!document.getElementById('pHub'))return;
  var scEl=document.querySelector('#pHub .hub-scroll'),st=scEl?scEl.scrollTop:0;
  var db=document.getElementById('dailyBox');
  if(db){
    var can=Date.now()-G.lastDaily>82800000;
    db.innerHTML='<div class="db-info"><span>Racha: <b>'+(G.dailyStreak||0)+' dias</b></span><span>Proxima recompensa: <b>$'+fmt(dailyReward())+'</b></span></div><button class="btn btn-daily '+(can?'can':'no')+'" id="btnDaily">'+(can?'<i class="fas fa-gift"></i> RECLAMAR':'<i class="fas fa-clock"></i> MANANA')+'</button>';
  }
  var ul=document.getElementById('upgList');
  if(ul){
    var h='';
    for(var i=0;i<UPGS.length;i++){
      var u=UPGS[i],lv=G.upg[u.id]||0,mx=lv>=u.max,co=mx?0:u.co(lv);
      h+='<div class="upg-item"><div class="upg-ic"><i class="fas '+u.ic+'"></i></div><div class="upg-inf"><div class="upg-n">'+u.n+' <span>Nv.'+lv+'/'+u.max+'</span></div><div class="upg-d">'+u.d+'</div><div class="upg-fx">'+u.fx(lv)+'</div></div>'+(mx?'<div class="upg-btn max">MAX</div>':'<button class="upg-btn'+(G.money>=co?'':' no')+'" data-upg="'+u.id+'">$'+fmt(co)+'</button>')+'</div>';
    }
    ul.innerHTML=h;
  }
  var al=document.getElementById('achList');
  if(al){
    var h='';
    for(var i=0;i<ACHS.length;i++){
      var a=ACHS[i],done=G.achs.indexOf(a.id)!==-1,val=achStat(a.st),p=Math.min(100,Math.round(val/a.goal*100));
      h+='<div class="ach-item'+(done?' done':'')+'"><div class="ach-ic"><i class="fas '+(done?a.ic:'fa-lock')+'"></i></div><div style="flex:1;min-width:0"><div class="ach-n">'+a.n+'</div><div class="ach-d">'+a.d+'</div>'+(done?'<div class="ach-d" style="color:#fbbf24">+$'+fmt(a.rw)+' reclamado</div>':'<div class="ach-bar"><div class="ach-bf" style="width:'+p+'%"></div></div>')+'</div></div>';
    }
    al.innerHTML=h;
  }
  var sl=document.getElementById('statList');
  if(sl){
    var best=null;for(var i=0;i<G.pets.length;i++){if(!best||pE(G.pets[i])>pE(best))best=G.pets[i]}
    var n1=0,n2=0;for(var i=0;i<G.pets.length;i++){if(G.pets[i].v===1)n1++;else if(G.pets[i].v===2)n2++}
    sl.innerHTML='<div class="stat-grid">'+
      stCell('fa-egg',fmt(G.tot),'Huevos abiertos')+
      stCell('fa-sack-dollar','$'+fmt(G.te),'Total ganado')+
      stCell('fa-paw',G.pets.length,'Mascotas')+
      stCell('fa-book',G.disc.length+'/'+PETS.length,'Index')+
      stCell('fa-globe',G.uw.length+'/'+WORLDS.length,'Mundos')+
      stCell('fa-arrows-rotate',G.rb,'Rebirths')+
      stCell('fa-crown',best?best.n:'--','Mejor mascota')+
      stCell('fa-star',n1,'Doradas')+
      stCell('fa-rainbow',n2,'Arcoiris')+
      stCell('fa-clover',(G.upg.luck*6)+'%','Suerte')+
      stCell('fa-bolt-lightning','x'+(1+G.upg.inc*.1).toFixed(1),'Bonus ingreso')+
      '</div>';
  }
  if(scEl)scEl.scrollTop=st;
}

// ===== LOGICA =====
function openE(sil){
    var cost=eggCost(selE);if(G.money<cost){if(!sil){snd.err();toast('Sin dinero','err')}if(G.aon){G.aon=false;updateUI()}return false}
    G.money-=cost;var sc={basico:1.15,dorado:1.2,campestre:1.12,arcano:1.22,marino:1.18,abisal:1.25,cristalino:1.2,gema:1.28,magmatico:1.22,infernal:1.3,divino:1.25,ancestral:1.32,cosmico:1.28,estelar:1.35,umbral:1.3,absoluto:1.4,salvaje:1.14,toxico:1.18,dunas:1.15,faraon:1.2,glacial:1.16,polar:1.2,tumba:1.2,maldito:1.24,goloso:1.22,pastel:1.26,neon:1.24,virtual:1.28,draconico:1.28,wyrm:1.32,eterno:1.32,omega:1.4};
    G.pr[selE]=Math.floor(G.pr[selE]*(sc[selE]||1.15));var tpl=roll(selE);
    var np={ic:tpl.ic,n:tpl.n,r:tpl.r,be:tpl.e,lv:1,id:G.nid++,c:tpl.c,eg:tpl.eg,v:rollVariant()};
    G.pets.push(np);G.tot++;if(G.disc.indexOf(tpl.n)===-1)G.disc.push(tpl.n);
    if(!sil){save();snd.hatch(tpl.r);showH(np);updateUI();refHP()}
    return true;
}
function openMulti(n){
  if(!G.x3){snd.err();toast('Bloqueado: desbloquealo en la tienda LU (100 monedas)','err');return}
  if(G.money<eggCost(selE)){snd.err();toast('Sin dinero','err');return}
  var before=G.pets.length,opened=0;
  for(var i=0;i<n;i++){if(G.money>=eggCost(selE)&&openE(true))opened++}
  if(!opened)return;
  var news=G.pets.slice(before);
  news.sort(function(a,b){return(RORD[b.r]||0)-(RORD[a.r]||0)||(b.v||0)-(a.v||0)||pE(b)-pE(a)});
  multiList=news.slice(1);
  save();updateUI();refHP();snd.hatch(news[0].r);showH(news[0],true);
}
function showH(pet,instant){
  hSt={pet:pet,cl:instant?CLICKS:0,rev:false,bur:!!instant};
  var ov=document.getElementById('overlay'),e3=document.getElementById('oegg3d'),eB=document.getElementById('egg3dBody');
  ov.style.display='flex';ov.style.cursor=instant?'default':'pointer';e3.style.display='block';eB.style.background=E3DG[selE]||E3DG.basico;
  e3.className='egg-3d-container';document.getElementById('egg3d').className='egg-3d';
  document.getElementById('oRev').style.display='none';
  document.getElementById('tapHint').style.display=instant?'none':'block';
  document.getElementById('tapProgress').style.display=instant?'none':'flex';
  document.getElementById('oclose').style.display='none';document.getElementById('oclose').classList.remove('visible');
  document.getElementById('oname').textContent='';document.getElementById('orar').textContent='';document.getElementById('orar').style.color='';document.getElementById('oinfo').textContent='';
  var vb=document.getElementById('ovariant');if(vb)vb.style.display='none';
  var ml=document.getElementById('oMulti');if(ml){ml.innerHTML='';ml.style.display='none'}
  initCC();
  if(instant)setTimeout(hBurst,350);else updTP();
}
function hClick(){
  if(hSt.rev||hSt.bur)return;hSt.cl++;
  if(Math.random()<.1&&hSt.cl<CLICKS){hSt.cl++;var ct=document.createElement('div');ct.className='crit-txt';ct.textContent='¡CRITICO!';document.getElementById('obox').appendChild(ct);setTimeout(function(){ct.remove()},700);snd.burst()}
  var n=hSt.cl,mx=CLICKS,pr=n/mx;
  snd.crack(n,mx);if(navigator.vibrate)navigator.vibrate(30);addCr(pr);
  var e3=document.getElementById('oegg3d');e3.classList.remove('egg-squish');void e3.offsetWidth;e3.classList.add('egg-squish');setTimeout(function(){e3.classList.remove('egg-squish')},150);
  e3.className='egg-3d-container';if(pr<.25)e3.classList.add('egg-shake-1');else if(pr<.5)e3.classList.add('egg-shake-2');else if(pr<.75)e3.classList.add('egg-shake-3');else e3.classList.add('egg-shake-4');
  e3.classList.remove('egg-glow-1','egg-glow-2','egg-glow-3','egg-glow-4');
  if(pr>=.75)e3.classList.add('egg-glow-4');else if(pr>=.5)e3.classList.add('egg-glow-3');else if(pr>=.25)e3.classList.add('egg-glow-2');else e3.classList.add('egg-glow-1');
  var fl=document.createElement('div');fl.className='click-flash';document.getElementById('overlay').appendChild(fl);setTimeout(function(){fl.remove()},200);
  if(pr>=.5){var gm=document.getElementById('game');gm.classList.remove('screen-shake');void gm.offsetWidth;gm.classList.add('screen-shake');setTimeout(function(){gm.classList.remove('screen-shake')},200)}
  updTP();if(n>=mx)hBurst();
}
function updTP(){var h='';for(var i=0;i<CLICKS;i++){h+='<span class="pip'+(i<hSt.cl?' filled':'')+(i===hSt.cl-1?' just':'')+'"></span>'}document.getElementById('tapProgress').innerHTML=h}
function hBurst(){
  hSt.bur=true;var e3=document.getElementById('oegg3d'),ov=document.getElementById('overlay');
  document.getElementById('tapHint').style.display='none';document.getElementById('tapProgress').style.display='none';ov.style.cursor='default';
  drFull();e3.className='egg-3d-container egg-burst';snd.burst();spHP(hSt.pet.r);
  if(navigator.vibrate)navigator.vibrate([50,30,80]);
  setTimeout(function(){
    e3.style.display='none';var p=hSt.pet,rC=RCOL[p.r]||'#fff';
    document.getElementById('oRev').style.display='block';document.getElementById('oRevGlow').style.background='radial-gradient(circle,'+rC+'80,transparent)';
    document.getElementById('oR1').style.borderColor=rC;document.getElementById('oR2').style.borderColor=rC;document.getElementById('oR3').style.borderColor=rC;
    showR3D(p);document.getElementById('oname').textContent=p.n;
    document.getElementById('orar').textContent=RNAME[p.r]||'';
    document.getElementById('orar').style.color=rC;
    document.getElementById('oinfo').textContent='+$'+fmt(pE(p))+'/s';
    var vb=document.getElementById('ovariant');
    if(vb){if(p.v){vb.style.display='block';vb.textContent=p.v===2?'★ ARCOIRIS x3 ★':'★ DORADA x1.6 ★';vb.style.color=p.v===2?'#f472b6':'#fbbf24'}else vb.style.display='none'}
    if(multiList&&multiList.length){var ml=document.getElementById('oMulti'),h='<div class="om-t">+ '+(multiList.length)+' mas</div>';multiList.forEach(function(q){h+=sphH(q,'xs')});if(ml){ml.innerHTML=h;ml.style.display='flex'}}
    setTimeout(function(){hSt.rev=true;hSt.bur=false;var cb=document.getElementById('oclose');cb.style.display='inline-block';cb.classList.add('visible')},800);
  },500);
}
function closeH(){
  if(!hSt.rev)return;document.getElementById('overlay').style.display='none';
  document.getElementById('oegg3d').style.display='none';document.getElementById('oegg3d').className='egg-3d-container';
  document.getElementById('egg3d').className='egg-3d';document.getElementById('oRev').style.display='none';
  document.getElementById('oclose').style.display='none';document.getElementById('oclose').classList.remove('visible');
  var vb=document.getElementById('ovariant');if(vb)vb.style.display='none';
  var ml=document.getElementById('oMulti');if(ml){ml.style.display='none';ml.innerHTML=''}
  multiList=null;hP=[];hSt.rev=false;stopR();
}
function doUp(id){var p=null;for(var i=0;i<G.pets.length;i++){if(G.pets[i].id===id){p=G.pets[i];break}}if(!p||p.lv>=99)return;var c=uCo(p);if(G.money<c){snd.err();toast('Sin dinero','err');return}G.money-=c;p.lv++;toast(p.n+' Nv.'+p.lv,'ok');save();updateUI()}
function doSell(id){var idx=-1;for(var i=0;i<G.pets.length;i++){if(G.pets[i].id===id){idx=i;break}}if(idx===-1)return;var p=G.pets[idx],v=Math.floor(pE(p)*10);G.money+=v;G.pets.splice(idx,1);toast(p.n+' $'+fmt(v),'inf');save();updateUI();refHP()}
function doRb(){var cost=rbCo();if(rbC){clearTimeout(rbT);rbC=false;G.rb++;G.mult*=1.8;G.money=10;G.dm=10;G.pets=[];G.pr=defPr();multiList=null;snd.hatch('og');toast('REBIRTH '+G.rb+' x'+G.mult.toFixed(1),'rwd');save();updateUI();refHP()}else{if(G.money<cost){snd.err();toast('Necesitas $'+fmt(cost),'err');return}rbC=true;var b=document.getElementById('btnRb');b.innerHTML='<i class="fas fa-exclamation-triangle"></i> CONFIRMAR?';b.classList.add('yes');b.disabled=false;snd.click();rbT=setTimeout(function(){rbC=false;updateUI()},3000)}}
function hAuto(){snd.click();if(!G.ao){if(G.money<1e10){snd.err();toast('Necesitas $10B','err');return}G.money-=1e10;G.ao=true;G.aon=true;toast('Auto activado!','rwd');save();updateUI()}else{G.aon=!G.aon;toast('Auto: '+(G.aon?'ON':'OFF'),'inf');save();updateUI()}}
function buyW(wid){var w=null;for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===wid){w=WORLDS[i];break}if(!w)return;if(isUW(wid)){setW(wid);return}if(G.money<w.cost){snd.err();toast('Necesitas $'+fmt(w.cost),'err');return}G.money-=w.cost;G.uw.push(wid);snd.world();selE=w.eggs[0];setW(wid);save();updateUI();toast('Desbloqueado: '+w.name,'rwd')}
function setW(wid){if(wid===G.world)return;if(!isUW(wid)){snd.err();toast('Bloqueado','err');return}G.world=wid;var w=gW();if(w.eggs.indexOf(selE)===-1)selE=w.eggs[0];bgP=[];for(var i=0;i<60;i++)bgP.push(mkBP());apTh();refHP();document.getElementById('game').classList.add('world-flash');setTimeout(function(){document.getElementById('game').classList.remove('world-flash')},500);save();updateUI();toast('Mundo: '+w.name,'rwd')}

// ===== RENDER UI =====
function rEggs(){var w=gW(),h='';for(var i=0;i<w.eggs.length;i++){var eid=w.eggs[i];h+='<button class="egg'+(eid===selE?' on':'')+'" data-e="'+eid+'"><div class="egg-shape '+(ESCLS[eid]||'es-bas')+'"></div><span class="egg-n">'+(ENAMES[eid]||eid)+'</span><span class="egg-p">$'+fmt(eggCost(eid))+'</span></button>'}document.getElementById('navEggs').innerHTML=h}
function rWorlds(){var h='';for(var i=0;i<WORLDS.length;i++){var w=WORLDS[i],u=isUW(w.id),a=w.id===G.world;h+='<div class="wcard'+(a?' active':'')+(!u?' locked':'')+'" data-wid="'+w.id+'"><div class="wcard-hd"><span class="wcard-icon" style="color:'+w.color+'">'+w.icon+'</span><div class="wcard-info"><div class="wcard-name">'+w.name+'</div><div class="wcard-desc">'+w.desc+'</div></div></div><div class="wcard-stats"><span class="wcard-st">Bonus: <span>x'+w.bonus.toFixed(1)+'</span></span><span class="wcard-st">Coste: <span>$'+fmt(w.cost)+'</span></span></div>'+(a?'<div class="wcard-bonus">ACTIVO</div>':'')+'<div class="wcard-buy '+(u?'can':(G.money>=w.cost?'can':'no'))+'" data-bwid="'+w.id+'">'+(u?(a?'Ir alli':'Seleccionar'):'Comprar $'+fmt(w.cost))+'</div></div>'}document.getElementById('worldMap').innerHTML=h}
function rIdx(){var pct=Math.round((G.disc.length/PETS.length)*100);document.getElementById('idxPct').textContent=pct+'%';document.getElementById('idxBar').style.width=pct+'%';var s=PETS.slice().sort(function(a,b){return(RORD[a.r]||0)-(RORD[b.r]||0)});var h='';for(var i=0;i<s.length;i++){var p=s[i],d=G.disc.indexOf(p.n)!==-1;h+='<div class="ii '+p.r+(d?'':' off')+'"><span class="ic">'+(d?sphH(p,'xs'):'<div style="width:24px;height:24px;border-radius:50%;background:#333"></div>')+'</span><span class="in">'+(d?p.n:'???')+'</span><span class="ir '+p.r+'">'+(RNAME[p.r]||'')+'</span></div>'}document.getElementById('idxList').innerHTML=h}
function rPets(){var el=document.getElementById('petList');if(!G.pets.length){el.innerHTML='<div class="empty"><i class="fas fa-egg"></i><p>Abre tu primer huevo</p></div>';return}
 var s=G.pets.slice().sort(function(a,b){var rd=(RORD[b.r]||0)-(RORD[a.r]||0);if(rd)return rd;var vd=(b.v||0)-(a.v||0);if(vd)return vd;return pE(b)-pE(a)});
 var more=0;if(s.length>150){more=s.length-150;s=s.slice(0,150)}
 var h='';
 for(var i=0;i<s.length;i++){var p=s[i],earn=pE(p),uc=p.lv<99?uCo(p):0;
  h+='<div class="pc '+p.r+'"><div class="pc-l">'+sphH(p,'sm')+'<div class="pc-t"><span class="pc-n">'+esc(p.n)+(p.v?' <i class="fas fa-star pc-star v'+p.v+'"></i>':'')+'</span><span class="pc-m">Nv.'+p.lv+' '+(RNAME[p.r]||'')+(uc?' · $'+fmt(uc):'')+'</span></div></div><div class="pc-r"><span class="pc-e">$'+fmt(earn)+'/s</span><div class="pc-a">';
  if(p.lv<99)h+='<button class="ab ab-u" data-act="up" data-id="'+p.id+'"><i class="fas fa-arrow-up"></i></button>';
  h+='<button class="ab ab-s" data-act="sell" data-id="'+p.id+'"><i class="fas fa-coins"></i></button></div></div></div>'}
 if(more)h+='<div class="empty" style="padding:8px"><p>+'+fmt(more)+' mascotas mas...</p></div>';
 el.innerHTML=h}
function updateUI(){
  var diff=G.money-G.dm;if(Math.abs(diff)<1)G.dm=G.money;else G.dm+=diff*.15;
  document.getElementById('sMoney').textContent='$'+fmt(Math.round(G.dm));
  document.getElementById('sInc').textContent='$'+fmt(tI())+'/s';
  document.getElementById('sPets').textContent=G.pets.length;
  var bb=document.getElementById('btnBuy');if(G.money>=eggCost(selE)){bb.classList.add('can');bb.classList.remove('no')}else{bb.classList.remove('can');bb.classList.add('no')}
  var b3=document.getElementById('btnBuy3');
  if(b3){
    if(!G.x3){b3.innerHTML='<i class="fas fa-lock"></i> x3';b3.title='Desbloquealo en la tienda LU (100 monedas)';b3.classList.add('locked');b3.classList.remove('no')}
    else{b3.innerHTML='<i class="fas fa-bolt"></i> x3';b3.title='';b3.classList.remove('locked');if(G.money>=eggCost(selE)*3)b3.classList.remove('no');else b3.classList.add('no')}
  }
  var ba=document.getElementById('btnAuto');if(!G.ao){ba.innerHTML='<i class="fas fa-robot"></i> AUTO ($10B)';if(G.money>=1e10){ba.classList.add('can');ba.classList.remove('no','on')}else{ba.classList.add('no');ba.classList.remove('can','on')}}else{if(G.aon){ba.innerHTML='<i class="fas fa-robot"></i> AUTO: ON';ba.classList.add('on');ba.classList.remove('no','can')}else{ba.innerHTML='<i class="fas fa-robot"></i> AUTO: OFF';ba.classList.add('can');ba.classList.remove('on','no')}}
  if(!rbC){var rb=document.getElementById('btnRb');rb.innerHTML='<i class="fas fa-bolt"></i> REBIRTH ($'+fmt(rbCo())+')';rb.disabled=G.money<rbCo();rb.classList.remove('yes')}
  rPets();rEggs();if(aTab==='worlds')rWorlds();if(aTab==='rank')renderRk();if(aTab==='lu')renderLuShop();if(aTab==='hub')renderHub();
}
function setTab(t){snd.click();aTab=t;var ps=document.querySelectorAll('.panel'),bs=document.querySelectorAll('.tab');for(var i=0;i<ps.length;i++)ps[i].classList.remove('on');for(var i=0;i<bs.length;i++)bs[i].classList.remove('on');var mp={game:'pGame',worlds:'pWorlds',index:'pIndex',hub:'pHub',rank:'pRank',lu:'pLu'};var pe=document.getElementById(mp[t]);if(pe)pe.classList.add('on');var be=document.querySelector('.tab[data-t="'+t+'"]');if(be)be.classList.add('on');if(t==='index')rIdx();if(t==='rank')renderRk();if(t==='worlds')rWorlds();if(t==='lu')renderLuShop();if(t==='hub')renderHub()}

// ===== INTEGRACIÓN LEVELUP =====
const firebaseConfig = {
  apiKey: "AIzaSyDpmb0duQ3ZgjbipPWsMvpLx3d-vojQAxM",
  authDomain: "inici-de-sessio.firebaseapp.com",
  databaseURL: "https://inici-de-sessio-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "inici-de-sessio",
  storageBucket: "inici-de-sessio.firebasestorage.app",
  messagingSenderId: "106046428749",
  appId: "1:106046428749:web:c555c61ff94f5f5691ee04"
};
const fbApp = initializeApp(firebaseConfig);
const fbAuth = getAuth(fbApp);
const fbDb = getDatabase(fbApp);
let luUid = null;
let luCoins = 0;

var LU_SHOP_ITEMS = [
  { id: 'x3', name: 'Apertura x3', desc: 'Desbloquea el boton x3 para abrir 3 huevos a la vez - PERMANENTE', icon: 'fa-bolt', cost: 100, once: true, owned: function() { return G.x3; }, action: function() { G.x3 = true; save(); updateUI(); } },
  { id: 'money1', name: '5K Dinero', desc: 'Añade $5,000 al juego', icon: 'fa-sack-dollar', cost: 10, action: function() { G.money += 5000; save(); updateUI(); } },
  { id: 'money2', name: '100K Dinero', desc: 'Añade $100,000 al juego', icon: 'fa-money-bill-trend-up', cost: 50, action: function() { G.money += 100000; save(); updateUI(); } },
  { id: 'boost', name: 'Boost x2 (3 min)', desc: 'Duplica tus ingresos por 3 minutos', icon: 'fa-bolt', cost: 30, action: function() { activateBoost(180); } },
  { id: 'lucky', name: 'Suerte x2 (5 min)', desc: 'Duplica tu suerte temporalmente', icon: 'fa-clover', cost: 40, action: function() { luckyBoost=true; toast('Suerte x2 activada!','rwd'); setTimeout(function(){luckyBoost=false;toast('Suerte terminada','inf')},300000); } },
  { id: 'egg', name: 'Huevo LevelUp', desc: 'Mascota exclusiva Gh0st (Nivel Medio)', icon: 'fa-egg', cost: 150, action: function() { openLuEgg(); } }
];

function activateBoost(durationSec) {
  boostActive = true;
  if (boostTimeout) clearTimeout(boostTimeout);
  G.boostUntil = Date.now() + durationSec * 1000;
  toast('Boost 2x Activado!', 'rwd');
  updateUI();
  boostTimeout = setTimeout(function() {
    boostActive = false; G.boostUntil = 0;
    toast('Boost terminado', 'inf');
    updateUI();
  }, durationSec * 1000);
}

function openLuEgg() {
  var luPet = {ic:'fa-solid fa-ghost', n:'Gh0st LU', r:'god', be:2500, lv:1, id:G.nid++, c:'#a78bfa', eg:['lu'], v:0};
  G.pets.push(luPet);
  G.tot++;
  if (G.disc.indexOf(luPet.n) === -1) G.disc.push(luPet.n);
  save(); updateUI(); refHP();
  snd.hatch(luPet.r);
  showH(luPet);
}

function renderLuShop() {
  var el = document.getElementById('luShop');
  if (!el) return;
  if (!luUid) {
    el.innerHTML = '<div class="lu-login">Inicia sesión en el portal LevelUp para usar tus monedas aquí.</div>';
    return;
  }
  var h = '';
  for (var i=0; i<LU_SHOP_ITEMS.length; i++) {
    var item = LU_SHOP_ITEMS[i];
    var owned = item.once && item.owned && item.owned();
    var can = luCoins >= item.cost;
    var btn = owned
      ? '<button class="lu-btn" disabled><i class="fas fa-check"></i> COMPRADO</button>'
      : '<button class="lu-btn" data-lu="' + i + '" ' + (can?'':'disabled') + '><i class="fas fa-coins"></i> ' + item.cost + '</button>';
    h += '<div class="lu-item' + (owned?' lu-owned':'') + '">' +
      '<div class="lu-item-icon"><i class="fas ' + item.icon + '"></i></div>' +
      '<div class="lu-item-info"><div class="lu-item-name">' + item.name + '</div><div class="lu-item-desc">' + item.desc + '</div></div>' +
      btn + '</div>';
  }
  el.innerHTML = h;
}

async function buyWithLu(item) {
  if (!luUid) { toast('Inicia sesión en LevelUp', 'err'); return; }
  if (item.once && item.owned && item.owned()) { toast('Ya tienes este objeto', 'inf'); return; }
  try {
    toast('Procesando compra...', 'inf');
    const result = await runTransaction(ref(fbDb, 'users/' + luUid + '/coins'), function(c) {
      if (c === null) return 0;
      if (c < item.cost) return;
      return c - item.cost;
    });
    if (result.committed) {
      item.action();
      toast('¡Compra exitosa!', 'ok');
    } else {
      snd.err();
      toast('Monedas LU insuficientes', 'err');
    }
  } catch(e) {
    toast('Error de conexión', 'err');
  }
}

onAuthStateChanged(fbAuth, function(user) {
  luUid = user ? user.uid : null;
  luCoins = 0;
  var el = document.getElementById('luCoins');
  if (user) {
    if (el) el.textContent = '0';
    onValue(ref(fbDb, 'users/' + luUid + '/coins'), function(snap) {
      luCoins = snap.val() || 0;
      var el2 = document.getElementById('luCoins');
      if (el2) el2.textContent = luCoins;
      renderLuShop();
    });
  } else {
    if (el) el.textContent = '--';
    renderLuShop();
  }
});

// ===== INIT =====
load();var cw=gW();if(cw.eggs.indexOf(selE)===-1)selE=cw.eggs[0];
document.getElementById('rkName').value=G.pn;
document.getElementById('btnMute').innerHTML=G.mut?'<i class="fas fa-volume-xmark"></i>':'<i class="fas fa-volume-high"></i>';
initBg();drBg();initRk();
setTimeout(function(){initH3D();initR3D();refHP();apTh()},100);
addEventListener('resize',function(){setTimeout(rsH,200)});apTh();

// Ganancias offline (max 8h al 50%)
if(G.lastSeen){
  var offAway=Math.min((Date.now()-G.lastSeen)/1000,8*3600),offInc=tI();
  if(offAway>120&&offInc>0){
    var offEarn=Math.floor(offInc*offAway*.5);G.money+=offEarn;
    setTimeout(function(){toast('Ganaste $'+fmt(offEarn)+' mientras estabas fuera!','rwd')},1200);
  }
}
// Restaurar boost activo si quedaba tiempo
if(G.boostUntil&&G.boostUntil>Date.now()){
  boostActive=true;
  var rem=G.boostUntil-Date.now();
  boostTimeout=setTimeout(function(){boostActive=false;G.boostUntil=0;toast('Boost terminado','inf');updateUI()},rem);
}else{G.boostUntil=0}
// Clicks segun mejora de rotura rapida
CLICKS=Math.max(1,5-(G.upg?G.upg.fast:0));
// Eventos aleatorios (cada 60s, 22% de probabilidad)
setInterval(function(){if(!evtCur&&Math.random()<.22)startEvent()},60000);

// ===== EVENT LISTENERS =====
document.getElementById('btnMute').addEventListener('click',function(){G.mut=!G.mut;this.innerHTML=G.mut?'<i class="fas fa-volume-xmark"></i>':'<i class="fas fa-volume-high"></i>';save()});
document.getElementById('btnReset').addEventListener('click',function(){showCf('⚠️','Reiniciar','Perderas todo (mascotas, mejoras, logros y x3 desbloqueado).',resetG)});
document.getElementById('navTabs').addEventListener('click',function(e){var b=e.target.closest('.tab');if(b)setTab(b.dataset.t)});
document.getElementById('navEggs').addEventListener('click',function(e){var b=e.target.closest('.egg');if(b){snd.click();selE=b.dataset.e;updateUI()}});
document.getElementById('worldMap').addEventListener('click',function(e){var bb=e.target.closest('[data-bwid]');if(bb){buyW(bb.dataset.bwid);return}var cd=e.target.closest('.wcard');if(cd&&isUW(cd.dataset.wid))setW(cd.dataset.wid)});
document.getElementById('btnBuy').addEventListener('click',function(){openE(false)});
document.getElementById('btnBuy3').addEventListener('click',function(){if(!G.x3){snd.err();toast('Desbloquea el x3 en la tienda LU (100 monedas)','err');setTab('lu');return}openMulti(3)});
document.getElementById('btnAuto').addEventListener('click',hAuto);
document.getElementById('btnRb').addEventListener('click',doRb);
document.getElementById('overlay').addEventListener('click',function(e){if(e.target.id==='oclose'||e.target.closest('#oclose'))return;hClick()});
document.getElementById('oclose').addEventListener('click',function(e){e.stopPropagation();closeH()});
document.getElementById('petList').addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;var act=b.dataset.act,id=parseInt(b.dataset.id,10);if(act==='up')doUp(id);else if(act==='sell')doSell(id)});
document.getElementById('pHub').addEventListener('click',function(e){var u=e.target.closest('[data-upg]');if(u){buyUpg(u.dataset.upg);return}if(e.target.closest('#btnDaily'))claimDaily()});
document.getElementById('luShop').addEventListener('click',function(e){var b=e.target.closest('[data-lu]');if(b&&!b.disabled){buyWithLu(LU_SHOP_ITEMS[parseInt(b.dataset.lu,10)])}});
document.getElementById('rkName').addEventListener('input',function(){G.pn=this.value.trim().slice(0,14)||'Mi Base';save()});
document.getElementById('confirmYes').addEventListener('click',function(){hideCf();if(cfCb)cfCb()});
document.getElementById('confirmNo').addEventListener('click',hideCf);

updateUI();

// ===== GAME LOOP =====
var lastPetCount=G.pets.length;
setInterval(function(){
  var inc=tI();
  if(inc>0){G.money+=inc;G.te+=inc;if(inc>=10&&Math.random()<.15)floatM(inc)}
  if(G.aon){var per=1+(G.upg?G.upg.auto:0);for(var i=0;i<per;i++){if(G.money<eggCost(selE))break;openE(true)}}
  if(G.pets.length!==lastPetCount){lastPetCount=G.pets.length;refHP()}
  checkAchs();
  updateUI();
},1000);

// ===== RANKING UPDATE =====
setInterval(function(){updRk();if(aTab==='rank')renderRk()},5000);

setInterval(save,8000);

// ===== SMOOTH MONEY DISPLAY =====
function rLoop(){var diff=G.money-G.dm;if(Math.abs(diff)>.5){G.dm+=diff*.15;document.getElementById('sMoney').textContent='$'+fmt(Math.round(G.dm))}requestAnimationFrame(rLoop)}
requestAnimationFrame(rLoop);

// ===== AUDIO INIT ON FIRST INTERACTION =====
document.addEventListener('click',function(){snd.go()},{once:true});
document.addEventListener('touchstart',function(){snd.go()},{once:true});
