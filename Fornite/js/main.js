// ============ Game state, lobby hub (tabs/quests/XP), match flow, loop ============
const game={state:'MENU',paused:false,time:0,lmb:false,lmbClick:false,keys:{}};
let lastWeaponSel=0,curOutfit=OUTFITS[0];
let stats={wins:0,matches:0,bestKills:0,totalKills:0,totalXP:0};
const pendingUnlocks=[];
let menuSpot={x:0,y:0,z:0};
const lobbyPads=[];
let lastXPGain=0;

/* ================= QUESTS + XP ================= */
const quest={list:[]};
function rollQuests(){
  quest.list=[];
  const pool=[...QUEST_POOL];
  const picks=['elims','mats','win'];
  for(const t of picks){
    const opts=pool.filter(q=>q.type===t);
    if(opts.length)quest.list.push(Object.assign({p:0,done:false},opts.splice(randi(0,opts.length-1),1)[0]));
  }
  while(quest.list.length<3&&pool.length)
    quest.list.push(Object.assign({p:0,done:false},pool.splice(randi(0,pool.length-1),1)[0]));
}
function questEvent(type,amt){
  let changed=false;
  for(const q of quest.list){
    if(q.type===type&&!q.done){
      q.p=Math.min(q.n,q.p+(amt||1));changed=true;
      if(q.p>=q.n){q.done=true;stats.totalXP+=q.xp;saveSave();
        toast('QUEST COMPLETE — '+q.txt+' <b style="color:var(--gold)">+'+q.xp+' XP</b>');SFX.pickup();}
    }
  }
  if(changed){renderQuests();renderQuestCard();saveSave();}
}
function levelFromXP(xp){
  let l=1,need=150,rest=xp;
  while(rest>=need){rest-=need;l++;need=Math.round(need*1.18);}
  return{l,into:rest,need};
}
function renderQuests(){
  const el=$('questList');if(!el||$('questsPanel').classList.contains('hidden'))return;
  el.innerHTML='';
  for(const q of quest.list){
    const d=document.createElement('div');d.className='qRow'+(q.done?' done':'');
    d.innerHTML='<div class="qTop"><span>'+q.txt+'</span><span class="xpv">+'+q.xp+' XP</span></div>'
      +'<div class="qSub">'+(q.done?'COMPLETE':'Progress '+q.p+' / '+q.n)+'</div>'
      +'<div class="qBarW"><div class="qBar" style="width:'+Math.round(100*q.p/q.n)+'%"></div></div>';
    el.appendChild(d);
  }
}
function renderQuestCard(){
  const q=quest.list.find(q=>!q.done)||quest.list[0];if(!q)return;
  $('qcName').textContent=q.txt;
  $('qcProg').textContent=(q.done?'COMPLETE':q.p+' / '+q.n);
  $('qcXP').textContent='+'+q.xp;
}

