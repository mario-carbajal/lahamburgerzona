from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class HeroImageBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    subtitle: str | None = None
    description: str | None = None
    image_url: str = Field(..., min_length=1, max_length=500)
    cta_text: str = "¡Ordena Ahora!"
    cta_link: str = "/pedidos"
    is_active: bool = True
    sort_order: int = 0


class HeroImageCreate(HeroImageBase):
    pass


class HeroImageUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    description: str | None = None
    image_url: str | None = None
    cta_text: str | None = None
    cta_link: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class HeroImageOut(HeroImageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
