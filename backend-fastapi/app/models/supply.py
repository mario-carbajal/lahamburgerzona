import enum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TipoMovimientoInsumo(str, enum.Enum):
    ENTRADA = "ENTRADA"  # compra / reposición (puede actualizar costo promedio)
    SALIDA = "SALIDA"  # consumo de cocina registrado a mano
    MERMA = "MERMA"  # desperdicio, caducidad, producto dañado
    AJUSTE = "AJUSTE"  # conteo físico: fija el stock al valor contado


class Supply(Base):
    """Insumo de cocina (carne, pan, queso...) para control interno de inventario.

    El stock solo cambia a través de SupplyMovement — nunca editarlo directo.
    Fase 2 (pendiente): recetas por producto del menú con descuento automático.
    """

    __tablename__ = "supplies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)  # kg, g, l, ml, pieza, paquete
    image: Mapped[str | None] = mapped_column(String(500))
    current_stock: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False, default=0)
    min_stock: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False, default=0)
    # Costo promedio ponderado por unidad; se recalcula en cada ENTRADA con costo
    cost_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    # Proveedor habitual (referencia rápida para recompra, no es un módulo de proveedores)
    supplier_name: Mapped[str | None] = mapped_column(String(255))
    supplier_phone: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SupplyMovement(Base):
    """Historial inmutable de movimientos de un insumo (trazabilidad completa)."""

    __tablename__ = "supply_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    supply_id: Mapped[int] = mapped_column(ForeignKey("supplies.id"), nullable=False)
    type: Mapped[TipoMovimientoInsumo] = mapped_column(
        Enum(TipoMovimientoInsumo, name="supply_movement_type"), nullable=False
    )
    # Para AJUSTE, quantity guarda el stock contado (no un delta)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    stock_before: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    stock_after: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    unit_cost: Mapped[float | None] = mapped_column(Numeric(10, 2))  # solo ENTRADA
    note: Mapped[str | None] = mapped_column(Text)
    admin_user_id: Mapped[int | None] = mapped_column(ForeignKey("admin_users.id"))
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MenuItemSupply(Base):
    """Línea de receta: cuánto insumo consume un producto del menú.

    Base del descuento automático (Fase 2) y del food cost por producto.
    """

    __tablename__ = "menu_item_supplies"
    __table_args__ = (UniqueConstraint("menu_item_id", "supply_id", name="uq_receta_menu_supply"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    menu_item_id: Mapped[int] = mapped_column(
        ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False
    )
    supply_id: Mapped[int] = mapped_column(ForeignKey("supplies.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)  # en la unidad del insumo

    supply: Mapped["Supply"] = relationship()
