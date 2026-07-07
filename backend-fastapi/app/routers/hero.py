from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import error_negocio, require_roles
from app.core.limiter import limiter
from app.models.admin_user import RolAdmin
from app.models.hero_image import HeroImage
from app.schemas.hero import HeroImageCreate, HeroImageOut, HeroImageUpdate
from app.services import audit_service

router = APIRouter(prefix="/api/hero", tags=["hero"])


@router.get("")
@limiter.limit("60/minute")
async def listar(request: Request, activo: bool | None = None, db: AsyncSession = Depends(get_db)):
    query = select(HeroImage)
    if activo is not None:
        query = query.where(HeroImage.is_active == activo)
    query = query.order_by(HeroImage.sort_order, HeroImage.id)

    result = await db.execute(query)
    imagenes = result.scalars().all()
    return {"ok": True, "data": [HeroImageOut.model_validate(i) for i in imagenes]}


@router.post("")
async def crear(
    body: HeroImageCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    imagen = HeroImage(**body.model_dump())
    db.add(imagen)
    await db.commit()
    await db.refresh(imagen)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="crear", module="hero", entity_id=imagen.id, details=imagen.title
    )
    return {"ok": True, "data": HeroImageOut.model_validate(imagen)}


@router.put("/{hero_id}")
async def actualizar(
    hero_id: int,
    body: HeroImageUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    imagen = await db.get(HeroImage, hero_id)
    if imagen is None:
        raise error_negocio("Imagen de portada no encontrada", status_code=404)

    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(imagen, campo, valor)

    await db.commit()
    await db.refresh(imagen)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="actualizar", module="hero", entity_id=hero_id, details=imagen.title
    )
    return {"ok": True, "data": HeroImageOut.model_validate(imagen)}


@router.delete("/{hero_id}")
async def eliminar(
    hero_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    imagen = await db.get(HeroImage, hero_id)
    if imagen is None:
        raise error_negocio("Imagen de portada no encontrada", status_code=404)

    await db.delete(imagen)
    await db.commit()
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="eliminar", module="hero", entity_id=hero_id, details=imagen.title
    )
    return {"ok": True, "data": {"mensaje": "Imagen eliminada"}}
