class Game {
  constructor(scene, ball, camera, info) {
    this.scene = scene;
    this.ball = ball;
    this.camera = camera;
    this.info = info;

    this.level = 0;
    this.coins = parseInt(localStorage.getItem("coins")) || 0;
    this.attempts = 3;

    this.moving = false;
    this.isShootingZone = false;
    this.hasShot = false;

    this.dir = new THREE.Vector3(1, 0, -1).normalize();
    this.velocityY = 0;
    this.gravity = -18;

    this.obstacles = [];
    this.goalDir = 1;

    this.startLevel(this.level);
  }

  startLevel(i) {
    [...this.obstacles, this.goal, this.goalkeeper, this.floor, this.goalZone]
      .forEach(o => o && this.scene.remove(o));

    this.obstacles = [];
    this.isShootingZone = false;
    this.hasShot = false;
    this.moving = false;
    this.velocityY = 0;

    const lvl = levels[i] || levels[0];
    const trackLength = lvl.length * 5;
    const trackWidth = 14;

    // Suelo
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(trackWidth, trackLength),
      new THREE.MeshStandardMaterial({ color: 0x9b59b6 })
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.z = -trackLength / 2;
    this.scene.add(this.floor);

    // Zona de tiro
    this.goalZone = new THREE.Mesh(
      new THREE.PlaneGeometry(trackWidth, 8),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
    );
    this.goalZone.rotation.x = -Math.PI / 2;
    this.goalZone.position.z = -trackLength - 4;
    this.scene.add(this.goalZone);

    // Portería
    this.goal = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 0.6),
      new THREE.MeshStandardMaterial({ wireframe: true })
    );
    this.goal.position.set(0, 1.5, -trackLength - 9);
    this.scene.add(this.goal);

    // Portero
    this.goalkeeper = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    this.goalkeeper.position.set(0, 0.9, -trackLength - 8.4);
    this.scene.add(this.goalkeeper);

    // Obstáculos (más separados)
    for (let i = 0; i < lvl.obstacles; i++) {
      const obs = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.8, 1.5),
        new THREE.MeshStandardMaterial({ color: 0xffdb4d })
      );
      obs.position.set(
        (Math.random() - 0.5) * (trackWidth - 3),
        0.4,
        -(i * 6 + 8)
      );
      this.scene.add(obs);
      this.obstacles.push(obs);
    }

    this.ball.position.set(0, 0.5, 0);
    this.dir.set(1, 0, -1).normalize();
    this.updateUI();
  }

  startRun() {
    this.moving = true;
  }

  tap(e) {
    if (!this.moving) return;
    if (e.target.closest('#shopWrapper')) return;

    // Zig-zag antes del chute
    if (!this.isShootingZone) {
      this.dir.x *= -1;
      return;
    }

    // CHUTE
    if (!this.hasShot) {
      this.hasShot = true;
      this.dir.set(this.ball.position.x * -0.6, 0, -1).normalize();
      this.velocityY = 10; // fuerza del chute
    }
  }

  update(dt) {
    if (!this.moving) return;

    const lvl = levels[this.level];
    const speed = lvl.speed;

    // Movimiento horizontal
    this.ball.position.addScaledVector(this.dir, speed * dt);

    // Movimiento vertical (chute)
    if (this.hasShot) {
      this.velocityY += this.gravity * dt;
      this.ball.position.y += this.velocityY * dt;

      if (this.ball.position.y < 0.5) {
        this.ball.position.y = 0.5;
        this.velocityY = 0;
      }
    }

    // Detectar zona verde
    if (!this.isShootingZone &&
        this.ball.position.z < this.goalZone.position.z + 4) {
      this.isShootingZone = true;
      this.dir.set(0, 0, -1);
    }

    // Movimiento del portero
    this.goalkeeper.position.x += this.goalDir * dt * lvl.goalkeeperSpeed;
    if (Math.abs(this.goalkeeper.position.x) > 2.5) this.goalDir *= -1;

    if (!this.hasShot && this.hit(this.obstacles)) this.fail();
    if (this.hit([this.goalkeeper])) this.fail();
    if (this.hit([this.goal])) this.nextLevel();
    if (Math.abs(this.ball.position.x) > 7) this.fail();
  }

  hit(arr) {
    const sphere = new THREE.Sphere(this.ball.position, 0.4);
    return arr.some(o =>
      new THREE.Box3().setFromObject(o).intersectsSphere(sphere)
    );
  }

  fail() {
    this.attempts--;
    this.moving = false;

    if (this.attempts <= 0) {
      alert("GAME OVER");
      this.level = 0;
      this.attempts = 3;
    }

    document.getElementById("startScreen").style.display = "flex";
    this.startLevel(this.level);
  }

  nextLevel() {
    const reward = levels[this.level].reward;
    this.coins += reward;
    localStorage.setItem("coins", this.coins);

    alert(`⚽ ¡GOLAZO! +${reward} monedas`);

    this.level++;
    this.moving = false;
    document.getElementById("startScreen").style.display = "flex";
    this.startLevel(this.level);
  }

  updateCamera() {
    const target = this.ball.position.clone().add(new THREE.Vector3(0, 7, 10));
    this.camera.position.lerp(target, 0.1);
    this.camera.lookAt(this.ball.position);
  }

  updateUI() {
    this.info.innerHTML =
      `NIVEL ${this.level + 1} | 💰 ${this.coins} | ❤️ ${this.attempts}`;
  }

  buySkin(color, price) {
    if (this.coins < price) return alert("No tienes monedas");
    this.coins -= price;
    this.ball.material.color.setHex(color);
    localStorage.setItem("coins", this.coins);
    this.updateUI();
  }
}
