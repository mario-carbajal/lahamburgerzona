from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

ESTADOS_REVIEW = ["pending", "approved", "rejected"]


class ReviewCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: EmailStr | None = None
    menu_item_id: int | None = None
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    customer_email: str | None
    menu_item_id: int | None
    rating: int
    comment: str | None
    status: str
    created_at: datetime


class ReviewModerar(BaseModel):
    status: str = Field(..., description="approved o rejected")
