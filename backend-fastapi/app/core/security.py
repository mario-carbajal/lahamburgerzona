from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


# Rol reservado para tokens de clientes del sitio público (cuenta de cliente).
# NUNCA debe aceptarse en endpoints de admin — ver get_current_user en deps.py.
CUSTOMER_ROLE = "CUSTOMER"


def create_customer_token(customer_id: int) -> str:
    """Token de sesión del cliente: 30 días, para consultar sus pedidos/puntos."""
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    payload = {"sub": str(customer_id), "role": CUSTOMER_ROLE, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise ValueError("Token inválido o expirado")
