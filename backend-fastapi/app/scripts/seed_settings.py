"""Inserta las configuraciones iniciales del negocio si todavía no existen. Idempotente."""
import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.setting import Setting

DEFAULTS = [
    ("restaurant_name", "La Hamburguezona", "Nombre del restaurante"),
    ("restaurant_phone", "228 144 0319", "Teléfono del restaurante"),
    ("restaurant_email", "contacto@hamburguezona.com", "Email del restaurante"),
    ("restaurant_address", "Ave. Américas, Xalapa, Veracruz", "Dirección del restaurante"),
    ("restaurant_city", "Xalapa, Veracruz", "Ciudad (se muestra en header/footer)"),
    ("opening_hours", "Mar - Sáb · 16:00 - 22:00", "Horario visible en el sitio"),
    ("whatsapp_number", "2281440319", "WhatsApp para recibir pedidos (10 dígitos, sin lada de país)"),
    ("facebook_url", "https://www.facebook.com/profile.php?id=61581846513047", "URL de Facebook"),
    ("logo_url", "", "URL del logo (vacío = logo por defecto 🍔)"),
    ("slogan", "¡Sabor que conquista!", "Eslogan bajo el nombre en header/footer"),
    ("delivery_fee", "30", "Costo de envío por defecto"),
    ("free_delivery_threshold", "200", "Monto mínimo para envío gratis"),
    ("tax_rate", "0.16", "Tasa de IVA (16%)"),
    ("loyalty_pesos_por_punto", "10", "Pesos de compra necesarios para ganar 1 punto"),
    ("loyalty_valor_punto", "1", "Valor en pesos de cada punto al canjear"),
    ("currency", "MXN", "Código de moneda"),
    ("maintenance_mode", "false", "Modo mantenimiento"),
]


async def main():
    async with AsyncSessionLocal() as db:
        for key, value, description in DEFAULTS:
            existing = await db.execute(select(Setting).where(Setting.setting_key == key))
            if existing.scalar_one_or_none() is not None:
                continue
            db.add(Setting(setting_key=key, setting_value=value, description=description))
            print(f"Configuración creada: {key} = {value}")
        await db.commit()


asyncio.run(main())
