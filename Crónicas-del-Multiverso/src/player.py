import pygame

class Player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 32
        self.height = 32
        self.color = (0, 255, 0)
        self.speed = 4

    def update(self, keys, world):
        if keys[pygame.K_w]:
            self.y -= self.speed
        if keys[pygame.K_s]:
            self.y += self.speed
        if keys[pygame.K_a]:
            self.x -= self.speed
        if keys[pygame.K_d]:
            self.x += self.speed

        # Colisiones simples con el mundo
        self.x = max(0, min(world.width - self.width, self.x))
        self.y = max(0, min(world.height - self.height, self.y))

    def draw(self, screen):
        pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height))
