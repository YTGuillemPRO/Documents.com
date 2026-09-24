// ============ Game state, lobby/locker, input, match flow, loop ============
const game={state:'MENU',paused:false,time:0,lmb:false,lmbClick:false,keys:{}};
let lastWeaponSel=0;
let stats={wins:0,matches:0,bestKills:0};
let curOutfit=OUTFITS[0];
const pendingUnlocks=[];
let menuSpot={x:0,y:0,z:0};

// ---------- persistence ----------
function loadSave(){
  try{
    stats=Object.assign(stats,JSON.parse(localStorage.getItem('br_stats')||'{}'));
    const id=localStorage.getItem('br_outfit');
    const o=OUTFITS.find(o=>o.id===id); if(o)curOutfit=o;
  }catch(e){}
}
function saveSave(){
  try{ localStorage.setItem('br_stats',JSON.stringify(stats)); localStorage.setItem('br_outfit',curOutfit.id); }catch(e){}
}
function outfitUnlocked(o){ return !o.lock || ((o.lock.wins||0)<=stats.wins && (o.lock.elims||0)<=stats.bestKills); }

// ---------- locker ----------
const LOCK_SVG='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="4" y="11" width="16" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

function applyOutfit(o){
  curOutfit=o;
  if(player.group)scene.remove(player.group);
  const c=makeCharacter({shirt:o.shirt,pants:o.pants,skin:o.skin,hair:o.hair,pack:o.pack});
  player.group=c.group;
  player.limbs={lLeg:c.lLeg,rLeg:c.rLeg,lArm:c.lArm,rArm:c.rArm};
  player.holder=c.holder;
  scene.add(c.group);
  updateHeldWeapon();
}

function refreshStats(){
  $('statWins').textContent=stats.wins;
  $('statMatches').textContent=stats.matches;
  $('statBest').textContent=stats.bestKills;
}

function renderLobby(){
  refreshStats();
  const grid=$('outfitGrid'); grid.innerHTML='';
  for(const o of OUTFITS){
    const un=outfitUnlocked(o);
    const d=document.createElement('div');
    d.className='outfit'+(o.id===curOutfit.id?' equipped':'')+(un?'':' locked');
    d.innerHTML='<div class="swatches"><i style="background:'+o.shirt+'"></i><i style="background:'+o.pants+'"></i><i style="background:'+o.pack+'"></i><i style="background:'+o.hair+'"></i></div>'
      +'<div class="oName">'+o.name+'</div>'
      +(un?'':'<div class="oLock">'+LOCK_SVG+' '+o.lockText+'</div>')
      +(o.id===curOutfit.id?'<div class="oEq">EQUIPPED</div>':'');
    d.onclick=()=>{
      if(!un){ SFX.empty(); d.classList.remove('deny'); void d.offsetWidth; d.classList.add('deny'); return; }
      applyOutfit(o); saveSave(); renderLobby(); SFX.swap();
    };
    grid.appendChild(d);
  }
  if(pendingUnlocks.length){
    const b=$('unlockBanner');
    b.textContent='NEW OUTFIT UNLOCKED — '+pendingUnlocks.join(', ');
    b.classList.remove('hidden');
    pendingUnlocks.length=0;
    clearTimeout(renderLobby._t);
    renderLobby._t=setTimeout(()=>b.classList.add('hidden'),5000);
  }
}

// ---------- screens ----------
function showScreen(name){
  for(const id of ['lobby','pause','over','win'])$(id).classList.toggle('hidden',id!==name);
}
function lockPointer(){
  try{ const p=renderer.domElement.requestPointerLock(); if(p&&p.catch)p.catch(()=>{}); }catch(e){}
}

