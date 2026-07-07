from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import error_negocio, require_roles
from app.core.limiter import limiter
from app.models.admin_user import RolAdmin
from app.models.contact_message import ContactMessage
from app.schemas.contact import ContactMessageCreate, ContactMessageOut, ContactStatusUpdate

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("")
@limiter.limit("3/minute")
async def crear(request: Request, body: ContactMessageCreate, db: AsyncSession = Depends(get_db)):
    mensaje = ContactMessage(**body.model_dump(), status="unread")
    db.add(mensaje)
    await db.commit()
    await db.refresh(mensaje)
    return {"ok": True, "data": ContactMessageOut.model_validate(mensaje)}


@router.get("")
async def listar(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    query = select(ContactMessage)
    if status:
        query = query.where(ContactMessage.status == status)
    query = query.order_by(ContactMessage.created_at.desc())

    result = await db.execute(query)
    mensajes = result.scalars().all()
    return {"ok": True, "data": [ContactMessageOut.model_validate(m) for m in mensajes], "total": len(mensajes)}


@router.put("/{mensaje_id}")
async def actualizar_estado(
    mensaje_id: int,
    body: ContactStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    mensaje = await db.get(ContactMessage, mensaje_id)
    if mensaje is None:
        raise error_negocio("Mensaje no encontrado", status_code=404)

    mensaje.status = body.status
    await db.commit()
    await db.refresh(mensaje)
    return {"ok": True, "data": ContactMessageOut.model_validate(mensaje)}
