class Game {
  constructor(scene, ball, camera, info) {
    this.scene = scene;
    this.ball = ball;
    this.camera = camera;
    this.info = info;

    this.level = 0;
    this.attempts = 3;
    this.moving = false;
    this.targetX = 0;
    this.laneWidth = 7; // Un poco más ancho para dar juego

    this.obstacles = [];
    this.goal = null;
    this.goalkeeper = null;
    this.goalDir = 1;
  }

  startLevel(i) {
    // Limpiar escena previa
    [...this.obstacles, this.goal, this.goalkeeper, this.floor].forEach(o => o && this.scene.remove(o));
    this.obstacles = [];

    const lvl = levels[i];
    this.currentSpeed = lvl.speed; // Velocidad según nivel
    const trackLength = lvl.length * 5;

    // Suelo Rosa (Estilo imagen)
    const floorGeo = new THREE.PlaneGeometry(this.laneWidth, trackLength + 10);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe082ff });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.z = -trackLength / 2 + 5;
    this.scene.add(this.floor);

    // Obstáculos Amarillos (Bloques)
    for (let o = 0; o < lvl.obstacles; o++) {
      const obsGeo = new THREE.BoxGeometry(2.2, 0.8, 1.2);
      const obsMat = new THREE.MeshStandardMaterial({ color: 0xffdb4d });
      const obs = new THREE.Mesh(obsGeo, obsMat);
      
      // Distribución aleatoria pero evitando el inicio
      const x = (Math.random() - 0.5) * (this.laneWidth - 1.5);
      const z = -(Math.random() * (trackLength - 15) + 10);
      
      obs.position.set(x, 0.4, z);
      this.scene.add(obs);
      this.obstacles.push(obs);
    }

    // Portería
    const goalGeo = new THREE.BoxGeometry(5, 2.5, 0.2);
    const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true });
    this.goal = new THREE.Mesh(goalGeo, goalMat);
    this.goal.position.set(0, 1.25, -trackLength);
    this.scene.add(this.goal);

    // Portero
    this.goalkeeper = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    this.goalkeeper.position.set(0, 0.75, -trackLength + 0.5);
    this.scene.add(this.goalkeeper);

    // Reset Bola
    this.ball.position.set(0, 0.5, 0);
    this.targetX = 0;
    this.moving = false;
    this.updateUI();
  }

  tap(event) {
    if (!this.moving) {
        this.moving = true;
        document.getElementById("startScreen").style.display = "none";
    }
    const clickX = event.clientX;
    const mid = window.innerWidth / 2;
    
    // Si clicamos izquierda, vamos a un carril izquierdo, si no al derecho
    this.targetX = (clickX < mid) ? -2 : 2;
  }

  update(dt) {
    if (!this.moving) return;

    const lvl = levels[this.level];

    // Avance y movimiento lateral
    this.ball.position.z -= this.currentSpeed * dt;
    this.ball.position.x = THREE.MathUtils.lerp(this.ball.position.x, this.targetX, 0.1);
    this.ball.rotation.x -= this.currentSpeed * dt * 2;

    // Movimiento Portero
    this.goalkeeper.position.x += this.goalDir * dt * lvl.goalkeeperSpeed;
    if (Math.abs(this.goalkeeper.position.x) > 2) this.goalDir *= -1;

    // Colisiones
    if (this.hit(this.obstacles)) this.fail("¡BLOQUEADO!");
    if (this.hit([this.goalkeeper])) this.fail("¡PARADÓN!");
    if (this.hit([this.goal])) this.nextLevel();

    // Caída o fuera de rango
    if (this.ball.position.z < this.goal.position.z - 3) this.fail("¡FUERA!");
  }

  hit(arr) {
    const ballBox = new THREE.Box3().setFromObject(this.ball);
    return arr.some(o => {
      const obsBox = new THREE.Box3().setFromObject(o);
      return ballBox.intersectsBox(obsBox);
    });
  }

  fail(msg) {
    this.moving = false;
    this.attempts--;
    alert(msg);
    if (this.attempts <= 0) {
      this.level = 0;
      this.attempts = 3;
    }
    this.startLevel(this.level);
    document.getElementById("startScreen").style.display = "flex";
  }

  nextLevel() {
    this.moving = false;
    this.level++;
    if (this.level >= 50) {
        alert("¡CAMPEÓN DEL MUNDO! Has completado los 50 niveles.");
        this.level = 0;
    } else {
        alert(`¡GOL EN EL NIVEL ${this.level}! Siguiente nivel...`);
    }
    this.startLevel(this.level);
    document.getElementById("startScreen").style.display = "flex";
  }

  updateCamera() {
    const targetPos = new THREE.Vector3(0, 5, this.ball.position.z + 8);
    this.camera.position.lerp(targetPos, 0.1);
    this.camera.lookAt(0, 0, this.ball.position.z - 3);
  }

  updateUI() {
    this.info.innerHTML = `NIVEL <b>${this.level + 1}</b>/50 | ❤️ <b>${this.attempts}</b>`;
  }
}
