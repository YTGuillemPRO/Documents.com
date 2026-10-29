/* ============ ¡ROBA EL MEME! — datos del juego ============ */
window.RAREZAS = {
  comun:      { nombre:'Común',      color:'#8d99ae', nivel:1 },
  raro:       { nombre:'Raro',       color:'#4ea8de', nivel:2 },
  epico:      { nombre:'Épico',      color:'#9b5de5', nivel:4 },
  legendario: { nombre:'Legendario', color:'#f4a259', nivel:7 },
  mitico:     { nombre:'Mítico',     color:'#ef476f', nivel:10 },
  secreto:    { nombre:'Secreto',    color:'#2ec4b6', nivel:13 }
};

/* reqRenacer = renacimientos mínimos para poder comprarlo (exclusivos) */
window.MEMES = [
  { id:'pato',     nombre:'Pato Plesitoso',  rareza:'comun', precio:25,   ingreso:1,   desc:'Nada, grazna y cotillea.',        modelo:{ cuerpo:'perita', c:0xffd93b, hocico:'pico', ojos:'normal', extra:['alas'], extraC:0xffd93b } },
  { id:'gatojuez', nombre:'Gato Juez',       rareza:'comun', precio:40,   ingreso:1.6, desc:'Veredicto: culpable de ser adorable.', modelo:{ cuerpo:'perita', c:0x9aa7b8, orejas:'puntas', sombrero:'copa', sombreroC:0x2b211c, ojos:'normal', extra:['mazo'] } },
  { id:'perropiloto', nombre:'Perro Piloto', rareza:'comun', precio:55,   ingreso:2.2, desc:'Despega en 3, 2, 1…',              modelo:{ cuerpo:'capsula', c:0xb07845, orejas:'caidas', sombrero:'gorro', sombreroC:0x6d4c2f, ojos:'feliz', extra:['gafas'] } },
  { id:'conejoturbo', nombre:'Conejo Turbo', rareza:'comun', precio:70,   ingreso:2.8, desc:'Más rápido que tu wifi.',         modelo:{ cuerpo:'perita', c:0xf5f0e6, orejas:'largas', ojos:'feliz', extra:['bufanda'], extraC:0xe25555 } },
  { id:'pollitodj',   nombre:'Pollito DJ',   rareza:'raro',  precio:120,  ingreso:4,   desc:'Pón-pon-pon-pon.',                modelo:{ cuerpo:'esfera', c:0xffe066, hocico:'pico', sombrero:'cono', sombreroC:0x9b5de5, ojos:'feliz', extra:['auriculares'], extraC:0xef476f } },
  { id:'ranacantora', nombre:'Rana Cantora', rareza:'raro',  precio:150,  ingreso:5,   desc:'Doble platino en el charco.',     modelo:{ cuerpo:'perita', c:0x6ab04c, ojos:'grande', extra:['micro'] } },
  { id:'mapachechef', nombre:'Mapache Chef', rareza:'raro',  precio:180,  ingreso:6,   desc:'Cocina basura… gourmet.',         modelo:{ cuerpo:'perita', c:0x6d6875, panza:0xcfc6bd, orejas:'puntas', sombrero:'chef', ojos:'normal', extra:['cola'], extraC:0x6d6875 } },
  { id:'zorroninja',  nombre:'Zorro Ninja',  rareza:'raro',  precio:220,  ingreso:7,   desc:'Nadie lo vio. Ni tú.',            modelo:{ cuerpo:'perita', c:0xee7647, panza:0xfff0dd, orejas:'puntas', hocico:'hocico', ojos:'enfado', extra:['cola','cinta'], extraC:0xee7647 } },
  { id:'tiburon',     nombre:'Tiburón Playero', rareza:'raro', precio:260, ingreso:8,  desc:'Solo muerde helados.',            modelo:{ cuerpo:'perita', c:0x7fb8c9, hocico:'hocico', ojos:'normal', extra:['aleta','gafasSol'] } },
  { id:'gorila',    nombre:'Gorila Músculo',  rareza:'epico', precio:450,  ingreso:13,  desc:'100% bíceps, 0% paciencia.',      modelo:{ cuerpo:'caja', c:0x4a3728, panza:0x8a6d4f, ojos:'enfado', extra:['musculos'] } },
  { id:'robotfiesta', nombre:'Robot Fiesta',  rareza:'epico', precio:550,  ingreso:16,  desc:'BEEP. ¡FIESTA! BEEP.',            modelo:{ cuerpo:'caja', c:0x45b7d6, cabezaCaja:true, cab:0x9fd8e8, ojos:'led', sombrero:'cono', sombreroC:0xffd93b, extra:['antena'], extraC:0xef476f } },
  { id:'unicornio', nombre:'Unicornio Chulo', rareza:'epico', precio:650,  ingreso:19,  desc:'Fabuloso y lo sabe.',             modelo:{ cuerpo:'perita', c:0xfbf5f3, panza:0xffd6e8, orejas:'puntas', hocico:'hocico', ojos:'feliz', extra:['cuerno','melena','cola'], extraC:0xff9ff3 } },
  { id:'dragonbebe', nombre:'Dragón Bebé',    rareza:'epico', precio:780,  ingreso:22,  desc:'Escupe fueguitos de cumple.',     modelo:{ cuerpo:'perita', c:0x52b788, panza:0xd8f3a3, orejas:'cuernitos', hocico:'hocico', ojos:'grande', extra:['alas','cola'], extraC:0x2d6a4f } },
  { id:'calamar',  nombre:'Calamar Alien',    rareza:'epico', precio:900,  ingreso:26,  desc:'Viene en paz. Y por tus memes.',  modelo:{ cuerpo:'perita', c:0x9b5de5, ojos:'grande', extra:['tentaculos','antena'], extraC:0xefa9ee } },
  { id:'fenix',    nombre:'Fénix Flama',      rareza:'legendario', precio:1600, ingreso:42, desc:'Renace cada partida.',        modelo:{ cuerpo:'perita', c:0xe85d04, hocico:'pico', ojos:'enfado', extra:['llamas','alas'], extraC:0xffba08 } },
  { id:'kraken',   nombre:'Kraken Pulpo',     rareza:'legendario', precio:1900, ingreso:50, desc:'Abraza fuerte. Demasiado.',   modelo:{ cuerpo:'perita', c:0x5a4ae3, ojos:'grande', extra:['tentaculos'], extraC:0x3d31a8 } },
  { id:'golem',    nombre:'Golem Piedra',     rareza:'legendario', precio:2200, ingreso:58, desc:'Pesa más que tus excusas.',   modelo:{ cuerpo:'caja', c:0x8d8d92, cabezaCaja:true, ojos:'led', extra:['musgo'] } },
  { id:'cientifico', nombre:'Científico Loco', rareza:'legendario', precio:2600, ingreso:68, desc:'¡Funciona! Bueno… casi.',    modelo:{ cuerpo:'perita', c:0xf2f2f2, cab:0xffd7b0, ojos:'normal', extra:['gafas','pelo'] } },
  { id:'ciberzorro', nombre:'Ciberzorro',     rareza:'mitico', precio:5000,  ingreso:120, desc:'42 de ping, 0 paquetes perdidos.', modelo:{ cuerpo:'perita', c:0x00b4d8, orejas:'puntas', hocico:'hocico', ojos:'led', extra:['cola','antena'], extraC:0x48cae4 } },
  { id:'reyajolote', nombre:'Rey Ajolote',    rareza:'mitico', precio:6500,  ingreso:155, desc:'Monarca del canal.',          modelo:{ cuerpo:'perita', c:0xff9ff3, panza:0xffe0f3, ojos:'feliz', sombrero:'corona', extra:['branquias'], extraC:0xff6f91 } },
  { id:'gatocosmico', nombre:'Gatocósmico',   rareza:'mitico', precio:8000,  ingreso:190, desc:'Miau cuántico.',              modelo:{ cuerpo:'perita', c:0x2b2d5c, orejas:'puntas', ojos:'grande', extra:['cola','estrellas'], extraC:0xffd93b } },
  { id:'glitchgato',  nombre:'Glitch Gato',   rareza:'secreto', precio:15000, ingreso:300, desc:'E r r o r m i a u .',        modelo:{ cuerpo:'perita', c:0xf5f0e6, orejas:'puntas', ojos:'rojo', extra:['glitch','cola'], extraC:0x2b211c } },
  { id:'vacasluna',   nombre:'El Vacas Luna', rareza:'secreto', precio:20000, ingreso:400, desc:'Un pequeño paso para una vaca…', modelo:{ cuerpo:'caja', c:0xf5f5f0, cabezaCaja:true, hocico:'hocico', ojos:'normal', sombrero:'casco', extra:['cuernos','manchas'], extraC:0x2b211c } },
  { id:'donmeme',     nombre:'DON MEME',      rareza:'secreto', precio:30000, ingreso:600, desc:'El jefe final del humor.',    modelo:{ cuerpo:'caja', c:0xffd93b, cabezaCaja:true, ojos:'normal', sombrero:'corona', extra:['gafasSol','corbata'] } },
  { id:'doradito',    nombre:'Meme Dorado',   rareza:'secreto', reqRenacer:2, precio:25000, ingreso:500,  desc:'Solo despierta para quien ha renacido 2 veces.', modelo:{ cuerpo:'perita', c:0xffd700, panza:0xfff3b0, ojos:'feliz', sombrero:'corona', extra:['estrellas','corbata'], extraC:0xffd700 } },
  { id:'diosmeme',    nombre:'DIOS DEL MEME', rareza:'secreto', reqRenacer:5, precio:50000, ingreso:1100, desc:'Renace 5 veces y la divinidad es tuya.', modelo:{ cuerpo:'esfera', c:0xfffbe6, ojos:'led', sombrero:'corona', extra:['melena','estrellas'], extraC:0xffd700 } }
];

