// ================= ESCENA =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// ================= LUZ =================
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(10, 20, 10);
scene.add(sun);

// ================= SUELO =================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x3a7d44 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ================= JUGADOR =================
const player = new THREE.Object3D();
scene.add(player);

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.4, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x3366ff })
);
body.position.y = 1;
player.add(body);

camera.position.set(0, 1.6, 0);
player.add(camera);
player.position.set(0, 0, 5);

// ================= CONTROLES =================
const keys = {};
let yaw = 0, pitch = 0;

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

window.addEventListener("mousemove", e => {
  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-1.2, Math.min(1.2, pitch));
  player.rotation.y = yaw;
  camera.rotation.x = pitch;
});

// ================= RAYCAST =================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0,0);

// ================= JUEGO =================
let wood = 50;
let food = 0;
let farms = 0;
let timeRunning = false;
let building = false;
let selected = "farm";

// ================= PREVIEW =================
const previewMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.4
});

let preview = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12),
  previewMaterial
);
preview.visible = false;
scene.add(preview);

// ================= INPUT =================
window.addEventListener("keydown", e => {
  if (e.key === "1") setPreview("farm");
  if (e.key === "2") setPreview("wall");
  if (e.key.toLowerCase() === "g") timeRunning = !timeRunning;
});

window.addEventListener("click", () => {
  if (!timeRunning || building || wood < 10 || !preview.visible) return;
  startBuild();
});

function setPreview(type) {
  selected = type;
  scene.remove(preview);

  preview = type === "farm"
    ? new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12),
        previewMaterial
      )
    : new THREE.Mesh(
        new THREE.PlaneGeometry(2, 1.5),
        previewMaterial
      );

  if (type === "wall") preview.rotation.y = Math.PI / 2;
  preview.visible = false;
  scene.add(preview);
}

// ================= CONSTRUCCIÓN =================
function startBuild() {
  building = true;
  const buildPos = preview.position.clone();

  setTimeout(() => {
    if (!timeRunning) { building = false; return; }

    let mesh;
    if (selected === "farm") {
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0x55aa55 })
      );
      farms++;
    } else {
      mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x888888, side:THREE.DoubleSide })
      );
      mesh.rotation.y = preview.rotation.y;
    }

    mesh.position.copy(buildPos);
    mesh.position.y += selected === "farm" ? 0.15 : 0.75;
    scene.add(mesh);

    wood -= 10;
    building = false;
  }, 1500);
}

// ================= LOOP =================
function animate() {
  requestAnimationFrame(animate);

  // Movimiento
  const speed = 0.1;
  const dir = new THREE.Vector3();
  if (keys["w"]) dir.z -= speed;
  if (keys["s"]) dir.z += speed;
  if (keys["a"]) dir.x -= speed;
  if (keys["d"]) dir.x += speed;
  dir.applyAxisAngle(new THREE.Vector3(0,1,0), player.rotation.y);
  player.position.add(dir);

  // Raycast desde cámara
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(ground);

  if (hits.length) {
    preview.visible = true;
    preview.position.copy(hits[0].point);
    preview.position.y = 0.01;
  }

  // Producción
  if (timeRunning) food += farms * 0.01;

  document.getElementById("stats").innerText =
`⏳ Tiempo: ${timeRunning ? "CORRIENDO" : "PAUSADO"}
🌲 Madera: ${wood}
🍖 Comida: ${food.toFixed(1)}
🌱 Granjas: ${farms}
🏗️ Construyendo: ${building ? "sí" : "no"}`;

  renderer.render(scene, camera);
}

animate();
