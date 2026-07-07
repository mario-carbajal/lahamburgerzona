from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import error_negocio, get_current_user
from app.models.admin_user import AdminUser
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import CustomerOut, CustomerUpdate
from app.schemas.order import OrderOut
from app.services import audit_service

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("")
async def listar(
    q: str | None = None,
    page: int | None = Query(default=None, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
):
    query = select(Customer)
    if q:
        patron = f"%{q}%"
        query = query.where(
            (Customer.name.ilike(patron)) | (Customer.email.ilike(patron)) | (Customer.phone.ilike(patron))
        )
    query = query.order_by(Customer.name)

    # Paginación opt-in: sin `page` se devuelve todo (comportamiento original).
    if page is None:
        result = await db.execute(query)
        customers = result.scalars().all()
        return {"ok": True, "data": [CustomerOut.model_validate(c) for c in customers], "total": len(customers)}

    count_result = await db.execute(select(func.count()).select_from(query.order_by(None).subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    customers = result.scalars().all()
    return {
        "ok": True,
        "data": [CustomerOut.model_validate(c) for c in customers],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{customer_id}")
async def detalle(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
):
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise error_negocio("Cliente no encontrado", status_code=404)

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.status_history))
        .where(Order.customer_email == customer.email)
        .order_by(Order.created_at.desc())
    )
    pedidos = result.scalars().all()

    return {
        "ok": True,
        "data": {
            "cliente": CustomerOut.model_validate(customer),
            "pedidos": [OrderOut.model_validate(p) for p in pedidos],
        },
    }


@router.put("/{customer_id}")
async def actualizar(
    customer_id: int,
    body: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
):
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise error_negocio("Cliente no encontrado", status_code=404)

    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(customer, campo, valor)

    await db.commit()
    await db.refresh(customer)
    await audit_service.registrar(
        db, admin_user_id=user.id, action="actualizar", module="clientes", entity_id=customer_id, details=customer.name
    )
    return {"ok": True, "data": CustomerOut.model_validate(customer)}
