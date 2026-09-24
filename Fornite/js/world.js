// ============ Renderer, lighting, island, static props & collision registry ============
let scene, renderer, camera, sun;
const worldBoxes=[];   // solid AABBs {minX,maxX,minY,maxY,minZ,maxZ} — block movement & bullets
const worldCircles=[]; // {x,z,r,y0,y1,kind:'tree'|'rock'} — block movement, bullets, some LoS
const standables=[];   // {minX,maxX,minZ,maxZ,y} — walkable surfaces (house floors/roofs)
const lootSpots=[];    // guaranteed interior loot points
const mapHouses=[], mapTrees=[], mapRocks=[];
let mapBase=null;

function matL(c){ return new THREE.MeshLambertMaterial({color:c}); }
function addBoxMesh(parent,w,h,d,c,x,y,z,cast=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matL(c));
  m.position.set(x,y,z); m.castShadow=cast; parent.add(m); return m;
}

function initWorld(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x9ed4ff);
  scene.fog=new THREE.Fog(0x9ed4ff,160,520);
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  $('game').appendChild(renderer.domElement);
  camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1400);

  scene.add(new THREE.HemisphereLight(0xbfe0ff,0x6fa053,0.85));
  sun=new THREE.DirectionalLight(0xfff2d8,1.15);
  sun.position.set(90,140,60); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-95,right:95,top:95,bottom:-95,near:20,far:420});
  scene.add(sun); scene.add(sun.target);

  buildTerrain(); buildForest(); buildHouses(); buildClouds(); buildMapBase();
}

function buildTerrain(){
  let g=new THREE.PlaneGeometry(500,500,100,100);
  g.rotateX(-Math.PI/2); g=g.toNonIndexed();
  const pos=g.attributes.position, col=new Float32Array(pos.count*3);
  const cA=new THREE.Color(0x4ea04b), cB=new THREE.Color(0x83cf58), cDry=new THREE.Color(0xa8b85a), tmp=new THREE.Color();
  for(let i=0;i<pos.count;i+=3){
    let h=0;
    for(let v=0;v<3;v++){ const x=pos.getX(i+v), z=pos.getZ(i+v); h+=terrainHeight(x,z); }
    h/=3;
    for(let v=0;v<3;v++){
      const x=pos.getX(i+v), z=pos.getZ(i+v);
      pos.setY(i+v,terrainHeight(x,z));
      tmp.copy(cA).lerp(cB,clamp(h/10+0.5,0,1));
      const n=hash2(x,z);
      if(n>0.9) tmp.lerp(cDry,0.5);
      tmp.offsetHSL(0,0,(n-0.5)*0.05);
      col[(i+v)*3]=tmp.r; col[(i+v)*3+1]=tmp.g; col[(i+v)*3+2]=tmp.b;
    }
  }
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));
  m.receiveShadow=true; scene.add(m);
}

function buildForest(){
  const spots=[];
  for(let i=0;i<CFG.TREES;i++){
    let x,z,ok=false;
    for(let t=0;t<20&&!ok;t++){
      x=rand(-232,232); z=rand(-232,232); ok=true;
      for(const h of HOUSE_SPOTS) if(dist2(x,z,h[0],h[1])<196) ok=false;
      for(const s of spots) if(dist2(x,z,s[0],s[1])<16) ok=false;
    }
    if(!ok)continue; spots.push([x,z]);
    const base=terrainHeight(x,z), g=new THREE.Group(), trunkH=rand(2.6,4);
    const trunk=addBoxMesh? null:null;
    const tm=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.34,trunkH,6),matL(pick(['#7a5230','#6b4626'])));
    tm.position.y=trunkH/2; tm.castShadow=true; g.add(tm);
    if(Math.random()<0.55){ // pine
      const c1=new THREE.Mesh(new THREE.ConeGeometry(rand(1.5,2),rand(2.2,3),7),matL(pick(['#2f8f3f','#3aa34a'])));
      c1.position.y=trunkH+0.8; c1.castShadow=true; g.add(c1);
      const c2=new THREE.Mesh(new THREE.ConeGeometry(rand(1,1.4),rand(1.4,2),7),matL('#46b356'));
      c2.position.y=trunkH+2.1; c2.castShadow=true; g.add(c2);
    } else { // oak
      const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.5,2.2),0),matL(pick(['#46a83c','#57b34a','#3c9a44'])));
      b.position.y=trunkH+1; b.castShadow=true; g.add(b);
      const s=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.8,1.2),0),matL('#5fc04e'));
      s.position.set(rand(-0.8,0.8),trunkH+1.8,rand(-0.8,0.8)); s.castShadow=true; g.add(s);
    }
    g.position.set(x,base,z); scene.add(g);
    worldCircles.push({x,z,r:0.7,y0:base,y1:base+trunkH,kind:'tree'});
    mapTrees.push([x,z]);
  }
  for(let i=0;i<CFG.ROCKS;i++){
    const x=rand(-230,230), z=rand(-230,230), base=terrainHeight(x,z);
    const s=rand(0.9,2.3);
    const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),matL(pick(['#9aa0a8','#8b9099','#a7adb4'])));
    r.geometry.computeVertexNormals();
    r.position.set(x,base+s*0.35,z);
    r.rotation.set(rand(0,3),rand(0,3),rand(0,3));
    r.castShadow=true; scene.add(r);
    worldCircles.push({x,z,r:s*0.85,y0:base,y1:base+s*1.1,kind:'rock'});
    mapRocks.push([x,z]);
  }
}

