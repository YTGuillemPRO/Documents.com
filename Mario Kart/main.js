// ESCENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6ec6ff);

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
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 10);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// SUELO / PISTA
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshToonMaterial({ color: 0x555555 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// KART
const kart = new THREE.Mesh(
  new THREE.BoxGeometry(1, 0.5, 2),
  new THREE.MeshToonMaterial({ color: 0xff0000 })
);
kart.position.y = 0.25;
scene.add(kart);

// CONTROLES
const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// FÍSICA ARCADE
let speed = 0;
const maxSpeed = 0.8;
const accel = 0.02;
const friction = 0.98;
const turnSpeed = 0.04;

// LOOP
function animate() {
  requestAnimationFrame(animate);

  // ACELERAR / FRENAR
  if (keys["w"]) speed = Math.min(speed + accel, maxSpeed);
  if (keys["s"]) speed = Math.max(speed - accel, -maxSpeed / 2);
  speed *= friction;

  // GIRAR
  if (keys["a"]) kart.rotation.y += turnSpeed * speed;
  if (keys["d"]) kart.rotation.y -= turnSpeed * speed;

  // MOVER
  kart.position.x -= Math.sin(kart.rotation.y) * speed;
  kart.position.z -= Math.cos(kart.rotation.y) * speed;

  // CÁMARA SEGUIMIENTO
  const camOffset = new THREE.Vector3(
    Math.sin(kart.rotation.y) * 5,
    4,
    Math.cos(kart.rotation.y) * 5
  );
  camera.position.copy(kart.position).add(camOffset);
  camera.lookAt(kart.position);

  // HUD
  document.getElementById("speed").innerText =
    "Speed: " + Math.abs(speed).toFixed(2);

  renderer.render(scene, camera);
}

animate();

// RESPONSIVE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
