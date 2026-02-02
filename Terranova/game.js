// === ESCENA ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// === LUZ ===
scene.add(new THREE.AmbientLight(0xffffff, 0.9));

// === SUELO ===
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x228822 })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// === JUGADOR ===
const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.3, 1),
  new THREE.MeshStandardMaterial({ color: 0x3399ff })
);
player.position.y = 1;
scene.add(player);

camera.position.set(0, 4, 6);

// === RAYCAST ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// === ESTADO ===
let wood = 50;
let food = 0;
let selected = "farm";
let building = false;

// === PREVIEW ===
const previewMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.5
});

let preview = new THREE.Mesh(
  new THREE.BoxGeometry(1, 0.3, 1),
  previewMat
);
preview.visible = false;
scene.add(preview);

// === INPUT ===
window.addEventListener("mousemove", e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
});

window.addEventListener("keydown", e => {
  if (e.key === "1") selected = "farm";
  if (e.key === "2") selected = "wall";
});

window.addEventListener("click", () => {
  if (building) return;
  startBuild();
});

// === CONSTRUCCIÓN CON TIEMPO ===
function startBuild() {
  if (wood < 10) return;
  building = true;

  setTimeout(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: selected === "farm" ? 0x55ff55 : 0x777777
    });

    const mesh = new THREE.Mesh(
      selected === "farm"
        ? new THREE.BoxGeometry(1, 0.3, 1)
        : new THREE.BoxGeometry(1, 0.8, 0.2),
      mat
    );

    mesh.position.copy(preview.position);
    mesh.position.y += selected === "farm" ? 0.15 : 0.4;
    scene.add(mesh);

    wood -= 10;
    if (selected === "farm") food += 5;

    building = false;
  }, 1500); // ⏳ tiempo de construcción
}

// === LOOP ===
function animate() {
  requestAnimationFrame(animate);

  // cámara sigue al jugador
  camera.position.x = player.position.x;
  camera.lookAt(player.position);

  // raycast al suelo
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(ground);

  if (hits.length) {
    preview.visible = true;
    preview.position.copy(hits[0].point);
    preview.position.y = 0.01;
  }

  document.getElementById("stats").innerText =
`🌲 Madera: ${wood}
🍖 Comida: ${food}
🏗️ Construyendo: ${building ? "sí" : "no"}
🔧 Seleccionado: ${selected}`;

  renderer.render(scene, camera);
}

animate();
