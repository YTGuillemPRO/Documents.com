// ============ 23 AI bots: skydive, wander, loot, build, fight ============
const bots=[];
const BOT_SHIRTS=['#ff5b4d','#ff8b3a','#ffc93a','#3fc96a','#39c6ff','#7a6bff','#c95bff','#ff6bd6','#2fd4c9','#9be03a'];
const BOT_SKINS=['#f2c18f','#e0a370','#c98a5b','#8d5a3a'];
const BOT_PANTS=['#3a4a6b','#5b4632','#6b3a3a','#2f5b46'];

function makeNameSprite(name){
  const cv=document.createElement('canvas'); cv.width=256; cv.height=64;
  const c=cv.getContext('2d');
  c.font='40px Anton, Impact, sans-serif'; c.textAlign='center'; c.textBaseline='middle';
  c.lineWidth=8; c.strokeStyle='rgba(10,14,26,0.9)'; c.strokeText(name,128,34);
  c.fillStyle='#fff'; c.fillText(name,128,34);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),depthWrite:false}));
  s.scale.set(2.6,0.65,1); s.position.y=2.6; return s;
}

function initBots(){
  const used=new Set(['YOU']);
  for(let i=0;i<CFG.BOT_COUNT;i++){
    let x,z,ok=false;
    for(let t=0;t<25&&!ok;t++){
      const a=rand(0,6.28),r=rand(50,175); x=Math.cos(a)*r; z=Math.sin(a)*r; ok=true;
      for(const b of bots)if(dist2(x,z,b.pos.x,b.pos.z)<324)ok=false;
    }
    const tier=weighted([[0,40],[1,35],[2,25]]);
    const c=makeCharacter({shirt:pick(BOT_SHIRTS),pants:pick(BOT_PANTS),skin:pick(BOT_SKINS),
      hair:pick(['#2b2b2b','#6b4a2a','#e8cf6a','#a33b2a']),pack:'#3b4250'});
    const sprite=makeNameSprite(makeBotName(used)); c.group.add(sprite);
    const gun=makeWeaponMesh(pick(['ar','smg','shotgun']),tier); gun.scale.set(1.1,1.1,1.1);
    c.holder.add(gun); c.rArm.rotation.x=-1.2;
    scene.add(c.group);
    bots.push({
      name:sprite? '':'' , isPlayer:false, tier,
      name:undefined, // set below
    });
    const b=bots[i];
    Object.assign(b,{
      name:undefined, pos:V3(x,rand(95,125),z), vel:V3(), yaw:rand(0,6.28),
      hp:100, shield:0, alive:true, kills:0, state:'drop',
      moveTarget:null, lootTarget:null, target:null, targetT:0,
      nextThink:i*0.07, strafeDir:Math.random()<0.5?1:-1, strafeT:rand(0.5,1.5),
      fireCd:rand(0.5,1.5), buildCd:rand(2,6), rof:rand(0.55,0.95)-tier*0.05,
      dmgBase:9+tier*4, healsLeft:randi(1,3), healT:0,
      stuckT:0, lastPos:V3(x,0,z), runT:rand(0,6),
      group:c.group, limbs:{lLeg:c.lLeg,rLeg:c.rLeg,lArm:c.lArm,rArm:c.rArm}, holder:c.holder,
      sprite, dropping:true, grounded:false,
    });
    b.name=(()=>{ // pull the name we generated into the bot
      return used.size? [...used].find(n=>!bots.some(o=>o.name===n)&&n!=='YOU') : 'Bot';
    })();
  }
}

function aliveCount(){ return (player.alive?1:0)+bots.reduce((n,b)=>n+(b.alive?1:0),0); }

