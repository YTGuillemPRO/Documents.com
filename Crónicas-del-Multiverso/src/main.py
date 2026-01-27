import pygame
import asyncio  # Requerido para web
from player import Player
from world import World
from ui import draw_ui

async def main():
    pygame.init()
    
    # Configuración de pantalla
    WIDTH, HEIGHT = 800, 600
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Crónicas del Multiverso")
    
    clock = pygame.time.Clock()
    FPS = 60
    
    # Instancias
    world = World()
    player = Player(100, 100)
    
    running = True
    while running:
        # Fondo
        screen.fill((0, 0, 0))
        
        # Eventos
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
        
        # Lógica
        keys = pygame.key.get_pressed()
        player.update(keys, world)
        
        # Dibujo
        world.draw(screen)
        player.draw(screen)
        draw_ui(screen, player)
        
        # Actualización física
        pygame.display.flip()
        clock.tick(FPS)
        
        # --- ESTA LÍNEA ES EL MOTOR PARA LA WEB ---
        await asyncio.sleep(0) 

    pygame.quit()

# Ejecución asíncrona
if __name__ == "__main__":
    asyncio.run(main())
