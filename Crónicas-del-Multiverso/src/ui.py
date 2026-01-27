import pygame

def draw_ui(screen, player):
    font = pygame.font.SysFont(None, 24)
    text = font.render(f"Posición: ({player.x}, {player.y})", True, (255, 255, 255))
    screen.blit(text, (10, 10))
