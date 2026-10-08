import * as THREE from 'three';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, runTransaction, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* 👑 ADMIN — guillevarelacors = admin + super (poderes web) */
var ADMIN_EMAILS=['guillevarelacors@gmail.com','guillempro07@gmail.com','ovarela@ietemple.cat'];
var SUPER_EMAILS=['guillevarelacors@gmail.com','guillempro07@gmail.com'];
var UPD_VERSION='v49',UPD_KEY='psu_update_seen_v49';

// ===== MUNDOS (31) =====
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
{id:'eterno',name:'Reino Eterno',icon:'⚔️',desc:'El trono final del universo.',color:'#fde047',color2:'#fbbf24',bonus:16,cost:5e15,eggs:['eterno','omega'],particles:'wisps'},
{id:'galaxia',name:'Galaxia Espiral',icon:'🌌',desc:'Estrellas en espiral infinita.',color:'#818cf8',color2:'#c084fc',bonus:20,cost:1e17,eggs:['galactico','nebuloso'],particles:'stars'},
{id:'temporal',name:'Distorsion Temporal',icon:'⏳',desc:'El tiempo se rompe aqui.',color:'#f472b6',color2:'#fb7185',bonus:26,cost:6e17,eggs:['cronos','destino'],particles:'wisps'},
{id:'genetico',name:'Laboratorio Genetico',icon:'🧬',desc:'Vida creada en tubos.',color:'#34d399',color2:'#a3e635',bonus:33,cost:4e18,eggs:['mutacion','adn'],particles:'leaves'},
{id:'pesadilla',name:'Reino de Pesadillas',icon:'🎭',desc:'Tus miedos cobran vida.',color:'#7c3aed',color2:'#4c1d95',bonus:42,cost:3e19,eggs:['terror','onirico'],particles:'wisps'},
{id:'tormenta',name:'Tormenta Eterna',icon:'⚡',desc:'Rayos sin fin.',color:'#facc15',color2:'#f97316',bonus:54,cost:2e20,eggs:['rayo','huracan'],particles:'stars'},
{id:'arcana',name:'Dimension Arcana',icon:'🔮',desc:'Magia pura y antigua.',color:'#a78bfa',color2:'#e879f9',bonus:68,cost:1e21,eggs:['runa','hechizo'],particles:'wisps'},
{id:'asteroide',name:'Campo de Asteroides',icon:'☄️',desc:'Rocas entre el vacio.',color:'#94a3b8',color2:'#64748b',bonus:85,cost:8e21,eggs:['rocoso','cometa'],particles:'embers'},
{id:'horizonte',name:'Horizonte de Sucesos',icon:'🕳️',desc:'Ni la luz escapa.',color:'#1e293b',color2:'#0ea5e9',bonus:110,cost:6e22,eggs:['singu','vacio'],particles:'stars'},
{id:'prisma',name:'Prisma Infinito',icon:'🌈',desc:'Luz fragmentada en colores.',color:'#f0abfc',color2:'#22d3ee',bonus:140,cost:5e23,eggs:['cromatico','refraccion'],particles:'stars'},
{id:'masalla',name:'Mas Alla del Fin',icon:'♾️',desc:'Donde termina todo... y empieza.',color:'#fde047',color2:'#f43f5e',bonus:180,cost:4e24,eggs:['final','trascende'],particles:'wisps'},
{id:'alquimia',name:'Taller Alquimico',icon:'⚗️',desc:'Transmutacion y elixires.',color:'#fbbf24',color2:'#a3e635',bonus:230,cost:3e25,eggs:['elixir','homunculo'],particles:'wisps'},
{id:'sombras',name:'Dominio de las Sombras',icon:'🕶️',desc:'La luz no entra aqui.',color:'#475569',color2:'#7c3aed',bonus:300,cost:2e26,eggs:['penumbra','oscuridad'],particles:'wisps'},
{id:'paraiso',name:'Jardin del Eden',icon:'🕊️',desc:'La belleza eterna.',color:'#fde68a',color2:'#34d399',bonus:400,cost:1.5e27,eggs:['celestial','eden'],particles:'stars'},
{id:'caos',name:'Ojo del Caos',icon:'🌀',desc:'Nada tiene sentido.',color:'#f43f5e',color2:'#8b5cf6',bonus:520,cost:1e28,eggs:['caos','entropia'],particles:'embers'},
{id:'zenit',name:'Cumbre del Zenit',icon:'🗻',desc:'El punto mas alto del universo.',color:'#7dd3fc',color2:'#fbbf24',bonus:700,cost:8e28,eggs:['zenit','cumbre'],particles:'stars'}
];

