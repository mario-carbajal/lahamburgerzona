from slowapi import Limiter
from slowapi.util import get_remote_address

# Límites por IP en memoria. Suficiente para un solo contenedor (no hay Redis);
# si se escala a múltiples instancias, cambiar a un backend compartido.
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
