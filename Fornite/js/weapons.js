// ============ Hitscan shooting, tracers, impacts, damage numbers ============
const effects=[];
let fireCd=0, reloading=0, reloadTotal=1, muzzleLight;

function initWeapons(){ muzzleLight=new THREE.PointLight(0xffd9a0,0,16); scene.add(muzzleLight); }

function makeWeaponMesh(id,rarity=0){
  const g=new THREE.Group();
  const B=(w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matL(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
  const dark='#232833',mid='#3a4254';
  if(id==='pistol'){B(0.14,0.2,0.34,mid,0,0,0.1);B(0.12,0.26,0.14,dark,0,-0.16,-0.06);B(0.06,0.06,0.2,dark,0,0.05,0.3);}
  if(id==='smg'){B(0.14,0.22,0.5,mid,0,0,0.1);B(0.1,0.3,0.14,dark,0,-0.2,-0.08);B(0.08,0.08,0.26,dark,0,0.04,0.42);B(0.1,0.22,0.1,dark,0,-0.16,0.16);}
  if(id==='ar'){B(0.14,0.22,0.72,mid,0,0,0.12);B(0.1,0.26,0.16,dark,0,-0.2,-0.14);B(0.07,0.07,0.34,dark,0,0.04,0.58);B(0.12,0.18,0.18,'#4a3a28',0,-0.02,-0.28);}
  if(id==='shotgun'){B(0.16,0.2,0.66,mid,0,0,0.1);B(0.1,0.24,0.18,'#5b4632',0,-0.16,-0.2);B(0.09,0.09,0.3,dark,0,-0.02,0.5);}
  if(id==='sniper'){B(0.13,0.2,0.95,mid,0,0,0.15);B(0.1,0.24,0.2,dark,0,-0.18,-0.3);B(0.06,0.06,0.4,dark,0,0.03,0.75);B(0.09,0.12,0.3,dark,0,0.16,0.05);}
  B(0.16,0.05,0.22,RARITIES[rarity].color,0,0.12,0); // rarity stripe
  return g;
}
function makePickaxeMesh(){
  const g=new THREE.Group();
  const s=new THREE.Mesh(new THREE.BoxGeometry(0.09,1.0,0.09),matL('#7a5230')); s.castShadow=true; g.add(s);
  const h=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.13,0.13),matL('#9aa3ad')); h.position.y=0.5; h.castShadow=true; g.add(h);
  return g;
}

function currentInst(){ return player.sel===0?'pickaxe':player.inv[player.sel-1]; }
function currentDef(){ const i=currentInst(); return i==='pickaxe'?WEAPONS.pickaxe:(i?WEAPONS[i.id]:null); }

function camForward(){ const cp=Math.cos(player.pitch); return V3(Math.sin(player.yaw)*cp,Math.sin(player.pitch),Math.cos(player.yaw)*cp); }
function getMuzzleWorld(){ const v=V3(); player.holder.getWorldPosition(v); return v.addScaledVector(camForward(),0.9); }

function falloff(t,w){ if(w.pellets)return t>w.range*0.55?0.5:1; return t>w.range*0.6?0.72:1; }
function jitterDir(d,s){ const v=d.clone(); v.x+=rand(-s,s); v.y+=rand(-s,s); v.z+=rand(-s,s); return v.normalize(); }

function rayBot(o,d,ent,maxT){
  let best=-1,crit=false;
  const fy=ent.pos.y;
  for(const [cy,r,cf] of [[fy+0.5,0.55,false],[fy+1.15,0.6,false],[fy+1.95,0.36,true]]){
    const t=raySphere(o,d,ent.pos.x,cy,ent.pos.z,r);
    if(t>=0&&t<=maxT&&(best<0||t<best)){best=t;crit=cf;}
  }
  return {t:best,crit};
}