function buildHouses(){
  HOUSE_SPOTS.forEach((s,i)=>{
    const [cx,cz]=s, base=terrainHeight(cx,cz), fy=base+0.7;
    const g=new THREE.Group(); scene.add(g);
    const wallC=i%2?'#c98d5f':'#d9b07c', roofC='#7a4f35';
    addBoxMesh(g,12,2,12,'#8f9299',cx,fy-1,cz); // foundation (visual)
    standables.push({minX:cx-5.5,maxX:cx+5.5,minZ:cz-5.5,maxZ:cz+5.5,y:fy});
    const doorSide=i%4; // 0=N 1=E 2=S 3=W
    const seg=(x,z,len,alongX)=>{
      addBoxMesh(g,alongX?len:0.4,3.2,alongX?0.4:len,wallC,x,fy+1.6,z);
      worldBoxes.push({minX:x-(alongX?len/2:0.2),maxX:x+(alongX?len/2:0.2),
        minY:fy,maxY:fy+3.2,minZ:z-(alongX?0.2:len/2),maxZ:z+(alongX?0.2:len/2)});
    };
    for(let side=0;side<4;side++){
      const isDoor=side===doorSide;
      if(side===0){ isDoor?(seg(cx-3.25,cz-5,3.9,true),seg(cx+3.25,cz-5,3.9,true)):seg(cx,cz-5,10.4,true); }
      if(side===2){ isDoor?(seg(cx-3.25,cz+5,3.9,true),seg(cx+3.25,cz+5,3.9,true)):seg(cx,cz+5,10.4,true); }
      if(side===1){ isDoor?(seg(cx+5,cz-3.25,3.9,false),seg(cx+5,cz+3.25,3.9,false)):seg(cx+5,cz,10.4,false); }
      if(side===3){ isDoor?(seg(cx-5,cz-3.25,3.9,false),seg(cx-5,cz+3.25,3.9,false)):seg(cx-5,cz,10.4,false); }
    }
    addBoxMesh(g,11,0.3,11,roofC,cx,fy+3.35,cz);
    worldBoxes.push({minX:cx-5.5,maxX:cx+5.5,minY:fy+3.2,maxY:fy+3.5,minZ:cz-5.5,maxZ:cz+5.5});
    standables.push({minX:cx-5.5,maxX:cx+5.5,minZ:cz-5.5,maxZ:cz+5.5,y:fy+3.5});
    lootSpots.push([cx-1.5,fy,cz-1.5],[cx+1.5,fy,cz+1.5],[cx,fy,cz+3.4]);
    mapHouses.push([cx,cz]);
  });
}

function buildClouds(){
  for(let i=0;i<10;i++){
    const g=new THREE.Group();
    for(let j=0;j<randi(2,3);j++)
      addBoxMesh(g,rand(8,16),rand(1.5,2.6),rand(6,10),'#ffffff',rand(-6,6),rand(-1,1),rand(-4,4),false);
    g.position.set(rand(-260,260),rand(75,115),rand(-260,260));
    g.traverse(o=>{ if(o.material)o.material.transparent=true,o.material.opacity=0.85; });
    scene.add(g);
  }
}

// Shared physics helpers -------------------------------------------------
function collideEntity(ent,r){
  const p=ent.pos;
  for(const c of worldCircles){
    const dx=p.x-c.x,dz=p.z-c.z,rr=c.r+r,d2=dx*dx+dz*dz;
    if(d2<rr*rr&&d2>1e-6&&p.y<c.y1&&p.y+1.7>c.y0){ const d=Math.sqrt(d2),push=rr-d; p.x+=dx/d*push; p.z+=dz/d*push; }
  }
  for(const b of worldBoxes) pushBox(p,b,r);
  for(const pc of pieces){ if(!pc.dead&&pc.type==='wall') pushBox(p,pc.aabb,r); }
}
function pushBox(p,b,r){
  if(p.y+1.7<=b.minY||p.y>=b.maxY-0.05)return;
  const ox1=(p.x+r)-b.minX, ox2=b.maxX-(p.x-r); if(ox1<=0||ox2<=0)return;
  const oz1=(p.z+r)-b.minZ, oz2=b.maxZ-(p.z-r); if(oz1<=0||oz2<=0)return;
  if(Math.min(ox1,ox2)<Math.min(oz1,oz2)) p.x+=(ox1<ox2?-ox1:ox2);
  else p.z+=(oz1<oz2?-oz1:oz2);
}

