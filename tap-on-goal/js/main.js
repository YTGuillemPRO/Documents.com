const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3e1f9);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({color: 0xffffff})
);
scene.add(ball);

const game = new Game(scene, ball, camera);
game.startLevel();

function animate() {
    requestAnimationFrame(animate);
    game.update(0.016);
    
    // Cámara siguiendo a la bola (Ángulo de tus fotos)
    camera.position.set(0, 6, ball.position.z + 8);
    camera.lookAt(0, 0, ball.position.z - 2);
    
    renderer.render(scene, camera);
}
animate();
