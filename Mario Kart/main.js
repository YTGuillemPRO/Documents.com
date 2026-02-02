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

// LUCES
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(10, 20, 10);
scene.add(sun);

// PISTA
const track = new THREE.Mesh(
  new THREE.RingGeometry(20, 30, 64),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
track.rotation.x = -Math.PI / 2;
scene.add(track);

// KART
const kart = new THREE.Group();

// Cuerpo
const body = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.8, 3),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
body.position.y = 0.6;
kart.add(body);

// Ruedas
const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

[-0.9, 0.9].forEach(x => {
  [-1.2, 1.2].forEach(z => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.4, z);
    kart.add(wheel);
  });
});

scene.add(kart);

// CONTROLES
let speed = 0;
let angle = 0;
let drifting = false;
const keys = {};

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === "Space") drifting = true;
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
  if (e.code === "Space") drifting = false;
});

// CÁMARA SEGUIDORA
function updateCamera() {
  const offset = new THREE.Vector3(
    Math.sin(angle) * -8,
    5,
    Math.cos(angle) * -8
  );
  camera.position.copy(kart.position).add(offset);
  camera.lookAt(kart.position);
}

// FÍSICA SIMPLE
function updateKart() {
  if (keys["w"]) speed += 0.02;
  if (keys["s"]) speed -= 0.02;

  speed *= 0.98;
  speed = THREE.MathUtils.clamp(speed, -0.5, 1);

  let turnSpeed = drifting ? 0.04 : 0.025;
  if (keys["a"]) angle += turnSpeed;
  if (keys["d"]) angle -= turnSpeed;

  kart.rotation.y = angle;
  kart.position.x += Math.sin(angle) * speed;
  kart.position.z += Math.cos(angle) * speed;
}

// LOOP
function animate() {
  requestAnimationFrame(animate);
  updateKart();
  updateCamera();
  renderer.render(scene, camera);
}

animate();

// RESPONSIVE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
