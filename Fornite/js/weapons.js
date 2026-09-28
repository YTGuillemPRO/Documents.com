// ============ Weapons: models, hitscan, rockets, inventory, effects ============
const effects=[];
const rockets=[];
let fireCd=0,reloading=0,reloadTotal=1,muzzleLight,flashMesh,flashT=0;
function initWeapons(){
  muzzleLight=new THREE.PointLight(0xffd9a0,0,16);scene.add(muzzleLight);
  flashMesh=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6),
    new THREE.MeshBasicMaterial({color:0xffe0a0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  scene.add(flashMesh);
}
function mmat(c,e){const m=new THREE.MeshPhongMaterial({color:c,shininess:20,flatShading:true});if(e){m.emissive=new THREE.Color(c);m.emissiveIntensity=e;}return m;}
function P(g,w,h,d,c,x,y,z,rx=0,ry=0,rz=0,e=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mmat(c,e));
  m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;g.add(m);return m;}
function C(g,r1,r2,h,c,x,y,z,rx=Math.PI/2,e=0){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,8),mmat(c,e));
  m.position.set(x,y,z);m.rotation.x=rx;m.castShadow=true;g.add(m);return m;}
function makeWeaponMesh(id,rarity=0){
  const g=new THREE.Group(),rc=RARITIES[rarity].color;
  const dark='#1a1e28',mid='#39404f',acc='#2b3140',wood='#5b4632';
  if(id==='pistol'){P(g,.09,.09,.34,mid,0,.02,.06);P(g,.085,.07,.3,dark,0,-.045,.05);P(g,.08,.2,.11,dark,0,-.15,-.09,.32);
    C(g,.02,.02,.07,dark,0,.02,.25);P(g,.018,.035,.02,dark,0,.085,.17);P(g,.04,.03,.02,dark,0,.085,-.08);P(g,.1,.022,.2,rc,0,-.012,-.02,0,0,0,.45);}
  else if(id==='smg'){P(g,.09,.13,.4,mid,0,0,.04);P(g,.08,.09,.14,acc,0,-.01,.26);C(g,.028,.028,.12,dark,0,.012,.36);
    P(g,.07,.17,.085,dark,0,-.13,.03,.12);P(g,.075,.14,.09,dark,0,-.115,-.12,.3);P(g,.028,.028,.18,dark,0,.015,-.27);
    P(g,.045,.11,.03,dark,0,-.005,-.37);P(g,.02,.045,.02,dark,0,.095,.14);P(g,.05,.04,.03,dark,0,.09,-.05);P(g,.1,.022,.26,rc,0,-.008,.05,0,0,0,.45);}
  else if(id==='ar'){P(g,.09,.13,.46,mid,0,0,.02);P(g,.1,.095,.28,acc,0,0,.36);C(g,.018,.018,.18,dark,0,.012,.58);
    C(g,.03,.026,.05,dark,0,.012,.68);P(g,.075,.14,.095,dark,0,-.125,.1,.22);P(g,.07,.11,.085,dark,0,-.215,.165,.5);
    P(g,.08,.14,.095,dark,0,-.12,-.12,.3);P(g,.065,.1,.24,acc,0,-.005,-.3);P(g,.075,.14,.045,dark,0,-.02,-.44);
    P(g,.03,.028,.42,dark,0,.09,.06);P(g,.02,.05,.02,dark,0,.115,.5);P(g,.11,.022,.3,rc,0,-.022,.06,0,0,0,.45);}
  else if(id==='shotgun'){P(g,.1,.12,.34,mid,0,0,.02);C(g,.032,.032,.4,dark,0,.035,.38);C(g,.022,.022,.34,'#141821',0,-.025,.34);
    P(g,.07,.07,.15,wood,0,-.025,.34);P(g,.065,.11,.22,wood,0,-.02,-.26,.1);P(g,.075,.15,.045,'#4a3626',0,-.035,-.39);
    P(g,.02,.03,.02,'#c9a227',0,.08,.56);P(g,.11,.022,.24,rc,0,-.015,.02,0,0,0,.45);}
  else if(id==='sniper'){P(g,.09,.12,.44,mid,0,0,0);C(g,.02,.02,.5,dark,0,.012,.46);C(g,.034,.028,.07,dark,0,.012,.74);
    C(g,.046,.046,.24,'#141821',0,.125,.02);C(g,.05,.045,.02,'#8fd0ff',0,.125,.15,Math.PI/2,.5);P(g,.03,.05,.07,dark,0,.075,.02);
    P(g,.05,.022,.022,'#b9c0cc',.07,.03,-.07);P(g,.07,.1,.1,dark,0,-.09,.07,.15);P(g,.065,.11,.28,acc,0,-.02,-.29);
    P(g,.055,.045,.13,dark,0,.065,-.28);P(g,.075,.15,.045,dark,0,-.03,-.45);P(g,.11,.022,.3,rc,0,-.02,0,0,0,0,.45);}
  else if(id==='rocket'){C(g,.09,.09,.85,'#3d4a2f',0,0,.1);C(g,.11,.11,.16,dark,0,0,.5);
    C(g,.07,.07,.12,dark,0,0,.58);C(g,.11,.09,.14,'#2b3140',0,0,-.34);
    P(g,.08,.16,.1,wood,0,-.14,-.05,.25);P(g,.06,.12,.08,dark,0,-.12,.18,.2);
    C(g,.035,.035,.2,dark,0,.1,.05);P(g,.02,.04,.02,'#ff6b4d',0,.16,.14,0,0,0,.5);
    P(g,.16,.022,.3,rc,0,-.03,.05,0,0,0,.45);}
  return g;
}
function makePickaxeMesh(){
  const g=new THREE.Group();
  const s=new THREE.Mesh(new THREE.BoxGeometry(0.09,1.0,0.09),matL('#7a5230'));s.castShadow=true;g.add(s);
  const h=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.13,0.13),matL('#9aa3ad'));h.position.y=0.5;h.castShadow=true;g.add(h);
  return g;
}
function currentInst(){return player.sel===0?'pickaxe':player.inv[player.sel-1];}
function currentDef(){const i=currentInst();return i==='pickaxe'?WEAPONS.pickaxe:(i?WEAPONS[i.id]:null);}
function selectSlot(n){player.sel=clamp(n,0,3);updateHeldWeapon();hud.refreshHotbar();}
function giveWeapon(id,rarity,reserve){
  const mk=()=>({id,rarity,mag:WEAPONS[id].mag,reserve:(reserve!=null?reserve:WEAPONS[id].mag*3)});
  for(let i=0;i<3;i++){if(!player.inv[i]){player.inv[i]=mk();if(player.sel===0)selectSlot(i+1);hud.refreshHotbar();return null;}}
  const slot=player.sel>0?player.sel-1:0,old=player.inv[slot];player.inv[slot]=mk();
  if(player.sel===0)selectSlot(slot+1);else updateHeldWeapon();hud.refreshHotbar();return old;
}
function hitmarker(crit){const el=$('hitmark');el.classList.remove('show','crit');void el.offsetWidth;
  el.classList.add('show');if(crit)el.classList.add('crit');}
