// ========================
// ESCENA Y RENDER
// ========================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ========================
// LUCES
// ========================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(20, 40, 20);
scene.add(sun);

// ========================
// SUELO
// ========================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ========================
// JUGADOR HUMANOIDE
// ========================
const player = new THREE.Group();

// cuerpo
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5, 1.2, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0x4caf50 })
);
body.position.y = 1.5;

// cabeza
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xffccaa })
);
head.position.y = 2.6;

player.add(body);
player.add(head);
scene.add(player);

player.position.set(0, 0, 0);

// ========================
// INPUT (FUNCIONA EN WEB)
// ========================
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ========================
// NPCs
// ========================
const npcs = [];
for (let i = 0; i < 5; i++) {
  const npc = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1.2, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xe53935 })
  );
  npc.position.set(
    Math.random() * 100 - 50,
    1.5,
    Math.random() * 100 - 50
  );
  scene.add(npc);
  npcs.push(npc);
}

// ========================
// LOOT
// ========================
const loot = [];
for (let i = 0; i < 8; i++) {
  const item = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xffeb3b })
  );
  item.position.set(
    Math.random() * 120 - 60,
    0.3,
    Math.random() * 120 - 60
  );
  scene.add(item);
  loot.push(item);
}

// ========================
// ESTRUCTURAS
// ========================
for (let i = 0; i < 6; i++) {
  const house = new THREE.Mesh(
    new THREE.BoxGeometry(6, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
  );
  house.position.set(
    Math.random() * 150 - 75,
    2,
    Math.random() * 150 - 75
  );
  scene.add(house);
}

// ========================
// CÁMARA TERCERA PERSONA
// ========================
const camOffset = new THREE.Vector3(0, 6, 10);

// ========================
// LOOP PRINCIPAL
// ========================
function animate() {
  requestAnimationFrame(animate);

  // MOVIMIENTO JUGADOR
  const speed = 0.2;
  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;

  // NPCs persiguen
  npcs.forEach(npc => {
    const dir = new THREE.Vector3()
      .subVectors(player.position, npc.position)
      .normalize();
    npc.position.add(dir.multiplyScalar(0.05));
  });

  // RECOGER LOOT
  loot.forEach((item, i) => {
    if (item.position.distanceTo(player.position) < 1.2) {
      scene.remove(item);
      loot.splice(i, 1);
      console.log("Loot recogido");
    }
  });

  // CÁMARA SIGUE
  camera.position.copy(player.position).add(camOffset);
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

animate();

// ========================
// RESIZE
// ========================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

