// ============ Shrinking storm: shader wall + lightning + supply drops ============
const storm={cx:0,cz:0,r:300,phase:0,mode:'wait',t:0,tcx:0,tcz:0,tr:0,scx:0,scz:0,sr:0,tick:1};
let stormMesh,stormUniforms;const stormFx=[];let boltT=6;
const drops=[];let dropT=CFG.SUPPLY.first;
function initStorm(){
  stormUniforms={uTime:{value:0},uAlpha:{value:0.22}};
  const mat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,fog:false,
    uniforms:stormUniforms,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform float uTime,uAlpha;varying vec2 vUv;void main(){float ang=vUv.x*6.28318;'+
      'float bands=0.5+0.5*sin(ang*60.0+uTime*1.6+sin(vUv.y*14.0+uTime)*1.5);'+
      'float vert=0.5+0.5*sin(vUv.y*24.0-uTime*0.9);'+
      'vec3 col=mix(vec3(0.45,0.12,0.75),vec3(0.85,0.35,1.0),vUv.y*0.7+bands*0.3);'+
      'float a=uAlpha*(0.55+0.45*bands*vert);gl_FragColor=vec4(col,a);}'});
  stormMesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,500,72,1,true),mat);
  stormMesh.position.y=150;stormMesh.visible=false;scene.add(stormMesh);
}
function resetStorm(){
  Object.assign(storm,{cx:0,cz:0,r:300,phase:0,mode:'wait',t:STORM_PHASES[0].wait,tick:1});
  computeTarget();boltT=6;
  for(const d of drops)scene.remove(d.g);drops.length=0;
  dropT=CFG.SUPPLY.first;
  for(let i=stormFx.length-1;i>=0;i--){const f=stormFx[i];scene.remove(f.mesh);scene.remove(f.light);stormFx.splice(i,1);}
}
function computeTarget(){
  const P=STORM_PHASES[storm.phase],maxOff=Math.max(0,storm.r-P.r)*0.7,a=rand(0,6.28),m=rand(0,maxOff);
  storm.tcx=clamp(storm.cx+Math.cos(a)*m,-150,150);storm.tcz=clamp(storm.cz+Math.sin(a)*m,-150,150);
  storm.tr=P.r;storm.scx=storm.cx;storm.scz=storm.cz;storm.sr=storm.r;
}
function inStorm(x,z){return dist2(x,z,storm.cx,storm.cz)>storm.r*storm.r;}
function strikeLightning(){
  const a=rand(0,6.28),rr=Math.sqrt(Math.random())*Math.max(10,storm.r);
  const x=storm.cx+Math.cos(a)*rr,z=storm.cz+Math.sin(a)*rr,gy=terrainHeight(x,z),topY=gy+85,pts=[];
  for(let i=0;i<=8;i++){const t=i/8;pts.push(V3(x+rand(-1,1)*(1-t)*6,topY-(topY-gy)*t+rand(-1,1)*2,z+rand(-1,1)*(1-t)*6));}
  const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,0.35,5,false);
  const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xe6c2ff,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  scene.add(mesh);
  const light=new THREE.PointLight(0xc9a0ff,9,300);light.position.set(x,gy+30,z);scene.add(light);
  stormFx.push({mesh,light,t:0.4});noiseS(0.8,0.22,260);tone(52,0.8,'sine',0.09,-24);
}
/* ---- supply drops ---- */
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
function updateStorm(dt){
  stormUniforms.uTime.value=game.time;
  stormUniforms.uAlpha.value=0.2+Math.sin(game.time*1.5)*0.05;
  storm.t-=dt;
  if(storm.mode==='wait'){if(storm.t<=0){storm.mode='shrink';storm.t=STORM_PHASES[storm.phase].shrink;
    hud.announce('THE STORM IS SHRINKING','Get to the safe zone!',2400);SFX.storm();}}
  else if(storm.mode==='shrink'){
    const P=STORM_PHASES[storm.phase],k=1-storm.t/P.shrink;
    storm.r=lerp(storm.sr,storm.tr,k);storm.cx=lerp(storm.scx,storm.tcx,k);storm.cz=lerp(storm.scz,storm.tcz,k);
    if(storm.t<=0){storm.phase++;
      if(storm.phase<STORM_PHASES.length){storm.mode='wait';storm.t=STORM_PHASES[storm.phase].wait;computeTarget();
        hud.announce('SAFE ZONE REVEALED','Check the map — white circle',2000);}
      else storm.mode='done';}}
  stormMesh.position.set(storm.cx,150,storm.cz);
  stormMesh.scale.set(Math.max(storm.r,0.5),1,Math.max(storm.r,0.5));
  boltT-=dt;
  if(boltT<=0&&CFG.LIGHTNING&&storm.mode!=='done'){boltT=rand(4,9);strikeLightning();}
  for(let i=stormFx.length-1;i>=0;i--){const f=stormFx[i];f.t-=dt;const k=Math.max(0,f.t/0.4);
    f.mesh.material.opacity=k;f.light.intensity=k*9;
    if(f.t<=0){scene.remove(f.mesh);scene.remove(f.light);f.mesh.geometry.dispose();f.mesh.material.dispose();stormFx.splice(i,1);}}
  // supply drops
  dropT-=dt;
  if(dropT<=0&&storm.mode!=='done'&&game.state==='PLAY'){dropT=CFG.SUPPLY.every;spawnSupplyDrop();}
  updateDrops(dt);
  // damage tick
  storm.tick-=dt;
  if(storm.tick<=0){storm.tick=1;
    const dps=STORM_PHASES[Math.min(storm.phase,STORM_PHASES.length-1)].dps;
    for(const e of [player,...bots]){if(!e.alive||e.dropping)continue;
      if(inStorm(e.pos.x,e.pos.z))applyDamage(e,dps,null,{storm:true});}}
}
