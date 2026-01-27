import asyncio # Añade esto arriba

async def main():
    # ... todo tu código de inicio ...
    
    while running:
        # ... tu código de eventos y dibujo ...
        
        pygame.display.flip()
        clock.tick(FPS)
        await asyncio.sleep(0) # <--- AÑADE ESTO para que no se bloquee en la web

asyncio.run(main())