// ---------- match flow ----------
function applyDamage(ent,dmg,source,opts={}){
  if(!ent.alive||game.state==='MENU')return;
  dmg=Math.round(dmg); if(dmg<=0)return;
  if(opts.storm){ ent.hp-=dmg; }
  else{
    const s=Math.min(ent.shield,dmg); ent.shield-=s; ent.hp-=dmg-s;
    if(ent.isPlayer)hud.flashDamage();
  }
  if(ent.hp<=0){ ent.hp=0; eliminate(ent,source,opts.storm); }
}

function eliminate(v,killer,stormK=false){
  if(!v.alive)return; v.alive=false;
  if(v.isPlayer){ hud.killfeedAdd(killer?killer.name:null,'YOU',true,stormK); endDefeat(killer,stormK); return; }
  v.sprite.visible=false;
  effects.push({type:'fall',group:v.group,t:0});
  dropFromEntity(v);
  if(killer===player){
    player.kills++; SFX.elim();
    hud.announce('ELIMINATED '+v.name,aliveCount()+' PLAYERS REMAIN',1700);
    hud.killfeedAdd('YOU',v.name,true);
  } else if(killer&&killer.name){
    if(killer.kills!==undefined)killer.kills++;
    hud.killfeedAdd(killer.name,v.name);
  } else hud.killfeedAdd(null,v.name,true,stormK);
  checkVictory();
}

function checkVictory(){
  if(game.state!=='PLAY'||!player.alive)return;
  if(bots.every(b=>!b.alive))endVictory();
}

function finishStats(win){
  const before=OUTFITS.filter(o=>!outfitUnlocked(o)).map(o=>o.id);
  stats.matches++; if(win)stats.wins++;
  stats.bestKills=Math.max(stats.bestKills,player.kills);
  saveSave();
  for(const o of OUTFITS)if(!before.includes(o.id)&&outfitUnlocked(o))pendingUnlocks.push(o.name);
}

function endDefeat(killer,stormK){
  game.state='OVER'; document.exitPointerLock&&document.exitPointerLock();
  finishStats(false); SFX.lose();
  $('overPlace').textContent='#'+(bots.filter(b=>b.alive).length+1);
  $('overBy').textContent=stormK?'Consumed by the Storm':'Eliminated by '+(killer?killer.name:'the Storm');
  $('overKills').textContent=player.kills;
  showScreen('over'); document.body.classList.remove('ingame');
}
function endVictory(){
  game.state='WIN'; document.exitPointerLock&&document.exitPointerLock();
  finishStats(true); SFX.win();
  $('winKills').textContent=player.kills;
  const box=$('winConfetti'); box.innerHTML='';
  const cols=['#ffd23a','#35c8ff','#ff5b4d','#3fd24d','#c04dff'];
  for(let i=0;i<44;i++){
    const d=document.createElement('div'); d.className='confetti';
    d.style.left=rand(0,100)+'%'; d.style.background=pick(cols);
    d.style.animationDuration=rand(2.2,4.2)+'s'; d.style.animationDelay=rand(0,1.2)+'s';
    box.appendChild(d);
  }
  showScreen('win'); document.body.classList.remove('ingame');
}

function resetMatch(){
  resetBuilding(); resetStorm();
  for(const b of bots)scene.remove(b.group);
  bots.length=0;
  while(lootItems.length)removeLoot(lootItems[0]);
  for(const e of effects){ if(e.group)scene.remove(e.group); else if(e.obj)scene.remove(e.obj); }
  effects.length=0;
  $('killfeed').innerHTML=''; $('dmgLayer').innerHTML=''; $('toasts').innerHTML='';
  hideGhosts(); buildMode=null; lastWeaponSel=0;
  initBots(); spawnInitialLoot(); resetPlayer();
  hud.updateSlots(); hud.showReload(false); hud.useProgress(0,null);
  $('scopeOv').classList.add('hidden');
}

