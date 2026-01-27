import pygame
from player import Player
from world import World
from ui import draw_ui

# Inicialización
pygame.init()

# Configuración de pantalla
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Crónicas del Multiverso")

# Reloj y FPS
clock = pygame.time.Clock()
FPS = 60

# Instancias de mundo y jugador
world = World()
player = Player(100, 100)

# Bucle principal del juego
running = True
while running:
    screen.fill((0, 0, 0))  # Fondo negro

    # Gestión de eventos
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # Lógica de actualización
    keys = pygame.key.get_pressed()
    player.update(keys, world)

    # Renderizado
    world.draw(screen)
    player.draw(screen)
    draw_ui(screen, player)

    # Actualizar pantalla
    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()
