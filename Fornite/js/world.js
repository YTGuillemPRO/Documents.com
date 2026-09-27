// ============ Renderer, sky, ocean, island, props & collision registry ============
let scene, renderer, camera, sun, hemi;
const worldBoxes=[];   // solid AABBs — block movement & bullets
const worldCircles=[]; // {x,z,r,y0,y1,kind:'tree'|'rock'}
const standables=[];   // {minX,maxX,minZ,maxZ,y} — walkable surfaces
const lootSpots=[];    // guaranteed interior loot points
const mapHouses=[], mapTrees=[], mapRocks=[];
let mapBase=null, skyMat=null, waterMat=null, sunSprite=null;
const clouds=[];

// Flat-shaded "toy" material used across the whole game
function matL(c){ return new THREE.MeshPhongMaterial({color:c,shininess:10,flatShading:true}); }
function addBoxMesh(parent,w,h,d,c,x,y,z,cast=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matL(c));
  m.position.set(x,y,z); m.castShadow=cast; m.receiveShadow=true; parent.add(m); return m;
}

function initWorld(){
  scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0xcfe3f4,260,980);
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,CFG.GFX.pixelCap));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;   // fallback path (composer overrides)
  renderer.toneMappingExposure=1.15;
  renderer.outputEncoding=THREE.sRGBEncoding;
  $('game').appendChild(renderer.domElement);
  camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,2000);

  hemi=new THREE.HemisphereLight(0xbfd9ff,0x5d8f4a,0.75); scene.add(hemi);
  sun=new THREE.DirectionalLight(0xffeecf,1.25);
  sun.position.set(90,140,60); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  const sc=sun.shadow.camera;
  sc.left=-70; sc.right=70; sc.top=70; sc.bottom=-70; sc.near=40; sc.far=340;
  sun.shadow.bias=-0.0004;
  scene.add(sun); scene.add(sun.target);

  buildSky(); buildOcean(); buildTerrain(); buildForest();
  buildRocksBushes(); buildGrass(); buildHouses(); buildClouds(); buildMapBase();
}

// ---------- sky ----------
function buildSky(){
  const sunDir=new THREE.Vector3(0.51,0.79,0.34).normalize();
  skyMat=new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false, fog:false,
    uniforms:{ uTop:{value:new THREE.Color(0x3d7dd8)}, uHorizon:{value:new THREE.Color(0xcfe3f4)},
      uSunDir:{value:sunDir} },
    vertexShader:`varying vec3 vDir; void main(){ vDir=normalize(position);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`
      varying vec3 vDir; uniform vec3 uTop,uHorizon,uSunDir;
      void main(){
        float h=clamp(vDir.y,0.0,1.0);
        vec3 col=mix(uHorizon,uTop,pow(h,0.55));
        if(vDir.y<0.0) col=uHorizon*0.92;
        float sd=max(dot(vDir,uSunDir),0.0);
        col+=vec3(1.0,0.85,0.55)*pow(sd,220.0)*1.3;
        col+=vec3(1.0,0.75,0.4)*pow(sd,6.0)*0.18;
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),skyMat);
  sky.frustumCulled=false; scene.add(sky);
  const cv=document.createElement('canvas'); cv.width=cv.height=128;
  const c=cv.getContext('2d'); const g=c.createRadialGradient(64,64,4,64,64,64);
  g.addColorStop(0,'rgba(255,244,214,1)'); g.addColorStop(0.25,'rgba(255,220,150,0.85)'); g.addColorStop(1,'rgba(255,200,120,0)');
  c.fillStyle=g; c.fillRect(0,0,128,128);
  sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),
    blending:THREE.AdditiveBlending, depthWrite:false, fog:false}));
  sunSprite.scale.set(220,220,1);
  sunSprite.position.copy(sunDir).multiplyScalar(760);
  scene.add(sunSprite);
}