function startMatch(){
  audioInit();
  resetMatch();
  game.state='DROP'; game.paused=false;
  showScreen(null); document.body.classList.add('ingame');
  lockPointer();
  hud.announce('DROPPING IN','Steer with WASD — glider opens automatically',2600);
}
function backToLobby(){
  game.state='MENU'; game.paused=false;
  document.exitPointerLock&&document.exitPointerLock();
  showScreen('lobby'); document.body.classList.remove('ingame');
  menuSpot.y=terrainHeight(menuSpot.x,menuSpot.z);
  renderLobby();
}

function findScenicSpot(){
  const cands=[[0,0],[26,18],[-24,22],[18,-26],[-20,-24],[42,10],[-42,-12],[10,44],[-10,-44]];
  for(const [x,z] of cands){
    let ok=true;
    for(const c of worldCircles)if(dist2(x,z,c.x,c.z)<40)ok=false;
    for(const h of HOUSE_SPOTS)if(dist2(x,z,h[0],h[1])<225)ok=false;
    if(ok)return{x,y:terrainHeight(x,z),z};
  }
  return{x:0,y:terrainHeight(0,0),z:0};
}

// ---------- input ----------
function toggleBuild(type){
  if(game.state!=='PLAY')return;
  if(buildMode===type){ exitBuildMode(); return; }
  if(!buildMode)lastWeaponSel=player.sel||0;
  buildMode=type; lastBuildType=type; SFX.swap();
}
function exitBuildMode(){
  buildMode=null; hideGhosts();
  selectSlot(lastWeaponSel||0);
}
function cycleWeapon(dirn){
  if(buildMode)exitBuildMode();
  const avail=[0];
  player.inv.forEach((s,i)=>{ if(s)avail.push(i+1); });
  let ci=avail.indexOf(player.sel); if(ci<0)ci=0;
  ci=(ci+dirn+avail.length)%avail.length;
  selectSlot(avail[ci]); SFX.swap();
}

function bindInput(){
  const cv=renderer.domElement;
  document.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('keydown',e=>{
    if(e.code==='Space')e.preventDefault();
    if(game.state==='MENU'&&e.code==='Enter'){ startMatch(); return; }
    game.keys[e.code]=true;
    if(game.state!=='PLAY'&&game.state!=='DROP')return;
    if(e.code==='Digit1')toggleBuild('wall');
    if(e.code==='Digit2')toggleBuild('ramp');
    if(e.code==='Digit3')toggleBuild('floor');
    if(e.code==='Digit4'&&game.state==='PLAY'){ buildMode=null; hideGhosts(); selectSlot(0); }
    if(e.code==='KeyQ'){
      if(buildMode)exitBuildMode();
      else if(game.state==='PLAY'){ lastWeaponSel=player.sel||0; buildMode=lastBuildType; SFX.swap(); }
    }
    if(e.code==='KeyR')tryReload();
    if(e.code==='KeyE')pickupNearest();
    if(e.code==='KeyX')useShieldPot();
    if(e.code==='KeyC')useMedkit();
  });
  document.addEventListener('keyup',e=>{ delete game.keys[e.code]; });
  window.addEventListener('blur',()=>{ game.keys={}; game.lmb=false; player.aiming=false; });

  document.addEventListener('mousedown',e=>{
    if(document.pointerLockElement!==cv&&(game.state==='PLAY'||game.state==='DROP')&&!game.paused){
      lockPointer(); return;
    }
    if(e.button===0){ game.lmb=true; game.lmbClick=true; }
    if(e.button===2&&game.state==='PLAY'&&!buildMode)player.aiming=true;
  });
  document.addEventListener('mouseup',e=>{
    if(e.button===0)game.lmb=false;
    if(e.button===2)player.aiming=false;
  });
  document.addEventListener('mousemove',e=>{
    if(document.pointerLockElement!==cv)return;
    player.yaw-=e.movementX*CFG.SENS;
    player.pitch=clamp(player.pitch-e.movementY*CFG.SENS,-1.25,1.35);
  });
  document.addEventListener('wheel',e=>{
    if(game.state!=='PLAY'&&game.state!=='DROP')return;
    cycleWeapon(e.deltaY>0?1:-1);
  });
  document.addEventListener('pointerlockchange',()=>{
    const locked=document.pointerLockElement===cv;
    if(!locked&&(game.state==='PLAY'||game.state==='DROP')&&player.alive){
      game.paused=true; showScreen('pause');
    } else if(locked){ game.paused=false; if(game.state!=='MENU')showScreen(null); }
  });
  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });

  $('playBtn').onclick=startMatch;
  $('resumeBtn').onclick=lockPointer;
  $('pauseRestart').onclick=startMatch;
  $('pauseMenu').onclick=backToLobby;
  $('overAgain').onclick=startMatch;
  $('overMenu').onclick=backToLobby;
  $('winAgain').onclick=startMatch;
  $('winMenu').onclick=backToLobby;
}

