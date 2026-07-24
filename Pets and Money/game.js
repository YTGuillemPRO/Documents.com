import * as THREE from 'three';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, get, set, runTransaction, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ===== DATOS =====
var WORLDS=[
{id:'bosque',name:'Bosque Encantado',icon:'🌲',desc:'El inicio de tu aventura.',color:'#10b981',color2:'#84cc16',bonus:1,cost:0,eggs:['basico','dorado'],particles:'leaves'},
{id:'pradera',name:'Pradera Dorada',icon:'🌾',desc:'Campos magicos.',color:'#84cc16',color2:'#a3e635',bonus:1.3,cost:25000,eggs:['campestre','arcano'],particles:'leaves'},
{id:'oceano',name:'Oceano Profundo',icon:'🌊',desc:'Bestias del mar.',color:'#06b6d4',color2:'#3b82f6',bonus:1.7,cost:1e6,eggs:['marino','abisal'],particles:'bubbles'},
{id:'cristal',name:'Cueva Cristal',icon:'💎',desc:'Gemas brillantes.',color:'#d946ef',color2:'#ec4899',bonus:2.2,cost:5e7,eggs:['cristalino','gema'],particles:'stars'},
{id:'volcan',name:'Volcan Infernal',icon:'🌋',desc:'Rios de lava.',color:'#f97316',color2:'#ef4444',bonus:3,cost:2e9,eggs:['magmatico','infernal'],particles:'embers'},
{id:'templo',name:'Templo Sagrado',icon:'🏛️',desc:'Dioses ancestrales.',color:'#eab308',color2:'#f59e0b',bonus:4.5,cost:1e11,eggs:['divino','ancestral'],particles:'stars'},
{id:'cosmos',name:'Cosmos Infinito',icon:'🪐',desc:'Vacio entre estrellas.',color:'#a855f7',color2:'#ec4899',bonus:7,cost:5e12,eggs:['cosmico','estelar'],particles:'stars'},
{id:'abismo',name:'Abismo Eterno',icon:'🌑',desc:'La dimension final.',color:'#6366f1',color2:'#06b6d4',bonus:12,cost:3e14,eggs:['umbral','absoluto'],particles:'wisps'}
];
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
{ic:'fa-solid fa-circle-xmark',n:'Nada Final',r:'secret',e:50000,eg:['absoluto'],c:'#1e1b4b'},{ic:'fa-solid fa-infinity',n:'Todo',r:'og',e:200000,eg:['absoluto'],c:'#c026d3'}
];
var WEIGHTS={basico:{common:65,rare:30,epic:4,god:1},dorado:{rare:12,epic:30,god:40,legendary:13,mythic:4,secret:.8,og:.2},campestre:{common:30,rare:28,epic:22,god:14,legendary:4.5,mythic:1,secret:.4,og:.1},arcano:{epic:25,god:35,legendary:28,mythic:9,secret:2,og:1},marino:{common:10,rare:20,epic:25,god:25,legendary:13,mythic:5,secret:1.5,og:.5},abisal:{epic:10,god:18,legendary:30,mythic:28,secret:8,og:6},cristalino:{rare:8,epic:18,god:28,legendary:25,mythic:14,secret:4,og:3},gema:{god:10,legendary:25,mythic:35,secret:18,og:12},magmatico:{rare:5,epic:14,god:22,legendary:25,mythic:18,secret:9,og:7},infernal:{epic:8,god:14,legendary:22,mythic:28,secret:14,og:14},divino:{epic:6,god:12,legendary:20,mythic:28,secret:18,og:16},ancestral:{god:8,legendary:18,mythic:30,secret:22,og:22},cosmico:{epic:4,god:8,legendary:15,mythic:28,secret:22,og:23},estelar:{legendary:8,mythic:28,secret:28,og:36},umbral:{mythic:28,secret:30,og:42},absoluto:{secret:35,og:65}};
var RCOL={common:'#9ca3af',rare:'#38bdf8',epic:'#c084fc',god:'#fbbf24',legendary:'#f87171',mythic:'#f472b6',secret:'#22d3ee',og:'#fbbf24'};
var RNAME={common:'Comun',rare:'Raro',epic:'Epico',god:'Dios',legendary:'Legendario',mythic:'Mitico',secret:'Secreto',og:'OG'};
var RORD={common:1,rare:2,epic:3,god:4,legendary:5,mythic:6,secret:7,og:8};
var RKEYS=['common','rare','epic','god','legendary','mythic','secret','og'];
var ESCLS={basico:'es-bas',dorado:'es-dor',campestre:'es-cam',arcano:'es-arc',marino:'es-mar',abisal:'es-abi',cristalino:'es-cri',gema:'es-gem',magmatico:'es-mag',infernal:'es-inf',divino:'es-div',ancestral:'es-anc',cosmico:'es-cos',estelar:'es-est',umbral:'es-umb',absoluto:'es-abs'};
var ENAMES={basico:'Basico',dorado:'Dorado',campestre:'Campestre',arcano:'Arcano',marino:'Marino',abisal:'Abisal',cristalino:'Cristalino',gema:'Gema',magmatico:'Magmatico',infernal:'Infernal',divino:'Divino',ancestral:'Ancestral',cosmico:'Cosmico',estelar:'Estelar',umbral:'Umbral',absoluto:'Absoluto'};
var E3DG={basico:'linear-gradient(145deg,#f8fafc,#cbd5e1,#94a3b8)',dorado:'linear-gradient(145deg,#fef3c7,#f59e0b,#d97706)',campestre:'linear-gradient(145deg,#065f46,#10b981,#84cc16)',arcano:'linear-gradient(145deg,#4c1d95,#8b5cf6,#c084fc)',marino:'linear-gradient(145deg,#0c4a6e,#0ea5e9,#22d3ee)',abisal:'linear-gradient(145deg,#0f172a,#1e3a5f,#0ea5e9)',cristalino:'linear-gradient(145deg,#ec4899,#f0abfc,#e879f9)',gema:'linear-gradient(145deg,#f43f5e,#a855f7,#3b82f6)',magmatico:'linear-gradient(145deg,#7c2d12,#ea580c,#facc15)',infernal:'linear-gradient(145deg,#7f1d1d,#dc2626,#f97316)',divino:'linear-gradient(145deg,#fef9c3,#fde68a,#fff)',ancestral:'linear-gradient(145deg,#92400e,#d97706,#fbbf24)',cosmico:'linear-gradient(145deg,#1e1b4b,#7c3aed,#06b6d4)',estelar:'linear-gradient(145deg,#1e1b4b,#7c3aed,#ec4899)',umbral:'linear-gradient(145deg,#0f0f23,#312e81,#000)',absoluto:'conic-gradient(from 0deg,#f43f5e,#a855f7,#3b82f6,#10b981,#fbbf24,#f43f5e)'};
var CLICKS=5;