// Ray helpers -------------------------------------------------------------
function rayAABB(o,d,b,maxT){
  let tmin=0,tmax=maxT;
  const ax=[['x','minX','maxX'],['y','minY','maxY'],['z','minZ','maxZ']];
  for(const [a,mn,mx] of ax){
    const dv=d[a],ov=o[a];
    if(Math.abs(dv)<1e-9){ if(ov<b[mn]||ov>b[mx])return -1; continue; }
    let t1=(b[mn]-ov)/dv,t2=(b[mx]-ov)/dv;
    if(t1>t2){const s=t1;t1=t2;t2=s;}
    if(t1>tmin)tmin=t1; if(t2<tmax)tmax=t2;
    if(tmin>tmax)return -1;
  }
  return tmin;
}
function rayCircleXZ(o,d,c,r,maxT){
  const rx=o.x-c.x,rz=o.z-c.z,a=d.x*d.x+d.z*d.z;
  if(a<1e-8)return -1;
  const b=2*(rx*d.x+rz*d.z),cc=rx*rx+rz*rz-r*r,disc=b*b-4*a*cc;
  if(disc<0)return -1;
  const t=(-b-Math.sqrt(disc))/(2*a);
  if(t<0.1||t>maxT)return -1;
  const y=o.y+d.y*t; if(y<c.y0||y>c.y1)return -1;
  return t;
}
function raySphere(o,d,cx,cy,cz,r){
  const ox=o.x-cx,oy=o.y-cy,oz=o.z-cz;
  const b=ox*d.x+oy*d.y+oz*d.z,c=ox*ox+oy*oy+oz*oz-r*r;
  const disc=b*b-c; if(disc<0)return -1;
  return -b-Math.sqrt(disc);
}
function rayTerrain(o,d,maxT){
  if(o.y-terrainHeight(o.x,o.z)<=0)return 0;
  let t=0,step=3;
  while(t<maxT){
    t+=step;
    const y=o.y+d.y*t;
    if(y>140&&d.y>0)return -1;
    if(y-terrainHeight(o.x+d.x*t,o.z+d.z*t)<0){
      let lo=t-step,hi=t;
      for(let i=0;i<6;i++){const m=(lo+hi)/2;(o.y+d.y*m-terrainHeight(o.x+d.x*m,o.z+d.z*m))<0?hi=m:lo=m;}
      return (lo+hi)/2;
    }
    step=Math.min(7,step*1.18);
  }
  return -1;
}
// walls (build pieces + static boxes) — used by bullets AND bot line-of-sight
function bulletsBlockRay(o,d,maxT){
  let bt=maxT,bp=null;
  for(const p of pieces){ if(p.dead||p.type!=='wall')continue;
    const t=rayAABB(o,d,p.aabb,bt); if(t>=0&&t<bt){bt=t;bp=p;} }
  for(const b of worldBoxes){ const t=rayAABB(o,d,b,bt); if(t>=0&&t<bt){bt=t;bp=null;} }
  return bt<maxT?{t:bt,piece:bp}:null;
}

// Pre-rendered minimap terrain -------------------------------------------
function buildMapBase(){
  const S=220; mapBase=document.createElement('canvas'); mapBase.width=S; mapBase.height=S;
  const c=mapBase.getContext('2d');
  for(let py=0;py<S;py+=2)for(let px=0;px<S;px+=2){
    const wx=px/S*480-240,wz=py/S*480-240,h=terrainHeight(wx,wz);
    const g=clamp(120+h*6+hash2(wx,wz)*26,80,190);
    c.fillStyle=`rgb(${Math.floor(g*0.42)},${Math.floor(g)},${Math.floor(g*0.38)})`;
    c.fillRect(px,py,2,2);
  }
  c.fillStyle='#1e4d22'; for(const t of mapTrees) c.fillRect(t[0]/480*S+110-1.5,t[1]/480*S+110-1.5,3,3);
  c.fillStyle='#787f88'; for(const r of mapRocks) c.fillRect(r[0]/480*S+110-1.5,r[1]/480*S+110-1.5,3,3);
  c.fillStyle='#e8e4d8'; for(const h of mapHouses) c.fillRect(h[0]/480*S+110-4,h[1]/480*S+110-4,8,8);
}
