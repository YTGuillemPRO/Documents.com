class Game {
    constructor(scene, ball, camera) {
        this.scene = scene; this.ball = ball; this.camera = camera;
        this.level = 0; this.coins = 0; this.lives = 3;
        this.moving = false; this.isShooting = false;
        this.speed = 0.2;
        this.dir = new THREE.Vector3(1, 0, -1).normalize();
        this.obstacles = [];
    }

    startLevel() {
        // Limpiar
        this.obstacles.forEach(o => this.scene.remove(o));
        if(this.ground) this.scene.remove(this.ground);
        if(this.stands) this.scene.remove(this.stands);
        
        this.obstacles = [];
        this.moving = false;
        this.isShooting = false;

        const trackLen = 100;

        // Suelo de cuadros ( Rosa / Rosa claro )
        const groundGeo = new THREE.PlaneGeometry(10, trackLen + 20);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xffa0cb });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.z = -trackLen / 2;
        this.scene.add(this.ground);

        // Gradas y Mundo
        this.createStands(trackLen);

        // Obstáculos Amarillos (como en tu foto)
        for(let i=0; i<12; i++) {
            const obs = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 3), new THREE.MeshStandardMaterial({color: 0xffd700}));
            obs.position.set(i % 2 === 0 ? -3 : 3, 0.6, -i * 8 - 15);
            this.scene.add(obs);
            this.obstacles.push(obs);
        }

        // Zona SHOOT! y Portería
        this.createGoal(trackLen);

        this.ball.position.set(0, 0.5, 0);
        this.dir.set(1, 0, -1).normalize(); // Empieza hacia la derecha
        this.updateUI();
    }

    createStands(len) {
        this.stands = new THREE.Group();
        const wallMat = new THREE.MeshStandardMaterial({color: 0xcccccc});
        
        const left = new THREE.Mesh(new THREE.BoxGeometry(2, 6, len+20), wallMat);
        left.position.set(-6, 2, -len/2);
        this.stands.add(left);

        const right = left.clone();
        right.position.x = 6;
        this.stands.add(right);

        // Público (puntos amarillos y negros)
        for(let z=0; z>-len; z-=4) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), new THREE.MeshStandardMaterial({color: 0xffd700}));
            p.position.set(-5.5, 5, z);
            this.stands.add(p);
        }
        this.scene.add(this.stands);
    }

    createGoal(len) {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.5), new THREE.MeshStandardMaterial({color: 0xffffff, wireframe: true}));
        frame.position.set(0, 1.5, -len);
        this.scene.add(frame);
        this.goalPos = -len;
    }

    tap() {
        if (!this.moving) {
            this.moving = true;
            document.getElementById("startScreen").classList.add("hidden");
            return;
        }

        // CAMBIAR DIRECCIÓN (ZIG ZAG)
        if (!this.isShooting) {
            this.dir.x *= -1; // Esto hace que cambie de izquierda a derecha
        }
    }

    update(dt) {
        if (!this.moving) return;

        // Movimiento
        const currentSpeed = this.isShooting ? 30 : 12;
        this.ball.position.addScaledVector(this.dir, currentSpeed * dt);
        this.ball.rotation.x -= 15 * dt;

        // Entrar en zona de disparo
        if (this.ball.position.z < this.goalPos + 8 && !this.isShooting) {
            this.isShooting = true;
            this.dir.set(0, 0.1, -1).normalize(); // Disparo directo
        }

        // Colisiones con obstáculos amarillos
        this.obstacles.forEach(o => {
            const dist = this.ball.position.distanceTo(o.position);
            if (dist < 2) this.fail();
        });

        // Gol o Caída
        if (this.ball.position.z <= this.goalPos) this.win();
        if (Math.abs(this.ball.position.x) > 5) this.fail();
    }

    fail() {
        this.lives--;
        this.moving = false;
        if(this.lives <= 0) { this.lives = 3; this.level = 0; }
        document.getElementById("startScreen").classList.remove("hidden");
        this.startLevel();
    }

    win() {
        this.coins += 50;
        this.level++;
        this.moving = false;
        document.getElementById("startScreen").classList.remove("hidden");
        this.startLevel();
    }

    updateUI() {
        document.getElementById("lives-txt").innerText = this.lives;
    }

    buySkin(color, price) {
        if(this.coins >= price) {
            this.coins -= price;
            this.ball.material.color.setHex(color);
            document.getElementById('shopMenu').classList.add('hidden');
        } else { alert("¡Faltan monedas!"); }
    }
}
