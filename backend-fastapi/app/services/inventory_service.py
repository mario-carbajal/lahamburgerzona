"""Descuento automático de insumos por pedido, según la receta de cada producto.

Reglas:
- Se descuenta UNA sola vez por pedido (bandera Order.supplies_deducted), al entrar
  a cualquier estado de cocina (preparing/ready/delivered).
- El descuento automático SÍ puede dejar stock negativo: si cocina vendió, el consumo
  es un hecho — un stock negativo señala que el registro estaba mal y se corrige con
  un AJUSTE por conteo físico. (La SALIDA manual sí sigue bloqueada en negativo.)
- Cancelar un pedido ya descontado revierte los insumos con movimientos ENTRADA
  (sin costo, para no alterar el costo promedio).
- Productos sin receta simplemente no descuentan nada.

Ninguna función hace commit: corren dentro de la transacción del cambio de estado.
"""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.supply import MenuItemSupply, Supply, SupplyMovement, TipoMovimientoInsumo

# Estados en los que el pedido ya consumió (o va a consumir) los insumos
ESTADOS_QUE_DESCUENTAN = {"preparing", "ready", "delivered"}


async def _consumo_por_insumo(db: AsyncSession, order: Order) -> dict[int, Decimal]:
    """Agrega el consumo total del pedido por insumo: receta × cantidad pedida."""
    menu_ids = [item.menu_item_id for item in order.items if item.menu_item_id is not None]
    if not menu_ids:
        return {}

    result = await db.execute(select(MenuItemSupply).where(MenuItemSupply.menu_item_id.in_(menu_ids)))
    lineas = result.scalars().all()
    receta_por_menu: dict[int, list[MenuItemSupply]] = {}
    for linea in lineas:
        receta_por_menu.setdefault(linea.menu_item_id, []).append(linea)

    consumo: dict[int, Decimal] = {}
    for item in order.items:
        for linea in receta_por_menu.get(item.menu_item_id, []):
            total = Decimal(linea.quantity) * item.quantity
            consumo[linea.supply_id] = consumo.get(linea.supply_id, Decimal("0")) + total
    return consumo


async def descontar_por_pedido(db: AsyncSession, order: Order, usuario_id: int | None) -> int:
    """Descuenta los insumos del pedido según recetas. Devuelve cuántos insumos tocó."""
    if order.supplies_deducted:
        return 0

    consumo = await _consumo_por_insumo(db, order)
    for supply_id, cantidad in consumo.items():
        supply = await db.get(Supply, supply_id)
        if supply is None:
            continue
        stock_antes = Decimal(supply.current_stock)
        stock_despues = stock_antes - cantidad  # puede quedar negativo, ver docstring
        supply.current_stock = stock_despues
        db.add(
            SupplyMovement(
                supply_id=supply_id,
                type=TipoMovimientoInsumo.SALIDA,
                quantity=cantidad,
                stock_before=stock_antes,
                stock_after=stock_despues,
                note=f"Pedido {order.order_number}",
                admin_user_id=usuario_id,
            )
        )

    order.supplies_deducted = True
    return len(consumo)


async def revertir_por_pedido(db: AsyncSession, order: Order, usuario_id: int | None) -> int:
    """Devuelve al inventario lo descontado por un pedido que se cancela.

    Revierte a partir de los movimientos reales registrados (no de la receta actual,
    que pudo haber cambiado desde que se descontó).
    """
    if not order.supplies_deducted:
        return 0

    # Neto pendiente por insumo: SALIDAs del pedido menos ENTRADAs de reversión
    # previas (un pedido editado puede tener varias rondas de descuento/reversión)
    salidas = await db.execute(
        select(SupplyMovement).where(
            SupplyMovement.note == f"Pedido {order.order_number}",
            SupplyMovement.type == TipoMovimientoInsumo.SALIDA,
        )
    )
    reversiones = await db.execute(
        select(SupplyMovement).where(
            SupplyMovement.note.like(f"Reversión%{order.order_number}"),
            SupplyMovement.type == TipoMovimientoInsumo.ENTRADA,
        )
    )
    neto: dict[int, Decimal] = {}
    for mov in salidas.scalars().all():
        neto[mov.supply_id] = neto.get(mov.supply_id, Decimal("0")) + Decimal(mov.quantity)
    for mov in reversiones.scalars().all():
        neto[mov.supply_id] = neto.get(mov.supply_id, Decimal("0")) - Decimal(mov.quantity)

    revertidos = 0
    for supply_id, cantidad in neto.items():
        if cantidad <= 0:
            continue
        supply = await db.get(Supply, supply_id)
        if supply is None:
            continue
        stock_antes = Decimal(supply.current_stock)
        stock_despues = stock_antes + cantidad
        supply.current_stock = stock_despues
        db.add(
            SupplyMovement(
                supply_id=supply_id,
                type=TipoMovimientoInsumo.ENTRADA,
                quantity=cantidad,
                stock_before=stock_antes,
                stock_after=stock_despues,
                unit_cost=None,  # no altera el costo promedio
                note=f"Reversión de insumos del pedido {order.order_number}",
                admin_user_id=usuario_id,
            )
        )
        revertidos += 1

    order.supplies_deducted = False
    return revertidos
