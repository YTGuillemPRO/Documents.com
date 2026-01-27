import pygame
import asyncio
from player import Player
from world import World
from ui import draw_ui

async def main():
    pygame.init()
    screen = pygame.display.set_mode((800, 600))
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

        screen.fill((50, 50, 50)) # Un gris oscuro para saber que CARGÓ
        world.draw(screen)
        player.draw(screen)
        draw_ui(screen, player)

        pygame.display.flip()
        
        # ESTO ES LO QUE HACE QUE FUNCIONE EN LA WEB
        await asyncio.sleep(0) 
        clock.tick(60)

    pygame.quit()

if __name__ == "__main__":
    asyncio.run(main())
