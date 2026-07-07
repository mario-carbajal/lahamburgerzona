from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str
    address: str | None
    total_orders: int
    total_spent: float
    loyalty_points: int
    last_order_date: datetime | None
    created_at: datetime
    updated_at: datetime