// ===== ESTADO =====
var G={money:10,dm:10,rb:0,mult:1,pets:[],disc:[],pr:{basico:10,dorado:500,campestre:2000,arcano:20000,marino:50000,abisal:4e5,cristalino:2e6,gema:15e6,magmatico:80e6,infernal:5e8,divino:5e9,ancestral:3e10,cosmico:3e11,estelar:2e12,umbral:2e13,absoluto:2e14},uw:['bosque'],tot:0,te:0,mut:false,nid:1,pn:'Mi Base',ao:false,aon:false,world:'bosque'};
var selE='basico',rbC=false,rbT=null,aTab='game',cfCb=null,hSt={pet:null,cl:0,rev:false,bur:false};
var boostActive = false;

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
function pE(p){return(p.be||1)*(1+.2*((p.lv||1)-1))*(G.mult||1)*(gW().bonus||1)*(boostActive?2:1)}
function tI(){var s=0;for(var i=0;i<G.pets.length;i++)s+=pE(G.pets[i]);return s}
function rbCo(){return Math.floor(5e5*Math.pow(2,G.rb))}
function uCo(p){return Math.floor((p.be||1)*25*(p.lv||1))}
function sphH(p,sz){var c=sz==='xs'?'sph-xs':'sph-sm';return'<div class="sph '+p.r+' '+c+'"><div class="sph-base" style="background-color:'+p.c+'"></div><div class="sph-light"></div><div class="sph-icon"><i class="'+p.ic+'"></i></div><div class="sph-shadow"></div></div>'}

// ===== SONIDO =====
var snd={cx:null,go:function(){try{if(!this.cx)this.cx=new(window.AudioContext||window.webkitAudioContext)();if(this.cx.state==='suspended')this.cx.resume()}catch(e){}},t:function(f,d,tp,v){if(!this.cx||G.mut)return;try{var o=this.cx.createOscillator(),g=this.cx.createGain();o.type=tp||'sine';o.frequency.setValueAtTime(f,this.cx.currentTime);g.gain.setValueAtTime(v||.08,this.cx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.cx.currentTime+d);o.connect(g);g.connect(this.cx.destination);o.start();o.stop(this.cx.currentTime+d)}catch(e){}},hatch:function(r){this.go();var x=RKEYS.indexOf(r),s=this;if(x<=1){this.t(523,.12);setTimeout(function(){s.t(659,.15)},80)}else if(x<=3){this.t(659,.1);setTimeout(function(){s.t(784,.1)},70);setTimeout(function(){s.t(988,.15)},140)}else{[523,659,784,988,1047,1175,1319].forEach(function(f,i){setTimeout(function(){s.t(f,.2,'triangle',.06)},i*50)})}},crack:function(n,mx){this.go();this.t(300+(n/mx)*800,.06,'square',.05)},burst:function(){this.go();var s=this;[800,1000,1200].forEach(function(f,i){setTimeout(function(){s.t(f,.15,'triangle',.07)},i*40)})},click:function(){this.go();this.t(800,.04,'square',.03)},err:function(){this.go();this.t(200,.15,'sawtooth',.04)},world:function(){this.go();var s=this;[440,554,659,880].forEach(function(f,i){setTimeout(function(){s.t(f,.15,'triangle',.06)},i*80)})}};

