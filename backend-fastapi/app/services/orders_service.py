from datetime import datetime, timedelta, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import error_negocio
from app.models.customer import Customer
from app.models.menu_item import MenuItem, MenuItemExtra
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.schemas.order import ESTADOS_FINALES, ESTADOS_VALIDOS, OrderCreate, OrderEditRequest, OrderItemCreate
from app.services import coupons_service, inventory_service, loyalty_service
from app.services.settings_service import get_setting_float


async def _generar_order_number(db: AsyncSession) -> str:
    result = await db.execute(text("SELECT nextval('order_number_seq')"))
    seq = result.scalar_one()
    return f"ORD-{datetime.now(timezone.utc).year}-{seq:06d}"


async def obtener_pedido(db: AsyncSession, order_id: int) -> Order | None:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.status_history))
        .where(Order.id == order_id)
    )
    return result.scalar_one_or_none()


async def _construir_items(db: AsyncSession, items: list[OrderItemCreate]) -> tuple[list[OrderItem], float]:
    """Valida productos y extras, y construye los OrderItem con su snapshot de precios."""
    subtotal = 0.0
    order_items: list[OrderItem] = []

    for item in items:
        menu_item = await db.get(MenuItem, item.menu_item_id)
        if menu_item is None or not menu_item.is_active:
            raise error_negocio(f"El producto {item.menu_item_id} no existe o no está disponible")

        # Extras: se validan contra el catálogo del producto y se guardan como
        # snapshot (nombre + precio del momento) — cambios futuros no afectan el pedido
        extras_snapshot: list[dict] = []
        if item.extra_ids:
            ids_unicos = list(dict.fromkeys(item.extra_ids))
            result = await db.execute(
                select(MenuItemExtra).where(
                    MenuItemExtra.id.in_(ids_unicos),
                    MenuItemExtra.menu_item_id == menu_item.id,
                    MenuItemExtra.is_active.is_(True),
                )
            )
            extras = result.scalars().all()
            if len(extras) != len(ids_unicos):
                raise error_negocio(
                    f"Algún extra seleccionado para '{menu_item.name}' ya no está disponible"
                )
            # El id permite reconstruir el pedido al editarlo desde el admin
            extras_snapshot = [{"id": e.id, "name": e.name, "price": float(e.price)} for e in extras]

        unit_price = round(float(menu_item.price) + sum(e["price"] for e in extras_snapshot), 2)
        total_price = round(unit_price * item.quantity, 2)
        subtotal += total_price

        order_items.append(
            OrderItem(
                menu_item_id=menu_item.id,
                menu_item_name=menu_item.name,
                quantity=item.quantity,
                unit_price=unit_price,
                total_price=total_price,
                special_instructions=item.special_instructions,
                extras=extras_snapshot or None,
            )
        )

    return order_items, round(subtotal, 2)


def _validar_programacion(scheduled_for) -> object | None:
    """Valida la hora del pedido programado; None = lo antes posible."""
    if scheduled_for is None:
        return None
    if scheduled_for.tzinfo is None:
        scheduled_for = scheduled_for.replace(tzinfo=timezone.utc)
    ahora = datetime.now(timezone.utc)
    if scheduled_for < ahora + timedelta(minutes=30):
        raise error_negocio("Los pedidos programados requieren al menos 30 minutos de anticipación")
    if scheduled_for > ahora + timedelta(days=7):
        raise error_negocio("Solo se puede programar con hasta 7 días de anticipación")
    return scheduled_for


