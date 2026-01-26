import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export class Game {
  constructor() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Player
    this.player = new THREE.Object3D();
    this.player.add(this.camera);
    this.camera.position.y = 1.6;
    this.scene.add(this.player);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Enemy
    this.enemy = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    this.enemy.position.set(5, 0.5, -5);
    this.scene.add(this.enemy);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    this.scene.add(light);

    // Controls
    this.keys = {};
    this.speed = 0.1;

    window.addEventListener("keydown", e => this.keys[e.code] = true);
    window.addEventListener("keyup", e => this.keys[e.code] = false);

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  start() {
    this.loop();
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    // Movement
    if (this.keys["KeyW"]) this.player.position.z -= this.speed;
    if (this.keys["KeyS"]) this.player.position.z += this.speed;
    if (this.keys["KeyA"]) this.player.position.x -= this.speed;
    if (this.keys["KeyD"]) this.player.position.x += this.speed;

    // Enemy follows
    this.enemy.position.lerp(this.player.position, 0.01);

    this.renderer.render(this.scene, this.camera);
  }
}
