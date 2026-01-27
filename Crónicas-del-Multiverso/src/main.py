import pygame
import asyncio  # 1. Importa esto
from player import Player
from world import World
from ui import draw_ui

async def main():  # 2. Mete todo el código dentro de esta función
    pygame.init()
    WIDTH, HEIGHT = 800, 600
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    clock = pygame.time.Clock()
    
    world = World()
    player = Player(100, 100)
    running = True

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        keys = pygame.key.get_pressed()
        player.update(keys, world)
        
        screen.fill((0, 0, 0))
        world.draw(screen)
        player.draw(screen)
        draw_ui(screen, player)
        
        pygame.display.flip()
        clock.tick(60)
        
        await asyncio.sleep(0)  # 3. MUY IMPORTANTE: Esto permite que el motor web funcione

    pygame.quit()

# 4. Llama a la función de esta manera
if __name__ == "__main__":
    asyncio.run(main())