/* ================= LOBBY UI (tabs) ================= */
function showTab(name){
  document.querySelectorAll('.tbTab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  const tabs=['play','overview','shop','locker','quests','career'];
  for(const t of tabs){
    const id=t==='play'?'playPanel':t+'Panel';
    const el=$(id);if(el)el.classList.toggle('hidden',t!==name);
  }
  $('newsCard').classList.toggle('hidden',name!=='play');
  if(name==='quests')renderQuests();
}
function renderCareer(){
  const lv=levelFromXP(stats.totalXP),el=$('careerList');
  el.innerHTML='<div class="cRow"><span>Account Level</span><b>'+lv.l+'</b></div>'
    +'<div class="cRow"><span>Total XP</span><b>'+stats.totalXP+'</b></div>'
    +'<div class="cRow"><span>Victory Royales</span><b>'+stats.wins+'</b></div>'
    +'<div class="cRow"><span>Matches</span><b>'+stats.matches+'</b></div>'
    +'<div class="cRow"><span>Best Elims</span><b>'+stats.bestKills+'</b></div>'
    +'<div class="cRow"><span>Total Elims</span><b>'+stats.totalKills+'</b></div>';
}
function renderShop(){
  const el=$('shopGrid'),grads=['linear-gradient(140deg,#35558f,#7fc0e8)','linear-gradient(140deg,#6e2a8f,#e05fb0)',
    'linear-gradient(140deg,#2f7a3a,#a8d84e)','linear-gradient(140deg,#8f6a1f,#ffd23a)'];
  el.innerHTML='';
  for(let i=0;i<4;i++){
    const o=OUTFITS[i],d=document.createElement('div');d.className='shopCard';d.style.background=grads[i];
    d.innerHTML='<div class="sName">'+o.name+'</div><div class="sPrice">🔒 1,'+(200+i*400)+'</div>';
    d.onclick=()=>toast('The shop opens in a future update — keep winning!');
    el.appendChild(d);
  }
}

/* ================= persistence + lobby ================= */
function loadSave(){
  try{stats=Object.assign(stats,JSON.parse(localStorage.getItem('br_stats_v2')||'{}'));
    const id=localStorage.getItem('br_outfit'),o=OUTFITS.find(o=>o.id===id);if(o)curOutfit=o;}catch(e){}
}
function saveSave(){
  try{localStorage.setItem('br_stats_v2',JSON.stringify(stats));
    localStorage.setItem('br_outfit',curOutfit.id);}catch(e){}
}
function outfitUnlocked(o){return !o.lock||((o.lock.wins||0)<=stats.wins&&(o.lock.elims||0)<=stats.bestKills);}
function renderLobby(){
  const lv=levelFromXP(stats.totalXP);
  $('xpVal').textContent=stats.totalXP;
  $('lvlNum').textContent=lv.l;
  $('lvlFill').style.width=Math.round(100*lv.into/lv.need)+'%';
  $('musicBtn').classList.toggle('off',!musicOn);
  const grid=$('outfitGrid');grid.innerHTML='';
  const LOCK='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="4" y="11" width="16" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  for(const o of OUTFITS){
    const un=outfitUnlocked(o),d=document.createElement('div');
    d.className='outfit'+(o.id===curOutfit.id?' equipped':'')+(un?'':' locked');
    d.innerHTML='<div class="swatches"><i style="background:'+o.shirt+'"></i><i style="background:'+o.pants+'"></i><i style="background:'+o.pack+'"></i><i style="background:'+o.hair+'"></i></div>'
      +'<div class="oName">'+o.name+'</div>'+(un?'':'<div class="oLock">'+LOCK+' '+o.lockText+'</div>')
      +(o.id===curOutfit.id?'<div class="oEq">EQUIPPED</div>':'');
    d.onclick=()=>{if(!un){SFX.empty();d.classList.remove('deny');void d.offsetWidth;d.classList.add('deny');return;}
      audioInit();applyOutfit(o);saveSave();renderLobby();SFX.swap();};
    grid.appendChild(d);
  }
  renderQuestCard();renderQuests();renderCareer();renderShop();
  if(pendingUnlocks.length){
    const b=$('unlockBanner');b.textContent='NEW OUTFIT UNLOCKED — '+pendingUnlocks.join(', ');
    b.classList.remove('hidden');pendingUnlocks.length=0;
    clearTimeout(renderLobby._t);renderLobby._t=setTimeout(()=>b.classList.add('hidden'),5000);
  }
}
function findScenicSpot(){
  const cands=[[0,0],[26,18],[-24,22],[18,-26],[-20,-24],[42,10],[-42,-12],[10,44],[-10,-44]];
  for(const [x,z] of cands){let ok=true;
    for(const c of worldCircles)if(dist2(x,z,c.x,c.z)<40)ok=false;
    for(const h of HOUSE_SPOTS)if(dist2(x,z,h[0],h[1])<225)ok=false;
    if(ok)return{x,y:terrainHeight(x,z),z};}
  return{x:0,y:terrainHeight(0,0),z:0};
}
function buildLobbyPads(){
  const mkPad=(x,z,r,c)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*0.92,0.12,28),
      new THREE.MeshPhongMaterial({color:c,emissive:c,emissiveIntensity:0.9,shininess:60}));
    m.position.set(x,terrainHeight(x,z)+0.02,z);scene.add(m);lobbyPads.push(m);return m;
  };
  mkPad(menuSpot.x,menuSpot.z,1.7,0x37c8ff);
  for(let i=0;i<4;i++){
    const a=rand(0,6.28),r=rand(3.4,6.5);
    mkPad(menuSpot.x+Math.cos(a)*r,menuSpot.z+Math.sin(a)*r,rand(0.7,1.1),0x2a86c8);
  }
}

