from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_email: Mapped[str | None] = mapped_column(String(255))
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    delivery_instructions: Mapped[str | None] = mapped_column(Text)
    payment_method: Mapped[str] = mapped_column(String(50), default="cash")
    payment_status: Mapped[str] = mapped_column(String(50), default="pending")
    mp_preference_id: Mapped[str | None] = mapped_column(String(100))
    mp_payment_id: Mapped[str | None] = mapped_column(String(100))
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    discount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    coupon_code: Mapped[str | None] = mapped_column(String(50))
    # Lealtad: puntos canjeados en este pedido (points_discount = su valor en pesos)
    # y puntos otorgados al entregarse (points_awarded > 0 evita otorgar dos veces)
    points_redeemed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    points_discount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    points_awarded: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Pedido programado: hora a la que el cliente lo quiere (None = lo antes posible)
    scheduled_for: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    delivery_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    tax: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    estimated_delivery_time: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    actual_delivery_time: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    status_notes: Mapped[str | None] = mapped_column(Text)
    cancelled_at: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    cancellation_reason: Mapped[str | None] = mapped_column(Text)
    # Evita descontar insumos dos veces si el pedido pasa varias veces por estados de cocina
    supplies_deducted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    status_history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    menu_item_id: Mapped[int | None] = mapped_column(ForeignKey("menu_items.id"))
    menu_item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    special_instructions: Mapped[str | None] = mapped_column(Text)
    # Snapshot de extras elegidos: [{"name": "Doble carne", "price": 25.0}] —
    # inmutable aunque el catálogo de extras cambie después
    extras: Mapped[list | None] = mapped_column(JSONB)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship(back_populates="items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    changed_by: Mapped[str | None] = mapped_column(String(100))
    changed_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship(back_populates="status_history")
