// ============ Walls / Ramps / Floors with blue holographic ghost ============
let buildMode=null, lastBuildType='wall', placeCd=0;
const pieces=[];
let ghost=null, ghostMat=null, ghostInner=null;

function initBuilding(){
  ghostMat=new THREE.MeshBasicMaterial({color:0x35c8ff,transparent:true,opacity:0.42,depthWrite:false});
  ghost=new THREE.Group();
  ghostInner=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),ghostMat);
  const eg=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),
    new THREE.LineBasicMaterial({color:0x8fe0ff}));
  ghostInner.add(eg); ghost.add(ghostInner); ghost.visible=false;
  scene.add(ghost);
}
function setGhostType(type){
  ghost.scale.set(1,1,1); ghost.rotation.set(0,0,0); ghostInner.rotation.set(0,0,0);
  if(type==='wall'){ ghostInner.scale.set(0.3,4,4); }
  if(type==='floor'){ ghostInner.scale.set(4,0.26,4); }
  if(type==='ramp'){ ghostInner.scale.set(4,0.26,5.66); ghostInner.rotation.x=-Math.PI/4; }
}

// Snap a placement to the 4m grid. dir comes from yaw; baseY from the placer's feet.
function computeBuild(type,pos,yaw,baseY){
  const fx=Math.sin(yaw), fz=Math.cos(yaw);
  let dx=0,dz=1;
  if(Math.abs(fx)>Math.abs(fz)){dx=Math.sign(fx)||1;dz=0;} else {dx=0;dz=Math.sign(fz)||1;}
  const cx=Math.round(pos.x/CFG.GRID)*CFG.GRID, cz=Math.round(pos.z/CFG.GRID)*CFG.GRID;
  if(type==='wall'){ return {type,x:cx+dx*CFG.GRID/2,z:cz+dz*CFG.GRID/2,baseY,dx,dz}; }
  return {type,x:cx,z:cz,baseY,dx,dz};
}

const woodMat=new THREE.MeshLambertMaterial({color:0xc9985f});
const edgeMat=new THREE.LineBasicMaterial({color:0x7a5230});
function buildMesh(tr){
  const g=new THREE.Group();
  const mk=(geo,px,py,pz)=>{ const m=new THREE.Mesh(geo,woodMat); m.position.set(px,py,pz);
    m.castShadow=true; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),edgeMat)); g.add(m); return m; };
  if(tr.type==='wall'){
    const alongX=tr.dz!==0; // wall spanning X when facing Z
    mk(new THREE.BoxGeometry(alongX?4:0.3,4,alongX?0.3:4),0,2,0);
    g.position.set(tr.x,tr.baseY,tr.z);
    if(!alongX&&tr.dx!==0){} // dims already handle orientation
  }
  if(tr.type==='floor'){
    mk(new THREE.BoxGeometry(4,0.26,4),0,0.13,0);
    g.position.set(tr.x,tr.baseY,tr.z);
  }
  if(tr.type==='ramp'){
    mk(new THREE.BoxGeometry(4,0.26,5.66),0,0,0);
    g.children[0].rotation.x=-Math.PI/4;
    g.position.set(tr.x,tr.baseY+2,tr.z);
    g.rotation.y=Math.atan2(tr.dx,tr.dz);
  }
  return g;
}

function createPiece(tr,owner){
  const aabb=null; let p;
  const group=buildMesh(tr); scene.add(group);
  p={type:tr.type,x:tr.x,y:tr.baseY,z:tr.z,dx:tr.dx,dz:tr.dz,hp:CFG.BUILD_HP,dead:false,group,owner,aabb};
  if(tr.type==='wall'){
    const alongX=tr.dz!==0;
    p.aabb={minX:tr.x-(alongX?2:0.15),maxX:tr.x+(alongX?2:0.15),
            minY:tr.baseY,maxY:tr.baseY+4,
            minZ:tr.z-(alongX?0.15:2),maxZ:tr.z+(alongX?0.15:2)};
  }
  pieces.push(p);
  return p;
}

function damagePiece(p,dmg){
  if(p.dead)return;
  p.hp-=dmg;
  if(p.hp<=0){
    p.dead=true; scene.remove(p.group);
    spawnImpact(V3(p.x,p.y+2,p.z),'#c49a62'); SFX.thud();
    const i=pieces.indexOf(p); if(i>=0)pieces.splice(i,1);
  }
}

function updateBuilding(dt){
  placeCd-=dt;
  if(!buildMode||game.state!=='PLAY'||!player.alive){ ghost.visible=false; return; }
  const tr=computeBuild(buildMode,player.pos,player.yaw,player.pos.y);
  setGhostType(buildMode);
  ghost.position.set(tr.x,tr.type==='wall'?tr.baseY+2:(tr.type==='ramp'?tr.baseY+2:tr.baseY),tr.z);
  if(buildMode==='wall'){ ghost.rotation.y=tr.dz!==0?Math.PI/2:0; }
  if(buildMode==='ramp'){ ghost.rotation.y=Math.atan2(tr.dx,tr.dz); }
  ghostMat.color.set(player.mats>=CFG.BUILD_COST&&pieces.length<CFG.MAX_PIECES?0x35c8ff:0xff5b4d);
  ghost.visible=true;
}

function tryPlaceFromPlayer(){
  if(!buildMode||placeCd>0||game.state!=='PLAY')return;
  if(player.mats<CFG.BUILD_COST||pieces.length>=CFG.MAX_PIECES){SFX.empty();return;}
  const tr=computeBuild(buildMode,player.pos,player.yaw,player.pos.y);
  createPiece(tr,player); player.mats-=CFG.BUILD_COST; placeCd=0.16; SFX.build();
}

function botBuildWall(bot,threat){
  if(pieces.length>=CFG.MAX_PIECES)return;
  const yaw=Math.atan2(threat.x-bot.pos.x,threat.z-bot.pos.z);
  const tr=computeBuild('wall',bot.pos,yaw,bot.pos.y);
  if(pieces.some(p=>!p.dead&&p.type==='wall'&&Math.abs(p.x-tr.x)<0.5&&Math.abs(p.z-tr.z)<0.5&&Math.abs(p.y-tr.y)<2))return;
  createPiece(tr,bot); SFX.build();
}

// What can the entity stand on at (x,z)? terrain + house slabs + floors + ramps.
function supportHeight(x,z,feetY){
  let h=terrainHeight(x,z);
  for(const s of standables)
    if(x>s.minX-0.3&&x<s.maxX+0.3&&z>s.minZ-0.3&&z<s.maxZ+0.3&&s.y<=feetY+1.05&&s.y>h)h=s.y;
  for(const p of pieces){
    if(p.dead)continue;
    if(p.type==='floor'){
      if(Math.abs(x-p.x)<=2.05&&Math.abs(z-p.z)<=2.05){ const top=p.y+0.26; if(top<=feetY+1.0&&top>h)h=top; }
    } else if(p.type==='ramp'){
      const dx=x-p.x,dz=z-p.z;
      const t=dx*p.dx+dz*p.dz, s2=dx*p.dz-dz*p.dx; // along / across
      if(Math.abs(t)<=2.05&&Math.abs(s2)<=2.05){ const top=p.y+2+t; if(top<=feetY+1.2&&top>h)h=top; }
    }
  }
  return h;
}

function resetBuilding(){
  for(const p of pieces)scene.remove(p.group);
  pieces.length=0; buildMode=null; ghost.visible=false;
}
