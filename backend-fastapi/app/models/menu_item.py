from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    image: Mapped[str | None] = mapped_column(String(500))
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    prep_time: Mapped[int] = mapped_column(Integer, default=0)
    is_spicy: Mapped[bool] = mapped_column(Boolean, default=False)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
    ingredients: Mapped[list | None] = mapped_column(JSONB)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class MenuItemExtra(Base):
    """Extra opcional de un producto con precio (ej. "Doble carne" +$25).

    Reemplaza el uso del campo libre special_instructions para cobros extra:
    el cliente los elige estructuradamente y el precio se suma solo.
    """

    __tablename__ = "menu_item_extras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    menu_item_id: Mapped[int] = mapped_column(
        ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