// Full hitscan: terrain → walls → trees/rocks → bots. Applies damage itself.
function castBullet(o,d,w,mult,shooter){
  const maxT=w.range;
  let bt=maxT,hitKind='none',hitBot=null,hitPiece=null,crit=false;
  const tt=rayTerrain(o,d,maxT); if(tt>=0&&tt<bt){bt=tt;hitKind='ground';}
  const wb=bulletsBlockRay(o,d,bt); if(wb&&wb.t<bt){bt=wb.t;hitKind=wb.piece?'piece':'wall';hitPiece=wb.piece;}
  for(const c of worldCircles){ const t=rayCircleXZ(o,d,c,c.r,bt); if(t>=0&&t<bt){bt=t;hitKind='tree';hitPiece=null;} }
  for(const b of bots){
    if(!b.alive||b.dropping||b===shooter)continue;
    const r=rayBot(o,d,b,bt); if(r.t>=0&&r.t<bt){bt=r.t;hitKind='bot';hitBot=b;crit=r.crit;hitPiece=null;}
  }
  const point=o.clone().addScaledVector(d,bt);
  let dmg=0;
  if(hitKind==='bot'){ dmg=w.dmg*mult*falloff(bt,w)*(crit?1.5:1); applyDamage(hitBot,dmg,shooter); }
  else if(hitKind==='piece'&&hitPiece){ damagePiece(hitPiece,w.dmg*mult); }
  if(hitKind!=='none')spawnImpact(point,hitKind==='bot'?'#ffd24a':hitKind==='ground'?'#cdb98d':hitKind==='tree'?'#8a5f38':'#d8cfbf');
  return {point,bot:hitBot,dmg,crit,kind:hitKind};
}

function fireGun(inst,def){
  inst.mag--; fireCd=def.rof;
  const mult=RARITIES[inst.rarity].mult;
  const dir=camForward();
  const o=V3(player.pos.x,player.pos.y+1.55,player.pos.z).addScaledVector(dir,0.6);
  const moving=Math.hypot(player.vel.x,player.vel.z)>2;
  const spread=def.spread*(player.aiming?0.45:1)*(moving?1.5:1)*(player.grounded?1:1.8);
  const muzzle=getMuzzleWorld();
  const agg=new Map();
  const n=def.pellets||1;
  for(let i=0;i<n;i++){
    const res=castBullet(o,jitterDir(dir,spread),def,mult,player);
    spawnTracer(muzzle,res.point,0xfff3c0);
    if(res.bot){ const a=agg.get(res.bot)||{d:0,c:false,p:res.point}; a.d+=res.dmg; a.c=a.c||res.crit; a.p=res.point; agg.set(res.bot,a); }
  }
  for(const [,a] of agg){
    hud.damageNumber(a.p,Math.round(a.d),a.c);
    a.c?SFX.crit():SFX.hit();
  }
  player.pitch+=def.kick;
  muzzleLight.position.copy(muzzle); muzzleLight.intensity=3;
  hud.kickCrosshair(); hud.updateAmmo();
  SFX.shot(inst.id);
  if(inst.mag===0)tryReload();
}

function swingPickaxe(){
  player.swingT=0.28;
  const dir=camForward();
  const o=V3(player.pos.x,player.pos.y+1.55,player.pos.z);
  let bt=3.8,kind=null,obj=null;
  for(const c of worldCircles){ const t=rayCircleXZ(o,dir,c,c.r+0.3,bt); if(t>=0&&t<bt){bt=t;kind=c.kind;obj=c;} }
  for(const p of pieces){ if(p.dead)continue;
    const b=p.type==='wall'?p.aabb:{minX:p.x-2,maxX:p.x+2,minY:p.y,maxY:p.y+4.3,minZ:p.z-2,maxZ:p.z+2};
    const t=rayAABB(o,dir,b,bt); if(t>=0&&t<bt){bt=t;kind='piece';obj=p;} }
  for(const b of bots){ if(!b.alive||b.dropping)continue;
    const r=rayBot(o,dir,b,bt); if(r.t>=0&&r.t<bt){bt=r.t;kind='bot';obj=b;} }
  const point=o.clone().addScaledVector(dir,bt);
  if(kind==='tree'){ player.mats=Math.min(CFG.MATS_MAX,player.mats+10); hud.floatText(point,'+10','#e0b174'); SFX.chop(); spawnImpact(point,'#8a5f38'); }
  else if(kind==='rock'){ player.mats=Math.min(CFG.MATS_MAX,player.mats+15); hud.floatText(point,'+15','#c8ced6'); SFX.chop(); spawnImpact(point,'#aab0b8'); }
  else if(kind==='piece'){ damagePiece(obj,55); SFX.chop(); spawnImpact(point,'#c49a62'); }
  else if(kind==='bot'){ applyDamage(obj,20,player); spawnImpact(point,'#ffd24a'); SFX.hit(); }
  else SFX.chop();
}

