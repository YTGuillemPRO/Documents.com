const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({color: 0xffffff})
);
scene.add(ball);

const game = new Game(scene, ball, camera);
game.startLevel(0);

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    game.update(dt);
    
    // Cámara siguiendo a la bola como en la foto
    camera.position.set(0, 7, ball.position.z + 8);
    camera.lookAt(0, 0, ball.position.z - 4);
    
    renderer.render(scene, camera);
}
animate();
