const player={name:'YOU',isPlayer:true,pos:V3(),vel:V3(),yaw:0,pitch:-0.12,hp:100,shield:0,alive:true,kills:0,
mats:CFG.MATS_START,shieldPots:1,medkits:1,sel:0,inv:[null,null,null],grounded:false,dropping:true,gliding:false,
aiming:false,using:null,swingT:0,runT:0,tier:0,emoteT:0,group:null,limbs:null,holder:null,glider:null};
function makeCharacter(o){
  const g=new THREE.Group();
  const limb=(w,h,d,c,px,py)=>{const p=new THREE.Group();p.position.set(px,py,0);
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matL(c));m.position.y=-h/2;m.castShadow=true;p.add(m);g.add(p);return p;};
  const lLeg=limb(0.3,0.62,0.32,o.pants,-0.19,0.85),rLeg=limb(0.3,0.62,0.32,o.pants,0.19,0.85);
  for(const lg of [lLeg,rLeg]){
    const boot=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.26,0.36),matL('#2a2d36'));
    boot.position.set(0,-0.74,0.03);boot.castShadow=true;lg.add(boot);}
  const torso=new THREE.Mesh(new THREE.BoxGeometry(0.86,0.82,0.46),matL(o.shirt));torso.position.y=1.27;torso.castShadow=true;g.add(torso);
  const vest=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.58,0.1),matL(o.pack));vest.position.set(0,1.32,0.24);g.add(vest);
  const belt=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.12,0.5),matL('#3a3226'));belt.position.y=0.9;g.add(belt);
  const buckle=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.1,0.06),matL('#c9a227'));buckle.position.set(0,0.9,0.26);g.add(buckle);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5),matL(o.skin));head.position.y=1.98;head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.BoxGeometry(0.54,0.18,0.54),matL(o.hair));hair.position.set(0,2.26,-0.02);g.add(hair);
  if(Math.random()<0.4){const brim=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.06,0.26),matL(o.hair));brim.position.set(0,2.2,0.34);g.add(brim);}
  for(const s of [-0.12,0.12]){const e=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.09,0.05),matL('#20242c'));e.position.set(s,2.0,0.26);g.add(e);}
  const pack=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.6,0.24),matL(o.pack));pack.position.set(0,1.35,-0.36);pack.castShadow=true;g.add(pack);
  const lArm=limb(0.24,0.68,0.26,o.shirt,-0.56,1.6),rArm=limb(0.24,0.68,0.26,o.shirt,0.56,1.6);
  for(const a of [lArm,rArm]){const glove=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.14,0.22),matL('#2a2d36'));glove.position.y=-0.72;a.add(glove);}
  const holder=new THREE.Group();holder.position.set(0.52,1.5,0.28);g.add(holder);
  return{group:g,lLeg,rLeg,lArm,rArm,holder};
}
function initPlayer(){
  player.glider=new THREE.Group();
  const can=new THREE.Mesh(new THREE.ConeGeometry(2.4,0.9,6),matL('#ff5b4d'));can.castShadow=true;
  player.glider.add(can);player.glider.visible=false;scene.add(player.glider);
}
function applyOutfit(o){
  curOutfit=o;
  if(player.group)scene.remove(player.group);
  const c=makeCharacter({shirt:o.shirt,pants:o.pants,skin:o.skin,hair:o.hair,pack:o.pack});
  player.group=c.group;player.limbs={lLeg:c.lLeg,rLeg:c.rLeg,lArm:c.lArm,rArm:c.rArm};player.holder=c.holder;
  scene.add(c.group);updateHeldWeapon();
}
function resetPlayer(){
  const p=player,a=rand(0,6.28),r=rand(60,130);
  p.pos.set(Math.cos(a)*r,150,Math.sin(a)*r);p.vel.set(0,0,0);p.yaw=rand(0,6.28);p.pitch=-0.5;
  p.hp=100;p.shield=0;p.alive=true;p.kills=0;p.mats=CFG.MATS_START;p.shieldPots=1;p.medkits=1;
  p.sel=0;p.inv=[null,null,null];p.dropping=true;p.gliding=false;p.aiming=false;p.using=null;p.swingT=0;p.grounded=false;p.emoteT=0;
  p.glider.visible=false;updateHeldWeapon();hud.refreshHotbar();
}
function useShieldPot(){const p=player;if(p.shieldPots>0&&p.shield<100&&p.using===null&&!p.dropping)p.using={kind:'shield',t:2,total:2};}
function useMedkit(){const p=player;if(p.medkits>0&&p.hp<100&&p.using===null&&!p.dropping)p.using={kind:'med',t:3.2,total:3.2};}
function startEmote(){const p=player;if(game.state==='PLAY'&&p.alive&&!p.dropping&&p.emoteT<=0&&p.using===null){p.emoteT=2.4;SFX.emote();}}
function updatePlayer(dt){
  const p=player;if(!p.alive)return;
  const k=game.keys,ground0=terrainHeight(p.pos.x,p.pos.z);
  if(p.dropping){
    p.vel.y=p.gliding?-7.5:-38;
    const ix=(k.KeyD?1:0)-(k.KeyA?1:0),iz=(k.KeyW?1:0)-(k.KeyS?1:0);
    const f={x:Math.sin(p.yaw),z:Math.cos(p.yaw)},r={x:-Math.cos(p.yaw),z:Math.sin(p.yaw)};
    let mx=f.x*iz+r.x*ix,mz=f.z*iz+r.z*iz;const ml=Math.hypot(mx,mz)||1;mx/=ml;mz/=ml;
    const sp=p.gliding?11:14;
    p.vel.x+=((ix||iz?mx*sp:0)-p.vel.x)*Math.min(1,dt*3);
    p.vel.z+=((ix||iz?mz*sp:0)-p.vel.z)*Math.min(1,dt*3);
    if(!p.gliding&&p.pos.y-ground0<42){p.gliding=true;p.glider.visible=true;hud.announce('GLIDER DEPLOYED','',1100);}
    p.pos.addScaledVector(p.vel,dt);
    p.pos.x=clamp(p.pos.x,-235,235);p.pos.z=clamp(p.pos.z,-235,235);
    if(p.pos.y<=ground0){p.pos.y=ground0;p.vel.set(0,0,0);p.dropping=false;p.gliding=false;p.glider.visible=false;
      game.state='PLAY';SFX.thud();hud.announce('FIGHT!','Loot up — last one standing wins',2400);}
  }else{
    if(p.using){p.using.t-=dt;
      if(p.using.t<=0){if(p.using.kind==='shield'){p.shield=Math.min(100,p.shield+50);p.shieldPots--;}
        else{p.hp=Math.min(100,p.hp+100);p.medkits--;}
        SFX.heal();p.using=null;hud.refreshHotbar();}}
    const em=p.emoteT>0;
    const ix=em?0:((k.KeyD?1:0)-(k.KeyA?1:0)),iz=em?0:((k.KeyW?1:0)-(k.KeyS?1:0));
    const sprint=(k.ShiftLeft||k.ShiftRight)&&(ix!==0||iz!==0)&&p.using===null&&!p.aiming;
    let sp=sprint?CFG.SPRINT:CFG.WALK;if(p.using)sp*=0.5;if(p.aiming)sp*=0.62;if(em)sp=0;
    const f={x:Math.sin(p.yaw),z:Math.cos(p.yaw)},r={x:-Math.cos(p.yaw),z:Math.sin(p.yaw)};
    let mx=f.x*iz+r.x*ix,mz=f.z*iz+r.z*iz;const ml=Math.hypot(mx,mz);if(ml>0){mx/=ml;mz/=ml;}
    p.vel.x+=(mx*sp-p.vel.x)*Math.min(1,dt*11);p.vel.z+=(mz*sp-p.vel.z)*Math.min(1,dt*11);
    p.vel.y-=CFG.GRAVITY*dt;
    if(k.Space&&p.grounded&&!em){p.vel.y=CFG.JUMP;p.grounded=false;}
    p.pos.x+=p.vel.x*dt;p.pos.y+=p.vel.y*dt;p.pos.z+=p.vel.z*dt;
    p.pos.x=clamp(p.pos.x,-236,236);p.pos.z=clamp(p.pos.z,-236,236);
    collideEntity(p,CFG.PLAYER_R);
    const ground=supportHeight(p.pos.x,p.pos.z,p.pos.y);
    if(p.pos.y<=ground+0.001&&p.vel.y<=0){p.pos.y=ground;p.vel.y=0;p.grounded=true;}
    else if(p.pos.y<ground){p.pos.y=ground;p.grounded=true;}
    else p.grounded=false;
    const spd=Math.hypot(p.vel.x,p.vel.z);
    if(spd>0.5&&p.grounded&&p.emoteT<=0){p.runT+=dt*spd*1.35;const a=Math.sin(p.runT)*0.6*Math.min(1,spd/6);
      p.limbs.lLeg.rotation.x=a;p.limbs.rLeg.rotation.x=-a;}
    else if(p.emoteT<=0){p.limbs.lLeg.rotation.x*=0.8;p.limbs.rLeg.rotation.x*=0.8;}
    if(p.emoteT>0){
      p.emoteT-=dt;
      const w=Math.sin(game.time*10);
      p.limbs.lArm.rotation.x=w*1.3-0.6;p.limbs.rArm.rotation.x=-w*1.3-0.6;
      p.limbs.lLeg.rotation.x=Math.sin(game.time*5)*0.35;p.limbs.rLeg.rotation.x=-Math.sin(game.time*5)*0.35;
      if(p.emoteT<=0){p.limbs.lArm.rotation.x=-0.08;p.limbs.rArm.rotation.x=-0.08;}
    }
  }
  p.group.position.copy(p.pos);p.group.rotation.y=p.yaw;
  if(p.swingT>0){p.swingT-=dt;const kk=1-Math.max(0,p.swingT)/0.28;
    p.holder.rotation.x=-1.4+Math.sin(kk*Math.PI)*1.9;if(p.swingT<=0)p.holder.rotation.x=0;}
  const dir=camForward(),dist=p.dropping?10:(p.aiming?4.6:6.6);
  const target=V3(p.pos.x,p.pos.y+1.95,p.pos.z),cp=target.clone().addScaledVector(dir,-dist);
  const minY=terrainHeight(cp.x,cp.z)+0.5;if(cp.y<minY)cp.y=minY;
  camera.position.copy(cp);camera.lookAt(target.clone().addScaledVector(dir,8));
  const def=currentDef();let fov=75;
  if(p.aiming&&def&&!def.melee)fov=def.scope?26:58;
  else if(Math.hypot(p.vel.x,p.vel.z)>8)fov=80;
  camera.fov+=(fov-camera.fov)*Math.min(1,dt*10);camera.updateProjectionMatrix();
  if(p.gliding){p.glider.position.set(p.pos.x,p.pos.y+3.7,p.pos.z);p.glider.rotation.set(0,p.yaw,Math.sin(game.time*2)*0.12);}
}
