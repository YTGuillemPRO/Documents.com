// ESCENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// CÁMARA
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// RENDER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LUZ
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// JUGADOR (estilo Roblox)
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
player.position.set(0, 5, 0);
scene.add(player);

// SUELO / PLATAFORMAS
const platforms = [];
function createPlatform(x, y, z) {
  const p = new THREE.Mesh(
    new THREE.BoxGeometry(6, 1, 6),
    new THREE.MeshStandardMaterial({ color: 0x666666 })
  );
  p.position.set(x, y, z);
  scene.add(p);
  platforms.push(p);
}

// Torre tipo The Forge
for (let i = 0; i < 30; i++) {
  createPlatform(
    (Math.random() - 0.5) * 8,
    i * 4,
    (Math.random() - 0.5) * 8
  );
}

// LAVA
const lava = new THREE.Mesh(
  new THREE.BoxGeometry(100, 1, 100),
  new THREE.MeshStandardMaterial({ color: 0xff3300 })
);
lava.position.y = -2;
scene.add(lava);

// FÍSICA SIMPLE
let velocityY = 0;
let onGround = false;

// INPUT
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// CÁMARA TERCERA PERSONA
camera.position.set(0, 8, 12);

// LOOP
function animate() {
  requestAnimationFrame(animate);

  // Movimiento
  let speed = 0.15;
  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;

  // Gravedad
  velocityY -= 0.01;
  player.position.y += velocityY;

  onGround = false;

  // Colisión con plataformas
  platforms.forEach(p => {
    const dx = Math.abs(player.position.x - p.position.x);
    const dz = Math.abs(player.position.z - p.position.z);
    const dy = player.position.y - p.position.y;

    if (dx < 3 && dz < 3 && dy < 2 && dy > 0) {
      player.position.y = p.position.y + 1.5;
      velocityY = 0;
      onGround = true;
    }
  });

  // Salto
  if (keys[" "] && onGround) {
    velocityY = 0.25;
  }

  // Lava sube
  lava.position.y += 0.005;

  if (lava.position.y > player.position.y - 1) {
    alert("🔥 Te consumió la lava");
    location.reload();
  }

  // Cámara sigue al jugador
  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 10;
  camera.position.y = player.position.y + 6;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
