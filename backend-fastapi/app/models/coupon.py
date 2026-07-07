import enum

from sqlalchemy import Boolean, DateTime, Enum, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TipoCupon(str, enum.Enum):
    PERCENT = "PERCENT"  # value = porcentaje de descuento sobre el subtotal
    FIXED = "FIXED"  # value = monto fijo en pesos


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # se guarda en MAYÚSCULAS
    type: Mapped[TipoCupon] = mapped_column(Enum(TipoCupon, name="coupon_type"), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    min_subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    valid_from: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    max_uses: Mapped[int | None] = mapped_column(Integer)  # None = sin límite
    times_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
