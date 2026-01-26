// ... (mismo código de luces y escena)

window.addEventListener("mousedown", (e) => game.tap(e));
window.addEventListener("touchstart", (e) => game.tap(e));

// Asegúrate de que en animate() la cámara se actualice siempre:
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1); // Cap para evitar saltos
  game.update(dt);
  game.updateCamera();
  renderer.render(scene, camera);
}
