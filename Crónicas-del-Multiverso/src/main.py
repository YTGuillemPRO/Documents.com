import pygame
from player import Player
from world import World
from ui import UIHandler

def main():
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
    ui = UIHandler(screen)
    
    running = True
    while running:
        # 1. Gestión de Eventos
        events = pygame.event.get()
        for event in events:
            if event.type == pygame.QUIT:
                running = False
            
            # Pasar eventos a la UI (para detectar clics en botones)
            ui.handle_events(event, player)

        # 2. Lógica/Actualización
        keys = pygame.key.get_pressed()
        player.update(keys, world)
        
        # Lógica de Auto-click (basado en tiempo)
        player.apply_auto_click()

        # 3. Renderizado
        screen.fill((30, 30, 30)) # Fondo gris oscuro para mejor contraste
        
        world.draw(screen)
        player.draw(screen)
        ui.draw(player) # Dibuja el ScreenGui (Frame y botones)
        
        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()

if __name__ == "__main__":
    main()
