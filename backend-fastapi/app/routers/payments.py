from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import error_negocio
from app.core.limiter import limiter
from app.models.order import Order
from app.schemas.payment import PaymentPreferenceOut, PaymentPreferenceRequest
from app.services import payment_service

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Mapeo de estados de pago de Mercado Pago a los estados internos del pedido
ESTADO_MP_A_INTERNO = {
    "approved": "paid",
    "pending": "pending",
    "in_process": "pending",
    "rejected": "rejected",
    "cancelled": "cancelled",
    "refunded": "refunded",
}


@router.post("/preference")
@limiter.limit("5/minute")
async def crear_preferencia(
    request: Request,
    body: PaymentPreferenceRequest,
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(Order, body.order_id, options=[selectinload(Order.items)])
    if order is None:
        raise error_negocio("Pedido no encontrado", status_code=404)
    if order.payment_status == "paid":
        raise error_negocio("Este pedido ya fue pagado")

    try:
        preferencia = payment_service.crear_preferencia(order)
    except Exception:
        raise error_negocio("No se pudo generar el enlace de pago. Intenta de nuevo en unos momentos.")

    order.mp_preference_id = preferencia["preference_id"]
    await db.commit()

    return {"ok": True, "data": PaymentPreferenceOut(**preferencia)}


@router.post("/webhook")
@limiter.exempt
async def webhook(request: Request, db: AsyncSession = Depends(get_db)):
    params = request.query_params
    payment_id = params.get("data.id") or params.get("id")
    notif_type = params.get("type") or params.get("topic")

    if not payment_id:
        try:
            body = await request.json()
        except Exception:
            body = {}
        payment_id = payment_id or (body.get("data") or {}).get("id")
        notif_type = notif_type or body.get("type")

    if notif_type != "payment" or not payment_id:
        return {"ok": True}

    try:
        pago = payment_service.obtener_pago(payment_id)
    except Exception:
        return {"ok": True}

    order_id = pago.get("external_reference")
    if not order_id:
        return {"ok": True}

    order = await db.get(Order, int(order_id))
    if order is None:
        return {"ok": True}

    order.mp_payment_id = str(payment_id)
    order.payment_status = ESTADO_MP_A_INTERNO.get(pago.get("status"), pago.get("status"))
    await db.commit()

    return {"ok": True}
