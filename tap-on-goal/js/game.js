class Game {
    constructor(scene, ball, camera) {
        this.scene = scene; this.ball = ball; this.camera = camera;
        this.level = 0; this.coins = 0; this.lives = 3;
        this.moving = false; this.isShooting = false;
        this.dir = new THREE.Vector3(1, 0, -1).normalize();
        this.obstacles = [];
    }

    startLevel() {
        // Limpiar escena (mantener luces)
        this.obstacles.forEach(o => this.scene.remove(o));
        if(this.ground) this.scene.remove(this.ground);
        if(this.stands) this.scene.remove(this.stands);
        
        this.obstacles = [];
        this.moving = false;
        this.isShooting = false;

        const trackLen = 100;

        // Suelo de cuadros (rosa claro / rosa oscuro)
        const groundGeo = new THREE.PlaneGeometry(10, trackLen + 20);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1 });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.z = -trackLen / 2;
        this.scene.add(this.ground);

        // Gradas grises
        this.createWorld(trackLen);

        // Obstáculos Amarillos
        for(let i=0; i<15; i++) {
            const obs = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 2), new THREE.MeshStandardMaterial({color: 0xffd700}));
            obs.position.set(i % 2 === 0 ? -2 : 2, 0.5, -i * 6 - 10);
            this.scene.add(obs);
            this.obstacles.push(obs);
        }

        // Portería al final
        this.createGoal(trackLen);

        this.ball.position.set(0, 0.5, 0);
        this.dir.set(1, 0, -1).normalize();
        this.updateUI();
    }

    createWorld(len) {
        this.stands = new THREE.Group();
        const wallGeo = new THREE.BoxGeometry(2, 5, len + 20);
        const wallMat = new THREE.MeshStandardMaterial({color: 0xcccccc});
        
        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.position.set(-6, 2, -len/2);
        this.stands.add(leftWall);

        const rightWall = leftWall.clone();
        rightWall.position.x = 6;
        this.stands.add(rightWall);

        // "Gente" en las gradas (cubos pequeños)
        for(let z=0; z>-len; z-=3) {
            const person = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), new THREE.MeshStandardMaterial({color: Math.random() > 0.5 ? 0x333333 : 0xffcc00}));
            person.position.set(-5.5, 4.5, z);
            this.stands.add(person);
        }
        this.scene.add(this.stands);
    }

    createGoal(len) {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.5), new THREE.MeshStandardMaterial({color: 0xffffff, wireframe: true}));
        frame.position.set(0, 1.25, -len);
        this.scene.add(frame);
        this.goalPos = -len;
    }

    tap() {
        if (!this.moving) {
            this.moving = true;
            document.getElementById("startScreen").style.display = "none";
            return;
        }
        // Cambio de dirección en zigzag
        this.dir.x *= -1;
    }

    update(dt) {
        if (!this.moving) return;

        this.ball.position.addScaledVector(this.dir, 12 * dt);
        this.ball.rotation.x -= 15 * dt;

        // Si llega cerca del final, entra en zona "SHOOT"
        if (this.ball.position.z < this.goalPos + 10) {
            this.dir.set(0, 0, -1.5).normalize(); // Va recto a portería
        }

        // Colisión
        this.obstacles.forEach(o => {
            if (this.ball.position.distanceTo(o.position) < 1.8) this.fail();
        });

        if (this.ball.position.z <= this.goalPos) this.win();
        if (Math.abs(this.ball.position.x) > 4.8) this.fail();
    }

    fail() {
        this.lives--;
        this.moving = false;
        if(this.lives <= 0) { this.lives = 3; this.level = 0; }
        document.getElementById("startScreen").style.display = "flex";
        this.startLevel();
    }

    win() {
        this.coins += 100;
        this.level++;
        this.moving = false;
        document.getElementById("startScreen").style.display = "flex";
        this.startLevel();
    }

    updateUI() {
        document.getElementById("lives-txt").innerText = this.lives;
    }
}
