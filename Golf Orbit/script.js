const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let ball = {
    x: 50,
    y: 350,
    radius: 8,
    vx: 0,
    vy: 0,
    flying: false
};

let gravity = 0.4;
let distance = 0;

canvas.addEventListener("click", () => {
    if (!ball.flying) {
        ball.vx = Math.random() * 10 + 10; // fuerza horizontal
        ball.vy = - (Math.random() * 10 + 15); // fuerza vertical
        ball.flying = true;
    }
});

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (ball.flying) {
        ball.vy += gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;
        distance += Math.abs(ball.vx);

        // rebote en el suelo
        if (ball.y + ball.radius > canvas.height) {
            ball.y = canvas.height - ball.radius;
            ball.vy *= -0.5;
            ball.vx *= 0.7;
        }

        // detenerse
        if (Math.abs(ball.vx) < 0.5 && Math.abs(ball.vy) < 0.5) {
            ball.flying = false;
        }
    }

    // dibujar pelota
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();

    document.getElementById("distance").innerText =
        `Distancia: ${Math.floor(distance)} m`;

    requestAnimationFrame(update);
}

update();
