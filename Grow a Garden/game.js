'use strict';
/* ===== GROW A GARDEN v2.1 · español + gráficos mejorados ===== */
const $=s=>document.querySelector(s);
const R=(a,b)=>a+Math.random()*(b-a);
const RI=(a,b)=>Math.floor(R(a,b+1));
const pick=a=>a[(Math.random()*a.length)|0];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const PI2=Math.PI*2;
function fmt(n){n=Math.round(n);if(n>=1e9)return(n/1e9).toFixed(1).replace('.',',')+'B';if(n>=1e6)return(n/1e6).toFixed(1).replace('.',',')+'M';if(n>=1e4)return(n/1e3).toFixed(1).replace('.',',')+'K';return n.toLocaleString('es-ES');}
function fmtT(s){s=Math.ceil(s);if(s>=3600)return(s/3600).toFixed(1).replace('.',',')+'h';if(s>=60){const m=(s/60)|0;return m+'m '+(s%60)+'s';}return s+'s';}
function toHSL(c){const n=parseInt(c.slice(1),16);let r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;
 const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;let h=0,s=0,l=(M+m)/2;
 if(d){s=l>.5?d/(2-M-m):d/(M+m);h=M===r?((g-b)/d+(g<b?6:0)):M===g?((b-r)/d+2):((r-g)/d+4);h*=60;}
 return[h/360,s,l];}
function fromHSL(h,s,l){s=clamp(s,0,1);l=clamp(l,0,1);
 const f=n=>{const k=(n+h*12)%12,a=s*Math.min(l,1-l);return clamp(l-a*Math.max(-1,Math.min(k-3,9-k,1)),0,1)*255;};
 return`rgb(${f(0)|0},${f(8)|0},${f(4)|0})`;}
function lite(c,a){const[h,s,l]=toHSL(c);return fromHSL(h,s,clamp(l+a,0,1));}
function colLerp(a,b,t){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);
 return`rgb(${lerp(A>>16&255,B>>16&255,t)|0},${lerp(A>>8&255,B>>8&255,t)|0},${lerp(A&255,B&255,t)|0})`;}
function tint(c,m,t){if(!m)return c;const[h,s,l]=toHSL(c);
 switch(m){case'golden':return fromHSL(46/360,Math.max(s,.85),clamp(l+.08,.35,.75));
 case'frozen':return fromHSL(205/360,Math.max(s,.55),clamp(l+.22,.4,.9));
 case'shocked':return fromHSL(56/360,Math.max(s,.95),clamp(l+.12,.5,.8));
 case'celestial':return fromHSL(275/360,Math.max(s,.75),clamp(l+.02,.2,.85));
 case'rainbow':return fromHSL(((h+t*.07)%1+1)%1,Math.max(s,.8),l);
 case'prismatic':return fromHSL(((h+t*.16)%1+1)%1,.95,clamp(l+.05,.4,.7));}return c;}
function wpick(arr,wfn){let tot=0;const ws=arr.map(a=>{const w=wfn(a);tot+=w;return w});
 let r=Math.random()*tot;for(let i=0;i<arr.length;i++){r-=ws[i];if(r<=0)return arr[i];}return arr[arr.length-1];}
const pc=x=>x.toFixed(1).replace('.',',');

/* ---------- datos ---------- */
const RARS=[['Común','#8d99a6'],['Poco común','#58b85c'],['Raro','#3f9fe8'],['Épico','#a86ae0'],['Legendario','#f2a53a'],['Mítico','#ef5d8a']];
const RAR_LV=[1,3,6,10,14,18];
const PLANTS={
carrot:{name:'Zanahoria',rar:0,seed:10,grow:20,value:25,mut:.05,kind:'root',h:34,desc:'Una raíz naranja y crujiente. Todo gran granjero empieza aquí.'},
strawberry:{name:'Fresa',rar:0,seed:25,grow:35,value:58,mut:.05,kind:'berry',h:26,col:'#e8394a',rc:5,rs:6,desc:'Bayas rojas y dulces que llenan un arbustito frondoso.'},
blueberry:{name:'Arándano',rar:0,seed:50,grow:50,value:118,mut:.05,kind:'berry',h:24,col:'#4a5cc0',rc:8,rs:3.5,desc:'Pequeños tesoros azules del bosque.'},
tomato:{name:'Tomate',rar:1,seed:80,grow:75,value:215,mut:.06,kind:'berry',h:34,col:'#ef4d3a',rc:4,rs:8,desc:'Madurado en rama y jugoso. Un clásico de la cocina.'},
corn:{name:'Maíz',rar:1,seed:140,grow:110,value:395,mut:.06,kind:'corn',h:85,desc:'Un tallo altísimo coronado de mazorcas doradas.'},
watermelon:{name:'Sandía',rar:1,seed:250,grow:170,value:725,mut:.06,kind:'melon',h:24,col:'#3e8f4e',stripe:'#2a6b39',fr:17,desc:'Pesada, rayada e infinitamente refrescante.'},
pumpkin:{name:'Calabaza',rar:2,seed:400,grow:260,value:1250,mut:.07,kind:'melon',h:26,col:'#ef8b25',stripe:'#c96a12',fr:20,desc:'La reina regordeta del otoño. Ideal para tartas.'},
apple:{name:'Manzana',rar:2,seed:650,grow:380,value:2300,mut:.07,kind:'tree',h:62,fruit:'#e0403c',leaf:'#3f8f3a',fc:5,desc:'Un manzano ordenado cargado de fruta roja.'},
coconut:{name:'Coco',rar:2,seed:1000,grow:540,value:3700,mut:.07,kind:'palm',h:74,desc:'Una palmera inclinada con sabor a trópico.'},
mango:{name:'Mango',rar:3,seed:1600,grow:750,value:5750,mut:.08,kind:'tree',h:60,fruit:'#f6a723',leaf:'#4a9d3f',fc:5,desc:'Sol de verano convertido en fruta.'},
banana:{name:'Plátano',rar:3,seed:2400,grow:1000,value:9100,mut:.08,kind:'banana',h:66,desc:'Un racimo de sol colgando de un tallo frondoso.'},
dragonfruit:{name:'Fruta del Dragón',rar:3,seed:3800,grow:1400,value:15800,mut:.09,kind:'dragon',h:52,desc:'Un cactus espinoso que guarda un tesoro rosa.'},
grape:{name:'Uva',rar:4,seed:5600,grow:1900,value:27500,mut:.09,kind:'grape',h:58,desc:'Racimos morados de un emparrado acogedor.'},
goldenapple:{name:'Manzana Dorada',rar:4,seed:9000,grow:2700,value:51000,mut:.10,kind:'tree',h:62,fruit:'#f5c542',leaf:'#8fae3f',fc:5,desc:'Dicen que brilla incluso en la oscuridad.'},
crystalflower:{name:'Flor de Cristal',rar:5,seed:16000,grow:3600,value:98000,mut:.12,kind:'crystal',h:56,desc:'Una flor de cristal puro. Impagable para coleccionistas.'}};
const MUTS={
 golden:{name:'Dorado',mult:3,w:30,col:'#f2b53a'},frozen:{name:'Congelado',mult:2,w:22,col:'#8fd8f2'},
 giant:{name:'Gigante',mult:4,w:18,col:'#c98f4e'},shocked:{name:'Electrizado',mult:4,w:14,col:'#ffe14d'},
 rainbow:{name:'Arcoíris',mult:5,w:9,col:'#7ad0f0'},celestial:{name:'Celestial',mult:8,w:4,col:'#b07df0'},
 prismatic:{name:'Prismático',mult:10,w:2,col:'#f76db5'}};
const MUT_RANK=['frozen','golden','giant','shocked','rainbow','celestial','prismatic'];
const WEATHERS={
 rain:{name:'Lluvia',dur:60,grow:1.5,icon:'i-rain',col:'#3f9fe8',desc:'Crecimiento +50%'},
 storm:{name:'Tormenta',dur:50,grow:1.2,icon:'i-bolt',col:'#ffe14d',desc:'Electrizado y Arcoíris aumentan',flats:{shocked:.08,rainbow:.015}},
 frost:{name:'Escarcha',dur:50,icon:'i-snow',col:'#8fd8f2',desc:'Congelado aumenta',flats:{frozen:.10}},
 goldenH:{name:'Hora Dorada',dur:45,icon:'i-sun',col:'#f2b53a',desc:'Dorado aumenta',flats:{golden:.10}},
 rainbowW:{name:'Clima Arcoíris',dur:45,icon:'i-rbow',col:'#7ad0f0',desc:'Arcoíris aumenta',flats:{rainbow:.04}},
 meteor:{name:'Lluvia de Meteoritos',dur:55,icon:'i-meteor',col:'#f76d6d',desc:'¡Toca los meteoritos caídos!'},
 super:{name:'Súper Crecimiento',dur:30,grow:4,icon:'i-sprout',col:'#58b85c',desc:'¡Todo crece 4x más rápido!'}};
const PETS=[
{id:'dog',name:'Perro',rar:0,cost:{c:250},ab:'sell',v:.04,desc:'Ayudante leal. +4% valor de venta.'},
{id:'cat',name:'Gato',rar:0,cost:{c:320},ab:'coins',v:.15,desc:'15% de monedas extra al cosechar.'},
{id:'bunny',name:'Conejo',rar:0,cost:{c:450},ab:'grow',v:.05,extra:'seed',desc:'+5% crecimiento. ¡A veces desentierra una semilla gratis!'},
{id:'bee',name:'Abeja',rar:1,cost:{c:1100},ab:'mut',v:.08,desc:'Suerte que zumba. +8% mutaciones.'},
{id:'butterfly',name:'Mariposa',rar:1,cost:{c:1400},ab:'grow',v:.06,desc:'Alas suaves. +6% crecimiento.'},
{id:'turtle',name:'Tortuga',rar:1,cost:{c:1800},ab:'sell',v:.10,desc:'Regateadora paciente. +10% venta.'},
{id:'fox',name:'Zorro',rar:2,cost:{g:60},ab:'mut',v:.12,desc:'Instintos astutos. +12% mutaciones.'},
{id:'panda',name:'Panda',rar:2,cost:{g:80},ab:'extra',v:.08,desc:'8% de cosechar un cultivo extra.'},
{id:'unicorn',name:'Unicornio',rar:3,cost:{g:150},ab:'fR',v:.012,also:{sell:.06},desc:'+1,2% Arcoíris · +6% venta.'},
{id:'dragon',name:'Dragón',rar:3,cost:{g:190},ab:'fG',v:.02,also:{grow:.06},desc:'+2% Dorado · +6% crecimiento.'},
{id:'phoenix',name:'Fénix Dorado',rar:4,cost:{g:400},ab:'fC',v:.01,also:{sell:.10},desc:'+1% Celestial · +10% venta.'},
{id:'rdrag',name:'Dragón Arcoíris',rar:5,cost:{g:900},ab:'fP',v:.006,also:{mut:.10},desc:'+0,6% Prismático · +10% mutaciones.'}];
const PET_STYLE={dog:{b:'#d8a05a',e:'#b57f3c'},cat:{b:'#f0d17c',e:'#cfa93f'},bunny:{b:'#f5f0ea',e:'#e0d5c8'},bee:{b:'#f2c744'},butterfly:{b:'#5a4632'},turtle:{b:'#7fc46a',s:'#8a5f3a'},fox:{b:'#e8813a'},panda:{b:'#f5f2ec'},unicorn:{b:'#f7f4ef'},dragon:{b:'#d6543f'},phoenix:{b:'#f2b53a'},rdrag:{b:'#c46be0'}};
const SEC=[{name:'Campo Sur',cost:5000,cur:'c'},{name:'Arboleda de Cristal',cost:120,cur:'g'}];
const UPN={grow:['Tijeras de Poda','+8% velocidad de crecimiento por nivel'],sell:['Contactos del Mercado','+10% valor de venta por nivel'],luck:['Fertilizante de la Suerte','+4% probabilidad de mutación por nivel']};
const UPC={grow:[500,2000,8000,30000,100000],sell:[500,2500,10000,35000,120000],luck:[1000,4000,15000,50000,160000]};
const DAILY=[{c:250},{g:5},{c:800},{g:12},{c:2500,g:5},{g:25},{c:12000,g:50,seed:'goldenapple'}];
const CONF=['#f2b53a','#ef5d8a','#58b85c','#3f9fe8','#a86ae0','#ffe14d'];

/* ---------- estado / guardado ---------- */
const KEY='grow-a-garden-save';
const PLOT_COSTS=[150,400,1000,2500];
function buildPlots(){const a=[];let ci=0;
 for(let j=0;j<6;j++)for(let i=0;i<5;i++){const sec=(j/2)|0;let u=false,cost=null;
  if(sec===0){if(j<2&&i<3)u=true;else cost=PLOT_COSTS[ci++];}
  a.push({i,j,sec,u,cost,p:null});}return a;}
function defaultState(){return{v:1,coins:100,gems:0,level:1,xp:0,sel:'carrot',
 seeds:{carrot:3},crops:{},plots:buildPlots(),pets:{},equipped:[],
 shop:{list:[],qty:{},t:0},pshop:{list:[],t:0},up:{grow:0,sell:0,luck:0},exp:[false,false],
 quests:[null,null,null],daily:{last:'',streak:0},ach:{},rebirth:0,tut:0,snd:true,ts:Date.now(),created:Date.now(),fresh:1,
 stats:{planted:0,harvests:0,earned:0,muts:0,rarest:-1,petsBought:0,rareHarv:0,night:0,playT:0,types:{}}};}
function patch(dst,src){for(const k in dst){if(src[k]===undefined)continue;
 if(dst[k]&&typeof dst[k]==='object'&&!Array.isArray(dst[k])&&src[k]&&typeof src[k]==='object')patch(dst[k],src[k]);
 else dst[k]=src[k];}}
function save(){try{S.ts=Date.now();localStorage.setItem(KEY,JSON.stringify(S));savePulse();}catch(e){}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));
 if(!d||d.v!==1||!Array.isArray(d.plots)||d.plots.length!==30)return null;
 const s=JSON.parse(JSON.stringify(defaultState()));patch(s,d);return s;}catch(e){return null;}}
function savePulse(){const p=$('#savePill');p.classList.remove('hide');clearTimeout(savePulse.t);savePulse.t=setTimeout(()=>p.classList.add('hide'),1200);}
let S=load();if(!S)S=defaultState();
let gt=S.stats.playT||0;

/* ---------- lienzo / vista ---------- */
const cv=$('#cv');let c=cv.getContext('2d');
const dpr=Math.min(window.devicePixelRatio||1,2);
const W=1280,H=720,HOR=252,DAY=240;
const view={s:1,ox:0,oy:0};
function resize(){cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;
 view.s=Math.min(innerWidth/W,innerHeight/H);
 view.ox=(innerWidth-W*view.s)/2;view.oy=(innerHeight-H*view.s)/2;}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));
const w2s=(x,y)=>({x:x*view.s+view.ox,y:y*view.s+view.oy});
const s2w=(x,y)=>({x:(x-view.ox)/view.s,y:(y-view.oy)/view.s});
const GRID={tw:104,th:52,ox:640,oy:295};
const pPos=(i,j)=>({x:GRID.ox+(i-j)*GRID.tw/2,y:GRID.oy+(i+j)*GRID.th/2});
const FC={N:{x:640,y:269},E:{x:900,y:399},S:{x:588,y:555},W:{x:328,y:425}};
const BLD={
 seed:{x:168,y:452,w:180,sign:'SEMILLAS',col:'#e86a5a',motif:'seed',panel:'seeds',arg:null},
 pet:{x:1108,y:436,w:180,sign:'MASCOTAS',col:'#8e6ae0',motif:'paw',panel:'pets',arg:null},
 sell:{x:292,y:612,w:170,sign:'VENDER',col:'#f2b53a',motif:'coin',panel:'inv',arg:'crops'},
 gard:{x:988,y:602,w:175,sign:'HUERTO',col:'#58b85c',motif:'can',panel:'garden',arg:null}};
const TREES=[{x:78,y:206,s:1.15},{x:1204,y:188,s:1},{x:52,y:664,s:1.25},{x:1236,y:652,s:1.1},{x:238,y:262,s:.8},{x:1062,y:266,s:.85}];
/* decoración generada */
const tufts=[],flowers=[],clouds=[],stars=[],ff=[],bfs=[],stones=[];
for(let i=0;i<240;i++)tufts.push({x:R(-240,W+240),y:R(HOR+22,H+70),c:pick(['#6db847','#8fd45f','#57a13c','#76c04f'])});
for(let i=0;i<46;i++){const x=R(-200,W+200),y=R(HOR+30,H+50);
 if(x>300&&x<930&&y>240&&y<580)continue;
 flowers.push({x,y,c:pick(['#f29ce0','#ffe14d','#8ad0f2','#ef8da8','#fff5f5'])});}
for(let i=0;i<6;i++)clouds.push({nx:Math.random(),y:R(.08,.5),s:R(.7,1.4),v:R(.004,.012)});
for(let i=0;i<70;i++)stars.push({x:Math.random(),y:Math.random(),p:R(0,6)});
for(let i=0;i<14;i++)ff.push({x:R(320,960),y:R(300,600),vx:R(-12,12),vy:R(-8,8),ph:R(0,6)});
for(let i=0;i<5;i++)bfs.push({x:R(320,960),y:R(280,560),vx:R(-20,20),vy:R(-12,12),ph:R(0,6),c:pick(['#f29ce0','#ffe14d','#8ad0f2'])});
const PATHS=[[640,640,292,612],[292,612,168,470],[640,640,988,602],[988,602,1108,470],[640,640,588,556]];
for(const[ax,ay,bx,by]of PATHS){const d=Math.hypot(bx-ax,by-ay),n2=Math.ceil(d/34);
 for(let i=0;i<=n2;i++)stones.push({x:lerp(ax,bx,i/n2)+R(-6,6),y:lerp(ay,by,i/n2)+R(-3,3),r:R(5,8),c:pick(['#c9c2b0','#b8b09a','#d6cfbd'])});}

