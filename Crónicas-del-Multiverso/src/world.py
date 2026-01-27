import pygame

class World:
    def __init__(self):
        self.width = 1600
        self.height = 1200
        self.color = (50, 50, 100)  # Fondo azul oscuro

    def draw(self, screen):
        screen.fill(self.color)
