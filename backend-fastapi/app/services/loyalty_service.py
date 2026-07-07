"""Programa de lealtad: puntos por compra entregada, canjeables como descuento.

Reglas:
- Se acumula solo con email en el pedido (el cliente se identifica por email).
- Los puntos se OTORGAN cuando el pedido llega a 'delivered' (una sola vez,
  bandera Order.points_awarded) según `loyalty_pesos_por_punto` (default: 1 punto
  por cada $10 del total pagado).
- Se CANJEAN en el checkout: cada punto vale `loyalty_valor_punto` pesos
  (default $1). El canje descuenta después del cupón y nunca deja el subtotal
  en negativo.
- Si un pedido con puntos canjeados se cancela, los puntos regresan al cliente.

Ninguna función hace commit: corren dentro de la transacción del pedido.
"""
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import error_negocio
from app.models.customer import Customer
from app.models.order import Order
from app.services.settings_service import get_setting_float

DEFAULT_PESOS_POR_PUNTO = 10.0
DEFAULT_VALOR_PUNTO = 1.0


def _solo_digitos(telefono: str) -> str:
    return re.sub(r"\D", "", telefono or "")


async def _config(db: AsyncSession) -> tuple[float, float]:
    try:
        pesos_por_punto = await get_setting_float(db, "loyalty_pesos_por_punto")
    except Exception:
        pesos_por_punto = DEFAULT_PESOS_POR_PUNTO
    try:
        valor_punto = await get_setting_float(db, "loyalty_valor_punto")
    except Exception:
        valor_punto = DEFAULT_VALOR_PUNTO
    return (pesos_por_punto or DEFAULT_PESOS_POR_PUNTO, valor_punto or DEFAULT_VALOR_PUNTO)


async def buscar_cliente(db: AsyncSession, email: str | None, phone: str | None) -> Customer | None:
    """Busca al cliente por email (identidad principal) o por teléfono."""
    if email:
        result = await db.execute(select(Customer).where(Customer.email == email))
        cliente = result.scalar_one_or_none()
        if cliente is not None:
            return cliente
    if phone:
        digitos = _solo_digitos(phone)
        if len(digitos) >= 10:
            result = await db.execute(select(Customer).order_by(Customer.id))
            for c in result.scalars().all():
                if _solo_digitos(c.phone).endswith(digitos[-10:]):
                    return c
    return None


async def canjear_puntos(
    db: AsyncSession, email: str | None, phone: str | None, puntos: int, subtotal_tras_cupon: float
) -> tuple[Customer, float]:
    """Valida y descuenta puntos del cliente. Devuelve (cliente, descuento en pesos)."""
    if puntos <= 0:
        raise error_negocio("La cantidad de puntos a canjear debe ser mayor a 0")

    cliente = await buscar_cliente(db, email, phone)
    if cliente is None:
        raise error_negocio("No encontramos una cuenta de puntos con esos datos")
    if cliente.loyalty_points < puntos:
        raise error_negocio(f"Solo tienes {cliente.loyalty_points} puntos disponibles")

    _, valor_punto = await _config(db)
    descuento = round(puntos * valor_punto, 2)
    if descuento > subtotal_tras_cupon:
        raise error_negocio(
            "Los puntos canjeados exceden el monto del pedido; canjea menos puntos"
        )

    cliente.loyalty_points -= puntos
    return cliente, descuento


async def otorgar_puntos(db: AsyncSession, order: Order) -> int:
    """Otorga puntos al entregar el pedido (una sola vez). Devuelve los otorgados."""
    if order.points_awarded > 0 or not order.customer_email:
        return 0

    cliente = await buscar_cliente(db, order.customer_email, None)
    if cliente is None:
        return 0

    pesos_por_punto, _ = await _config(db)
    puntos = int(float(order.total_amount) // pesos_por_punto)
    if puntos <= 0:
        return 0

    cliente.loyalty_points += puntos
    order.points_awarded = puntos
    return puntos


async def devolver_puntos_por_cancelacion(db: AsyncSession, order: Order) -> int:
    """Regresa al cliente los puntos canjeados en un pedido que se cancela."""
    if order.points_redeemed <= 0:
        return 0
    cliente = await buscar_cliente(db, order.customer_email, order.customer_phone)
    if cliente is None:
        return 0
    cliente.loyalty_points += order.points_redeemed
    return order.points_redeemed