function botThink(b){
  // storm urgency
  const dStorm=Math.hypot(b.pos.x-storm.cx,b.pos.z-storm.cz);
  const outside=dStorm>storm.r-6;
  // target acquisition (skip while everyone is dropping)
  let best=null,bd=1e9;
  if(game.state==='PLAY'){
    const detect=40+storm.phase*4;
    const cands=[];
    if(player.alive&&!player.dropping)cands.push(player);
    for(const o of bots)if(o!==b&&o.alive&&!o.dropping)cands.push(o);
    for(const c of cands){
      const d=Math.sqrt(dist2(b.pos.x,b.pos.z,c.pos.x,c.pos.z));
      if(d<detect&&d<bd){
        const blk=losCheck(b,c);
        if(!blk){ best=c; bd=d; }
      }
    }
  }
  if(best){ b.target=best; b.targetT=0; b.state='fight'; return; }
  if(b.target){
    if(!b.target.alive){ b.target=null; }
    else { b.targetT+=0.45; if(b.targetT<2.5){ b.state='fight'; return; } b.target=null; }
  }
  if(outside){
    b.state='flee';
    const a=rand(0,6.28), r=rand(0,Math.max(8,storm.r*0.6));
    b.moveTarget={x:storm.cx+Math.cos(a)*r,z:storm.cz+Math.sin(a)*r};
    return;
  }
  if(b.hp<=60&&b.healsLeft>0){ b.state='heal'; b.healT=2; b.healsLeft--; return; }
  const it=nearestLoot(b.pos,26);
  if(it&&(it.kind!=='weapon'&&it.kind!=='ammo'||it.kind==='weapon'&&it.rarity>b.tier)){
    b.lootTarget=it; b.state='loot'; return;
  }
  if(!b.moveTarget||dist2(b.pos.x,b.pos.z,b.moveTarget.x,b.moveTarget.z)<25){
    const a=rand(0,6.28), r=rand(0,Math.max(12,storm.r*0.8));
    b.moveTarget={x:clamp(storm.cx+Math.cos(a)*r,-230,230),z:clamp(storm.cz+Math.sin(a)*r,-230,230)};
  }
  b.state='wander';
}

function losCheck(a,b){
  const from=V3(a.pos.x,a.pos.y+1.5,a.pos.z), to=V3(b.pos.x,b.pos.y+1.3,b.pos.z);
  const d=to.clone().sub(from); const dist=d.length(); d.normalize();
  const blk=bulletsBlockRay(from,d,dist-0.5);
  if(blk)return blk.piece?{piece:blk.piece,point:from.clone().addScaledVector(d,blk.t)}:'static';
  for(const c of worldCircles){
    if(c.kind!=='tree')continue;
    if(rayCircleXZ(from,d,c,c.r+0.2,dist-0.5)>=0)return 'static';
  }
  return null;
}

function botTryShoot(b,T,d){
  const blk=losCheck(b,T);
  const from=V3(b.pos.x,b.pos.y+1.5,b.pos.z);
  const col=new THREE.Color(RARITIES[b.tier].color).getHex();
  if(blk==='static')return;
  if(blk&&blk.piece){
    if(blk.piece.owner===b)return;
    damagePiece(blk.piece,b.dmgBase+storm.phase*1.5);
    spawnTracer(from,blk.point,col); spawnImpact(blk.point,'#c49a62');
    return;
  }
  const to=V3(T.pos.x,T.pos.y+(T.isPlayer?1.4:1.2),T.pos.z);
  let hitP=clamp(0.42-d*0.004+storm.phase*0.03,0.08,0.5);
  if(T.isPlayer){
    if(game.keys.ShiftLeft)hitP-=0.08;
    if(!player.grounded)hitP-=0.12;
  }
  if(Math.random()<hitP){
    applyDamage(T,b.dmgBase+storm.phase*1.5,b);
    spawnTracer(from,to,col); spawnImpact(to,'#ffd24a');
  } else {
    const miss=to.clone().add(V3(rand(-2,2),rand(-0.5,1.5),rand(-2,2)));
    spawnTracer(from,miss,col); spawnImpact(miss,'#cdb98d');
  }
  if(d<55&&Math.random()<0.4)SFX.shot('smg');
}