/* ---------- runtime ---------- */
let weather=null,nextWeather=gt+R(35,90);
let parts=[],texts=[],rain=[],snow=[],meteors=[],craters=[];
let flash=0,boltT=0,boltPts=[],shake=0,shoot=null;
const player={x:640,y:640,tx:null,ty:null,face:1,step:0,moving:false};
let petsEnt=[],hoverP=null;
const keys={};let joyVec={x:0,y:0};

/* ---------- sonido ---------- */
const Snd={c:null,g:null,
 init(){if(this.c)return;try{const A=window.AudioContext||window.webkitAudioContext;
  this.c=new A();this.g=this.c.createGain();this.g.gain.value=.45;this.g.connect(this.c.destination);}catch(e){this.c=null;}},
 ok(){return S.snd&&this.c;},
 tone(f,d,type,v,at=0,slide=0){if(!this.ok())return;const t=this.c.currentTime+at;
  const o=this.c.createOscillator(),g=this.c.createGain();o.type=type;
  o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
  o.connect(g);g.connect(this.g);o.start(t);o.stop(t+d+.05);},
 noise(d,v,fq,at=0){if(!this.ok())return;const t=this.c.currentTime+at;
  const len=Math.max(1,this.c.sampleRate*d|0),buf=this.c.createBuffer(1,len,this.c.sampleRate),ch=buf.getChannelData(0);
  for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;
  const src=this.c.createBufferSource();src.buffer=buf;
  const f=this.c.createBiquadFilter();f.type='lowpass';f.frequency.value=fq;
  const g=this.c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
  src.connect(f);f.connect(g);g.connect(this.g);src.start(t);}};
function sfx(k){const s=Snd;if(!s.ok())return;switch(k){
 case'dig':s.noise(.14,.5,420);s.tone(95,.16,'sine',.35);break;
 case'pop':s.tone(420,.13,'triangle',.5,0,260);break;
 case'coin':s.tone(920,.08,'square',.15);s.tone(1380,.16,'square',.12,.07);break;
 case'buy':s.tone(640,.07,'triangle',.35);s.tone(960,.1,'triangle',.3,.06);break;
 case'deny':s.tone(170,.16,'sawtooth',.2,0,-70);break;
 case'click':s.tone(500,.05,'triangle',.25);break;
 case'spark':[660,880,1175,1568].forEach((f,i)=>s.tone(f,.22,'triangle',.28,i*.07));break;
 case'fanfare':[523,659,784,1047].forEach((f,i)=>s.tone(f,.25,'triangle',.33,i*.1));break;
 case'reward':[440,554,659,880].forEach((f,i)=>s.tone(f,.18,'sine',.28,i*.06));break;
 case'thunder':s.noise(1.4,.55,140);s.tone(60,.9,'sine',.28,0,-30);break;
 case'event':s.tone(392,.4,'sine',.22,0,180);s.noise(.5,.1,900);break;
 case'meteor':s.noise(.25,.4,2200);s.tone(120,.5,'sine',.4,.1,-60);break;}}

/* ---------- efectos ---------- */
function toast(msg,icn,col){const d=document.createElement('div');d.className='toast';
 d.innerHTML=(icn?`<svg class="ic"><use href="#${icn}"/></svg>`:'')+`<span>${msg}</span>`;
 if(col&&d.querySelector('.ic'))d.querySelector('.ic').style.color=col;
 $('#toasts').append(d);
 setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),320);},2700);
 while($('#toasts').children.length>4)$('#toasts').firstChild.remove();}
function spark(x,y,col,n=8,spread=1){for(let i=0;i<n;i++)
 parts.push({x,y,vx:R(-45,45)*spread,vy:R(-95,-20)*spread,g:150,life:R(.5,1),col,r:R(1.5,3.4),type:'dot'});}
function confetti(wx,wy,n=60){for(let i=0;i<n;i++)
 parts.push({x:wx,y:wy,vx:R(-170,170),vy:R(-280,-60),g:320,life:R(.8,1.7),col:pick(CONF),r:R(2.2,4),type:'conf',rot:R(0,6),vr:R(-7,7)});}
function ftext(x,y,txt,col='#fff'){texts.push({x,y,txt,col,life:1.4});}
function flyCoins(wx,wy,amt){const s=w2s(wx,wy),t=$('#coinChip').getBoundingClientRect();
 const n=clamp(Math.round(Math.log10(amt+1)),2,7);
 for(let i=0;i<n;i++){const d=document.createElement('div');d.className='fcoin';
  const sx=s.x+R(-26,26),sy=s.y+R(-26,26);
  d.style.left=sx+'px';d.style.top=sy+'px';document.body.append(d);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   d.style.transform=`translate(${t.left+t.width/2-sx}px,${t.top+t.height/2-sy}px) scale(.45)`;d.style.opacity='0';}));
  setTimeout(()=>d.remove(),720);}
 const ch=$('#coinChip');ch.classList.remove('pulse');void ch.offsetWidth;ch.classList.add('pulse');}

/* ---------- economía ---------- */
let PS={grow:0,sell:0,mut:0,coins:0,extra:0,seed:0,fR:0,fG:0,fC:0,fP:0};
function recalcPets(){PS={grow:0,sell:0,mut:0,coins:0,extra:0,seed:0,fR:0,fG:0,fC:0,fP:0};
 for(const id of S.equipped){const p=PETS.find(x=>x.id===id),o=S.pets[id];if(!p||!o)continue;
  const m=p.v*(1+.1*(o.lv-1));
  if(p.ab==='grow')PS.grow+=m;else if(p.ab==='sell')PS.sell+=m;else if(p.ab==='mut')PS.mut+=m;
  else if(p.ab==='coins')PS.coins+=m;else if(p.ab==='extra')PS.extra+=m;
  else if(p.ab==='fR')PS.fR+=m;else if(p.ab==='fG')PS.fG+=m;else if(p.ab==='fC')PS.fC+=m;else if(p.ab==='fP')PS.fP+=m;
  if(p.extra==='seed')PS.seed=Math.max(PS.seed,m*.8);
  if(p.also)for(const k in p.also)PS[k]=(PS[k]||0)+p.also[k];}}
const sellMult=()=>1+PS.sell+S.up.sell*.10+S.rebirth*.15;
const growMult=()=>1+PS.grow+S.up.grow*.08+S.rebirth*.30;
const luckMult=()=>1+PS.mut+S.up.luck*.04+S.rebirth*.08;
function cropValue(k,m){return Math.round(PLANTS[k].value*(m?MUTS[m].mult:1)*sellMult());}
const xpNeed=lv=>Math.round(60*Math.pow(lv,1.55));
function gainXP(n){S.xp+=n;let lev=false;
 while(S.xp>=xpNeed(S.level)){S.xp-=xpNeed(S.level);S.level++;S.gems+=3;lev=true;
  toast(`¡Subiste de nivel! Ahora eres nivel ${S.level} (+3 gemas)`,'i-star','#f2a53a');
  const tier=RAR_LV.indexOf(S.level);if(tier>=0)toast(`¡Nueva rareza desbloqueada: ${RARS[tier][0]}!`,'i-sprout','#58b85c');}
 if(lev){sfx('fanfare');confetti(player.x,player.y-60);updateHUD();checkAch();}}
function updateHUD(){$('#hCoins').textContent=fmt(S.coins);$('#hGems').textContent=fmt(S.gems);
 $('#hLvl').textContent='Nv '+S.level;
 $('#xpFill').style.width=clamp(S.xp/xpNeed(S.level)*100,0,100)+'%';}

/* ---------- mutaciones ---------- */
function rollMut(k){const P=PLANTS[k];
 let p=Math.min(P.mut*luckMult()*(weather?1.3:1),.6);
 const flats={};
 if(weather){const w=WEATHERS[weather.type].flats;if(w)for(const key in w)flats[key]=(flats[key]||0)+w[key];}
 flats.rainbow=(flats.rainbow||0)+PS.fR;flats.golden=(flats.golden||0)+PS.fG;
 flats.celestial=(flats.celestial||0)+PS.fC;flats.prismatic=(flats.prismatic||0)+PS.fP;
 let m=null,best=0;
 for(const key in flats){if(Math.random()<Math.min(flats[key],.5)&&MUTS[key].mult>best){m=key;best=MUTS[key].mult;}}
 if(!m&&Math.random()<p){let tot=0;for(const key in MUTS)tot+=MUTS[key].w;
  let r=Math.random()*tot;
  for(const key in MUTS){r-=MUTS[key].w;if(r<=0){m=key;break;}}}
 return m;}
function mutationFound(plot,m){const M=MUTS[m],P=PLANTS[plot.p.k];
 S.stats.muts++;const idx=MUT_RANK.indexOf(m);if(idx>S.stats.rarest)S.stats.rarest=idx;
 const{x,y}=pPos(plot.i,plot.j);
 ftext(x,y-60,M.name+'!',M.col);spark(x,y-30,M.col,16,1.2);sfx('spark');
 if(M.mult>=5)confetti(x,y-30,40);
 toast(`¡${P.name} mutó: ${M.name}! (x${M.mult} valor)`,'i-star',M.col);
 bumpQuests();checkAch();}

/* ---------- cultivo ---------- */
function plantSeed(p){const k=S.sel;
 if(!k||!(S.seeds[k]>0)){toast('Selecciona una semilla primero — ¡visita la tienda!','i-sprout');return;}
 const P=PLANTS[k];S.seeds[k]--;
 p.p={k,pr:0,dur:P.grow,mut:null,rolled:false};
 S.stats.planted++;gainXP(2);sfx('dig');
 const{x,y}=pPos(p.i,p.j);spark(x,y-6,'#8a5a33',8,.7);
 updateHotbar();checkAch();}
function harvest(p){const pl=p.p,P=PLANTS[pl.k],{x,y}=pPos(p.i,p.j);
 let qty=1;if(Math.random()<PS.extra){qty++;ftext(x,y-60,'¡Cultivo extra!','#8ee063');}
 const ck=pl.k+'|'+(pl.mut||'');
 S.crops[ck]=(S.crops[ck]||0)+qty;
 S.stats.harvests++;S.stats.types[pl.k]=(S.stats.types[pl.k]||0)+qty;
 if(P.rar>=2)S.stats.rareHarv+=qty;
 if(dayPhase()>.58&&dayPhase()<.97)S.stats.night=1;
 gainXP(6+Math.round(P.value/25));
 if(Math.random()<PS.coins){const b=Math.round(cropValue(pl.k,pl.mut)*.2);
  S.coins+=b;S.stats.earned+=b;ftext(x,y-70,'+'+fmt(b),'#f2c14e');updateHUD();}
 if(Math.random()<PS.seed){S.seeds[pl.k]=(S.seeds[pl.k]||0)+1;
  toast(`¡Tu Conejo desenterró una semilla gratis de ${P.name}!`,'i-sprout','#58b85c');updateHotbar();}
 p.p=null;sfx('pop');spark(x,y-24,'#a8e063',12);
 ftext(x,y-46,`+${qty} ${P.name}`,'#ffffff');
 petXP(4);bumpQuests();checkAch();updateHUD();}
function plotClick(p){
 if(p.p){if(p.p.pr>=1)harvest(p);
  else{const rem=Math.ceil((1-p.p.pr)*p.p.dur/growMult());
   toast(`${PLANTS[p.p.k].name}: ${Math.floor(p.p.pr*100)}% crecido — quedan unos ${fmtT(rem)}`,'i-sprout');}
  return;}
 if(!p.u){
  if(p.sec>0&&!S.exp[p.sec-1]){toast('Zona bloqueada — ¡amplía tu huerto en la tienda del Huerto!','i-lock');openPanel('garden');}
  else if(p.cost!=null)buyPlot(S.plots.indexOf(p));
  return;}
 if(!S.sel||!(S.seeds[S.sel]>0)){toast('Selecciona una semilla primero — ¡visita la tienda!','i-sprout');return;}
 plantSeed(p);}
function updateGrowth(dt,offline){
 let gm=growMult();if(weather&&!offline)gm*=WEATHERS[weather.type].grow||1;
 for(const p of S.plots){const pl=p.p;if(!pl||pl.pr>=1)continue;
  pl.pr+=dt*(offline?1:gm)/pl.dur;
  if(pl.pr>=1){pl.pr=1;
   if(!pl.rolled){pl.rolled=true;pl.mut=rollMut(pl.k);if(pl.mut)mutationFound(p,pl.mut);}
   bumpQuests();checkAch();}}}
function sellCrops(k,m,qty){const key=k+'|'+(m||''),have=S.crops[key]||0;
 const n=Math.min(qty,have);if(n<=0)return 0;
 const total=n*cropValue(k,m);S.crops[key]-=n;if(S.crops[key]<=0)delete S.crops[key];
 S.coins+=total;S.stats.earned+=total;
 flyCoins(player.x,player.y-40,total);sfx('coin');
 toast(`Vendiste ${n} ${PLANTS[k].name}${m?' ('+MUTS[m].name+')':''} por ${fmt(total)} monedas`,'i-coin');
 bumpQuests();checkAch();updateHUD();renderPanel();return total;}

/* ---------- mascotas ---------- */
function petXP(n){let up=false;
 for(const id of S.equipped){const o=S.pets[id];if(!o)continue;o.xp+=n;
  while(o.xp>=20*o.lv&&o.lv<10){o.xp-=20*o.lv;o.lv++;up=true;
   toast(`¡${PETS.find(x=>x.id===id).name} alcanzó el nivel ${o.lv}!`,'i-paw');}}
 if(up){recalcPets();sfx('reward');renderPanel();}}
function toggleEquip(id){if(!S.pets[id])return;
 const i=S.equipped.indexOf(id);
 if(i>=0)S.equipped.splice(i,1);
 else{if(S.equipped.length>=3){toast('Solo puedes equipar 3 mascotas a la vez.','i-paw');return;}
  S.equipped.push(id);}
 recalcPets();syncPetEnts();sfx('click');}
function buyPet(id){const p=PETS.find(x=>x.id===id);if(!p||S.pets[id])return;
 if(p.cost.c?S.coins<p.cost.c:S.gems<p.cost.g){sfx('deny');
  return toast('No tienes suficientes '+(p.cost.c?'monedas':'gemas'),p.cost.c?'i-coin':'i-gem');}
 if(p.cost.c)S.coins-=p.cost.c;else S.gems-=p.cost.g;
 S.pets[id]={lv:1,xp:0};S.stats.petsBought++;
 sfx('fanfare');confetti(player.x,player.y-40);
 toast(`¡Adoptaste a ${p.name}! Ya puedes equiparlo en tu Bolsa.`,'i-paw');
 bumpQuests();checkAch();updateHUD();renderPanel();save();}
function syncPetEnts(){petsEnt=S.equipped.map((id,i)=>
 (petsEnt[i]&&petsEnt[i].id===id)?petsEnt[i]:{id,x:player.x-i*30,y:player.y+10});}
function petAbilityText(p,lv){const m=p.v*(1+.1*(lv-1)),v=pc(m*100);
 const main={sell:`+${v}% valor de venta`,grow:`+${v}% crecimiento`,mut:`+${v}% mutaciones`,
  coins:`${v}% monedas extra`,extra:`${v}% cultivo extra`,seed:`${v}% semillas gratis`,
  fR:`+${v}% Arcoíris`,fG:`+${v}% Dorado`,fC:`+${v}% Celestial`,fP:`+${v}% Prismático`}[p.ab];
 let s=main;
 if(p.extra==='seed')s+=' · desentierra semillas';
 if(p.also)for(const k in p.also)s+=` · +${Math.round(p.also[k]*100)}% ${k==='grow'?'crecimiento':k==='sell'?'venta':'mutaciones'}`;
 return s;}

/* ---------- misiones / logros / diario ---------- */
function questBase(q){switch(q.k){case'harvests':return S.stats.harvests;
 case'plant':return S.stats.types[q.plant]||0;case'earn':return S.stats.earned;
 case'muts':return S.stats.muts;case'pets':return S.stats.petsBought;
 case'rare':return S.stats.rareHarv;}return 0;}
function questProg(q){return clamp(questBase(q)-q.base,0,q.n);}
function genQuest(){const lv=S.level,t=RI(0,5),q={claimed:false};
 const elig=Object.keys(PLANTS).filter(k=>RAR_LV[PLANTS[k].rar]<=lv);
 switch(t){
 case 0:{const n=RI(10,16)+lv*2;q.k='harvests';q.n=n;q.txt=`Cosecha ${n} cultivos`;q.rew={c:150+lv*60,xp:40+lv*8};break;}
 case 1:{const k=pick(elig),n=RI(5,9)+(lv>8?3:0);q.k='plant';q.plant=k;q.n=n;
  q.txt=`Cosecha ${n} ${PLANTS[k].name}`;q.rew={c:Math.round(PLANTS[k].value*n*1.6)+40,xp:50};break;}
 case 2:{const n=Math.round((400+lv*220)*R(.8,1.3));q.k='earn';q.n=n;
  q.txt=`Vende cultivos por ${fmt(n)} monedas`;q.rew={c:Math.round(n*.5),g:RI(2,4),xp:60};break;}
 case 3:{q.k='muts';q.n=lv>6?2:1;q.txt=q.n===1?'Descubre una mutación':`Descubre ${q.n} mutaciones`;q.rew={g:RI(4,8),xp:60};break;}
 case 4:{q.k='pets';q.n=1;q.txt='Compra una mascota en la tienda';q.rew={g:RI(5,9),xp:40};break;}
 case 5:{const n=RI(2,4)+(lv>10?2:0);q.k='rare';q.n=n;
  q.txt=`Cosecha ${n} cultivos Raros o mejores`;q.rew={g:RI(6,10),c:lv*80,xp:70};break;}}
 q.base=questBase(q);return q;}
