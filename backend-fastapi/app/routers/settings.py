from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import error_negocio, require_roles
from app.core.limiter import limiter
from app.models.admin_user import RolAdmin
from app.models.setting import Setting
from app.schemas.settings import SettingOut, SettingUpdate
from app.services import audit_service

router = APIRouter(prefix="/api/configuracion", tags=["settings"])

# Claves que el sitio público puede leer sin autenticación (datos de contacto
# del negocio que de todos modos se muestran en pantalla). El resto
# (tax_rate, maintenance_mode, etc.) sigue siendo solo-ADMIN.
CLAVES_PUBLICAS = {
    "restaurant_name",
    "restaurant_phone",
    "restaurant_email",
    "restaurant_address",
    "restaurant_city",
    "opening_hours",
    "whatsapp_number",
    "facebook_url",
    "delivery_fee",
    "free_delivery_threshold",
    "logo_url",
    "slogan",
    "loyalty_pesos_por_punto",
    "loyalty_valor_punto",
}


@router.get("/publica")
@limiter.limit("60/minute")
async def publica(request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Setting).where(Setting.setting_key.in_(CLAVES_PUBLICAS)))
    settings = result.scalars().all()
    return {"ok": True, "data": {s.setting_key: s.setting_value for s in settings}}


@router.get("")
async def listar(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    result = await db.execute(select(Setting).order_by(Setting.setting_key))
    settings = result.scalars().all()
    return {"ok": True, "data": [SettingOut.model_validate(s) for s in settings]}


@router.put("/{clave}")
async def actualizar(
    clave: str,
    body: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    result = await db.execute(select(Setting).where(Setting.setting_key == clave))
    setting = result.scalar_one_or_none()
    if setting is None:
        raise error_negocio(f"Configuración '{clave}' no encontrada", status_code=404)

    setting.setting_value = body.setting_value
    await db.commit()
    await db.refresh(setting)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="actualizar", module="configuracion", entity_id=clave, details=body.setting_value
    )
    return {"ok": True, "data": SettingOut.model_validate(setting)}
