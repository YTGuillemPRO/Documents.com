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
    this.dir = new THREE.Vector3(1, 0, -1).normalize();

    this.obstacles = [];
    this.goalDir = 1;

    this.startLevel(this.level);
  }

  startLevel(i) {
    [...this.obstacles, this.goal, this.goalkeeper, this.floor, this.goalZone]
      .forEach(o => o && this.scene.remove(o));

    this.obstacles = [];
    this.isShootingZone = false;
    this.moving = false;

    const lvl = levels[i] || levels[0];
    const trackLength = lvl.length * 4;

    // Suelo
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, trackLength),
      new THREE.MeshStandardMaterial({ color: 0x9b59b6 })
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.z = -trackLength / 2;
    this.scene.add(this.floor);

    // Zona verde
    this.goalZone = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 6),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
    );
    this.goalZone.rotation.x = -Math.PI / 2;
    this.goalZone.position.z = -trackLength - 3;
    this.scene.add(this.goalZone);

    // Portería
    this.goal = new THREE.Mesh(
      new THREE.BoxGeometry(5, 2.5, 0.5),
      new THREE.MeshStandardMaterial({ wireframe: true })
    );
    this.goal.position.set(0, 1.25, -trackLength - 6);
    this.scene.add(this.goal);

    // Portero
    this.goalkeeper = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    this.goalkeeper.position.set(0, 0.75, -trackLength - 5.5);
    this.scene.add(this.goalkeeper);

    // Obstáculos
    for (let i = 0; i < lvl.obstacles; i++) {
      const obs = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.8, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xffdb4d })
      );
      obs.position.set(
        (Math.random() - 0.5) * 6,
        0.4,
        -(Math.random() * (trackLength - 10) + 5)
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

    if (!this.isShootingZone) {
      this.dir.x *= -1;
    } else {
      this.dir.set(this.ball.position.x * -1.2, 0, -4).normalize();
    }
  }

  update(dt) {
    if (!this.moving) return;

    const lvl = levels[this.level];
    const speed = this.isShootingZone ? lvl.speed * 1.5 : lvl.speed;

    this.ball.position.addScaledVector(this.dir, speed * dt);

    if (!this.isShootingZone &&
        this.ball.position.z < this.goalZone.position.z + 3) {
      this.isShootingZone = true;
      this.dir.set(0, 0, -1);
    }

    this.goalkeeper.position.x += this.goalDir * dt * lvl.goalkeeperSpeed;
    if (Math.abs(this.goalkeeper.position.x) > 2.2) this.goalDir *= -1;

    if (this.hit(this.obstacles) || this.hit([this.goalkeeper])) this.fail();
    if (this.hit([this.goal])) this.nextLevel();
    if (Math.abs(this.ball.position.x) > 4.5) this.fail();
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

    alert(`¡GOL! +${reward} monedas`);

    this.level++;
    this.moving = false;
    document.getElementById("startScreen").style.display = "flex";
    this.startLevel(this.level);
  }

  updateCamera() {
    const target = this.ball.position.clone().add(new THREE.Vector3(0, 6, 8));
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