function tryReload(){
  const inst=currentInst();
  if(!inst||inst==='pickaxe')return;
  const def=WEAPONS[inst.id];
  if(reloading>0||inst.mag>=def.mag||inst.reserve<=0)return;
  reloading=def.reload; reloadTotal=def.reload; hud.showReload(true);
}
function finishReload(){
  const inst=currentInst(); if(!inst||inst==='pickaxe'){hud.showReload(false);return;}
  const def=WEAPONS[inst.id], need=def.mag-inst.mag, take=Math.min(need,inst.reserve);
  inst.mag+=take; inst.reserve-=take; hud.showReload(false); hud.updateAmmo();
}

function updateHeldWeapon(){
  const h=player.holder;
  while(h.children.length)h.remove(h.children[h.children.length-1]);
  reloading=0; hud.showReload(false);
  const inst=currentInst();
  if(inst==='pickaxe'||!inst){
    const pk=makePickaxeMesh(); pk.rotation.set(0.3,0,-0.6); h.add(pk);
    player.limbs.rArm.rotation.x=-0.5;
  } else {
    const m=makeWeaponMesh(inst.id,inst.rarity); m.scale.set(1.25,1.25,1.25); h.add(m);
    player.limbs.rArm.rotation.x=-1.25;
  }
  hud.updateAmmo();
}

function updateWeapons(dt){
  fireCd-=dt;
  if(reloading>0){ reloading-=dt; hud.reloadProgress(1-reloading/reloadTotal); if(reloading<=0)finishReload(); }
  muzzleLight.intensity=Math.max(0,muzzleLight.intensity-dt*26);
  if(!player.alive||player.dropping||game.state!=='PLAY')return;
  if(buildMode){ if(game.lmb)tryPlaceFromPlayer(); return; }
  const inst=currentInst(); if(!inst)return;
  if(inst==='pickaxe'){ if(game.lmb&&fireCd<=0&&player.using===null){ fireCd=WEAPONS.pickaxe.rof; swingPickaxe(); } return; }
  const def=WEAPONS[inst.id];
  const want=def.auto?game.lmb:game.lmbClick;
  if(want&&fireCd<=0&&player.using===null){
    if(inst.mag<=0){ SFX.empty(); tryReload(); } else fireGun(inst,def);
  }
}

// --- visual effects ------------------------------------------------------
function spawnTracer(a,b,color){
  const g=new THREE.BufferGeometry().setFromPoints([a,b]);
  const m=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:0.9}));
  scene.add(m); effects.push({type:'line',obj:m,ttl:0.07,max:0.07});
  if(effects.length>90){const e=effects.shift();scene.remove(e.obj);}
}
function spawnImpact(p,color){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),
    new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.95}));
  m.position.copy(p); scene.add(m); effects.push({type:'puff',obj:m,ttl:0.22,max:0.22});
}
function updateEffects(dt){
  for(let i=effects.length-1;i>=0;i--){
    const e=effects[i]; e.ttl-=dt;
    if(e.type==='puff'){ const k=1-e.ttl/e.max; e.obj.scale.setScalar(1+k*5); e.obj.material.opacity=0.95*(e.ttl/e.max); }
    if(e.type==='line')e.obj.material.opacity=0.9*(e.ttl/e.max);
    if(e.type==='fall'){
      e.group.rotation.z=Math.min(Math.PI/2,e.group.rotation.z+dt*5);
      if(e.t>1.2)e.group.position.y-=dt*1.6;
      if(e.t>2.2){ scene.remove(e.group); effects.splice(i,1); continue; }
      e.t+=dt; continue;
    }
    if(e.ttl<=0){ scene.remove(e.obj); e.obj.geometry&&e.obj.geometry.dispose(); e.obj.material&&e.obj.material.dispose(); effects.splice(i,1); }
  }
}
