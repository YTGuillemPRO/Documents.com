const drops=[];let dropT=CFG.SUPPLY?CFG.SUPPLY.first:45;
function spawnSupplyDrop(){
  const a=rand(0,6.28),r=Math.sqrt(Math.random())*Math.max(20,storm.r*0.75);
  const x=storm.cx+Math.cos(a)*r,z=storm.cz+Math.sin(a)*r;
  const g=new THREE.Group();
  const crate=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.4,1.6),matL('#3b6fd8'));crate.castShadow=true;g.add(crate);
  const band=new THREE.Mesh(new THREE.BoxGeometry(1.66,0.3,1.66),matL('#ffffff'));band.position.y=0.2;g.add(band);
  const balloon=new THREE.Mesh(new THREE.SphereGeometry(1.7,10,8),
    new THREE.MeshPhongMaterial({color:0x9be0ff,emissive:0x4db8ff,emissiveIntensity:0.5,flatShading:true}));
  balloon.position.y=4.6;balloon.scale.y=1.2;g.add(balloon);
  const rope=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,3.4,4),matL('#dddddd'));rope.position.y=2.9;g.add(rope);
  g.position.set(x,120,z);scene.add(g);
  drops.push({g,balloon,x,z,vy:-13,landed:false});
  hud.announce('SUPPLY DROP INCOMING','Legendary loot — watch the sky',2600);SFX.storm();
}
function updateDrops(dt){
  for(let i=drops.length-1;i>=0;i--){
    const d=drops[i];
    if(d.landed)continue;
    d.g.position.y+=d.vy*dt;d.g.rotation.y+=dt*0.6;
    const gy=terrainHeight(d.x,d.z)+0.7;
    if(d.g.position.y<=gy){
      scene.remove(d.g);drops.splice(i,1);
      addChest(d.x,d.z,terrainHeight(d.x,d.z),{supply:true});
      SFX.thud();
    }
  }
}
// dentro de updateStorm, antes del tick de daño:
dropT-=dt;
if(dropT<=0&&storm.mode!=='done'&&game.state==='PLAY'){dropT=CFG.SUPPLY.every;spawnSupplyDrop();}
updateDrops(dt);
