from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import CUSTOMER_ROLE, decode_access_token
from app.models.admin_user import AdminUser, RolAdmin
from app.models.customer import Customer

bearer_scheme = HTTPBearer()


def error_negocio(mensaje: str, status_code: int = 422) -> HTTPException:
    return HTTPException(status_code=status_code, detail=mensaje)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> AdminUser:
    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    # Los tokens de cliente (sitio público) jamás valen para el admin, aunque
    # su id numérico coincida con el de un usuario administrativo
    if payload.get("role") not in {r.value for r in RolAdmin}:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido para esta área")

    user = await db.get(AdminUser, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado o inactivo")
    return user


async def get_current_customer(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Customer:
    """Sesión del cliente del sitio público (cuenta de cliente)."""
    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida o expirada")

    if payload.get("role") != CUSTOMER_ROLE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")

    customer = await db.get(Customer, int(payload["sub"]))
    if customer is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cuenta no encontrada")
    return customer


def require_roles(*roles: RolAdmin):
    async def dependency(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a este recurso",
            )
        return current_user

    return dependency
