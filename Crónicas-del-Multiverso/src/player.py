import pygame

class Player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 32
        self.height = 32
        self.speed = 4
        
        # Intentamos cargar la imagen; si falla, usamos un cuadrado verde
        try:
            self.image = pygame.image.load("assets/sprites/jugador.png").convert_alpha()
            self.image = pygame.transform.scale(self.image, (self.width, self.height))
        except:
            self.image = None 
            self.color = (0, 255, 0)

    def update(self, keys, world):
        if keys[pygame.K_w]: self.y -= self.speed
        if keys[pygame.K_s]: self.y += self.speed
        if keys[pygame.K_a]: self.x -= self.speed
        if keys[pygame.K_d]: self.x += self.speed
        
        # Colisiones con el tamaño del mundo
        self.x = max(0, min(world.width - self.width, self.x))
        self.y = max(0, min(world.height - self.height, self.y))

    def draw(self, screen):
        if self.image:
            screen.blit(self.image, (self.x, self.y))
        else:
            pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height))