// ---------- main loop ----------
let lastT=performance.now();
function loop(t){
  requestAnimationFrame(loop);
  const dt=clamp((t-lastT)/1000,0,0.05); lastT=t;

  if(game.state==='MENU'){
    const ts=t*0.001;
    const a=Math.sin(ts*0.22)*0.45;
    if(player.group&&player.limbs){
      player.group.position.set(menuSpot.x,menuSpot.y+Math.sin(ts*1.6)*0.03,menuSpot.z);
      player.group.rotation.y=a;
      player.limbs.lArm.rotation.x=Math.sin(ts*1.6)*0.05-0.08;
      player.limbs.rArm.rotation.x=-Math.sin(ts*1.6)*0.05-0.08;
      player.limbs.lLeg.rotation.x=0; player.limbs.rLeg.rotation.x=0;
    }
    camera.position.set(menuSpot.x+Math.sin(a*0.6)*4.4,menuSpot.y+2.05+Math.sin(ts*0.5)*0.06,menuSpot.z+Math.cos(a*0.6)*4.4);
    camera.lookAt(menuSpot.x,menuSpot.y+1.25,menuSpot.z);
    camera.fov=52; camera.updateProjectionMatrix();
    renderer.render(scene,camera);
    return;
  }

  if(!game.paused){
    game.time+=dt;
    updatePlayer(dt);
    updateBots(dt);
    updateStorm(dt);
    updateBuilding(dt);
    updateWeapons(dt);
    updateLoot(dt);
    updateEffects(dt);
    const def=currentDef();
    $('scopeOv').classList.toggle('hidden',
      !(game.state==='PLAY'&&player.alive&&player.aiming&&def&&!def.melee&&def.scope));
    if(game.state==='PLAY'&&player.alive&&!player.dropping){
      const it=nearestLoot(player.pos,CFG.PICKUP_RANGE);
      hud.showInteract(it?lootLabel(it):null,it?lootColor(it):null);
      hud.setBuildHint(buildMode?buildMode.toUpperCase()+' — hold LMB to place ('+CFG.BUILD_COST+' mats) · Q to exit':null);
    } else { hud.showInteract(null); hud.setBuildHint(null); }
    $('dropHint').classList.toggle('hidden',game.state!=='DROP');
    hud.update(dt);
    sun.position.set(player.pos.x+90,140,player.pos.z+60);
    sun.target.position.set(player.pos.x,0,player.pos.z);
  }
  renderer.render(scene,camera);
  game.lmbClick=false;
}

// ---------- boot ----------
initWorld(); initBuilding(); initLoot(); initWeapons(); initPlayer(); initStorm();
sun.shadow.camera.updateProjectionMatrix();   // fixes shadow frustum after camera setup
loadSave(); applyOutfit(curOutfit);
hud.init();
menuSpot=findScenicSpot();
sun.position.set(menuSpot.x+90,140,menuSpot.z+60);
sun.target.position.set(menuSpot.x,0,menuSpot.z);
renderLobby(); bindInput(); showScreen('lobby');
requestAnimationFrame(loop);
