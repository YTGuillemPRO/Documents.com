const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const SCALE = 3;

let keys = {};
let gameOver = false;

// Player
const player = {
  x: 50,
  y: 250,
  w: 16,
  h: 16,
  vx: 0,
  vy: 0,
  onGround: false,
  attacking: false,
  dir: 1
};

// Enemy
let enemies = [
  { x: 300, y: 250, w: 16, h: 16, dir: -1 }
];

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function update() {
  if (gameOver) return;

  // Movement
  player.vx = 0;
  if (keys["ArrowLeft"]) {
    player.vx = -2;
    player.dir = -1;
  }
  if (keys["ArrowRight"]) {
    player.vx = 2;
    player.dir = 1;
  }

  if (keys["ArrowUp"] && player.onGround) {
    player.vy = -6;
    player.onGround = false;
  }

  if (keys["x"] || keys["X"]) {
    player.attacking = true;
  } else {
    player.attacking = false;
  }

  // Gravity
  player.vy += 0.3;

  player.x += player.vx;
  player.y += player.vy;

  // Ground
  if (player.y >= 250) {
    player.y = 250;
    player.vy = 0;
    player.onGround = true;
  }

  // Enemy AI
  enemies.forEach(e => {
    e.x += e.dir;
    if (Math.abs(e.x - player.x) < 100) {
      e.dir = player.x < e.x ? -1 : 1;
    }
  });

  // Combat
  enemies.forEach(e => {
    if (rectsCollide(player, e)) {
      if (player.attacking) {
        e.dead = true;
      } else {
        gameOver = true;
        alert("💀 HAS MUERTO");
        location.reload();
      }
    }
  });

  enemies = enemies.filter(e => !e.dead);

  draw();
  requestAnimationFrame(update);
}

function rectsCollide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = "#4af";
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // Sword
  if (player.attacking) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(
      player.x + (player.dir === 1 ? player.w : -8),
      player.y + 4,
      8,
      4
    );
  }

  // Enemies
  ctx.fillStyle = "#f44";
  enemies.forEach(e => {
    ctx.fillRect(e.x, e.y, e.w, e.h);
  });
}

update();
