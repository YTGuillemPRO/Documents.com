const levels = [];
for (let i = 0; i < 50; i++) {
    levels.push({
        length: 15 + (i * 2),      // Más largo cada vez
        obstacles: 10 + (i * 2),   // Más bloques amarillos
        speed: 7 + (i * 0.1),      // Un poco más rápido
        reward: 50 + (i * 10)      // Más monedas por nivel
    });
}
