from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import error_negocio, require_roles
from app.core.limiter import limiter
from app.models.admin_user import RolAdmin
from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponOut, CouponUpdate, CouponValidateRequest
from app.services import audit_service, coupons_service

router = APIRouter(prefix="/api/coupons", tags=["coupons"])


@router.post("/validate")
@limiter.limit("10/minute")
async def validar(request: Request, body: CouponValidateRequest, db: AsyncSession = Depends(get_db)):
    """Endpoint público del checkout: valida el cupón y devuelve el descuento."""
    cupon, descuento = await coupons_service.validar_cupon(db, body.code, float(body.subtotal))
    return {
        "ok": True,
        "data": {
            "code": cupon.code,
            "type": cupon.type.value,
            "value": float(cupon.value),
            "discount": descuento,
        },
    }


@router.get("")
async def listar(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    result = await db.execute(select(Coupon).order_by(Coupon.created_at.desc()))
    cupones = result.scalars().all()
    return {"ok": True, "data": [CouponOut.model_validate(c) for c in cupones]}


@router.post("")
async def crear(
    body: CouponCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    existente = await db.execute(select(Coupon).where(Coupon.code == body.code))
    if existente.scalar_one_or_none() is not None:
        raise error_negocio(f"Ya existe un cupón con el código '{body.code}'")

    cupon = Coupon(**body.model_dump())
    db.add(cupon)
    await db.commit()
    await db.refresh(cupon)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="crear", module="cupones", entity_id=cupon.id, details=cupon.code
    )
    return {"ok": True, "data": CouponOut.model_validate(cupon)}


@router.put("/{coupon_id}")
async def actualizar(
    coupon_id: int,
    body: CouponUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    cupon = await db.get(Coupon, coupon_id)
    if cupon is None:
        raise error_negocio("Cupón no encontrado", status_code=404)

    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(cupon, campo, valor)

    await db.commit()
    await db.refresh(cupon)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="actualizar", module="cupones", entity_id=coupon_id, details=cupon.code
    )
    return {"ok": True, "data": CouponOut.model_validate(cupon)}