function botAct(b,dt){
  let mvx=0,mvz=0,speed=4.2;
  if(b.state==='fight'&&b.target&&b.target.alive){
    const T=b.target;
    const dx=T.pos.x-b.pos.x, dz=T.pos.z-b.pos.z, d=Math.hypot(dx,dz)||0.001;
    b.yaw=lerpAngle(b.yaw,Math.atan2(dx,dz),dt*8);
    if(d>20){ mvx=dx/d; mvz=dz/d; speed=5.4; }
    else if(d<9){ mvx=-dx/d; mvz=-dz/d; speed=4.4; }
    b.strafeT-=dt; if(b.strafeT<=0){b.strafeDir*=-1;b.strafeT=rand(0.8,1.8);}
    mvx+=(-dz/d)*b.strafeDir*0.8; mvz+=(dx/d)*b.strafeDir*0.8;
    b.fireCd-=dt;
    if(b.fireCd<=0){ botTryShoot(b,T,d); b.fireCd=b.rof*rand(0.85,1.35); }
    if((b.shield<=0&&b.hp<45)||b.hp<30){
      b.buildCd-=dt;
      if(b.buildCd<=0){ botBuildWall(b,T.pos); b.buildCd=rand(5,9); }
    }
    if(b.grounded&&Math.random()<dt*0.35)b.vel.y=9;
  } else if(b.state==='flee'){
    const dx=storm.cx-b.pos.x, dz=storm.cz-b.pos.z, d=Math.hypot(dx,dz)||0.001;
    mvx=dx/d; mvz=dz/d; speed=6.4;
    b.yaw=lerpAngle(b.yaw,Math.atan2(dx,dz),dt*6);
    if(d<storm.r*0.7)b.state='wander';
  } else if(b.state==='loot'&&b.lootTarget&&lootItems.includes(b.lootTarget)){
    const it=b.lootTarget;
    const dx=it.pos.x-b.pos.x, dz=it.pos.z-b.pos.z, d=Math.hypot(dx,dz)||0.001;
    mvx=dx/d; mvz=dz/d; speed=5.2;
    b.yaw=lerpAngle(b.yaw,Math.atan2(dx,dz),dt*6);
    if(d<1.8){
      if(it.kind==='weapon'&&it.rarity>b.tier){
        b.tier=it.rarity;
        while(b.holder.children.length)b.holder.remove(b.holder.children[0]);
        const gun=makeWeaponMesh(pick(['ar','smg','shotgun']),b.tier); gun.scale.set(1.1,1.1,1.1);
        b.holder.add(gun);
      }
      if(it.kind==='shield')b.shield=Math.min(100,b.shield+50);
      if(it.kind==='medkit')b.hp=Math.min(100,b.hp+50);
      removeLoot(it); b.lootTarget=null; b.state='wander';
    }
  } else if(b.state==='heal'){
    b.healT-=dt;
    if(b.healT<=0){ b.hp=Math.min(100,b.hp+55); b.state='wander'; }
  } else { // wander
    if(b.moveTarget){
      const dx=b.moveTarget.x-b.pos.x, dz=b.moveTarget.z-b.pos.z, d=Math.hypot(dx,dz);
      if(d<2)b.moveTarget=null; else { mvx=dx/d; mvz=dz/d; b.yaw=lerpAngle(b.yaw,Math.atan2(dx,dz),dt*4); }
    }
  }
  // stuck detection → hop + repath
  if((mvx||mvz)&&dist2(b.pos.x,b.pos.z,b.lastPos.x,b.lastPos.z)<0.02)b.stuckT+=dt; else b.stuckT=0;
  b.lastPos.copy(b.pos);
  if(b.stuckT>1.4){ b.moveTarget=null; b.stuckT=0; if(b.grounded)b.vel.y=10; }

  // physics
  b.vel.y-=CFG.GRAVITY*dt;
  const ml=Math.hypot(mvx,mvz); if(ml>0){mvx/=ml;mvz/=ml;}
  b.pos.x+=mvx*speed*dt; b.pos.z+=mvz*speed*dt; b.pos.y+=b.vel.y*dt;
  b.pos.x=clamp(b.pos.x,-236,236); b.pos.z=clamp(b.pos.z,-236,236);
  collideEntity(b,0.5);
  const g=supportHeight(b.pos.x,b.pos.z,b.pos.y);
  if(b.pos.y<=g){ b.pos.y=g; b.vel.y=0; b.grounded=true; } else b.grounded=false;

  const spd=(mvx||mvz)?speed:0;
  if(spd>0.5){ b.runT+=dt*spd*1.3; const a=Math.sin(b.runT)*0.55;
    b.limbs.lLeg.rotation.x=a; b.limbs.rLeg.rotation.x=-a; }
  b.group.position.copy(b.pos); b.group.rotation.y=b.yaw;
}

function updateBots(dt){
  for(const b of bots){
    if(!b.alive)continue;
    if(b.state==='drop'||b.dropping){
      b.pos.y-=30*dt;
      const g=terrainHeight(b.pos.x,b.pos.z);
      if(b.pos.y<=g){ b.pos.y=g; b.dropping=false; b.state='wander'; b.sprite.visible=false; }
      b.group.position.copy(b.pos);
      continue;
    }
    b.nextThink-=dt;
    if(b.nextThink<=0){ botThink(b); b.nextThink=0.38+Math.random()*0.25; }
    botAct(b,dt);
    b.sprite.visible=player.alive&&dist2(b.pos.x,b.pos.z,player.pos.x,player.pos.z)<2500;
  }
  // gentle entity-entity separation
  const ents=player.alive&&!player.dropping?[player,...bots]:bots;
  for(let i=0;i<ents.length;i++)for(let j=i+1;j<ents.length;j++){
    const a=ents[i],c=ents[j];
    if(!a.alive||!c.alive)continue;
    const dx=c.pos.x-a.pos.x, dz=c.pos.z-a.pos.z, d2v=dx*dx+dz*dz;
    if(d2v<0.81&&d2v>1e-6){ const d=Math.sqrt(d2v),push=(0.9-d)/2;
      a.pos.x-=dx/d*push; a.pos.z-=dz/d*push; c.pos.x+=dx/d*push; c.pos.z+=dz/d*push; }
  }
}
