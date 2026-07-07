from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.admin_user import RolAdmin
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/api/audit-log", tags=["audit-log"])


@router.get("")
async def listar(
    module: str | None = None,
    admin_user_id: int | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    query = select(AuditLog).options(selectinload(AuditLog.admin_user))
    if module:
        query = query.where(AuditLog.module == module)
    if admin_user_id:
        query = query.where(AuditLog.admin_user_id == admin_user_id)
    query = query.order_by(AuditLog.created_at.desc())

    count_result = await db.execute(select(func.count()).select_from(query.order_by(None).subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    logs = result.scalars().all()

    data = [
        {
            "id": log.id,
            "admin_user_id": log.admin_user_id,
            "admin_user_name": log.admin_user.full_name if log.admin_user else "Usuario eliminado",
            "action": log.action,
            "module": log.module,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in logs
    ]

    return {"ok": True, "data": data, "total": total, "page": page, "page_size": page_size}


@router.get("/modules")
async def listar_modulos(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    result = await db.execute(select(AuditLog.module).distinct().order_by(AuditLog.module))
    modules = [row[0] for row in result.all()]
    return {"ok": True, "data": modules}