// ===== ROLL =====
function roll(egg){var w=WEIGHTS[egg];if(!w)return PETS[0];var ks=Object.keys(w),t=0;for(var i=0;i<ks.length;i++)t+=w[ks[i]];var r=Math.random()*t,ch=ks[0];for(var i=0;i<ks.length;i++){r-=w[ks[i]];if(r<=0){ch=ks[i];break}}var pool=[];for(var i=0;i<PETS.length;i++){if(PETS[i].r===ch&&PETS[i].eg.indexOf(egg)!==-1)pool.push(PETS[i])}if(!pool.length)return PETS[0];return pool[Math.floor(Math.random()*pool.length)]}

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
var hR,hS,hC,hM=[];
function initH3D(){
    var ct=document.getElementById('habitat');var w=ct.clientWidth,h=ct.clientHeight;
    hR=new THREE.WebGLRenderer({alpha:true,antialias:true});hR.setSize(w,h);hR.setPixelRatio(Math.min(devicePixelRatio,2));hR.setClearColor(0,0);ct.insertBefore(hR.domElement,ct.firstChild);
    hS=new THREE.Scene();hC=new THREE.PerspectiveCamera(40,w/h,.1,100);hC.position.set(0,1.8,5.5);hC.lookAt(0,0,0);
    hS.add(new THREE.AmbientLight(0xffffff,.7));var dl=new THREE.DirectionalLight(0xffffff,1.2);dl.position.set(3,5,4);hS.add(dl);hS.add(new THREE.HemisphereLight(0x88ffaa,0x224466,.3));
    var gg=new THREE.CircleGeometry(3.5,48);var gm=new THREE.MeshStandardMaterial({color:0x1a3a20,roughness:.85});var gnd=new THREE.Mesh(gg,gm);gnd.rotation.x=-Math.PI/2;gnd.position.y=-.5;gnd.userData.isGround=true;hS.add(gnd);
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
    vM=new THREE.Mesh(geo,mat);vS.add(vM);vA=true;anR();
}
function stopR(){vA=false}
function anR(){if(!vA)return;requestAnimationFrame(anR);var t=performance.now()*.001;if(vM){vM.rotation.y=t*.8;vM.rotation.x=Math.sin(t*.5)*.15}vR.render(vS,vC)}

// ===== PARTICULAS HATCH =====
var hCx,hP=[];
function spHP(rar){var c=document.getElementById('hatchCanvas');var r=c.parentElement.getBoundingClientRect();c.width=r.width*2;c.height=r.height*2;hCx=c.getContext('2d');hCx.scale(2,2);var w=r.width,h=r.height,col=RCOL[rar]||'#fff';var ct=RORD[rar]>=5?100:40;hP=[];for(var i=0;i<ct;i++){var an=Math.random()*Math.PI*2,sp=Math.random()*8+2;hP.push({x:w/2,y:h/2,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,sz:Math.random()*5+1,col:col,l:Math.random()*50+30,ml:80,g:.06})}anHP(w,h)}
function anHP(w,h){if(!hCx||!hP.length)return;hCx.clearRect(0,0,w,h);var al=false;for(var i=0;i<hP.length;i++){var p=hP[i];if(p.l<=0)continue;al=true;p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.l--;p.vx*=.98;var a=p.l/p.ml;hCx.globalAlpha=a;hCx.fillStyle=p.col;hCx.beginPath();hCx.arc(p.x,p.y,Math.max(.5,p.sz*a),0,Math.PI*2);hCx.fill()}hCx.globalAlpha=1;if(al)requestAnimationFrame(function(){anHP(w,h)})}

// ===== TEMA =====
function apTh(){var w=gW(),r=document.documentElement;r.style.setProperty('--wa',w.color);r.style.setProperty('--wa2',w.color2);r.style.setProperty('--wabg',w.color+'18');r.style.setProperty('--wbd',w.color+'30');r.style.setProperty('--wsh',w.color+'40');r.style.setProperty('--wg',w.color+'20');document.getElementById('worldBadge').textContent=w.name.split(' ')[0].toUpperCase();document.getElementById('habLabel').textContent='Habitat - '+w.name;document.getElementById('sWB').textContent='x'+w.bonus.toFixed(1);document.getElementById('worldBadge').style.color=w.color}

// ===== SAVE/LOAD =====
var SK='PetSimUltra_v36';
function save(){try{localStorage.setItem(SK,JSON.stringify({money:G.money,rb:G.rb,mult:G.mult,pets:G.pets,disc:G.disc,pr:G.pr,uw:G.uw,tot:G.tot,te:G.te,mut:G.mut,nid:G.nid,pn:G.pn,ao:G.ao,aon:G.aon,world:G.world}))}catch(e){}}
function load(){var raw=null;try{raw=localStorage.getItem(SK)}catch(e){return}if(!raw)return;try{var d=JSON.parse(raw);if(!d)return;G.money=d.money||10;G.dm=G.money;G.rb=d.rb||0;G.mult=d.mult||1;G.mut=!!d.mut;G.tot=d.tot||0;G.te=d.te||0;G.nid=d.nid||1;G.pn=d.pn||'Mi Base';G.ao=!!d.ao;G.aon=!!d.aon;G.world=d.world||'bosque';G.uw=d.uw||['bosque'];if(d.pr)G.pr=d.pr;G.disc=d.disc||[];G.pets=[];if(d.pets){for(var i=0;i<d.pets.length;i++){var p=d.pets[i];if(!p)continue;G.pets.push({ic:p.ic||'fa-solid fa-paw',n:p.n,r:p.r,be:p.be||p.e||1,lv:p.lv||1,id:p.id||G.nid++,c:p.c||'#888',eg:p.eg||[]})}}}catch(e){}}
function resetG(){try{localStorage.removeItem(SK)}catch(e){}G={money:10,dm:10,rb:0,mult:1,pets:[],disc:[],pr:{basico:10,dorado:500,campestre:2000,arcano:20000,marino:50000,abisal:4e5,cristalino:2e6,gema:15e6,magmatico:80e6,infernal:5e8,divino:5e9,ancestral:3e10,cosmico:3e11,estelar:2e12,umbral:2e13,absoluto:2e14},uw:['bosque'],tot:0,te:0,mut:false,nid:1,pn:'Mi Base',ao:false,aon:false,world:'bosque'};selE='basico';rbC=false;apTh();refHP();updateUI();toast('Reiniciado','inf')}

