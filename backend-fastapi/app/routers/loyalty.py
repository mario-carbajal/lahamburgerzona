from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.limiter import limiter
from app.services import loyalty_service

router = APIRouter(prefix="/api/loyalty", tags=["loyalty"])


@router.get("/consulta")
@limiter.limit("10/minute")
async def consulta(
    request: Request,
    phone: str = Query(..., min_length=10, max_length=20),
    db: AsyncSession = Depends(get_db),
):
    """Consulta pública de puntos por teléfono (para el checkout).

    Siempre responde 200 con el saldo (0 si no hay cuenta) para no revelar
    qué teléfonos son clientes registrados.
    """
    cliente = await loyalty_service.buscar_cliente(db, None, phone)
    puntos = cliente.loyalty_points if cliente is not None else 0
    _, valor_punto = await loyalty_service._config(db)
    return {
        "ok": True,
        "data": {
            "points": puntos,
            "valor_punto": valor_punto,
            "valor_en_pesos": round(puntos * valor_punto, 2),
        },
    }
