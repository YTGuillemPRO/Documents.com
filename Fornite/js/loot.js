const chests=[];const chestGroup=new THREE.Group();
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
// en updateLoot añade:
for(const c of chests){
  if(c.opening>0&&c.opening<0.5){c.opening+=dt;c.lid.rotation.x=-Math.min(1.5,c.opening*4);}
  if(!c.opened)c.beam.material.opacity=0.2+Math.sin(game.time*3+c.phase)*0.1;
}
// en spawnInitialLoot, al final:
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
// pickupNearest queda:
function pickupNearest(){
  if(game.state!=='PLAY'||!player.alive||player.dropping)return;
  const ch=nearestChest(player.pos,CFG.PICKUP_RANGE);
  if(ch){openChest(ch);return;}
  const it=nearestLoot(player.pos,CFG.PICKUP_RANGE);
  if(it)pickupLoot(it);else SFX.empty();
}
