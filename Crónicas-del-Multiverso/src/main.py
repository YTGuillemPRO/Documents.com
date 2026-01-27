import pygame
import asyncio
import sys

# Intentamos importar tus módulos, si fallan, el juego seguirá
try:
    from player import Player
    from world import World
    from ui import draw_ui
except ImportError as e:
    print(f"Error importando módulos: {e}")

async def main():
    pygame.init()
    
    # Intenta usar una resolución estándar que Pygbag maneje bien
    WIDTH, HEIGHT = 800, 600
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Crónicas del Multiverso")
    
    clock = pygame.time.Clock()
    
    # Inicialización segura
    try:
        world = World()
        player = Player(100, 100)
    except Exception as e:
        print(f"Error en la inicialización: {e}")
        # Creamos objetos vacíos si fallan los tuyos para evitar el crash
        world = None
        player = None

    running = True
    while running:
        # Si ves la pantalla AZUL, es que el bucle funciona pero algo falla dentro
        # Si ves la pantalla NEGRA, es que el motor ni siquiera ha arrancado el bucle
        screen.fill((0, 0, 50)) 

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        if player and world:
            try:
                keys = pygame.key.get_pressed()
                player.update(keys, world)
                
                world.draw(screen)
                player.draw(screen)
                draw_ui(screen, player)
            except Exception as e:
                # Si hay un error aquí, pintamos de rojo para avisar
                screen.fill((100, 0, 0))
                print(f"Error en el loop: {e}")

        pygame.display.flip()
        await asyncio.sleep(0) # Imprescindible para que no se quede negro
        clock.tick(60)

    pygame.quit()

if __name__ == "__main__":
    asyncio.run(main())
