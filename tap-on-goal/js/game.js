class Game {
    constructor(scene, ball, camera) {
        this.scene = scene; this.ball = ball; this.camera = camera;
        this.level = 0; this.coins = 0; this.lives = 3;
        this.moving = false; this.isShooting = false;
        this.dir = new THREE.Vector3(1, 0, -1).normalize();
        this.obstacles = [];
    }

    startLevel(n) {
        // Limpiar
        while(this.scene.children.length > 3) this.scene.remove(this.scene.children[this.scene.children.length-1]);
        this.obstacles = [];
        this.isShooting = false;
        this.moving = false;

        const lvl = levels[n] || levels[0];
        const len = lvl.length * 5;

        // Suelo Rosa con cuadros y líneas
        const groundGeo = new THREE.PlaneGeometry(10, len + 20);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xffa0cb });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.z = -len / 2;
        this.scene.add(ground);

        // Gradas y Gente (Bloques negros y amarillos como en la imagen)
        this.createStands(len);

        // Línea de Tiro "SHOOT!"
        this.createShootZone(len);

        // Obstáculos Amarillos
        for(let i=0; i<lvl.obstacles; i++) {
            const obs = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.5), new THREE.MeshStandardMaterial({color: 0xffd700}));
            obs.position.set((Math.random()-0.5)*7, 0.5, -(Math.random()*(len-15)+10));
            this.scene.add(obs);
            this.obstacles.push(obs);
        }

        // Portería
        this.createGoal(len);

        this.ball.position.set(0, 0.5, 0);
        this.updateUI();
    }

    createStands(len) {
        const standGeo = new THREE.BoxGeometry(2, 4, len + 20);
        const standMat = new THREE.MeshStandardMaterial({color: 0xcccccc});
        
        const left = new THREE.Mesh(standGeo, standMat);
        left.position.set(-6, 1, -len/2);
        this.scene.add(left);

        const right = left.clone();
        right.position.x = 6;
        this.scene.add(right);

        // Gente simplificada (puntos negros y amarillos)
        for(let z=0; z>-len; z-=4) {
            const person = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), new THREE.MeshStandardMaterial({color: Math.random() > 0.5 ? 0x000000 : 0xffcc00}));
            person.position.set(-5.5, 3.2, z);
            this.scene.add(person);
        }
    }

    createShootZone(len) {
        const loader = new THREE.TextureLoader();
        // Aquí podrías cargar una imagen que diga SHOOT!
        const zone = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshStandardMaterial({color: 0xff69b4, transparent: true, opacity: 0.5}));
        zone.rotation.x = -Math.PI/2;
        zone.position.set(0, 0.02, -len + 5);
        this.scene.add(zone);
    }

    createGoal(len) {
        this.goal = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.2), new THREE.MeshStandardMaterial({color: 0xffffff, wireframe: true}));
        this.goal.add(frame);
        this.goal.position.set(0, 1.5, -len);
        this.scene.add(this.goal);
    }

    tap() {
        if (!this.moving) {
            this.moving = true;
            document.getElementById("startScreen").classList.add("hidden");
            return;
        }

        if (this.ball.position.z < - (levels[this.level].length * 5 - 8)) {
            // Modo Disparo: va directo a portería
            this.isShooting = true;
            this.dir.set(0, 0.2, -1).normalize();
        } else {
            // ZigZag diagonal
            this.dir.x *= -1;
        }
    }

    update(dt) {
        if (!this.moving) return;
        
        const speed = this.isShooting ? 25 : 10;
        this.ball.position.addScaledVector(this.dir, speed * dt);
        this.ball.rotation.x -= 10 * dt;

        // Colisión con obstáculos
        this.obstacles.forEach(o => {
            if (this.ball.position.distanceTo(o.position) < 1.5) this.fail();
        });

        // Gol
        if (this.ball.position.z <= this.goal.position.z) {
            this.win();
        }

        // Salirse del camino
        if (Math.abs(this.ball.position.x) > 5) this.fail();
    }

    fail() {
        this.lives--;
        if (this.lives <= 0) { this.level = 0; this.lives = 3; }
        this.startLevel(this.level);
        document.getElementById("startScreen").classList.remove("hidden");
    }

    win() {
        this.coins += 50;
        this.level++;
        this.startLevel(this.level);
        document.getElementById("startScreen").classList.remove("hidden");
    }

    buySkin(col, price) {
        if(this.coins >= price) {
            this.coins -= price;
            this.ball.material.color.setHex(col);
            this.updateUI();
        }
    }

    updateUI() {
        document.getElementById("lives-txt").innerText = this.lives;
        document.getElementById("info").innerText = `NIVEL ${this.level + 1} | 💰 ${this.coins}`;
    }
}