// ===== RANKING =====
var NM=['xXDarkWolfXx','PetMaster99','DragonSlayer','ProGamer2k','NeonBlade','ShadowHunter','CrystalQueen','FireLord77','IcePhoenix','StormBreaker','LunaStar','CosmicDust','ThunderBolt','SilverFang','GoldenEagle','NightHawk','StarDust42','ViperStrike','MysticMage','BlazeKing','ArcticFox','CrimsonTide','DiamondHand','EmeraldWind','RubyHeart','SapphireEye','IronFist01','SteelNerve','BronzeShield','PlatinumAce','GhostRider','PhantomX','Spectre007','WraithLord','ElTigre','LaFiera','ElDragon','LaBestia','SpeedDemon','TurboBoost','NitroFlame','RapidFire','QuickSilver','MegaBoss','UltraKing','SuperNova','HyperDrive','GigaChad','TinyTitan','MiniMight','AlphaWolf','OmegaForce','GammaRay','DeltaStrike','VolcanicAsh','GlacierIce','TornadoX','Earthquake9','Tsunami7','Wildfire3','Avalanche5','Monsoon8','Blizzard1','NoobSlayer','AFKAndWin','LuckyDraw','PetCollector','EggHunter','RareFinder','MythicChaser','LegendSeeker','GalacticOwl','NebulaCat','CometDog','PulsarFox','QuasarBear','DarkMatter7','SingularityX','QuantumLeap','ChaosLord','OrderKeeper','ZenMaster','SakuraPet','MatchaKing','RamenLord','SushiDog','WasabiCat','MisoPanda','TofuFox','MelonPan','StrawbDog','ChocoCat','VanillaFox','CaramelBear','CookieOwl','BrownieBun','Pudding7','FlanKing','Macaron6','Tiramisu7','Gelato6','Sorbet2','Nutella7','Pistachio5','Chestnut3','Acorn8','Coconut7','JadeWarrior','AmberLight','CoralReef','PearlDiver','OpalDream','OnyxBlade','TopazSun','GarnetRose','PeridotEye','QuartzMind','ObsidianX','PixelKing','RetroGamer','NeoPlayer','CyberNinja','RoboMaster','AtomicFlux','StringTheo','Multiverse9','DimensionX','ParallelP','EntropyKing','BalanceX','Samsara99','KarmaKing','DharmaDog','TaoMaster','YinYang7','FengShui5','IChing3','Bagua8','WuXing5','TaiChi9','QiGong7','ZenGarden','BonsaiAce','Hojicha7','Genmaicha','Sencha9','Kinako7','Anko5','Yomogi3','Kuzumochi','Mitsumame','Anmitsu7','CreamAnko','ChocoCat2','VanillaF2','CaramelB2','CookieO2','Brownie2','Pudding2','FlanK2','Macaron2','Tirami2','Gelato2','Sorbet3','Nutell2','Pistac2','Chestn2','Acorn2','Cocon2','JadeW2','Amber2','Coral2','Pearl2','Opal2','Onyx2','Topaz2','Garnet2','Perido2','Quartz2','Obsidi2','Pixel2','Retro2','Neo2','Cyber2','Robo2','Atom2','String2','Multi2','Dime2','Para2','Entro2','Balan2','Samsa2','Karma2','Dharm2','Tao2','Yin2','Feng2','ICh2','Bag2','Wu2','Tai2','Qi2','Zen2','Bon2','Hoj2','Gen2','Sen2','Kin2','Ank2','Yom2','Kuz2','Mit2','Anm2','Cre2','Cho2','Van2','Car2','Coo2','Bro2','Pud2','Fla2','Mac2','Tir2','Gel2','Sor2','Nut2','Pis2','Che2','Aco2','Coc2'];
var rP=[];
function initRk(){for(var i=0;i<199;i++){var nm=NM[i%NM.length]+(i>=NM.length?Math.floor(i/NM.length):'');var rb=Math.floor(Math.random()*15);var bi=Math.pow(10,Math.random()*8+1)*(1+rb*.8);rP.push({name:nm,income:bi,rb:rb,pets:Math.floor(Math.random()*200+5),trend:(Math.random()-.5)*.02})}}
function updRk(){rP.forEach(function(p){p.income*=(1+p.trend+(Math.random()-.5)*.04);p.income=Math.max(1,p.income);if(Math.random()<.08)p.trend=(Math.random()-.5)*.02})}
function getFR(){var all=[{name:G.pn,income:tI(),rb:G.rb,pets:G.pets.length,isMe:true}];for(var i=0;i<rP.length;i++)all.push(rP[i]);all.sort(function(a,b){return b.income-a.income});return all}
function rkI(p,idx){var pos=idx+1;var pc=pos===1?'p1':pos===2?'p2':pos===3?'p3':'';return'<div class="rk-i'+(p.isMe?' me':'')+'"><div class="rk-pos '+pc+'">'+pos+'</div><div class="rk-body"><div class="rk-top"><span class="rk-n">'+esc(p.name)+(p.isMe?' <span class="rk-you">TU</span>':'')+'</span><span class="rk-rb">RB '+p.rb+'</span></div><div class="rk-bot"><span class="rk-pc">'+p.pets+' mascotas</span><span class="rk-earn">$'+fmt(p.income)+'/s</span></div></div></div>'}
function renderRk(){var all=getFR();var mi=0;for(var i=0;i<all.length;i++){if(all[i].isMe){mi=i;break}}document.getElementById('rkPos').textContent='#'+(mi+1);document.getElementById('rkMyEarn').textContent='$'+fmt(tI())+'/s';var h='';var ss=Math.max(0,mi-2),se=Math.min(all.length-1,mi+2);if(ss>3){for(var i=0;i<3;i++)h+=rkI(all[i],i);h+='<div class="rk-sep">. . .</div>'}else ss=0;if(se<all.length-4){for(var i=ss;i<=se;i++)h+=rkI(all[i],i);h+='<div class="rk-sep">. . .</div>';for(var i=all.length-3;i<all.length;i++)h+=rkI(all[i],i)}else{for(var i=ss;i<all.length;i++)h+=rkI(all[i],i)}h+='<div class="rk-total">'+all.length+' jugadores en linea</div>';document.getElementById('rkList').innerHTML=h}

