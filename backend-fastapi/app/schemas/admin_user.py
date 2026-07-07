from pydantic import BaseModel, Field

from app.models.admin_user import RolAdmin


class AdminUserCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    email: str
    password: str = Field(..., min_length=8)
    role: RolAdmin
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = None


class AdminUserUpdate(BaseModel):
    email: str | None = None
    role: RolAdmin | None = None
    full_name: str | None = None
    phone: str | None = None


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8)
