const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6e9ff);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(0, 10, 0);
scene.add(light);

// Bola de fútbol (Blanca y Negra)
const ballGeo = new THREE.SphereGeometry(0.4, 16, 16);
const ballMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg') // Simulando textura
});
const ball = new THREE.Mesh(ballGeo, ballMat);
scene.add(ball);

const info = document.getElementById("info");

const game = new Game(scene, ball, camera, info);
game.startLevel(0);

// Escuchar el clic para la posición
window.addEventListener("mousedown", (e) => game.tap(e));

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  game.update(0.016); // asumiendo 60fps
  game.updateCamera();
  renderer.render(scene, camera);
}
animate();