function ensureQuests(){for(let i=0;i<3;i++){if(S.quests[i])continue;
 let q,tr=0;do{q=genQuest();tr++;}while(tr<8&&S.quests.some(x=>x&&x.k===q.k&&x.plant===q.plant));
 S.quests[i]=q;}}
function bumpQuests(){let ch=false;
 for(const q of S.quests){if(q&&!q.done&&questProg(q)>=q.n){q.done=true;ch=true;
  toast('Misión completada: '+q.txt,'i-check','#58b85c');}}
 if(ch)sfx('coin');}
function claimQuest(i){const q=S.quests[i];if(!q||!q.done)return;
 if(q.rew.c)S.coins+=q.rew.c;if(q.rew.g)S.gems+=q.rew.g;if(q.rew.xp)gainXP(q.rew.xp);
 sfx('reward');confetti(player.x,player.y-40,40);
 toast(`¡Recompensa de misión${q.rew.c?' +'+fmt(q.rew.c)+' monedas':''}${q.rew.g?' +'+q.rew.g+' gemas':''}!`,'i-check');
 S.quests[i]=genQuest();updateHUD();renderPanel();save();}
const ACH=[
 {id:'sprout',name:'Primer brote',txt:'Planta tu primera semilla',g:2,c:s=>s.stats.planted>=1},
 {id:'green',name:'Manos verdes',txt:'Cosecha 100 cultivos',g:8,c:s=>s.stats.harvests>=100},
 {id:'harv1k',name:'Festival de cosecha',txt:'Cosecha 1.000 cultivos',g:20,c:s=>s.stats.harvests>=1000},
 {id:'mut1',name:'Golpe de suerte',txt:'Descubre tu primera mutación',g:3,c:s=>s.stats.muts>=1},
 {id:'mut10',name:'Cazador de mutaciones',txt:'Descubre 10 mutaciones',g:10,c:s=>s.stats.muts>=10},
 {id:'celestial',name:'Tocado por las estrellas',txt:'Encuentra una mutación Celestial',g:20,c:s=>s.stats.rarest>=5},
 {id:'prism',name:'¡Prismático!',txt:'Encuentra una mutación Prismática',g:50,c:s=>s.stats.rarest>=6},
 {id:'zoo',name:'Coleccionista',txt:'Ten 6 mascotas distintas',g:15,c:s=>Object.keys(s.pets).length>=6},
 {id:'zoo12',name:'Cuidador del zoológico',txt:'Ten todas las mascotas',g:60,c:s=>Object.keys(s.pets).length>=12},
 {id:'land',name:'Granja completa',txt:'Desbloquea todas las parcelas',g:30,c:s=>s.plots.every(p=>p.u)},
 {id:'rich',name:'Magnate',txt:'Gana 100.000 monedas en total',g:15,c:s=>s.stats.earned>=1e5},
 {id:'rich2',name:'Millonario',txt:'Gana 1.000.000 de monedas en total',g:40,c:s=>s.stats.earned>=1e6},
 {id:'lv15',name:'Granjero experto',txt:'Alcanza el nivel 15',g:10,c:s=>s.level>=15},
 {id:'mythic',name:'Agricultor mítico',txt:'Cosecha una planta Mítica',g:25,c:s=>Object.keys(s.stats.types).some(k=>PLANTS[k].rar===5)},
 {id:'variety',name:'Gran variedad',txt:'Cosecha 10 tipos de cultivo',g:10,c:s=>Object.keys(s.stats.types).length>=10},
 {id:'reborn',name:'Renacido',txt:'Haz tu primer renacimiento',g:20,c:s=>s.rebirth>=1},
 {id:'night',name:'Búho nocturno',txt:'Cosecha un cultivo de noche',g:5,c:s=>s.stats.night>=1}];
function checkAch(){for(const a of ACH){if(S.ach[a.id])continue;
 let ok=false;try{ok=a.c(S);}catch(e){}
 if(ok){S.ach[a.id]=true;S.gems+=a.g;sfx('reward');
  toast(`Logro: ${a.name} (+${a.g} gemas)`,'i-book','#a86ae0');updateHUD();}}}
function claimDaily(){const today=new Date().toDateString();
 if(S.daily.last===today){toast('Ya reclamaste hoy — ¡vuelve mañana!','i-cal');return;}
 const y=new Date(Date.now()-864e5).toDateString();
 S.daily.streak=S.daily.last===y?S.daily.streak+1:1;
 const d=DAILY[(S.daily.streak-1)%7];S.daily.last=today;
 if(d.c)S.coins+=d.c;if(d.g)S.gems+=d.g;
 if(d.seed){S.seeds[d.seed]=(S.seeds[d.seed]||0)+1;updateHotbar();}
 sfx('reward');confetti(player.x,player.y-40,50);
 toast(`¡Recompensa diaria${d.c?' +'+fmt(d.c)+' monedas':''}${d.g?' +'+d.g+' gemas':''}${d.seed?' + una semilla de '+PLANTS[d.seed].name:''}!`,'i-cal');
 updateHUD();renderPanel();save();}

/* ---------- tiendas ---------- */
function refreshShop(force,silent){
 if(!force&&S.shop.list.length&&gt<S.shop.t)return;
 const elig=Object.keys(PLANTS).filter(k=>RAR_LV[PLANTS[k].rar]<=S.level);
 const list=[];
 if(elig.length){
  elig.filter(k=>PLANTS[k].rar===0).forEach(k=>list.push(k));
  const rest=elig.filter(k=>PLANTS[k].rar>0);
  while(list.length<8&&rest.length){const k=wpick(rest,k2=>1/(1+PLANTS[k2].rar*1.2));
   list.push(k);rest.splice(rest.indexOf(k),1);}}
 const qty={};for(const k of list)if(PLANTS[k].rar>=2)qty[k]=PLANTS[k].rar>=4?1:RI(1,3);
 S.shop={list,qty,t:gt+180};
 if(!silent){toast('¡La tienda de semillas se ha reabastecido!','i-sprout');renderPanel();}}
function refreshPShop(force,silent){
 if(!force&&S.pshop.list.length&&gt<S.pshop.t)return;
 const pool=PETS.filter(p=>!S.pets[p.id]||Math.random()<.25).slice();
 const list=[];
 while(list.length<6&&pool.length){const p=wpick(pool,x=>1/(1+x.rar*1.2));
  list.push(p.id);pool.splice(pool.indexOf(p),1);}
 for(const p of PETS)if(list.length<6&&!list.includes(p.id))list.push(p.id);
 S.pshop={list,t:gt+240};
 if(!silent){toast('¡La tienda de mascotas tiene novedades!','i-paw');renderPanel();}}
function buySeed(k){const P=PLANTS[k];
 if(RAR_LV[P.rar]>S.level){toast('Bloqueada — alcanza el nivel '+RAR_LV[P.rar],'i-lock');return;}
 if(!S.shop.list.includes(k)){toast('Sin stock — espera el reabastecimiento','i-bag');return;}
 const q=S.shop.qty[k];
 if(q!==undefined&&q<=0){toast('Agotada — espera el reabastecimiento','i-bag');return;}
 if(S.coins<P.seed){sfx('deny');return toast('No tienes suficientes monedas','i-coin');}
 S.coins-=P.seed;S.seeds[k]=(S.seeds[k]||0)+1;
 if(q!==undefined)S.shop.qty[k]--;
 sfx('buy');updateHUD();updateHotbar();renderPanel();}

/* ---------- huerto / mejoras / renacer ---------- */
function buyPlot(i){const p=S.plots[i];if(!p||p.u||p.cost==null)return;
 if(p.sec>0&&!S.exp[p.sec-1])return toast('¡Desbloquea esta zona primero!','i-lock');
 if(S.coins<p.cost){sfx('deny');return toast('No tienes suficientes monedas','i-coin');}
 S.coins-=p.cost;p.u=true;sfx('buy');
 const{x,y}=pPos(p.i,p.j);spark(x,y-10,'#a8e063',14);ftext(x,y-40,'- '+fmt(p.cost),'#f2c14e');
 toast('¡Nueva parcela desbloqueada!','i-fence');updateHUD();checkAch();renderPanel();save();}
function buySection(n){const d=SEC[n];if(S.exp[n])return;
 const afford=d.cur==='c'?S.coins>=d.cost:S.gems>=d.cost;
 if(!afford){sfx('deny');return toast('No tienes suficientes '+(d.cur==='c'?'monedas':'gemas'),d.cur==='c'?'i-coin':'i-gem');}
 if(d.cur==='c')S.coins-=d.cost;else S.gems-=d.cost;
 S.exp[n]=true;for(const p of S.plots)if(p.sec===n+1)p.u=true;
 sfx('fanfare');confetti(640,480,80);
 toast(`¡${d.name} desbloqueada — 10 parcelas nuevas!`,'i-fence');
 updateHUD();checkAch();renderPanel();save();}
function buyUpgrade(k){const lv=S.up[k];if(lv>=5)return toast('¡Ya está al máximo!','i-check');
 const cost=UPC[k][lv];
 if(S.coins<cost){sfx('deny');return toast('No tienes suficientes monedas','i-coin');}
 S.coins-=cost;S.up[k]++;sfx('buy');
 toast(`¡${UPN[k][0]} mejorado al nivel ${S.up[k]}!`,'i-fence');
 updateHUD();renderPanel();save();}
function tryRebirth(){if(S.level<12)return toast('El renacer se desbloquea al nivel 12.','i-book');
 confirmBox('¿Renacer?',
  `Se reinician monedas, cultivos, semillas, parcelas, mejoras y tu nivel — conservas mascotas, logros, recompensas diarias y estadísticas. Cada renacer da permanentemente: +30% crecimiento, +15% venta y +8% suerte de mutación. Renacimientos actuales: ${S.rebirth}.`,
  ()=>{const keep={pets:S.pets,equipped:S.equipped,ach:S.ach,daily:S.daily,stats:S.stats,
    rebirth:S.rebirth+1,tut:1,snd:S.snd,created:S.created};
   S=JSON.parse(JSON.stringify(defaultState()));
   Object.assign(S,keep);delete S.fresh;
   S.quests=[null,null,null];ensureQuests();
   weather=null;$('#wBanner').classList.add('hide');nextWeather=gt+R(50,110);
   recalcPets();syncPetEnts();updateHotbar();updateHUD();
   refreshShop(true,true);refreshPShop(true,true);
   confetti(640,420,90);sfx('fanfare');
   toast(`¡Renacimiento ${S.rebirth}! Tus bonos permanentes son más fuertes.`,'i-book');
   closePanel();save();});}

/* ---------- clima ---------- */
function startWeather(){
 const pool=[['rain',26],['storm',12],['frost',10],['goldenH',12],['rainbowW',9],['meteor',7],['super',7]];
 let tot=pool.reduce((a,p)=>a+p[1],0),r=Math.random()*tot,type='rain';
 for(const p of pool){r-=p[1];if(r<=0){type=p[0];break;}}
 const w=WEATHERS[type];
 weather={type,end:gt+w.dur,nextM:gt+1.5,nextBolt:gt+2};
 const el=$('#wBanner');el.classList.remove('hide');
 el.style.setProperty('--wc',w.col);
 $('#wName').textContent=w.name;$('#wDesc').textContent=w.desc;
 $('#wIconUse').setAttribute('href','#'+w.icon);
 toast(`¡${w.name}! ${w.desc}`,w.icon,w.col);
 sfx(type==='storm'||type==='meteor'?'thunder':'event');
 const chh=cv.height/dpr,cw=cv.width/dpr;
 if(type==='rain'||type==='storm'){rain=[];for(let i=0;i<(type==='storm'?150:105);i++)
  rain.push({x:R(0,cw),y:R(0,chh),v:R(560,760)});}
 if(type==='frost'){snow=[];for(let i=0;i<95;i++)
  snow.push({x:R(0,cw),y:R(0,chh),v:R(35,80),p:R(0,6)});}}
function craterReward(){const rw={c:Math.round(80+S.level*25*R(.8,1.6))};
 if(Math.random()<.22)rw.g=RI(1,5);
 if(Math.random()<.06){const elig=Object.keys(PLANTS).filter(k=>PLANTS[k].rar>=2&&PLANTS[k].rar<=4);
  if(elig.length)rw.seed=pick(elig);}
 return rw;}
function spawnMeteor(){meteors.push({x:R(90,1190),y:-70,vx:R(-40,40),vy:R(320,400),ty:R(490,680)});}
function updateMeteors(dt){
 for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];
  m.x+=m.vx*dt;m.y+=m.vy*dt;
  parts.push({x:m.x+R(-4,4),y:m.y-R(10,26),vx:R(-15,15),vy:R(-10,25),g:0,life:.45,
   col:pick(['#ffb347','#ff7d5a','#ffe14d']),r:R(1.5,3),type:'dot'});
  if(m.y>=m.ty){meteors.splice(i,1);shake=8;sfx('meteor');
   spark(m.x,m.ty,'#ff9d5a',24,1.7);
   craters.push({x:m.x,y:m.ty,life:14,rw:craterReward()});}}
 for(let i=craters.length-1;i>=0;i--){craters[i].life-=dt;if(craters[i].life<=0)craters.splice(i,1);}}
function collectCrater(cr){const rw=cr.rw;
 if(rw.c){S.coins+=rw.c;S.stats.earned+=rw.c;}
 if(rw.g)S.gems+=rw.g;
 if(rw.seed){S.seeds[rw.seed]=(S.seeds[rw.seed]||0)+1;updateHotbar();}
 flyCoins(cr.x,cr.y,rw.c||0);sfx('reward');spark(cr.x,cr.y-12,'#ffe14d',18,1.4);
 toast(`Recompensa del meteorito: +${fmt(rw.c)} monedas${rw.g?' +'+rw.g+' gemas':''}${rw.seed?' + una semilla de '+PLANTS[rw.seed].name+'!':''}`,'i-meteor','#ff9d5a');
 craters.splice(craters.indexOf(cr),1);updateHUD();save();}
function updateWeather(dt){
 if(weather){const w=WEATHERS[weather.type];
  if(gt>=weather.end){toast(`${w.name} ha terminado.`,w.icon);weather=null;
   $('#wBanner').classList.add('hide');nextWeather=gt+R(70,150);}
  else{$('#wFill').style.width=(clamp((weather.end-gt)/w.dur,0,1)*100)+'%';
   $('#wTime').textContent=Math.ceil(weather.end-gt)+'s';
   if(weather.type==='meteor'&&gt>weather.nextM){spawnMeteor();weather.nextM=gt+R(1.2,2.8);}
   if(weather.type==='storm'&&gt>weather.nextBolt){weather.nextBolt=gt+R(2.5,6);
    flash=1;boltT=.22;boltPts=[];
    let bx=R(250,1030),by=26;boltPts.push([bx,by]);const gy=R(340,470);
    while(by<gy){bx+=R(-34,34);by+=R(28,48);boltPts.push([bx,by]);}
    setTimeout(()=>sfx('thunder'),120);}
   const ty=weather.type;
   if((ty==='super'||ty==='goldenH'||ty==='frost')&&Math.random()<.4){
    const px=R(360,920),py=R(300,560);
    parts.push({x:px,y:py,vx:R(-8,8),vy:ty==='frost'?R(6,22):R(-26,-8),g:0,life:R(.6,1.2),
     col:ty==='super'?'#8ee063':ty==='goldenH'?'#ffd27a':'#dff2ff',r:R(1.2,2.4),type:'dot'});}}}
 else if(gt>=nextWeather)startWeather();
 if(gt>=S.shop.t)refreshShop(false,!S.shop.list.length);
 if(gt>=S.pshop.t)refreshPShop(false,!S.pshop.list.length);}

/* =========================================================
   RENDERIZADO
   ========================================================= */
function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();
 c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);
 c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function blob(x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,PI2);}
function leaf(x,y,l,a,col){c.save();c.translate(x,y);c.rotate(a);
 c.fillStyle=col;c.beginPath();c.moveTo(0,0);
 c.quadraticCurveTo(l*.5,-l*.36,l,0);c.quadraticCurveTo(l*.5,l*.36,0,0);c.fill();c.restore();}
const dPath=(x,y)=>{c.beginPath();c.moveTo(x,y-26);c.lineTo(x+52,y);c.lineTo(x,y+26);c.lineTo(x-52,y);c.closePath();};
function quadPath(){c.beginPath();c.moveTo(FC.N.x,FC.N.y);c.lineTo(FC.E.x,FC.E.y);c.lineTo(FC.S.x,FC.S.y);c.lineTo(FC.W.x,FC.W.y);c.closePath();}
const dayPhase=()=>(gt%DAY)/DAY;
function nightAmt(ph){if(ph>.55&&ph<=.62)return(ph-.55)/.07;
 if(ph>.62&&ph<.93)return 1;if(ph>=.93&&ph<1)return(1-ph)/.07;return 0;}
const SKYK=[[0,'#2a2f5e','#c96a4f'],[.08,'#7db8e8','#ffd9a8'],[.35,'#6fc0f0','#cdeefb'],
 [.5,'#5aa9e8','#ffcf9a'],[.58,'#3f3a70','#e2734f'],[.66,'#101430','#2c3a66'],
 [.92,'#101430','#2c3a66'],[1,'#2a2f5e','#c96a4f']];
