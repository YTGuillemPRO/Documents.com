// ============ Shrinking storm zone with translucent purple wall ============
const storm={cx:0,cz:0,r:300,phase:0,mode:'wait',t:0,tcx:0,tcz:0,tr:0,scx:0,scz:0,sr:0,tick:1};
let stormMesh;

function initStorm(){
  stormMesh=new THREE.Mesh(
    new THREE.CylinderGeometry(1,1,500,72,1,true),
    new THREE.MeshBasicMaterial({color:0xa32ee6,transparent:true,opacity:0.22,side:THREE.DoubleSide,depthWrite:false,fog:false})
  );
  stormMesh.position.y=150; scene.add(stormMesh);
}

function resetStorm(){
  Object.assign(storm,{cx:0,cz:0,r:300,phase:0,mode:'wait',t:STORM_PHASES[0].wait,tick:1});
  computeTarget();
}
function computeTarget(){
  const P=STORM_PHASES[storm.phase];
  const maxOff=Math.max(0,storm.r-P.r)*0.7, a=rand(0,6.28), m=rand(0,maxOff);
  storm.tcx=clamp(storm.cx+Math.cos(a)*m,-150,150);
  storm.tcz=clamp(storm.cz+Math.sin(a)*m,-150,150);
  storm.tr=P.r; storm.scx=storm.cx; storm.scz=storm.cz; storm.sr=storm.r;
}

function inStorm(x,z){ return dist2(x,z,storm.cx,storm.cz)>storm.r*storm.r; }

function updateStorm(dt){
  storm.t-=dt;
  if(storm.mode==='wait'){
    if(storm.t<=0){
      storm.mode='shrink'; storm.t=STORM_PHASES[storm.phase].shrink;
      hud.announce('THE STORM IS SHRINKING','Get to the safe zone!',2400); SFX.storm();
    }
  } else if(storm.mode==='shrink'){
    const P=STORM_PHASES[storm.phase], k=1-storm.t/P.shrink;
    storm.r=lerp(storm.sr,storm.tr,k);
    storm.cx=lerp(storm.scx,storm.tcx,k);
    storm.cz=lerp(storm.scz,storm.tcz,k);
    if(storm.t<=0){
      storm.phase++;
      if(storm.phase<STORM_PHASES.length){
        storm.mode='wait'; storm.t=STORM_PHASES[storm.phase].wait; computeTarget();
        hud.announce('SAFE ZONE REVEALED','Check the map — white circle',2000);
      } else storm.mode='done';
    }
  }
  stormMesh.position.set(storm.cx,150,storm.cz);
  stormMesh.scale.set(Math.max(storm.r,0.5),1,Math.max(storm.r,0.5));
  stormMesh.material.opacity=0.2+Math.sin(game.time*1.5)*0.04;

  storm.tick-=dt;
  if(storm.tick<=0){
    storm.tick=1;
    const dps=STORM_PHASES[Math.min(storm.phase,STORM_PHASES.length-1)].dps;
    const ents=[player,...bots];
    for(const e of ents){
      if(!e.alive||e.dropping)continue;
      if(inStorm(e.pos.x,e.pos.z))applyDamage(e,dps,null,{storm:true});
    }
  }
}
