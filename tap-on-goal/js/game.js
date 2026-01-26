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
    this.goalZone = null;
    this.goalkeeper = null;
    this.goalDir = 1;
  }

  startLevel(i) {
    // Limpieza
    [...this.obstacles, this.goal, this.goalkeeper, this.floor, this.goalZone].forEach(o => o && this.scene.remove(o));
    this.obstacles = [];
    this.isShootingZone = false;

    const lvl = levels[i];
    const trackLength = lvl.length * 4;

    // 1. Suelo Morado (Carrera)
    const floorGeo = new THREE.PlaneGeometry(8, trackLength);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x9b59b6 });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.z = -trackLength / 2;
    this.scene.add(this.floor);

    // 2. Zona de Tiro (Verde) - Al llegar aquí cambian las reglas
    const zoneGeo = new THREE.PlaneGeometry(8, 6);
    const zoneMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71 });
    this.goalZone = new THREE.Mesh(zoneGeo, zoneMat);
    this.goalZone.rotation.x = -Math.PI / 2;
    this.goalZone.position.set(0, 0.01, -trackLength - 3);
    this.scene.add(this.goalZone);

    // 3. Portería
    this.goal = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
    this.goal.position.set(0, 1.25, -trackLength - 6);
    this.scene.add(this.goal);

    // 4. Obstáculos Amarillos
    for (let o = 0; o < lvl.obstacles; o++) {
      const obs = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1), new THREE.MeshStandardMaterial({ color: 0xffdb4d }));
      obs.position.set((Math.random() - 0.5) * 6, 0.4, -(Math.random() * (trackLength - 10) + 5));
      this.scene.add(obs);
      this.obstacles.push(obs);
    }

    // 5. Portero
    this.goalkeeper = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    this.goalkeeper.position.set(0, 0.75, -trackLength - 5.5);
    this.scene.add(this.goalkeeper);

    // Reset Bola
    this.ball.position.set(0, 0.5, 0);
    this.dir.set(1, 0, -1).normalize();
    this.moving = false;
    this.updateUI();
  }

  tap() {
    if (!this.moving) {
      this.moving = true;
      return;
    }

    if (!this.isShootingZone) {
      // Movimiento Diagonal: Girar 90 grados
      if (this.dir.x > 0) this.dir.set(-1, 0, -1).normalize();
      else this.dir.set(1, 0, -1).normalize();
    } else {
      // MODO TIRO: Disparar directo
      this.dir.set((this.ball.position.x * -0.5), 0, -2).normalize();
      levels[this.level].speed *= 2; 
    }
  }

  update(dt) {
    if (!this.moving) return;

    const lvl = levels[this.level];
    this.ball.position.addScaledVector(this.dir, lvl.speed * dt);
    this.ball.rotation.x -= 10 * dt;

    // Detectar si entramos en la zona verde
    if (this.ball.position.z < this.goalZone.position.z + 3 && !this.isShootingZone) {
        this.isShootingZone = true;
        this.dir.set(0, 0, -0.5).normalize(); // Se frena un poco para apuntar
    }

    // Portero
    this.goalkeeper.position.x += this.goalDir * dt * 4;
    if (Math.abs(this.goalkeeper.position.x) > 2) this.goalDir *= -1;

    // Colisiones
    if (this.hit(this.obstacles) || this.hit([this.goalkeeper])) this.fail();
    if (this.hit([this.goal])) this.nextLevel();

    // Caída
    if (Math.abs(this.ball.position.x) > 4.5) this.fail();
  }

  hit(arr) {
    const b = new THREE.Box3().setFromObject(this.ball);
    return arr.some(o => b.intersectsBox(new THREE.Box3().setFromObject(o)));
  }

  fail() {
    this.attempts--;
    this.moving = false;
    if (this.attempts <= 0) { this.level = 0; this.attempts = 3; }
    this.startLevel(this.level);
  }

  nextLevel() {
    this.coins += levels[this.level].reward;
    localStorage.setItem("coins", this.coins);
    this.level++;
    this.moving = false;
    alert(`¡GOL! +${levels[this.level-1].reward} monedas`);
    this.startLevel(this.level);
  }

  updateUI() {
    this.info.innerHTML = `NIVEL ${this.level + 1} | 💰 ${this.coins} | ❤️ ${this.attempts}`;
  }

  buySkin(color, price) {
    if (this.coins >= price) {
        this.coins -= price;
        this.ball.material.color.setHex(color);
        localStorage.setItem("coins", this.coins);
        this.updateUI();
        return true;
    }
    alert("No tienes suficientes monedas");
    return false;
  }
}