/* ================= match flow / damage ================= */
function applyDamage(ent,dmg,source,opts={}){
  if(!ent.alive||game.state==='MENU')return;
  dmg=Math.round(dmg);if(dmg<=0)return;
  if(opts.storm)ent.hp-=dmg;
  else{const s=Math.min(ent.shield,dmg);ent.shield-=s;ent.hp-=dmg-s;if(ent.isPlayer)hud.flashDamage();}
  if(ent.hp<=0){ent.hp=0;eliminate(ent,source,opts.storm);}
}
function eliminate(v,killer,stormK=false){
  if(!v.alive)return;v.alive=false;
  if(v.isPlayer){
    if(killer&&killer.emoteT!==undefined)killer.emoteT=1.6;
    hud.killfeedAdd(killer?killer.name:null,'YOU',true,stormK);endDefeat(killer,stormK);return;}
  v.sprite.visible=false;effects.push({type:'fall',group:v.group,t:0});dropFromEntity(v);
  if(killer===player){
    player.kills++;SFX.elim();questEvent('elims');
    const inst=currentInst(),extra=(inst&&inst!=='pickaxe')?' with '+WEAPONS[inst.id].short:'';
    hud.announce('ELIMINATED '+v.name,aliveCount()+' PLAYERS REMAIN',1700);
    hud.killfeedAdd('YOU',v.name+' ('+v.kills+')',true,false,extra);hud.refreshHotbar();
  }else if(killer&&killer.name){
    if(killer.kills!==undefined)killer.kills++;
    if(killer.emoteT!==undefined)killer.emoteT=1.6;
    hud.killfeedAdd(killer.name,v.name+' ('+v.kills+')');}
  else hud.killfeedAdd(null,v.name+' ('+v.kills+')',false,stormK);
  checkVictory();
}
function checkVictory(){if(game.state==='PLAY'&&player.alive&&bots.every(b=>!b.alive))endVictory();}
function finishStats(win){
  const before=OUTFITS.filter(o=>!outfitUnlocked(o)).map(o=>o.id);
  stats.matches++;stats.totalKills+=player.kills;
  if(win){stats.wins++;questEvent('win');}
  stats.bestKills=Math.max(stats.bestKills,player.kills);
  lastXPGain=XP_BASE_MATCH+player.kills*XP_PER_KILL+(win?XP_WIN_BONUS:0);
  stats.totalXP+=lastXPGain;saveSave();
  for(const o of OUTFITS)if(!before.includes(o.id)&&outfitUnlocked(o))pendingUnlocks.push(o.name);
  return lastXPGain;
}
function endDefeat(killer,stormK){
  game.state='OVER';document.exitPointerLock&&document.exitPointerLock();
  const g=finishStats(false);SFX.lose();
  $('overPlace').textContent='#'+(bots.filter(b=>b.alive).length+1);
  $('overBy').textContent=stormK?'Consumed by the Storm':'Eliminated by '+(killer?killer.name:'the Storm');
  $('overKills').textContent=player.kills;
  $('overXP').textContent='+'+g+' XP';
  showScreen('over');document.body.classList.remove('ingame');
}
function endVictory(){
  game.state='WIN';document.exitPointerLock&&document.exitPointerLock();
  const g=finishStats(true);SFX.win();$('winKills').textContent=player.kills;
  $('winXP').textContent='+'+g+' XP';
  const box=$('winConfetti');box.innerHTML='';
  const cols=['#ffd23a','#35c8ff','#ff5b4d','#3fd24d','#c04dff'];
  for(let i=0;i<44;i++){const d=document.createElement('div');d.className='confetti';
    d.style.left=rand(0,100)+'%';d.style.background=pick(cols);
    d.style.animationDuration=rand(2.2,4.2)+'s';d.style.animationDelay=rand(0,1.2)+'s';box.appendChild(d);}
  showScreen('win');document.body.classList.remove('ingame');
}
function resetMatch(){
  resetBuilding();resetStorm();
  for(const b of bots)scene.remove(b.group);bots.length=0;
  while(lootItems.length)removeLoot(lootItems[0]);
  while(chests.length){const c=chests.pop();chestGroup.remove(c.g);}
  for(const e of effects){if(e.group)scene.remove(e.group);else if(e.obj)scene.remove(e.obj);}
  effects.length=0;
  $('killfeed').innerHTML='';$('dmgLayer').innerHTML='';$('toasts').innerHTML='';
  hideGhosts();buildMode=null;lastWeaponSel=0;
  initBots();spawnInitialLoot();resetPlayer();
  $('scopeOv').classList.add('hidden');
  stormMesh.visible=true;
}
function startMatch(){
  audioInit();musicStop();questEvent('play');resetMatch();
  game.state='DROP';game.paused=false;
  showScreen(null);document.body.classList.add('ingame');
  lockPointer();
  hud.announce('DROPPING IN','Steer with WASD — glider opens automatically',2600);
}
function backToLobby(){
  game.state='MENU';game.paused=false;
  document.exitPointerLock&&document.exitPointerLock();
  stormMesh.visible=false;
  showScreen('lobby');document.body.classList.remove('ingame');
  renderLobby();if(musicOn){audioInit();musicStart();}
}
function showScreen(name){
  for(const id of ['lobby','pause','over','win'])$(id).classList.toggle('hidden',id!==name);
}
function lockPointer(){
  try{const p=renderer.domElement.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(e){}
}

/* ================= input ================= */
function toggleBuild(type){
  if(game.state!=='PLAY')return;
  if(buildMode===type){exitBuildMode();return;}
  if(!buildMode)lastWeaponSel=player.sel||0;
  buildMode=type;lastBuildType=type;SFX.swap();
}
function exitBuildMode(){buildMode=null;hideGhosts();selectSlot(lastWeaponSel||0);}
function cycleWeapon(dirn){
  if(buildMode)exitBuildMode();
  const avail=[0];player.inv.forEach((s,i)=>{if(s)avail.push(i+1);});
  let ci=avail.indexOf(player.sel);if(ci<0)ci=0;
  ci=(ci+dirn+avail.length)%avail.length;
  selectSlot(avail[ci]);SFX.swap();
}
function bindInput(){
  const cv=renderer.domElement;
  document.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('keydown',e=>{
    if(e.code==='Space')e.preventDefault();
    if(game.state==='MENU'){
      if(e.code==='Enter'){startMatch();return;}
      if(e.code==='KeyL'){showTab('locker');return;}
      if(e.code==='Tab'){e.preventDefault();showTab($('questsPanel').classList.contains('hidden')?'quests':'play');return;}
      if(e.code==='KeyM'){musicToggle();renderLobby();return;}
    }
    game.keys[e.code]=true;
    if(game.state!=='PLAY'&&game.state!=='DROP')return;
    if(e.code==='Digit1')toggleBuild('wall');
    if(e.code==='Digit2')toggleBuild('ramp');
    if(e.code==='Digit3')toggleBuild('floor');
    if(e.code==='Digit4'&&game.state==='PLAY'){buildMode=null;hideGhosts();selectSlot(0);}
    if(e.code==='KeyQ'){if(buildMode)exitBuildMode();
      else if(game.state==='PLAY'){lastWeaponSel=player.sel||0;buildMode=lastBuildType;SFX.swap();}}
    if(e.code==='KeyR')tryReload();
    if(e.code==='KeyE')pickupNearest();
    if(e.code==='KeyX')useShieldPot();
    if(e.code==='KeyC')useMedkit();
    if(e.code==='KeyB')startEmote();
  });
  document.addEventListener('keyup',e=>{delete game.keys[e.code];});
  window.addEventListener('blur',()=>{game.keys={};game.lmb=false;player.aiming=false;});
  document.addEventListener('mousedown',e=>{
    if(document.pointerLockElement!==cv&&(game.state==='PLAY'||game.state==='DROP')&&!game.paused){lockPointer();return;}
    if(e.button===0){game.lmb=true;game.lmbClick=true;}
    if(e.button===2&&game.state==='PLAY'&&!buildMode)player.aiming=true;
  });
  document.addEventListener('mouseup',e=>{if(e.button===0)game.lmb=false;if(e.button===2)player.aiming=false;});
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
    if(!locked&&(game.state==='PLAY'||game.state==='DROP')&&player.alive){game.paused=true;showScreen('pause');}
    else if(locked){game.paused=false;if(game.state!=='MENU')showScreen(null);}
  });
  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });
  document.querySelectorAll('.tbTab').forEach(b=>b.onclick=()=>{audioInit();showTab(b.dataset.tab);SFX.swap();});
  $('playBtn').onclick=startMatch;
  $('gearBtn').onclick=()=>toast('Settings — nothing to tune here yet!');
  $('musicBtn').onclick=()=>{musicToggle();renderLobby();};
  $('resumeBtn').onclick=lockPointer;
  $('pauseRestart').onclick=startMatch;
  $('pauseMenu').onclick=backToLobby;
  $('overAgain').onclick=startMatch;
  $('overMenu').onclick=backToLobby;
  $('winAgain').onclick=startMatch;
  $('winMenu').onclick=backToLobby;
}

