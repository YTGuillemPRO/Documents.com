const $=id=>document.getElementById(id);
const V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const rand=(a,b)=>a+Math.random()*(b-a), randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)], clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function lerpAngle(a,b,t){let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return a+d*clamp(t,0,1);}
function dist2(ax,az,bx,bz){const dx=ax-bx,dz=az-bz;return dx*dx+dz*dz;}
function weighted(p){let s=0;for(const q of p)s+=q[1];let r=Math.random()*s;
  for(const q of p){r-=q[1];if(r<=0)return q[0];}return p[0][0];}
function hash2(x,z){const s=Math.sin(x*12.9898+z*78.233)*43758.5453;return s-Math.floor(s);}
function fmt(t){t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
function smoothstep(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);}
const NAME_A=['Sweaty','Cracked','NoScope','Laser','Tryhard','Default','Bush','Tomato','Tilted','Loot','Zero','OneShot','Clutch','WKey','Double','Mats','Crouch','Peely','Llama','Drift'];
const NAME_B=['Raptor','Banana','Ninja','Goblin','Panda','Falcon','Wolf','Shark','Gnome','Knight','Viking','Robot','Bandit','Chief','Rex','Gamer','Sniper','Pickle','Fish','Wizard'];
function makeBotName(used){for(let i=0;i<50;i++){const n=pick(NAME_A)+pick(NAME_B);if(!used.has(n)){used.add(n);return n;}}return 'Bot'+randi(1000,9999);}
