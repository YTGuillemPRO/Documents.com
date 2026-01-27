const levels = [];
for (let i = 0; i < 50; i++) {
  levels.push({
    length: 15 + i * 2,
    obstacles: 6 + i * 2,
    speed: 6 + i * 0.15,
    reward: 50 + i * 10,
    goalkeeperSpeed: 2 + i * 0.05
  });
}
