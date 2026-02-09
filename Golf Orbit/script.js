const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ground = 340;
const gravity = 0.35;

let cameraX = 0;
let distance = 0;

// BARRA AUTOMÁTICA
let power = 5;
let powerDir = 1;
let canShoot = true;

const ball = {
    x: 80,
    y: ground,
    r: 8,
    vx: 0,
    vy: 0,
    moving: false
};

// CLICK = DISPARO
canvas.addEventListener("click", () => {
    if (!ball.moving && canShoot) {
        ball.vx = power * 1.1;
        ball.vy = -power * 0.9;
        ball.moving = true;
        canShoot = false;
    }
});

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // BARRA DE PODER (SOLO CUANDO SE PUEDE DISPARAR)
    if (canShoot) {
        power += powerDir * 0.7;
        if (power >= 40 || power <= 5) powerDir *= -1;
    }

    // FÍSICA
    if (ball.moving) {
        ball.vy += gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;

        distance = Math.max(distance, Math.floor(ball.x / 10));

        // SUELO
        if (ball.y > ground) {
            ball.y = ground;
            ball.vy *= -0.5;
            ball.vx *= 0.85;
        }

        // DETENERSE
        if (Math.abs(ball.vx) < 0.2 && Math.abs(ball.vy) < 0.2) {
            ball.moving = false;
            ball.vx = 0;
            ball.vy = 0;
            canShoot = true;
            power = 5;
        }

        // CÁMARA
        cameraX = ball.x - 150;
    }

    drawWorld();
    drawBall();
    drawPowerBar();

    document.getElementById("dist").innerText =
        `Distancia: ${distance} m`;

    requestAnimationFrame(update);
}

function drawWorld() {
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(-cameraX, ground + 8, 8000, 100);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x - cameraX, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
}

function drawPowerBar() {
    if (!canShoot) return;

    ctx.fillStyle = "#000";
    ctx.fillRect(20, 20, 200, 16);

    ctx.fillStyle = "orange";
    ctx.fillRect(20, 20, power * 5, 16);
}

update();
