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
    
    // Forzar cámara inicial
    this.updateCamera();
  }

  startLevel(i) {
    // Limpieza total
    [...this.obstacles, this.goal, this.goalkeeper, this.floor, this.goalZone].forEach(o => o && this.scene.remove(o));
    this.obstacles = [];
    this.isShootingZone = false;
    this.moving = false; // Detener movimiento al reiniciar

    const lvl = levels[i] || levels[0];
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

    // Portería
    this.goal = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
    this.goal.position.set(0, 1.25, -trackLength - 6);
    this.scene.add(this.goal);

    // Portero
    this.goalkeeper = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    this.goalkeeper.position.set(0, 0.75, -trackLength - 5.5);
    this.scene.add(this.goalkeeper);

    // Obstáculos Amarillos
    for (let o = 0; o < lvl.obstacles; o++) {
      const obs = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1.2), new THREE.MeshStandardMaterial({ color: 0xffdb4d }));
      obs.position.set((Math.random() - 0.5) * 6, 0.4, -(Math.random() * (trackLength - 10) + 5));
      this.scene.add(obs);
      this.obstacles.push(obs);
    }

    // Reset Bola y Dirección
    this.ball.position.set(0, 0.5, 0);
    this.dir.set(1, 0, -1).normalize();
    this.updateUI();
    this.updateCamera();
  }

  tap(e) {
    // Evitar que el clic en la tienda dispare el movimiento
    if (e && e.target.closest('#shopWrapper')) return;

    if (!this.moving) {
      const startScreen = document.getElementById("startScreen");
      if (startScreen.style.display !== "none") {
        startScreen.style.display = "none";
        this.moving = true;
        return;
      }
    }

    if (this.moving) {
      if (!this.isShootingZone) {
        // Giro en diagonal
        if (this.dir.x > 0) this.dir.set(-1, 0, -1).normalize();
        else this.dir.set(1, 0, -1).normalize();
      } else {
        // Disparo final
        this.dir.set((this.ball.position.x * -1.2), 0, -4).normalize();
      }
    }
  }

  update(dt) {
    if (!this.moving) return;

    const lvl = levels[this.level] || levels[0];
    const speed = this.isShootingZone ? lvl.speed * 1.5 : lvl.speed;
    
    this.ball.position.addScaledVector(this.dir, speed * dt);
    this.ball.rotation.x -= 10 * dt;

    // Detectar Zona Verde
    if (this.ball.position.z < (this.goalZone.position.z + 3) && !this.isShootingZone) {
      this.isShootingZone = true;
      this.dir.set(0, 0, -0.5).normalize(); // Freno para apuntar
    }

    // Portero
    this.goalkeeper.position.x += this.goalDir * dt * (lvl.goalkeeperSpeed || 3);
    if (Math.abs(this.goalkeeper.position.x) > 2.2) this.goalDir *= -1;

    // Colisiones
    if (this.hit(this.obstacles) || this.hit([this.goalkeeper])) this.fail();
    if (this.hit([this.goal])) this.nextLevel();
    
    // Límite lateral (Caída)
    if (Math.abs(this.ball.position.x) > 4.5) this.fail();
  }

  hit(arr) {
    const ballSphere = new THREE.Sphere(this.ball.position, 0.4);
    return arr.some(o => new THREE.Box3().setFromObject(o).intersectsSphere(ballSphere));
  }

  fail() {
    this.attempts--;
    this.moving = false;
    if (this.attempts <= 0) { 
        alert("GAME OVER - Vuelves al Nivel 1");
        this.level = 0; 
        this.attempts = 3; 
    }
    document.getElementById("startScreen").style.display = "flex";
    this.startLevel(this.level);
  }

  nextLevel() {
    const reward = levels[this.level].reward || 50;
    this.coins += reward;
    localStorage.setItem("coins", this.coins);
    this.level++;
    this.moving = false;
    alert(`¡GOLAZO! Ganaste ${reward} monedas.`);
    document.getElementById("startScreen").style.display = "flex";
    this.startLevel(this.level);
  }

  updateCamera() {
    const offset = new THREE.Vector3(0, 6, 8);
    const target = this.ball.position.clone().add(offset);
    this.camera.position.lerp(target, 0.1);
    this.camera.lookAt(this.ball.position.x, 0, this.ball.position.z - 2);
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
      document.getElementById('shopMenu').classList.add('hidden');
    } else {
      alert("Necesitas más monedas");
    }
  }
}
