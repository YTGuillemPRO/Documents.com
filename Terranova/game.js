// === ESCENA ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(5, 6, 8);
camera.lookAt(0, 0, 0);

// === LUZ ===
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// === SUELO ===
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x228822 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// === ESTADO DEL JUEGO ===
let food = 0;
let wood = 50;
let territory = 1;
let farms = 0;
let walls = 0;

// === BASE ===
const base = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x8888ff })
);
base.position.y = 0.5;
scene.add(base);

// === CONSTRUCCIÓN ===
function buildFarm() {
  if (wood < 10) return;
  wood -= 10;
  farms++;

  const farm = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.3, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x55ff55 })
  );
  farm.position.set(Math.random()*4-2, 0.15, Math.random()*4-2);
  scene.add(farm);
}

function buildWall() {
  if (wood < 15) return;
  wood -= 15;
  walls++;

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.5, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x777777 })
  );
  wall.position.set(Math.random()*6-3, 0.25, Math.random()*6-3);
  scene.add(wall);
}

function expand() {
  if (walls >= territory) {
    territory++;
    ground.scale.set(territory, 1, territory);
  }
}

// === LOOP ===
function update() {
  food += farms * 0.01;
  document.getElementById("stats").innerText =
    `🍖 Comida: ${food.toFixed(1)}
🌲 Madera: ${wood}
🌍 Territorio: ${territory}`;
}

function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

animate();
