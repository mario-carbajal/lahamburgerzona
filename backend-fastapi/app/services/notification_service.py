import logging

from twilio.rest import Client

from app.core.config import settings
from app.models.order import Order
from app.services.whatsapp_service import MENSAJES_POR_ESTADO, limpiar_telefono

logger = logging.getLogger(__name__)


def _cliente() -> Client:
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def notificar_cambio_estado(order: Order) -> None:
    """Envía por WhatsApp (Twilio) un aviso automático del estado del pedido.

    Best-effort: cualquier fallo (credenciales no configuradas, número no
    registrado en el sandbox, error de Twilio) solo se registra en el log y
    nunca interrumpe el cambio de estado real del pedido."""
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_whatsapp_from:
        logger.info("Notificación WhatsApp omitida: Twilio no está configurado")
        return

    plantilla = MENSAJES_POR_ESTADO.get(
        order.status, "Hola {nombre}, hay una actualización de tu pedido {folio}."
    )
    mensaje = plantilla.format(nombre=order.customer_name, folio=order.order_number)
    telefono = limpiar_telefono(order.customer_phone)

    try:
        _cliente().messages.create(
            from_=f"whatsapp:{settings.twilio_whatsapp_from}",
            to=f"whatsapp:+{telefono}",
            body=mensaje,
        )
        logger.info("Notificación WhatsApp enviada para pedido %s (estado: %s)", order.order_number, order.status)
    except Exception:
        logger.exception("Error al enviar notificación WhatsApp para pedido %s", order.order_number)
