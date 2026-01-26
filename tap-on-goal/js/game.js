class Game {
  constructor(scene, ball, camera, info) {
    this.scene = scene;
    this.ball = ball;
    this.camera = camera;
    this.info = info;

    this.level = 0;
    this.attempts = 3;
    this.speed = 8;
    this.moving = false;
    this.targetX = 0; // Posición horizontal deseada
    this.laneWidth = 6; // Ancho del campo

    this.obstacles = [];
    this.goal = null;
    this.goalkeeper = null;
    this.goalDir = 1;
  }

  startLevel(i) {
    // Limpiar escena
    [...this.obstacles, this.goal, this.goalkeeper, this.floor].forEach(o => o && this.scene.remove(o));
    this.obstacles = [];

    const lvl = levels[i];
    const trackLength = lvl.length * 5;

    // Crear Suelo (Pasillo rosa/morado como en la imagen)
    const floorGeo = new THREE.PlaneGeometry(this.laneWidth, trackLength);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe082ff }); // Rosa/Morado
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.z = -trackLength / 2 + 2;
    this.scene.add(this.floor);

    // Crear Obstáculos Amarillos (Bloques)
    for (let o = 0; o < lvl.obstacles; o++) {
      const obsGeo = new THREE.BoxGeometry(2.5, 0.8, 1);
      const obsMat = new THREE.MeshStandardMaterial({ color: 0xffdb4d }); // Amarillo
      const obs = new THREE.Mesh(obsGeo, obsMat);
      
      // Posición aleatoria en X y Z
      const x = (Math.random() - 0.5) * (this.laneWidth - 1);
      const z = -Math.random() * (trackLength - 10) - 5;
      
      obs.position.set(x, 0.4, z);
      this.scene.add(obs);
      this.obstacles.push(obs);
    }

    // Portería al final
    const goalGeo = new THREE.BoxGeometry(4, 2, 0.2);
    const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true });
    this.goal = new THREE.Mesh(goalGeo, goalMat);
    this.goal.position.set(0, 1, -trackLength);
    this.scene.add(this.goal);

    // Portero
    this.goalkeeper = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    this.goalkeeper.position.set(0, 0.6, -trackLength + 0.5);
    this.scene.add(this.goalkeeper);

    // Reset Bola
    this.ball.position.set(0, 0.4, 0);
    this.targetX = 0;
    this.moving = false;
    this.updateUI();
  }

  // Al hacer clic, movemos la bola hacia ese lado
  tap(event) {
    this.moving = true;
    const screenWidth = window.innerWidth;
    const clickX = event.clientX;

    // Si haces clic a la izquierda del centro, vas a la izquierda, si no a la derecha
    if (clickX < screenWidth / 2) {
      this.targetX = -this.laneWidth / 3;
    } else {
      this.targetX = this.laneWidth / 3;
    }
  }

  update(dt) {
    if (!this.moving) return;

    // Movimiento constante hacia adelante
    this.ball.position.z -= this.speed * dt;

    // Movimiento suave lateral (Lerp hacia el lado donde clicamos)
    this.ball.position.x = THREE.MathUtils.lerp(this.ball.position.x, this.targetX, 0.1);

    // Rotación de la bola
    this.ball.rotation.x -= this.speed * dt * 2;

    // Movimiento del portero
    this.goalkeeper.position.x += this.goalDir * dt * 3;
    if (Math.abs(this.goalkeeper.position.x) > 1.5) this.goalDir *= -1;

    // Colisiones con bloques amarillos (Perder)
    if (this.hit(this.obstacles)) {
      this.fail("¡Chocaste con un obstáculo!");
    }

    // Colisión con portero
    if (this.hit([this.goalkeeper])) {
      this.fail("¡El portero la detuvo!");
    }

    // Gol
    if (this.hit([this.goal])) {
      this.nextLevel();
    }

    // Si se sale del campo (opcional)
    if (this.ball.position.z < this.goal.position.z - 2) {
      this.fail("¡Fuera!");
    }
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
  }

  nextLevel() {
    this.moving = false;
    alert("⚽ ¡GOOOOL!");
    this.level++;
    if (this.level >= levels.length) this.level = 0;
    this.startLevel(this.level);
  }

  updateCamera() {
    const camPos = new THREE.Vector3(0, 4, this.ball.position.z + 6);
    this.camera.position.lerp(camPos, 0.1);
    this.camera.lookAt(new THREE.Vector3(0, 0, this.ball.position.z - 2));
  }

  updateUI() {
    this.info.innerHTML = `NIVEL ${this.level + 1} | ❤️ ${this.attempts}`;
  }
}