function skyCols(ph){let i=0;while(i<SKYK.length-2&&ph>SKYK[i+1][0])i++;
 const t=clamp((ph-SKYK[i][0])/(SKYK[i+1][0]-SKYK[i][0]||1),0,1);
 return[colLerp(SKYK[i][1],SKYK[i+1][1],t),colLerp(SKYK[i][2],SKYK[i+1][2],t)];}
function drawCloud2(x,y,s,col,shade){
 c.fillStyle=shade;blob(x,y+2*s,27*s,7*s);c.fill();
 c.fillStyle=col;c.beginPath();
 c.arc(x,y-10*s,17*s,0,PI2);c.arc(x-17*s,y-3*s,12*s,0,PI2);
 c.arc(x+17*s,y-3*s,13*s,0,PI2);c.arc(x+2*s,y-1*s,14*s,0,PI2);c.fill();}
function drawRange(y,sc,col,off){
 const cw=cv.width/dpr;c.fillStyle=col;c.beginPath();c.moveTo(-60,y);
 for(let x=-60;x<=cw+60;x+=55){
  const h=Math.sin((x+off)*.011)*24+Math.sin((x+off)*.037)*13;
  c.lineTo(x,y-Math.max(6,(30+h))*sc);}
 c.lineTo(cw+60,y);c.closePath();c.fill();}
function drawSky(t){const cw=cv.width/dpr,chh=cv.height/dpr;
 const ph=dayPhase(),[top,bot]=skyCols(ph),n=nightAmt(ph);
 const horS=w2s(0,HOR).y;
 const g=c.createLinearGradient(0,0,0,Math.max(horS,10));
 g.addColorStop(0,top);g.addColorStop(.72,colLerp(top,bot,.5));g.addColorStop(1,bot);
 c.fillStyle=g;c.fillRect(0,0,cw,chh);
 if(n>0){for(const st of stars){c.globalAlpha=n*(.4+.6*Math.abs(Math.sin(t*2+st.p)));
   c.fillStyle='#fff8e0';c.fillRect(st.x*cw,st.y*horS*.9,1.7,1.7);}c.globalAlpha=1;
  if(shoot){c.strokeStyle=`rgba(255,255,230,${clamp(shoot.life,0,1)})`;c.lineWidth=2;c.lineCap='round';
   c.beginPath();c.moveTo(shoot.x*cw,shoot.y*chh);
   c.lineTo(shoot.x*cw-shoot.vx*cw*.07,shoot.y*chh-shoot.vy*chh*.07);c.stroke();}}
 if(ph<.58){const pr2=ph/.58,sx=lerp(90,cw-90,pr2),sy=horS-Math.sin(pr2*Math.PI)*(horS-60);
  c.save();c.translate(sx,sy);c.rotate(t*.05);
  c.fillStyle='rgba(255,240,170,.06)';
  for(let i=0;i<9;i++){c.rotate(PI2/9);
   c.beginPath();c.moveTo(0,0);c.lineTo(85*view.s,-14*view.s);c.lineTo(85*view.s,14*view.s);c.closePath();c.fill();}
  c.restore();
  const rg=c.createRadialGradient(sx,sy,6,sx,sy,75*view.s);
  rg.addColorStop(0,'rgba(255,236,160,.9)');rg.addColorStop(1,'rgba(255,220,120,0)');
  c.fillStyle=rg;blob(sx,sy,75*view.s,75*view.s);c.fill();
  c.fillStyle='#ffe9a0';blob(sx,sy,26*view.s,26*view.s);c.fill();}
 else{const pr2=(ph-.58)/.42,mx=lerp(90,cw-90,pr2),my=horS-Math.sin(pr2*Math.PI)*(horS-70);
  const rg=c.createRadialGradient(mx,my,4,mx,my,55*view.s);
  rg.addColorStop(0,'rgba(200,215,255,.5)');rg.addColorStop(1,'rgba(200,215,255,0)');
  c.fillStyle=rg;blob(mx,my,55*view.s,55*view.s);c.fill();
  c.fillStyle='#f4f2e2';c.beginPath();c.arc(mx,my,18*view.s,0,PI2);c.arc(mx+7*view.s,my-4*view.s,15*view.s,0,PI2,true);c.fill('evenodd');
  c.fillStyle='rgba(180,185,200,.5)';blob(mx-6*view.s,my+4*view.s,3*view.s,3*view.s);c.fill();blob(mx+2*view.s,my-8*view.s,2.2*view.s,2.2*view.s);c.fill();}
 for(const cl of clouds)drawCloud2(cl.nx*cw,cl.y*horS,cl.s*(cw/1280+.3),colLerp('#ffffff','#3a4066',n),colLerp('rgba(190,205,225,.5)','#232a44',n));
 drawRange(horS,view.s*.8,colLerp('#9fb8b2','#232c48',n),120);
 c.globalAlpha=.16;c.fillStyle=colLerp('#ffffff','#0e1430',n);
 c.fillRect(0,horS-18*view.s,cw,18*view.s);c.globalAlpha=1;
 drawRange(horS,view.s,colLerp('#7d9a84','#1c2740',n),640);
 c.fillStyle=colLerp('#8fd460','#20304e',n);
 let hx=w2s(300,0).x;c.beginPath();c.ellipse(hx,horS,340*view.s,58*view.s,0,Math.PI,0);c.fill();
 c.fillStyle=colLerp('#7cc253','#1a2842',n);
 hx=w2s(940,0).x;c.beginPath();c.ellipse(hx,horS,300*view.s,46*view.s,0,Math.PI,0);c.fill();
 const g2=c.createLinearGradient(0,horS-6,0,chh);
 g2.addColorStop(0,colLerp('#82ca54','#2e4b3f',n));g2.addColorStop(1,colLerp('#4c9d3f','#223a30',n));
 c.fillStyle=g2;c.fillRect(0,horS-6,cw,chh-horS+12);
 if(weather&&weather.type==='rainbowW'){c.globalAlpha=.55;
  const cx2=cw/2,cy2=horS+8;const cols=['#ef5d8a','#f2915a','#f2c94c','#8bd05a','#5ab6e8','#7d8fe0','#b07df0'];
  cols.forEach((col,i)=>{c.strokeStyle=col;c.lineWidth=9;
   c.beginPath();c.arc(cx2,cy2,(190-i*10)*view.s,Math.PI,PI2);c.stroke();});
  c.globalAlpha=1;}}
function drawGroundDetail(){
 c.save();quadPath();c.clip();
 c.fillStyle='rgba(255,244,180,.06)';c.fill();
 c.fillStyle='rgba(0,25,0,.05)';
 for(let yy=282;yy<560;yy+=24)if(((yy/24)|0)%2===0)c.fillRect(320,yy,640,12);
 c.restore();
 for(const[px,py]of[[500,380],[820,500]]){
  const lg=c.createRadialGradient(px,py,10,px,py,160);
  lg.addColorStop(0,'rgba(255,250,200,.10)');lg.addColorStop(1,'rgba(255,250,200,0)');
  c.fillStyle=lg;blob(px,py,160,80);c.fill();}
 for(const s2 of stones){c.fillStyle='rgba(0,0,0,.12)';blob(s2.x+1.5,s2.y+1.5,s2.r,s2.r*.55);c.fill();
  c.fillStyle=s2.c;blob(s2.x,s2.y,s2.r,s2.r*.55);c.fill();}
 c.lineWidth=2;c.lineCap='round';
 for(const tf of tufts){c.strokeStyle=tf.c;c.beginPath();
  c.moveTo(tf.x,tf.y);c.quadraticCurveTo(tf.x+1,tf.y-3,tf.x+2,tf.y-6);c.stroke();}
 for(const f of flowers){c.strokeStyle='#4c9838';c.lineWidth=2;
  c.beginPath();c.moveTo(f.x,f.y);c.lineTo(f.x,f.y-7);c.stroke();
  c.fillStyle=f.c;
  for(let i=0;i<5;i++){const a=i/5*PI2;blob(f.x+Math.cos(a)*3.2,f.y-9+Math.sin(a)*3.2,2.2,2.2);c.fill();}
  c.fillStyle='#fff3d6';blob(f.x,f.y-9,2,2);c.fill();}}
function drawPond(t){const x=1075,y=678,n=nightAmt(dayPhase());
 c.fillStyle='rgba(50,80,42,.4)';blob(x+3,y+3,68,25);c.fill();
 c.fillStyle=colLerp('#4aa3d8','#1d3050',n);blob(x,y,62,21);c.fill();
 c.fillStyle=colLerp('#7fd0ef','#2c4a70',n);blob(x-8,y-3,44,13);c.fill();
 c.strokeStyle=`rgba(255,255,255,${(.22+.15*Math.sin(t*2)).toFixed(2)})`;c.lineWidth=1.5;
 for(let i=0;i<3;i++){const yy=y-6+i*6,ph2=(t*1.5+i*2)%6;
  c.beginPath();c.moveTo(x-30+ph2*8,yy);c.quadraticCurveTo(x-20+ph2*8,yy-2,x-10+ph2*8,yy);c.stroke();}
 c.fillStyle=colLerp('#4c9838','#274a30',n);blob(x+24,y-2,7,3.5);c.fill();blob(x-24,y+4,5.5,3);c.fill();
 c.fillStyle='#f29ce0';blob(x+24,y-5,2.2,2.2);c.fill();}
function drawScare(t){const x=955,y=335,sw=Math.sin(t*1.1)*.05;
 c.fillStyle='rgba(0,0,0,.15)';blob(x,y+2,16,5);c.fill();
 c.save();c.translate(x,y);c.rotate(sw);
 c.strokeStyle='#8a5a2b';c.lineWidth=5;c.lineCap='round';
 c.beginPath();c.moveTo(0,0);c.lineTo(0,-46);c.moveTo(-20,-34);c.lineTo(20,-34);c.stroke();
 c.fillStyle='#d97f4f';blob(0,-40,13,13);c.fill();
 c.fillStyle='#2b2b2b';blob(-4,-42,1.8,2.2);c.fill();blob(4,-42,1.8,2.2);c.fill();
 c.strokeStyle='#7a4f2a';c.lineWidth=1.4;c.beginPath();c.arc(0,-38,4,.3,Math.PI-.3);c.stroke();
 c.fillStyle='#4f7fd6';rr(-11,-36,22,16,4);c.fill();
 c.fillStyle='#c9a86a';rr(-8,-30,5,5,1);c.fill();rr(4,-24,5,5,1);c.fill();
 c.fillStyle='#e8c25a';blob(0,-50,17,5);c.fill();
 c.fillStyle='#d9a83a';c.beginPath();c.moveTo(-9,-51);c.lineTo(0,-65);c.lineTo(9,-51);c.closePath();c.fill();
 c.fillStyle='#c98f3a';rr(-12,-52,24,2.6,1.3);c.fill();
 c.restore();}
function drawFenceEdge(a,b){
 const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/46);
 for(const hgt of[-22,-11]){c.lineCap='round';
  c.strokeStyle='#6e4520';c.lineWidth=7;
  c.beginPath();c.moveTo(a.x,a.y+hgt);c.lineTo(b.x,b.y+hgt);c.stroke();
  c.strokeStyle='#a9713c';c.lineWidth=4;
  c.beginPath();c.moveTo(a.x,a.y+hgt);c.lineTo(b.x,b.y+hgt);c.stroke();}
 for(let i=0;i<=n;i++){const x=lerp(a.x,b.x,i/n),y=lerp(a.y,b.y,i/n);
  c.fillStyle='rgba(0,0,0,.15)';blob(x,y+2,6,2.4);c.fill();
  c.fillStyle='#9a6a3a';rr(x-4,y-27,8,27,3);c.fill();
  c.fillStyle='#b0793f';rr(x-5,y-31,10,7,3);c.fill();}}
function drawPlot(p,t){const{x,y}=pPos(p.i,p.j);
 if(!p.u){
  if(p.sec===0||S.exp[p.sec-1]){
   dPath(x,y);c.fillStyle='rgba(110,72,36,.45)';c.fill();
   c.strokeStyle='rgba(80,52,24,.5)';c.lineWidth=3;c.stroke();
   c.setLineDash([6,5]);c.strokeStyle='rgba(255,240,200,.55)';c.lineWidth=2;
   dPath(x,y);c.stroke();c.setLineDash([]);
   c.strokeStyle='#8a5a2b';c.lineWidth=3;c.beginPath();c.moveTo(x,y-2);c.lineTo(x,y-24);c.stroke();
   c.fillStyle='#fff3d6';rr(x-28,y-42,56,18,6);c.fill();
   c.strokeStyle='#c9a86a';c.lineWidth=2;rr(x-28,y-42,56,18,6);c.stroke();
   c.fillStyle='#7c4f26';c.font='800 10.5px "Baloo 2",sans-serif';
   c.textAlign='center';c.textBaseline='middle';c.fillText(fmt(p.cost),x,y-33);}
  else{dPath(x,y);c.fillStyle='#63b04c';c.fill();c.strokeStyle='#4c9838';c.lineWidth=3;c.stroke();
   c.fillStyle='#f4ead0';rr(x-8,y-18,16,12,3);c.fill();
   c.strokeStyle='#b09b6a';c.lineWidth=2.5;
   c.beginPath();c.arc(x,y-18,5,Math.PI,0);c.stroke();}
  return;}
 const gr=c.createLinearGradient(x,y-26,x,y+26);
 gr.addColorStop(0,'#a4743f');gr.addColorStop(.55,'#7d5129');gr.addColorStop(1,'#6a421f');
 dPath(x,y);c.fillStyle=gr;c.fill();
 c.strokeStyle='#54351a';c.lineWidth=3;c.stroke();
 c.fillStyle='rgba(255,225,170,.14)';
 c.beginPath();c.moveTo(x,y-26);c.lineTo(x+52,y);c.lineTo(x,y+8);c.lineTo(x-52,y);c.closePath();c.fill();
 c.fillStyle='rgba(0,0,0,.15)';
 blob(x-18,y-3,7,3);c.fill();blob(x+15,y+6,6,2.6);c.fill();blob(x+3,y-11,4,2);c.fill();
 if(hoverP===p){c.strokeStyle=(S.sel&&S.seeds[S.sel]>0&&!p.p)?'rgba(126,224,99,.95)':'rgba(255,255,255,.85)';
  c.lineWidth=3;dPath(x,y);c.stroke();}}

