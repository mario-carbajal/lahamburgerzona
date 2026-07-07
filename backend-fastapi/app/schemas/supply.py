from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.supply import TipoMovimientoInsumo

UNIDADES_VALIDAS = {"pieza", "kg", "g", "l", "ml", "paquete", "caja", "bolsa"}


class SupplyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    unit: str = Field(..., min_length=1, max_length=20)
    image: str | None = Field(None, max_length=500)
    min_stock: Decimal = Field(default=Decimal("0"), ge=0)
    cost_per_unit: Decimal = Field(default=Decimal("0"), ge=0)
    supplier_name: str | None = Field(None, max_length=255)
    supplier_phone: str | None = Field(None, max_length=20)
    # Stock inicial opcional: se registra como movimiento ENTRADA "Inventario inicial"
    initial_stock: Decimal = Field(default=Decimal("0"), ge=0)


class SupplyUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    unit: str | None = Field(None, min_length=1, max_length=20)
    image: str | None = Field(None, max_length=500)
    min_stock: Decimal | None = Field(None, ge=0)
    cost_per_unit: Decimal | None = Field(None, ge=0)
    supplier_name: str | None = Field(None, max_length=255)
    supplier_phone: str | None = Field(None, max_length=20)
    is_active: bool | None = None
    # current_stock NO es editable aquí: solo cambia vía movimientos


class SupplyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    unit: str
    image: str | None
    current_stock: Decimal
    min_stock: Decimal
    cost_per_unit: Decimal
    supplier_name: str | None
    supplier_phone: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ConteoLinea(BaseModel):
    supply_id: int
    counted: Decimal = Field(..., ge=0)  # stock contado físicamente


class ConteoRequest(BaseModel):
    lineas: list[ConteoLinea] = Field(..., min_length=1)
    note: str | None = Field(None, max_length=500)


class RecetaLineaIn(BaseModel):
    supply_id: int
    quantity: Decimal = Field(..., gt=0)


class RecetaUpdate(BaseModel):
    lineas: list[RecetaLineaIn]


class MovementCreate(BaseModel):
    type: TipoMovimientoInsumo
    # Para AJUSTE es el stock contado (>= 0); para el resto, la cantidad del movimiento (> 0)
    quantity: Decimal = Field(..., ge=0)
    unit_cost: Decimal | None = Field(None, ge=0)  # solo aplica en ENTRADA
    note: str | None = Field(None, max_length=500)


class MovementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supply_id: int
    type: TipoMovimientoInsumo
    quantity: Decimal
    stock_before: Decimal
    stock_after: Decimal
    unit_cost: Decimal | None
    note: str | None
    admin_user_id: int | None
    created_at: datetime
