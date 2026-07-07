from fastapi import APIRouter, Depends, Request
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import error_negocio, require_roles
from app.core.limiter import limiter
from app.models.admin_user import RolAdmin
from app.models.menu_item import MenuItem, MenuItemExtra
from app.models.supply import MenuItemSupply, Supply
from app.schemas.menu import ExtraOut, ExtrasUpdate, MenuItemCreate, MenuItemOut, MenuItemUpdate
from app.schemas.supply import RecetaUpdate
from app.services import audit_service

router = APIRouter(prefix="/api/menu", tags=["menu"])


@router.get("")
@limiter.limit("60/minute")
async def listar(
    request: Request,
    categoria: str | None = None,
    activo: bool | None = None,
    busqueda: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(MenuItem)
    if categoria:
        query = query.where(MenuItem.category == categoria)
    if activo is not None:
        query = query.where(MenuItem.is_active == activo)
    if busqueda:
        query = query.where(MenuItem.name.ilike(f"%{busqueda}%"))
    query = query.order_by(MenuItem.category, MenuItem.name)

    result = await db.execute(query)
    items = result.scalars().all()
    return {"ok": True, "data": [MenuItemOut.model_validate(i) for i in items], "total": len(items)}


@router.get("/{item_id}")
async def detalle(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(MenuItem, item_id)
    if item is None:
        raise error_negocio("Producto de menú no encontrado", status_code=404)
    return {"ok": True, "data": MenuItemOut.model_validate(item)}


@router.post("")
async def crear(
    body: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    item = MenuItem(**body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="crear", module="menu", entity_id=item.id, details=item.name
    )
    return {"ok": True, "data": MenuItemOut.model_validate(item)}


@router.put("/{item_id}")
async def actualizar(
    item_id: int,
    body: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    item = await db.get(MenuItem, item_id)
    if item is None:
        raise error_negocio("Producto de menú no encontrado", status_code=404)

    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(item, campo, valor)

    await db.commit()
    await db.refresh(item)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="actualizar", module="menu", entity_id=item.id, details=item.name
    )
    return {"ok": True, "data": MenuItemOut.model_validate(item)}


@router.delete("/{item_id}")
async def desactivar(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    item = await db.get(MenuItem, item_id)
    if item is None:
        raise error_negocio("Producto de menú no encontrado", status_code=404)

    item.is_active = False
    await db.commit()
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="desactivar", module="menu", entity_id=item_id, details=item.name
    )
    return {"ok": True, "data": {"mensaje": "Producto desactivado"}}


# ── Extras con precio por producto (ej. "Doble carne" +$25) ──


@router.get("/{item_id}/extras")
@limiter.limit("60/minute")
async def listar_extras(
    request: Request,
    item_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Público: el sitio muestra los extras disponibles al agregar al carrito."""
    item = await db.get(MenuItem, item_id)
    if item is None:
        raise error_negocio("Producto de menú no encontrado", status_code=404)

    result = await db.execute(
        select(MenuItemExtra)
        .where(MenuItemExtra.menu_item_id == item_id, MenuItemExtra.is_active.is_(True))
        .order_by(MenuItemExtra.id)
    )
    extras = result.scalars().all()
    return {"ok": True, "data": [ExtraOut.model_validate(e) for e in extras]}


@router.put("/{item_id}/extras")
async def actualizar_extras(
    item_id: int,
    body: ExtrasUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    item = await db.get(MenuItem, item_id)
    if item is None:
        raise error_negocio("Producto de menú no encontrado", status_code=404)

    nombres = [e.name.strip().lower() for e in body.extras]
    if len(nombres) != len(set(nombres)):
        raise error_negocio("Hay extras con el mismo nombre; usa nombres distintos")

    # Reemplazo total: los pedidos pasados no se afectan (guardan snapshot propio)
    await db.execute(delete(MenuItemExtra).where(MenuItemExtra.menu_item_id == item_id))
    nuevos = [
        MenuItemExtra(menu_item_id=item_id, name=e.name.strip(), price=e.price, is_active=e.is_active)
        for e in body.extras
    ]
    db.add_all(nuevos)
    await db.commit()

    await audit_service.registrar(
        db,
        admin_user_id=admin.id,
        action="actualizar_extras",
        module="menu",
        entity_id=item_id,
        details=f"{item.name}: {len(nuevos)} extras",
    )
    result = await db.execute(
        select(MenuItemExtra).where(MenuItemExtra.menu_item_id == item_id).order_by(MenuItemExtra.id)
    )
    return {"ok": True, "data": [ExtraOut.model_validate(e) for e in result.scalars().all()]}


# ── Receta (insumos por producto, base del descuento automático) ──


@router.get("/{item_id}/receta")
async def obtener_receta(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_roles(RolAdmin.ADMIN, RolAdmin.COCINA)),
):
    item = await db.get(MenuItem, item_id)
    if item is None:
        raise error_negocio("Producto de menú no encontrado", status_code=404)

    result = await db.execute(
        select(MenuItemSupply)
        .options(selectinload(MenuItemSupply.supply))
        .where(MenuItemSupply.menu_item_id == item_id)
    )
    lineas = result.scalars().all()

    data = []
    food_cost = 0.0
    for linea in lineas:
        costo = float(linea.quantity) * float(linea.supply.cost_per_unit)
        food_cost += costo
        data.append(
            {
                "supply_id": linea.supply_id,
                "name": linea.supply.name,
                "unit": linea.supply.unit,
                "image": linea.supply.image,
                "quantity": str(linea.quantity),
                "cost_per_unit": str(linea.supply.cost_per_unit),
                "line_cost": round(costo, 2),
                "supply_active": linea.supply.is_active,
            }
        )

    return {
        "ok": True,
        "data": {
            "menu_item_id": item_id,
            "menu_item_name": item.name,
            "price": float(item.price),
            "lineas": data,
            "food_cost": round(food_cost, 2),
        },
    }


@router.put("/{item_id}/receta")
async def actualizar_receta(
    item_id: int,
    body: RecetaUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    item = await db.get(MenuItem, item_id)
    if item is None:
        raise error_negocio("Producto de menú no encontrado", status_code=404)

    supply_ids = [linea.supply_id for linea in body.lineas]
    if len(supply_ids) != len(set(supply_ids)):
        raise error_negocio("La receta tiene insumos repetidos; combínalos en una sola línea")

    if supply_ids:
        result = await db.execute(select(Supply.id).where(Supply.id.in_(supply_ids)))
        existentes = {fila for (fila,) in result.all()}
        faltantes = set(supply_ids) - existentes
        if faltantes:
            raise error_negocio(f"Insumos inexistentes en la receta: {sorted(faltantes)}")

    # Estrategia reemplazo total: la receta enviada es la verdad completa
    await db.execute(delete(MenuItemSupply).where(MenuItemSupply.menu_item_id == item_id))
    for linea in body.lineas:
        db.add(MenuItemSupply(menu_item_id=item_id, supply_id=linea.supply_id, quantity=linea.quantity))

    await db.commit()
    await audit_service.registrar(
        db,
        admin_user_id=admin.id,
        action="actualizar_receta",
        module="menu",
        entity_id=item_id,
        details=f"{item.name}: {len(body.lineas)} insumos",
    )
    return await obtener_receta(item_id, db=db, _user=admin)