/* ----- plantas ----- */
function drawPlantKind(k,pr,K,t,sd){const P=PLANTS[k];
 if(pr<.16){const h=lerp(6,14,pr/.16);
  c.strokeStyle=K('#3e8f3c');c.lineWidth=2.6;c.lineCap='round';
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(2,-h*.5,0,-h);c.stroke();
  leaf(-1,-h+2,7,-1.1,K('#54a94e'));leaf(1,-h+2,7,1.1,K('#54a94e'));return;}
 const f=(a,b)=>clamp((pr-a)/(b-a),0,1);
 if(P.kind==='root'){const h=lerp(16,34,f(.16,.7));
  for(let n=0;n<5;n++){const a=(n-2)*.38;
   c.strokeStyle=K('#3f8f3a');c.lineWidth=2.6;c.lineCap='round';
   c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(a*6,-h*.6,a*10,-h);c.stroke();
   leaf(a*10,-h,8,a*.35,K('#54a94e'));}
  const cf=f(.75,1);
  if(cf>0){c.fillStyle=K('#ef7f24');blob(0,-2*cf,8*cf,6*cf);c.fill();
   c.fillStyle='rgba(255,255,255,.3)';blob(-2.5*cf,-3.5*cf,2.2*cf,1.6*cf);c.fill();}}
 else if(P.kind==='berry'){const gr=f(.16,.65),r0=lerp(10,26,gr);
  if(k==='tomato'){c.strokeStyle=K('#7a5a33');c.lineWidth=3.5;
   c.beginPath();c.moveTo(0,0);c.lineTo(0,-34*gr);c.stroke();}
  c.fillStyle=K('#3f8f3a');blob(0,-r0*.55,r0*1.05,r0*.8);c.fill();
  c.fillStyle=K('#54a94e');blob(-r0*.5,-r0*.4,r0*.55,r0*.5);c.fill();
  blob(r0*.5,-r0*.4,r0*.55,r0*.5);c.fill();blob(0,-r0*.95,r0*.6,r0*.45);c.fill();
  const bf=f(.6,1);
  if(bf>0)for(let i=0;i<P.rc;i++){const a=i/P.rc*PI2+sd*1.7;
   const bx=Math.cos(a)*r0*.62,by=-r0*.55+Math.sin(a)*r0*.45,r=P.rs*bf;
   c.fillStyle=K(P.col);blob(bx,by-r*.35,r,r*1.2);c.fill();
   if(r>3.5){c.fillStyle='rgba(255,255,255,.35)';blob(bx-r*.3,by-r*.75,r*.25,r*.18);c.fill();}}}
 else if(P.kind==='corn'){const h=lerp(18,85,f(.16,.85));
  c.strokeStyle=K('#4f9d3a');c.lineWidth=lerp(3,7,f(.16,.85));c.lineCap='round';
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(4,-h*.5,0,-h);c.stroke();
  const nb=Math.floor(2+4*f(.2,.6));
  for(let i=0;i<nb;i++){const yy=-h*(.22+i*.16),dir=i%2?1:-1;
   leaf(dir,yy,lerp(10,26,f(.2,.85)),dir>0?.5:2.64,K(i%2?'#5cab44':'#457f31'));}
  const cf=f(.62,1);
  if(cf>0){c.save();c.translate(7*cf,-h*.55);c.rotate(.3);
   c.fillStyle=K('#f2c744');rr(-5*cf,-13*cf,10*cf,26*cf,5*cf);c.fill();
   c.fillStyle='rgba(255,255,255,.25)';
   for(let g=0;g<4;g++)c.fillRect(-4*cf,-11*cf+g*6*cf,8*cf,1.5);
   c.strokeStyle=K('#5cab44');c.lineWidth=3;
   c.beginPath();c.moveTo(-5*cf,-9*cf);c.quadraticCurveTo(-13*cf,2*cf,-6*cf,13*cf);c.stroke();c.restore();}
  if(pr>=1){c.strokeStyle=K('#e8c25a');c.lineWidth=2;
   for(let i=0;i<3;i++){c.beginPath();c.moveTo(0,-h);c.lineTo((i-1)*5,-h-9);c.stroke();}}}
 else if(P.kind==='melon'){const gr=f(.16,.6);
  c.strokeStyle=K('#4c9838');c.lineWidth=3;c.lineCap='round';
  c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-16*gr,-3*gr,8*gr,-12*gr,22*gr,-3*gr);c.stroke();
  leaf(-14*gr,-2*gr,11*gr+4,2.6,K('#54a94e'));leaf(20*gr,-4*gr,10*gr+4,.5,K('#54a94e'));
  const fr=f(.5,1)*P.fr;
  if(fr>1.5){const fx=4,fy=-fr*.62;
   c.fillStyle=K(P.col);blob(fx,fy,fr,fr*.82);c.fill();
   c.save();c.beginPath();c.ellipse(fx,fy,fr,fr*.82,0,0,PI2);c.clip();
   if(k==='pumpkin'){c.strokeStyle=K(P.stripe);c.lineWidth=3;
    for(const o of[-.55,0,.55]){c.beginPath();c.ellipse(fx+o*fr,fy,fr*.42,fr*.8,0,0,PI2);c.stroke();}}
   else{c.strokeStyle=K(P.stripe);c.lineWidth=fr*.16;
    for(let s=-2;s<=2;s++){c.beginPath();c.moveTo(fx+s*fr*.38,fy-fr);
     c.quadraticCurveTo(fx+s*fr*.52,fy,fx+s*fr*.38,fy+fr);c.stroke();}}
   c.restore();
   if(k==='pumpkin'){c.strokeStyle=K('#4c9838');c.lineWidth=3.5;
    c.beginPath();c.moveTo(fx,fy-fr*.8);c.quadraticCurveTo(fx+3,fy-fr*1.1,fx+6,fy-fr*1.05);c.stroke();}
   else{c.fillStyle='rgba(255,255,255,.3)';blob(fx-fr*.35,fy-fr*.3,fr*.2,fr*.12);c.fill();}}}
 else if(P.kind==='tree'){const h=lerp(20,58,f(.16,.7)),cr=lerp(10,26,f(.3,.8));
  c.fillStyle=K('#8a5a2b');rr(-3.5,-h,7,h,3);c.fill();
  c.fillStyle=K('#6e4520');rr(1,-h*.7,2.5,h*.7,1);c.fill();
  const cy=-h-cr*.55,sw=Math.sin(t*1.2+sd)*2;
  c.fillStyle=K(P.leaf);blob(sw,cy,cr*1.15,cr*.9);c.fill();
  c.fillStyle=K(lite(P.leaf,.09));blob(sw-cr*.45,cy-cr*.35,cr*.6,cr*.5);c.fill();
  blob(sw+cr*.5,cy-cr*.2,cr*.55,cr*.45);c.fill();
  const bf=f(.68,1);
  if(bf>0)for(let i=0;i<P.fc;i++){const a=i/P.fc*PI2+sd;
   const fx=sw+Math.cos(a)*cr*.72,fy=cy+Math.sin(a)*cr*.5;
   c.fillStyle=K(P.fruit);blob(fx,fy,4.5*bf,4.5*bf);c.fill();
   c.fillStyle='rgba(255,255,255,.4)';blob(fx-1.5*bf,fy-1.5*bf,1.3*bf,1.3*bf);c.fill();}}
 else if(P.kind==='palm'){const h=lerp(20,74,f(.16,.75));
  c.strokeStyle=K('#9a6a3a');c.lineWidth=lerp(3.5,8,f(.16,.75));c.lineCap='round';
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-h*.28,-h*.55,12,-h);c.stroke();
  const tx=12,ty=-h,fl=lerp(12,27,f(.3,.9)),sw=Math.sin(t*1.4+sd)*1.5;
  for(const[a,ln]of[[-2.7,1],[-2.2,.95],[-1.6,.8],[-1.2,.85],[-.6,1],[.1,.9],[.6,.7]])
   leaf(tx+sw,ty,fl*ln,a,K(a<-.6||a>.4?'#3f8f3a':'#54a94e'));
  const bf=f(.72,1);
  if(bf>0){c.fillStyle=K('#7a4f2b');
   for(const[ox,oy]of[[-4,4],[3,6],[8,1]]){blob(tx+ox*bf,ty+oy*bf,4.5*bf,4.5*bf);c.fill();}}}
 else if(P.kind==='banana'){const h=lerp(18,62,f(.16,.7));
  c.fillStyle=K('#7fae3f');rr(-5.5,-h,11,h,5.5);c.fill();
  c.fillStyle=K('#6a9a35');rr(-5.5,-h,3,h*.5,1.5);c.fill();
  const lf=f(.3,.85);
  for(const[a,ln]of[[-2.75,.85],[-2.3,1],[-.55,1.05],[.35,.95],[2.75,.8],[2.35,.9]]){
   c.save();c.translate(0,-h);c.rotate(a);
   c.fillStyle=K(a<0?'#4c9838':'#54a94e');blob(16*lf*ln,0,16*lf*ln,6.5*lf);c.fill();c.restore();}
  const bf=f(.68,1);
  if(bf>0){c.save();c.translate(7,-h+12);
   for(let i=0;i<5;i++){c.save();c.translate(i*4-8,0);c.rotate(.55+i*.1);
    c.strokeStyle=K('#f2d24e');c.lineWidth=4.5;c.lineCap='round';
    c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(3,9*bf,0,17*bf);c.stroke();c.restore();}
   c.restore();}}
 else if(P.kind==='dragon'){const h=lerp(16,52,f(.16,.75));
  c.fillStyle=K('#3f9d5c');rr(-7,-h,14,h,7);c.fill();
  const af=f(.4,.8);
  if(af>.1){c.save();c.translate(-7,-h*.62);c.rotate(-.5);
   rr(-4,-12*af,9,12*af+4,4);c.fill();c.restore();
   c.save();c.translate(7,-h*.48);c.rotate(.5);
   rr(-5,-10*af,9,10*af+4,4);c.fill();c.restore();}
  c.fillStyle=K('#2f7a46');
  for(let i=0;i<6;i++){blob(-4+(i%2)*8,-6-i*7,1.5,1.5);c.fill();}
  const bf=f(.7,1);
  if(bf>0)for(const[fx,fy]of[[0,-h],[-10,-h*.62-12*af],[10,-h*.48-10*af]]){
   c.fillStyle=K('#ef4d8a');blob(fx,fy,5.5*bf,7*bf);c.fill();
   c.fillStyle=K('#79d070');
   for(let s=-1;s<=1;s++){blob(fx+s*4*bf,fy-6.5*bf,1.6*bf,2.2*bf);c.fill();}}}
 else if(P.kind==='grape'){
  c.strokeStyle=K('#8a5a2b');c.lineWidth=4;c.lineCap='round';
  c.beginPath();c.moveTo(-14,0);c.lineTo(-14,-44);c.moveTo(14,0);c.lineTo(14,-44);
  c.moveTo(-17,-40);c.lineTo(17,-40);c.stroke();
  const gr=f(.16,.75);
  c.strokeStyle=K('#4c9838');c.lineWidth=2.5;
  c.beginPath();c.moveTo(-14,0);c.bezierCurveTo(-24,-12*gr,-4,-20*gr,-14,-32*gr);
  c.quadraticCurveTo(-12,-38*gr,-4,-39*gr);c.stroke();
  leaf(-14,-20*gr,10*gr+4,2.8,K('#54a94e'));
  leaf(4,-39*gr,11*gr+4,.3,K('#54a94e'));
  leaf(-6,-30*gr,9*gr+4,-2.9,K('#54a94e'));
  const bf=f(.72,1);
  if(bf>0)for(const cx of[-8,6]){const cy=-30;
   c.fillStyle=K('#8e44c0');
   for(const[dx,dy]of[[0,0],[-5,5],[5,5],[-2.5,10],[2.5,10],[0,15]]){
    blob(cx+dx*bf,cy+dy*bf,4.2*bf,4.2*bf);c.fill();}
   c.fillStyle='rgba(255,255,255,.35)';blob(cx-1.5*bf,cy-1.5*bf,1.2*bf,1.2*bf);c.fill();}}
 else if(P.kind==='crystal'){const h=lerp(14,48,f(.16,.7));
  c.strokeStyle=K('#4c9838');c.lineWidth=3;c.lineCap='round';
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(3,-h*.5,0,-h);c.stroke();
  leaf(-2,-h*.45,10,2.9,K('#54a94e'));leaf(2,-h*.5,10,.25,K('#54a94e'));
  const bf=f(.6,1);
  if(bf>0){const pulse=.8+.2*Math.sin(t*2.5+sd);
   c.save();c.translate(0,-h-2);c.rotate(Math.sin(t*.6+sd)*.1);c.scale(bf*pulse,bf*pulse);
   c.save();c.globalCompositeOperation='lighter';
   const g=c.createRadialGradient(0,0,2,0,0,26);
   g.addColorStop(0,'rgba(120,240,255,.5)');g.addColorStop(1,'rgba(120,240,255,0)');
   c.fillStyle=g;blob(0,0,26,26);c.fill();c.restore();
   for(let i=0;i<6;i++){c.save();c.rotate(i*PI/3+t*.25);
    c.fillStyle=K(i%2?'#5ad8f0':'#c76df0');
    c.beginPath();c.moveTo(0,-5);c.lineTo(3,-14);c.lineTo(0,-22);c.lineTo(-3,-14);c.closePath();c.fill();
    c.restore();}
   c.fillStyle=K('#ffffff');blob(0,0,4.5,4.5);c.fill();c.restore();}}}
function drawPlantAt(p,t){const{x,y}=pPos(p.i,p.j),pl=p.p,P=PLANTS[pl.k];
 const jit=.9+.18*(((p.i*7+p.j*13)%10)/10);
 const sc=(pl.mut==='giant'?1.5:1)*jit;
 c.fillStyle='rgba(25,35,12,.22)';
 blob(x,y+2,(11+P.h*.16)*sc,4.5*sc);c.fill();
 if(pl.pr>=1){const a=.3+.22*Math.sin(t*3);
  c.strokeStyle=`rgba(255,225,77,${a.toFixed(2)})`;c.lineWidth=3;
  c.beginPath();c.ellipse(x,y,30,14,0,0,PI2);c.stroke();
  c.strokeStyle=`rgba(255,225,77,${(a*.5).toFixed(2)})`;c.lineWidth=2;
  c.beginPath();c.ellipse(x,y,38,18,0,0,PI2);c.stroke();
  if(Math.random()<.05)spark(x+R(-18,18),y-R(4,30),'#ffe14d',1);}
 c.save();c.translate(x,y-3);c.scale(sc,sc);c.rotate(Math.sin(t*1.2+p.i+p.j)*.035);
 const K=col=>tint(col,pl.mut,t);
 drawPlantKind(pl.k,pl.pr,K,t,p.i+p.j);
 if(pl.mut){const m=pl.mut;let gl=null;
  if(m==='golden')gl='rgba(242,181,58,.35)';
  else if(m==='rainbow')gl=`hsla(${(t*90)%360},90%,60%,.3)`;
  else if(m==='celestial')gl='rgba(150,90,240,.4)';
  else if(m==='prismatic')gl=`hsla(${(t*140)%360},95%,65%,.35)`;
  if(gl){c.save();c.globalCompositeOperation='lighter';
   const g=c.createRadialGradient(0,-P.h*.5,4,0,-P.h*.5,P.h*.85);
   g.addColorStop(0,gl);g.addColorStop(1,'rgba(0,0,0,0)');
   c.fillStyle=g;c.beginPath();c.arc(0,-P.h*.5,P.h*.9,0,PI2);c.fill();c.restore();}
  if(m==='frozen'){c.fillStyle='rgba(230,250,255,.9)';
   for(let i=0;i<6;i++){blob(Math.sin(i*2.3+p.i)*16,-6-(i*P.h/7),1.3,1.3);c.fill();}}
  if(m==='shocked'&&Math.sin(t*18)>-.2){c.strokeStyle='#ffe14d';c.lineWidth=2.5;c.lineJoin='round';
   c.beginPath();let bx=-6,by=-P.h-14;c.moveTo(bx,by);
   for(let i=0;i<4;i++){bx+=(i%2?7:-3);by+=6;c.lineTo(bx,by);}c.stroke();}
  if((m==='prismatic'||m==='celestial')&&Math.random()<.08)
   parts.push({x:x+R(-18,18),y:y-R(6,P.h*sc),vx:R(-12,12),vy:R(-30,-8),g:0,life:R(.5,.9),
    col:m==='prismatic'?`hsl(${R(0,360)|0},90%,65%)`:'#c9a0ff',r:R(1.5,2.6),type:'dot'});}
 c.restore();
 if(pl.pr>=1){const my=y-P.h*sc-16+Math.sin(t*3+p.i)*3;
  c.fillStyle='#ffe14d';c.strokeStyle='#c9821f';c.lineWidth=2;
  blob(x,my,8,8);c.fill();c.stroke();
  c.fillStyle='#7c4f26';c.font='800 11px "Baloo 2",sans-serif';
  c.textAlign='center';c.textBaseline='middle';c.fillText('!',x,my+1);}
 else if(pl.pr>.02){const by=y-P.h*sc-14;
  c.fillStyle='rgba(20,30,15,.55)';rr(x-22,by,44,7,3.5);c.fill();
  c.fillStyle=pl.pr<.5?'#f2b53a':'#7ee063';rr(x-20,by+1.5,Math.max(40*pl.pr,.001),4,2);c.fill();}}

/* ----- iconos ----- */
const ICO=new Map();
function iconURL(k,m){const key='c'+k+(m||'');if(ICO.has(key))return ICO.get(key);
 const cn=document.createElement('canvas');cn.width=cn.height=76;
 const old=c;c=cn.getContext('2d');const P=PLANTS[k];
 c.save();c.translate(38,70);
 const sc=Math.min(56/P.h,1.15)*(m==='giant'?1.1:1);c.scale(sc,sc);
 drawPlantKind(k,1,col=>tint(col,m,0),0,3);c.restore();
 if(m){c.strokeStyle=MUTS[m].col;c.lineWidth=5;rr(4,4,68,68,16);c.stroke();}
 c=old;const u=cn.toDataURL();ICO.set(key,u);return u;}
function petIconURL(id){const key='p'+id;if(ICO.has(key))return ICO.get(key);
 const cn=document.createElement('canvas');cn.width=cn.height=72;
 const old=c;c=cn.getContext('2d');
 drawPet(id,36,56,1.4,1.6);
 c=old;const u=cn.toDataURL();ICO.set(key,u);return u;}

/* ----- edificios / árboles / jugador / mascotas ----- */
const MOTIFS={
 seed(x,y,s){c.save();c.translate(x,y);c.scale(s,s);
  c.fillStyle='#efe3c0';rr(-7,-9,14,18,3);c.fill();
  c.strokeStyle='#b09b6a';c.lineWidth=1.5;rr(-7,-9,14,18,3);c.stroke();
  c.strokeStyle='#4ea53c';c.lineWidth=2;c.beginPath();c.moveTo(0,5);c.lineTo(0,-1);c.stroke();
  leaf(-1,-1,5,-1.2,'#4ea53c');leaf(1,-1,5,1.2,'#4ea53c');c.restore();},
 paw(x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#8a5a2b';
  blob(0,2,5,4);c.fill();blob(-5,-3,2.2,2.2);c.fill();
  blob(0,-5,2.4,2.4);c.fill();blob(5,-3,2.2,2.2);c.fill();c.restore();},
 coin(x,y,s){c.save();c.translate(x,y);c.scale(s,s);
  c.fillStyle='#f7c247';blob(0,0,7,7);c.fill();
  c.strokeStyle='#c9821f';c.lineWidth=2;blob(0,0,7,7);c.stroke();
  c.beginPath();c.arc(0,0,3.6,0,PI2);c.stroke();c.restore();},
 can(x,y,s){c.save();c.translate(x,y);c.scale(s,s);
  c.fillStyle='#4ea53c';rr(-6,-5,11,11,3);c.fill();
  c.strokeStyle='#4ea53c';c.lineWidth=2.5;
  c.beginPath();c.moveTo(-6,-2);c.lineTo(-11,-6);c.stroke();
  c.beginPath();c.arc(5,-1,4.5,-1.2,1.2);c.stroke();
  c.fillStyle='#3f9fe8';blob(-12,-8,1.5,1.5);c.fill();blob(-9.5,-10,1.2,1.2);c.fill();c.restore();}};
