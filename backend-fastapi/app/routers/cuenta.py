"""Cuenta de cliente del sitio público (sin contraseña).

El cliente accede con la pareja email + teléfono de sus pedidos — el mismo
patrón de "consulta tu pedido" de e-commerce. No expone nada que el propio
cliente no haya capturado, y está rate-limited contra fuerza bruta.
"""
import re

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import error_negocio, get_current_customer
from app.core.limiter import limiter
from app.core.security import create_customer_token
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.order import OrderOut

router = APIRouter(prefix="/api/cuenta", tags=["cuenta"])


class AccesoRequest(BaseModel):
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)


def _digitos(telefono: str) -> str:
    return re.sub(r"\D", "", telefono or "")


def _perfil(customer: Customer) -> dict:
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "address": customer.address,
        "loyalty_points": customer.loyalty_points,
        "total_orders": customer.total_orders,
    }


@router.post("/acceso")
@limiter.limit("5/minute")
async def acceso(request: Request, body: AccesoRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.email == body.email.lower()))
    customer = result.scalar_one_or_none()
    if customer is None:
        # Intento case-insensitive por si el email se guardó con mayúsculas
        result = await db.execute(select(Customer))
        customer = next(
            (c for c in result.scalars().all() if c.email.lower() == body.email.lower()), None
        )

    # Mensaje único para no revelar si el email existe
    if customer is None or not _digitos(customer.phone).endswith(_digitos(body.phone)[-10:]):
        raise error_negocio(
            "No encontramos una cuenta con ese email y teléfono. "
            "Se crea automáticamente con tu primer pedido dejando ambos datos."
        )

    return {
        "ok": True,
        "data": {"token": create_customer_token(customer.id), "customer": _perfil(customer)},
    }


@router.get("/perfil")
async def perfil(customer: Customer = Depends(get_current_customer)):
    return {"ok": True, "data": _perfil(customer)}


@router.get("/pedidos")
async def mis_pedidos(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    """Historial del cliente (los pedidos se ligan por email)."""
    query = (
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.status_history))
        .where(Order.customer_email == customer.email)
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    orders = result.scalars().all()
    return {
        "ok": True,
        "data": [OrderOut.model_validate(o) for o in orders],
        "page": page,
        "page_size": page_size,
    }
