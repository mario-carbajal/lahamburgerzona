from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.admin_user import RolAdmin


class LoginRequest(BaseModel):
    identificador: str = Field(..., description="username o email")
    password: str


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: RolAdmin
    full_name: str
    phone: str | None
    is_active: bool
    last_login: datetime | None
    created_at: datetime


class LoginResponse(BaseModel):
    token: str
    usuario: UsuarioOut


class CambiarPasswordRequest(BaseModel):
    password_actual: str
    password_nueva: str = Field(..., min_length=8)