/* ================= main loop ================= */
let lastT=performance.now();
function loop(t){
  requestAnimationFrame(loop);
  const dt=clamp((t-lastT)/1000,0,0.05);lastT=t;
  game.time+=dt;updateWorld(dt);
  if(game.state==='MENU'){
    const ts=t*0.001,a=Math.sin(ts*0.22)*0.45;
    for(let i=0;i<lobbyPads.length;i++){
      const p=lobbyPads[i];
      p.material.emissiveIntensity=0.75+Math.sin(ts*2.2-i*0.7)*0.25;
    }
    if(player.group&&player.limbs){
      player.group.position.set(menuSpot.x,menuSpot.y+Math.sin(ts*1.6)*0.03,menuSpot.z);
      player.group.rotation.y=a;
      player.limbs.lArm.rotation.x=Math.sin(ts*1.6)*0.05-0.08;
      player.limbs.rArm.rotation.x=-Math.sin(ts*1.6)*0.05-0.08;
      player.limbs.lLeg.rotation.x=0;player.limbs.rLeg.rotation.x=0;}
    camera.position.set(menuSpot.x+Math.sin(a*0.6)*4.6,menuSpot.y+2.05+Math.sin(ts*0.5)*0.06,menuSpot.z+Math.cos(a*0.6)*4.6);
    camera.lookAt(menuSpot.x,menuSpot.y+1.25,menuSpot.z);
    camera.fov=52;camera.updateProjectionMatrix();
    sun.target.position.set(menuSpot.x,0,menuSpot.z);
    renderer.render(scene,camera);return;
  }
  // cámara cinemática en victoria/derrota
  if(game.state==='WIN'||game.state==='OVER'){
    const ts=t*0.001,a=ts*0.5,c=player.pos;
    camera.position.set(c.x+Math.sin(a)*7,c.y+3.2,c.z+Math.cos(a)*7);
    camera.lookAt(c.x,c.y+1.4,c.z);
    camera.fov=55;camera.updateProjectionMatrix();
    sun.target.position.set(c.x,0,c.z);
    updateEffects(dt);
    renderer.render(scene,camera);game.lmbClick=false;return;
  }
  if(!game.paused){
    updatePlayer(dt);updateBots(dt);updateStorm(dt);updateBuilding(dt);updateWeapons(dt);updateLoot(dt);updateEffects(dt);
    const def=currentDef();
    $('scopeOv').classList.toggle('hidden',
      !(game.state==='PLAY'&&player.alive&&player.aiming&&def&&!def.melee&&def.scope));
    if(game.state==='PLAY'&&player.alive&&!player.dropping){
      const ch=nearestChest(player.pos,CFG.PICKUP_RANGE);
      if(ch){hud.showInteract(ch.supply?'OPEN SUPPLY DROP':'OPEN CHEST',ch.supply?'#66e0ff':'#ffd23a');}
      else{const it=nearestLoot(player.pos,CFG.PICKUP_RANGE);
        hud.showInteract(it?lootLabel(it):null,it?lootColor(it):null);}
      $('buildHint').classList.toggle('hidden',!buildMode);
      if(buildMode)$('buildHint').textContent=buildMode.toUpperCase()+' — hold LMB to place ('+CFG.BUILD_COST+' mats) · Q to exit';
    }else{hud.showInteract(null);$('buildHint').classList.add('hidden');}
    $('dropHint').classList.toggle('hidden',game.state!=='DROP');
    hud.update(dt);
    sun.target.position.set(player.pos.x,0,player.pos.z);
  }
  renderer.render(scene,camera);
  game.lmbClick=false;
}

