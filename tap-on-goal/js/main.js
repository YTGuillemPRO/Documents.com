const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3e1f9);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(5, 10, 5);
scene.add(light);

// Bola
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.4, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
ball.position.y = 0.5;
scene.add(ball);

// Game
const info = document.getElementById("info");
const game = new Game(scene, ball, camera, info);

// START SCREEN (AQUÍ ESTABA EL ERROR)
const startScreen = document.getElementById("startScreen");
startScreen.addEventListener("click", () => {
  startScreen.style.display = "none";
  game.startRun();
});

// Input de juego
window.addEventListener("mousedown", e => game.tap(e));
window.addEventListener("touchstart", e => game.tap(e));

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  game.update(dt);
  game.updateCamera();
  renderer.render(scene, camera);
}

animate();