// ===== LOGICA =====
function openE(sil){
    var cost=G.pr[selE];if(G.money<cost){if(!sil){snd.err();toast('Sin dinero','err')}if(G.aon){G.aon=false;updateUI()}return false}
    G.money-=cost;var sc={basico:1.15,dorado:1.2,campestre:1.12,arcano:1.22,marino:1.18,abisal:1.25,cristalino:1.2,gema:1.28,magmatico:1.22,infernal:1.3,divino:1.25,ancestral:1.32,cosmico:1.28,estelar:1.35,umbral:1.3,absoluto:1.4};
    G.pr[selE]=Math.floor(G.pr[selE]*(sc[selE]||1.15));var tpl=roll(selE);
    var np={ic:tpl.ic,n:tpl.n,r:tpl.r,be:tpl.e,lv:1,id:G.nid++,c:tpl.c,eg:tpl.eg};
    G.pets.push(np);G.tot++;if(G.disc.indexOf(tpl.n)===-1)G.disc.push(tpl.n);
    save();updateUI();refHP();if(!sil){snd.hatch(tpl.r);showH(np)}return true;
}
function showH(pet){
    hSt={pet:pet,cl:0,rev:false,bur:false};var ov=document.getElementById('overlay'),e3=document.getElementById('oegg3d'),eB=document.getElementById('egg3dBody');
    ov.style.display='flex';ov.style.cursor='pointer';e3.style.display='block';eB.style.background=E3DG[selE]||E3DG.basico;
    e3.className='egg-3d-container';document.getElementById('egg3d').className='egg-3d';
    document.getElementById('oRev').style.display='none';document.getElementById('tapHint').style.display='block';
    document.getElementById('tapProgress').style.display='flex';document.getElementById('oclose').style.display='none';document.getElementById('oclose').classList.remove('visible');
    document.getElementById('oname').textContent='';document.getElementById('orar').textContent='';document.getElementById('orar').style.color='';document.getElementById('oinfo').textContent='';
    initCC();updTP();
}
function hClick(){
    if(hSt.rev||hSt.bur)return;hSt.cl++;var n=hSt.cl,mx=CLICKS,pr=n/mx;
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
        showR3D(p);document.getElementById('oname').textContent=p.n;document.getElementById('orar').textContent=RNAME[p.r]||'';
        document.getElementById('orar').style.color=rC;document.getElementById('oinfo').textContent='+$'+fmt(pE(p))+'/s';
        setTimeout(function(){hSt.rev=true;hSt.bur=false;var cb=document.getElementById('oclose');cb.style.display='inline-block';cb.classList.add('visible')},800);
    },500);
}
function closeH(){
    if(!hSt.rev)return;document.getElementById('overlay').style.display='none';
    document.getElementById('oegg3d').style.display='none';document.getElementById('oegg3d').className='egg-3d-container';
    document.getElementById('egg3d').className='egg-3d';document.getElementById('oRev').style.display='none';
    document.getElementById('oclose').style.display='none';document.getElementById('oclose').classList.remove('visible');
    hP=[];hSt.rev=false;stopR();
}
function doUp(id){var p=null;for(var i=0;i<G.pets.length;i++){if(G.pets[i].id===id){p=G.pets[i];break}}if(!p||p.lv>=99)return;var c=uCo(p);if(G.money<c){snd.err();toast('Sin dinero','err');return}G.money-=c;p.lv++;toast(p.n+' Nv.'+p.lv,'ok');save();updateUI()}
function doSell(id){var idx=-1;for(var i=0;i<G.pets.length;i++){if(G.pets[i].id===id){idx=i;break}}if(idx===-1)return;var p=G.pets[idx],v=Math.floor(pE(p)*10);G.money+=v;G.pets.splice(idx,1);toast(p.n+' $'+fmt(v),'inf');save();updateUI();refHP()}
function doRb(){var cost=rbCo();if(rbC){clearTimeout(rbT);rbC=false;G.rb++;G.mult*=1.8;G.money=10;G.dm=10;G.pets=[];G.pr={basico:10,dorado:500,campestre:2000,arcano:20000,marino:50000,abisal:4e5,cristalino:2e6,gema:15e6,magmatico:80e6,infernal:5e8,divino:5e9,ancestral:3e10,cosmico:3e11,estelar:2e12,umbral:2e13,absoluto:2e14};snd.hatch('og');toast('REBIRTH '+G.rb+' x'+G.mult.toFixed(1),'rwd');save();updateUI();refHP()}else{if(G.money<cost){snd.err();toast('Necesitas $'+fmt(cost),'err');return}rbC=true;var b=document.getElementById('btnRb');b.innerHTML='<i class="fas fa-exclamation-triangle"></i> CONFIRMAR?';b.classList.add('yes');b.disabled=false;snd.click();rbT=setTimeout(function(){rbC=false;updateUI()},3000)}}
function hAuto(){snd.click();if(!G.ao){if(G.money<1e10){snd.err();toast('Necesitas $10B','err');return}G.money-=1e10;G.ao=true;G.aon=true;toast('Auto activado!','rwd');save();updateUI()}else{G.aon=!G.aon;toast('Auto: '+(G.aon?'ON':'OFF'),'inf');save();updateUI()}}
function buyW(wid){var w=null;for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===wid){w=WORLDS[i];break}if(!w)return;if(isUW(wid)){setW(wid);return}if(G.money<w.cost){snd.err();toast('Necesitas $'+fmt(w.cost),'err');return}G.money-=w.cost;G.uw.push(wid);snd.world();selE=w.eggs[0];setW(wid);save();updateUI();toast('Desbloqueado: '+w.name,'rwd')}
function setW(wid){if(wid===G.world)return;if(!isUW(wid)){snd.err();toast('Bloqueado','err');return}G.world=wid;var w=gW();if(w.eggs.indexOf(selE)===-1)selE=w.eggs[0];bgP=[];for(var i=0;i<60;i++)bgP.push(mkBP());apTh();refHP();document.getElementById('game').classList.add('world-flash');setTimeout(function(){document.getElementById('game').classList.remove('world-flash')},500);save();updateUI();toast('Mundo: '+w.name,'rwd')}