// ===== MASCOTAS (309) =====
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
{ic:'fa-solid fa-paw',n:'Mono',r:'common',e:12,eg:['salvaje'],c:'#a16207'},{ic:'fa-solid fa-worm',n:'Serpiente',r:'common',e:16,eg:['salvaje'],c:'#4d7c0f'},{ic:'fa-solid fa-paw',n:'Jaguar',r:'rare',e:42,eg:['salvaje'],c:'#d97706'},{ic:'fa-solid fa-paw',n:'Gorila',r:'rare',e:55,eg:['salvaje'],c:'#57534e'},{ic:'fa-solid fa-paw',n:'Pantera',r:'epic',e:95,eg:['salvaje'],c:'#1f2937'},{ic:'fa-solid fa-worm',n:'Anaconda',r:'epic',e:115,eg:['salvaje'],c:'#166534'},{ic:'fa-solid fa-crown',n:'Rey Jungla',r:'god',e:230,eg:['salvaje'],c:'#65a30d'},{ic:'fa-solid fa-tree',n:'Arbol Milenario',r:'legendary',e:600,eg:['salvaje'],c:'#3f6212'},
{ic:'fa-solid fa-frog',n:'Sapo Veneno',r:'rare',e:60,eg:['toxico'],c:'#84cc16'},{ic:'fa-solid fa-bug',n:'Escarabajo',r:'rare',e:78,eg:['toxico'],c:'#a3e635'},{ic:'fa-solid fa-spider',n:'Tarantula',r:'epic',e:150,eg:['toxico'],c:'#4c1d95'},{ic:'fa-solid fa-leaf',n:'Planta Carnivora',r:'god',e:320,eg:['toxico'],c:'#dc2626'},{ic:'fa-solid fa-radiation',n:'Esporas Vivas',r:'legendary',e:800,eg:['toxico'],c:'#22c55e'},{ic:'fa-solid fa-skull',n:'Guardian Toxico',r:'mythic',e:2000,eg:['toxico'],c:'#166534'},{ic:'fa-solid fa-vial-virus',n:'Virus Mutante',r:'secret',e:5000,eg:['toxico'],c:'#a3e635'},
{ic:'fa-solid fa-paw',n:'Jerbo',r:'common',e:30,eg:['dunas'],c:'#d4a574'},{ic:'fa-solid fa-paw',n:'Camello',r:'common',e:40,eg:['dunas'],c:'#b45309'},{ic:'fa-solid fa-paw',n:'Feneco',r:'rare',e:90,eg:['dunas'],c:'#fdba74'},{ic:'fa-solid fa-feather-pointed',n:'Halcon',r:'rare',e:110,eg:['dunas'],c:'#92400e'},{ic:'fa-solid fa-paw',n:'Chacal',r:'epic',e:200,eg:['dunas'],c:'#78716c'},{ic:'fa-solid fa-worm',n:'Cobra',r:'epic',e:260,eg:['dunas'],c:'#166534'},{ic:'fa-solid fa-wand-magic',n:'Djinn',r:'god',e:550,eg:['dunas'],c:'#0ea5e9'},{ic:'fa-solid fa-fire-flame-curved',n:'Fenix Menor',r:'legendary',e:1100,eg:['dunas'],c:'#f97316'},
{ic:'fa-solid fa-cat',n:'Gato Egipcio',r:'rare',e:180,eg:['faraon'],c:'#eab308'},{ic:'fa-solid fa-bug',n:'Escarabajo Dorado',r:'epic',e:380,eg:['faraon'],c:'#fbbf24'},{ic:'fa-solid fa-worm',n:'Uraeus',r:'epic',e:450,eg:['faraon'],c:'#16a34a'},{ic:'fa-solid fa-dog',n:'Anubis',r:'god',e:950,eg:['faraon'],c:'#78716c'},{ic:'fa-solid fa-crown',n:'Esfinge Real',r:'legendary',e:2400,eg:['faraon'],c:'#d97706'},{ic:'fa-solid fa-ankh',n:'Faraon',r:'mythic',e:6500,eg:['faraon'],c:'#eab308'},{ic:'fa-solid fa-sun',n:'Ra',r:'secret',e:16000,eg:['faraon'],c:'#f59e0b'},
{ic:'fa-solid fa-paw',n:'Pinguino',r:'common',e:150,eg:['glacial'],c:'#334155'},{ic:'fa-solid fa-paw',n:'Foca',r:'common',e:190,eg:['glacial'],c:'#94a3b8'},{ic:'fa-solid fa-paw',n:'Zorro Nevada',r:'rare',e:420,eg:['glacial'],c:'#e2e8f0'},{ic:'fa-solid fa-paw',n:'Lobo Nieve',r:'rare',e:520,eg:['glacial'],c:'#cbd5e1'},{ic:'fa-solid fa-paw',n:'Oso Polar',r:'epic',e:1000,eg:['glacial'],c:'#f8fafc'},{ic:'fa-solid fa-snowflake',n:'Yeti',r:'god',e:2400,eg:['glacial'],c:'#bae6fd'},{ic:'fa-solid fa-wind',n:'Wendigo',r:'legendary',e:6000,eg:['glacial'],c:'#7dd3fc'},
{ic:'fa-solid fa-water',n:'Morsa',r:'rare',e:900,eg:['polar'],c:'#94a3b8'},{ic:'fa-solid fa-fish-fins',n:'Narval',r:'epic',e:1800,eg:['polar'],c:'#38bdf8'},{ic:'fa-solid fa-water',n:'Leviatan Glacial',r:'god',e:3800,eg:['polar'],c:'#0284c7'},{ic:'fa-solid fa-snowflake',n:'Reina de Hielo',r:'legendary',e:9500,eg:['polar'],c:'#a5f3fc'},{ic:'fa-solid fa-dragon',n:'Dragon Glacial',r:'mythic',e:24000,eg:['polar'],c:'#60a5fa'},{ic:'fa-solid fa-temperature-low',n:'Cero Absoluto',r:'secret',e:60000,eg:['polar'],c:'#e0f2fe'},
{ic:'fa-solid fa-crow',n:'Murcielago',r:'common',e:400,eg:['tumba'],c:'#334155'},{ic:'fa-solid fa-crow',n:'Cuervo',r:'common',e:480,eg:['tumba'],c:'#1f2937'},{ic:'fa-solid fa-cat',n:'Gato Negro',r:'rare',e:900,eg:['tumba'],c:'#0f172a'},{ic:'fa-solid fa-ghost',n:'Zombie',r:'rare',e:1200,eg:['tumba'],c:'#4d7c0f'},{ic:'fa-solid fa-skull',n:'Esqueleto',r:'epic',e:2400,eg:['tumba'],c:'#e5e7eb'},{ic:'fa-solid fa-ghost',n:'Vampiro',r:'god',e:5200,eg:['tumba'],c:'#7f1d1d'},{ic:'fa-solid fa-book-skull',n:'Liche',r:'legendary',e:13000,eg:['tumba'],c:'#a78bfa'},{ic:'fa-solid fa-crown',n:'Conde Nocturno',r:'mythic',e:28000,eg:['tumba'],c:'#4c1d95'},
{ic:'fa-solid fa-bandage',n:'Momia',r:'epic',e:3800,eg:['maldito'],c:'#d6d3d1'},{ic:'fa-solid fa-bone',n:'Golem de Hueso',r:'god',e:8000,eg:['maldito'],c:'#a8a29e'},{ic:'fa-solid fa-chess-knight',n:'Caballero Caido',r:'legendary',e:19000,eg:['maldito'],c:'#64748b'},{ic:'fa-solid fa-skull',n:'Segador',r:'mythic',e:32000,eg:['maldito'],c:'#475569'},{ic:'fa-solid fa-eye',n:'Sombra Antigua',r:'secret',e:45000,eg:['maldito'],c:'#312e81'},{ic:'fa-solid fa-hourglass',n:'Parca',r:'og',e:90000,eg:['maldito'],c:'#a78bfa'},
{ic:'fa-solid fa-paw',n:'Oso Gominola',r:'common',e:900,eg:['goloso'],c:'#f472b6'},{ic:'fa-solid fa-cat',n:'Gato Caramelo',r:'common',e:1100,eg:['goloso'],c:'#fb7185'},{ic:'fa-solid fa-dog',n:'Perro Chicle',r:'rare',e:2400,eg:['goloso'],c:'#f9a8d4'},{ic:'fa-solid fa-paw',n:'Conejo Masmallow',r:'rare',e:3000,eg:['goloso'],c:'#fbcfe8'},{ic:'fa-solid fa-paw',n:'Foca Gelatina',r:'epic',e:5500,eg:['goloso'],c:'#fda4af'},{ic:'fa-solid fa-star',n:'Arcoiris Dulce',r:'god',e:12000,eg:['goloso'],c:'#a5f3fc'},{ic:'fa-solid fa-cake-candles',n:'Pastel Vivo',r:'legendary',e:30000,eg:['goloso'],c:'#f472b6'},
{ic:'fa-solid fa-bread-slice',n:'Croissant',r:'rare',e:5000,eg:['pastel'],c:'#d9a05b'},{ic:'fa-solid fa-ice-cream',n:'Helado Vivo',r:'epic',e:9000,eg:['pastel'],c:'#fbcfe8'},{ic:'fa-solid fa-cookie-bite',n:'Rey Donut',r:'god',e:18000,eg:['pastel'],c:'#b45309'},{ic:'fa-solid fa-crown',n:'Emperador Pastel',r:'legendary',e:38000,eg:['pastel'],c:'#ec4899'},{ic:'fa-solid fa-cookie',n:'Dulce Final',r:'mythic',e:55000,eg:['pastel'],c:'#f472b6'},{ic:'fa-solid fa-star',n:'Azucar Pura',r:'secret',e:68000,eg:['pastel'],c:'#fde68a'},
{ic:'fa-solid fa-robot',n:'Robot',r:'rare',e:6000,eg:['neon'],c:'#94a3b8'},{ic:'fa-solid fa-satellite',n:'Drone',r:'rare',e:7500,eg:['neon'],c:'#22d3ee'},{ic:'fa-solid fa-gear',n:'Cyborg',r:'epic',e:12000,eg:['neon'],c:'#7dd3fc'},{ic:'fa-solid fa-user-secret',n:'Hacker',r:'epic',e:15000,eg:['neon'],c:'#a78bfa'},{ic:'fa-solid fa-motorcycle',n:'Moto Neón',r:'god',e:26000,eg:['neon'],c:'#e879f9'},{ic:'fa-solid fa-brain',n:'IA Viva',r:'legendary',e:48000,eg:['neon'],c:'#f0abfc'},{ic:'fa-solid fa-bolt',n:'Overclock',r:'mythic',e:75000,eg:['neon'],c:'#fbbf24'},{ic:'fa-solid fa-code',n:'Codigo Perdido',r:'secret',e:90000,eg:['neon'],c:'#22d3ee'},
{ic:'fa-solid fa-cube',n:'Pixel',r:'epic',e:18000,eg:['virtual'],c:'#a3e635'},{ic:'fa-solid fa-user-astronaut',n:'Avatar',r:'god',e:28000,eg:['virtual'],c:'#34d399'},{ic:'fa-solid fa-virus',n:'Virus Digital',r:'legendary',e:48000,eg:['virtual'],c:'#22c55e'},{ic:'fa-solid fa-shield-halved',n:'Firewall',r:'mythic',e:70000,eg:['virtual'],c:'#0d9488'},{ic:'fa-solid fa-diagram-project',n:'Singularidad Datos',r:'secret',e:85000,eg:['virtual'],c:'#06b6d4'},{ic:'fa-solid fa-database',n:'Mainframe',r:'og',e:95000,eg:['virtual'],c:'#0891b2'},
{ic:'fa-solid fa-dragon',n:'Dragon Bebe',r:'rare',e:22000,eg:['draconico'],c:'#4ade80'},{ic:'fa-solid fa-dragon',n:'Wyvern',r:'epic',e:38000,eg:['draconico'],c:'#f97316'},{ic:'fa-solid fa-dragon',n:'Dragon Jade',r:'god',e:60000,eg:['draconico'],c:'#16a34a'},{ic:'fa-solid fa-dragon',n:'Dragon Sangre',r:'legendary',e:85000,eg:['draconico'],c:'#dc2626'},{ic:'fa-solid fa-dragon',n:'Dragon Ancestral',r:'mythic',e:100000,eg:['draconico'],c:'#991b1b'},{ic:'fa-solid fa-dragon',n:'Dragon Oculto',r:'secret',e:120000,eg:['draconico'],c:'#1e293b'},
{ic:'fa-solid fa-dragon',n:'Dracolich',r:'god',e:95000,eg:['wyrm'],c:'#334155'},{ic:'fa-solid fa-dragon',n:'Dragon Estelar',r:'legendary',e:130000,eg:['wyrm'],c:'#a855f7'},{ic:'fa-solid fa-crown',n:'Rey Dragon',r:'mythic',e:170000,eg:['wyrm'],c:'#ca8a04'},{ic:'fa-solid fa-meteor',n:'Rompemundos',r:'secret',e:210000,eg:['wyrm'],c:'#ea580c'},{ic:'fa-solid fa-dragon',n:'Alfa Dragon',r:'og',e:260000,eg:['wyrm'],c:'#facc15'},
{ic:'fa-solid fa-chess-rook',n:'Caballero Eterno',r:'god',e:220000,eg:['eterno'],c:'#fbbf24'},{ic:'fa-solid fa-dove',n:'Angel Guardian',r:'legendary',e:300000,eg:['eterno'],c:'#fde68a'},{ic:'fa-solid fa-sun',n:'Titan de Luz',r:'mythic',e:400000,eg:['eterno'],c:'#fde047'},{ic:'fa-solid fa-bolt-lightning',n:'Espada Viva',r:'secret',e:520000,eg:['eterno'],c:'#fef3c7'},{ic:'fa-solid fa-crown',n:'Centinela Eterno',r:'og',e:650000,eg:['eterno'],c:'#f59e0b'},
{ic:'fa-solid fa-infinity',n:'Omega',r:'mythic',e:750000,eg:['omega'],c:'#c026d3'},{ic:'fa-solid fa-seedling',n:'Genesis',r:'secret',e:950000,eg:['omega'],c:'#34d399'},{ic:'fa-solid fa-crown',n:'EL UNO',r:'og',e:1250000,eg:['omega'],c:'#fde047'},
{ic:'fa-solid fa-meteor',n:'Cometa Menor',r:'legendary',e:250000,eg:['galactico'],c:'#7dd3fc'},{ic:'fa-solid fa-star',n:'Guardian Estelar',r:'god',e:500000,eg:['galactico'],c:'#fbbf24'},{ic:'fa-solid fa-bolt',n:'Quasar',r:'mythic',e:1200000,eg:['galactico'],c:'#22d3ee'},{ic:'fa-solid fa-circle-nodes',n:'Agujero Gusano',r:'secret',e:3000000,eg:['galactico'],c:'#818cf8'},{ic:'fa-solid fa-star',n:'Andromeda',r:'og',e:8000000,eg:['galactico'],c:'#c084fc'},
{ic:'fa-solid fa-cloud',n:'Bruma Sagrada',r:'legendary',e:320000,eg:['nebuloso'],c:'#a5b4fc'},{ic:'fa-solid fa-heart',n:'Corazon Nebular',r:'god',e:640000,eg:['nebuloso'],c:'#f0abfc'},{ic:'fa-solid fa-satellite',n:'Pulsar Gemelo',r:'mythic',e:1600000,eg:['nebuloso'],c:'#22d3ee'},{ic:'fa-solid fa-ghost',n:'Estrella Muerta',r:'secret',e:4000000,eg:['nebuloso'],c:'#64748b'},{ic:'fa-solid fa-globe',n:'Giga Estructura',r:'og',e:10000000,eg:['nebuloso'],c:'#818cf8'},
{ic:'fa-solid fa-hourglass-half',n:'Arena del Tiempo',r:'legendary',e:420000,eg:['cronos'],c:'#fde68a'},{ic:'fa-solid fa-clock',n:'Reloj Vivo',r:'mythic',e:2100000,eg:['cronos'],c:'#f472b6'},{ic:'fa-solid fa-circle-question',n:'Paradoja',r:'secret',e:5000000,eg:['cronos'],c:'#fb7185'},{ic:'fa-solid fa-hourglass',n:'CRONOS',r:'og',e:13000000,eg:['cronos'],c:'#fbbf24'},
{ic:'fa-solid fa-scroll',n:'Hilo del Destino',r:'mythic',e:2600000,eg:['destino'],c:'#f472b6'},{ic:'fa-solid fa-eye',n:'Ojo del Oraculo',r:'secret',e:6000000,eg:['destino'],c:'#22d3ee'},{ic:'fa-solid fa-book-skull',n:'El Escrito',r:'og',e:16000000,eg:['destino'],c:'#c026d3'},
{ic:'fa-solid fa-dna',n:'Cepa Alfa',r:'legendary',e:550000,eg:['mutacion'],c:'#34d399'},{ic:'fa-solid fa-flask',n:'Mutante Prime',r:'god',e:1100000,eg:['mutacion'],c:'#a3e635'},{ic:'fa-solid fa-bug',n:'Aberracion',r:'mythic',e:2700000,eg:['mutacion'],c:'#84cc16'},{ic:'fa-solid fa-vial-virus',n:'Organismo X',r:'secret',e:6500000,eg:['mutacion'],c:'#4ade80'},{ic:'fa-solid fa-dna',n:'Alfa ADN',r:'og',e:17000000,eg:['mutacion'],c:'#22c55e'},
{ic:'fa-solid fa-link',n:'Helice',r:'legendary',e:700000,eg:['adn'],c:'#38bdf8'},{ic:'fa-solid fa-user-astronaut',n:'Clon Maestro',r:'mythic',e:3200000,eg:['adn'],c:'#22d3ee'},{ic:'fa-solid fa-dna',n:'Genoma',r:'secret',e:7500000,eg:['adn'],c:'#0ea5e9'},{ic:'fa-solid fa-seedling',n:'ADN Primordial',r:'og',e:19000000,eg:['adn'],c:'#34d399'},
{ic:'fa-solid fa-ghost',n:'Susurro',r:'legendary',e:850000,eg:['terror'],c:'#a78bfa'},{ic:'fa-solid fa-masks-theater',n:'Pesadilla Andante',r:'god',e:1700000,eg:['terror'],c:'#7c3aed'},{ic:'fa-solid fa-skull',n:'Demonio Interior',r:'mythic',e:4000000,eg:['terror'],c:'#6d28d9'},{ic:'fa-solid fa-moon',n:'Terror Nocturno',r:'secret',e:9000000,eg:['terror'],c:'#4c1d95'},{ic:'fa-solid fa-face-dizzy',n:'El Miedo',r:'og',e:23000000,eg:['terror'],c:'#c084fc'},
{ic:'fa-solid fa-cloud-moon',n:'Sueno Roto',r:'mythic',e:4800000,eg:['onirico'],c:'#8b5cf6'},{ic:'fa-solid fa-bed',n:'Somnambulo',r:'secret',e:11000000,eg:['onirico'],c:'#a78bfa'},{ic:'fa-solid fa-crown',n:'Rey de Pesadillas',r:'og',e:29000000,eg:['onirico'],c:'#7c3aed'},
{ic:'fa-solid fa-bolt-lightning',n:'Chispa Viviente',r:'legendary',e:1100000,eg:['rayo'],c:'#fde047'},{ic:'fa-solid fa-cloud-bolt',n:'Tormenta Viva',r:'god',e:2200000,eg:['rayo'],c:'#facc15'},{ic:'fa-solid fa-bolt',n:'Fulgor',r:'mythic',e:5200000,eg:['rayo'],c:'#fbbf24'},{ic:'fa-solid fa-bolt-lightning',n:'Descarga Total',r:'secret',e:12000000,eg:['rayo'],c:'#f59e0b'},{ic:'fa-solid fa-bolt',n:'Zeus Eterno',r:'og',e:31000000,eg:['rayo'],c:'#fde047'},
{ic:'fa-solid fa-wind',n:'Ojo del Ciclon',r:'mythic',e:6200000,eg:['huracan'],c:'#7dd3fc'},{ic:'fa-solid fa-tornado',n:'Viento Cortante',r:'secret',e:14000000,eg:['huracan'],c:'#38bdf8'},{ic:'fa-solid fa-wind',n:'Huracan Primigenio',r:'og',e:37000000,eg:['huracan'],c:'#0ea5e9'},
{ic:'fa-solid fa-wand-sparkles',n:'Runa Gravada',r:'legendary',e:1500000,eg:['runa'],c:'#c4b5fd'},{ic:'fa-solid fa-hat-wizard',n:'Golem Arcano',r:'mythic',e:7000000,eg:['runa'],c:'#a78bfa'},{ic:'fa-solid fa-scroll',n:'Sello Antiguo',r:'secret',e:16000000,eg:['runa'],c:'#8b5cf6'},{ic:'fa-solid fa-wand-magic-sparkles',n:'Brujo Supremo',r:'og',e:42000000,eg:['runa'],c:'#e879f9'},
{ic:'fa-solid fa-wand-magic',n:'Conjuro',r:'mythic',e:8500000,eg:['hechizo'],c:'#e879f9'},{ic:'fa-solid fa-book',n:'Grimorio',r:'secret',e:19000000,eg:['hechizo'],c:'#c084fc'},{ic:'fa-solid fa-hat-wizard',n:'Hechicero Eterno',r:'og',e:50000000,eg:['hechizo'],c:'#f0abfc'},
{ic:'fa-solid fa-mountain',n:'Rocita',r:'legendary',e:1900000,eg:['rocoso'],c:'#cbd5e1'},{ic:'fa-solid fa-meteor',n:'Golem Asteriode',r:'god',e:3800000,eg:['rocoso'],c:'#94a3b8'},{ic:'fa-solid fa-mountain',n:'Meteoroide',r:'mythic',e:9000000,eg:['rocoso'],c:'#94a3b8'},{ic:'fa-solid fa-gem',n:'Nucleo Rocoso',r:'secret',e:21000000,eg:['rocoso'],c:'#a8a29e'},{ic:'fa-solid fa-globe',n:'Planetoide',r:'og',e:55000000,eg:['rocoso'],c:'#e2e8f0'},
{ic:'fa-solid fa-fire',n:'Bola de Fuego',r:'mythic',e:11000000,eg:['cometa'],c:'#f97316'},{ic:'fa-solid fa-meteor',n:'Cometa Veloz',r:'secret',e:25000000,eg:['cometa'],c:'#fb923c'},{ic:'fa-solid fa-explosion',n:'Cometa Madre',r:'og',e:66000000,eg:['cometa'],c:'#facc15'},
{ic:'fa-solid fa-water',n:'Distorsion',r:'legendary',e:2400000,eg:['singu'],c:'#38bdf8'},{ic:'fa-solid fa-circle',n:'Singularidad',r:'mythic',e:11000000,eg:['singu'],c:'#0284c7'},{ic:'fa-solid fa-circle-nodes',n:'Horizonte',r:'secret',e:26000000,eg:['singu'],c:'#0ea5e9'},{ic:'fa-solid fa-circle-xmark',n:'Devorador',r:'og',e:68000000,eg:['singu'],c:'#1d4ed8'},
{ic:'fa-solid fa-ghost',n:'Eco del Vacio',r:'mythic',e:14000000,eg:['vacio'],c:'#475569'},{ic:'fa-solid fa-moon',n:'Nada Viva',r:'secret',e:32000000,eg:['vacio'],c:'#1e293b'},{ic:'fa-solid fa-circle-xmark',n:'Vacio Absoluto',r:'og',e:82000000,eg:['vacio'],c:'#0f172a'},
{ic:'fa-solid fa-diamond',n:'Fraccion',r:'mythic',e:18000000,eg:['cromatico'],c:'#f0abfc'},{ic:'fa-solid fa-rainbow',n:'Espectro Cromatico',r:'secret',e:40000000,eg:['cromatico'],c:'#22d3ee'},{ic:'fa-solid fa-gem',n:'Prisma Vivo',r:'og',e:100000000,eg:['cromatico'],c:'#e879f9'},
{ic:'fa-solid fa-star',n:'Reflejo',r:'mythic',e:22000000,eg:['refraccion'],c:'#f0abfc'},{ic:'fa-solid fa-rainbow',n:'Arco Eterno',r:'secret',e:50000000,eg:['refraccion'],c:'#a5f3fc'},{ic:'fa-solid fa-sun',n:'Luz Absoluta',r:'og',e:125000000,eg:['refraccion'],c:'#fde047'},
{ic:'fa-solid fa-hourglass-end',n:'Ultimo Aliento',r:'mythic',e:26000000,eg:['final'],c:'#f43f5e'},{ic:'fa-solid fa-ban',n:'Punto Final',r:'secret',e:60000000,eg:['final'],c:'#be123c'},{ic:'fa-solid fa-flag-checkered',n:'EL FIN',r:'og',e:150000000,eg:['final'],c:'#fb7185'},
{ic:'fa-solid fa-infinity',n:'Trascendido',r:'mythic',e:32000000,eg:['trascende'],c:'#fde047'},{ic:'fa-solid fa-feather-pointed',n:'Mas Alla',r:'secret',e:75000000,eg:['trascende'],c:'#fef08a'},{ic:'fa-solid fa-infinity',n:'INFINITO',r:'og',e:190000000,eg:['trascende'],c:'#fde047'},
{ic:'fa-solid fa-flask',n:'Elixir Vital',r:'legendary',e:3000000,eg:['elixir'],c:'#fbbf24'},{ic:'fa-solid fa-hat-wizard',n:'Alquimista Real',r:'god',e:6000000,eg:['elixir'],c:'#a3e635'},{ic:'fa-solid fa-fire-flame-curved',n:'Caldero Viviente',r:'mythic',e:14000000,eg:['elixir'],c:'#f59e0b'},{ic:'fa-solid fa-gem',n:'Piedra Filosofal',r:'secret',e:32000000,eg:['elixir'],c:'#fde047'},{ic:'fa-solid fa-flask-vial',n:'Mercurio Rojo',r:'og',e:80000000,eg:['elixir'],c:'#fbbf24'},
{ic:'fa-solid fa-user',n:'Homunculo',r:'mythic',e:16000000,eg:['homunculo'],c:'#34d399'},{ic:'fa-solid fa-dna',n:'Criatura Perfecta',r:'secret',e:36000000,eg:['homunculo'],c:'#a3e635'},{ic:'fa-solid fa-crown',n:'Dios Alquimico',r:'og',e:90000000,eg:['homunculo'],c:'#22c55e'},
{ic:'fa-solid fa-ghost',n:'Sombra Timida',r:'legendary',e:4000000,eg:['penumbra'],c:'#64748b'},{ic:'fa-solid fa-eye',n:'Acechador',r:'god',e:8000000,eg:['penumbra'],c:'#475569'},{ic:'fa-solid fa-moon',n:'Golem de Sombra',r:'mythic',e:18000000,eg:['penumbra'],c:'#334155'},{ic:'fa-solid fa-ghost',n:'Sombra sin Dueno',r:'secret',e:40000000,eg:['penumbra'],c:'#1e293b'},{ic:'fa-solid fa-circle-half-stroke',n:'Penumbra Eterna',r:'og',e:100000000,eg:['penumbra'],c:'#4c1d95'},
{ic:'fa-solid fa-ghost',n:'Devora Luz',r:'mythic',e:20000000,eg:['oscuridad'],c:'#0f172a'},{ic:'fa-solid fa-heart-crack',n:'Corazon Negro',r:'secret',e:45000000,eg:['oscuridad'],c:'#1e1b4b'},{ic:'fa-solid fa-circle-xmark',n:'La Oscuridad',r:'og',e:115000000,eg:['oscuridad'],c:'#0f0f1a'},
{ic:'fa-solid fa-dove',n:'Querubin',r:'legendary',e:5000000,eg:['celestial'],c:'#fde68a'},{ic:'fa-solid fa-feather-pointed',n:'Serafin Dorado',r:'god',e:10000000,eg:['celestial'],c:'#fbbf24'},{ic:'fa-solid fa-sun',n:'Arcangel de Luz',r:'mythic',e:22000000,eg:['celestial'],c:'#fef3c7'},{ic:'fa-solid fa-bolt',n:'Voz del Cielo',r:'secret',e:50000000,eg:['celestial'],c:'#fde047'},{ic:'fa-solid fa-cloud',n:'Paraiso',r:'og',e:130000000,eg:['celestial'],c:'#fef9c3'},
{ic:'fa-solid fa-tree',n:'Arbol del Eden',r:'mythic',e:26000000,eg:['eden'],c:'#34d399'},{ic:'fa-solid fa-apple-whole',n:'Fruta Prohibida',r:'secret',e:58000000,eg:['eden'],c:'#f43f5e'},{ic:'fa-solid fa-shield-halved',n:'Guardian del Eden',r:'og',e:150000000,eg:['eden'],c:'#fbbf24'},
{ic:'fa-solid fa-burst',n:'Chispa del Caos',r:'mythic',e:30000000,eg:['caos'],c:'#f43f5e'},{ic:'fa-solid fa-tornado',n:'Torbellino Caotico',r:'secret',e:66000000,eg:['caos'],c:'#8b5cf6'},{ic:'fa-solid fa-circle-nodes',n:'CAOS',r:'og',e:170000000,eg:['caos'],c:'#f472b6'},
{ic:'fa-solid fa-arrow-down-a-z',n:'Entropia',r:'mythic',e:36000000,eg:['entropia'],c:'#64748b'},{ic:'fa-solid fa-shuffle',n:'Desorden Perfecto',r:'secret',e:80000000,eg:['entropia'],c:'#a78bfa'},{ic:'fa-solid fa-ban',n:'Fin del Orden',r:'og',e:210000000,eg:['entropia'],c:'#4c1d95'},
{ic:'fa-solid fa-mountain',n:'Cima',r:'mythic',e:42000000,eg:['zenit'],c:'#7dd3fc'},{ic:'fa-solid fa-mountain-sun',n:'Cumbre Eterna',r:'secret',e:95000000,eg:['zenit'],c:'#38bdf8'},{ic:'fa-solid fa-flag',n:'EL ZENIT',r:'og',e:260000000,eg:['zenit'],c:'#fbbf24'},
{ic:'fa-solid fa-mountain-city',n:'Cumbre Dorada',r:'mythic',e:50000000,eg:['cumbre'],c:'#fde047'},{ic:'fa-solid fa-feather-pointed',n:'Mas Alto que el Cielo',r:'secret',e:110000000,eg:['cumbre'],c:'#fef08a'},{ic:'fa-solid fa-crown',n:'Zenit Absoluto',r:'og',e:300000000,eg:['cumbre'],c:'#fde047'}
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
omega:{mythic:25,secret:35,og:40},
galactico:{god:20,legendary:30,mythic:30,secret:12,og:8},
nebuloso:{god:12,legendary:25,mythic:33,secret:18,og:12},
cronos:{legendary:18,mythic:34,secret:26,og:22},
destino:{mythic:30,secret:34,og:36},
mutacion:{god:14,legendary:26,mythic:32,secret:16,og:12},
adn:{legendary:15,mythic:30,secret:28,og:27},
terror:{god:10,legendary:22,mythic:30,secret:20,og:18},
onirico:{mythic:28,secret:32,og:40},
rayo:{god:8,legendary:20,mythic:32,secret:22,og:18},
huracan:{mythic:25,secret:33,og:42},
runa:{legendary:14,mythic:28,secret:28,og:30},
hechizo:{mythic:24,secret:32,og:44},
rocoso:{god:6,legendary:16,mythic:30,secret:24,og:24},
cometa:{mythic:22,secret:34,og:44},
singu:{legendary:10,mythic:24,secret:30,og:36},
vacio:{mythic:20,secret:34,og:46},
cromatico:{mythic:18,secret:32,og:50},
refraccion:{mythic:24,secret:30,og:46},
final:{mythic:16,secret:32,og:52},
trascende:{mythic:14,secret:30,og:56},
elixir:{god:18,legendary:28,mythic:30,secret:14,og:10},
homunculo:{legendary:12,mythic:30,secret:28,og:30},
penumbra:{god:14,legendary:24,mythic:30,secret:18,og:14},
oscuridad:{mythic:26,secret:32,og:42},
celestial:{god:16,legendary:26,mythic:30,secret:16,og:12},
eden:{mythic:26,secret:32,og:42},
caos:{mythic:24,secret:32,og:44},
entropia:{mythic:22,secret:32,og:46},
zenit:{mythic:20,secret:32,og:48},
cumbre:{mythic:18,secret:30,og:52}
};
var RCOL={common:'#9ca3af',rare:'#38bdf8',epic:'#c084fc',god:'#fbbf24',legendary:'#f87171',mythic:'#f472b6',secret:'#22d3ee',og:'#fbbf24'};
var RNAME={common:'Comun',rare:'Raro',epic:'Epico',god:'Dios',legendary:'Legendario',mythic:'Mitico',secret:'Secreto',og:'OG'};
var RORD={common:1,rare:2,epic:3,god:4,legendary:5,mythic:6,secret:7,og:8};
var RKEYS=['common','rare','epic','god','legendary','mythic','secret','og'];
var ESCLS={basico:'es-bas',dorado:'es-dor',campestre:'es-cam',arcano:'es-arc',marino:'es-mar',abisal:'es-abi',cristalino:'es-cri',gema:'es-gem',magmatico:'es-mag',infernal:'es-inf',divino:'es-div',ancestral:'es-anc',cosmico:'es-cos',estelar:'es-est',umbral:'es-umb',absoluto:'es-abs',salvaje:'es-sal',toxico:'es-tox',dunas:'es-dun',faraon:'es-far',glacial:'es-gla',polar:'es-pol',tumba:'es-tum',maldito:'es-mal',goloso:'es-gol',pastel:'es-pas',neon:'es-neo',virtual:'es-vir',draconico:'es-dra',wyrm:'es-wyr',eterno:'es-ete',omega:'es-ome',galactico:'es-cos',nebuloso:'es-est',cronos:'es-ome',destino:'es-abs',mutacion:'es-vir',adn:'es-tox',terror:'es-mal',onirico:'es-umb',rayo:'es-arc',huracan:'es-inf',runa:'es-anc',hechizo:'es-div',rocoso:'es-tum',cometa:'es-mag',singu:'es-umb',vacio:'es-abs',cromatico:'es-gem',refraccion:'es-cri',final:'es-abs',trascende:'es-ome',elixir:'es-anc',homunculo:'es-vir',penumbra:'es-umb',oscuridad:'es-abs',celestial:'es-div',eden:'es-ete',caos:'es-mag',entropia:'es-mal',zenit:'es-gla',cumbre:'es-ome'};
var ENAMES={basico:'Basico',dorado:'Dorado',campestre:'Campestre',arcano:'Arcano',marino:'Marino',abisal:'Abisal',cristalino:'Cristalino',gema:'Gema',magmatico:'Magmatico',infernal:'Infernal',divino:'Divino',ancestral:'Ancestral',cosmico:'Cosmico',estelar:'Estelar',umbral:'Umbral',absoluto:'Absoluto',salvaje:'Salvaje',toxico:'Toxico',dunas:'Dunas',faraon:'Faraon',glacial:'Glacial',polar:'Polar',tumba:'Tumba',maldito:'Maldito',goloso:'Goloso',pastel:'Pastel',neon:'Neon',virtual:'Virtual',draconico:'Draconico',wyrm:'Wyrm',eterno:'Eterno',omega:'Omega',galactico:'Galactico',nebuloso:'Nebuloso',cronos:'Cronos',destino:'Destino',mutacion:'Mutacion',adn:'ADN',terror:'Terror',onirico:'Onirico',rayo:'Rayo',huracan:'Huracan',runa:'Runa',hechizo:'Hechizo',rocoso:'Rocoso',cometa:'Cometa',singu:'Singularidad',vacio:'Vacio',cromatico:'Cromatico',refraccion:'Refraccion',final:'Final',trascende:'Trascendente',elixir:'Elixir',homunculo:'Homunculo',penumbra:'Penumbra',oscuridad:'Oscuridad',celestial:'Celestial',eden:'Eden',caos:'Caos',entropia:'Entropia',zenit:'Zenit',cumbre:'Cumbre'};
var E3DG={basico:'linear-gradient(145deg,#f8fafc,#cbd5e1,#94a3b8)',dorado:'linear-gradient(145deg,#fef3c7,#f59e0b,#d97706)',campestre:'linear-gradient(145deg,#065f46,#10b981,#84cc16)',arcano:'linear-gradient(145deg,#4c1d95,#8b5cf6,#c084fc)',marino:'linear-gradient(145deg,#0c4a6e,#0ea5e9,#22d3ee)',abisal:'linear-gradient(145deg,#0f172a,#1e3a5f,#0ea5e9)',cristalino:'linear-gradient(145deg,#ec4899,#f0abfc,#e879f9)',gema:'linear-gradient(145deg,#f43f5e,#a855f7,#3b82f6)',magmatico:'linear-gradient(145deg,#7c2d12,#ea580c,#facc15)',infernal:'linear-gradient(145deg,#7f1d1d,#dc2626,#f97316)',divino:'linear-gradient(145deg,#fef9c3,#fde68a,#fff)',ancestral:'linear-gradient(145deg,#92400e,#d97706,#fbbf24)',cosmico:'linear-gradient(145deg,#1e1b4b,#7c3aed,#06b6d4)',estelar:'linear-gradient(145deg,#1e1b4b,#7c3aed,#ec4899)',umbral:'linear-gradient(145deg,#0f0f23,#312e81,#000)',absoluto:'conic-gradient(from 0deg,#f43f5e,#a855f7,#3b82f6,#10b981,#fbbf24,#f43f5e)',salvaje:'linear-gradient(145deg,#14532d,#16a34a,#84cc16)',toxico:'linear-gradient(145deg,#365314,#65a30d,#a3e635)',dunas:'linear-gradient(145deg,#92400e,#fbbf24,#fde68a)',faraon:'linear-gradient(145deg,#78350f,#f59e0b,#fbbf24)',glacial:'linear-gradient(145deg,#0c4a6e,#38bdf8,#e0f2fe)',polar:'linear-gradient(145deg,#082f49,#0ea5e9,#a5f3fc)',tumba:'linear-gradient(145deg,#1c1917,#525252,#a8a29e)',maldito:'linear-gradient(145deg,#2e1065,#7c3aed,#a78bfa)',goloso:'linear-gradient(145deg,#be185d,#f472b6,#fbcfe8)',pastel:'linear-gradient(145deg,#9d174d,#ec4899,#f9a8d4)',neon:'linear-gradient(145deg,#0f172a,#e879f9,#22d3ee)',virtual:'linear-gradient(145deg,#052e16,#22c55e,#a3e635)',draconico:'linear-gradient(145deg,#450a0a,#dc2626,#f97316)',wyrm:'linear-gradient(145deg,#1c1917,#7c2d12,#facc15)',eterno:'linear-gradient(145deg,#fef9c3,#fffbeb,#fbbf24)',omega:'conic-gradient(from 0deg,#fbbf24,#f472b6,#22d3ee,#a3e635,#e879f9,#fbbf24)',galactico:'linear-gradient(145deg,#1e1b4b,#818cf8,#c084fc)',nebuloso:'linear-gradient(145deg,#312e81,#a5b4fc,#f0abfc)',cronos:'linear-gradient(145deg,#4c0519,#f472b6,#fde68a)',destino:'linear-gradient(145deg,#0f0f23,#f472b6,#22d3ee)',mutacion:'linear-gradient(145deg,#052e16,#34d399,#a3e635)',adn:'linear-gradient(145deg,#0c4a6e,#22d3ee,#4ade80)',terror:'linear-gradient(145deg,#1e1b4b,#7c3aed,#4c1d95)',onirico:'linear-gradient(145deg,#2e1065,#8b5cf6,#000)',rayo:'linear-gradient(145deg,#713f12,#facc15,#fffbeb)',huracan:'linear-gradient(145deg,#0c4a6e,#7dd3fc,#e0f2fe)',runa:'linear-gradient(145deg,#4c1d95,#a78bfa,#fbbf24)',hechizo:'linear-gradient(145deg,#581c87,#e879f9,#c084fc)',rocoso:'linear-gradient(145deg,#1c1917,#94a3b8,#e2e8f0)',cometa:'linear-gradient(145deg,#7c2d12,#f97316,#facc15)',singu:'linear-gradient(145deg,#0f172a,#0ea5e9,#000)',vacio:'linear-gradient(145deg,#000,#1e293b,#0f172a)',cromatico:'conic-gradient(from 0deg,#f0abfc,#22d3ee,#a3e635,#fbbf24,#f0abfc)',refraccion:'conic-gradient(from 90deg,#22d3ee,#f0abfc,#fde047,#22d3ee)',final:'linear-gradient(145deg,#450a0a,#f43f5e,#fb7185)',trascende:'conic-gradient(from 0deg,#fde047,#f43f5e,#22d3ee,#fde047)',elixir:'linear-gradient(145deg,#713f12,#fbbf24,#a3e635)',homunculo:'linear-gradient(145deg,#052e16,#22c55e,#fde047)',penumbra:'linear-gradient(145deg,#0f172a,#475569,#7c3aed)',oscuridad:'linear-gradient(145deg,#000,#1e1b4b,#312e81)',celestial:'linear-gradient(145deg,#fef9c3,#fbbf24,#fff)',eden:'linear-gradient(145deg,#064e3b,#34d399,#fde68a)',caos:'conic-gradient(from 0deg,#f43f5e,#8b5cf6,#22d3ee,#f43f5e)',entropia:'linear-gradient(145deg,#111827,#64748b,#a78bfa)',zenit:'linear-gradient(145deg,#0c4a6e,#7dd3fc,#fbbf24)',cumbre:'conic-gradient(from 0deg,#fbbf24,#7dd3fc,#fde047,#fbbf24)'};
var CLICKS=5;

