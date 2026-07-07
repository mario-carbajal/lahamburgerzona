from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str | None = None
    subject: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    type: str = "contact"


class ContactMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str | None
    subject: str
    message: str
    type: str
    status: str
    created_at: datetime


class ContactStatusUpdate(BaseModel):
    status: str = Field(..., description="unread, read o respondido")
