from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

ESTADOS_VALIDOS = ["pending", "confirmed", "preparing", "ready", "delivered"]
ESTADOS_FINALES = ["delivered", "cancelled"]


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., gt=0)
    special_instructions: str | None = None
    extra_ids: list[int] = Field(default_factory=list)


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: str = Field(..., min_length=1, max_length=20)
    customer_email: EmailStr | None = None
    delivery_address: str = Field(..., min_length=1)
    delivery_instructions: str | None = None
    payment_method: str = "cash"
    notes: str | None = None
    coupon_code: str | None = Field(None, max_length=50)
    redeem_points: int = Field(default=0, ge=0)
    scheduled_for: datetime | None = None
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderEditRequest(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)
    customer_phone: str | None = Field(None, min_length=1, max_length=20)
    delivery_address: str | None = Field(None, min_length=1)
    delivery_instructions: str | None = None
    notes: str | None = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    menu_item_id: int | None
    menu_item_name: str
    quantity: int
    unit_price: float
    total_price: float
    special_instructions: str | None
    extras: list[dict] | None = None


class OrderStatusHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    notes: str | None
    changed_by: str | None
    changed_at: datetime


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    customer_name: str
    customer_phone: str
    customer_email: str | None
    delivery_address: str
    delivery_instructions: str | None
    payment_method: str
    payment_status: str
    subtotal: float
    discount: float
    coupon_code: str | None
    points_redeemed: int
    points_discount: float
    points_awarded: int
    scheduled_for: datetime | None
    delivery_fee: float
    tax: float
    total_amount: float
    status: str
    notes: str | None
    cancellation_reason: str | None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut]
    status_history: list[OrderStatusHistoryOut]


class OrderStatusUpdate(BaseModel):
    status: str
    notes: str | None = None
    changed_by: str | None = None


class OrderCancelRequest(BaseModel):
    reason: str = Field(..., min_length=1)
