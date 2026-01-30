const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luces para que los colores brillen como en la foto
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(5, 10, 2);
scene.add(sun);

const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
);
scene.add(ball);

const game = new Game(scene, ball, camera);
game.startLevel();

function animate() {
    requestAnimationFrame(animate);
    game.update(0.016); // ~60fps

    // Posición de cámara "Follow" desde arriba
    camera.position.set(0, 6, ball.position.z + 7);
    camera.lookAt(0, 0, ball.position.z - 3);

    renderer.render(scene, camera);
}
animate();
