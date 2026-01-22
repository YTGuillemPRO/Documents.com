// ESCENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// LUCES
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10,20,10);
scene.add(sun);

// SUELO
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500,500),
  new THREE.MeshStandardMaterial({color:0x2e8b57})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// JUGADOR
const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.4,1.2),
  new THREE.MeshStandardMaterial({color:0x5555ff})
);
player.add(body);
scene.add(player);
player.position.y = 1;

camera.position.set(0,2,4);

// CONTROLES
const keys = {};
addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// PIEZAS
const pieces = ["floor","wall","ramp","roof"];
let currentPiece = 0;
let rotation = 0;

addEventListener("keydown", e => {
  if(e.key === "q") {
    currentPiece = (currentPiece + 1) % pieces.length;
    document.querySelectorAll(".slot").forEach((s,i)=>{
      s.classList.toggle("active", i === currentPiece);
    });
  }
  if(e.key === "r") rotation += Math.PI/2;
});

// CONSTRUIR
addEventListener("mousedown", () => {
  let geo;
  if(pieces[currentPiece]==="floor") geo = new THREE.BoxGeometry(2,0.2,2);
  if(pieces[currentPiece]==="wall") geo = new THREE.BoxGeometry(2,2,0.2);
  if(pieces[currentPiece]==="ramp") geo = new THREE.BoxGeometry(2,0.2,2);
  if(pieces[currentPiece]==="roof") geo = new THREE.BoxGeometry(2,0.2,2);

  const build = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({color:0xb8860b})
  );

  build.position.copy(player.position);
  build.position.z -= 3;
  build.rotation.y = rotation;

  if(pieces[currentPiece]==="ramp")
    build.rotation.x = -Math.PI/6;

  scene.add(build);
});

// LOOP
function animate(){
  requestAnimationFrame(animate);

  if(keys["w"]) player.position.z -= 0.12;
  if(keys["s"]) player.position.z += 0.12;
  if(keys["a"]) player.position.x -= 0.12;
  if(keys["d"]) player.position.x += 0.12;

  camera.lookAt(player.position);
  renderer.render(scene,camera);
}
animate();
