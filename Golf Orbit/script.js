const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let cameraX = 0;
let distance = 0;

// POWER BAR
let power = 0;
let powerDir = 1;
let powerActive = true;

const ball = {
    x: 80,
    y: 330,
    r: 8,
    vx: 0,
    vy: 0,
    moving: false
};

const gravity = 0.35;
const ground = 340;

// CLICK = DISPARO
canvas.addEventListener("click", () => {
    if (!ball.moving && powerActive) {
        ball.vx = power * 0.9;
        ball.vy = -power * 0.75;
        ball.moving = true;
        powerActive = false;
    }
});

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // BARRA DE POTENCIA AUTOMÁTICA
    if (powerActive) {
        power += powerDir * 0.6;
        if (power > 40 || power < 5) powerDir *= -1;
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

        // STOP
        if (Math.abs(ball.vx) < 0.2 && Math.abs(ball.vy) < 0.2) {
            ball.moving = false;
            powerActive = true;
            power = 0;
        }

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
    ctx.fillRect(-cameraX, ground + 8, 6000, 100);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x - cameraX, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
}

function drawPowerBar() {
    ctx.fillStyle = "black";
    ctx.fillRect(20, 20, 200, 18);

    ctx.fillStyle = "orange";
    ctx.fillRect(20, 20, power * 5, 18);
}

update();