/* ================= boot ================= */
try{
  initWorld();initBuilding();initLoot();initWeapons();initPlayer();initStorm();
  sun.shadow.camera.updateProjectionMatrix();
  loadSave();applyOutfit(curOutfit);rollQuests();
  hud.init();
  menuSpot=findScenicSpot();
  buildLobbyPads();
  sun.target.position.set(menuSpot.x,0,menuSpot.z);
  // event hooks: pickups & harvesting feed quests
  const _toast=toast;
  toast=function(html){
    if(html.indexOf('Shield Potion')>=0)questEvent('shield');
    if(html.indexOf('Med Kit')>=0)questEvent('med');
    if(html.indexOf('Ammo')>=0)questEvent('ammo');
    if(html.indexOf('Materials')>=0)questEvent('mats',60);
    _toast(html);
  };
  const _ft=hud.floatText.bind(hud);
  hud.floatText=function(p,txt){const m=/\+(\d+)/.exec(txt||'');if(m)questEvent('mats',+m[1]);_ft(p,txt);};
  document.addEventListener('pointerdown',function once(){audioInit();if(musicOn&&game.state==='MENU')musicStart();
    document.removeEventListener('pointerdown',once);});
  bindInput();showTab('play');renderLobby();showScreen('lobby');
  requestAnimationFrame(loop);
}catch(err){
  const e=$('errbox');e.style.display='block';e.textContent='Boot error: '+err.message;
}
