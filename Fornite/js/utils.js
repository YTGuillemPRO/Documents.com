const $ = id => document.getElementById(id);
const V3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const rand = (a,b) => a + Math.random()*(b-a);
const randi = (a,b) => Math.floor(rand(a,b+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const clamp = (v,a,b) => v<a?a:v>b?b:v;
const lerp = (a,b,t) => a+(b-a)*t;
function lerpAngle(a,b,t){ let d=(b-a)%(Math.PI*2); if(d>Math.PI)d-=Math.PI*2; if(d<-Math.PI)d+=Math.PI*2; return a+d*clamp(t,0,1); }
function dist2(ax,az,bx,bz){ const dx=ax-bx,dz=az-bz; return dx*dx+dz*dz; }
function weighted(pairs){ let s=0; for(const p of pairs)s+=p[1]; let r=Math.random()*s;
  for(const p of pairs){ r-=p[1]; if(r<=0) return p[0]; } return pairs[0][0]; }
function hash2(x,z){ const s=Math.sin(x*12.9898+z*78.233)*43758.5453; return s-Math.floor(s); }

// The single source of truth for ground height — terrain mesh, players,
// bots, loot and buildings all sit on this function.
function terrainHeight(x,z){
  return Math.sin(x*0.012)*Math.cos(z*0.014)*6.5
       + Math.sin(x*0.031+1.7)*Math.cos(z*0.023+2.3)*2.8
       + Math.sin(x*0.083+4.1)*Math.sin(z*0.077+1.2)*1.1;
}

const NAME_A=['Sweaty','Cracked','NoScope','Laser','Tryhard','Default','Bush','Tomato','Tilted','Loot','Zero','OneShot','Clutch','WKey','Double','Mats','Crouch','Peely','Llama','Drift','Boxed','Bush'];
const NAME_B=['Raptor','Banana','Ninja','Goblin','Panda','Falcon','Wolf','Shark','Gnome','Knight','Viking','Robot','Bandit','Chief','Rex','Llama','Gamer','Sniper','Pickle','Monkey','Fish','Wizard'];
function makeBotName(used){
  for(let i=0;i<50;i++){ const n=pick(NAME_A)+pick(NAME_B); if(!used.has(n)){ used.add(n); return n; } }
  return 'Bot'+randi(1000,9999);
}
