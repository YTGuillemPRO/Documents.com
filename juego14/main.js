// ======================
// ESCENA Y RENDER
// ======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// ======================
// HUD (VIDA + BITCOIN)
// ======================
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "10px";
hud.style.left = "10px";
hud.style.color = "white";
hud.style.font = "18px Arial";
hud.innerHTML = `
❤️ Vida: <span id="hp">100</span><br>
₿ Bitcoin: <span id="btc">0</span><br>
🧱 Construcción: <span id="build">OFF</span>
`;
document.body.appendChild(hud);

// ======================
// MIRA (CROSSHAIR)
// ======================
const cross = document.createElement("div");
cross.style.position = "absolute";
cross.style.left = "50%";
cross.style.top = "50%";
cross.style.width = "20px";
cross.style.height = "20px";
cross.style.border = "2px solid white";
cross.style.transform = "translate(-50%,-50%)";
document.body.appendChild(cross);

// ======================
// LUCES
// ======================
scene.add(new THREE.AmbientLight(0xffffff,0.6));
const sun = new THREE.DirectionalLight(0xffffff,1);
sun.position.set(30,50,30);
scene.add(sun);

// ======================
// SUELO
// ======================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400,400),
  new THREE.MeshStandardMaterial({color:0x2e7d32})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// ======================
// JUGADOR HUMANOIDE
// ======================
const player = new THREE.Group();
player.hp = 100;
player.btc = 0;
player.velY = 0;
player.onGround = true;

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5,1.2,4,8),
  new THREE.MeshStandardMaterial({color:0x4caf50})
);
body.position.y = 1.4;

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.35,16,16),
  new THREE.MeshStandardMaterial({color:0xffccaa})
);
head.position.y = 2.6;

player.add(body, head);
scene.add(player);

// ======================
// INPUT
// ======================
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ======================
// MOUSE LOOK (FORTNITE STYLE)
// ======================
let yaw = 0, pitch = 0;

document.body.addEventListener("click", () => {
  document.body.requestPointerLock();
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement) {
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
  }
});

// ======================
// DISPAROS
// ======================
const bullets = [];
window.addEventListener("mousedown", () => {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.15,8,8),
    new THREE.MeshStandardMaterial({color:0xffff00})
  );
  bullet.position.copy(player.position);
  bullet.dir = new THREE.Vector3(
    Math.sin(yaw),
    0,
    Math.cos(yaw)
  ).multiplyScalar(-1);
  scene.add(bullet);
  bullets.push(bullet);
});

// ======================
// NPCs
// ======================
const npcs = [];
for(let i=0;i<5;i++){
  const npc = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5,1.2,4,8),
    new THREE.MeshStandardMaterial({color:0xe53935})
  );
  npc.position.set(Math.random()*80-40,1.4,Math.random()*80-40);
  npc.hp = 50;
  scene.add(npc);
  npcs.push(npc);
}

// ======================
// CONSTRUCCIÓN (PISOS)
// ======================
let buildMode = false;
const builds = [];

window.addEventListener("keydown", e => {
  if(e.key.toLowerCase() === "q") {
    buildMode = !buildMode;
    document.getElementById("build").textContent = buildMode ? "ON" : "OFF";
  }

  if(e.key === " " && player.onGround){
    player.velY = 0.35;
    player.onGround = false;
  }
});

function buildFloor(){
  if(!buildMode) return;
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(4,0.3,4),
    new THREE.MeshStandardMaterial({color:0x9e9e9e})
  );
  floor.position.set(
    Math.round(player.position.x/4)*4,
    0.15,
    Math.round(player.position.z/4)*4
  );
  scene.add(floor);
  builds.push(floor);
}

window.addEventListener("keyup", e=>{
  if(e.key.toLowerCase()==="q") buildFloor();
});

// ======================
// LOOP
// ======================
function animate(){
  requestAnimationFrame(animate);

  // MOVIMIENTO
  const speed = 0.15;
  if(keys["w"]) player.position.z -= Math.cos(yaw)*speed, player.position.x -= Math.sin(yaw)*speed;
  if(keys["s"]) player.position.z += Math.cos(yaw)*speed, player.position.x += Math.sin(yaw)*speed;
  if(keys["a"]) player.position.x -= Math.cos(yaw)*speed, player.position.z += Math.sin(yaw)*speed;
  if(keys["d"]) player.position.x += Math.cos(yaw)*speed, player.position.z -= Math.sin(yaw)*speed;

  // GRAVEDAD
  player.velY -= 0.02;
  player.position.y += player.velY;
  if(player.position.y <= 0){
    player.position.y = 0;
    player.velY = 0;
    player.onGround = true;
  }

  // DISPAROS
  bullets.forEach((b,i)=>{
    b.position.add(b.dir.clone().multiplyScalar(0.7));
    npcs.forEach((npc,ni)=>{
      if(b.position.distanceTo(npc.position)<0.8){
        npc.hp -= 25;
        scene.remove(b);
        bullets.splice(i,1);
        if(npc.hp<=0){
          scene.remove(npc);
          npcs.splice(ni,1);
          player.btc += 10;
        }
      }
    });
  });

  // HUD
  document.getElementById("hp").textContent = Math.floor(player.hp);
  document.getElementById("btc").textContent = player.btc;

  // CÁMARA
  camera.position.set(
    player.position.x - Math.sin(yaw)*8,
    player.position.y + 5,
    player.position.z - Math.cos(yaw)*8
  );
  camera.lookAt(player.position.x, player.position.y+2, player.position.z);

  renderer.render(scene,camera);
}

animate();
