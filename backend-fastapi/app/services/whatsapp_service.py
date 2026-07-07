import re
from urllib.parse import quote

from app.models.order import Order

MENSAJES_POR_ESTADO = {
    "pending": "Hola {nombre}, recibimos tu pedido {folio}. En breve lo confirmamos.",
    "confirmed": "Hola {nombre}, tu pedido {folio} fue confirmado y ya lo estamos preparando.",
    "preparing": "Hola {nombre}, tu pedido {folio} se está preparando en cocina.",
    "ready": "Hola {nombre}, tu pedido {folio} ya está listo. En breve sale a tu dirección.",
    "delivered": "Hola {nombre}, gracias por tu compra. Esperamos que disfrutes tu pedido {folio}.",
    "cancelled": "Hola {nombre}, tu pedido {folio} fue cancelado. Si tienes dudas contáctanos.",
}


def limpiar_telefono(telefono: str) -> str:
    digitos = re.sub(r"\D", "", telefono)
    if len(digitos) == 10:
        digitos = f"52{digitos}"
    return digitos


def generar_link_whatsapp(order: Order) -> str:
    plantilla = MENSAJES_POR_ESTADO.get(order.status, "Hola {nombre}, hay una actualización de tu pedido {folio}.")
    mensaje = plantilla.format(nombre=order.customer_name, folio=order.order_number)
    telefono = limpiar_telefono(order.customer_phone)
    return f"https://wa.me/{telefono}?text={quote(mensaje)}"