function drawStall(b,t){const{x,y,w}=b,n=nightAmt(dayPhase());
 c.fillStyle='rgba(0,0,0,.18)';blob(x,y+6,w*.62,14);c.fill();
 if(n>.3){c.save();c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(x,y-70,10,x,y-70,110);
  g.addColorStop(0,`rgba(255,190,90,${(.25*n).toFixed(2)})`);g.addColorStop(1,'rgba(255,190,90,0)');
  c.fillStyle=g;blob(x,y-70,110,110);c.fill();c.restore();}
 c.fillStyle='#7c4f26';c.fillRect(x-w/2+8,y-116,8,72);c.fillRect(x+w/2-16,y-116,8,72);
 c.fillStyle='#b0793f';rr(x-w/2,y-46,w,42,8);c.fill();
 c.strokeStyle='#7c4f26';c.lineWidth=3;rr(x-w/2,y-46,w,42,8);c.stroke();
 c.fillStyle='#8a5a2b';rr(x-w/2-6,y-52,w+12,12,6);c.fill();
 const seg=5,sw2=(w-6)/seg;
 for(let i=0;i<seg;i++){const ax=x-w/2+3+i*sw2;
  c.fillStyle=i%2?'#fff7e6':b.col;
  c.beginPath();c.rect(ax,y-118,sw2,20);
  c.arc(ax+sw2/2,y-98,sw2/2,Math.PI,0,true);c.closePath();c.fill();}
 c.fillStyle=lite(b.col,-.22);rr(x-w/2-4,y-125,w+8,10,5);c.fill();
 c.fillStyle='#6e4520';rr(x-48,y-86,96,24,6);c.fill();
 c.strokeStyle='#54351a';c.lineWidth=2;rr(x-48,y-86,96,24,6);c.stroke();
 c.fillStyle='#ffe9c4';c.font='800 12px "Baloo 2",sans-serif';
 c.textAlign='center';c.textBaseline='middle';c.fillText(b.sign,x,y-74);
 for(const lx of[x-w/2+10,x+w/2-10]){
  c.strokeStyle='#5a4632';c.lineWidth=2;
  c.beginPath();c.moveTo(lx,y-116);c.lineTo(lx,y-104);c.stroke();
  const la=.6+.4*Math.sin(t*3+lx);
  c.fillStyle='#3a2a1a';rr(lx-5,y-106,10,4,2);c.fill();
  c.fillStyle=`rgba(255,225,140,${(.7+.3*la).toFixed(2)})`;blob(lx,y-96,4.5,6);c.fill();
  if(n>.15){c.save();c.globalCompositeOperation='lighter';
   const g=c.createRadialGradient(lx,y-96,2,lx,y-96,22);
   g.addColorStop(0,`rgba(255,190,90,${(.35*n*la).toFixed(2)})`);
   g.addColorStop(1,'rgba(255,190,90,0)');
   c.fillStyle=g;blob(lx,y-96,22,22);c.fill();c.restore();}}
 c.fillStyle='#8a5a2b';rr(x-36,y-34,26,14,2);c.fill();
 c.strokeStyle='#6e4520';c.lineWidth=1.5;rr(x-36,y-34,26,14,2);c.stroke();
 c.fillStyle=b.col;blob(x-27,y-36,4,4);c.fill();blob(x-19,y-38,4,4);c.fill();
 MOTIFS[b.motif](x+14,y-26,1.4);
 const bo=Math.sin(t*2+x)*4;
 c.fillStyle='#fff7e6';c.strokeStyle=lite(b.col,-.22);c.lineWidth=3;
 blob(x,y-142+bo,15,15);c.fill();c.stroke();
 MOTIFS[b.motif](x,y-142+bo,.72);}
function drawTree(tr,t){const{x,y,s}=tr;
 c.fillStyle='rgba(0,0,0,.16)';blob(x,y+4,26*s,8*s);c.fill();
 c.fillStyle='#8a5a2b';rr(x-5*s,y-34*s,10*s,34*s,4*s);c.fill();
 const sw=Math.sin(t*.8+x*.01)*3;
 c.fillStyle='#3f8f3a';blob(x+sw,y-46*s,24*s,20*s);c.fill();
 c.fillStyle='#54a94e';blob(x+sw-10*s,y-52*s,14*s,11*s);c.fill();
 blob(x+sw+11*s,y-50*s,13*s,10*s);c.fill();blob(x+sw,y-60*s,15*s,12*s);c.fill();
 c.fillStyle='#f2a5c0';
 for(let i=0;i<4;i++){blob(x+sw+Math.sin(i*2.4+x)*16*s,y-50*s+Math.cos(i*2.7)*12*s,2.4*s,2.4*s);c.fill();}}
function drawPlayer(t){const p=player,mov=p.moving;
 const bob=mov?Math.abs(Math.sin(p.step*9))*2.5:Math.sin(t*2)*1;
 c.fillStyle='rgba(0,0,0,.2)';blob(p.x,p.y+3,15,5.5);c.fill();
 c.save();c.translate(p.x,p.y-bob);if(p.face<0)c.scale(-1,1);
 const lg=mov?Math.sin(p.step*9)*4:0,l1=9-Math.max(0,lg),l2=9-Math.max(0,-lg);
 c.fillStyle='#3a2c1c';rr(-7.5,-5,6.5,5,2);c.fill();rr(1,-5,6.5,5,2);c.fill();
 c.fillStyle='#5a4632';rr(-7,-l1,6,Math.max(l1-4,1),2);c.fill();rr(1,-l2,6,Math.max(l2-4,1),2);c.fill();
 c.fillStyle='#4f7fd6';rr(-10,-26,20,19,7);c.fill();
 c.fillStyle='#67b04f';c.fillRect(-6,-26,3.5,8);c.fillRect(2.5,-26,3.5,8);
 c.fillStyle='#e8c25a';blob(-4,-21,1.2,1.2);c.fill();blob(4,-21,1.2,1.2);c.fill();
 c.fillStyle='#ffd9a6';blob(-11,-18,3.5,5);c.fill();blob(11,-18,3.5,5);c.fill();
 blob(0,-33,9,8.5);c.fill();
 c.fillStyle='#2b2b2b';blob(3,-34,1.5,2);c.fill();blob(7,-34,1.5,2);c.fill();
 c.strokeStyle='#b5643c';c.lineWidth=1.5;
 c.beginPath();c.arc(5,-30,2.6,.25,Math.PI-.4);c.stroke();
 c.fillStyle='#e8c25a';blob(0,-40,12,4);c.fill();blob(0,-43,7,5);c.fill();
 c.fillStyle='#c98f3a';rr(-12,-41,24,2.6,1.3);c.fill();
 c.restore();}
function drawPet(id,x,y,t,sc){const st=PET_STYLE[id]||{};
 c.fillStyle='rgba(0,0,0,.15)';blob(x,y+2,11*sc,4*sc);c.fill();
 const hop=Math.abs(Math.sin(t*5+x*.05))*3;
 c.save();c.translate(x,y-4-hop);c.scale(sc,sc);
 const K=col=>id==='rdrag'?tint(col,'prismatic',t):col;
 const fl=Math.sin(t*16)*.6;
 if(['bee','dragon','phoenix','rdrag'].includes(id)){
  for(const d of[-1,1]){c.save();c.translate(d*8,-12);c.rotate(d*(.5+fl));
   c.fillStyle=(id==='dragon'||id==='rdrag'||id==='phoenix')?K(lite(st.b,-.15)):'rgba(255,255,255,.6)';
   blob(d*6,0,10,4.5);c.fill();c.restore();}}
 if(id==='butterfly'){
  for(const d of[-1,1]){c.save();c.translate(d*3,-8);c.rotate(d*(.3+fl*.4));
   c.fillStyle=d<0?K('#f29ce0'):K('#8ad0f2');
   blob(d*7,0,8,5.5);c.fill();blob(d*5,-6,5.5,4);c.fill();c.restore();}
  c.fillStyle=K(st.b);rr(-2,-14,4,16,2);c.fill();
  c.fillStyle='#fff';blob(-1,-15,1.2,1.2);c.fill();blob(1,-15,1.2,1.2);c.fill();}
 else{
  c.fillStyle=K(st.b);blob(0,-7,12,9);c.fill();
  if(id==='bee'){c.save();c.beginPath();c.ellipse(0,-7,12,9,0,0,PI2);c.clip();
   c.fillStyle='#3a3a3a';c.fillRect(-12,-11,24,3);c.fillRect(-12,-4,24,3);c.restore();
   c.fillStyle='#3a3a3a';c.beginPath();c.moveTo(-10,-7);c.lineTo(-15,-9);c.lineTo(-15,-5);c.closePath();c.fill();}
  if(id==='turtle'){c.fillStyle=K(st.s);blob(0,-9,13,10);c.fill();
   c.strokeStyle=K('#6e4a2a');c.lineWidth=2;
   for(const a of[-.7,0,.7]){c.beginPath();c.moveTo(0,-9);
    c.lineTo(Math.cos(a)*11,-9+Math.sin(a)*8);c.stroke();}
   c.fillStyle=K(st.b);blob(11,-8,4.5,4);c.fill();}
  else{c.fillStyle=K(st.b);blob(7,-15,8,7.5);c.fill();
   c.fillStyle='#2b2b2b';blob(6,-16,1.4,1.8);c.fill();blob(10.5,-16,1.4,1.8);c.fill();}
  if(id==='dog'){c.fillStyle=K(st.e||st.b);blob(2,-21,3.5,6);c.fill();blob(11,-21,3.5,6);c.fill();
   c.fillStyle=K(st.b);blob(-11,-9,4,4);c.fill();
   c.fillStyle='#e86a5a';blob(10,-11,2,2.5);c.fill();}
  if(id==='cat'){c.fillStyle=K(st.b);
   c.beginPath();c.moveTo(2,-21);c.lineTo(4,-27);c.lineTo(7,-22);c.closePath();c.fill();
   c.beginPath();c.moveTo(9,-22);c.lineTo(12,-27);c.lineTo(14,-21);c.closePath();c.fill();
   c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1;
   c.beginPath();c.moveTo(4,-13);c.lineTo(0,-13);c.moveTo(11,-13);c.lineTo(15,-13);c.stroke();
   c.strokeStyle=K(st.e||st.b);c.lineWidth=3;
   c.beginPath();c.arc(-10,-8,5,.6,3.6);c.stroke();}
  if(id==='bunny'){c.fillStyle=K('#f5f0ea');blob(4,-24,3,8);c.fill();blob(10,-24,3,8);c.fill();
   c.fillStyle='#fff';blob(-11,-5,3.5,3.5);c.fill();}
  if(id==='fox'){c.fillStyle=K(st.b);
   c.beginPath();c.moveTo(2,-20);c.lineTo(3,-27);c.lineTo(8,-22);c.closePath();c.fill();
   c.beginPath();c.moveTo(9,-22);c.lineTo(13,-27);c.lineTo(14,-20);c.closePath();c.fill();
   c.fillStyle='#fff';blob(7,-12,3,2.5);c.fill();
   c.fillStyle=K(st.b);blob(-12,-8,6,3);c.fill();
   c.fillStyle='#fff';blob(-15,-8,2.5,2.5);c.fill();}
  if(id==='panda'){c.fillStyle='#2b2b2b';
   blob(2,-21,3.5,3.5);c.fill();blob(11,-21,3.5,3.5);c.fill();
   blob(5,-16,2.5,3);c.fill();blob(10,-16,2.5,3);c.fill();
   blob(-6,-2,4,4);c.fill();blob(6,-2,4,4);c.fill();}
  if(id==='unicorn'){c.fillStyle='#f2d24e';
   c.beginPath();c.moveTo(5,-22);c.lineTo(8,-32);c.lineTo(11,-22);c.closePath();c.fill();
   const cols=['#f29ce0','#8ad0f2','#f2d24e'];c.lineWidth=3;
   for(let i=0;i<3;i++){c.strokeStyle=cols[i];
    c.beginPath();c.moveTo(-9,-6+i*3);c.quadraticCurveTo(-14,-4+i*3,-13,2+i*2);c.stroke();
    c.beginPath();c.moveTo(3+i*2,-21);c.quadraticCurveTo(i*2-2,-25,i*2-6,-22);c.stroke();}}
  if(id==='dragon'||id==='phoenix'||id==='rdrag'){
   c.fillStyle=K(lite(st.b,-.2));
   c.beginPath();c.moveTo(4,-21);c.lineTo(6,-27);c.lineTo(8,-21);c.closePath();c.fill();
   c.beginPath();c.moveTo(10,-21);c.lineTo(12,-27);c.lineTo(14,-21);c.closePath();c.fill();
   c.strokeStyle=K(st.b);c.lineWidth=4;
   c.beginPath();c.moveTo(-10,-6);c.quadraticCurveTo(-16,-2,-14,4);c.stroke();
   c.fillStyle=K(lite(st.b,-.2));
   c.beginPath();c.moveTo(-14,4);c.lineTo(-17,8);c.lineTo(-11,7);c.closePath();c.fill();}}
 if(id==='phoenix'){c.save();c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(0,-10,4,0,-10,22);
  g.addColorStop(0,'rgba(255,190,80,.35)');g.addColorStop(1,'rgba(255,190,80,0)');
  c.fillStyle=g;blob(0,-10,22,22);c.fill();c.restore();}
 c.restore();}
function drawCrater(cr,t){const p=clamp(cr.life/14,0,1);
 c.fillStyle='rgba(40,25,15,.5)';blob(cr.x,cr.y,26,10);c.fill();
 c.save();c.translate(cr.x,cr.y-8);c.rotate(.5);
 c.fillStyle='#5a4632';rr(-10,-8,20,16,4);c.fill();
 c.strokeStyle='#ff9d5a';c.lineWidth=2;rr(-10,-8,20,16,4);c.stroke();c.restore();
 c.save();c.globalCompositeOperation='lighter';
 const a=.22+.18*Math.sin(t*5);
 const g=c.createRadialGradient(cr.x,cr.y-10,3,cr.x,cr.y-10,34);
 g.addColorStop(0,`rgba(255,157,90,${a.toFixed(2)})`);g.addColorStop(1,'rgba(255,157,90,0)');
 c.fillStyle=g;blob(cr.x,cr.y-10,34,34);c.fill();c.restore();
 c.strokeStyle=`rgba(255,225,77,${(.7*p).toFixed(2)})`;c.lineWidth=3;
 c.beginPath();c.arc(cr.x,cr.y-10,30,-Math.PI/2,-Math.PI/2+PI2*p);c.stroke();
 if(Math.random()<.12)spark(cr.x+R(-14,14),cr.y-10+R(-10,6),'#ffe14d',1);}
function updateParts(dt){for(let i=parts.length-1;i>=0;i--){const p=parts[i];
 p.life-=dt;if(p.life<=0){parts.splice(i,1);continue;}
 p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||0)*dt;
 if(p.vr!==undefined)p.rot+=p.vr*dt;}}
function drawParts(){for(const p of parts){c.globalAlpha=clamp(p.life,0,1);
 if(p.type==='conf'){c.save();c.translate(p.x,p.y);c.rotate(p.rot);
  c.fillStyle=p.col;c.fillRect(-p.r,-p.r*.6,p.r*2,p.r*1.2);c.restore();}
 else{c.fillStyle=p.col;blob(p.x,p.y,p.r,p.r);c.fill();}}c.globalAlpha=1;}
function drawTexts(){c.font='800 13px "Baloo 2",sans-serif';c.textAlign='center';
 for(const tx of texts){c.globalAlpha=clamp(tx.life,0,1);
  c.strokeStyle='rgba(40,25,10,.85)';c.lineWidth=3;c.lineJoin='round';
  c.strokeText(tx.txt,tx.x,tx.y);c.fillStyle=tx.col;c.fillText(tx.txt,tx.x,tx.y);}
 c.globalAlpha=1;}
function drawWeatherScreen(t){const cw=cv.width/dpr,chh=cv.height/dpr;
 if(weather&&(weather.type==='rain'||weather.type==='storm')){
  c.strokeStyle='rgba(170,205,255,.55)';c.lineWidth=2;c.lineCap='round';c.beginPath();
  for(const d of rain){c.moveTo(d.x,d.y);c.lineTo(d.x-3,d.y+13);}c.stroke();}
 if(weather&&weather.type==='frost'){c.fillStyle='rgba(255,255,255,.8)';
  for(const s of snow){blob(s.x,s.y,1.5+s.p*.25,1.5+s.p*.25);c.fill();}}
 if(flash>0){c.fillStyle=`rgba(255,255,255,${(flash*.38).toFixed(2)})`;c.fillRect(0,0,cw,chh);
  if(boltT>0&&boltPts.length>1){c.strokeStyle='#fff';c.lineWidth=4;
   c.shadowColor='#ffe14d';c.shadowBlur=12;c.beginPath();
   boltPts.forEach((pt,i)=>{const s=w2s(pt[0],pt[1]);i?c.lineTo(s.x,s.y):c.moveTo(s.x,s.y);});
   c.stroke();c.shadowBlur=0;}}
 const n=nightAmt(dayPhase());
 if(n>0)c.fillStyle=`rgba(16,20,60,${(n*.34).toFixed(2)})`,c.fillRect(0,0,cw,chh);
 if(weather){const ty=weather.type;
  if(ty==='storm')c.fillStyle='rgba(28,38,66,.22)',c.fillRect(0,0,cw,chh);
  if(ty==='frost')c.fillStyle='rgba(180,220,255,.13)',c.fillRect(0,0,cw,chh);
  if(ty==='goldenH')c.fillStyle='rgba(255,180,60,.15)',c.fillRect(0,0,cw,chh);
  if(ty==='super'){c.fillStyle=`rgba(80,220,80,${(.07+.05*Math.sin(t*4)).toFixed(2)})`;c.fillRect(0,0,cw,chh);}
  if(ty==='meteor')c.fillStyle='rgba(255,120,60,.06)',c.fillRect(0,0,cw,chh);}}