function defPr(){return{basico:10,dorado:500,campestre:2000,arcano:20000,salvaje:8000,toxico:6e4,marino:5e4,abisal:4e5,dunas:3e5,faraon:2e6,cristalino:2e6,gema:15e6,glacial:3e7,polar:1.2e8,magmatico:8e6,infernal:5e8,tumba:1e9,maldito:5e9,divino:5e9,ancestral:3e10,goloso:3e10,pastel:1.5e11,neon:1.2e11,virtual:8e11,cosmico:3e11,estelar:2e12,umbral:2e13,absoluto:2e14,draconico:3e12,wyrm:1.6e13,eterno:4e14,omega:2e15,galactico:3e15,nebuloso:8e15,cronos:2e16,destino:6e16,mutacion:1.5e17,adn:4e17,terror:1e18,onirico:3e18,rayo:8e18,huracan:2.5e19,runa:6e19,hechizo:2e20,rocoso:5e20,cometa:1.5e21,singu:4e21,vacio:1.2e22,cromatico:1e22,refraccion:3e22,final:8e22,trascende:2.5e23,elixir:8e23,homunculo:3e24,penumbra:1.2e24,oscuridad:4e24,celestial:5e24,eden:1.6e25,caos:6e25,entropia:2e26,zenit:7e26,cumbre:2.2e27}}

// ===== ESTADO =====
var G={money:10,dm:10,rb:0,mult:1,pets:[],disc:[],pr:defPr(),uw:['bosque'],tot:0,te:0,mut:false,nid:1,pn:'Mi Base',ao:false,aon:false,world:'bosque',x3:false,upg:{luck:0,inc:0,disc:0,fast:0,auto:0},achs:[],lastDaily:0,dailyStreak:0,lastSeen:0,boostUntil:0,webMult:1,feverUntil:0,quests:[],redeemed:{}};
var selE='basico',rbC=false,rbT=null,aTab='game',cfCb=null,hSt={pet:null,cl:0,rev:false,bur:false};
var boostActive=false,boostTimeout=null;
var eventMult=1,luckyBoost=false,eggSale=false,evtCur=null,evtEnd=0,evtT=null,multiList=null;
var IS_ADM=false,IS_SUPER=false,ME_U=null,SRV_CODES={},PSU_USES={};
var buffBarEl=null,fuseSelIds=[],admRarSel='god',admPetQ='';
var evtRainbow=false,evtMagnet=false,turboIv=null,petRainIv=null,frenesiIv=null,moneyIv=null;
var globalAt=0,lastBoostAt=0; /* v48 eventos globales · v49 boosts globales */

// ===== UTILIDADES =====
function fmt(n){if(isNaN(n)||!isFinite(n))return'0';n=Number(n);if(n<0)return'-'+fmt(-n);
 var sx=['','K','M','B','T','Qd','Qn','Sx','Sp','Oc','No','Dc','UDd','DDd','TDd','QaD','QiD'];
 var tier=Math.floor(Math.log10(Math.max(1,n))/3);if(tier<=0)return Math.floor(n).toLocaleString();
 if(tier>=sx.length)tier=sx.length-1;var suf=sx[tier],scale=Math.pow(10,tier*3),scaled=n/scale;
 if(scaled>=1000&&tier<sx.length-1){tier++;suf=sx[tier];scale=Math.pow(10,tier*3);scaled=n/scale}
 return scaled.toFixed(scaled<10?2:scaled<100?1:0)+suf}
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
function toast(m,t){var c=document.getElementById('toasts'),e=document.createElement('div');e.className='toast t-'+(t||'inf');e.textContent=m;c.appendChild(e);setTimeout(function(){e.remove()},3000)}
function floatM(a){var e=document.createElement('div');e.className='fm';e.textContent='+$'+fmt(a);e.style.left=(Math.random()*130+90)+'px';e.style.top='170px';document.getElementById('game').appendChild(e);setTimeout(function(){e.remove()},1200)}
function showCf(i,t,m,cb){document.getElementById('confirmIcon').textContent=i;document.getElementById('confirmTitle').textContent=t;document.getElementById('confirmMsg').textContent=m;cfCb=cb;document.getElementById('confirmBox').classList.add('show')}
function hideCf(){document.getElementById('confirmBox').classList.remove('show');cfCb=null}
function gW(){for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===G.world)return WORLDS[i];return WORLDS[0]}
function gW2(id){for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===id)return WORLDS[i];return WORLDS[0]}
function isUW(w){return G.uw.indexOf(w)!==-1}
function eggCost(e){return Math.floor(G.pr[e]*(1-(G.upg?G.upg.disc:0)*.04-(eggSale?.5:0)))}
function rollVariant(){var mb=evtRainbow?12:(evtMagnet?3:1);var r=Math.random();
 if(r<.0008*mb)return 2;if(r<.008*mb)return 1;return 0}
function pE(p){return(p.be||1)*(1+.15*((p.lv||1)-1))*(p.v===2?3:p.v===1?1.6:1)*(G.mult||1)*(gW().bonus||1)*(boostActive?2:1)*(1+(G.upg?G.upg.inc:0)*.1)}
function tI(){var s=0;for(var i=0;i<G.pets.length;i++)s+=pE(G.pets[i]);var m=G.webMult||1;if((G.feverUntil||0)>Date.now())m*=2;if(IS_ADM)m*=1.25;return s*eventMult*m}
function rbCo(){return Math.floor(8e5*Math.pow(2.5,G.rb))}
function uCo(p){return Math.floor((p.be||1)*25*(p.lv||1))}
function sphH(p,sz){var c=sz==='xs'?'sph-xs':'sph-sm',v=p.v===2?' rbw':p.v===1?' gld':'';return'<div class="sph '+p.r+' '+c+v+'"><div class="sph-base" style="background-color:'+p.c+'"></div><div class="sph-light"></div><div class="sph-icon"><i class="'+p.ic+'"></i></div><div class="sph-shadow"></div></div>'}
function fmtT(ms){var s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?h+'h '+m+'m':m?m+'m '+(s%60)+'s':s+'s'}
function toNum(s){s=(''+(s==null?'':s)).trim().toLowerCase();var m=s.match(/^(-?[\d.]+)\s*([kmbtq])(?![a-z])/);
 if(m){var f={k:1e3,m:1e6,b:1e9,t:1e12,q:1e15}[m[2]];return(parseFloat(m[1])||0)*f}
 var n=parseFloat(s);return isNaN(n)?0:n}
function coinBurst(n){for(var i=0;i<(n||12);i++)(function(){var c=document.createElement('span');c.className='psu-coin';c.textContent=['🪙','💰','💵','🤑'][Math.floor(Math.random()*4)];
 c.style.left=(35+Math.random()*45)+'vw';c.style.top=(40+Math.random()*35)+'vh';c.style.animationDuration=(0.9+Math.random()*0.7)+'s';
 document.body.appendChild(c);setTimeout(function(){c.remove()},1700)})()}
function usesOf(k){var u=PSU_USES[k];return(u&&typeof u==='object')?(u.n||0):(u||0)}

