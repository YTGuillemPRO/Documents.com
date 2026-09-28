// ============ Rarity loot, chests, supply chests, pickup ============
const lootItems=[];
const lootGroup=new THREE.Group();
const chests=[];const chestGroup=new THREE.Group();
function initLoot(){scene.add(lootGroup);scene.add(chestGroup);}
function rollRarity(){return weighted(RARITIES.map((r,i)=>[i,r.weight]));}
function rollWeaponId(){return weighted(WEAPON_DROP);}
function makeLootMesh(item){
  const g=new THREE.Group();
  const col=item.kind==='weapon'?RARITIES[item.rarity].color:item.kind==='shield'?'#35c8ff':item.kind==='medkit'?'#ff5b4d':item.kind==='ammo'?'#e0b174':'#c49a62';
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.05,8,24),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.85}));
  ring.rotation.x=Math.PI/2;ring.position.y=0.06;g.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,5,10,1,true),
    new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  beam.position.y=2.5;g.add(beam);
  let m;
  if(item.kind==='weapon'){m=makeWeaponMesh(item.id,item.rarity);m.scale.set(1.15,1.15,1.15);}
  else if(item.kind==='shield'){m=new THREE.Group();
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,0.42,8),matL('#35c8ff'));b.position.y=0.21;m.add(b);
    const c=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.12,8),matL('#dff4ff'));c.position.y=0.48;m.add(c);}
  else if(item.kind==='medkit'){m=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,0.4),matL('#f2f4f8'));b.position.y=0.15;m.add(b);
    const c1=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.08,0.1),matL('#ff5b4d'));c1.position.y=0.31;m.add(c1);
    const c2=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.08,0.3),matL('#ff5b4d'));c2.position.y=0.31;m.add(c2);}
  else if(item.kind==='ammo'){m=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.26,0.3),matL('#3a4254'));b.position.y=0.13;m.add(b);
    const t=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.1,0.2),matL('#e0b174'));t.position.y=0.3;m.add(t);}
  else{m=new THREE.Group();
    for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.08,0.24),matL('#b98a4e'));
      p.position.set(rand(-0.06,0.06),0.06+i*0.09,rand(-0.06,0.06));p.rotation.y=rand(-0.3,0.3);m.add(p);}}
  m.position.y=0.6;g.add(m);return g;
}
function addLootItem(item,x,y,z){
  item.pos=V3(x,y,z);item.phase=rand(0,6.28);
  item.group=makeLootMesh(item);item.group.position.set(x,y,z);
  lootGroup.add(item.group);lootItems.push(item);
}
/* ---- chests ---- */
function addChest(x,z,y,opts={}){
  const g=new THREE.Group();
  const bodyC=opts.supply?'#2e6fd8':'#c9983e',glowC=opts.supply?0x66c8ff:0xffc23e;
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.15,0.62,0.8),matL(bodyC));
  base.position.y=0.31;base.castShadow=true;g.add(base);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(1.15,0.34,0.8),matL(opts.supply?'#5aa8ff':'#e8c35a'));
  lid.position.set(0,0.72,0);lid.castShadow=true;g.add(lid);
  const clasp=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.2,0.06),matL('#3a3226'));clasp.position.set(0,0.55,0.41);g.add(clasp);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,5,10,1,true),
    new THREE.MeshBasicMaterial({color:glowC,transparent:true,opacity:0.3,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  beam.position.y=2.8;g.add(beam);
  g.position.set(x,y,z);g.rotation.y=rand(0,6.28);
  chestGroup.add(g);
  chests.push({g,lid,beam,x,z,y,opened:false,opening:0,supply:!!opts.supply,phase:rand(0,6.28)});
}
function nearestChest(pos,maxD){
  let best=null,bd=maxD*maxD;
  for(const c of chests){if(c.opened||c.opening)continue;
    const d=dist2(pos.x,pos.z,c.x,c.z)+(pos.y-c.y)*(pos.y-c.y)*0.3;
    if(d<bd){bd=d;best=c;}}
  return best;
}
function openChest(c){
  if(c.opened||c.opening)return;
  c.opening=0.001;SFX.chest();c.g.remove(c.beam);
  const spawn=(item,rad)=>addLootItem(item,c.x+rand(-rad,rad),c.y+0.05,c.z+rand(-rad,rad));
  const rid=rollWeaponId(),rar=c.supply?4:Math.max(1,rollRarity());
  spawn({kind:'weapon',id:rid,rarity:rar,reserve:WEAPONS[rid].mag*2},0.6);
  spawn({kind:weighted([['shield',30],['medkit',20],['ammo',25],['mats',25]])},1.0);
  spawn({kind:Math.random()<0.5?'ammo':'mats'},1.3);
  toast(c.supply?'Supply Drop opened — <b style="color:#ffa22e">Legendary</b> inside!':'Chest opened');
}
function spawnInitialLoot(){
  for(let i=0;i<CFG.LOOT_COUNT;i++){
    const kind=weighted([['weapon',44],['shield',20],['medkit',12],['ammo',12],['mats',12]]);
    const item={kind};
    if(kind==='weapon'){item.id=rollWeaponId();item.rarity=rollRarity();item.reserve=WEAPONS[item.id].mag*2;}
    if(i%4===0&&lootSpots.length){const s=pick(lootSpots);addLootItem(item,s[0],s[1],s[2]);}
    else{let x=0,z=0,y=-99;
      for(let t=0;t<20&&y<1.0;t++){const a=rand(0,6.28),r=Math.sqrt(Math.random())*196+8;
        x=Math.cos(a)*r;z=Math.sin(a)*r;y=terrainHeight(x,z);}
      addLootItem(item,x,y+0.05,z);}
  }
  // chests: dentro de las casas + repartidas por la isla
  for(const h of HOUSE_SPOTS){
    const off=pick([[-1.5,1.5],[1.5,-1.5],[2.5,2.0]]);
    addChest(h[0]+off[0],h[1]+off[1],terrainHeight(h[0]+off[0],h[1]+off[1])+0.7);
  }
  for(let i=0;i<CFG.CHESTS;i++){
    let x=0,z=0,y=-99;
    for(let t=0;t<20&&y<1.2;t++){const a=rand(0,6.28),r=Math.sqrt(Math.random())*195+10;
      x=Math.cos(a)*r;z=Math.sin(a)*r;y=terrainHeight(x,z);}
    if(y>1.2)addChest(x,z,y);
  }
}
function updateLoot(dt){
  const t=game.time;
  for(const it of lootItems){it.group.position.y=it.pos.y+Math.sin(t*2+it.phase)*0.12;it.group.children[2].rotation.y=t*1.4+it.phase;}
  for(const c of chests){
    if(c.opening>0&&c.opening<0.5){c.opening+=dt;c.lid.rotation.x=-Math.min(1.5,c.opening*4);}
    if(!c.opened)c.beam.material.opacity=0.2+Math.sin(t*3+c.phase)*0.1;
  }
  if(game.state!=='PLAY'||!player.alive||player.dropping)return;
  for(let i=lootItems.length-1;i>=0;i--){
    const it=lootItems[i];
    if(it.kind!=='ammo'&&it.kind!=='mats')continue;
    if(it.kind==='mats'&&player.mats>=CFG.MATS_MAX)continue;
    if(Math.abs(player.pos.y-it.pos.y)<3&&dist2(player.pos.x,player.pos.z,it.pos.x,it.pos.z)<CFG.AUTOPICK_RANGE*CFG.AUTOPICK_RANGE)pickupLoot(it);}
}
function nearestLoot(pos,maxD){
  let best=null,bd=maxD*maxD;
  for(const it of lootItems){const d=dist2(pos.x,pos.z,it.pos.x,it.pos.z)+(pos.y-it.pos.y)*(pos.y-it.pos.y)*0.3;
    if(d<bd){bd=d;best=it;}}
  return best;
}
function lootLabel(it){return it.kind==='weapon'?RARITIES[it.rarity].name+' '+WEAPONS[it.id].name
  :{shield:'Shield Potion',medkit:'Med Kit',ammo:'Ammo Box',mats:'Materials'}[it.kind];}
function lootColor(it){return it.kind==='weapon'?RARITIES[it.rarity].color:'#ffffff';}
function removeLoot(it){lootGroup.remove(it.group);const i=lootItems.indexOf(it);if(i>=0)lootItems.splice(i,1);}
function toast(html){
  const box=$('toasts'),d=document.createElement('div');d.className='toast';d.innerHTML=html;box.appendChild(d);
  while(box.children.length>4)box.firstChild.remove();
  setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),320);},2200);
}
function pickupLoot(it){
  const p=player;
  if(it.kind==='weapon'){
    const old=giveWeapon(it.id,it.rarity,it.reserve);
    if(old)addLootItem({kind:'weapon',id:old.id,rarity:old.rarity,reserve:old.reserve},
      p.pos.x+rand(-0.8,0.8),Math.max(terrainHeight(p.pos.x,p.pos.z),CFG.WATER_Y+0.5)+0.05,p.pos.z+rand(-0.8,0.8));
    toast('Picked up <b style="color:'+RARITIES[it.rarity].color+'">'+RARITIES[it.rarity].name+' '+WEAPONS[it.id].name+'</b>');}
  else if(it.kind==='shield'){if(p.shieldPots>=3){toast('Shield Potions full');return;}p.shieldPots++;toast('Shield Potion +1');}
  else if(it.kind==='medkit'){if(p.medkits>=2){toast('Med Kits full');return;}p.medkits++;toast('Med Kit +1');}
  else if(it.kind==='ammo'){p.inv.forEach(w=>{if(w)w.reserve=Math.min(999,w.reserve+WEAPONS[w.id].mag*2);});toast('Ammo refilled');}
  else{p.mats=Math.min(CFG.MATS_MAX,p.mats+60);toast('+60 Materials');}
  removeLoot(it);SFX.pickup();hud.refreshHotbar();
}
function pickupNearest(){
  if(game.state!=='PLAY'||!player.alive||player.dropping)return;
  const ch=nearestChest(player.pos,CFG.PICKUP_RANGE);
  if(ch){openChest(ch);return;}
  const it=nearestLoot(player.pos,CFG.PICKUP_RANGE);
  if(it)pickupLoot(it);else SFX.empty();
}
function dropFromEntity(ent){
  const x=ent.pos.x,z=ent.pos.z,id=rollWeaponId();
  addLootItem({kind:'weapon',id,rarity:ent.tier||0,reserve:WEAPONS[id].mag*2},x+rand(-1,1),terrainHeight(x+1,z)+0.05,z+rand(-1,1));
  if(Math.random()<0.5)addLootItem({kind:'shield'},x+rand(-1.4,1.4),terrainHeight(x+1.6,z)+0.05,z+rand(-1.4,1.4));
  if(Math.random()<0.35)addLootItem({kind:'medkit'},x+rand(-1.4,1.4),terrainHeight(x,z+1.6)+0.05,z+rand(-1.4,1.4));
}
