class Game {
  constructor(scene, ball, camera, info) {
    this.scene = scene; this.ball = ball;
    this.camera = camera; this.info = info;

    this.level = 0;
    this.coins = parseInt(localStorage.getItem("coins")) || 0;
    this.attempts = 3;
    this.moving = false;
    this.isShootingZone = false;
    this.dir = new THREE.Vector3(1, 0, -1).normalize();
    this.obstacles = [];
    this.goalDir = 1;
  }

  startLevel(i) {
    [...this.obstacles, this.goal, this.goalkeeper, this.floor, this.goalZone].forEach(o => o && this.scene.remove(o));
    this.obstacles = [];
    this.isShootingZone = false;

    const lvl = levels[i];
    const trackLength = lvl.length * 4;

    // Suelo Morado
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(8, trackLength), new THREE.MeshStandardMaterial({ color: 0x9b59b6 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.z = -trackLength / 2;
    this.scene.add(this.floor);

    // Zona de Tiro Verde
    this.goalZone = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ color: 0x2ecc71 }));
    this.goalZone.rotation.x = -Math.PI / 2;
    this.goalZone.position.set(0, 0.01, -trackLength - 3);
    this.scene.add(this.goalZone);

    // Portería y Portero
    this.goal = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
    this.goal.position.set(0, 1.25, -trackLength - 6);
    this.scene.add(this.goal);

    this.goalkeeper = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    this.goalkeeper.position.set(0, 0.75, -trackLength - 5.5);
    this.scene.add(this.goalkeeper);

    // Obstáculos Amarillos
    for (let o = 0; o < lvl.obstacles; o++) {
      const obs = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1), new THREE.MeshStandardMaterial({ color: 0xffdb4d }));
      obs.position.set((Math.random() - 0.5) * 6, 0.4, -(Math.random() * (trackLength - 10) + 5));
      this.scene.add(obs);
      this.obstacles.push(obs);
    }

    this.ball.position.set(0, 0.5, 0);
    this.dir.set(1, 0, -1).normalize();
    this.updateUI();
  }

  tap() {
    if (!this.moving) {
        this.moving = true;
        document.getElementById("startScreen").style.display = "none";
        return;
    }

    if (!this.isShootingZone) {
      if (this.dir.x > 0) this.dir.set(-1, 0, -1).normalize();
      else this.dir.set(1, 0, -1).normalize();
    } else {
      // Disparo final
      this.dir.set((this.ball.position.x * -1), 0, -3).normalize();
      levels[this.level].speed *= 2.5;
    }
  }

  update(dt) {
    if (!this.moving) return;

    const lvl = levels[this.level];
    this.ball.position.addScaledVector(this.dir, lvl.speed * dt);
    
    // Check Zona Verde
    if (this.ball.position.z < this.goalZone.position.z + 3 && !this.isShootingZone) {
        this.isShootingZone = true;
        this.dir.set(0, 0, -0.5).normalize(); 
    }

    this.goalkeeper.position.x += this.goalDir * dt * (lvl.goalkeeperSpeed || 3);
    if (Math.abs(this.goalkeeper.position.x) > 2) this.goalDir *= -1;

    if (this.hit(this.obstacles) || this.hit([this.goalkeeper])) this.fail();
    if (this.hit([this.goal])) this.nextLevel();
    if (Math.abs(this.ball.position.x) > 4.2) this.fail();
  }

  hit(arr) {
    const b = new THREE.Box3().setFromObject(this.ball);
    return arr.some(o => b.intersectsBox(new THREE.Box3().setFromObject(o)));
  }

  fail() {
    this.attempts--;
    this.moving = false;
    if (this.attempts <= 0) { this.level = 0; this.attempts = 3; }
    document.getElementById("startScreen").style.display = "flex";
    this.startLevel(this.level);
  }

  nextLevel() {
    this.coins += levels[this.level].reward || 50;
    localStorage.setItem("coins", this.coins);
    this.level++;
    this.moving = false;
    document.getElementById("startScreen").style.display = "flex";
    this.startLevel(this.level);
  }

  updateUI() {
    this.info.innerHTML = `NIVEL <b>${this.level + 1}</b> | 💰 <b>${this.coins}</b> | ❤️ <b>${this.attempts}</b>`;
  }

  buySkin(color, price) {
    if (this.coins >= price) {
        if (price > 0) this.coins -= price;
        this.ball.material.color.setHex(color);
        localStorage.setItem("coins", this.coins);
        this.updateUI();
        document.getElementById('shopMenu').classList.add('hidden');
    } else {
        alert("¡No tienes suficientes monedas!");
    }
  }
}
