class Game {
  constructor(scene, ball, camera, info) {
    this.scene = scene;
    this.ball = ball;
    this.camera = camera;
    this.info = info;

    this.level = 0;
    this.attempts = 3;
    this.speed = 5;
    this.side = 1;
    this.moving = false;

    this.platforms = [];
    this.obstacles = [];
    this.goal = null;
    this.goalkeeper = null;
    this.goalDir = 1;
  }

  startLevel(i) {
    [...this.platforms, ...this.obstacles, this.goal, this.goalkeeper]
      .forEach(o => o && this.scene.remove(o));

    this.platforms = [];
    this.obstacles = [];

    const lvl = levels[i];
    let x = 0, z = 0;

    // Plataformas (zigzag hacia delante)
    for (let p = 0; p < lvl.length; p++) {
      const geo = new THREE.BoxGeometry(2.4, 0.3, 2.4);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffc83d });
      const tile = new THREE.Mesh(geo, mat);
      tile.position.set(x, 0, z);
      this.scene.add(tile);
      this.platforms.push(tile);

      x += this.side * 2.4;
      z -= 2.4;
      this.side *= -1;
    }

    // Obstáculos
    for (let o = 0; o < lvl.obstacles; o++) {
      const ref = this.platforms[Math.floor(Math.random() * (this.platforms.length - 2)) + 1];
      const obs = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 1, 16),
        new THREE.MeshStandardMaterial({ color: 0xff4d4d })
      );
      obs.position.set(ref.position.x, 0.5, ref.position.z);
      this.scene.add(obs);
      this.obstacles.push(obs);
    }

    // Portería
    this.goal = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 1),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
    );
    const last = this.platforms.at(-1);
    this.goal.position.set(0, 0.15, last.position.z - 3);
    this.scene.add(this.goal);

    // Portero
    this.goalkeeper = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x3498db })
    );
    this.goalkeeper.position.set(0, 0.5, this.goal.position.z);
    this.scene.add(this.goalkeeper);

    // Bola
    this.ball.position.set(0, 0.4, 0);
    this.direction = new THREE.Vector3(0, 0, -1);
    this.sideDir = 1;
    this.moving = false;

    this.updateUI();
  }

  tap() {
    this.moving = true;
    this.sideDir *= -1;
    this.direction.x = this.sideDir;
  }

  update(dt) {
    if (!this.moving) return;

    this.ball.position.addScaledVector(this.direction, this.speed * dt);

    // Portero movimiento
    this.goalkeeper.position.x += this.goalDir * dt * 2;
    if (Math.abs(this.goalkeeper.position.x) > 1.5) this.goalDir *= -1;

    if (this.hit(this.obstacles) || this.hit([this.goalkeeper])) {
      this.fail();
    }

    if (this.hit([this.goal])) {
      this.nextLevel();
    }
  }

  hit(arr) {
    const b = new THREE.Box3().setFromObject(this.ball);
    return arr.some(o => b.intersectsBox(new THREE.Box3().setFromObject(o)));
  }

  fail() {
    this.attempts--;
    alert("💥 Has perdido");
    if (this.attempts <= 0) {
      this.level = 0;
      this.attempts = 3;
    }
    this.startLevel(this.level);
  }

  nextLevel() {
    alert("⚽ ¡GOOOL!");
    this.level++;
    if (this.level >= levels.length) this.level = 0;
    this.attempts = 3;
    this.startLevel(this.level);
  }

  updateCamera() {
    this.camera.position.lerp(
      new THREE.Vector3(
        this.ball.position.x,
        this.ball.position.y + 5,
        this.ball.position.z + 6
      ),
      0.1
    );
    this.camera.lookAt(this.ball.position);
  }

  updateUI() {
    this.info.textContent = `Nivel ${this.level + 1} | Intentos ${this.attempts}`;
  }
}
