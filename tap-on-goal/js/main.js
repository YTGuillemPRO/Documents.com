const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// luces
const dirLight = new THREE.DirectionalLight(0xffffff,1);
dirLight.position.set(10,20,10);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0x404040));

// UI
const info = document.getElementById('info');
const startScreen = document.getElementById('startScreen');

// pelota
const ballGeo = new THREE.SphereGeometry(0.4,32,32);
const ballMat = new THREE.MeshStandardMaterial({color:0x6a00ff});
const ball = new THREE.Mesh(ballGeo,ballMat);
scene.add(ball);

// iniciar juego
const game = new Game(scene, ball, camera, info);
game.startLevel(0);

startScreen.addEventListener('click',()=>{
    startScreen.style.display='none';
});

window.addEventListener('mousedown',()=>game.changeDirection());
window.addEventListener('touchstart',()=>game.changeDirection());

window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// posición inicial cámara
camera.position.set(4,5,4);
camera.lookAt(0,0,0);

// loop principal
const clock = new THREE.Clock();

function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    game.update(delta);
    game.updateCamera();
    renderer.render(scene,camera);
}

animate();

