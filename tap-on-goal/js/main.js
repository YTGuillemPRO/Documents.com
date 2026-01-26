const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6e9ff);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Luces suaves
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(5, 10, 5);
scene.add(sun);

// Bola
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.4, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x9b59b6 })
);
scene.add(ball);

// UI
const info = document.getElementById("info");

// Juego
const game = new Game(scene, ball, camera, info);
game.startLevel(0);

window.addEventListener("mousedown", () => game.tap());
window.addEventListener("touchstart", () => game.tap());

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  game.update(clock.getDelta());
  game.updateCamera();
  renderer.render(scene, camera);
}
animate();
