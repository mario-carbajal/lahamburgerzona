from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import error_negocio, get_current_user, require_roles
from app.core.limiter import limiter
from app.models.admin_user import AdminUser, RolAdmin
from app.models.order import Order
from app.schemas.order import OrderCancelRequest, OrderCreate, OrderEditRequest, OrderOut, OrderStatusUpdate
from app.services import audit_service, notification_service, orders_service
from app.services.whatsapp_service import generar_link_whatsapp

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("")
@limiter.limit("5/minute")
async def crear(request: Request, body: OrderCreate, db: AsyncSession = Depends(get_db)):
    order = await orders_service.crear_pedido(db, body)
    notification_service.notificar_cambio_estado(order)
    return {"ok": True, "data": OrderOut.model_validate(order)}


@router.get("")
async def listar(
    estado: str | None = None,
    telefono: str | None = None,
    busqueda: str | None = None,
    page: int | None = Query(default=None, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
):
    query = select(Order).options(selectinload(Order.items), selectinload(Order.status_history))
    if estado:
        query = query.where(Order.status == estado)
    if telefono:
        query = query.where(Order.customer_phone == telefono)
    if busqueda:
        patron = f"%{busqueda}%"
        query = query.where(
            (Order.order_number.ilike(patron))
            | (Order.customer_name.ilike(patron))
            | (Order.customer_phone.ilike(patron))
        )
    query = query.order_by(Order.created_at.desc())

    # Paginación opt-in: sin `page` se devuelve todo (comportamiento original,
    # usado por cocina/caja/repartidor/dashboard que filtran en el cliente).
    if page is None:
        result = await db.execute(query)
        orders = result.scalars().all()
        return {"ok": True, "data": [OrderOut.model_validate(o) for o in orders], "total": len(orders)}

    count_result = await db.execute(select(func.count()).select_from(query.order_by(None).subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    orders = result.scalars().all()
    return {
        "ok": True,
        "data": [OrderOut.model_validate(o) for o in orders],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{order_id}")
async def detalle(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
):
    order = await orders_service.obtener_pedido(db, order_id)
    if order is None:
        raise error_negocio("Pedido no encontrado", status_code=404)
    return {"ok": True, "data": OrderOut.model_validate(order)}


@router.put("/{order_id}/estado")
async def cambiar_estado(
    order_id: int,
    body: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    order = await orders_service.cambiar_estado(
        db, order_id, body.status, body.notes, cambiado_por=current_user.username, usuario_id=current_user.id
    )
    await audit_service.registrar(
        db,
        admin_user_id=current_user.id,
        action="cambiar_estado",
        module="pedidos",
        entity_id=order_id,
        details=f"Nuevo estado: {body.status}",
    )
    notification_service.notificar_cambio_estado(order)
    return {"ok": True, "data": OrderOut.model_validate(order)}


@router.put("/{order_id}/editar")
async def editar(
    order_id: int,
    body: OrderEditRequest,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_roles(RolAdmin.ADMIN, RolAdmin.CAJA)),
):
    order = await orders_service.editar_pedido(
        db, order_id, body, cambiado_por=current_user.username, usuario_id=current_user.id
    )
    await audit_service.registrar(
        db,
        admin_user_id=current_user.id,
        action="editar",
        module="pedidos",
        entity_id=order_id,
        details=f"{len(body.items)} productos, total ${float(order.total_amount)}",
    )
    return {"ok": True, "data": OrderOut.model_validate(order)}


@router.put("/{order_id}/cancelar")
async def cancelar(
    order_id: int,
    body: OrderCancelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_roles(RolAdmin.ADMIN, RolAdmin.CAJA)),
):
    order = await orders_service.cancelar_pedido(
        db, order_id, body.reason, cambiado_por=current_user.username, usuario_id=current_user.id
    )
    await audit_service.registrar(
        db,
        admin_user_id=current_user.id,
        action="cancelar",
        module="pedidos",
        entity_id=order_id,
        details=body.reason,
    )
    notification_service.notificar_cambio_estado(order)
    return {"ok": True, "data": OrderOut.model_validate(order)}


@router.get("/{order_id}/whatsapp")
async def link_whatsapp(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
):
    order = await orders_service.obtener_pedido(db, order_id)
    if order is None:
        raise error_negocio("Pedido no encontrado", status_code=404)
    return {"ok": True, "data": {"url": generar_link_whatsapp(order)}}
