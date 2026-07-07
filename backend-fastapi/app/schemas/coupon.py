from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.coupon import TipoCupon


class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    type: TipoCupon
    value: Decimal = Field(..., gt=0)
    min_subtotal: Decimal = Field(default=Decimal("0"), ge=0)
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    max_uses: int | None = Field(None, gt=0)
    is_active: bool = True

    @field_validator("code")
    @classmethod
    def normalizar_codigo(cls, v: str) -> str:
        codigo = v.strip().upper()
        if " " in codigo:
            raise ValueError("El código no puede contener espacios")
        return codigo

    @field_validator("value")
    @classmethod
    def validar_porcentaje(cls, v: Decimal, info) -> Decimal:
        if info.data.get("type") == TipoCupon.PERCENT and v > 100:
            raise ValueError("Un descuento porcentual no puede exceder 100")
        return v


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    type: TipoCupon | None = None
    value: Decimal | None = Field(None, gt=0)
    min_subtotal: Decimal | None = Field(None, ge=0)
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    max_uses: int | None = Field(None, gt=0)
    is_active: bool | None = None


class CouponOut(CouponBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    times_used: int
    created_at: datetime
    updated_at: datetime


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    subtotal: Decimal = Field(..., ge=0)