window.MEJORAS = [
  { id:'zapatos', nombre:'Zapatos Turbo',    icono:'i-zapato',   max:5, base:120, mult:1.9, desc:'+8% de velocidad por nivel.' },
  { id:'guante',  nombre:'Guante Pro',       icono:'i-guante',   max:5, base:150, mult:2.0, desc:'Cargas memes robados con menos penalización (-4% por nivel).' },
  { id:'iman',    nombre:'Imán de Monedas',  icono:'i-iman',     max:4, base:200, mult:2.2, desc:'+1,2 de radio de recogida por nivel.' },
  { id:'base',    nombre:'Base XL',          icono:'i-expandir', max:3, base:400, mult:2.5, desc:'+2 pedestales por nivel (6 → 8 → 10).' },
  { id:'escudo',  nombre:'Escudo Anti-Robo', icono:'i-escudo',   max:0, base:150, mult:1.5, desc:'Protege tu base de robos durante 60 s. Compra repetible.' }
];

window.LOGROS = [
  { id:'primer',   nombre:'Primer Meme',        desc:'Compra tu primer meme.',            premio:50 },
  { id:'coleccion',nombre:'Coleccionista',      desc:'Ten 10 memes a la vez.',            premio:250 },
  { id:'ladron',   nombre:'Ladrón Novato',      desc:'Roba tu primer meme.',              premio:100 },
  { id:'maestro',  nombre:'Maestro del Robo',   desc:'Roba 10 memes.',                    premio:500 },
  { id:'rico',     nombre:'Poco a Poco',        desc:'Gana 1.000 monedas en total.',      premio:100 },
  { id:'magnate',  nombre:'Magnate',            desc:'Gana 25.000 monedas en total.',     premio:1000 },
  { id:'nivel5',   nombre:'Veterano',           desc:'Alcanza el nivel 5.',               premio:200 },
  { id:'leyenda',  nombre:'Dueño de Leyendas',  desc:'Consigue un legendario o mejor.',   premio:750 },
  { id:'mito',     nombre:'Cazamitos',          desc:'Consigue un mítico o mejor.',       premio:1500 },
  { id:'evento3',  nombre:'Sobreviviente',      desc:'Supera 3 eventos.',                 premio:150 },
  { id:'lluvia25', nombre:'Recogemonas',        desc:'Recoge 25 monedas de lluvia.',      premio:150 },
  { id:'lleno',    nombre:'Base Llena',         desc:'Llena todos tus pedestales.',       premio:300 },
  { id:'renacer1', nombre:'Segunda Vida',       desc:'Renace por primera vez.',           premio:500 },
  { id:'renacer3', nombre:'Bucle Infinito',     desc:'Renace 3 veces.',                   premio:2000 },
  { id:'record10k',nombre:'Un Montón de Pasta', desc:'Alcanza un récord de 10.000 monedas.', premio:300 },
  { id:'nocturno', nombre:'Turno de Noche',     desc:'Cobra tus ganancias offline.',      premio:200 }
];

window.CONFIG_JUEGO = {
  monedasIniciales: 60,
  eventoCada: 95, eventoDuracion: 25,
  multIngresos: 1, rebaja: 0.4, fiebre: 2,
  escudoDuracion: 60, lluviaMonedas: 16, lluviaValor: 15,
  botAgresividad: 1,
  renacerNivel: 8,      // nivel mínimo para renacer
  renacerBonus: 0.3,    // +30% de ingresos permanente por renacimiento
  renacerMonedas: 75,   // monedas extra de arranque por renacimiento
  offlineHoras: 8,      // máximo de horas que trabajan tus memes sin ti
  offlinePorc: 0.5      // porcentaje de ingresos mientras estás fuera
};
