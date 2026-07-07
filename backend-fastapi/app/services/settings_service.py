from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting

DEFAULTS = {
    "tax_rate": "0.16",
    "delivery_fee": "30",
    "free_delivery_threshold": "200",
    "loyalty_pesos_por_punto": "10",
    "loyalty_valor_punto": "1",
}


async def get_setting(db: AsyncSession, key: str) -> str:
    result = await db.execute(select(Setting).where(Setting.setting_key == key))
    setting = result.scalar_one_or_none()
    if setting is not None and setting.setting_value is not None:
        return setting.setting_value
    return DEFAULTS.get(key, "")


async def get_setting_float(db: AsyncSession, key: str) -> float:
    return float(await get_setting(db, key))
