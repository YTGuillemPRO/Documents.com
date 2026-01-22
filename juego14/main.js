// ================= ESCENA =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// ================= LUCES =================
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

// ================= SUELO =================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x2e8b57 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ================= JUGADOR =================
const player = new THREE.Group();

// cuerpo
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.4, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x4a6cff })
);
player.add(body);

// cabeza
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xffccaa })
);
head.position.y = 1;
player.add(head);

scene.add(player);
player.position.y = 1;

// ================= CÁMARA SEGUIDORA =================
let camYaw = 0;
let camPitch = 0;

document.addEventListener("mousemove", e => {
  camYaw -= e.movementX * 0.002;
  camPitch -= e.movementY * 0.002;
  camPitch = Math.max(-1, Math.min(1, camPitch));
});

// ================= CONTROLES =================
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ================= MODO CONSTRUCCIÓN =================
let buildMode = false;
document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "b") buildMode = !buildMode;
});

// ================= PIEZAS =================
const pieces = ["floor", "wall", "ramp", "roof", "pillar"];
let currentPiece = 0;
let rotation = 0;

document.addEventListener("keydown", e => {
  if (e.key >= "1" && e.key <= "5") {
    currentPiece = Number(e.key) - 1;
    document.querySelectorAll(".slot").forEach((s, i) =>
      s.classList.toggle("active", i === currentPiece)
    );
  }
  if (e.key.toLowerCase() === "r") rotation += Math.PI / 2;
});

// ================= CONSTRUIR =================
document.addEventListener("mousedown", () => {
  if (!buildMode) return;

  let geo;
  if (pieces[currentPiece] === "floor") geo = new THREE.BoxGeometry(2, 0.2, 2);
  if (pieces[currentPiece] === "wall") geo = new THREE.BoxGeometry(2, 2, 0.2);
  if (pieces[currentPiece] === "ramp") geo = new THREE.BoxGeometry(2, 0.2, 2);
  if (pieces[currentPiece] === "roof") geo = new THREE.BoxGeometry(2, 0.2, 2);
  if (pieces[currentPiece] === "pillar") geo = new THREE.BoxGeometry(0.5, 2, 0.5);

  const build = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x9b7653 })
  );

  const forward = new THREE.Vector3(0, 0, -1).applyEuler(player.rotation);
  build.position.copy(player.position).add(forward.multiplyScalar(3));
  build.position.y = pieces[currentPiece] === "floor" ? 0.1 : 1;
  build.rotation.y = rotation;

  if (pieces[currentPiece] === "ramp") build.rotation.x = -Math.PI / 6;

  scene.add(build);
});

// ================= MOVIMIENTO =================
function movePlayer() {
  const speed = 0.12;
  const dir = new THREE.Vector3();

  if (keys["w"]) dir.z -= 1;
  if (keys["s"]) dir.z += 1;
  if (keys["a"]) dir.x -= 1;
  if (keys["d"]) dir.x += 1;

  dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), camYaw);
  player.position.add(dir.multiplyScalar(speed));
  player.rotation.y = camYaw;
}

// ================= LOOP =================
function animate() {
  requestAnimationFrame(animate);

  movePlayer();

  // cámara detrás del jugador
  const camOffset = new THREE.Vector3(
    Math.sin(camYaw) * 4,
    2,
    Math.cos(camYaw) * 4
  );

  camera.position.copy(player.position).add(camOffset);
  camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 1, 0)));

  renderer.render(scene, camera);
}
animate();

// ================= RESIZE =================
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
