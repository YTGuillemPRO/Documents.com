// ============ Rarity loot: weapons, shield potions, med kits, ammo, mats ============
const lootItems=[];
const lootGroup=new THREE.Group();

function initLoot(){ scene.add(lootGroup); }
function rollRarity(){ return weighted(RARITIES.map((r,i)=>[i,r.weight])); }
function rollWeaponId(){ return weighted(WEAPON_DROP); }

function makeLootMesh(item){
  const g=new THREE.Group();
  const col=item.kind==='weapon'?RARITIES[item.rarity].color:
    item.kind==='shield'?'#35c8ff':item.kind==='medkit'?'#ff5b4d':item.kind==='ammo'?'#e0b174':'#c49a62';
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.05,8,24),
    new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.85}));
  ring.rotation.x=Math.PI/2; ring.position.y=0.06; g.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,5,10,1,true),
    new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.14,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  beam.position.y=2.5; g.add(beam);
  let m;
  if(item.kind==='weapon'){ m=makeWeaponMesh(item.id,item.rarity); m.scale.set(1.15,1.15,1.15); }
  else if(item.kind==='shield'){
    m=new THREE.Group();
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,0.42,8),matL('#35c8ff')); b.position.y=0.21; m.add(b);
    const c=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.12,8),matL('#dff4ff')); c.position.y=0.48; m.add(c);
  }
  else if(item.kind==='medkit'){
    m=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,0.4),matL('#f2f4f8')); b.position.y=0.15; m.add(b);
    const c1=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.08,0.1),matL('#ff5b4d')); c1.position.y=0.31; m.add(c1);
    const c2=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.08,0.3),matL('#ff5b4d')); c2.position.y=0.31; m.add(c2);
  }
  else if(item.kind==='ammo'){
    m=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.26,0.3),matL('#3a4254')); b.position.y=0.13; m.add(b);
    const t=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.1,0.2),matL('#e0b174')); t.position.y=0.3; m.add(t);
  }
  else {
    m=new THREE.Group();
    for(let i=0;i<3;i++){ const p=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.08,0.24),matL('#b98a4e'));
      p.position.set(rand(-0.06,0.06),0.06+i*0.09,rand(-0.06,0.06)); p.rotation.y=rand(-0.3,0.3); m.add(p); }
  }
  m.position.y=0.6; g.add(m);
  return g;
}

function addLootItem(item,x,y,z){
  item.pos=V3(x,y,z); item.phase=rand(0,6.28);
  item.group=makeLootMesh(item); item.group.position.set(x,y,z);
  lootGroup.add(item.group); lootItems.push(item);
}

function spawnInitialLoot(){
  for(let i=0;i<CFG.LOOT_COUNT;i++){
    const kind=weighted([['weapon',44],['shield',20],['medkit',12],['ammo',12],['mats',12]]);
    const item={kind};
    if(kind==='weapon'){ item.id=rollWeaponId(); item.rarity=rollRarity(); item.reserve=WEAPONS[item.id].mag*2; }
    if(i%4===0&&lootSpots.length){ const s=pick(lootSpots); addLootItem(item,s[0],s[1],s[2]); }
    else{
      const a=rand(0,6.28), r=Math.sqrt(Math.random())*226+6;
      addLootItem(item,Math.cos(a)*r,terrainHeight(Math.cos(a)*r,Math.sin(a)*r)+0.05,Math.sin(a)*r);
    }
  }
}

function updateLoot(dt){
  const t=game.time;
  for(const it of lootItems){
    it.group.position.y=it.pos.y+Math.sin(t*2+it.phase)*0.12;
    it.group.children[2].rotation.y=t*1.4+it.phase;
  }
  // walk-over auto pickup for ammo & materials
  if(game.state!=='PLAY'||!player.alive||player.dropping)return;
  for(let i=lootItems.length-1;i>=0;i--){
    const it=lootItems[i];
    if(it.kind!=='ammo'&&it.kind!=='mats')continue;
    if(it.kind==='mats'&&player.mats>=CFG.MATS_MAX)continue;
    if(Math.abs(player.pos.y-it.pos.y)<3&&
       dist2(player.pos.x,player.pos.z,it.pos.x,it.pos.z)<CFG.AUTOPICK_RANGE*CFG.AUTOPICK_RANGE)pickupLoot(it);
  }
}