// ===== RENDER UI =====
function rEggs(){var w=gW(),h='';for(var i=0;i<w.eggs.length;i++){var eid=w.eggs[i];h+='<button class="egg'+(eid===selE?' on':'')+'" data-e="'+eid+'"><div class="egg-shape '+(ESCLS[eid]||'es-bas')+'"></div><span class="egg-n">'+(ENAMES[eid]||eid)+'</span><span class="egg-p">$'+fmt(G.pr[eid])+'</span></button>'}document.getElementById('navEggs').innerHTML=h}
function rWorlds(){var h='';for(var i=0;i<WORLDS.length;i++){var w=WORLDS[i],u=isUW(w.id),a=w.id===G.world;h+='<div class="wcard'+(a?' active':'')+(!u?' locked':'')+'" data-wid="'+w.id+'"><div class="wcard-hd"><span class="wcard-icon" style="color:'+w.color+'">'+w.icon+'</span><div class="wcard-info"><div class="wcard-name">'+w.name+'</div><div class="wcard-desc">'+w.desc+'</div></div></div><div class="wcard-stats"><span class="wcard-st">Bonus: <span>x'+w.bonus.toFixed(1)+'</span></span><span class="wcard-st">Coste: <span>$'+fmt(w.cost)+'</span></span></div>'+(a?'<div class="wcard-bonus">ACTIVO</div>':'')+'<div class="wcard-buy '+(u?'can':(G.money>=w.cost?'can':'no'))+'" data-bwid="'+w.id+'">'+(u?(a?'Ir alli':'Seleccionar'):'Comprar $'+fmt(w.cost))+'</div></div>'}document.getElementById('worldMap').innerHTML=h}
function rIdx(){var pct=Math.round((G.disc.length/PETS.length)*100);document.getElementById('idxPct').textContent=pct+'%';document.getElementById('idxBar').style.width=pct+'%';var s=PETS.slice().sort(function(a,b){return(RORD[a.r]||0)-(RORD[b.r]||0)});var h='';for(var i=0;i<s.length;i++){var p=s[i],d=G.disc.indexOf(p.n)!==-1;h+='<div class="ii '+p.r+(d?'':' off')+'"><span class="ic">'+(d?sphH(p,'xs'):'<div style="width:24px;height:24px;border-radius:50%;background:#333"></div>')+'</span><span class="in">'+(d?p.n:'???')+'</span><span class="ir '+p.r+'">'+(RNAME[p.r]||'')+'</span></div>'}document.getElementById('idxList').innerHTML=h}
function rPets(){var el=document.getElementById('petList');if(!G.pets.length){el.innerHTML='<div class="empty"><i class="fas fa-egg"></i><p>Abre tu primer huevo</p></div>';return}var s=G.pets.slice().sort(function(a,b){var rd=(RORD[b.r]||0)-(RORD[a.r]||0);return rd!==0?rd:pE(b)-pE(a)});var h='';for(var i=0;i<s.length;i++){var p=s[i],earn=pE(p),uc=p.lv<99?uCo(p):0;h+='<div class="pc '+p.r+'"><div class="pc-l">'+sphH(p,'sm')+'<div class="pc-t"><span class="pc-n">'+p.n+'</span><span class="pc-m">Nv.'+p.lv+' '+(RNAME[p.r]||'')+(uc?' · $'+fmt(uc):'')+'</span></div></div><div class="pc-r"><span class="pc-e">$'+fmt(earn)+'/s</span><div class="pc-a">';if(p.lv<99)h+='<button class="ab ab-u" data-act="up" data-id="'+p.id+'"><i class="fas fa-arrow-up"></i></button>';h+='<button class="ab ab-s" data-act="sell" data-id="'+p.id+'"><i class="fas fa-coins"></i></button></div></div></div>'}el.innerHTML=h}