async def crear_pedido(db: AsyncSession, data: OrderCreate) -> Order:
    order_items, subtotal = await _construir_items(db, data.items)
    scheduled_for = _validar_programacion(data.scheduled_for)

    tax_rate = await get_setting_float(db, "tax_rate")
    delivery_fee = await get_setting_float(db, "delivery_fee")
    free_delivery_threshold = await get_setting_float(db, "free_delivery_threshold")

    # Cupón: el descuento aplica al subtotal, antes de impuestos y envío
    descuento = 0.0
    cupon = None
    if data.coupon_code:
        cupon, descuento = await coupons_service.validar_cupon(db, data.coupon_code, subtotal)

    subtotal_con_descuento = round(subtotal - descuento, 2)

    # Puntos de lealtad: se canjean después del cupón, sobre lo que resta
    puntos_canjeados = 0
    descuento_puntos = 0.0
    if data.redeem_points > 0:
        _, descuento_puntos = await loyalty_service.canjear_puntos(
            db, data.customer_email, data.customer_phone, data.redeem_points, subtotal_con_descuento
        )
        puntos_canjeados = data.redeem_points

    base_final = round(subtotal_con_descuento - descuento_puntos, 2)
    # Los precios del menú YA incluyen IVA (norma en México): el impuesto se
    # desglosa de manera informativa, no se suma encima. Así el total coincide
    # con lo que ve el cliente en el sitio y con lo que cobra Mercado Pago.
    tax = round(base_final - base_final / (1 + tax_rate), 2)
    # El envío gratis se evalúa sobre lo que realmente paga el cliente
    if base_final >= free_delivery_threshold:
        delivery_fee = 0.0
    total_amount = round(base_final + delivery_fee, 2)

    if data.customer_email:
        result = await db.execute(select(Customer).where(Customer.email == data.customer_email))
        customer = result.scalar_one_or_none()
        if customer is not None:
            customer.name = data.customer_name
            customer.phone = data.customer_phone
            customer.address = data.delivery_address
            customer.total_orders += 1
            customer.total_spent = float(customer.total_spent) + total_amount
            customer.last_order_date = datetime.now(timezone.utc)
        else:
            db.add(
                Customer(
                    name=data.customer_name,
                    email=data.customer_email,
                    phone=data.customer_phone,
                    address=data.delivery_address,
                    total_orders=1,
                    total_spent=total_amount,
                    last_order_date=datetime.now(timezone.utc),
                )
            )

    order = Order(
        order_number=await _generar_order_number(db),
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        customer_email=data.customer_email,
        delivery_address=data.delivery_address,
        delivery_instructions=data.delivery_instructions,
        payment_method=data.payment_method,
        subtotal=round(subtotal, 2),
        discount=descuento,
        coupon_code=cupon.code if cupon else None,
        points_redeemed=puntos_canjeados,
        points_discount=descuento_puntos,
        scheduled_for=scheduled_for,
        delivery_fee=delivery_fee,
        tax=tax,
        total_amount=total_amount,
        status="pending",
        notes=data.notes,
        items=order_items,
        status_history=[OrderStatusHistory(status="pending", notes="Pedido creado")],
    )
    db.add(order)
    if cupon is not None:
        cupon.times_used += 1
    await db.commit()

    return await obtener_pedido(db, order.id)


async def cambiar_estado(
    db: AsyncSession,
    order_id: int,
    nuevo_estado: str,
    notas: str | None,
    cambiado_por: str | None,
    usuario_id: int | None = None,
) -> Order:
    if nuevo_estado not in ESTADOS_VALIDOS:
        raise error_negocio(f"Estado inválido: {nuevo_estado}")

    order = await obtener_pedido(db, order_id)
    if order is None:
        raise error_negocio("Pedido no encontrado", status_code=404)

    if order.status in ESTADOS_FINALES:
        raise error_negocio(f"El pedido ya está en estado final '{order.status}', no se puede cambiar")

    order.status = nuevo_estado
    order.status_notes = notas
    if nuevo_estado == "delivered":
        order.actual_delivery_time = datetime.now(timezone.utc)
        # Lealtad: al entregar se otorgan los puntos de la compra (una sola vez)
        await loyalty_service.otorgar_puntos(db, order)

    # Al entrar a cocina se descuentan los insumos según receta (una sola vez,
    # en la misma transacción que el cambio de estado)
    if nuevo_estado in inventory_service.ESTADOS_QUE_DESCUENTAN:
        await inventory_service.descontar_por_pedido(db, order, usuario_id)

    db.add(OrderStatusHistory(order_id=order.id, status=nuevo_estado, notes=notas, changed_by=cambiado_por))
    await db.commit()

    return await obtener_pedido(db, order_id)


