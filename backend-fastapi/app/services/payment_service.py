import mercadopago

from app.core.config import settings
from app.models.order import Order


def _sdk() -> mercadopago.SDK:
    return mercadopago.SDK(settings.mp_access_token)


def crear_preferencia(order: Order) -> dict:
    # Con descuento (cupón) no se puede mandar un item de precio negativo a MP:
    # se consolida todo el pedido en un solo item por el total exacto.
    if order.discount and float(order.discount) > 0:
        items = [
            {
                "title": f"Pedido {order.order_number} (incluye descuento {order.coupon_code or ''})".strip(),
                "quantity": 1,
                "unit_price": float(order.total_amount),
                "currency_id": "MXN",
            }
        ]
    else:
        items = [
            {
                "title": item.menu_item_name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "currency_id": "MXN",
            }
            for item in order.items
        ]
        if order.delivery_fee and float(order.delivery_fee) > 0:
            items.append(
                {
                    "title": "Envío",
                    "quantity": 1,
                    "unit_price": float(order.delivery_fee),
                    "currency_id": "MXN",
                }
            )

    preference_data = {
        "items": items,
        "external_reference": str(order.id),
        "back_urls": {
            "success": f"{settings.frontend_base_url}/pago-resultado?status=success&order_id={order.id}",
            "failure": f"{settings.frontend_base_url}/pago-resultado?status=failure&order_id={order.id}",
            "pending": f"{settings.frontend_base_url}/pago-resultado?status=pending&order_id={order.id}",
        },
        "auto_return": "approved",
        "notification_url": f"{settings.public_base_url}/api/payments/webhook",
    }

    payer = {}
    if order.customer_name:
        payer["name"] = order.customer_name
    if order.customer_email:
        payer["email"] = order.customer_email
    if payer:
        preference_data["payer"] = payer

    result = _sdk().preference().create(preference_data)
    preference = result["response"]
    return {"init_point": preference["init_point"], "preference_id": preference["id"]}


def obtener_pago(payment_id: str) -> dict:
    result = _sdk().payment().get(payment_id)
    return result["response"]