function updateUI(){
    var diff=G.money-G.dm;if(Math.abs(diff)<1)G.dm=G.money;else G.dm+=diff*.15;
    document.getElementById('sMoney').textContent='$'+fmt(Math.round(G.dm));
    document.getElementById('sInc').textContent='$'+fmt(tI())+'/s';
    document.getElementById('sPets').textContent=G.pets.length;
    var bb=document.getElementById('btnBuy');if(G.money>=G.pr[selE]){bb.classList.add('can');bb.classList.remove('no')}else{bb.classList.remove('can');bb.classList.add('no')}
    var ba=document.getElementById('btnAuto');if(!G.ao){ba.innerHTML='<i class="fas fa-robot"></i> AUTO ($10B)';if(G.money>=1e10){ba.classList.add('can');ba.classList.remove('no','on')}else{ba.classList.add('no');ba.classList.remove('can','on')}}else{if(G.aon){ba.innerHTML='<i class="fas fa-robot"></i> AUTO: ON';ba.classList.add('on');ba.classList.remove('no','can')}else{ba.innerHTML='<i class="fas fa-robot"></i> AUTO: OFF';ba.classList.add('can');ba.classList.remove('on','no')}}
    if(!rbC){var rb=document.getElementById('btnRb');rb.innerHTML='<i class="fas fa-bolt"></i> REBIRTH ($'+fmt(rbCo())+')';rb.disabled=G.money<rbCo();rb.classList.remove('yes')}
    rPets();rEggs();if(aTab==='worlds')rWorlds();if(aTab==='rank')renderRk();if(aTab==='lu')renderLuShop();
}

function setTab(t){snd.click();aTab=t;var ps=document.querySelectorAll('.panel'),bs=document.querySelectorAll('.tab');for(var i=0;i<ps.length;i++)ps[i].classList.remove('on');for(var i=0;i<bs.length;i++)bs[i].classList.remove('on');var mp={game:'pGame',worlds:'pWorlds',index:'pIndex',rank:'pRank',lu:'pLu'};var pe=document.getElementById(mp[t]);if(pe)pe.classList.add('on');var be=document.querySelector('.tab[data-t="'+t+'"]');if(be)be.classList.add('on');if(t==='index')rIdx();if(t==='rank')renderRk();if(t==='worlds')rWorlds();if(t==='lu')renderLuShop();}

// ===== INIT =====
load();var cw=gW();if(cw.eggs.indexOf(selE)===-1)selE=cw.eggs[0];
document.getElementById('rkName').value=G.pn;
initBg();drBg();initRk();
setTimeout(function(){initH3D();initR3D();refHP()},100);
addEventListener('resize',function(){setTimeout(rsH,200)});apTh();

// ===== EVENT LISTENERS =====
document.getElementById('btnMute').addEventListener('click',function(){G.mut=!G.mut;this.innerHTML=G.mut?'<i class="fas fa-volume-xmark"></i>':'<i class="fas fa-volume-high"></i>';save()});
document.getElementById('btnReset').addEventListener('click',function(){showCf('⚠️','Reiniciar','Perderas todo.',resetG)});
document.getElementById('navTabs').addEventListener('click',function(e){var b=e.target.closest('.tab');if(b)setTab(b.dataset.t)});
document.getElementById('navEggs').addEventListener('click',function(e){var b=e.target.closest('.egg');if(b){snd.click();selE=b.dataset.e;updateUI()}});
document.getElementById('worldMap').addEventListener('click',function(e){var bb=e.target.closest('[data-bwid]');if(bb){buyW(bb.dataset.bwid);return}var cd=e.target.closest('.wcard');if(cd&&isUW(cd.dataset.wid))setW(cd.dataset.wid)});
document.getElementById('btnBuy').addEventListener('click',function(){openE(false)});
document.getElementById('btnAuto').addEventListener('click',hAuto);
document.getElementById('btnRb').addEventListener('click',doRb);
document.getElementById('overlay').addEventListener('click',function(e){if(e.target.id==='oclose'||e.target.closest('#oclose'))return;hClick()});
document.getElementById('oclose').addEventListener('click',function(e){e.stopPropagation();closeH()});
document.getElementById('petList').addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;var act=b.dataset.act,id=parseInt(b.dataset.id,10);if(act==='up')doUp(id);else if(act==='sell')doSell(id)});
document.getElementById('rkName').addEventListener('input',function(){G.pn=this.value.trim().slice(0,14)||'Mi Base';save()});
document.getElementById('confirmYes').addEventListener('click',function(){hideCf();if(cfCb)cfCb()});
document.getElementById('confirmNo').addEventListener('click',hideCf);

