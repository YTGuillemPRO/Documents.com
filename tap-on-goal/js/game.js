class Game {
    constructor(scene, ball, camera, infoDiv) {
        this.scene = scene;
        this.ball = ball;
        this.camera = camera;
        this.infoDiv = infoDiv;

        this.levelIndex = 0;
        this.attempts = 3;
        this.isMoving = false;
        this.direction = new THREE.Vector3(1,0,0);
        this.platforms = [];
        this.obstacles = [];
        this.goal = null;
    }

    startLevel(levelIndex) {
        // Limpiar plataformas y obstáculos previos
        this.platforms.forEach(p => this.scene.remove(p));
        this.obstacles.forEach(o => this.scene.remove(o));
        if(this.goal) this.scene.remove(this.goal);

        this.platforms = [];
        this.obstacles = [];

        const lvl = levels[levelIndex];
        let posX = 0;
        let posZ = 0;
        let toggle = true;
        const platformSize = 2.5;
        const gap = 0.5;

        // Generar plataforma principal (camino)
        for(let i=0; i<lvl.length; i++){
            const geo = new THREE.BoxGeometry(platformSize,0.4,platformSize);
            const mat = new THREE.MeshStandardMaterial({color:0xffdb58});
            const p = new THREE.Mesh(geo,mat);
            p.position.set(posX,0,posZ);
            this.scene.add(p);
            this.platforms.push(p);

            if(toggle) posX += platformSize + gap;
            else posZ += platformSize + gap;
            toggle = !toggle;
        }

        // Generar obstáculos aleatorios
        for(let i=0; i<lvl.obstacles; i++){
            const obsGeo = new THREE.BoxGeometry(platformSize,0.4,platformSize);
            const obsMat = new THREE.MeshStandardMaterial({color:0xff0000});
            const obs = new THREE.Mesh(obsGeo,obsMat);
            const randIndex = Math.floor(Math.random()*this.platforms.length);
            const p = this.platforms[randIndex];
            obs.position.set(p.position.x,0.2,p.position.z);
            this.scene.add(obs);
            this.obstacles.push(obs);
        }

        // Portería al final
        const goalGeo = new THREE.BoxGeometry(platformSize*1.3,0.4,platformSize*1.3);
        const goalMat = new THREE.MeshStandardMaterial({color:0x27ae60});
        this.goal = new THREE.Mesh(goalGeo,goalMat);
        const lastPlatform = this.platforms[this.platforms.length-1];
        this.goal.position.set(lastPlatform.position.x,0.2,lastPlatform.position.z);
        this.scene.add(this.goal);

        // Reset bola
        this.ball.position.set(0,0.4,0);
        this.direction.set(1,0,0);
        this.isMoving = false;

        this.updateUI();
    }

    updateUI(){
        this.infoDiv.textContent = `Nivel: ${this.levelIndex+1} | Intentos: ${this.attempts}`;
    }

    changeDirection(){
        this.isMoving = true;
        if(this.direction.x === 1) this.direction.set(0,0,1);
        else this.direction.set(1,0,0);
    }

    update(delta){
        if(!this.isMoving) return;

        this.ball.position.addScaledVector(this.direction,5*delta);

        if(this.checkCollision(this.obstacles)){
            this.attempts--;
            if(this.attempts<=0){
                alert(`Has perdido en el nivel ${this.levelIndex+1}`);
                this.levelIndex = 0;
                this.attempts = 3;
            } else {
                alert('Has tocado un obstáculo, intenta otra vez.');
            }
            this.startLevel(this.levelIndex);
        } else if(this.checkCollision([this.goal])){
            alert('¡Gol! Pasas al siguiente nivel');
            this.levelIndex++;
            if(this.levelIndex >= levels.length){
                alert('¡Has completado todos los niveles!');
                this.levelIndex = 0;
            }
            this.attempts = 3;
            this.startLevel(this.levelIndex);
        }
    }

    checkCollision(objects){
        const ballBox = new THREE.Box3().setFromObject(this.ball);
        for(const o of objects){
            const box = new THREE.Box3().setFromObject(o);
            if(ballBox.intersectsBox(box)){
                return true;
            }
        }
        return false;
    }

    updateCamera(){
        const offset = new THREE.Vector3(4,5,4);
        this.camera.position.copy(this.ball.position).add(offset);
        this.camera.lookAt(this.ball.position);
    }
}

