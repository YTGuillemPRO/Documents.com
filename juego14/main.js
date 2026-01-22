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
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LUZ
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// SUELO
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// PERSONAJE HUMANOIDE (simple)
const player = new THREE.Group();

// Cuerpo
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5, 1.2, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0x4444ff })
);
player.add(body);

// Cabeza
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xffccaa })
);
head.position.y = 1.1;
player.add(head);

scene.add(player);
player.position.y = 1;

// Cámara en tercera persona
camera.position.set(0, 2, 4);

// MOVIMIENTO
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// INVENTARIO
let selectedSlot = 1;
document.addEventListener("keydown", e => {
  if (e.key >= "1" && e.key <= "3") {
    selectedSlot = Number(e.key);
    document.querySelectorAll(".slot").forEach((s, i) => {
      s.classList.toggle("active", i + 1 === selectedSlot);
    });
  }
});

// CONSTRUCCIÓN
document.addEventListener("mousedown", () => {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      color: selectedSlot === 1 ? 0xaaaaaa :
             selectedSlot === 2 ? 0x8b4513 :
                                  0x9999ff
    })
  );

  block.position.copy(player.position);
  block.position.y = 0.5;
  block.position.z -= 2;
  scene.add(block);
});

// LOOP
function animate() {
  requestAnimationFrame(animate);

  if (keys["w"]) player.position.z -= 0.1;
  if (keys["s"]) player.position.z += 0.1;
  if (keys["a"]) player.position.x -= 0.1;
  if (keys["d"]) player.position.x += 0.1;

  camera.lookAt(player.position);
  renderer.render(scene, camera);
}

animate();

// RESPONSIVE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
