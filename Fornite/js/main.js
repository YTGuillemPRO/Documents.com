// ============ Game state, input, match flow, damage rules ============
const game={state:'MENU',paused:false,time:0,lmb:false,lmbClick:false,keys:{}};

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
  } else if(killer&&killer.name){ if(killer.kills!==undefined)killer.kills++; hud.killfeedAdd(killer.name,v.name); }
  else hud.killfeedAdd(null,v.name,true,stormK);
  checkVictory();
}

function checkVictory(){
  if(game.state!=='PLAY'||!player.alive)return;
  if(bots.every(b=>!b.alive))endVictory();
}

function endDefeat(killer,stormK){
  game.state='OVER'; document.exitPointerLock&&document.exitPointerLock();
  SFX.lose();
  $('overPlace').textContent='#'+(bots.filter(b=>b.alive).length+1);
  $('overBy').textContent=stormK?'Consumed by the Storm':'Eliminated by '+(killer?killer.name:'the Storm');
  $('overKills').textContent=player.kills;
  hud.showScreen('over'); hud.setIngame(false);
}
function endVictory(){
  game.state='WIN'; document.exitPointerLock&&document.exitPointerLock();
  SFX.win();
  $('winKills').textContent=player.kills;
  const box=$('winConfetti'); box.innerHTML='';
  const cols=['#ffd23a','#35c8ff','#ff5b4d','#3fd24d','#c04dff'];
  for(let i=0;i<44;i++){
    const d=document.createElement('div'); d.className='confetti';
    d.style.left=rand(0,100)+'%'; d.style.background=pick(cols);
    d.style.animationDuration=rand(2.2,4.2)+'s'; d.style.animationDelay=rand(0,1.2)+'s';
    box.appendChild(d);
  }
  hud.announce('VICTORY ROYALE','',3000);
  hud.showScreen('win'); hud.setIngame(false);
}

function resetMatch(){
  resetBuilding(); resetStorm();
  for(const b of bots)scene.remove(b.group);
  bots.length=0;
  while(lootItems.length)removeLoot(lootItems[0]);
  for(const e of effects){ if(e.obj&&e.type!=='fall')scene.remove(e.obj); }
  effects.length=0;
  $('killfeed').innerHTML=''; $('dmgLayer').innerHTML='';
  initBots(); spawnInitialLoot(); resetPlayer();
  hud.updateSlots(); hud.showReload(false); hud.useProgress(0,null);
}

function startMatch(){
  audioInit();
  resetMatch();
  game.state='DROP'; game.paused=false;
  hud.showScreen(null); hud.setIngame(true);
  renderer.domElement.requestPointerLock&&renderer.domElement.requestPointerLock();
  hud.announce('DROPPING IN','Steer with WASD — glider opens automatically',2600);
}
function backToMenu(){
  game.state='MENU'; game.paused=false;
  hud.showScreen('menu'); hud.setIngame(false);
}

// ---------------- input ----------------
function bindInput(){
  const cv=renderer.domElement;
  document.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('keydown',e=>{
    if(e.code==='Space')e.preventDefault();
    game.keys[e.code]=true;
    if(game.state!=='PLAY'&&game.state!=='DROP')return;
    if(e.code==='Digit1')toggleBuild('wall');
    if(e.code==='Digit2')toggleBuild('ramp');
    if(e.code==='Digit3')toggleBuild('floor');
    if(e.code==='KeyQ'){
      if(buildMode)exitBuildMode();
      else if(game.state==='PLAY'){ lastWeaponSel=player.sel; buildMode=lastBuildType; setGhostType(buildMode); SFX.swap(); }
    }
    if(e.code==='Digit4'&&game.state==='PLAY'){ if(buildMode)exitBuildMode(); player.sel=0; updateHeldWeapon(); }
    if(e.code==='KeyR')tryReload();
    if(e.code==='KeyE'&&game.state==='PLAY'){ const it=nearestLoot(player.pos,2.7); if(it)pickupLoot(it); }
    if(e.code==='KeyX')useShieldPot();
    if(e.code==='KeyC')useMedkit();
  });
  document.addEventListener('keyup',e=>{ delete game.keys[e.code]; });
  window.addEventListener('blur',()=>{ game.keys={}; game.lmb=false; player.aiming=false; });

  document.addEventListener('mousedown',e=>{
    if(document.pointerLockElement!==cv&&(game.state==='PLAY'||game.state==='DROP')&&!game.paused){
      cv.requestPointerLock&&cv.requestPointerLock(); return;
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
      game.paused=true; hud.showScreen('pause');
    } else if(locked){ game.paused=false; if(game.state!=='MENU')hud.showScreen(null); }
  });
  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });

  $('playBtn').onclick=startMatch;
  $('resumeBtn').onclick=()=>renderer.domElement.requestPointerLock();
  $('pauseRestart').onclick=startMatch;
  $('pauseMenu').onclick=backToMenu;
  $('overAgain').onclick=startMatch;
  $('overMenu').onclick=backToMenu;
  $('winAgain').onclick=startMatch;
  $('winMenu').onclick=backToMenu;
}

function cycleWeapon(dirn){
  if(buildMode)exitBuildMode();
  const avail=[0];
  player.inv.forEach((s,i)=>{ if(s)avail.push(i+1); });
  let ci=avail.indexOf(player.sel); if(ci<0)ci=0;
  ci=(ci+dirn+avail.length)%avail.length;
  if(avail[ci]===player.sel)return;
  player.sel=avail[ci]; updateHeldWeapon(); SFX.swap();
}

// ---------------- build-mode helpers shared with input ----------------
function toggleBuild(type){
  if(game.state!=='PLAY')return;
  if(buildMode===type){ exitBuildMode(); return; }
  if(!buildMode)lastWeaponSel=player.sel;
  buildMode=type; lastBuildType=type; setGhostType(type); SFX.swap();
}
function exitBuildMode(){
  buildMode=null; ghost.visible=false;
  player.sel=lastWeaponSel; updateHeldWeapon();
}

// ---------------- main loop ----------------
let lastT=performance.now();
function loop(t){
  requestAnimationFrame(loop);
  const dt=clamp((t-lastT)/1000,0,0.05); lastT=t;

  if(game.state==='MENU'){
    const a=t*0.00005;
    camera.position.set(Math.cos(a)*170,75,Math.sin(a)*170);
    camera.lookAt(0,5,0);
    camera.fov=60; camera.updateProjectionMatrix();
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
    // HUD bits that need world queries
    if(game.state==='PLAY'&&player.alive){
      const it=nearestLoot(player.pos,2.7);
      hud.showInteract(it?lootLabel(it):null,it?lootColor(it):null);
      hud.setBuildHint(buildMode?`${buildMode.toUpperCase()} — LMB place · ${CFG.BUILD_COST} mats · Q exit`:null);
      $('dropHint').classList.toggle('hidden',game.state!=='DROP');
    } else { hud.showInteract(null); hud.setBuildHint(null); }
    hud.update(dt);
    // shadow camera follows the player
    sun.position.set(player.pos.x+90,140,player.pos.z+60);
    sun.target.position.set(player.pos.x,0,player.pos.z);
  }
  renderer.render(scene,camera);
  game.lmbClick=false;
}

// ---------------- boot ----------------
initWorld(); initBuilding(); initLoot(); initWeapons(); initPlayer(); initStorm();
hud.init(); bindInput(); hud.showScreen('menu');
requestAnimationFrame(loop);
