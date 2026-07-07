from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import bearer_scheme, error_negocio, get_current_user, require_roles
from app.core.limiter import limiter
from app.models.admin_user import RolAdmin
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewModerar, ReviewOut
from app.services import audit_service

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("")
@limiter.limit("3/minute")
async def crear(request: Request, body: ReviewCreate, db: AsyncSession = Depends(get_db)):
    review = Review(**body.model_dump(), status="pending")
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return {"ok": True, "data": ReviewOut.model_validate(review)}


@router.get("")
@limiter.limit("60/minute")
async def listar(
    request: Request,
    status: str = "approved",
    menu_item_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    if status != "approved":
        credentials = await bearer_scheme(request)
        admin = await get_current_user(credentials, db)
        if admin.role != RolAdmin.ADMIN:
            raise error_negocio("No tienes permisos para acceder a este recurso", status_code=403)

    query = select(Review).where(Review.status == status)
    if menu_item_id is not None:
        query = query.where(Review.menu_item_id == menu_item_id)
    query = query.order_by(Review.created_at.desc())

    result = await db.execute(query)
    reviews = result.scalars().all()
    return {"ok": True, "data": [ReviewOut.model_validate(r) for r in reviews], "total": len(reviews)}


@router.put("/{review_id}/moderar")
async def moderar(
    review_id: int,
    body: ReviewModerar,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    if body.status not in ("approved", "rejected"):
        raise error_negocio(f"Estado de moderación inválido: {body.status}")

    review = await db.get(Review, review_id)
    if review is None:
        raise error_negocio("Reseña no encontrada", status_code=404)

    review.status = body.status
    await db.commit()
    await db.refresh(review)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="moderar", module="reseñas", entity_id=review_id, details=body.status
    )
    return {"ok": True, "data": ReviewOut.model_validate(review)}