// ===== SONIDO =====
var snd={cx:null,go:function(){try{if(!this.cx)this.cx=new(window.AudioContext||window.webkitAudioContext)();if(this.cx.state==='suspended')this.cx.resume()}catch(e){}},t:function(f,d,tp,v){if(!this.cx||G.mut)return;try{var o=this.cx.createOscillator(),g=this.cx.createGain();o.type=tp||'sine';o.frequency.setValueAtTime(f,this.cx.currentTime);g.gain.setValueAtTime(v||.08,this.cx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.cx.currentTime+d);o.connect(g);g.connect(this.cx.destination);o.start();o.stop(this.cx.currentTime+d)}catch(e){}},hatch:function(r){this.go();var x=RKEYS.indexOf(r),s=this;if(x<=1){this.t(523,.12);setTimeout(function(){s.t(659,.15)},80)}else if(x<=3){this.t(659,.1);setTimeout(function(){s.t(784,.1)},70);setTimeout(function(){s.t(988,.15)},140)}else{[523,659,784,988,1047,1175,1319].forEach(function(f,i){setTimeout(function(){s.t(f,.2,'triangle',.06)},i*50)})}},crack:function(n,mx){this.go();this.t(300+(n/mx)*800,.06,'square',.05)},burst:function(){this.go();var s=this;[800,1000,1200].forEach(function(f,i){setTimeout(function(){s.t(f,.15,'triangle',.07)},i*40)})},click:function(){this.go();this.t(800,.04,'square',.03)},err:function(){this.go();this.t(200,.15,'sawtooth',.04)},world:function(){this.go();var s=this;[440,554,659,880].forEach(function(f,i){setTimeout(function(){s.t(f,.15,'triangle',.06)},i*80)})}};

// ===== ROLL =====
function roll(egg){var luck=1+(G.upg?G.upg.luck:0)*.06+(luckyBoost?1:0);
 var w=WEIGHTS[egg];if(!w)return PETS[0];
 var ks=Object.keys(w),aw={},t=0;
 for(var i=0;i<ks.length;i++){aw[ks[i]]=w[ks[i]]*Math.pow(luck,(RORD[ks[i]]-1)/7);t+=aw[ks[i]]}
 var r=Math.random()*t,ch=ks[0];
 for(i=0;i<ks.length;i++){r-=aw[ks[i]];if(r<=0){ch=ks[i];break}}
 var pool=[];
 for(i=0;i<PETS.length;i++){if(PETS[i].r===ch&&PETS[i].eg.indexOf(egg)!==-1)pool.push(PETS[i])}
 if(!pool.length)return PETS[0];
 return pool[Math.floor(Math.random()*pool.length)]}

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

// ===== PARTICULAS =====
var hCx,hP=[];
function spHP(rar){var c=document.getElementById('hatchCanvas');var r=c.parentElement.getBoundingClientRect();c.width=r.width*2;c.height=r.height*2;hCx=c.getContext('2d');hCx.scale(2,2);var w=r.width,h=r.height,col=RCOL[rar]||'#fff';var hi=RORD[rar]>=5;var ct=hi?140:40;var cols=hi?['#fbbf24','#f472b6','#22d3ee','#a78bfa','#34d399',col]:[col];hP=[];for(var i=0;i<ct;i++){var an=Math.random()*Math.PI*2,sp=Math.random()*9+2;hP.push({x:w/2,y:h/2,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-2,sz:Math.random()*(hi?7:5)+1,col:cols[Math.floor(Math.random()*cols.length)],l:Math.random()*50+30,ml:80,g:.08,rot:Math.random()*6,vr:(Math.random()-.5)*.3,shape:hi&&Math.random()<.5?'rect':'dot'})}anHP(w,h)}
function anHP(w,h){if(!hCx||!hP.length)return;hCx.clearRect(0,0,w,h);var al=false;for(var i=0;i<hP.length;i++){var p=hP[i];if(p.l<=0)continue;al=true;p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.l--;p.vx*=.98;p.rot+=p.vr;var a=p.l/p.ml;hCx.globalAlpha=a;hCx.fillStyle=p.col;if(p.shape==='rect'){hCx.save();hCx.translate(p.x,p.y);hCx.rotate(p.rot);hCx.fillRect(-p.sz/2,-p.sz*.3,p.sz,p.sz*.6);hCx.restore()}else{hCx.beginPath();hCx.arc(p.x,p.y,Math.max(.5,p.sz*a),0,Math.PI*2);hCx.fill()}}hCx.globalAlpha=1;if(al)requestAnimationFrame(function(){anHP(w,h)})}

// ===== TEMA =====
function apTh(){var w=gW(),r=document.documentElement;r.style.setProperty('--wa',w.color);r.style.setProperty('--wa2',w.color2);r.style.setProperty('--wabg',w.color+'18');r.style.setProperty('--wbd',w.color+'30');r.style.setProperty('--wsh',w.color+'40');r.style.setProperty('--wg',w.color+'20');document.getElementById('worldBadge').textContent=w.name.split(' ')[0].toUpperCase();document.getElementById('habLabel').textContent='Habitat - '+w.name;document.getElementById('sWB').textContent='x'+w.bonus.toFixed(1);document.getElementById('worldBadge').style.color=w.color;if(hGnd){try{hGnd.material.color.set(w.color);hGnd.material.color.multiplyScalar(.35)}catch(e){}}}

