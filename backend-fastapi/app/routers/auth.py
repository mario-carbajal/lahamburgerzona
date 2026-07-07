from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import error_negocio, get_current_user
from app.core.limiter import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.models.admin_user import AdminUser
from app.schemas.auth import CambiarPasswordRequest, LoginRequest, LoginResponse, UsuarioOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AdminUser).where(
            (AdminUser.username == body.identificador) | (AdminUser.email == body.identificador)
        )
    )
    user = result.scalar_one_or_none()

    if user is None or not user.is_active or not verify_password(body.password, user.password_hash):
        raise error_negocio("Credenciales inválidas", status_code=401)

    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.role.value)
    return {"ok": True, "data": LoginResponse(token=token, usuario=UsuarioOut.model_validate(user))}


@router.get("/me")
async def me(current_user: AdminUser = Depends(get_current_user)):
    return {"ok": True, "data": UsuarioOut.model_validate(current_user)}


@router.put("/cambiar-password")
async def cambiar_password(
    body: CambiarPasswordRequest,
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.password_actual, current_user.password_hash):
        raise error_negocio("La contraseña actual es incorrecta")

    current_user.password_hash = hash_password(body.password_nueva)
    await db.commit()
    return {"ok": True, "data": {"mensaje": "Contraseña actualizada correctamente"}}
