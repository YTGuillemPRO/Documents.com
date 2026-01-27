import pygame
import asyncio
import sys

# --- CLASE WORLD (Fusionada) ---
class World:
    def __init__(self):
        self.width = 1600
        self.height = 1200
        self.color = (50, 50, 100) # Fondo azul oscuro

    def draw(self, screen):
        screen.fill(self.color)
        # Dibujamos una rejilla simple para ver el movimiento
        for i in range(0, 800, 100):
            pygame.draw.line(screen, (70, 70, 120), (i, 0), (i, 600))
        for j in range(0, 600, 100):
            pygame.draw.line(screen, (70, 70, 120), (0, j), (800, j))

# --- CLASE PLAYER (Fusionada) ---
class Player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 32
        self.height = 32
        self.color = (0, 255, 0)
        self.speed = 4

    def update(self, keys, world):
        if keys[pygame.K_w]: self.y -= self.speed
        if keys[pygame.K_s]: self.y += self.speed
        if keys[pygame.K_a]: self.x -= self.speed
        if keys[pygame.K_d]: self.x += self.speed
        
        # Colisiones con los límites definidos en World
        self.x = max(0, min(800 - self.width, self.x))
        self.y = max(0, min(600 - self.height, self.y))

    def draw(self, screen):
        pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height))

# --- FUNCIÓN UI (Fusionada) ---
def draw_ui(screen, player):
    font = pygame.font.SysFont(None, 24)
    text = font.render(f"Posición: ({int(player.x)}, {int(player.y)})", True, (255, 255, 255))
    screen.blit(text, (10, 10))

# --- BUCLE PRINCIPAL ASÍNCRONO ---
async def main():
    pygame.init()
    
    WIDTH, HEIGHT = 800, 600
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Crónicas del Multiverso")
    
    clock = pygame.time.Clock()
    
    # Creamos las instancias aquí mismo
    world = World()
    player = Player(100, 100)
    
    running = True
    while running:
        # 1. Eventos
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # 2. Lógica
        keys = pygame.key.get_pressed()
        player.update(keys, world)

        # 3. Dibujo
        # Usamos un color de fondo base por si falla el World
        screen.fill((0, 0, 0)) 
        
        world.draw(screen)
        player.draw(screen)
        draw_ui(screen, player)

        # 4. Actualización de pantalla
        pygame.display.flip()
        
        # --- ESTO ES LO QUE HACE QUE CARGUE EN LA WEB ---
        await asyncio.sleep(0) 
        clock.tick(60)

    pygame.quit()

# Punto de entrada para Pygbag
if __name__ == "__main__":
    asyncio.run(main())
