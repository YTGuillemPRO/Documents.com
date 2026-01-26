class Game {
  constructor(scene, ball, camera, info) {
    this.scene = scene;
    this.ball = ball;
    this.camera = camera;
    this.info = info;

    this.level = 0;
    this.attempts = 3;
    this.speed = 6;
    this.side = 1;
    this.moving = false;
    this.isShooting = false; // Nuevo: Estado de tiro final

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
    this.isShooting = false;

    const lvl = levels[i];
    let x = 0, z = 0;

    // Generar Plataformas
    for (let p = 0; p < lvl.length; p++) {
      const geo = new THREE.BoxGeometry(2.5, 0.4, 2.5);
      const mat = new THREE.MeshStandardMaterial({ color: (p % 2 === 0) ? 0xffdb4d : 0xffc83d });
      const tile = new THREE.Mesh(geo, mat);
      tile.position.set(x, 0, z);
      this.scene.add(tile);
      this.platforms.push(tile);

      if (p < lvl.length - 1) {
        x += this.side * 2.5;
        z -= 2.5;
        this.side *= -1;
      }
    }

    // Obstáculos (Jugadores contrarios estáticos)
    for (let o = 0; o < lvl.obstacles; o++) {
      const ref = this.platforms[Math.floor(Math.random() * (this.platforms.length - 3)) + 1];
      const obs = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xff4d4d })
      );
      obs.position.set(ref.position.x, 0.9, ref.position.z);
      this.scene.add(obs);
      this.obstacles.push(obs);
    }

    // Portería realista
    const goalGeo = new THREE.BoxGeometry(5, 2.5, 0.5);
    const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true });
    this.goal = new THREE.Mesh(goalGeo, goalMat);
    const last = this.platforms.at(-1);
    this.goal.position.set(last.position.x, 1.25, last.position.z - 6);
    this.scene.add(this.goal);

    // Portero
    this.goalkeeper = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x3498db })
    );
    this.goalkeeper.position.set(last.position.x, 0.75, this.goal.position.z + 0.5);
    this.scene.add(this.goalkeeper);

    // Reset Bola
    this.ball.position.set(0, 0.6, 0);
    this.direction = new THREE.Vector3(0, 0, -1);
    this.sideDir = 0;
    this.moving = false;
    this.updateUI();
  }

  tap() {
    if (!this.moving) {
      this.moving = true;
      this.direction.set(this.side, 0, -1).normalize();
      return;
    }

    if (!this.isShooting) {
      // Cambio de zigzag normal
      this.side *= -1;
      this.direction.set(this.side, 0, -1).normalize();
      
      // Si estamos cerca de la última plataforma, activamos modo tiro
      const lastTile = this.platforms.at(-1);
      if (Math.abs(this.ball.position.z - lastTile.position.z) < 1) {
        this.isShooting = true;
        // En el modo tiro, el balón sigue recto hasta que el usuario decida apuntar
      }
    } else {
      // Ejecutar el tiro final hacia la portería
      // Calculamos dirección hacia la portería con un ligero ángulo basado en el tiempo
      const shootX = (Math.random() - 0.5) * 4; 
      this.direction.set(shootX, 0, -5).normalize();
      this.speed *= 1.5; // El tiro es más rápido
    }
  }

  update(dt) {
    if (!this.moving) return;

    this.ball.position.addScaledVector(this.direction, this.speed * dt);
    this.ball.rotation.x -= dt * 5; // Efecto de rotación

    // Movimiento del Portero
    this.goalkeeper.position.x += this.goalDir * dt * (3 + this.level);
    const lastTile = this.platforms.at(-1);
    if (Math.abs(this.goalkeeper.position.x - lastTile.position.x) > 2) this.goalDir *= -1;

    // Colisiones
    if (this.hit(this.obstacles) || this.hit([this.goalkeeper])) {
      this.fail();
    }

    // Comprobar si se sale de las plataformas (caída)
    if (!this.isShooting && !this.onPlatform()) {
        this.fail();
    }

    // Gol
    if (this.hit([this.goal])) {
      this.nextLevel();
    }
    
    // Si el balón se pasa de la portería sin entrar
    if (this.ball.position.z < this.goal.position.z - 2) {
        this.fail();
    }
  }

  onPlatform() {
    const b = new THREE.Box3().setFromObject(this.ball);
    return this.platforms.some(p => {
        const pBox = new THREE.Box3().setFromObject(p);
        return b.intersectsBox(pBox);
    });
  }

  hit(arr) {
    const b = new THREE.Sphere(this.ball.position, 0.4);
    return arr.some(o => {
        const oBox = new THREE.Box3().setFromObject(o);
        return oBox.intersectsSphere(b);
    });
  }

  fail() {
    this.moving = false;
    this.speed = 6;
    this.attempts--;
    if (this.attempts <= 0) {
      alert("GAME OVER - Reiniciando");
      this.level = 0;
      this.attempts = 3;
    }
    this.startLevel(this.level);
  }

  nextLevel() {
    this.moving = false;
    this.level++;
    this.speed = 6 + (this.level * 0.5);
    alert("¡GOOOLAZO!");
    if (this.level >= levels.length) {
        alert("¡HAS GANADO EL TORNEO!");
        this.level = 0;
    }
    this.startLevel(this.level);
  }

  updateCamera() {
    const offset = new THREE.Vector3(0, 5, 7);
    const targetPos = this.ball.position.clone().add(offset);
    this.camera.position.lerp(targetPos, 0.1);
    this.camera.lookAt(this.ball.position);
  }

  updateUI() {
    this.info.innerHTML = `NIVEL: <b>${this.level + 1}</b> | INTENTOS: <b>${this.attempts}</b>`;
  }
}
