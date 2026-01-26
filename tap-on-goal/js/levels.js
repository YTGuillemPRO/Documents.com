const levels = [];

for (let i = 1; i <= 50; i++) {
  levels.push({
    levelNumber: i,
    length: 10 + (i * 2),      // Cada nivel es 2 unidades más largo
    obstacles: 10 + (i * 3),   // Cada nivel tiene 3 bloques amarillos más
    speed: 8 + (i * 0.2),      // La bola va un poco más rápido cada vez
    goalkeeperSpeed: 2 + (i * 0.1) // El portero se mueve más rápido
  });
}