// ===== SAVE/LOAD (compatible, no resetea) =====
var SK='PetSimUltra_v38';
function save(){try{localStorage.setItem(SK,JSON.stringify({money:G.money,rb:G.rb,mult:G.mult,pets:G.pets,disc:G.disc,pr:G.pr,uw:G.uw,tot:G.tot,te:G.te,mut:G.mut,nid:G.nid,pn:G.pn,ao:G.ao,aon:G.aon,world:G.world,x3:G.x3,upg:G.upg,achs:G.achs,lastDaily:G.lastDaily,dailyStreak:G.dailyStreak,lastSeen:Date.now(),boostUntil:G.boostUntil,webMult:G.webMult,feverUntil:G.feverUntil,quests:G.quests,redeemed:G.redeemed}))}catch(e){}}
function load(){var raw=null;try{raw=localStorage.getItem(SK)}catch(e){return}if(!raw)return;try{var d=JSON.parse(raw);if(!d)return;
G.money=d.money||10;G.dm=G.money;G.rb=d.rb||0;G.mult=d.mult||1;G.mut=!!d.mut;G.tot=d.tot||0;G.te=d.te||0;G.nid=d.nid||1;G.pn=d.pn||'Mi Base';G.ao=!!d.ao;G.aon=!!d.aon;G.world=d.world||'bosque';G.x3=!!d.x3;G.uw=d.uw||['bosque'];if(d.pr)for(var pk in d.pr)G.pr[pk]=d.pr[pk];G.disc=d.disc||[];
G.upg=d.upg||{luck:0,inc:0,disc:0,fast:0,auto:0};G.achs=d.achs||[];G.lastDaily=d.lastDaily||0;G.dailyStreak=d.dailyStreak||0;G.lastSeen=d.lastSeen||0;G.boostUntil=d.boostUntil||0;
G.webMult=d.webMult||1;G.feverUntil=d.feverUntil||0;G.quests=d.quests||[];G.redeemed=d.redeemed||{};
G.quests=G.quests.filter(function(q){return q.st!=='comboBest'});
try{var xo=JSON.parse(localStorage.getItem('PetSimUltra_v38_addons')||'null');
 if(xo){if(!d.webMult&&xo.webMult)G.webMult=xo.webMult;if(!d.feverUntil&&xo.feverUntil)G.feverUntil=xo.feverUntil;
 if((!d.quests||!d.quests.length)&&xo.quests)G.quests=xo.quests.filter(function(q){return q.st!=='comboBest'});
 if((!d.redeemed||!Object.keys(d.redeemed).length)&&xo.redeemed)G.redeemed=xo.redeemed}}catch(e2){}
G.pets=[];
if(d.pets){for(var i=0;i<d.pets.length;i++){var p=d.pets[i];if(!p)continue;G.pets.push({ic:p.ic||'fa-solid fa-paw',n:p.n,r:p.r,be:p.be||p.e||1,lv:p.lv||1,id:p.id||G.nid++,c:p.c||'#888',eg:p.eg||[],v:p.v||0})}}}catch(e){}}
function resetG(){try{localStorage.removeItem(SK)}catch(e){}
G={money:10,dm:10,rb:0,mult:1,pets:[],disc:[],pr:defPr(),uw:['bosque'],tot:0,te:0,mut:false,nid:1,pn:'Mi Base',ao:false,aon:false,world:'bosque',x3:false,upg:{luck:0,inc:0,disc:0,fast:0,auto:0},achs:[],lastDaily:0,dailyStreak:0,lastSeen:0,boostUntil:0,webMult:1,feverUntil:0,quests:[],redeemed:{}};
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

// ===== MEJORAS / LOGROS =====
var UPGS=[
{id:'luck',n:'Suerte',d:'Mejora probabilidades de rarezas altas',ic:'fa-clover',max:10,fx:function(l){return'+'+(l*6)+'% suerte'},co:function(l){return Math.floor(8e4*Math.pow(2.6,l))}},
{id:'inc',n:'Ingresos',d:'Aumenta todo tu ingreso global',ic:'fa-chart-line',max:10,fx:function(l){return'x'+(1+l*.1).toFixed(1)+' ingreso'},co:function(l){return Math.floor(1.6e5*Math.pow(3,l))}},
{id:'disc',n:'Descuento',d:'Reduce el precio de todos los huevos',ic:'fa-tags',max:5,fx:function(l){return'-'+(l*4)+'% precio'},co:function(l){return Math.floor(4e5*Math.pow(4,l))}},
{id:'fast',n:'Rotura Rapida',d:'Menos toques para romper huevos',ic:'fa-hand-sparkles',max:4,fx:function(l){return(5-l)+' toques'},co:function(l){return Math.floor(8e5*Math.pow(4,l))}},
{id:'auto',n:'Auto Turbo',d:'Auto abre mas huevos por segundo',ic:'fa-gauge-high',max:3,fx:function(l){return(1+l)+' huevos/s'},co:function(l){return Math.floor(1.6e10*Math.pow(6,l))}}
];
var ACHS=[
{id:'e1',n:'Aprendiz',d:'Abre 25 huevos',ic:'fa-egg',goal:25,st:'tot',rw:250},
{id:'e2',n:'Incansable',d:'Abre 500 huevos',ic:'fa-box-open',goal:500,st:'tot',rw:2500},
{id:'e3',n:'Obsesionado',d:'Abre 5,000 huevos',ic:'fa-fire',goal:5000,st:'tot',rw:5e4},
{id:'e4',n:'Maestro Absoluto',d:'Abre 25,000 huevos',ic:'fa-medal',goal:25000,st:'tot',rw:1e6},
{id:'rb1',n:'Renacer',d:'Haz 2 rebirths',ic:'fa-arrows-rotate',goal:2,st:'rb',rw:5e3},
{id:'rb2',n:'Ciclo Eterno',d:'Haz 10 rebirths',ic:'fa-infinity',goal:10,st:'rb',rw:25e4},
{id:'rb3',n:'Transcendencia',d:'Haz 25 rebirths',ic:'fa-yin-yang',goal:25,st:'rb',rw:25e6},
{id:'wd1',n:'Explorador',d:'Desbloquea 6 mundos',ic:'fa-map-location-dot',goal:6,st:'uw',rw:1e4},
{id:'wd2',n:'Conquistador',d:'Desbloquea TODOS los mundos',ic:'fa-earth-americas',goal:WORLDS.length,st:'uw',rw:25e9},
{id:'mo1',n:'Magnate',d:'Gana $10M en total',ic:'fa-sack-dollar',goal:1e7,st:'te',rw:5e3},
{id:'mo2',n:'Emperador',d:'Gana $100B en total',ic:'fa-money-bill-wave',goal:1e11,st:'te',rw:5e5},
{id:'mo3',n:'Mas Alla del Dinero',d:'Gana $100T en total',ic:'fa-gem',goal:1e14,st:'te',rw:5e7},
{id:'mo4',n:'Dueno del Universo',d:'Gana $1Qa en total',ic:'fa-crown',goal:1e18,st:'te',rw:25e8},
{id:'pt1',n:'Equipo Completo',d:'Ten 25 mascotas',ic:'fa-paw',goal:25,st:'pets',rw:2500},
{id:'pt2',n:'Zoologico',d:'Ten 100 mascotas',ic:'fa-hippo',goal:100,st:'pets',rw:25e4},
{id:'co1',n:'Coleccionista',d:'Descubre 100 mascotas',ic:'fa-book',goal:100,st:'disc',rw:1e5},
{id:'co2',n:'Enciclopedia Viva',d:'Descubre TODAS las mascotas',ic:'fa-trophy',goal:PETS.length,st:'disc',rw:25e10},
{id:'go1',n:'Toque de Midas',d:'Consigue 5 mascotas DORADAS',ic:'fa-star',goal:5,st:'v1',rw:5e4},
{id:'go2',n:'Prisma Viviente',d:'Consigue 3 mascotas ARCOIRIS',ic:'fa-rainbow',goal:3,st:'v2',rw:5e6},
{id:'up1',n:'Maximizador',d:'Compra 15 niveles de mejoras',ic:'fa-arrow-up-right-dots',goal:15,st:'upg',rw:5e7}
];

// ===== EVENTOS: helpers =====
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
function spawnMysteryBox(){
 var e=document.createElement('div');e.id='psuGift';e.innerHTML='<i class="fas fa-gift"></i>';
 e.style.cssText='position:absolute;z-index:60;font-size:46px;cursor:pointer;color:#f472b6;filter:drop-shadow(0 0 14px #f472b6);animation:psuFloat 1.5s ease-in-out infinite';
 e.style.left=(Math.random()*260+40)+'px';e.style.top=(Math.random()*380+120)+'px';
 document.getElementById('game').appendChild(e);
 var done=false;
 e.addEventListener('click',function(ev){ev.stopPropagation();if(done)return;done=true;e.remove();
  var r=Math.random();
  if(r<.4){var amt=Math.max(10000,Math.floor(tI()*120));G.money+=amt;G.te+=amt;toast('🎁 CAJA: +$'+fmt(amt),'rwd');coinBurst(16);snd.hatch('god')}
  else if(r<.72){var pool=PETS.filter(function(p){return RORD[p.r]>=5});var b=pool[Math.floor(Math.random()*pool.length)];
   var np={ic:b.ic,n:b.n,r:b.r,be:b.e,lv:1,id:G.nid++,c:b.c,eg:b.eg,v:rollVariant()};
   G.pets.push(np);G.tot++;if(G.disc.indexOf(b.n)<0)G.disc.push(b.n);
   toast('🎁 CAJA: '+b.n+' ('+RNAME[b.r]+')!','rwd');snd.hatch(b.r);refHP();showH(np,true)}
  else{activateBoost(300);toast('🎁 CAJA: Boost x2 · 5 min!','rwd')}
  save();updateUI()});
 setTimeout(function(){if(e.parentNode)e.remove()},11000)}
function spawnLegendChest(){
 var old=document.getElementById('psuChest');if(old)old.remove();
 var e=document.createElement('div');e.id='psuChest';e.innerHTML='<i class="fas fa-box-open"></i>';
 e.style.cssText='position:absolute;z-index:60;font-size:48px;cursor:pointer;color:#fbbf24;filter:drop-shadow(0 0 16px #fbbf24);animation:psuFloat 1.2s ease-in-out infinite';
 e.style.left=(Math.random()*260+40)+'px';e.style.top=(Math.random()*380+120)+'px';
 document.getElementById('game').appendChild(e);
 var done=false;
 e.addEventListener('click',function(ev){ev.stopPropagation();if(done)return;done=true;e.remove();
  var pool=PETS.filter(function(p){return RORD[p.r]>=5});
  var b=pool[Math.floor(Math.random()*pool.length)];
  var np={ic:b.ic,n:b.n,r:b.r,be:b.e,lv:1,id:G.nid++,c:b.c,eg:b.eg,v:rollVariant()};
  G.pets.push(np);G.tot++;if(G.disc.indexOf(b.n)<0)G.disc.push(b.n);
  toast('🏆 COFRE LEGENDARIO: '+b.n+' ('+RNAME[b.r]+')!','rwd');snd.hatch(b.r);coinBurst(20);refHP();
  save();updateUI();showH(np,true)});
 setTimeout(function(){if(e.parentNode)e.remove()},10000)}
function petRainTick(){var tpl=roll(selE);var np={ic:tpl.ic,n:tpl.n,r:tpl.r,be:tpl.e,lv:1,id:G.nid++,c:tpl.c,eg:tpl.eg,v:rollVariant()};
 G.pets.push(np);G.tot++;if(G.disc.indexOf(tpl.n)<0)G.disc.push(tpl.n);refHP();updateUI()}
function startFreeEggs(){stopFreeEggs();turboIv=setInterval(function(){
 petRainTick();if(Math.random()<.2)toast('⚡ TURBO: mascota gratis!','inf')},1000)}
function stopFreeEggs(){if(turboIv){clearInterval(turboIv);turboIv=null}}
function startPetRain(){stopPetRain();petRainIv=setInterval(petRainTick,800)}
function stopPetRain(){if(petRainIv){clearInterval(petRainIv);petRainIv=null}}
function startFrenesi(){stopFrenesi();frenesiIv=setInterval(petRainTick,220)}
function stopFrenesi(){if(frenesiIv){clearInterval(frenesiIv);frenesiIv=null}}
function startMoneyRain(){stopMoneyRain();moneyIv=setInterval(function(){
 var amt=Math.max(1000,Math.floor(tI()*25));G.money+=amt;G.te+=amt;
 if(Math.random()<.4)toast('💵 +$'+fmt(amt),'inf');updateUI()},1500)}
function stopMoneyRain(){if(moneyIv){clearInterval(moneyIv);moneyIv=null}}

// ===== EVENTOS (15) =====
var EVENTS=[
{id:'rain',n:'LLUVIA DE DINERO x3',ic:'fa-cloud-showers-heavy',dur:60,apply:function(){eventMult=3},end:function(){eventMult=1}},
{id:'lucky',n:'SUERTE DIVINA',ic:'fa-clover',dur:45,apply:function(){luckyBoost=true},end:function(){luckyBoost=false}},
{id:'sale',n:'REBAJA 50%!',ic:'fa-tags',dur:30,apply:function(){eggSale=true},end:function(){eggSale=false}},
{id:'gold',n:'HUEVO DORADO!',ic:'fa-egg',dur:15,apply:spawnGoldEgg,end:function(){}},
{id:'fiesta',n:'FIESTA DE DINERO x5',ic:'fa-party-horn',dur:30,apply:function(){eventMult=5},end:function(){eventMult=1}},
{id:'iman',n:'IMAN DE RAREZAS',ic:'fa-magnet',dur:45,apply:function(){evtMagnet=true},end:function(){evtMagnet=false}},
{id:'rainbow',n:'HORA ARCOIRIS',ic:'fa-rainbow',dur:60,apply:function(){evtRainbow=true},end:function(){evtRainbow=false}},
{id:'caja',n:'CAJA SORPRESA',ic:'fa-gift',dur:12,apply:function(){spawnMysteryBox()},end:function(){}},
{id:'turbo',n:'TURBO DE HUEVOS',ic:'fa-gauge-high',dur:20,apply:function(){startFreeEggs()},end:function(){stopFreeEggs()}},
{id:'jackpot',n:'SUPER JACKPOT',ic:'fa-money-bill-wave',dur:5,apply:function(){var amt=Math.max(50000,Math.floor(tI()*300));G.money+=amt;G.te+=amt;toast('💸 SUPER JACKPOT +$'+fmt(amt),'rwd');coinBurst(25);snd.hatch('og');save();updateUI()},end:function(){}},
{id:'mega',n:'MEGA FIESTA x10',ic:'fa-star',dur:30,apply:function(){eventMult=10},end:function(){eventMult=1}},
{id:'petrain',n:'LLUVIA DE MASCOTAS',ic:'fa-cloud-rain',dur:15,apply:function(){startPetRain()},end:function(){stopPetRain()}},
{id:'frenesi',n:'FRENESI DE HUEVOS',ic:'fa-fire',dur:12,apply:function(){startFrenesi()},end:function(){stopFrenesi()}},
{id:'cofre',n:'COFRE LEGENDARIO',ic:'fa-box-open',dur:10,apply:function(){spawnLegendChest()},end:function(){}},
{id:'dinero',n:'DINERO LOCO',ic:'fa-money-bill-trend-up',dur:20,apply:function(){startMoneyRain()},end:function(){stopMoneyRain()}}
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
function forceEvt(id){var ev=null;for(var i=0;i<EVENTS.length;i++)if(EVENTS[i].id===id)ev=EVENTS[i];if(!ev)return;
 if(evtCur){try{evtCur.end()}catch(e){}clearInterval(evtT);evtCur=null}
 evtCur=ev;evtEnd=Date.now()+ev.dur*1000;
 try{ev.apply()}catch(e){}
 toast(ev.n+'!','rwd');snd.world();
 var b=document.getElementById('evtBanner');
 if(b){b.style.display='flex';b.innerHTML='<i class="fas '+ev.ic+'"></i><span>'+ev.n+'</span><span class="evt-t" id="evtT">'+ev.dur+'s</span>'}
 evtT=setInterval(function(){var s=Math.ceil((evtEnd-Date.now())/1000);
  if(s<=0){endEvent();return}
  var e2=document.getElementById('evtT');if(e2)e2.textContent=s+'s'},500)}

function dailyReward(){return Math.floor(1400*Math.pow(1.6,Math.min((G.dailyStreak||0)+1,12))*(1+G.rb*.5))}
function claimDaily(){
  if(Date.now()-G.lastDaily<82800000){snd.err();toast('Vuelve manana','err');return}
  var gap=Date.now()-G.lastDaily;
  G.dailyStreak=(G.lastDaily&&gap<172800000)?(G.dailyStreak||0)+1:1;
  G.lastDaily=Date.now();
  var r=dailyReward();G.money+=r;coinBurst(14);
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
  var qh=document.getElementById('questList');
  if(qh)renderQuests();
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

// ===== LOGICA (modo dificil) =====
function openE(sil){
    var cost=eggCost(selE);if(G.money<cost){if(!sil){snd.err();toast('Sin dinero','err')}if(G.aon){G.aon=false;updateUI()}return false}
    G.money-=cost;var sc={basico:1.18,dorado:1.25,campestre:1.2,arcano:1.28,salvaje:1.22,toxico:1.28,marino:1.26,abisal:1.32,dunas:1.24,faraon:1.28,cristalino:1.28,gema:1.34,glacial:1.24,polar:1.28,magmatico:1.3,infernal:1.36,tumba:1.28,maldito:1.3,divino:1.32,ancestral:1.38,goloso:1.3,pastel:1.32,neon:1.32,virtual:1.34,cosmico:1.36,estelar:1.4,umbral:1.36,absoluto:1.46,draconico:1.36,wyrm:1.38,eterno:1.38,omega:1.5,galactico:1.32,nebuloso:1.36,cronos:1.36,destino:1.4,mutacion:1.36,adn:1.4,terror:1.38,onirico:1.42,rayo:1.38,huracan:1.42,runa:1.4,hechizo:1.44,rocoso:1.4,cometa:1.44,singu:1.42,vacio:1.46,cromatico:1.44,refraccion:1.48,final:1.46,trascende:1.55,elixir:1.4,homunculo:1.5,penumbra:1.42,oscuridad:1.48,celestial:1.44,eden:1.5,caos:1.5,entropia:1.52,zenit:1.54,cumbre:1.6};
    G.pr[selE]=Math.floor(G.pr[selE]*(sc[selE]||1.25));var tpl=roll(selE);
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
function doSell(id){var idx=-1;for(var i=0;i<G.pets.length;i++){if(G.pets[i].id===id){idx=i;break}}if(idx===-1)return;var p=G.pets[idx],v=Math.floor(pE(p)*4);G.money+=v;G.pets.splice(idx,1);toast(p.n+' $'+fmt(v),'inf');save();updateUI();refHP()}
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
  renderBuffs();
}
function setTab(t){snd.click();aTab=t;var ps=document.querySelectorAll('.panel'),bs=document.querySelectorAll('.tab');for(var i=0;i<ps.length;i++)ps[i].classList.remove('on');for(var i=0;i<bs.length;i++)bs[i].classList.remove('on');var mp={game:'pGame',worlds:'pWorlds',index:'pIndex',hub:'pHub',rank:'pRank',lu:'pLu',fusion:'pFusion',codes:'pCodes',admin:'pAdmin'};var pe=document.getElementById(mp[t]);if(pe)pe.classList.add('on');var be=document.querySelector('.tab[data-t="'+t+'"]');if(be)be.classList.add('on');if(t==='index')rIdx();if(t==='rank')renderRk();if(t==='worlds')rWorlds();if(t==='lu')renderLuShop();if(t==='hub')renderHub();if(t==='fusion')renderFusion();if(t==='codes')renderCodes();if(t==='admin')renderAdmin()}

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
  { id: 'lucky', name: 'Suerte x2 (5 min)', desc: 'Duplica tu suerte temporalmente', icon: 'fa-clover', cost: 40, action: function() { luckyBoost=true; toast('Suerte x2 activada!','rwd'); setTimeout(function(){luckyBoost=false;renderBuffs()},300000); } },
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

/* ═══════════════════════════════════════════════════════════
   ⭐ ADD-ONS v49: BUFFS · MISIONES · CODIGOS · FUSION · ADMIN
   ⭐ NUEVO: TODO puede ser GLOBAL (boosts, dinero, pets, rebirths,
      rebaja, soltar cofres, mundos) + eventos globales v48
   ═══════════════════════════════════════════════════════════ */
function renderBuffs(){if(!buffBarEl)return;var h='';
 if((G.webMult||1)>1)h+='<span class="psu-buff" style="border-color:#22d3ee">🌐 x'+G.webMult+' GLOBAL</span>';
 if(evtCur&&evtCur.__global)h+='<span class="psu-buff" style="border-color:#22d3ee">🌍 EVENTO GLOBAL</span>';
 var f=(G.feverUntil||0)-Date.now();if(f>0)h+='<span class="psu-buff" style="border-color:#f97316">🔥 FIEBRE x2 · '+fmtT(f)+'</span>';
 if(boostActive)h+='<span class="psu-buff" style="border-color:#fbbf24">⚡ BOOST x2</span>';
 if(eggSale)h+='<span class="psu-buff" style="border-color:#84cc16">🏷️ REBAJA 50%</span>';
 if(luckyBoost)h+='<span class="psu-buff" style="border-color:#84cc16">🍀 SUERTE</span>';
 if(evtRainbow)h+='<span class="psu-buff" style="border-color:#f0abfc">🌈 ARCOIRIS x12</span>';
 if(evtMagnet)h+='<span class="psu-buff" style="border-color:#38bdf8">🧲 IMÁN x3</span>';
 if(eventMult>1)h+='<span class="psu-buff" style="border-color:#fbbf24">💰 x'+eventMult+'</span>';
 if(petRainIv)h+='<span class="psu-buff" style="border-color:#f472b6">🌧️ LLUVIA DE PETS</span>';
 if(frenesiIv)h+='<span class="psu-buff" style="border-color:#f97316">🔥 FRENESÍ</span>';
 if(moneyIv)h+='<span class="psu-buff" style="border-color:#fbbf24">💵 DINERO LOCO</span>';
 if(IS_ADM)h+='<span class="psu-buff" style="border-color:#fbbf24">👑 ADMIN +25%</span>';
 buffBarEl.innerHTML=h}

/* ---- MISIONES ---- */
var QTMPL=[
 {icn:'🥚',n:'Abre {n} huevos',st:'tot',base:15,mul:2.4,rwm:45,abs:false},
 {icn:'💰',n:'Gana ${n} mas',st:'te',base:5e3,mul:3.2,rwm:.12,abs:false},
 {icn:'🐾',n:'Ten {n} mascotas',st:'pets',base:6,mul:1.5,rwm:260,abs:true},
 {icn:'📖',n:'Descubre {n} especies',st:'disc',base:3,mul:1.45,rwm:900,abs:true}];
function qVal(s){if(s==='tot')return G.tot||0;if(s==='te')return G.te||0;if(s==='pets')return G.pets.length;if(s==='disc')return G.disc.length;return 0}
function newQuest(){var t=QTMPL[Math.floor(Math.random()*QTMPL.length)];var lv=1+Math.floor((G.tot||0)/60);
 var n=Math.max(1,Math.floor(t.base*Math.pow(t.mul,Math.min(lv,12))*(.8+Math.random()*.5)));
 return{name:t.n.replace('{n}',fmt(n)),icn:t.icn,st:t.st,n:n,start:qVal(t.st),rw:Math.max(150,Math.floor(n*t.rwm)),abs:t.abs}}
function qProg(q){var c=qVal(q.st);return Math.max(0,q.abs?c:c-q.start)}
function ensureQuests(){if(!G.quests)G.quests=[];var g=0;while(G.quests.length<3&&g++<5)G.quests.push(newQuest())}
function checkQuests(){ensureQuests();
 for(var i=G.quests.length-1;i>=0;i--){var q=G.quests[i];
  if(qProg(q)>=q.n){G.money+=q.rw;G.te+=q.rw;toast('📜 Mision: '+q.name+' +$'+fmt(q.rw),'rwd');snd.hatch('god');coinBurst(8);G.quests.splice(i,1);ensureQuests();save()}}}
function renderQuests(){var host=document.getElementById('questList');if(!host)return;ensureQuests();var h='';
 for(var i=0;i<G.quests.length;i++){var q=G.quests[i],p=Math.min(qProg(q),q.n),pc=Math.floor(p/q.n*100);
  h+='<div class="psu-q"><div class="psu-q-t"><span>'+q.icn+' '+esc(q.name)+'</span><span style="color:#fbbf24">+$'+fmt(q.rw)+'</span></div><div class="psu-q-b"><div class="psu-q-f" style="width:'+pc+'%"></div></div><div class="psu-q-s">'+fmt(p)+' / '+fmt(q.n)+'</div></div>'}
 host.innerHTML=h}

/* ---- ADMIN helpers ---- */
function givePets(rar,q){q=Math.max(1,q|0);var pool=PETS.filter(function(p){return p.r===rar});
 if(!pool.length){toast('Sin mascotas de esa rareza','err');return}
 for(var i=0;i<q;i++){var b=pool[Math.floor(Math.random()*pool.length)];
  G.pets.push({ic:b.ic,n:b.n,r:b.r,be:b.e,lv:1,id:G.nid++,c:b.c,eg:b.eg,v:rollVariant()});
  if(G.disc.indexOf(b.n)===-1)G.disc.push(b.n)}
 snd.hatch(rar);refHP();toast('🐾 +'+q+' '+RNAME[rar],'rwd');save();updateUI()}
function givePetExact(i){var b=PETS[i];if(!b)return;
 var np={ic:b.ic,n:b.n,r:b.r,be:b.e,lv:1,id:G.nid++,c:b.c,eg:b.eg,v:rollVariant()};
 G.pets.push(np);if(G.disc.indexOf(b.n)===-1)G.disc.push(b.n);
 snd.hatch(b.r);refHP();toast('🐾 '+b.n+' ('+RNAME[b.r]+')','rwd');save();updateUI();showH(np,true)}
function admBoost(){activateBoost(1800);coinBurst(12)}
function admFever(){G.feverUntil=Date.now()+36e5;save();renderBuffs();coinBurst(12);toast('🔥 Fiebre x2 · 60 min','rwd')}
function admLucky(){luckyBoost=true;renderBuffs();toast('🍀 Suerte x2 · 60 min','rwd');setTimeout(function(){luckyBoost=false;renderBuffs()},36e5)}
function admSale(on){eggSale=on;renderBuffs();toast(on?'🏷️ Rebaja 50% ON':'🏷️ Rebaja OFF','rwd')}
function admUnlockW(wid){if(isUW(wid))return;G.uw.push(wid);apTh();snd.world();toast('🗺️ '+gW2(wid).name+' desbloqueado','rwd');save();updateUI()}
function webWrite(path,val,msg){try{runTransaction(ref(fbDb,path),function(){return val})
 .then(function(){if(msg)toast(msg,'rwd')})
 .catch(function(){toast('Sin permiso (rules)','err')})}catch(e){toast('Error Firebase','err')}}
/* ⭐ v49: lanzar algo a TODOS los jugadores */
function globalPush(payload,msg){if(!IS_SUPER){toast('Solo super admin','err');return}
 webWrite('adminBroadcast/globalBoosts',Object.assign({at:Date.now(),by:(ME_U&&ME_U.email)||''},payload),msg)}
/* ⭐ v48: evento global */
function globalEvt(id){var dur=15;for(var i=0;i<EVENTS.length;i++)if(EVENTS[i].id===id)dur=EVENTS[i].dur;
 webWrite('adminBroadcast/activeEvent',{id:id,at:Date.now(),end:Date.now()+dur*1000,by:(ME_U&&ME_U.email)||''},'🌍 Evento activado para TODOS')}
function setAdm(a,s){a=!!a;s=!!s&&a;if(a===IS_ADM&&s===IS_SUPER)return;IS_ADM=a;IS_SUPER=s;
 var tb=document.getElementById('tabAdmin');if(tb)tb.style.display=a?'':'none';
 if(a){psuOvX('psuMantOv');psuOvX('psuBanOv');toast('👑 ADMIN detectado! Pestaña 🛡️ desbloqueada','rwd');snd.world()}
 else if(aTab==='admin')setTab('game');
 renderBuffs()}
function psuOv(id,html,bc){var o=document.getElementById(id);
 if(!o){o=document.createElement('div');o.id=id;o.className='psu-ov';document.body.appendChild(o)}
 o.innerHTML='<div class="psu-ovc" style="border-color:'+(bc||'#ef4444')+'">'+html+'</div>';o.style.display='flex'}
function psuOvX(id){var o=document.getElementById(id);if(o)o.style.display='none'}
function showBanner(t){var b=document.getElementById('psuBanner');if(!b)return;
 if(!t){b.style.display='none';return}
 b.innerHTML='📢 '+esc(t)+'<button class="psu-bx">✕</button>';b.style.display='block';
 b.querySelector('.psu-bx').onclick=function(){b.style.display='none'}}
function updChip(){var c=document.getElementById('psuMultChip');if(!c)return;var m=G.webMult||1;
 if(m>1){c.textContent='🌐 x'+m+' GLOBAL';c.style.display='block'}else c.style.display='none'}

/* ---- CODIGOS (usos limitados + caducidad) ---- */
function usedCodes(){try{return JSON.parse(localStorage.getItem('psuCodesUsed')||'{}')}catch(e){return{}}}
function hintOf(c){if(!c)return'';return c.t==='money'?'💰 $'+fmt(c.v):c.t==='rb'?'♻️ +'+c.v+' RB':c.t==='boost'?'⚡ boost '+c.v+'s':c.t==='lucky'?'🍀 suerte '+c.v+'min':c.t==='lu'?'🪙 +'+c.v+' LU':'🐾 mascota DIOS'}
function codeExpired(c){return !!(c&&c.dur&&c.at&&Date.now()-c.at>c.dur*60000)}
function grantCode(c,code){
 var u=usedCodes();u[code]=Date.now();try{localStorage.setItem('psuCodesUsed',JSON.stringify(u))}catch(e){}
 if(c.t==='money'){G.money+=c.v;G.te+=c.v;toast('✅ +$'+fmt(c.v),'rwd')}
 else if(c.t==='rb'){G.rb=(G.rb||0)+c.v;G.mult=Math.pow(1.8,G.rb);toast('✅ +'+c.v+' Rebirths','rwd')}
 else if(c.t==='boost'){activateBoost(c.v||180)}
 else if(c.t==='lucky'){luckyBoost=true;renderBuffs();toast('🍀 Suerte x2!','rwd');setTimeout(function(){luckyBoost=false;renderBuffs()},(c.v||5)*60000)}
 else if(c.t==='pet'){givePets('god',1)}
 else if(c.t==='lu'){if(!luUid){toast('Inicia sesion en LevelUp','err');return}
  runTransaction(ref(fbDb,'users/'+luUid+'/coins'),function(cv){return (cv||0)+(c.v||0)})
   .then(function(){toast('🪙 +'+(c.v||0)+' monedas LU','rwd')}).catch(function(){toast('Error LU','err')})}
 snd.burst();coinBurst(10);renderCodes();save();updateUI()}
function redeemCode(code){code=(''+(code||'')).trim().toUpperCase();if(!code)return;
 var c=SRV_CODES[code];if(!c){toast('❌ Codigo no valido','err');return}
 if(codeExpired(c)){toast('⏰ Codigo expirado','err');return}
 var u=usedCodes();if(u[code]){toast('⚠️ Ya canjeado','err');return}
 if(c.t==='lu'&&!luUid){toast('Inicia sesion en LevelUp','err');return}
 if(c.max&&c.max>0){
  runTransaction(ref(fbDb,'stats/psuCodes/'+code),function(cur){
   var n=(cur&&typeof cur==='object')?(cur.n||0):(cur||0);
   if(n>=c.max)return;
   return{n:n+1,t:Date.now()}
  }).then(function(r){if(r&&r.committed)grantCode(c,code);else toast('🎟️ Usos agotados','err')})
   .catch(function(){toast('Error comprobando codigo','err')});
  return}
 grantCode(c,code)}
function renderCodes(){var host=document.getElementById('psuCodeList');if(!host)return;
 var ks=Object.keys(SRV_CODES),u=usedCodes(),h='';
 if(!ks.length)h='<p style="color:#c9d9ec;font-size:12px;margin:6px 0">Aun no hay codigos publicados.</p>';
 for(var i=0;i<ks.length;i++){var k=ks[i],c=SRV_CODES[k]||{};
  var exp=codeExpired(c);
  var n=usesOf(k);
  var left=(c.max&&c.max>0)?Math.max(0,c.max-n):null;
  var tleft=(!exp&&c.dur)?Math.max(0,Math.ceil((c.at+c.dur*60000-Date.now())/60000)):null;
  var badge='';
  if(c.max&&c.max>0)badge+='<span style="color:'+(left>0?'#7ee2a8':'#f87171')+';font-weight:800">🎟️ '+left+'/'+c.max+' usos</span> ';
  if(c.dur)badge+='<span style="color:'+(exp?'#f87171':'#fbbf24')+';font-weight:800">'+(exp?'⏰ EXPIRADO':'⏳ '+tleft+'m restantes')+'</span>';
  if(!c.max&&!c.dur)badge='<span style="color:#c9d9ec;font-size:11px">∞ usos · sin caducidad</span>';
  if(u[k])h+='<div class="psu-row" style="opacity:.55"><span style="flex:1;text-decoration:line-through">'+esc(k)+'</span>✅</div>';
  else if(exp||left===0)h+='<div class="psu-row" style="opacity:.55"><span style="flex:1"><b>'+esc(k)+'</b> '+badge+'</span>'
   +(IS_SUPER?'<button class="psu-b psu-b-r" data-delcode="'+esc(k)+'">✕</button>':'')+'</div>';
  else h+='<div class="psu-row" style="flex-wrap:wrap"><span style="flex:1;min-width:120px">🔒 <b>'+esc(k)+'</b> <span style="opacity:.85;font-size:11px">'+hintOf(c)+'</span><br>'+badge+'</span>'
   +'<button class="psu-b psu-b-c" data-code="'+esc(k)+'">Canjear</button>'
   +(IS_SUPER?'<button class="psu-b psu-b-r" data-delcode="'+esc(k)+'" title="Eliminar codigo">✕</button>':'')+'</div>'}
 host.innerHTML=h}

/* ---- FUSION ---- */
function selRarity(){for(var i=0;i<fuseSelIds.length;i++){for(var j=0;j<G.pets.length;j++)if(G.pets[j].id===fuseSelIds[i])return G.pets[j].r}return null}
function toggleFuse(id){var p=null;for(var j=0;j<G.pets.length;j++)if(G.pets[j].id===id){p=G.pets[j];break}if(!p)return;
 var ix=fuseSelIds.indexOf(id);
 if(ix>-1){fuseSelIds.splice(ix,1);snd.click();renderFusion();return}
 if(fuseSelIds.length>=3){toast('Ya has elegido 3, toca una para quitarla','err');snd.err();return}
 var r=selRarity();
 if(r&&p.r!==r){toast('Deben ser del MISMO rango ('+RNAME[r]+')','err');snd.err();return}
 fuseSelIds.push(id);snd.click();renderFusion()}
function autoPick3(){var cnt={};G.pets.forEach(function(p){cnt[p.r]=(cnt[p.r]||0)+1});
 var pickR=null;for(var i=0;i<RKEYS.length-1;i++){if((cnt[RKEYS[i]]||0)>=3){pickR=RKEYS[i];break}}
 if(!pickR){toast('No tienes 3 mascotas del mismo rango','err');snd.err();return}
 var list=G.pets.filter(function(p){return p.r===pickR}).sort(function(a,b){return pE(a)-pE(b)});
 fuseSelIds=[list[0].id,list[1].id,list[2].id];snd.click();
 toast('⚡ 3 '+RNAME[pickR]+' más baratas listas','inf');renderFusion()}
function doFuse(){
 if(fuseSelIds.length!==3)return;
 var r=selRarity(),ri=RKEYS.indexOf(r);
 if(ri<0||ri>=RKEYS.length-1){toast('Este rango no se puede fusionar mas','err');snd.err();return}
 var pets=[];
 for(var j=0;j<G.pets.length;j++)if(fuseSelIds.indexOf(G.pets[j].id)>-1)pets.push(G.pets[j]);
 if(pets.length!==3){fuseSelIds=[];renderFusion();return}
 var maxLv=1,maxV=0;
 for(var i=0;i<pets.length;i++){if(pets[i].lv>maxLv)maxLv=pets[i].lv;if((pets[i].v||0)>maxV)maxV=pets[i].v}
 for(i=0;i<pets.length;i++)G.pets.splice(G.pets.indexOf(pets[i]),1);
 var nx=RKEYS[ri+1],np2=PETS.filter(function(p){return p.r===nx});
 var b=np2[Math.floor(Math.random()*np2.length)];
 var np={ic:b.ic,n:b.n,r:b.r,be:b.e,lv:maxLv,id:G.nid++,c:b.c,eg:b.eg,v:maxV};
 G.pets.push(np);fuseSelIds=[];
 toast('⚗️ FUSION: '+b.n+' ('+RNAME[nx]+')'+(maxV===2?' 🌈!':maxV===1?' ⭐!':''),'rwd');
 snd.hatch(nx);coinBurst(14);
 save();updateUI();refHP();renderFusion();showH(np,true)}
function renderFusion(){var host=document.getElementById('fuGrid');if(!host)return;
 var r=selRarity(),ri=RKEYS.indexOf(r),nx=(ri>-1&&ri<RKEYS.length-1)?RKEYS[ri+1]:null;
 var h='<div class="psu-card"><div class="psu-frow">';
 for(var i=0;i<3;i++){var sp=null,id=fuseSelIds[i];
  if(id!=null)for(var j=0;j<G.pets.length;j++)if(G.pets[j].id===id){sp=G.pets[j];break}
  h+='<div class="psu-fslot'+(sp?' has':'')+'">'+(sp?sphH(sp,'sm'):'<i class="fas fa-plus"></i>')+'<span>'+(sp?esc(sp.n):'vacio')+'</span></div>'}
 h+='<div class="psu-farrow"><i class="fas fa-angle-double-right"></i></div>';
 h+='<div class="psu-fslot res" style="border-color:'+(nx?RCOL[nx]:'#666')+';box-shadow:0 0 18px '+(nx?RCOL[nx]+'66':'transparent')+'"><div class="psu-fq" style="color:'+(nx?RCOL[nx]:'#888')+'"><i class="fas fa-question"></i></div><span>'+(nx?RNAME[nx]:'???')+'</span></div>';
 h+='</div>';
 h+='<div class="psu-row" style="margin-top:10px"><button class="psu-b psu-b-g" id="btnFuseAuto" style="flex:1">⚡ Auto: 3 mas baratas</button><button class="psu-b" id="btnFuseClr" style="flex:0">🗑️</button></div>';
 h+='<button class="psu-fgo" id="btnFuseGo"'+((fuseSelIds.length===3&&nx)?'':' disabled')+'>⚗️ FUSIONAR → 1 '+(nx?RNAME[nx]:'???')+'</button>';
 h+='<p class="psu-hint">Hereda el nivel mas alto y la mejor variante ⭐/🌈 de las 3. Toca una elegida para quitarla.</p>';
 if(nx){var pool=PETS.filter(function(p){return p.r===nx});
  h+='<div class="psu-fg-h" style="color:'+RCOL[nx]+'">Posibles resultados ('+pool.length+')</div><div class="psu-fposs">';
  for(i=0;i<pool.length;i++){var dsc=G.disc.indexOf(pool[i].n)!==-1;
   h+='<div class="psu-fp">'+(dsc?sphH(pool[i],'xs'):'<div class="psu-fq-s"><i class="fas fa-question"></i></div>')+'<span>'+(dsc?esc(pool[i].n):'???')+'</span></div>'}
  h+='</div>'}
 h+='</div>';
 var s=G.pets.slice().sort(function(a,b){return pE(b)-pE(a)});
 if(!s.length){h+='<div class="empty"><i class="fas fa-egg"></i><p>Abre tu primer huevo</p></div>';host.innerHTML=h;return}
 for(var rk=RKEYS.length-1;rk>=0;rk--){var rr=RKEYS[rk],list=[];
  for(i=0;i<s.length;i++)if(s[i].r===rr)list.push(s[i]);
  if(!list.length)continue;
  h+='<div class="psu-fg-h" style="color:'+RCOL[rr]+'">'+RNAME[rr]+' <span>('+list.length+')</span></div>';
  var cap=Math.min(list.length,40);
  for(i=0;i<cap;i++){var p=list[i],si=fuseSelIds.indexOf(p.id);
   h+='<div class="pc '+p.r+' psu-fpick" data-fid="'+p.id+'" style="'+(si>-1?'border-color:#fbbf24;box-shadow:0 0 10px rgba(251,191,36,.35)':'')+'">'
    +'<div class="pc-l">'+sphH(p,'sm')+'<div class="pc-t"><span class="pc-n">'+esc(p.n)+(p.v?' <i class="fas fa-star pc-star v'+p.v+'"></i>':'')+'</span><span class="pc-m">Nv.'+p.lv+' · $'+fmt(pE(p))+'/s</span></div></div>'
    +'<div class="pc-r"><span class="pc-e" style="color:'+(si>-1?'#fbbf24':'#8fa3b8')+';font-size:11px;font-weight:800">'+(si>-1?'ELEGIDA ✓':'elegir')+'</span></div></div>'}
  if(list.length>cap)h+='<p class="psu-hint">+'+fmt(list.length-cap)+' mas...</p>'}
 host.innerHTML=h}

/* ---- ADMIN render (ultra claro · WEB arriba · todo con 🌍) ---- */
function aCard(icon,color,title,body){return'<div class="psu-card"><div class="psu-card-h" style="background:linear-gradient(90deg,'+color+','+color+'cc)">'+icon+' '+title+'</div>'+body+'</div>'}
function gBtn(act,title){return IS_SUPER?'<button class="psu-b psu-b-c" data-gact="'+act+'" title="'+(title||'Para TODOS')+'">🌍</button>':''}
function webCard(){
 var wb='<div class="psu-row"><input id="psuAnn" placeholder="Anuncio global para todos..."><button class="psu-b psu-b-g" data-a="announce">📣</button></div>'
  +'<div class="psu-brow"><span>🌐 Multiplicador global</span></div>'
  +'<div class="psu-row"><input id="psuGM" value="'+(G.webMult||2)+'" placeholder="x2, x3..."><button class="psu-b psu-b-g" data-a="gMult" style="flex:1">ACTIVAR</button><button class="psu-b psu-b-r" data-a="gMultOff">OFF</button></div>'
  +'<div class="psu-h">🎟️ Publicar codigo</div>'
  +'<div class="psu-row"><input id="psuCn" placeholder="NOMBRE" maxlength="12"></div>'
  +'<div class="psu-row"><select id="psuCt"><option value="money">💰 Dinero $</option><option value="rb">♻️ Rebirths</option><option value="boost">⚡ Boost x2 (seg)</option><option value="lucky">🍀 Suerte (min)</option><option value="lu">🪙 Monedas LU</option><option value="pet">🐾 Mascota Dios</option></select><input id="psuCv" value="100000"></div>'
  +'<div class="psu-row"><input id="psuCMax" value="0" placeholder="Usos totales (0 = infinitos)"><input id="psuCDur" value="0" placeholder="Minutos activo (0 = siempre)"></div>'
  +'<div class="psu-row"><button class="psu-b psu-b-g" data-a="pubCode" style="flex:1">🎟️ PUBLICAR CODIGO</button></div>'
  +'<div class="psu-h">🚫 Moderacion</div>'
  +'<div class="psu-row"><input id="psuBan" placeholder="UID del jugador"><button class="psu-b psu-b-r" data-a="ban">BAN</button><button class="psu-b" data-a="unban">UNBAN</button></div>'
  +'<div class="psu-row"><button class="psu-b psu-b-r" data-a="mantOn" style="flex:1">🛠️ Mantenimiento ON</button><button class="psu-b" data-a="mantOff" style="flex:1">OFF</button></div>'
  +'<div class="psu-row"><button class="psu-b" data-a="copyUid" style="flex:1">📋 Copiar mi UID</button></div>';
 return aCard('🌐','#22d3ee','WEB · AFECTA A TODOS',wb)}
function renderAdmin(){var host=document.getElementById('admGrid');if(!host)return;
 var h='<div class="psu-admin-hd">🛡️ MODO ADMIN ACTIVO<div>'+(ME_U?esc(ME_U.email):'')+'</div></div>';
 if(IS_SUPER)h+='<p class="psu-hint" style="margin-top:-6px">💡 Cada acción tiene su <b>🌍</b>: mismo efecto pero para TODOS los jugadores conectados.</p>';
 if(IS_SUPER)h+=webCard();
 var f=(G.feverUntil||0)-Date.now();
 var st='<div class="psu-strow"><span>💰 Dinero</span><b style="color:#fde047">$'+fmt(G.money)+'</b></div>'
  +'<div class="psu-strow"><span>📈 Ingreso</span><b style="color:#7ee2a8">$'+fmt(tI())+'/s</b></div>'
  +'<div class="psu-strow"><span>✖️ Multiplicador</span><b>x'+fmt(G.mult)+'</b></div>'
  +'<div class="psu-strow"><span>♻️ Rebirths</span><b>'+G.rb+'</b></div>'
  +(f>0?'<div class="psu-strow"><span>🔥 Fiebre</span><b style="color:#f97316">'+fmtT(f)+'</b></div>':'')
  +(boostActive?'<div class="psu-strow"><span>⚡ Boost</span><b style="color:#fbbf24">ACTIVO</b></div>':'');
 h+=aCard('📊','#22d3ee','ESTADO EN VIVO',st);
 var mon='<div class="psu-row"><input id="psuMoney" value="1e9" placeholder="1e12 · 50b · 3t"></div>'
  +'<div class="psu-row"><button class="psu-b psu-b-g" data-a="addM" style="flex:1">➕ AÑADIR</button><button class="psu-b psu-b-g" data-a="setM" style="flex:1">= FIJAR</button>'+gBtn('money','Enviar $ a TODOS')+'</div>'
  +'<div class="psu-grid"><button class="psu-chip" data-am="1e5">+100K</button><button class="psu-chip" data-am="1e6">+1M</button><button class="psu-chip" data-am="1e9">+1B</button><button class="psu-chip" data-am="1e12">+1T</button><button class="psu-chip" data-am="1e15">+1Qa</button><button class="psu-chip" data-am="1e18">+1Sx</button><button class="psu-chip" data-am="1e21">+1Sp</button><button class="psu-chip" data-am="1e24">+1Oc</button></div>';
 h+=aCard('💰','#fbbf24','DAR DINERO',mon);
 var pets='<div class="psu-grid" style="margin-bottom:8px">';
 for(var i=0;i<RKEYS.length;i++){var r=RKEYS[i];
  pets+='<button class="psu-chip'+(admRarSel===r?' psu-chip-on':'')+'" data-rar="'+r+'" style="'+(admRarSel===r?'background:'+RCOL[r]+';color:#04121f;':'color:'+RCOL[r]+';border-color:'+RCOL[r]+'99')+'">'+RNAME[r]+'</button>'}
 pets+='</div><div class="psu-row"><input id="psuQty" value="1" type="number" min="1" max="100" style="max-width:70px"><button class="psu-b psu-b-g" data-a="pet" style="flex:1">🐾 DAR '+RNAME[admRarSel].toUpperCase()+'</button>'+gBtn('pets','Mascota para TODOS')+'</div>'
  +'<div class="psu-row"><button class="psu-b" data-a="dex" style="flex:1">📖 INDEX 100%</button></div>'
  +'<div class="psu-h">🔎 Mascota concreta</div><div class="psu-row"><input id="admPetQ" placeholder="Ej: dragon, zeus..." value="'+esc(admPetQ)+'"></div><div class="psu-grid">';
 if(admPetQ.length>=2){var q=admPetQ.toLowerCase(),found=0;
  for(i=0;i<PETS.length&&found<12;i++){if(PETS[i].n.toLowerCase().indexOf(q)>-1){
   h+='<div class="psu-fp psu-gp" data-gp="'+i+'">'+sphH(PETS[i],'xs')+'<span style="color:'+RCOL[PETS[i].r]+'">'+esc(PETS[i].n)+'</span></div>';found++}}
  if(!found)h+='<span class="psu-hint">Sin resultados</span>'}
 h+='</div>';
 h+=aCard('🐾','#c084fc','DAR MASCOTAS',pets);
 var bo='<div class="psu-brow"><span>⚡ Boost x2 · 30 min</span><span style="display:flex;gap:4px"><button class="psu-b psu-b-g" data-a="boost">ACTIVAR</button>'+gBtn('boost','Boost para TODOS')+'</span></div>'
  +'<div class="psu-brow"><span>🔥 Fiebre x2 · 60 min</span><span style="display:flex;gap:4px"><button class="psu-b" data-a="fever" style="border-color:#f9731688;color:#fdba74">ACTIVAR</button>'+gBtn('fever','Fiebre para TODOS')+'</span></div>'
  +'<div class="psu-brow"><span>🍀 Suerte x2 · 60 min</span><span style="display:flex;gap:4px"><button class="psu-b" data-a="lucky" style="border-color:#84cc1688;color:#bef264">ACTIVAR</button>'+gBtn('lucky','Suerte para TODOS')+'</span></div>'
  +'<div class="psu-brow"><span>🏷️ Rebaja 50% en huevos</span><span style="display:flex;gap:4px"><button class="psu-b'+(eggSale?' psu-b-r':'')+'" data-a="sale">'+(eggSale?'DESACTIVAR':'ACTIVAR')+'</button>'+(IS_SUPER?'<button class="psu-b psu-b-c" data-gact="sale" title="Rebaja para TODOS">🌍</button>':'')+'</span></div>';
 h+=aCard('⚡','#fbbf24','BOOSTS X2',bo);
 var ev='<div class="psu-hint" style="margin-top:0">▶ = solo para ti · 🌍 = para TODOS los jugadores en vivo</div>';
 for(i=0;i<EVENTS.length;i++){var e=EVENTS[i],act=evtCur&&evtCur.id===e.id;
  var rem=act?Math.max(0,Math.ceil((evtEnd-Date.now())/1000)):0;
  var isG=act&&evtCur.__global;
  var btns='<button class="psu-b psu-b-g" data-a="evt" data-ev="'+e.id+'">▶</button>';
  if(IS_SUPER)btns+='<button class="psu-b psu-b-c" data-gev="'+e.id+'" title="Activar para TODOS">🌍</button>';
  if(act)btns='<button class="psu-b psu-b-r" data-a="stopEvt">⏹ '+rem+'s</button>'+(IS_SUPER&&!isG?'<button class="psu-b psu-b-c" data-gev="'+e.id+'" title="Convertir en GLOBAL">🌍</button>':'');
  ev+='<div class="psu-brow'+(act?' psu-brow-act':'')+'"><span><i class="fas '+e.ic+'" style="color:var(--wa,#22d3ee);margin-right:6px"></i>'+e.n+' <small style="opacity:.6">'+e.dur+'s'+(isG?' · 🌍GLOBAL':'')+'</small></span><span style="display:flex;gap:4px">'+btns+'</span></div>'}
 var drop='';
 if(IS_SUPER)drop='<button class="psu-b psu-b-c" data-gact="goldEgg" title="Para TODOS">🌍</button>';
 ev+='<div class="psu-brow"><span>🥚 Soltar huevo dorado YA</span><span style="display:flex;gap:4px"><button class="psu-b" data-a="goldEgg">SOLTAR</button>'+drop+'</span></div>';
 if(IS_SUPER)drop='<button class="psu-b psu-b-c" data-gact="gift" title="Para TODOS">🌍</button>';
 ev+='<div class="psu-brow"><span>🎁 Soltar caja sorpresa YA</span><span style="display:flex;gap:4px"><button class="psu-b" data-a="giftNow">SOLTAR</button>'+drop+'</span></div>';
 if(IS_SUPER)drop='<button class="psu-b psu-b-c" data-gact="chest" title="Para TODOS">🌍</button>';
 ev+='<div class="psu-brow"><span>🏆 Soltar cofre legendario YA</span><span style="display:flex;gap:4px"><button class="psu-b" data-a="chestNow">SOLTAR</button>'+drop+'</span></div>';
 h+=aCard('🎉','#a78bfa','EVENTOS ('+EVENTS.length+')',ev);
 var wd='<div class="psu-row" style="margin-bottom:8px"><button class="psu-b psu-b-g" data-a="worlds" style="flex:1">🔓 DESBLOQUEAR TODOS GRATIS</button>'+gBtn('worlds','Desbloquear a TODOS')+'</div><div class="psu-grid">';
 for(i=0;i<WORLDS.length;i++){var w=WORLDS[i],u2=isUW(w.id);
  wd+='<div class="psu-w'+(u2?' on':'')+'" data-wid="'+w.id+'" title="'+esc(w.name)+' · x'+w.bonus.toFixed(1)+(u2?'':' · clic para desbloquear')+'">'+w.icon+'</div>'}
 wd+='</div>';
 h+=aCard('🗺️','#38bdf8','MUNDOS ('+WORLDS.length+')',wd);
 var rbG=IS_SUPER?'<button class="psu-b psu-b-c" data-gact="rb" title="Rebirths para TODOS">🌍</button>':'';
 var pw='<div class="psu-brow"><span>🔓 Boton x3</span><button class="psu-b'+(G.x3?' psu-b-g':'')+'" data-a="x3">'+(G.x3?'ON':'OFF')+'</button></div>'
  +'<div class="psu-brow"><span>⬆️ Todas las mejoras al maximo</span><button class="psu-b" data-a="upg">HACER</button></div>'
  +'<div class="psu-row"><input id="psuMult" value="'+(G.mult>1e5?'':G.mult)+'" placeholder="Multiplicador (ej: 50)"><button class="psu-b" data-a="mult">SET</button></div>'
  +'<div class="psu-row"><input id="psuRb" value="'+G.rb+'" placeholder="Rebirths"><button class="psu-b" data-a="rb">SET</button>'+rbG+'</div>'
  +'<div class="psu-row"><button class="psu-b'+(G.mult>=1e6?' psu-b-g':' psu-b-r')+'" data-a="'+(G.mult>=1e6?'ungod':'god')+'" style="flex:1">'+(G.mult>=1e6?'😇 QUITAR MODO DIOS':'😈 MODO DIOS x1M')+'</button>'
  +'<button class="psu-b psu-b-r" data-a="wipe">🗑️</button></div>';
 h+=aCard('👑','#fde047','PODER',pw);
 host.innerHTML=h}

/* ---- BUILD ADDONS ---- */
function buildAddons(){
 var st=document.createElement('style');
 st.textContent='#psuBanner{position:fixed;top:0;left:0;right:0;z-index:9996;display:none;padding:9px 40px 9px 14px;text-align:center;font-weight:700;font-size:13px;color:#04121f;background:linear-gradient(90deg,#22d3ee,#7dd3fc)}#psuBanner .psu-bx{position:absolute;right:12px;top:6px;background:none;border:0;font-size:15px;cursor:pointer;color:#04121f}#psuMultChip{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:9995;display:none;background:rgba(10,16,30,.92);border:1px solid #22d3ee;color:#67e8f9;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:800;pointer-events:none}#buffBar{position:fixed;top:8px;left:8px;z-index:9990;display:flex;gap:6px;flex-wrap:wrap;max-width:60vw;pointer-events:none}.psu-buff{background:rgba(10,16,30,.92);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:4px 10px;font-size:11.5px;font-weight:800;color:#fff;backdrop-filter:blur(6px)}.psu-coin{position:fixed;z-index:9994;font-size:20px;pointer-events:none;animation:psuCoin 1.3s ease-in forwards}@keyframes psuCoin{to{transform:translateY(45vh) rotate(660deg);opacity:0}}@keyframes psuFloat{50%{transform:translateY(-12px) rotate(8deg)}}.psu-ov{position:fixed;inset:0;z-index:9997;background:rgba(2,4,10,.95);display:none;align-items:center;justify-content:center;color:#fff;text-align:center;font-family:inherit}.psu-ovc{background:#0d1424;border:1px solid #ef4444;border-radius:18px;padding:26px;max-width:340px}.psu-pad{padding:14px;max-height:calc(100vh - 150px);overflow-y:auto}'
 +'#pAdmin.on,#pCodes.on,#pFusion.on{z-index:9450!important;opacity:1!important;filter:none!important;box-shadow:0 0 90px rgba(0,0,0,.85)}'
 +'#pAdmin.on .psu-pad,#pCodes.on .psu-pad,#pFusion.on .psu-pad{background:linear-gradient(165deg,#0e1a30 0%,#0a1224 100%)!important;border-radius:16px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}'
 +'#pAdmin.on *,#pCodes.on *,#pFusion.on *{opacity:1!important}'
 +'.psu-card{background:#101a2e;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:0;margin-bottom:14px;overflow:hidden}'
 +'.psu-card-h{display:flex;align-items:center;gap:8px;font-weight:900;font-size:13.5px;padding:10px 13px;color:#04121f;letter-spacing:.5px;filter:brightness(1.12)}'
 +'.psu-card>*:not(.psu-card-h){padding:0 13px 12px}'
 +'.psu-admin-hd{background:linear-gradient(135deg,#f59e0b,#fde047);color:#231a00;font-weight:900;font-size:15px;border-radius:14px;padding:14px;margin-bottom:14px;text-align:center;text-shadow:none}'
 +'.psu-admin-hd div{font-size:11.5px;font-weight:700;opacity:.85;margin-top:3px}'
 +'.psu-strow{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.09);font-size:13.5px;color:#eef6ff}'
 +'.psu-strow:last-child{border-bottom:0}.psu-strow b{font-size:14px}'
 +'.psu-row{display:flex;gap:6px;margin:8px 0 0;align-items:center}'
 +'.psu-row input,.psu-row select{flex:1;min-width:0;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.38);color:#fff;border-radius:10px;padding:10px 12px;font-size:13px;outline:none;font-family:inherit;font-weight:700}'
 +'.psu-row input:focus{border-color:#fbbf24;background:rgba(255,255,255,.2)}'
 +'.psu-b{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.38);color:#fff;border-radius:10px;padding:10px 13px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;transition:.15s}'
 +'.psu-b:hover{background:#fbbf24;color:#231a00}'
 +'.psu-b-g{background:linear-gradient(135deg,#f59e0b,#fde047);color:#231a00;border:0}'
 +'.psu-b-r{background:rgba(239,68,68,.22);border-color:rgba(239,68,68,.55);color:#fca5a5}'
 +'.psu-b-c{background:rgba(34,211,238,.18);border-color:rgba(34,211,238,.5);color:#a5f3fc}'
 +'.psu-h{margin:12px 0 4px;color:#fde047;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;font-weight:900}'
 +'.psu-hint{color:#c9d9ec;font-size:11.5px;margin:8px 0;line-height:1.5}'
 +'.psu-sec-t{font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#7dd3fc;margin:0 0 12px;font-weight:900}'
 +'.psu-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}'
 +'.psu-chip{background:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.42);color:#fff;border-radius:18px;padding:7px 13px;font-size:12.5px;font-weight:900;cursor:pointer;font-family:inherit;transition:.12s}'
 +'.psu-chip:hover{transform:scale(1.07)}'
 +'.psu-chip-on{box-shadow:0 0 12px rgba(251,191,36,.5)}'
 +'.psu-brow{display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:10px 12px;margin-top:8px;font-size:13.5px;font-weight:700;color:#eef6ff}'
 +'.psu-brow-act{border-color:#fde047;background:rgba(251,191,36,.16)}'
 +'.psu-brow small{font-weight:600}'
 +'.psu-w{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:21px;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.18);cursor:pointer;filter:grayscale(1);opacity:.45;transition:.15s}'
 +'.psu-w.on{filter:none;opacity:1;border-color:var(--wbd,#22d3ee44)}'
 +'.psu-w:hover{transform:scale(1.15)}'
 +'.psu-frow{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}'
 +'.psu-fslot{width:88px;min-height:104px;border:2px dashed rgba(255,255,255,.35);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:10.5px;color:#c9d9ec;padding:6px;text-align:center;background:rgba(255,255,255,.05)}'
 +'.psu-fslot.has{border-style:solid;border-color:#fbbf24;background:rgba(251,191,36,.08);color:#fff}'
 +'.psu-fslot.res{border-style:solid;background:rgba(255,255,255,.06)}'
 +'.psu-farrow{font-size:22px;color:#22d3ee}'
 +'.psu-fq{font-size:32px}'
 +'.psu-fq-s{width:24px;height:24px;border-radius:50%;background:#2a3550;display:flex;align-items:center;justify-content:center;font-size:11px;color:#9db2c9;margin:0 auto}'
 +'.psu-fgo{width:100%;padding:14px;font-size:16px;font-weight:900;background:linear-gradient(135deg,#f59e0b,#fde047);color:#231a00;border:0;border-radius:13px;cursor:pointer;margin:12px 0 0;font-family:inherit;letter-spacing:1px;box-shadow:0 4px 18px rgba(251,191,36,.3)}'
 +'.psu-fgo:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}'
 +'.psu-fposs{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}'
 +'.psu-fp{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:9.5px;color:#dbe7f4;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:7px 9px;min-width:66px;text-align:center}'
 +'.psu-gp{cursor:pointer}.psu-gp:hover{border-color:#fbbf24;background:rgba(251,191,36,.1)}'
 +'.psu-fg-h{font-weight:900;font-size:12.5px;letter-spacing:1px;margin:16px 0 6px;text-transform:uppercase}'
 +'.psu-fg-h span{opacity:.65;font-size:10.5px}'
 +'.psu-fpick{cursor:pointer;transition:.12s}.psu-fpick:hover{transform:translateY(-2px)}'
 +'.psu-q{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:9px 11px;margin-bottom:8px}'
 +'.psu-q-t{display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;gap:8px;color:#eef6ff}'
 +'.psu-q-b{height:6px;background:rgba(255,255,255,.12);border-radius:4px;margin:6px 0 3px;overflow:hidden}'
 +'.psu-q-f{height:100%;background:linear-gradient(90deg,var(--wa,#22d3ee),var(--wa2,#7dd3fc));transition:width .4s}'
 +'.psu-q-s{font-size:10.5px;color:#c9d9ec}';
 document.head.appendChild(st);

 buffBarEl=document.createElement('div');buffBarEl.id='buffBar';document.body.appendChild(buffBarEl);
 var ban2=document.createElement('div');ban2.id='psuBanner';document.body.appendChild(ban2);
 var chip=document.createElement('div');chip.id='psuMultChip';document.body.appendChild(chip);

 var nt=document.getElementById('navTabs');
 if(nt&&!document.getElementById('tabFusion')){
  nt.insertAdjacentHTML('beforeend',
   '<button class="tab" data-t="fusion" id="tabFusion"><i class="fas fa-flask"></i><span>Fusion</span></button>'
  +'<button class="tab" data-t="codes" id="tabCodes"><i class="fas fa-ticket"></i><span>Codigos</span></button>'
  +'<button class="tab" data-t="admin" id="tabAdmin" style="display:none"><i class="fas fa-shield-halved"></i><span>Admin</span></button>')}

 if(!document.getElementById('pFusion')){
  var d=document.createElement('div');d.id='pFusion';d.className='panel';
  d.innerHTML='<div class="psu-pad"><div class="psu-sec-t">⚗️ Fusion — elige 3 mascotas del mismo rango</div><div id="fuGrid"></div></div>';
  document.body.appendChild(d)}
 if(!document.getElementById('pCodes')){
  var d2=document.createElement('div');d2.id='pCodes';d2.className='panel';
  d2.innerHTML='<div class="psu-pad"><div class="psu-sec-t">🎟️ Codigos</div>'
   +'<div class="psu-row"><input id="psuCodeInp" placeholder="Escribe un codigo..." maxlength="20"><button class="psu-b psu-b-c" data-code="__inp">Canjear</button></div>'
   +'<div id="psuCodeList"></div><p class="psu-hint">Algunos codigos tienen usos limitados o caducidad — ¡corre a canjearlos!</p></div>';
  document.body.appendChild(d2)}
 if(!document.getElementById('pAdmin')){
  var d3=document.createElement('div');d3.id='pAdmin';d3.className='panel';
  d3.innerHTML='<div class="psu-pad"><div id="admGrid"></div></div>';
  document.body.appendChild(d3)}

 var sl=document.getElementById('statList');
 if(sl&&sl.parentNode&&!document.getElementById('questBox')){
  var qb=document.createElement('div');qb.id='questBox';
  qb.innerHTML='<div class="psu-sec-t">📜 Misiones</div><div id="questList"></div>';
  sl.parentNode.insertBefore(qb,sl)}

 /* clicks delegados */
 document.addEventListener('click',function(e){
  var c=e.target.closest('[data-code]');
  if(c){var cv=c.dataset.code;
   if(cv==='__inp'){var inp=document.getElementById('psuCodeInp');redeemCode(inp?inp.value:'')}
   else redeemCode(cv);
   return}
  var dc=e.target.closest('[data-delcode]');
  if(dc&&IS_SUPER){var kk=dc.dataset.delcode;
   webWrite('adminBroadcast/codes/'+kk,null,'🗑️ Codigo '+kk+' eliminado');
   webWrite('stats/psuCodes/'+kk,null);
   setTimeout(renderCodes,600);return}
  /* ⭐ v49: botones 🌍 de acciones globales */
  var ga=e.target.closest('[data-gact]');
  if(ga&&IS_SUPER){snd.click();var g2=ga.dataset.gact;
   var gval=function(id){var x=document.getElementById(id);return x?x.value:''};
   if(g2==='money')globalPush({t:'money',v:toNum(gval('psuMoney'))||1e9},'🌍 $ enviado a TODOS');
   else if(g2==='pets')globalPush({t:'pets',rar:admRarSel,v:toNum(gval('psuQty'))||1},'🌍 Mascota enviada a TODOS');
   else if(g2==='rb')globalPush({t:'rb',v:toNum(gval('psuRb'))||1},'🌍 Rebirths enviados a TODOS');
   else if(g2==='boost')globalPush({t:'boost',v:1800},'🌍 Boost x2 para TODOS');
   else if(g2==='fever')globalPush({t:'fever',v:3600000},'🌍 Fiebre x2 para TODOS');
   else if(g2==='lucky')globalPush({t:'lucky',v:3600000},'🌍 Suerte x2 para TODOS');
   else if(g2==='goldEgg')globalPush({t:'goldEgg'},'🌍 Huevo dorado para TODOS');
   else if(g2==='gift')globalPush({t:'gift'},'🌍 Caja sorpresa para TODOS');
   else if(g2==='chest')globalPush({t:'chest'},'🌍 Cofre legendario para TODOS');
   else if(g2==='worlds')globalPush({t:'worlds'},'🌍 Mundos desbloqueados para TODOS');
   else if(g2==='sale'){var on=!eggSale;webWrite('adminBroadcast/globalSale',on,'🌍 Rebaja 50% '+(on?'ON':'OFF')+' para TODOS')}
   return}
  if(e.target.closest('#btnFuseGo')){snd.click();doFuse();return}
  if(e.target.closest('#btnFuseAuto')){snd.click();autoPick3();return}
  if(e.target.closest('#btnFuseClr')){snd.click();fuseSelIds=[];renderFusion();return}
  var f=e.target.closest('[data-fid]');if(f){toggleFuse(parseInt(f.dataset.fid,10));return}
  var gp=e.target.closest('[data-gp]');if(gp){givePetExact(parseInt(gp.dataset.gp,10));return}
  var wsel=e.target.closest('.psu-w[data-wid]');if(wsel){admUnlockW(wsel.dataset.wid);return}
  var ra=e.target.closest('[data-rar]');if(ra){admRarSel=ra.dataset.rar;snd.click();renderAdmin();return}
  var am=e.target.closest('[data-am]');if(am){G.money+=toNum(am.dataset.am);toast('💰 +$'+fmt(G.money),'rwd');coinBurst(8);save();updateUI();renderAdmin();return}
  var gv=e.target.closest('[data-gev]');
  if(gv&&IS_SUPER){snd.click();globalEvt(gv.dataset.gev);return}
  var b=e.target.closest('[data-a]');if(!b)return;
  if(!e.target.closest('#pAdmin'))return;
  var a=b.dataset.a;snd.click();
  var V=function(id){var x=document.getElementById(id);return x?x.value:''};
  if(a==='addM'){G.money+=toNum(V('psuMoney'));toast('💰 +$'+fmt(G.money),'rwd');coinBurst(8);save();updateUI();renderAdmin()}
  else if(a==='setM'){G.money=toNum(V('psuMoney'));G.dm=G.money;toast('💵 Fijado $'+fmt(G.money),'rwd');save();updateUI();renderAdmin()}
  else if(a==='pet')givePets(admRarSel,toNum(V('psuQty'))||1);
  else if(a==='dex'){G.disc=PETS.map(function(p){return p.n});toast('📖 Index 100%','rwd');save();updateUI();renderAdmin()}
  else if(a==='boost'){admBoost();renderAdmin()}
  else if(a==='fever'){admFever();renderAdmin()}
  else if(a==='lucky'){admLucky();renderAdmin()}
  else if(a==='sale'){admSale(!eggSale);if(IS_SUPER)webWrite('adminBroadcast/globalSale',eggSale,null);renderAdmin()}
  else if(a==='evt')forceEvt(b.dataset.ev||'rain');
  else if(a==='stopEvt'){if(evtCur)endEvent();
   if(IS_SUPER&&globalAt)webWrite('adminBroadcast/activeEvent',null,'⏹️ Evento global detenido para TODOS');
   renderAdmin()}
  else if(a==='goldEgg'){spawnGoldEgg();toast('🥚 Huevo dorado suelto!','rwd')}
  else if(a==='giftNow'){spawnMysteryBox();toast('🎁 Caja suelta!','rwd')}
  else if(a==='chestNow'){spawnLegendChest();toast('🏆 Cofre suelto!','rwd')}
  else if(a==='worlds'){G.uw=WORLDS.map(function(w){return w.id});apTh();toast('🗺️ Todos los mundos','rwd');snd.world();save();updateUI();renderAdmin()}
  else if(a==='x3'){G.x3=!G.x3;toast(G.x3?'🔓 x3 ON':'x3 OFF','rwd');save();updateUI();renderAdmin()}
  else if(a==='upg'){G.upg={luck:10,inc:10,disc:5,fast:4,auto:3};CLICKS=Math.max(1,5-G.upg.fast);toast('⬆️ Mejoras al maximo','rwd');save();updateUI();renderAdmin()}
  else if(a==='mult'){G.mult=Math.max(1,toNum(V('psuMult'))||1);toast('✖️ Multiplicador x'+fmt(G.mult),'rwd');save();updateUI();renderAdmin()}
  else if(a==='rb'){G.rb=toNum(V('psuRb'))|0;G.mult=Math.pow(1.8,G.rb);toast('♻️ RB '+G.rb+' · x'+G.mult.toFixed(1),'rwd');save();updateUI();renderAdmin()}
  else if(a==='god'){G.mult=1e6;toast('😈 MODO DIOS x1M','rwd');save();updateUI();renderAdmin()}
  else if(a==='ungod'){G.mult=Math.pow(1.8,G.rb);toast('😇 Modo normal','rwd');save();updateUI();renderAdmin()}
  else if(a==='wipe')showCf('🗑️','Borrar mascotas','Se eliminaran TODAS. ¿Seguro?',function(){G.pets=[];refHP();save();updateUI();hideCf();renderAdmin()});
  else if(IS_SUPER){
   if(a==='announce')webWrite('adminBroadcast/text',V('psuAnn').trim(),'📣 Anuncio publicado para TODOS');
   else if(a==='gMult')webWrite('adminBroadcast/globalMult',Math.max(1,toNum(V('psuGM'))||1),'🌐 Mult GLOBAL activado');
   else if(a==='gMultOff')webWrite('adminBroadcast/globalMult',1,'🌐 Mult global quitado');
   else if(a==='pubCode'){var n=V('psuCn').trim().toUpperCase(),t2=V('psuCt'),v=Math.max(1,toNum(V('psuCv'))||1);
    var mx=Math.max(0,toNum(V('psuCMax'))||0),du=Math.max(0,toNum(V('psuCDur'))||0);
    if(!n)return;
    var rw=t2==='money'?{t:'money',v:v}:t2==='rb'?{t:'rb',v:v}:t2==='boost'?{t:'boost',v:v}:t2==='lucky'?{t:'lucky',v:v}:t2==='lu'?{t:'lu',v:v}:{t:'pet',v:1};
    if(mx>0)rw.max=mx;if(du>0){rw.dur=du;rw.at=Date.now()}
    webWrite('adminBroadcast/codes/'+n,rw,'🎟️ Codigo '+n+' publicado'+(mx>0?' · '+mx+' usos':'')+(du>0?' · '+du+' min':''))}
   else if(a==='ban')webWrite('bannedUsers/'+V('psuBan').trim(),true,'🚫 Baneado');
   else if(a==='unban')webWrite('bannedUsers/'+V('psuBan').trim(),null,'✅ Desbaneado');
   else if(a==='mantOn')webWrite('maintenance/psuGame',{on:true,msg:V('psuAnn')||'Volvemos en un rato 🛠️'},'🛠️ Mantenimiento ON');
   else if(a==='mantOff')webWrite('maintenance/psuGame',null,'🛠️ Mantenimiento OFF')}});
 document.addEventListener('input',function(e){
  if(e.target.id==='admPetQ'){admPetQ=e.target.value;renderAdmin();
   var nq=document.getElementById('admPetQ');if(nq){nq.focus();nq.setSelectionRange(nq.value.length,nq.value.length)}}});
 document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='psuCodeInp'){redeemCode(e.target.value);e.target.value=''}});
 addEventListener('keydown',function(e){var t=e.target;if(t&&/^(input|textarea|select)$/i.test(t.tagName))return;
  if((e.key||'').toLowerCase()==='a'&&IS_ADM)setTab('admin')});

 /* deteccion admin + listeners globales */
 onAuthStateChanged(fbAuth,function(u){ME_U=u||null;
  if(!u||!u.email){setAdm(false,false);return}
  var em=(''+u.email).toLowerCase();
  setAdm(ADMIN_EMAILS.indexOf(em)>-1,SUPER_EMAILS.indexOf(em)>-1)});
 onValue(ref(fbDb,'adminBroadcast'),function(s){var v=s.val()||{};
  if(v.text)showBanner(v.text);
  G.webMult=(+v.globalMult)||1;updChip();
  if(v.codes)SRV_CODES=v.codes;renderCodes()},function(){});
 onValue(ref(fbDb,'adminBroadcast/codes'),function(s){SRV_CODES=s.val()||{};renderCodes()},function(){});
 onValue(ref(fbDb,'stats/psuCodes'),function(s){PSU_USES=s.val()||{};renderCodes()},function(){});
 /* ⭐ v48: eventos GLOBALES */
 onValue(ref(fbDb,'adminBroadcast/activeEvent'),function(s){
  var v=s.val();
  if(!v||!v.id){
   if(globalAt&&evtCur&&evtCur.__global){endEvent();toast('⏹️ Evento global terminado','inf')}
   globalAt=0;return}
  if(v.at===globalAt)return;
  globalAt=v.at;
  var gev=null;for(var i=0;i<EVENTS.length;i++)if(EVENTS[i].id===v.id)gev=EVENTS[i];
  if(!gev)return;
  var gend=v.end||(v.at+gev.dur*1000);
  var remain=Math.ceil((gend-Date.now())/1000);
  if(remain<1)return;
  forceEvt(v.id);
  if(evtCur){evtCur.__global=true;evtEnd=gend}
  var b=document.getElementById('evtT');if(b)b.textContent=remain+'s';
  toast('🌍 EVENTO GLOBAL: '+gev.n+' ('+remain+'s para todos)','rwd');snd.world();
 },function(){});
 /* ⭐ v49: receptor de acciones GLOBALES (boosts, dinero, pets...) */
 onValue(ref(fbDb,'adminBroadcast/globalBoosts'),function(s){
  var v=s.val();if(!v||!v.at||v.at===lastBoostAt)return;lastBoostAt=v.at;
  if(ME_U&&v.by===ME_U.email)return; /* el emisor ya lo tiene */
  try{
   if(v.t==='money'){G.money+=v.v;G.te+=v.v;toast('🌐 GLOBAL: +$'+fmt(v.v)+' para todos!','rwd');coinBurst(14);snd.hatch('god')}
   else if(v.t==='boost'){activateBoost(v.v||1800);toast('🌐 GLOBAL: Boost x2 para todos!','rwd')}
   else if(v.t==='fever'){G.feverUntil=Date.now()+(v.v||3600000);save();toast('🌐 GLOBAL: Fiebre x2 para todos!','rwd')}
   else if(v.t==='lucky'){luckyBoost=true;renderBuffs();toast('🌐 GLOBAL: Suerte x2 para todos!','rwd');setTimeout(function(){luckyBoost=false;renderBuffs()},v.v||3600000)}
   else if(v.t==='pets'){givePets(v.rar||'god',v.v||1);toast('🌐 GLOBAL: mascota '+RNAME[v.rar||'god']+' para todos!','rwd')}
   else if(v.t==='rb'){G.rb=(G.rb||0)+v.v;G.mult=Math.pow(1.8,G.rb);toast('🌐 GLOBAL: +'+v.v+' Rebirths para todos!','rwd')}
   else if(v.t==='goldEgg'){spawnGoldEgg();toast('🌐 GLOBAL: Huevo dorado para todos!','rwd')}
   else if(v.t==='gift'){spawnMysteryBox();toast('🌐 GLOBAL: Caja sorpresa para todos!','rwd')}
   else if(v.t==='chest'){spawnLegendChest();toast('🌐 GLOBAL: Cofre legendario para todos!','rwd')}
   else if(v.t==='worlds'){if(G.uw.length<WORLDS.length){G.uw=WORLDS.map(function(w){return w.id});apTh();toast('🌐 GLOBAL: Todos los mundos desbloqueados!','rwd')}}
   save();updateUI()
  }catch(e){}
 },function(){});
 /* ⭐ v49: rebaja global persistente */
 onValue(ref(fbDb,'adminBroadcast/globalSale'),function(s){var v=s.val();
  if(v===true&&!eggSale){eggSale=true;renderBuffs();toast('🌐 GLOBAL: Rebaja 50% en huevos!','rwd')}
  if(v!==true&&eggSale&&!IS_ADM){eggSale=false;renderBuffs()}},function(){});
 onValue(ref(fbDb,'bannedUsers'),function(s){var v=s.val(),uid=luUid||(ME_U&&ME_U.uid);
  if(uid&&v&&v[uid])psuOv('psuBanOv','<div style="font-size:44px">🚫</div><h2>Estas baneado</h2><p style="color:#9aa">Contacta con un administrador.</p>');
  else psuOvX('psuBanOv')},function(){});
 /* mantenimiento: admin INMUNE (guard cada segundo) + Reintentar para jugadores */
 onValue(ref(fbDb,'maintenance'),function(s){
  if(IS_ADM){psuOvX('psuMantOv');return}
  var v=s.val(),on=false,msg='';
  if(v===true)on=true;
  else if(v&&typeof v==='object'){
   if(v.on===true){on=true;msg=v.msg||''}
   else if(v.enabled===true){on=true;msg=v.message||v.msg||''}
   else{for(var k in v){var c=v[k];if(c&&(c===true||c.on===true)){on=true;msg=c.msg||'';break}}}}
  if(on){psuOv('psuMantOv','<div style="font-size:44px">🛠️</div><h2>Mantenimiento</h2><p style="color:#9aa">'+esc(msg||'Volvemos en un rato')+'</p><button class="psu-b" id="psuMantX" style="margin-top:12px">🔄 Reintentar</button>','#f59e0b');
   var xb=document.getElementById('psuMantX');if(xb)xb.onclick=function(){location.reload()}}
  else psuOvX('psuMantOv')},function(){});
 setInterval(function(){if(IS_ADM)psuOvX('psuMantOv')},1000);

 /* ticks */
 setInterval(function(){checkQuests();
  if(aTab==='hub')renderQuests();
  if(aTab==='fusion'){var sc=document.querySelector('#pFusion .psu-pad'),st2=sc?sc.scrollTop:0;renderFusion();if(sc)sc.scrollTop=st2}
  if(aTab==='admin'){var sc3=document.querySelector('#pAdmin .psu-pad'),st3=sc3?sc3.scrollTop:0;var ae=document.activeElement;
   if(!(ae&&/^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName))){renderAdmin();if(sc3)sc3.scrollTop=st3}}},1000);
 updChip();

 /* 🎉 aviso de actualización (una vez por versión) */
 try{
 if(!localStorage.getItem(UPD_KEY)){
  var m=document.createElement('div');m.className='psu-ov';m.id='psuUpd';
  m.innerHTML='<div class="psu-ovc" style="border-color:#22d3ee;max-width:430px;text-align:left">'
   +'<div style="font-size:42px;text-align:center">🌍</div><h2 style="text-align:center;margin:6px 0 12px">ACTUALIZACIÓN '+UPD_VERSION.toUpperCase()+'</h2>'
   +'<div style="font-size:13px;line-height:2;color:#cdd9e8">'
   +'🌍 <b>TODO puede ser GLOBAL</b> — dinero, mascotas, rebirths, boosts, rebaja, cofres y mundos para todos<br>'
   +'▶ o 🌍 en cada botón: solo tú o todo el mundo<br>'
   +'🎉 15 eventos globales con cuenta atrás sincronizada<br>'
   +'🎟️ Códigos con usos limitados y caducidad<br>'
   +'💾 <b style="color:#7ee2a8">Tu progreso NO se ha borrado</b></div>'
   +'<button class="psu-b psu-b-g" id="psuUpdOk" style="width:100%;margin-top:14px;padding:12px;font-size:15px;justify-content:center;display:flex;align-items:center;gap:8px">¡A JUGAR! 🚀</button></div>';
  document.body.appendChild(m);m.style.display='flex';
  document.getElementById('psuUpdOk').onclick=function(){
   try{localStorage.setItem(UPD_KEY,'1')}catch(e){}
   m.remove();snd.hatch('og');coinBurst(20)};
  snd.world()}
 }catch(e){}
}
window.__psu={G:function(){return G},setAdm:setAdm,who:function(){
 if(ME_U&&ME_U.email){console.log('📧 Logueado como:',ME_U.email,'· Admin:',IS_ADM,'· Super:',IS_SUPER);return ME_U.email}
 console.log('❌ Sin sesion iniciada');return null},
mantHide:function(){psuOvX('psuMantOv')},
mantOff:function(){runTransaction(ref(fbDb,'maintenance'),function(){return null})
 .then(function(){toast('🛠️ Mantenimiento APAGADO','rwd');psuOvX('psuMantOv')})
 .catch(function(e){console.log('❌',e.message);toast('Sin permiso — borra el nodo en Firebase Console','err')})},
mantState:function(){onValue(ref(fbDb,'maintenance'),function(s){console.log('maintenance =',JSON.stringify(s.val()))},{onlyOnce:true})}};

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
// Restaurar boost
if(G.boostUntil&&G.boostUntil>Date.now()){
  boostActive=true;
  var rem=G.boostUntil-Date.now();
  boostTimeout=setTimeout(function(){boostActive=false;G.boostUntil=0;toast('Boost terminado','inf');updateUI()},rem);
}else{G.boostUntil=0}
CLICKS=Math.max(1,5-(G.upg?G.upg.fast:0));
// Eventos aleatorios (~11% por minuto)
setInterval(function(){if(!evtCur&&Math.random()<.11)startEvent()},60000);

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
buildAddons();

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

setInterval(function(){updRk();if(aTab==='rank')renderRk()},5000);
setInterval(save,8000);

function rLoop(){var diff=G.money-G.dm;if(Math.abs(diff)>.5){G.dm+=diff*.15;document.getElementById('sMoney').textContent='$'+fmt(Math.round(G.dm))}requestAnimationFrame(rLoop)}
requestAnimationFrame(rLoop);

document.addEventListener('click',function(){snd.go()},{once:true});
document.addEventListener('touchstart',function(){snd.go()},{once:true});