async def editar_pedido(
    db: AsyncSession,
    order_id: int,
    data: OrderEditRequest,
    cambiado_por: str | None,
    usuario_id: int | None = None,
) -> Order:
    """Edita los productos y datos de entrega de un pedido no finalizado.

    Recalcula totales (respetando cupón y puntos ya aplicados) y, si el pedido
    ya había descontado insumos, revierte el descuento anterior y aplica el nuevo.
    """
    order = await obtener_pedido(db, order_id)
    if order is None:
        raise error_negocio("Pedido no encontrado", status_code=404)
    if order.status in ESTADOS_FINALES:
        raise error_negocio(f"El pedido está en estado final '{order.status}' y ya no se puede editar")
    if order.payment_status == "paid":
        raise error_negocio(
            "Este pedido ya fue pagado en línea; no se puede editar. Cancélalo y crea uno nuevo."
        )

    estaba_descontado = order.supplies_deducted
    if estaba_descontado:
        await inventory_service.revertir_por_pedido(db, order, usuario_id)

    nuevos_items, subtotal = await _construir_items(db, data.items)

    # El cupón ya usado se respeta: solo se ajusta su monto al nuevo subtotal
    descuento = 0.0
    if order.coupon_code:
        descuento = await coupons_service.recalcular_descuento(db, order.coupon_code, subtotal)
    subtotal_con_descuento = round(subtotal - descuento, 2)

    # Los puntos canjeados se conservan tal cual, topados al nuevo monto
    descuento_puntos = min(float(order.points_discount), subtotal_con_descuento)
    base_final = round(subtotal_con_descuento - descuento_puntos, 2)

    tax_rate = await get_setting_float(db, "tax_rate")
    delivery_fee = await get_setting_float(db, "delivery_fee")
    free_delivery_threshold = await get_setting_float(db, "free_delivery_threshold")
    tax = round(base_final - base_final / (1 + tax_rate), 2)
    if base_final >= free_delivery_threshold:
        delivery_fee = 0.0

    order.items = nuevos_items  # delete-orphan elimina los anteriores
    order.subtotal = subtotal
    order.discount = descuento
    order.points_discount = descuento_puntos
    order.tax = tax
    order.delivery_fee = delivery_fee
    order.total_amount = round(base_final + delivery_fee, 2)

    # Datos de entrega opcionales
    for campo in ("customer_phone", "delivery_address", "delivery_instructions", "notes"):
        valor = getattr(data, campo)
        if valor is not None:
            setattr(order, campo, valor)

    # Si ya estaba en cocina, el inventario se reajusta con los items nuevos
    if estaba_descontado:
        await inventory_service.descontar_por_pedido(db, order, usuario_id)

    db.add(
        OrderStatusHistory(
            order_id=order.id,
            status=order.status,
            notes=f"Pedido editado ({len(nuevos_items)} productos, total ${order.total_amount})",
            changed_by=cambiado_por,
        )
    )
    await db.commit()

    return await obtener_pedido(db, order_id)


async def cancelar_pedido(
    db: AsyncSession, order_id: int, reason: str, cambiado_por: str | None, usuario_id: int | None = None
) -> Order:
    order = await obtener_pedido(db, order_id)
    if order is None:
        raise error_negocio("Pedido no encontrado", status_code=404)

    if order.status in ESTADOS_FINALES:
        raise error_negocio(f"El pedido ya está en estado final '{order.status}', no se puede cancelar")

    order.status = "cancelled"
    order.cancelled_at = datetime.now(timezone.utc)
    order.cancellation_reason = reason

    # Si ya se habían descontado insumos, se devuelven al inventario
    await inventory_service.revertir_por_pedido(db, order, usuario_id)
    # Lealtad: los puntos canjeados regresan al cliente
    await loyalty_service.devolver_puntos_por_cancelacion(db, order)

    db.add(OrderStatusHistory(order_id=order.id, status="cancelled", notes=reason, changed_by=cambiado_por))
    await db.commit()

    return await obtener_pedido(db, order_id)