// ---------- ocean ----------
function buildOcean(){
  const geo=new THREE.PlaneGeometry(3200,3200,96,96); geo.rotateX(-Math.PI/2);
  waterMat=new THREE.ShaderMaterial({
    transparent:true, fog:false, depthWrite:false,
    uniforms:{ uTime:{value:0},
      uDeep:{value:new THREE.Color(0x1e5d8c)}, uShallow:{value:new THREE.Color(0x39a7c9)},
      uFog:{value:new THREE.Color(0xcfe3f4)} },
    vertexShader:`
      uniform float uTime; varying vec3 vW; varying float vWave;
      void main(){
        vec3 p=position;
        float w=sin(p.x*0.021+uTime*1.4)*cos(p.z*0.017+uTime*1.1)
               +sin(p.x*0.009-p.z*0.012+uTime*0.7)*1.4;
        p.y+=w*0.25; vWave=w;
        vec4 wp=modelMatrix*vec4(p,1.0); vW=wp.xyz;
        gl_Position=projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader:`
      uniform float uTime; uniform vec3 uDeep,uShallow,uFog;
      varying vec3 vW; varying float vWave;
      void main(){
        float dcen=length(vW.xz)/240.0;
        float shore=smoothstep(1.12,0.98,dcen);
        vec3 col=mix(uDeep,uShallow,shore*0.85+0.1);
        float sp=sin(vW.x*0.31+uTime*2.2)*sin(vW.z*0.27-uTime*1.9);
        col+=vec3(0.5)*smoothstep(0.86,1.0,sp)*0.35;
        col+=vec3(1.0)*smoothstep(1.3,2.4,vWave)*0.10;
        float fo=smoothstep(0.955,0.995,dcen)-smoothstep(1.0,1.04,dcen);
        float wob=sin(atan(vW.z,vW.x)*22.0+uTime*1.3)*0.5+0.5;
        col=mix(col,vec3(0.95),clamp(fo*(0.35+wob*0.5),0.0,1.0)*0.8);
        col=mix(col,uFog,smoothstep(420.0,950.0,length(vW.xz)));
        gl_FragColor=vec4(col,0.88);
      }`
  });
  const w=new THREE.Mesh(geo,waterMat); w.position.y=CFG.WATER_Y; w.renderOrder=2; scene.add(w);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(1600,32),new THREE.MeshBasicMaterial({color:0x1d4f66}));
  floor.rotation.x=-Math.PI/2; floor.position.y=CFG.WATER_Y-1.5; scene.add(floor);
}

// ---------- terrain ----------
function buildTerrain(){
  let g=new THREE.PlaneGeometry(560,560,110,110);
  g.rotateX(-Math.PI/2); g=g.toNonIndexed();
  const pos=g.attributes.position;
  for(let i=0;i<pos.count;i++)pos.setY(i,terrainHeight(pos.getX(i),pos.getZ(i)));
  g.computeVertexNormals();
  const nor=g.attributes.normal;
  const col=new Float32Array(pos.count*3);
  const cSand=new THREE.Color(0xe3cd8f), cSandWet=new THREE.Color(0xbfa877),
        cGrass1=new THREE.Color(0x4cab3c), cGrass2=new THREE.Color(0x7ccf52),
        cDry=new THREE.Color(0xb9c24e), cRock=new THREE.Color(0x8d8577),
        cBed=new THREE.Color(0x7fa877), tmp=new THREE.Color();
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), z=pos.getZ(i), y=pos.getY(i), ny=nor.getY(i);
    const n=hash2(x,z), n2=hash2(x*1.7+31,z*1.3+17);
    if(y<CFG.WATER_Y+0.2){
      tmp.copy(cSandWet).lerp(cBed,clamp((CFG.WATER_Y+0.2-y)*0.35,0,1));
    } else if(y<1.35){
      tmp.copy(cSand).lerp(cSandWet,(1.35-y)*0.4); tmp.offsetHSL(0,0,(n-0.5)*0.05);
    } else {
      tmp.copy(cGrass1).lerp(cGrass2,clamp(0.25+(y-1.35)/14+(n2-0.5)*0.9,0,1));
      if(n>0.93)tmp.lerp(cDry,0.6);
      if(ny<0.78)tmp.lerp(cRock,clamp((0.78-ny)*4,0,0.9));
      tmp.offsetHSL(0,0,(n-0.5)*0.045);
    }
    col[i*3]=tmp.r; col[i*3+1]=tmp.g; col[i*3+2]=tmp.b;
  }
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));
  m.receiveShadow=true; scene.add(m);
}

// ---------- trees ----------
function buildForest(){
  const spots=[];
  for(let i=0;i<CFG.TREES;i++){
    let x=0,z=0,y=0,ok=false;
    for(let t=0;t<24&&!ok;t++){
      const a=rand(0,6.28), r=Math.sqrt(Math.random())*205+8;
      x=Math.cos(a)*r; z=Math.sin(a)*r; y=terrainHeight(x,z);
      ok=y>1.4;
      if(ok)for(const h of HOUSE_SPOTS)if(dist2(x,z,h[0],h[1])<196)ok=false;
      if(ok)for(const s of spots)if(dist2(x,z,s[0],s[1])<17)ok=false;
    }
    if(!ok)continue; spots.push([x,z]);
    const g=new THREE.Group(), trunkH=rand(2.8,4.4);
    const tm=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.36,trunkH,6),
      matL(pick(['#7a5230','#6b4626','#84603a'])));
    tm.position.y=trunkH/2; tm.castShadow=true; g.add(tm);
    const autumn=Math.random()<0.08;
    if(Math.random()<0.55){ // pine
      const c1=new THREE.Mesh(new THREE.ConeGeometry(rand(1.7,2.2),rand(2.4,3.1),7),matL(pick(['#2f8f3f','#37a34a'])));
      c1.position.y=trunkH+0.9; c1.castShadow=true; g.add(c1);
      const c2=new THREE.Mesh(new THREE.ConeGeometry(rand(1.15,1.5),rand(1.7,2.2),7),matL(autumn?'#d88f2f':'#4fbf5f'));
      c2.position.y=trunkH+2.3; c2.castShadow=true; g.add(c2);
    } else { // oak
      const fc=autumn?pick(['#e09a37','#d8702f']):pick(['#46a83c','#57b34a','#3c9a44','#5fc04e']);
      const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.7,2.4),0),matL(fc));
      b.position.y=trunkH+1.05; b.castShadow=true; g.add(b);
      const s1=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.9,1.3),0),matL(fc));
      s1.position.set(rand(-1,1),trunkH+1.9,rand(-1,1)); s1.castShadow=true; g.add(s1);
      const s2=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.6,1.0),0),matL(fc));
      s2.position.set(rand(-1.2,1.2),trunkH+0.7,rand(-1.2,1.2)); s2.castShadow=true; g.add(s2);
    }
    g.position.set(x,y-0.15,z); g.rotation.y=rand(0,6.28);
    const sc=rand(0.9,1.25); g.scale.set(sc,rand(0.95,1.3),sc);
    scene.add(g);
    worldCircles.push({x,z,r:0.7,y0:y,y1:y+trunkH*sc+2.8,kind:'tree'});
    mapTrees.push([x,z]);
  }
}

// ---------- rocks & bushes ----------
function buildRocksBushes(){
  for(let i=0;i<CFG.ROCKS;i++){
    let x=0,z=0,y=0,ok=false;
    for(let t=0;t<15&&!ok;t++){
      const a=rand(0,6.28), r=Math.sqrt(Math.random())*200+10;
      x=Math.cos(a)*r; z=Math.sin(a)*r; y=terrainHeight(x,z); ok=y>1.2;
    }
    if(!ok)continue;
    const s=rand(0.9,2.6);
    const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),
      matL(pick(['#9aa0a8','#8b9099','#a7adb4','#7f8894'])));
    r.position.set(x,y+s*0.32,z); r.rotation.set(rand(0,3),rand(0,3),rand(0,3));
    r.castShadow=true; r.receiveShadow=true; scene.add(r);
    worldCircles.push({x,z,r:s*0.85,y0:y,y1:y+s*1.15,kind:'rock'});
    mapRocks.push([x,z]);
  }
  for(let i=0;i<70;i++){
    const a=rand(0,6.28), r=Math.sqrt(Math.random())*200+10;
    const x=Math.cos(a)*r, z=Math.sin(a)*r, y=terrainHeight(x,z);
    if(y<1.4)continue;
    let near=false; for(const h of HOUSE_SPOTS)if(dist2(x,z,h[0],h[1])<150)near=true;
    if(near)continue;
    const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.5,0.95),0),
      matL(pick(['#3f9c3f','#4fae4a','#59b84f'])));
    b.position.set(x,y+0.25,z); b.scale.y=0.75; b.castShadow=true; scene.add(b);
  }
}

// ---------- instanced grass tufts ----------
function buildGrass(){
  const w=0.55,h=0.5;
  const verts=new Float32Array([
    -w,0,0,  w,0,0,  w,h,0,  -w,0,0,  w,h,0,  -w,h,0,
    0,0,-w,  0,0,w,  0,h,w,  0,0,-w,  0,h,w,  0,h,-w ]);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(verts,3));
  geo.computeVertexNormals();
  const inst=new THREE.InstancedMesh(geo,
    new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}),1400);
  const M=new THREE.Matrix4(), Q=new THREE.Quaternion(), S=V3(), T=V3(), up=V3(0,1,0), c=new THREE.Color();
  let placed=0, guard=0;
  while(placed<1400&&guard++<8400){
    const a=rand(0,6.28), r=Math.sqrt(Math.random())*202+6;
    const x=Math.cos(a)*r, z=Math.sin(a)*r, y=terrainHeight(x,z);
    if(y<1.5||y>13)continue;
    let near=false; for(const hs of HOUSE_SPOTS)if(dist2(x,z,hs[0],hs[1])<130)near=true;
    if(near)continue;
    Q.setFromAxisAngle(up,rand(0,6.28));
    const s=rand(0.7,1.6); S.set(s,rand(0.8,1.7)*s,s); T.set(x,y,z);
    M.compose(T,Q,S); inst.setMatrixAt(placed,M);
    if(Math.random()<0.06)c.setHex(0xffd23a);
    else if(Math.random()<0.05)c.setHex(0xffffff);
    else c.setHSL(0.29+rand(-0.03,0.03),0.55,0.32+rand(0,0.14));
    inst.setColorAt(placed,c);
    placed++;
  }
  inst.count=placed; inst.instanceMatrix.needsUpdate=true;
  if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
  scene.add(inst);
}

// ---------- houses ----------
function buildHouses(){
  HOUSE_SPOTS.forEach((s,i)=>{
    const [cx,cz]=s, base=terrainHeight(cx,cz), fy=base+0.7;
    const g=new THREE.Group(); scene.add(g);
    const wallC=i%2?'#c98d5f':'#d9b07c', trim='#7a4f35';
    addBoxMesh(g,12,2,12,'#8f9299',cx,fy-1,cz);
    addBoxMesh(g,12.6,0.5,12.6,'#6e7178',cx,fy-0.15,cz);
    standables.push({minX:cx-5.5,maxX:cx+5.5,minZ:cz-5.5,maxZ:cz+5.5,y:fy});
    const doorSide=i%4;
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
    addBoxMesh(g,11,0.3,11,trim,cx,fy+3.35,cz);
    worldBoxes.push({minX:cx-5.5,maxX:cx+5.5,minY:fy+3.2,maxY:fy+3.5,minZ:cz-5.5,maxZ:cz+5.5});
    standables.push({minX:cx-5.5,maxX:cx+5.5,minZ:cz-5.5,maxZ:cz+5.5,y:fy+3.5});
    addBoxMesh(g,11.8,0.5,11.8,'#5e3c28',cx,fy+3.7,cz);         // roof trim
    addBoxMesh(g,0.9,2.2,0.9,'#8d6e63',cx+3.2,fy+4.8,cz-3.2);   // chimney
    // glowing windows (skipped on the door wall)
    const winMat=new THREE.MeshPhongMaterial({color:0xffe6a8,emissive:0xffc25e,emissiveIntensity:0.85,shininess:30});
    const frameM=matL('#5b4632');
    for(let side=0;side<4;side++){
      if(side===doorSide)continue;
      for(const off of [-2.5,2.5]){
        const alongX=(side===0||side===2);
        const wx=alongX?cx+off:(side===1?cx+5.02:cx-5.02);
        const wz=alongX?(side===0?cz-5.02:cz+5.02):cz+off;
        const wmesh=new THREE.Mesh(new THREE.BoxGeometry(alongX?1.1:0.12,1.0,alongX?0.12:1.1),winMat);
        wmesh.position.set(wx,fy+2.1,wz); g.add(wmesh);
        const fr=new THREE.Mesh(new THREE.BoxGeometry(alongX?1.34:0.2,1.24,alongX?0.2:1.34),frameM);
        fr.position.set(wx,fy+2.1,wz); g.add(fr);
      }
    }
    lootSpots.push([cx-1.5,fy,cz-1.5],[cx+1.5,fy,cz+1.5],[cx,fy,cz+3.4]);
    mapHouses.push([cx,cz]);
  });
}

// ---------- clouds ----------
function buildClouds(){
  for(let i=0;i<12;i++){
    const g=new THREE.Group();
    for(let j=0;j<randi(3,5);j++){
      const m=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(3,7),0),
        new THREE.MeshPhongMaterial({color:0xffffff,emissive:0xdfe9ff,emissiveIntensity:0.35,
          flatShading:true,shininess:2,transparent:true,opacity:0.92}));
      m.position.set(rand(-7,7),rand(-1,1.5),rand(-4,4)); m.scale.y=0.6; g.add(m);
    }
    g.position.set(rand(-320,320),rand(85,130),rand(-320,320));
    g.userData.v=rand(1.2,2.6);
    scene.add(g); clouds.push(g);
  }
}

function updateWorld(dt){
  if(waterMat)waterMat.uniforms.uTime.value=game.time;
  for(const c of clouds){ c.position.x+=c.userData.v*dt; if(c.position.x>380)c.position.x=-380; }
}

// ---------- physics helpers (unchanged behavior) ----------
function collideEntity(ent,r){
  const p=ent.pos;
  for(const c of worldCircles){
    const dx=p.x-c.x,dz=p.z-c.z,rr=c.r+r,d2=dx*dx+dz*dz;
    if(d2<rr*rr&&d2>1e-6&&p.y<c.y1&&p.y+1.7>c.y0){ const d=Math.sqrt(d2),push=rr-d; p.x+=dx/d*push; p.z+=dz/d*push; }
  }
  for(const b of worldBoxes)pushBox(p,b,r);
  for(const pc of pieces){ if(!pc.dead&&pc.type==='wall')pushBox(p,pc.aabb,r); }
}
function pushBox(p,b,r){
  if(p.y+1.7<=b.minY||p.y>=b.maxY-0.05)return;
  const ox1=(p.x+r)-b.minX, ox2=b.maxX-(p.x-r); if(ox1<=0||ox2<=0)return;
  const oz1=(p.z+r)-b.minZ, oz2=b.maxZ-(p.z-r); if(oz1<=0||oz2<=0)return;
  if(Math.min(ox1,ox2)<Math.min(oz1,oz2)) p.x+=(ox1<ox2?-ox1:ox2);
  else p.z+=(oz1<oz2?-oz1:oz2);
}
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
function bulletsBlockRay(o,d,maxT){
  let bt=maxT,bp=null;
  for(const p of pieces){ if(p.dead||p.type!=='wall')continue;
    const t=rayAABB(o,d,p.aabb,bt); if(t>=0&&t<bt){bt=t;bp=p;} }
  for(const b of worldBoxes){ const t=rayAABB(o,d,b,bt); if(t>=0&&t<bt){bt=t;bp=null;} }
  return bt<maxT?{t:bt,piece:bp}:null;
}

// ---------- minimap base ----------
function buildMapBase(){
  const S=220; mapBase=document.createElement('canvas'); mapBase.width=S; mapBase.height=S;
  const c=mapBase.getContext('2d');
  for(let py=0;py<S;py+=2)for(let px=0;px<S;px+=2){
    const wx=px/S*480-240, wz=py/S*480-240, h=terrainHeight(wx,wz);
    let col;
    if(h<CFG.WATER_Y+0.15)col=h<-4?'#1d4f66':'#2f7f9d';
    else if(h<1.3)col='#d9c489';
    else{ const g2=clamp(130+h*5+hash2(wx,wz)*30,90,200);
      col=`rgb(${Math.floor(g2*0.42)},${Math.floor(g2)},${Math.floor(g2*0.38)})`; }
    c.fillStyle=col; c.fillRect(px,py,2,2);
  }
  c.fillStyle='#1e4d22'; for(const t of mapTrees)c.fillRect(t[0]/480*S+110-1.5,t[1]/480*S+110-1.5,3,3);
  c.fillStyle='#787f88'; for(const r of mapRocks)c.fillRect(r[0]/480*S+110-1.5,r[1]/480*S+110-1.5,3,3);
  c.fillStyle='#e8e4d8'; for(const h of mapHouses)c.fillRect(h[0]/480*S+110-4,h[1]/480*S+110-4,8,8);
}
