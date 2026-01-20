// =========================
// ESCENA
// =========================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// =========================
// HUD
// =========================
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "10px";
hud.style.left = "10px";
hud.style.color = "white";
hud.style.fontFamily = "Arial";
hud.innerHTML = `
❤️ Vida: <span id="hp">100</span><br>
🔫 Munición: <span id="ammo">∞</span>
`;
document.body.appendChild(hud);

// =========================
// MINIMAPA
// =========================
const minimap = document.createElement("canvas");
minimap.width = 150;
minimap.height = 150;
minimap.style.position = "absolute";
minimap.style.bottom = "10px";
minimap.style.right = "10px";
minimap.style.border = "2px solid white";
document.body.appendChild(minimap);
const mapCtx = minimap.getContext("2d");

// =========================
// LUCES
// =========================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(20,40,20);
scene.add(sun);

// =========================
// SUELO
// =========================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400,400),
  new THREE.MeshStandardMaterial({ color:0x2e7d32 })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// =========================
// JUGADOR HUMANOIDE
// =========================
const player = new THREE.Group();
player.hp = 100;

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5,1.2,4,8),
  new THREE.MeshStandardMaterial({ color:0x4caf50 })
);
body.position.y = 1.4;

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.35,16,16),
  new THREE.MeshStandardMaterial({ color:0xffccaa })
);
head.position.y = 2.6;

player.add(body);
player.add(head);
scene.add(player);

// =========================
// INPUT
// =========================
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// =========================
// DISPAROS
// =========================
const bullets = [];
window.addEventListener("click", () => {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.15,8,8),
    new THREE.MeshStandardMaterial({ color:0xffff00 })
  );
  bullet.position.copy(player.position);
  bullet.direction = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  scene.add(bullet);
  bullets.push(bullet);
});

// =========================
// NPCs
// =========================
const npcs = [];
for(let i=0;i<6;i++){
  const npc = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5,1.2,4,8),
    new THREE.MeshStandardMaterial({ color:0xe53935 })
  );
  npc.position.set(Math.random()*100-50,1.4,Math.random()*100-50);
  npc.hp = 50;
  scene.add(npc);
  npcs.push(npc);
}

// =========================
// CONSTRUCCIÓN (PISOS)
// =========================
const builds = [];
window.addEventListener("keydown", e=>{
  if(e.key.toLowerCase()==="b"){
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(4,0.3,4),
      new THREE.MeshStandardMaterial({ color:0x9e9e9e })
    );
    floor.position.set(
      Math.round(player.position.x/4)*4,
      0.15,
      Math.round(player.position.z/4)*4
    );
    scene.add(floor);
    builds.push(floor);
  }
});

// =========================
// ZONA SEGURA
// =========================
let zoneRadius = 150;
const zoneCenter = new THREE.Vector3(0,0,0);

const zone = new THREE.Mesh(
  new THREE.RingGeometry(zoneRadius-1, zoneRadius, 64),
  new THREE.MeshBasicMaterial({ color:0x00e5ff, side:THREE.DoubleSide })
);
zone.rotation.x = -Math.PI/2;
scene.add(zone);

// =========================
// CÁMARA
// =========================
const camOffset = new THREE.Vector3(0,6,10);

// =========================
// LOOP
// =========================
function animate(){
  requestAnimationFrame(animate);

  // MOVIMIENTO
  const speed = 0.2;
  if(keys["w"]) player.position.z -= speed;
  if(keys["s"]) player.position.z += speed;
  if(keys["a"]) player.position.x -= speed;
  if(keys["d"]) player.position.x += speed;

  // DISPAROS
  bullets.forEach((b,i)=>{
    b.position.add(b.direction.clone().multiplyScalar(0.6));
    npcs.forEach((npc,ni)=>{
      if(b.position.distanceTo(npc.position)<0.8){
        npc.hp -= 25;
        scene.remove(b);
        bullets.splice(i,1);
        if(npc.hp<=0){
          scene.remove(npc);
          npcs.splice(ni,1);
        }
      }
    });
  });

  // NPCs
  npcs.forEach(npc=>{
    const dir = new THREE.Vector3().subVectors(player.position,npc.position).normalize();
    npc.position.add(dir.multiplyScalar(0.05));
    if(npc.position.distanceTo(player.position)<1){
      player.hp -= 0.2;
    }
  });

  // ZONA SEGURA
  zoneRadius -= 0.01;
  zone.geometry.dispose();
  zone.geometry = new THREE.RingGeometry(zoneRadius-1, zoneRadius,64);

  if(player.position.distanceTo(zoneCenter)>zoneRadius){
    player.hp -= 0.3;
  }

  document.getElementById("hp").textContent = Math.floor(player.hp);

  // MINIMAPA
  mapCtx.fillStyle="#000";
  mapCtx.fillRect(0,0,150,150);

  mapCtx.fillStyle="green";
  mapCtx.fillRect(75+player.position.x/4,75+player.position.z/4,4,4);

  mapCtx.fillStyle="red";
  npcs.forEach(n=>{
    mapCtx.fillRect(75+n.position.x/4,75+n.position.z/4,4,4);
  });

  // CÁMARA
  camera.position.copy(player.position).add(camOffset);
  camera.lookAt(player.position);

  renderer.render(scene,camera);
}

animate();

// =========================
// RESIZE
// =========================
window.addEventListener("resize",()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});