function draw(t){
 c.setTransform(dpr,0,0,dpr,0,0);
 drawSky(t);
 const shx=shake>0?R(-shake,shake):0,shy=shake>0?R(-shake,shake):0;
 c.setTransform(dpr*view.s,0,0,dpr*view.s,dpr*(view.ox+shx*view.s),dpr*(view.oy+shy*view.s));
 drawGroundDetail();drawPond(t);
 const ps=[...S.plots].sort((a,b)=>(a.i+a.j)-(b.i+b.j));
 for(const p of ps)drawPlot(p,t);
 for(const p of ps)if(p.p)drawPlantAt(p,t);
 drawFenceEdge(FC.N,FC.E);drawFenceEdge(FC.N,FC.W);
 const ents=[];
 for(const tr of TREES)ents.push({y:tr.y,f:()=>drawTree(tr,t)});
 for(const k in BLD)ents.push({y:BLD[k].y,f:()=>drawStall(BLD[k],t)});
 ents.push({y:335,f:()=>drawScare(t)});
 for(const e of petsEnt)ents.push({y:e.y,f:()=>drawPet(e.id,e.x,e.y,t,.95)});
 ents.push({y:player.y,f:()=>drawPlayer(t)});
 for(const cr of craters)ents.push({y:cr.y,f:()=>drawCrater(cr,t)});
 ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.f();
 const n=nightAmt(dayPhase());
 if(n>.25){c.save();c.globalCompositeOperation='lighter';
  for(const f of ff){const a=n*(.4+.6*Math.abs(Math.sin(t*2+f.ph)));
   c.fillStyle=`rgba(220,255,140,${a.toFixed(2)})`;blob(f.x,f.y,2.2,2.2);c.fill();}c.restore();}
 if(n<.6){c.globalAlpha=(1-n)*.9;
  for(const b of bfs){const a=Math.abs(Math.sin(t*14+b.ph));
   for(const d of[-1,1]){c.save();c.translate(b.x+d*2,b.y);c.rotate(d*(.4+a*.7));
    c.fillStyle=b.c;blob(d*4,0,5,3);c.fill();c.restore();}
   c.fillStyle='#3a2a1a';rr(b.x-1,b.y-2,2,5,1);c.fill();}
  c.globalAlpha=1;}
 for(const m of meteors){c.save();c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(m.x,m.y,2,m.x,m.y,15);
  g.addColorStop(0,'#fff3d0');g.addColorStop(.4,'#ffb347');g.addColorStop(1,'rgba(255,120,60,0)');
  c.fillStyle=g;blob(m.x,m.y,15,15);c.fill();c.restore();}
 drawParts();drawTexts();
 c.setTransform(dpr,0,0,dpr,0,0);
 drawWeatherScreen(t);
 const ph=dayPhase();
 const warm=Math.max(0,1-Math.abs(ph-.06)/.12,1-Math.abs(ph-.6)/.09);
 if(warm>0){c.fillStyle=`rgba(255,140,60,${(warm*.10).toFixed(2)})`;c.fillRect(0,0,cv.width/dpr,cv.height/dpr);}
 const cw=cv.width/dpr,chh=cv.height/dpr;
 const vg=c.createRadialGradient(cw/2,chh/2,Math.min(cw,chh)*.55,cw/2,chh/2,Math.max(cw,chh)*1.05);
 vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(20,12,0,.16)');
 c.fillStyle=vg;c.fillRect(0,0,cw,chh);}

/* ---------- bucle ---------- */
function movePlayer(dt){const p=player;let vx=0,vy=0;
 if(keys['w']||keys['arrowup'])vy-=1;if(keys['s']||keys['arrowdown'])vy+=1;
 if(keys['a']||keys['arrowleft'])vx-=1;if(keys['d']||keys['arrowright'])vx+=1;
 vx+=joyVec.x;vy+=joyVec.y;
 if(vx||vy){const l=Math.hypot(vx,vy);vx/=l;vy/=l;p.tx=p.ty=null;}
 else if(p.tx!=null){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);
  if(d<8)p.tx=null;else{vx=dx/d;vy=dy/d;}}
 if(vx||vy){p.x=clamp(p.x+vx*230*dt,34,W-34);p.y=clamp(p.y+vy*230*dt,300,H-26);
  p.moving=true;p.step+=dt*1.4;if(Math.abs(vx)>.15)p.face=vx>0?1:-1;}
 else p.moving=false;}
function update(dt,offline){
 gt+=dt;S.stats.playT=gt;
 updateWeather(dt);
 if(!offline){movePlayer(dt);
  for(let i=0;i<petsEnt.length;i++){const e=petsEnt[i];
   const tx=player.x-player.face*(30+i*26)+Math.sin(gt*2+i*2.1)*10,ty=player.y+8+i*5;
   e.x=lerp(e.x,tx,clamp(dt*3,0,1));e.y=lerp(e.y,ty,clamp(dt*3,0,1));}}
 else{player.tx=player.ty=null;player.moving=false;}
 updateGrowth(dt,offline);
 if(!offline){updateParts(Math.min(dt,.05));updateMeteors(Math.min(dt,.05));
  const chh=cv.height/dpr,cw=cv.width/dpr;
  for(const d of rain){d.y+=d.v*dt;if(d.y>chh){d.y=-14;d.x=R(0,cw);}}
  for(const s of snow){s.y+=s.v*dt;s.x+=Math.sin(gt*2+s.p)*14*dt;
   if(s.y>chh){s.y=-8;s.x=R(0,cw);}}
  for(const f of ff){f.x+=f.vx*dt;f.y+=f.vy*dt;
   if(Math.random()<.01){f.vx=R(-14,14);f.vy=R(-10,10);}
   f.x=clamp(f.x,300,980);f.y=clamp(f.y,290,620);}
  for(const b of bfs){b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(Math.random()<.012){b.vx=R(-22,22);b.vy=R(-14,14);}
   b.x=clamp(b.x,300,980);b.y=clamp(b.y,270,570);}
  for(const cl of clouds){cl.nx+=cl.v*dt;if(cl.nx>1.15)cl.nx=-.15;}
  if(!shoot&&nightAmt(dayPhase())>.5&&Math.random()<.0015)
   shoot={x:R(.1,.7),y:R(.05,.25),vx:R(.25,.45),vy:R(.08,.18),life:1};
  if(shoot){shoot.x+=shoot.vx*dt;shoot.y+=shoot.vy*dt;shoot.life-=dt*.9;
   if(shoot.life<=0||shoot.x>1.1)shoot=null;}
  if(shake>0)shake=Math.max(0,shake-dt*20);
  if(flash>0)flash=Math.max(0,flash-dt*2.5);
  if(boltT>0)boltT-=dt;
  for(let i=texts.length-1;i>=0;i--){texts[i].y-=28*dt;texts[i].life-=dt;
   if(texts[i].life<=0)texts.splice(i,1);}}}
let last=performance.now();
function frame(now){const dtRaw=(now-last)/1000;last=now;
 const dt=Math.min(dtRaw,7200);
 if(dt>0)update(dt,dtRaw>1.5);
 draw(now/1000);
 requestAnimationFrame(frame);}

/* ---------- entrada ---------- */
function toWorld(e){const r=cv.getBoundingClientRect();
 return s2w(e.clientX-r.left,e.clientY-r.top);}
function hitPlot(w){let best=null,bd=-1;
 for(const p of S.plots){const{x,y}=pPos(p.i,p.j);
  if(Math.abs(w.x-x)/52+Math.abs(w.y-y)/26<=1){const d=p.i+p.j;if(d>bd){bd=d;best=p;}}}
 return best;}
function hitBuilding(w){for(const k in BLD){const b=BLD[k];
 if(Math.abs(w.x-b.x)<b.w/2&&w.y>b.y-130&&w.y<b.y+12)return b;}return null;}
function hitCrater(w){for(const cr of craters)
 if(Math.hypot(w.x-cr.x,w.y-(cr.y-10))<34)return cr;return null;}
cv.addEventListener('pointerdown',e=>{Snd.init();
 if(Snd.c&&Snd.c.state==='suspended')Snd.c.resume();
 if(e.button!==undefined&&e.button>0)return;
 const w=toWorld(e);
 const cr=hitCrater(w);if(cr){collectCrater(cr);return;}
 const p=hitPlot(w);if(p){plotClick(p);
  player.tx=clamp(w.x,34,W-34);player.ty=clamp(w.y,300,H-26);return;}
 const b=hitBuilding(w);if(b){sfx('click');openPanel(b.panel,b.arg);return;}
 if(w.y>290&&w.y<H-18&&w.x>18&&w.x<W-18){
  player.tx=clamp(w.x,34,W-34);player.ty=clamp(w.y,300,H-26);}});
cv.addEventListener('pointermove',e=>{const w=toWorld(e);
 hoverP=hitPlot(w);const b=hitBuilding(w),cr=hitCrater(w);
 cv.style.cursor=(hoverP||b||cr)?'pointer':'default';});
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=1;
 if(k.startsWith('arrow'))e.preventDefault();
 if(k==='escape')closePanel();});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0;});
const joy=$('#joy'),knob=$('#knob');let joyId=null,joyC={x:0,y:0};
function joyMove(e){const dx=e.clientX-joyC.x,dy=e.clientY-joyC.y;
 const l=Math.hypot(dx,dy)||1,m=Math.min(l,42);
 knob.style.transform=`translate(calc(-50% + ${dx/l*m}px),calc(-50% + ${dy/l*m}px))`;
 joyVec={x:dx/l*(m/42),y:dy/l*(m/42)};}
joy.addEventListener('pointerdown',e=>{Snd.init();joyId=e.pointerId;
 joy.setPointerCapture(joyId);
 const r=joy.getBoundingClientRect();joyC={x:r.left+r.width/2,y:r.top+r.height/2};joyMove(e);});
joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e);});
const joyEnd=e=>{if(e.pointerId===joyId){joyId=null;joyVec={x:0,y:0};
 knob.style.transform='translate(-50%,-50%)';}};
joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
addEventListener('touchstart',()=>document.body.classList.add('touch'),{once:true,passive:true});

/* ---------- paneles ---------- */
let curPanel=null,lastInv='seeds';
const ic=(n,cls='')=>`<svg class="ic ${cls}"><use href="#${n}"/></svg>`;
const coinI=n=>`<span class="price">${ic('i-coin')}${fmt(n)}</span>`;
const gemI=n=>`<span class="price">${ic('i-gem')}${fmt(n)}</span>`;
const rarTag=r=>`<span class="rtag" style="--rc:${RARS[r][1]}">${RARS[r][0]}</span>`;
function openPanel(name,arg){curPanel=[name,arg];renderPanel();
 $('#panelWrap').classList.remove('hide');}
function closePanel(){$('#panelWrap').classList.add('hide');curPanel=null;}
 $('#panelClose').addEventListener('click',closePanel);
 $('#panelWrap').addEventListener('click',e=>{if(e.target.id==='panelWrap')closePanel();});
function renderPanel(){if(!curPanel)return;
 const[n,a]=curPanel,P=PANELS[n](a);
 $('#panelTitle').textContent=P.t;$('#panelBody').innerHTML=P.b;
 $('#panelBody').scrollTop=0;}
function seedCard(k){const P=PLANTS[k];
 const lock=RAR_LV[P.rar]>S.level,inS=S.shop.list.includes(k),q=S.shop.qty[k];
 const sold=inS&&q!==undefined&&q<=0,col=RARS[P.rar][1];
 return`<div class="card vcard${lock?' locked':''}" data-tip="${P.desc}">
  <div class="rband" style="background:${col}"></div>
  <img class="cicon" src="${iconURL(k)}">
  <div class="cbody"><b>${P.name}</b>${rarTag(P.rar)}
   <div class="stats"><span>Crece en ${fmtT(P.grow)}</span><span>Vende por ${fmt(P.value)}</span></div></div>
  <div class="cfoot">
   <span class="stockpill ${!inS||sold?'out':'in'}">${lock?'Bloqueada':!inS?'Sin stock':sold?'Agotada':q!==undefined?'Stock: '+q:'En stock'}</span>
   ${lock?`<button class="btn dim sm" disabled>${ic('i-lock')} Nv ${RAR_LV[P.rar]}</button>`
    :!inS||sold?`<button class="btn dim sm" disabled>${ic('i-coin')} ${fmt(P.seed)}</button>`
    :`<button class="btn buy sm" data-a="buySeed:${k}">${ic('i-coin')} ${fmt(P.seed)}</button>`}
  </div></div>`;}
