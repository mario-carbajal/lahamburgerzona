from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import error_negocio, require_roles
from app.core.security import hash_password
from app.models.admin_user import AdminUser, RolAdmin
from app.schemas.admin_user import AdminUserCreate, AdminUserUpdate, ResetPasswordRequest
from app.schemas.auth import UsuarioOut
from app.services import audit_service

router = APIRouter(prefix="/api/admin-users", tags=["admin-users"])


@router.get("")
async def listar(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    result = await db.execute(select(AdminUser).order_by(AdminUser.username))
    users = result.scalars().all()
    return {"ok": True, "data": [UsuarioOut.model_validate(u) for u in users]}


@router.post("")
async def crear(
    body: AdminUserCreate,
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    existing = await db.execute(
        select(AdminUser).where(
            (AdminUser.username == body.username) | (AdminUser.email == body.email)
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise error_negocio("Ya existe un usuario con ese username o email")

    user = AdminUser(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        full_name=body.full_name,
        phone=body.phone,
        is_active=True,
        created_by=current_admin.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await audit_service.registrar(
        db, admin_user_id=current_admin.id, action="crear", module="usuarios", entity_id=user.id, details=user.username
    )
    return {"ok": True, "data": UsuarioOut.model_validate(user)}


@router.put("/{user_id}")
async def actualizar(
    user_id: int,
    body: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    user = await db.get(AdminUser, user_id)
    if user is None:
        raise error_negocio("Usuario no encontrado", status_code=404)

    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(user, campo, valor)

    await db.commit()
    await db.refresh(user)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="actualizar", module="usuarios", entity_id=user_id, details=user.username
    )
    return {"ok": True, "data": UsuarioOut.model_validate(user)}


@router.delete("/{user_id}")
async def desactivar(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    if user_id == current_admin.id:
        raise error_negocio("No puedes desactivar tu propia cuenta")

    user = await db.get(AdminUser, user_id)
    if user is None:
        raise error_negocio("Usuario no encontrado", status_code=404)

    user.is_active = False
    await db.commit()
    await audit_service.registrar(
        db, admin_user_id=current_admin.id, action="desactivar", module="usuarios", entity_id=user_id, details=user.username
    )
    return {"ok": True, "data": {"mensaje": "Usuario desactivado"}}


@router.post("/{user_id}/reset-password")
async def resetear_password(
    user_id: int,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    user = await db.get(AdminUser, user_id)
    if user is None:
        raise error_negocio("Usuario no encontrado", status_code=404)

    user.password_hash = hash_password(body.new_password)
    await db.commit()
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="reset_password", module="usuarios", entity_id=user_id, details=user.username
    )
    return {"ok": True, "data": {"mensaje": "Contraseña actualizada"}}
