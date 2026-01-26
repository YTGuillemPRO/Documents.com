const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Cielo azul

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Luz
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(10, 20, 10);
sun.castShadow = true;
scene.add(sun);

// Suelo de césped decorativo
const groundGeo = new THREE.PlaneGeometry(100, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
scene.add(ground);

// Bola con textura simple
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.4, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
);
ball.castShadow = true;
scene.add(ball);

const info = document.getElementById("info");
const startScreen = document.getElementById("startScreen");

const game = new Game(scene, ball, camera, info);
game.startLevel(0);

const startAction = () => {
    startScreen.style.display = "none";
    game.tap();
};

window.addEventListener("mousedown", startAction);
window.addEventListener("touchstart", startAction);

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