updateUI();

// ===== GAME LOOP =====
setInterval(function(){
    var inc=tI();if(inc>0){G.money+=inc;G.te+=inc;if(inc>=10&&Math.random()<.15)floatM(inc)}
    if(G.aon&&G.money>=G.pr[selE])openE(true);
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


// =====================================================================
// ===== INTEGRACIÓN LEVELUP (TIENDA CON MONEDAS GLOBALES) =============
// =====================================================================
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

// ---- TIENDA EQUILIBRADA (NO OP) ----
var LU_SHOP_ITEMS = [
  { id: 'money1', name: '5K Dinero', desc: 'Añade $5,000 al juego', icon: 'fa-sack-dollar', cost: 10, action: function() { G.money += 5000; save(); updateUI(); } },
  { id: 'money2', name: '100K Dinero', desc: 'Añade $100,000 al juego', icon: 'fa-money-bill-trend-up', cost: 50, action: function() { G.money += 100000; save(); updateUI(); } },
  { id: 'boost', name: 'Boost x2 (3 min)', desc: 'Duplica tus ingresos por 3 minutos', icon: 'fa-bolt', cost: 30, action: function() { activateBoost(180); } },
  { id: 'egg', name: 'Huevo LevelUp', desc: 'Mascota exclusiva Gh0st (Nivel Medio)', icon: 'fa-egg', cost: 150, action: function() { openLuEgg(); } }
];

function activateBoost(durationSec) {
  boostActive = true;
  toast('Boost 2x Activado!', 'rwd');
  updateUI();
  setTimeout(function() { 
    boostActive = false; 
    toast('Boost terminado', 'inf'); 
    updateUI(); 
  }, durationSec * 1000);
}

function openLuEgg() {
  // be: 2500 equivale a un Dios del segundo mundo. Bueno para mediados de juego, no rota el final.
  var luPet = {ic:'fa-solid fa-ghost', n:'Gh0st LU', r:'god', be:2500, lv:1, id:G.nid++, c:'#a78bfa', eg:['lu']};
  G.pets.push(luPet);
  G.tot++;
  if (G.disc.indexOf(luPet.n) === -1) G.disc.push(luPet.n);
  save(); updateUI(); refHP();
  showH(luPet); // Mostrar animación de eclosión
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
    var can = luCoins >= item.cost;
    h += '<div class="lu-item">' +
      '<div class="lu-item-icon"><i class="fas ' + item.icon + '"></i></div>' +
      '<div class="lu-item-info"><div class="lu-item-name">' + item.name + '</div><div class="lu-item-desc">' + item.desc + '</div></div>' +
      '<button class="lu-btn" data-lu="' + i + '" ' + (can?'':'disabled') + '><i class="fas fa-coins"></i> ' + item.cost + '</button>' +
      '</div>';
  }
  el.innerHTML = h;
}

async function buyWithLu(item) {
  if (!luUid) { toast('Inicia sesión en LevelUp', 'err'); return; }
  try {
    toast('Procesando compra...', 'inf');
    const result = await runTransaction(ref(fbDb, 'users/' + luUid + '/coins'), function(c) {
      if (c === null) return 0;
      if (c < item.cost) return; // Abortar si no hay suficientes monedas
      return c - item.cost;
    });
    
    if (result.committed) {
      item.action();
      toast('¡Compra exitosa!', 'ok');
    } else {
      snd.err();
      toast('Monedas LU insuficientes', 'err');
    }
  } catch (e) {
    toast('Error al procesar la compra', 'err');
    console.error(e);
  }
}

onAuthStateChanged(fbAuth, function(user) {
  if (user) {
    luUid = user.uid;
    // Escuchar cambios en las monedas en tiempo real
    onValue(ref(fbDb, 'users/' + luUid + '/coins'), function(snap) {
      luCoins = snap.val() || 0;
      var el = document.getElementById('luCoins');
      if (el) el.textContent = luCoins;
      if (aTab === 'lu') renderLuShop();
    });
  } else {
    luUid = null;
    luCoins = 0;
    var el = document.getElementById('luCoins');
    if (el) el.textContent = 'N/A';
    if (aTab === 'lu') renderLuShop();
  }
});

// Listener para los botones de compra
document.addEventListener('click', function(e) {
  var b = e.target.closest('[data-lu]');
  if (!b) return;
  var idx = parseInt(b.dataset.lu, 10);
  buyWithLu(LU_SHOP_ITEMS[idx]);
});
