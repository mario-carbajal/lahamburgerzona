"""Validación y aplicación de cupones de descuento."""
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import error_negocio
from app.models.coupon import Coupon, TipoCupon


async def validar_cupon(db: AsyncSession, code: str, subtotal: float) -> tuple[Coupon, float]:
    """Valida un cupón contra el subtotal y devuelve (cupón, descuento en pesos).

    Lanza error de negocio con mensaje claro si el cupón no aplica.
    """
    codigo = code.strip().upper()
    result = await db.execute(select(Coupon).where(Coupon.code == codigo))
    cupon = result.scalar_one_or_none()

    if cupon is None or not cupon.is_active:
        raise error_negocio("El cupón no existe o ya no está disponible")

    ahora = datetime.now(timezone.utc)
    if cupon.valid_from is not None and ahora < cupon.valid_from:
        raise error_negocio("Este cupón aún no está vigente")
    if cupon.valid_until is not None and ahora > cupon.valid_until:
        raise error_negocio("Este cupón ya venció")
    if cupon.max_uses is not None and cupon.times_used >= cupon.max_uses:
        raise error_negocio("Este cupón ya alcanzó su límite de usos")
    if subtotal < float(cupon.min_subtotal):
        raise error_negocio(
            f"Este cupón aplica en compras desde ${float(cupon.min_subtotal):.2f}"
        )

    if cupon.type == TipoCupon.PERCENT:
        descuento = round(subtotal * float(cupon.value) / 100, 2)
    else:
        descuento = min(float(cupon.value), subtotal)

    return cupon, float(Decimal(str(descuento)).quantize(Decimal("0.01")))


async def recalcular_descuento(db: AsyncSession, code: str, subtotal: float) -> float:
    """Recalcula el descuento de un cupón YA aplicado a un pedido que se edita.

    No valida vigencia ni usos (el cupón ya se usó legítimamente al crear el
    pedido); solo ajusta el monto al nuevo subtotal. Si el cupón ya no existe,
    el descuento se pierde (0).
    """
    result = await db.execute(select(Coupon).where(Coupon.code == code.strip().upper()))
    cupon = result.scalar_one_or_none()
    if cupon is None:
        return 0.0
    if cupon.type == TipoCupon.PERCENT:
        return round(subtotal * float(cupon.value) / 100, 2)
    return round(min(float(cupon.value), subtotal), 2)