const PANELS={
 seeds(){return{t:'Tienda de Semillas',b:`<div class="shophead"><span class="dimtx">Reposición en <b id="shopTimer">${fmtT(Math.max(0,S.shop.t-gt))}</b> · catálogo completo siempre visible</span><button class="btn dim sm" data-a="refresh">Reponer (10 gemas)</button></div><div class="cards">${Object.keys(PLANTS).map(seedCard).join('')}</div>`};},
 pets(){const rows=S.pshop.list.map(id=>{const p=PETS.find(x=>x.id===id),owned=!!S.pets[id];
   return`<div class="card vcard" data-tip="${p.desc}"><div class="rband" style="background:${RARS[p.rar][1]}"></div>
    <img class="cicon" src="${petIconURL(id)}">
    <div class="cbody"><b>${p.name}</b>${rarTag(p.rar)}
    <div class="stats"><span>${p.desc}</span></div></div>
    <div class="cfoot">${owned?`<button class="btn dim sm" disabled>Ya es tuya</button>`
     :`<button class="btn buy sm ${p.cost.g?'gembtn':''}" data-a="buyPet:${id}">${p.cost.c?ic('i-coin')+fmt(p.cost.c):ic('i-gem')+fmt(p.cost.g)}</button>`}</div></div>`;}).join('');
  return{t:'Tienda de Mascotas',b:`<div class="shophead"><span class="dimtx">Novedades en <b id="petTimer">${fmtT(Math.max(0,S.pshop.t-gt))}</b> · equipa hasta 3 desde tu Bolsa</span><button class="btn dim sm" data-a="refreshP">Barajar (15 gemas)</button></div><div class="cards">${rows}</div>`};},
 garden(){let b=`<p class="dimtx">Parcelas desbloqueadas: ${S.plots.filter(p=>p.u).length}/30</p><h4>Parcelas</h4>`;
  const lock0=S.plots.map((p,i)=>p.sec===0&&!p.u?{p,i}:null).filter(Boolean);
  if(lock0.length)b+=`<div class="cards">`+lock0.map(({p,i})=>
   `<div class="card"><div class="cbody"><b>Parcela de huerto</b><div class="stats"><span>Un buen trozo de tierra fresca</span></div></div><button class="btn buy sm" data-a="buyPlot:${i}">${ic('i-coin')}${fmt(p.cost)}</button></div>`).join('')+`</div>`;
  else b+=`<p class="dimtx">Todas las parcelas base desbloqueadas.</p>`;
  b+=`<h4>Expansiones</h4><div class="cards">`;
  SEC.forEach((s,n)=>{b+=S.exp[n]
   ?`<div class="card owned"><div class="cbody"><b>${s.name}</b><div class="stats"><span>10 parcelas — desbloqueada</span></div></div>${ic('i-check','bigck')}</div>`
   :`<div class="card"><div class="cbody"><b>${s.name}</b><div class="stats"><span>Desbloquea 10 parcelas nuevas</span></div></div><button class="btn buy sm ${s.cur==='g'?'gembtn':''}" data-a="buySec:${n}">${s.cur==='c'?ic('i-coin')+fmt(s.cost):ic('i-gem')+fmt(s.cost)}</button></div>`;});
  b+=`</div><h4>Mejoras</h4><div class="cards">`;
  for(const k of['grow','sell','luck']){const lv=S.up[k],max=lv>=5;
   b+=`<div class="card" data-tip="${UPN[k][1]}"><div class="cbody"><b>${UPN[k][0]}</b>
    <div class="pips">${[0,1,2,3,4].map(i=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div>
    <div class="stats"><span>${UPN[k][1]}</span></div></div>
    ${max?`<button class="btn dim sm" disabled>MÁX</button>`
     :`<button class="btn buy sm" data-a="buyUp:${k}">${ic('i-coin')}${fmt(UPC[k][lv])}</button>`}</div>`;}
  b+=`</div>`;return{t:'Tienda del Huerto',b};},
 inv(tab){tab=tab||lastInv;lastInv=tab;
  let b=`<div class="tabs">${[['seeds','Semillas'],['crops','Cultivos'],['pets','Mascotas']].map(([t,l])=>
   `<button class="${tab===t?'on':''}" data-a="tab:${t}">${l}</button>`).join('')}</div>`;
  if(tab==='seeds'){
   const ks=Object.keys(S.seeds).filter(k=>S.seeds[k]>0).sort((a,b2)=>PLANTS[a].seed-PLANTS[b2].seed);
   b+=ks.length?ks.map(k=>{const P=PLANTS[k];
    return`<div class="row ${S.sel===k?'selrow':''}"><img src="${iconURL(k)}">
     <div class="cbody"><b>${P.name}</b><span class="dimtx">x${S.seeds[k]} · vende por ${fmt(P.value)} cada uno</span></div>
     <div class="rowend"><button class="btn ${S.sel===k?'go':'dim'} sm" data-a="sel:${k}">${S.sel===k?'Elegida':'Elegir'}</button></div></div>`;}).join('')
    :`<p class="dimtx">Aún no tienes semillas — ¡visita la tienda!</p>`;}
  if(tab==='crops'){
   const entries=Object.entries(S.crops).filter(([k,q])=>q>0);
   let tot=0;entries.forEach(([key])=>{const[k,m]=key.split('|');tot+=cropValue(k,m||null)*S.crops[key];});
   b+=`<div class="shophead"><span class="dimtx">Valor del inventario: <b class="goldtx">${fmt(tot)}</b></span>
    <button class="btn buy sm" data-a="sellAll">${ic('i-cart')}Vender todo</button></div>`;
   b+=entries.length?entries.map(([key,q])=>{const[k,m]=key.split('|'),P=PLANTS[k],val=cropValue(k,m||null);
    return`<div class="row"><img src="${iconURL(k,m)}">
     <div class="cbody"><b>${P.name}${m?` <span class="mtag" style="background:${MUTS[m].col}">${MUTS[m].name} x${MUTS[m].mult}</span>`:''}</b>
      <span class="dimtx">x${q} · vende por ${fmt(val)} cada uno</span></div>
     <div class="rowend"><button class="btn dim sm" data-a="sell1:${key}">Vender 1</button>
      <button class="btn go sm" data-a="sellRow:${key}">Vender todo · ${fmt(val*q)}</button></div></div>`;}).join('')
    :`<p class="dimtx">Aún no tienes cultivos — ¡cosecha algo primero!</p>`;}
  if(tab==='pets'){const ids=Object.keys(S.pets);
   b+=`<div class="shophead"><span class="dimtx">Equipadas: <b>${S.equipped.length}/3</b> — te siguen y dan bonos pasivos</span></div>`;
   b+=ids.length?ids.map(id=>{const p=PETS.find(x=>x.id===id),o=S.pets[id],eq=S.equipped.includes(id);
    return`<div class="row ${eq?'selrow':''}"><img src="${petIconURL(id)}">
     <div class="cbody"><b>${p.name} <span class="dimtx">Nv ${o.lv}</span></b>
      <span class="dimtx">${petAbilityText(p,o.lv)}</span>
      <div class="pbar"><i style="width:${clamp(o.xp/(20*o.lv),0,1)*100}%"></i></div></div>
     <div class="rowend"><button class="btn ${eq?'go':'dim'} sm" data-a="equip:${id}">${eq?'Quitar':'Equipar'}</button></div></div>`;}).join('')
    :`<p class="dimtx">Aún no tienes mascotas — ¡visita la tienda!</p>`;}
  return{t:'Bolsa',b};},
 quests(){
  const b=`<p class="dimtx">Las misiones siguen tu progreso automáticamente — al completar una, aparece otra nueva.</p>`+
   S.quests.map((q,i)=>{const pr=questProg(q),pcx=q.n?Math.round(clamp(pr/q.n,0,1)*100):0;
    return`<div class="qcard ${q.done?'done':''}">
     <div class="qrow">${ic('i-quest')}<div class="cbody"><b>${q.txt}</b>
      <span class="dimtx">${q.done?'¡Completada!':`${fmt(pr)} / ${fmt(q.n)} (${pcx}%)`}</span>
      <div class="pbar"><i id="qbar${i}" style="width:${pcx}%"></i></div></div></div>
     <div class="rew">${q.rew.c?coinI(q.rew.c):''}${q.rew.g?gemI(q.rew.g):''}
      <span class="price">${ic('i-star')}${q.rew.xp} XP</span>
      <div class="rowend">${q.done?`<button class="btn go sm" data-a="claim:${i}">Reclamar</button>`:''}</div></div></div>`;}).join('');
  return{t:'Misiones',b};},
 daily(){const claimed=S.daily.last===new Date().toDateString();
  const doneCount=claimed?((S.daily.streak-1)%7)+1:(S.daily.streak>0&&S.daily.streak%7===0?7:S.daily.streak%7);
  const cur=claimed?-1:doneCount%7;
  const tiles=DAILY.map((d,i)=>`<div class="dtile${i<doneCount?' done':''}${i===cur?' cur':''}">
   ${d.c?`<span class="price">${ic('i-coin')}${fmt(d.c)}</span>`:''}
   ${d.g?`<span class="price">${ic('i-gem')}${fmt(d.g)}</span>`:''}
   ${d.seed?`<span>${PLANTS[d.seed].name}</span>`:''}
   <span>${i===cur?'HOY':i<doneCount?'Reclamado':'Día '+(i+1)}</span></div>`).join('');
  return{t:'Recompensas Diarias',b:`<p class="dimtx">Racha actual: <b>${S.daily.streak} día${S.daily.streak===1?'':'s'}</b> — ¡reclama cada día durante una semana!</p>
   <div class="dgrid">${tiles}</div>
   <div class="rowend"><button class="btn go" data-a="claimDaily"${claimed?' disabled':''}>${claimed?'¡Vuelve mañana!':'Reclamar recompensa'}</button></div>`};},
 journal(){const st=S.stats,rare=MUT_RANK[st.rarest];
  const sg=`<div class="statgrid">
   <div>Nivel<b>${S.level}</b></div><div>Renacimientos<b>${S.rebirth}</b></div>
   <div>Tiempo de juego<b>${fmtT(st.playT)}</b></div><div>Semillas plantadas<b>${fmt(st.planted)}</b></div>
   <div>Cultivos cosechados<b>${fmt(st.harvests)}</b></div><div>Monedas ganadas<b>${fmt(st.earned)}</b></div>
   <div>Mutaciones halladas<b>${fmt(st.muts)}</b></div><div>Mutación más rara<b>${rare?MUTS[rare].name:'Ninguna'}</b></div>
   <div>Tipos de cultivo<b>${Object.keys(st.types).length}/15</b></div><div>Mascotas<b>${Object.keys(S.pets).length}/12</b></div>
   <div>Parcelas<b>${S.plots.filter(p=>p.u).length}/30</b></div><div>Logros<b>${Object.keys(S.ach).length}/${ACH.length}</b></div></div>`;
  const acs=ACH.map(a=>`<div class="card ${S.ach[a.id]?'owned':'locked'}" data-tip="${a.txt}">
   <div class="cbody"><b>${a.name}</b></div>
   ${S.ach[a.id]?ic('i-check','bigck'):`<span class="price">${ic('i-gem')}${a.g} gemas</span>`}</div>`).join('');
  const rb=`<div class="qcard"><div class="qrow">${ic('i-book')}<div class="cbody"><b>Renacer</b>
   <span class="dimtx">Reinicia monedas, cultivos, semillas, parcelas, mejoras y nivel — conservas mascotas, logros, racha diaria y estadísticas. Cada renacer da permanentemente +30% crecimiento, +15% venta y +8% suerte de mutación. Bonos actuales: crecimiento x${(1+S.rebirth*.3).toFixed(2).replace('.',',')}, venta x${(1+S.rebirth*.15).toFixed(2).replace('.',',')}, suerte x${(1+S.rebirth*.08).toFixed(2).replace('.',',')}.</span></div></div>
   <div class="rowend"><button class="btn bad sm" data-a="rebirth"${S.level<12?' disabled':''}>${S.level<12?'Se abre al nivel 12':'Renacer ahora'}</button></div></div>`;
  return{t:'Registro',b:sg+`<h4>Logros</h4><div class="cards">${acs}</div><h4>Renacer</h4>${rb}`};},
 settings(){return{t:'Ajustes',b:`
  <div class="setrow"><span>Efectos de sonido</span><button class="btn dim sm" data-a="snd">${S.snd?'SÍ':'NO'}</button></div>
  <div class="setrow"><span>Guardar partida ahora</span><button class="btn dim sm" data-a="saveNow">Guardar</button></div>
  <div class="setrow"><span>Repetir tutorial</span><button class="btn dim sm" data-a="tutRestart">Repetir</button></div>
  <div class="setrow"><span>Borrar todo el progreso</span><button class="btn bad sm" data-a="resetSave">Borrar</button></div>
  <h4>Sobre el guardado</h4>
  <div class="note">La partida se guarda automáticamente cada 15 segundos en el LocalStorage de este navegador (aparece el aviso "Guardado" abajo a la derecha). Las plantas siguen creciendo con el juego cerrado — hasta 12 horas de crecimiento sin conexión se aplican al volver. El guardado vive solo en este navegador y dispositivo: cambiar de navegador, de dispositivo o borrar los datos del sitio inicia un huerto nuevo. No hay cuentas ni sincronización entre dispositivos.</div>
  <h4>Cómo jugar</h4>
  <div class="note">Muévete con WASD / flechas, haciendo clic en el suelo o con el joystick táctil. Compra semillas en el puesto rojo de SEMILLAS, plántalas en las parcelas, cosecha cuando aparezca la burbuja "!" y véndelas en el puesto dorado de VENDER o desde tu Bolsa. Equipa hasta 3 mascotas para bonos pasivos, completa misiones y vigila el cielo: ¡los eventos climáticos potencian el crecimiento y las mutaciones!</div>`};}
};

/* ---------- menú ---------- */
const MENU=[['#m-seeds','seeds'],['#m-pets','pets'],['#m-garden','garden'],['#m-inv','inv'],
 ['#m-quest','quests'],['#m-daily','daily'],['#m-journal','journal'],['#m-set','settings']];
for(const[id,pn]of MENU)$(id).addEventListener('click',()=>{Snd.init();sfx('click');openPanel(pn);});
 $('#panelBody').addEventListener('click',e=>{
 const el=e.target.closest('[data-a]');if(!el||el.disabled)return;
 const p=el.dataset.a.split(':'),act=p[0],arg=p.slice(1).join(':');
 switch(act){
  case'buySeed':buySeed(arg);break;
  case'buyPet':buyPet(arg);break;
  case'buyPlot':buyPlot(+arg);break;
  case'buySec':buySection(+arg);break;
  case'buyUp':buyUpgrade(arg);break;
  case'refresh':if(S.gems<10){sfx('deny');toast('Reponer la tienda cuesta 10 gemas','i-gem');}
   else{S.gems-=10;refreshShop(true);updateHUD();save();}break;
  case'refreshP':if(S.gems<15){sfx('deny');toast('Barajar la tienda cuesta 15 gemas','i-gem');}
   else{S.gems-=15;refreshPShop(true);updateHUD();save();}break;
  case'tab':lastInv=arg;renderPanel();break;
  case'sel':S.sel=S.sel===arg?null:arg;sfx('click');updateHotbar();renderPanel();break;
  case'sell1':case'sellRow':{const[k,m]=arg.split('|');sellCrops(k,m||null,act==='sell1'?1:999);break;}
  case'sellAll':{let n=0;for(const key of Object.keys(S.crops)){const[k,m]=key.split('|');n+=sellCrops(k,m||null,999);}
   if(!n){sfx('deny');toast('¡Todavía no hay nada que vender!','i-bag');}break;}
  case'equip':toggleEquip(arg);renderPanel();save();break;
  case'claim':claimQuest(+arg);break;
  case'claimDaily':claimDaily();break;
  case'rebirth':tryRebirth();break;
  case'snd':S.snd=!S.snd;sfx('click');renderPanel();save();break;
  case'saveNow':save();toast('¡Partida guardada!','i-check','#58b85c');break;
  case'tutRestart':S.tut=0;closePanel();setTut(1);save();break;
  case'resetSave':confirmBox('¿Borrar todo el progreso?','Esto elimina tu partida permanentemente: monedas, mascotas, parcelas, logros... ¡todo! No se puede deshacer.',()=>{try{localStorage.removeItem(KEY);}catch(err){}location.reload();});break;
 }});

/* ---------- confirmación ---------- */
let cfCb=null;
function confirmBox(title,text,cb){$('#cfTitle').textContent=title;$('#cfText').textContent=text;
 cfCb=cb;$('#confirmWrap').classList.remove('hide');}
 $('#cfYes').addEventListener('click',()=>{$('#confirmWrap').classList.add('hide');const cb=cfCb;cfCb=null;if(cb)cb();});
 $('#cfNo').addEventListener('click',()=>{cfCb=null;$('#confirmWrap').classList.add('hide');});
 $('#confirmWrap').addEventListener('click',e=>{if(e.target.id==='confirmWrap'){cfCb=null;$('#confirmWrap').classList.add('hide');}});

/* ---------- barra de semillas ---------- */
function updateHotbar(){const hb=$('#hotbar');
 const ks=Object.keys(S.seeds).filter(k=>S.seeds[k]>0).sort((a,b)=>PLANTS[a].seed-PLANTS[b].seed);
 hb.innerHTML=ks.length?ks.map(k=>`<button class="slot${S.sel===k?' on':''}" data-k="${k}" data-tip="${PLANTS[k].name} · crece en ${fmtT(PLANTS[k].grow)} · vende por ${fmt(PLANTS[k].value)}">
  <img src="${iconURL(k)}" alt="${PLANTS[k].name}"><span class="cnt">x${S.seeds[k]}</span></button>`).join('')
  :`<span class="empty">Sin semillas — ¡visita la tienda!</span>`;
 const sn=$('#selName');
 if(S.sel&&S.seeds[S.sel]>0){sn.classList.remove('hide');
  sn.textContent=PLANTS[S.sel].name+' — toca una parcela para plantar';}
 else sn.classList.add('hide');}
 $('#hotbar').addEventListener('click',e=>{const el=e.target.closest('.slot');if(!el)return;
 Snd.init();sfx('click');const k=el.dataset.k;S.sel=S.sel===k?null:k;updateHotbar();});

/* ---------- tooltips ---------- */
const tipEl=$('#tip');
document.addEventListener('pointerover',e=>{const el=e.target.closest('[data-tip]');
 if(!el||!el.dataset.tip)return;tipEl.textContent=el.dataset.tip;tipEl.classList.remove('hide');
 const r=el.getBoundingClientRect(),tw=tipEl.offsetWidth,th=tipEl.offsetHeight;
 let x=clamp(r.left+r.width/2-tw/2,6,innerWidth-tw-6),y=r.top-th-8;
 if(y<6)y=Math.min(r.bottom+8,innerHeight-th-6);
 tipEl.style.left=x+'px';tipEl.style.top=y+'px';});
document.addEventListener('pointerout',e=>{if(e.target.closest('[data-tip]'))tipEl.classList.add('hide');});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-tip]'))tipEl.classList.add('hide');},true);

/* ---------- tutorial ---------- */
const TUT=[
 {txt:'¡Bienvenido a tu huerto! Muévete haciendo clic en el suelo, con WASD o las flechas, o con el joystick en pantallas táctiles.',tgt:null},
 {txt:'Abre la Tienda de Semillas: camina hasta el puesto rojo de SEMILLAS y tócalo, o pulsa el botón Semillas de abajo.',tgt:'#m-seeds',done:()=>curPanel&&curPanel[0]==='seeds'},
 {txt:'¡Bien! El catálogo completo está siempre visible: las comunes siempre tienen stock y las raras rotan cada 3 minutos. Compra una Zanahoria si quieres (empiezas con 3 gratis) y selecciónala en la barra de semillas.',tgt:'#hotbar',done:()=>S.sel&&S.seeds[S.sel]>0},
 {txt:'Ahora haz clic en una parcela de tierra vacía para plantar tu semilla.',tgt:null,done:()=>S.stats.planted>0},
 {txt:'¡Tu planta está creciendo! Cuando esté lista aparecerá una burbuja "!" sobre ella: haz clic en la planta para cosechar.',tgt:null,done:()=>S.stats.harvests>0},
 {txt:'¡Hora de ganar! Abre tu Bolsa, ve a la pestaña Cultivos y vende tu cosecha — o camina hasta el puesto dorado de VENDER.',tgt:'#m-inv',done:()=>S.stats.earned>0},
 {txt:'¡Ya lo sabes todo! Completa misiones, adopta mascotas en el puesto morado, mejora tu huerto y vigila el cielo: los eventos climáticos potencian tus cultivos. ¡Feliz cosecha!',tgt:null}];
function setTut(i){S.tut=i;
 if(i>TUT.length){$('#tutWrap').classList.add('hide');S.fresh=0;save();
  toast('¡Tutorial completado — feliz cosecha!','i-check','#58b85c');return;}
 const st=TUT[i-1];$('#tutTxt').textContent=st.txt;
 $('#tutStep').textContent=i+' / '+TUT.length;
 $('#tutNext').textContent=i===TUT.length?'¡Terminar!':'Siguiente';
 const hole=$('#tutHole'),el=st.tgt?$(st.tgt):null;
 if(el){const r=el.getBoundingClientRect();
  hole.style.display='block';
  hole.style.left=(r.left-6)+'px';hole.style.top=(r.top-6)+'px';
  hole.style.width=(r.width+12)+'px';hole.style.height=(r.height+12)+'px';}
 else hole.style.display='none';
 $('#tutWrap').classList.remove('hide');}
 $('#tutNext').addEventListener('click',()=>{Snd.init();sfx('click');setTut(S.tut+1);});
 $('#tutSkip').addEventListener('click',()=>{sfx('click');setTut(TUT.length+1);});

/* ---------- arranque ---------- */
function init(){
 resize();
 document.title='Grow a Garden · Mi Huerto';
 $('#tutWrap').style.pointerEvents='none';$('#tutCard').style.pointerEvents='auto';
 recalcPets();syncPetEnts();ensureQuests();
 if(!S.shop.list.length)refreshShop(true,true);
 if(!S.pshop.list.length)refreshPShop(true,true);
 const away=Math.max(0,(Date.now()-(S.ts||Date.now()))/1000);
 if(away>20){const cap=Math.min(away,12*3600);updateGrowth(cap,true);
  const grown=S.plots.filter(p=>p.p&&p.p.pr>=1).length;
  if(grown)toast(`¡Bienvenido de nuevo! Mientras estuviste fuera (${fmtT(cap)}), ${grown} planta${grown>1?'s terminaron de crecer':' terminó de crecer'}.`,'i-sprout','#58b85c');}
 updateHUD();updateHotbar();
 if(S.tut===0)setTut(1);
 requestAnimationFrame(frame);
 setInterval(save,15000);
 addEventListener('beforeunload',save);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
 setInterval(()=>{
  const st=$('#shopTimer');if(st)st.textContent=fmtT(Math.max(0,S.shop.t-gt));
  const pt=$('#petTimer');if(pt)pt.textContent=fmtT(Math.max(0,S.pshop.t-gt));
  if(curPanel&&curPanel[0]==='quests')S.quests.forEach((q,i)=>{
   const el=document.getElementById('qbar'+i);
   if(el)el.style.width=(q.n?Math.round(clamp(questProg(q)/q.n,0,1)*100):0)+'%';});
  if(S.tut>=1&&S.tut<=TUT.length&&TUT[S.tut-1].done&&TUT[S.tut-1].done()){sfx('click');setTut(S.tut+1);}
 },500);}
init();
