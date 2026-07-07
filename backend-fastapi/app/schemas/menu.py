from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    price: float = Field(..., gt=0)
    image: str | None = None
    category: str = Field(..., min_length=1, max_length=100)
    prep_time: int = Field(default=0, ge=0)
    is_spicy: bool = False
    is_popular: bool = False
    ingredients: list[str] | None = None
    is_active: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    image: str | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    prep_time: int | None = Field(default=None, ge=0)
    is_spicy: bool | None = None
    is_popular: bool | None = None
    ingredients: list[str] | None = None
    is_active: bool | None = None


class MenuItemOut(MenuItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rating: float
    created_at: datetime
    updated_at: datetime


# ── Extras con precio por producto ──


class ExtraIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., ge=0)
    is_active: bool = True


class ExtrasUpdate(BaseModel):
    extras: list[ExtraIn]


class ExtraOut(ExtraIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    menu_item_id: int