function nearestLoot(pos,maxD){
  let best=null,bd=maxD*maxD;
  for(const it of lootItems){
    const d=dist2(pos.x,pos.z,it.pos.x,it.pos.z)+(pos.y-it.pos.y)*(pos.y-it.pos.y)*0.3;
    if(d<bd){bd=d;best=it;}
  }
  return best;
}
function lootLabel(it){
  if(it.kind==='weapon')return RARITIES[it.rarity].name+' '+WEAPONS[it.id].name;
  return{shield:'Shield Potion',medkit:'Med Kit',ammo:'Ammo Box',mats:'Materials'}[it.kind];
}
function lootColor(it){ return it.kind==='weapon'?RARITIES[it.rarity].color:'#ffffff'; }
function removeLoot(it){ lootGroup.remove(it.group); const i=lootItems.indexOf(it); if(i>=0)lootItems.splice(i,1); }

function toast(html){
  const box=$('toasts'); if(!box)return;
  const d=document.createElement('div'); d.className='toast'; d.innerHTML=html;
  box.appendChild(d);
  while(box.children.length>4)box.firstChild.remove();
  setTimeout(()=>{d.classList.add('out'); setTimeout(()=>d.remove(),320);},2200);
}

function pickupLoot(it){
  const p=player;
  if(it.kind==='weapon'){
    const old=giveWeapon(it.id,it.rarity,it.reserve);
    if(old)addLootItem({kind:'weapon',id:old.id,rarity:old.rarity,reserve:old.reserve},
      p.pos.x+rand(-0.8,0.8),terrainHeight(p.pos.x,p.pos.z)+0.05,p.pos.z+rand(-0.8,0.8));
    toast('Picked up <b style="color:'+RARITIES[it.rarity].color+'">'+RARITIES[it.rarity].name+' '+WEAPONS[it.id].name+'</b>');
  }
  else if(it.kind==='shield'){
    if(p.shieldPots>=3){toast('Shield Potions full');return;}
    p.shieldPots++; toast('Shield Potion +1');
  }
  else if(it.kind==='medkit'){
    if(p.medkits>=2){toast('Med Kits full');return;}
    p.medkits++; toast('Med Kit +1');
  }
  else if(it.kind==='ammo'){
    p.inv.forEach(w=>{ if(w)w.reserve=Math.min(999,w.reserve+WEAPONS[w.id].mag*2); });
    toast('Ammo refilled');
  }
  else { p.mats=Math.min(CFG.MATS_MAX,p.mats+60); toast('+60 Materials'); }
  removeLoot(it); SFX.pickup(); hud.updateSlots();
}

function pickupNearest(){
  if(game.state!=='PLAY'||!player.alive||player.dropping)return;
  const it=nearestLoot(player.pos,CFG.PICKUP_RANGE);
  if(it)pickupLoot(it); else SFX.empty();
}

function dropFromEntity(ent){
  const x=ent.pos.x,z=ent.pos.z;
  const id=rollWeaponId();
  addLootItem({kind:'weapon',id,rarity:ent.tier||0,reserve:WEAPONS[id].mag*2},
    x+rand(-1,1),terrainHeight(x+1,z)+0.05,z+rand(-1,1));
  if(Math.random()<0.5)addLootItem({kind:'shield'},x+rand(-1.4,1.4),terrainHeight(x+1.6,z)+0.05,z+rand(-1.4,1.4));
  if(Math.random()<0.35)addLootItem({kind:'medkit'},x+rand(-1.4,1.4),terrainHeight(x,z+1.6)+0.05,z+rand(-1.4,1.4));
}