function camForward(){const cp=Math.cos(player.pitch);return V3(Math.sin(player.yaw)*cp,Math.sin(player.pitch),Math.cos(player.yaw)*cp);}
function getMuzzleWorld(){const v=V3();player.holder.getWorldPosition(v);return v.addScaledVector(camForward(),0.9);}
function falloff(t,w){if(w.pellets)return t>w.range*0.55?0.5:1;return t>w.range*0.6?0.72:1;}
function jitterDir(d,s){const v=d.clone();v.x+=rand(-s,s);v.y+=rand(-s,s);v.z+=rand(-s,s);return v.normalize();}
function rayBot(o,d,ent,maxT){
  let best=-1,crit=false;const fy=ent.pos.y;
  for(const [cy,r,cf] of [[fy+0.5,0.55,false],[fy+1.15,0.6,false],[fy+1.95,0.36,true]]){
    const t=raySphere(o,d,ent.pos.x,cy,ent.pos.z,r);if(t>=0&&t<=maxT&&(best<0||t<best)){best=t;crit=cf;}}
  return{t:best,crit};
}
function castBullet(o,d,w,mult,shooter){
  const maxT=w.range;let bt=maxT,hitKind='none',hitBot=null,hitPiece=null,crit=false;
  const tt=rayTerrain(o,d,maxT);if(tt>=0&&tt<bt){bt=tt;hitKind='ground';}
  const wb=bulletsBlockRay(o,d,bt);if(wb&&wb.t<bt){bt=wb.t;hitKind=wb.piece?'piece':'wall';hitPiece=wb.piece;}
  for(const c of worldCircles){const t=rayCircleXZ(o,d,c,c.r,bt);if(t>=0&&t<bt){bt=t;hitKind='tree';hitPiece=null;}}
  for(const b of bots){if(!b.alive||b.dropping||b===shooter)continue;
    const r=rayBot(o,d,b,bt);if(r.t>=0&&r.t<bt){bt=r.t;hitKind='bot';hitBot=b;crit=r.crit;hitPiece=null;}}
  const point=o.clone().addScaledVector(d,bt);let dmg=0;
  if(hitKind==='bot'){dmg=w.dmg*mult*falloff(bt,w)*(crit?1.5:1);applyDamage(hitBot,dmg,shooter);}
  else if(hitKind==='piece'&&hitPiece)damagePiece(hitPiece,w.dmg*mult);
  if(hitKind!=='none')spawnImpact(point,hitKind==='bot'?'#ffd24a':hitKind==='ground'?'#cdb98d':hitKind==='tree'?'#8a5f38':'#d8cfbf');
  return{point,bot:hitBot,dmg,crit,kind:hitKind};
}
/* ---- RPG: proyectil real + explosión con daño en área ---- */
function spawnRocket(o,dir,shooter){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.55,8),mmat('#39404f'));
  body.rotation.x=Math.PI/2;g.add(body);
  const flame=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6),
    new THREE.MeshBasicMaterial({color:0xffc267,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0.95}));
  flame.position.z=-0.36;g.add(flame);
  g.position.copy(o);g.lookAt(o.clone().add(dir));
  const light=new THREE.PointLight(0xffb066,2.2,14);g.add(light);
  scene.add(g);
  rockets.push({g,vel:dir.clone().multiplyScalar(34),t:0,shooter});
  SFX.rocket();
}
function spawnSmoke(p){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.14,6,6),
    new THREE.MeshBasicMaterial({color:0x9aa0a8,transparent:true,opacity:0.5}));
  m.position.copy(p);scene.add(m);effects.push({type:'smoke',obj:m,ttl:0.7,max:0.7});
}
function explodeRocket(p,shooter){
  SFX.boom();
  const flash=new THREE.Mesh(new THREE.SphereGeometry(0.5,10,10),
    new THREE.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));
  flash.position.copy(p);scene.add(flash);effects.push({type:'puff',obj:flash,ttl:0.3,max:0.3});
  const light=new THREE.PointLight(0xffa050,10,40);light.position.copy(p);scene.add(light);
  effects.push({type:'light',obj:light,ttl:0.3,max:0.3});
  for(let i=0;i<7;i++)spawnSmoke(p.clone().add(V3(rand(-1,1),rand(0,1.5),rand(-1,1))));
  spawnImpact(p,'#ffd9a0');
  const R=6.5;
  for(const b of bots){if(!b.alive||b.dropping)continue;
    const d=Math.sqrt(dist2(b.pos.x,b.pos.z,p.x,p.z)+(b.pos.y-p.y)*(b.pos.y-p.y));
    if(d<R)applyDamage(b,120*(1-d/R)+20,shooter);}
  if(player.alive&&!player.dropping){
    const d=Math.sqrt(dist2(player.pos.x,player.pos.z,p.x,p.z)+(player.pos.y-p.y)*(player.pos.y-p.y));
    if(d<R)applyDamage(player,(120*(1-d/R)+20)*0.6,shooter===player?null:shooter);
  }
  for(const pc of [...pieces]){if(pc.dead)continue;
    const d=Math.sqrt(dist2(pc.x,pc.z,p.x,p.z)+(pc.y-p.y)*(pc.y-p.y));
    if(d<R+2)damagePiece(pc,160);}
}
function updateRockets(dt){
  for(let i=rockets.length-1;i>=0;i--){
    const r=rockets[i];r.t+=dt;
    const from=r.g.position.clone(),dir=r.vel.clone().normalize(),stepLen=r.vel.length()*dt;
    let hit=null;
    const tt=rayTerrain(from,dir,stepLen+0.1);
    if(tt>=0&&tt<=stepLen+0.1)hit=from.clone().addScaledVector(dir,tt);
    if(!hit){const wb=bulletsBlockRay(from,dir,stepLen+0.1);if(wb)hit=from.clone().addScaledVector(dir,wb.t);}
    if(!hit){for(const c of worldCircles){const t2=rayCircleXZ(from,dir,c,c.r,stepLen+0.1);if(t2>=0){hit=from.clone().addScaledVector(dir,t2);break;}}}
    if(!hit){for(const b of bots){if(!b.alive||b.dropping||b===r.shooter)continue;
      const rb=rayBot(from,dir,b,stepLen+0.1);if(rb.t>=0){hit=from.clone().addScaledVector(dir,rb.t);break;}}}
    if(hit||r.t>4){
      explodeRocket(hit||from.clone().addScaledVector(dir,stepLen),r.shooter);
      scene.remove(r.g);rockets.splice(i,1);continue;
    }
    r.g.position.addScaledVector(r.vel,dt);
    if(Math.random()<0.7)spawnSmoke(r.g.position);
  }
}
function fireGun(inst,def){
  inst.mag--;fireCd=def.rof;
  const dir=camForward(),muzzle=getMuzzleWorld();
  if(def.projectile){
    spawnRocket(muzzle.clone().addScaledVector(dir,0.5),dir,player);
    player.pitch+=def.kick;
    flashMesh.position.copy(muzzle);flashMesh.scale.setScalar(1.8);flashT=0.06;
    muzzleLight.position.copy(muzzle);muzzleLight.intensity=4;
    hud.kickCrosshair();hud.refreshHotbar();
    if(inst.mag===0)tryReload();
    return;
  }
  const mult=RARITIES[inst.rarity].mult;
  const o=V3(player.pos.x,player.pos.y+1.55,player.pos.z).addScaledVector(dir,0.6);
  const moving=Math.hypot(player.vel.x,player.vel.z)>2;
  const spread=def.spread*(player.aiming?0.45:1)*(moving?1.5:1)*(player.grounded?1:1.8);
  const agg=new Map(),n=def.pellets||1;
  for(let i=0;i<n;i++){const res=castBullet(o,jitterDir(dir,spread),def,mult,player);
    spawnTracer(muzzle,res.point,0xfff3c0);
    if(res.bot){const a=agg.get(res.bot)||{d:0,c:false,p:res.point};a.d+=res.dmg;a.c=a.c||res.crit;a.p=res.point;agg.set(res.bot,a);}}
  for(const [,a] of agg){hud.damageNumber(a.p,Math.round(a.d),a.c);hitmarker(a.c);a.c?SFX.crit():SFX.hit();}
  player.pitch+=def.kick;
  muzzleLight.position.copy(muzzle);muzzleLight.intensity=3;
  flashMesh.position.copy(muzzle);flashMesh.scale.setScalar(rand(0.8,1.6));flashT=0.05;
  hud.kickCrosshair();hud.refreshHotbar();SFX.shot(inst.id);
  if(inst.mag===0)tryReload();
}
function swingPickaxe(){
  player.swingT=0.28;
  const dir=camForward(),o=V3(player.pos.x,player.pos.y+1.55,player.pos.z);
  let bt=3.8,kind=null,obj=null;
  for(const c of worldCircles){const t=rayCircleXZ(o,dir,c,c.r+0.3,bt);if(t>=0&&t<bt){bt=t;kind=c.kind;obj=c;}}
  for(const p of pieces){if(p.dead)continue;
    const b=p.type==='wall'?p.aabb:{minX:p.x-2,maxX:p.x+2,minY:p.y,maxY:p.y+4.3,minZ:p.z-2,maxZ:p.z+2};
    const t=rayAABB(o,dir,b,bt);if(t>=0&&t<bt){bt=t;kind='piece';obj=p;}}
  for(const b of bots){if(!b.alive||b.dropping)continue;const r=rayBot(o,dir,b,bt);if(r.t>=0&&r.t<bt){bt=r.t;kind='bot';obj=b;}}
  const point=o.clone().addScaledVector(dir,bt);
  if(kind==='tree'){player.mats=Math.min(CFG.MATS_MAX,player.mats+10);hud.floatText(point,'+10');SFX.chop();spawnImpact(point,'#8a5f38');hud.refreshHotbar();}
  else if(kind==='rock'){player.mats=Math.min(CFG.MATS_MAX,player.mats+15);hud.floatText(point,'+15');SFX.chop();spawnImpact(point,'#aab0b8');hud.refreshHotbar();}
  else if(kind==='piece'){damagePiece(obj,55);SFX.chop();spawnImpact(point,'#c49a62');}
  else if(kind==='bot'){applyDamage(obj,20,player);spawnImpact(point,'#ffd24a');SFX.hit();}
  else SFX.chop();
}
function tryReload(){
  const inst=currentInst();if(!inst||inst==='pickaxe')return;
  const def=WEAPONS[inst.id];
  if(reloading>0||inst.mag>=def.mag||inst.reserve<=0)return;
  reloading=def.reload;reloadTotal=def.reload;
}
function finishReload(){
  const inst=currentInst();if(!inst||inst==='pickaxe')return;
  const def=WEAPONS[inst.id],need=def.mag-inst.mag,take=Math.min(need,inst.reserve);
  inst.mag+=take;inst.reserve-=take;hud.refreshHotbar();
}
function updateHeldWeapon(){
  const h=player.holder;if(!h)return;
  while(h.children.length)h.remove(h.children[h.children.length-1]);
  reloading=0;
  const inst=currentInst();
  if(inst==='pickaxe'||!inst){const pk=makePickaxeMesh();pk.rotation.set(0.3,0,-0.6);h.add(pk);player.limbs.rArm.rotation.x=-0.5;}
  else{const m=makeWeaponMesh(inst.id,inst.rarity);m.scale.set(1.25,1.25,1.25);h.add(m);player.limbs.rArm.rotation.x=-1.25;}
  hud.refreshHotbar();
}
function updateWeapons(dt){
  fireCd-=dt;
  if(reloading>0){reloading-=dt;if(reloading<=0)finishReload();}
  muzzleLight.intensity=Math.max(0,muzzleLight.intensity-dt*26);
  if(flashT>0){flashT-=dt;flashMesh.material.opacity=Math.max(0,flashT/0.05)*0.95;}
  updateRockets(dt);
  if(!player.alive||player.dropping||game.state!=='PLAY')return;
  if(buildMode){if(game.lmb)tryPlaceFromPlayer();return;}
  if(player.emoteT>0)return;
  const inst=currentInst();if(!inst)return;
  if(inst==='pickaxe'){if(game.lmb&&fireCd<=0&&player.using===null){fireCd=WEAPONS.pickaxe.rof;swingPickaxe();}return;}
  const def=WEAPONS[inst.id],want=def.auto?game.lmb:game.lmbClick;
  if(want&&fireCd<=0&&player.using===null){if(inst.mag<=0){SFX.empty();tryReload();}else fireGun(inst,def);}
}
function spawnTracer(a,b,color){
  const g=new THREE.BufferGeometry().setFromPoints([a,b]);
  const m=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:0.9}));
  scene.add(m);effects.push({type:'line',obj:m,ttl:0.07,max:0.07});
  if(effects.length>90){const e=effects.shift();scene.remove(e.obj);}
}
function spawnImpact(p,color){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.95}));
  m.position.copy(p);scene.add(m);effects.push({type:'puff',obj:m,ttl:0.22,max:0.22});
}
function updateEffects(dt){
  for(let i=effects.length-1;i>=0;i--){
    const e=effects[i];
    if(e.type==='fall'){e.group.rotation.z=Math.min(Math.PI/2,e.group.rotation.z+dt*5);
      if(e.t>1.2)e.group.position.y-=dt*1.6;
      if(e.t>2.2){scene.remove(e.group);effects.splice(i,1);continue;}e.t+=dt;continue;}
    e.ttl-=dt;
    if(e.type==='puff'){const k=1-e.ttl/e.max;e.obj.scale.setScalar(1+k*5);e.obj.material.opacity=0.95*(e.ttl/e.max);}
    if(e.type==='smoke'){e.obj.position.y+=dt*0.9;const k=e.ttl/e.max;e.obj.material.opacity=0.5*k;e.obj.scale.setScalar(1+(1-k)*2.2);}
    if(e.type==='light'){e.obj.intensity=10*Math.max(0,e.ttl/e.max);}
    if(e.type==='line')e.obj.material.opacity=0.9*(e.ttl/e.max);
    if(e.ttl<=0){scene.remove(e.obj);if(e.obj.geometry)e.obj.geometry.dispose();if(e.obj.material)e.obj.material.dispose();effects.splice(i,1);}}
}
