from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import error_negocio, require_roles
from app.models.admin_user import AdminUser, RolAdmin
from app.models.supply import Supply, SupplyMovement, TipoMovimientoInsumo
from app.schemas.supply import (
    ConteoRequest,
    MovementCreate,
    MovementOut,
    SupplyCreate,
    SupplyOut,
    SupplyUpdate,
)
from app.services import audit_service

router = APIRouter(prefix="/api/insumos", tags=["insumos"])

# ADMIN administra el catálogo; COCINA también puede consultar y registrar
# movimientos (salidas, mermas) porque es quien vive el inventario a diario.
VER_Y_MOVER = require_roles(RolAdmin.ADMIN, RolAdmin.COCINA)
SOLO_ADMIN = require_roles(RolAdmin.ADMIN)


@router.get("")
async def listar(
    activo: bool | None = None,
    bajo_stock: bool | None = None,
    db: AsyncSession = Depends(get_db),
    _user=Depends(VER_Y_MOVER),
):
    query = select(Supply)
    if activo is not None:
        query = query.where(Supply.is_active == activo)
    if bajo_stock:
        query = query.where(Supply.current_stock <= Supply.min_stock)
    query = query.order_by(Supply.name)

    result = await db.execute(query)
    insumos = result.scalars().all()

    # Última compra (ENTRADA con costo) por insumo, para referencia de recompra
    ultimas = await db.execute(
        select(
            SupplyMovement.supply_id,
            func.max(SupplyMovement.created_at).label("fecha"),
        )
        .where(SupplyMovement.type == TipoMovimientoInsumo.ENTRADA, SupplyMovement.unit_cost.isnot(None))
        .group_by(SupplyMovement.supply_id)
    )
    ultima_por_insumo = {fila.supply_id: fila.fecha for fila in ultimas.all()}

    data = []
    for i in insumos:
        item = SupplyOut.model_validate(i).model_dump()
        fecha = ultima_por_insumo.get(i.id)
        item["ultima_compra"] = fecha.isoformat() if fecha else None
        data.append(item)
    return {"ok": True, "data": data}


@router.post("")
async def crear(
    body: SupplyCreate,
    db: AsyncSession = Depends(get_db),
    admin: AdminUser = Depends(SOLO_ADMIN),
):
    existente = await db.execute(select(Supply).where(func.lower(Supply.name) == body.name.lower()))
    if existente.scalar_one_or_none() is not None:
        raise error_negocio(f"Ya existe un insumo llamado '{body.name}'")

    insumo = Supply(
        name=body.name,
        unit=body.unit,
        image=body.image,
        min_stock=body.min_stock,
        cost_per_unit=body.cost_per_unit,
        current_stock=body.initial_stock,
    )
    db.add(insumo)
    await db.flush()

    # El stock inicial queda trazado como una ENTRADA, nunca como stock "de la nada"
    if body.initial_stock > 0:
        db.add(
            SupplyMovement(
                supply_id=insumo.id,
                type=TipoMovimientoInsumo.ENTRADA,
                quantity=body.initial_stock,
                stock_before=Decimal("0"),
                stock_after=body.initial_stock,
                unit_cost=body.cost_per_unit if body.cost_per_unit > 0 else None,
                note="Inventario inicial",
                admin_user_id=admin.id,
            )
        )

    await db.commit()
    await db.refresh(insumo)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="crear", module="insumos", entity_id=insumo.id, details=insumo.name
    )
    return {"ok": True, "data": SupplyOut.model_validate(insumo)}


@router.put("/{insumo_id}")
async def actualizar(
    insumo_id: int,
    body: SupplyUpdate,
    db: AsyncSession = Depends(get_db),
    admin: AdminUser = Depends(SOLO_ADMIN),
):
    insumo = await db.get(Supply, insumo_id)
    if insumo is None:
        raise error_negocio("Insumo no encontrado", status_code=404)

    cambios = body.model_dump(exclude_unset=True)
    if "name" in cambios:
        duplicado = await db.execute(
            select(Supply).where(func.lower(Supply.name) == cambios["name"].lower(), Supply.id != insumo_id)
        )
        if duplicado.scalar_one_or_none() is not None:
            raise error_negocio(f"Ya existe un insumo llamado '{cambios['name']}'")

    for campo, valor in cambios.items():
        setattr(insumo, campo, valor)

    await db.commit()
    await db.refresh(insumo)
    await audit_service.registrar(
        db, admin_user_id=admin.id, action="actualizar", module="insumos", entity_id=insumo_id, details=insumo.name
    )
    return {"ok": True, "data": SupplyOut.model_validate(insumo)}


@router.post("/{insumo_id}/movimientos")
async def registrar_movimiento(
    insumo_id: int,
    body: MovementCreate,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(VER_Y_MOVER),
):
    insumo = await db.get(Supply, insumo_id)
    if insumo is None:
        raise error_negocio("Insumo no encontrado", status_code=404)
    if not insumo.is_active:
        raise error_negocio("El insumo está desactivado; actívalo antes de registrar movimientos")

    stock_antes = Decimal(insumo.current_stock)
    cantidad = body.quantity

    if body.type == TipoMovimientoInsumo.ENTRADA:
        if cantidad <= 0:
            raise error_negocio("La cantidad de una entrada debe ser mayor a 0")
        stock_despues = stock_antes + cantidad
        # Costo promedio ponderado: solo si la entrada trae costo
        if body.unit_cost is not None and body.unit_cost > 0:
            costo_actual = Decimal(insumo.cost_per_unit)
            insumo.cost_per_unit = (
                (stock_antes * costo_actual + cantidad * body.unit_cost) / stock_despues
            ).quantize(Decimal("0.01"))
    elif body.type in (TipoMovimientoInsumo.SALIDA, TipoMovimientoInsumo.MERMA):
        if cantidad <= 0:
            raise error_negocio("La cantidad debe ser mayor a 0")
        if cantidad > stock_antes:
            raise error_negocio(
                f"Stock insuficiente: hay {stock_antes} {insumo.unit} y se intenta descontar {cantidad}"
            )
        stock_despues = stock_antes - cantidad
    else:  # AJUSTE: la cantidad es el stock contado físicamente
        stock_despues = cantidad

    insumo.current_stock = stock_despues
    movimiento = SupplyMovement(
        supply_id=insumo.id,
        type=body.type,
        quantity=cantidad,
        stock_before=stock_antes,
        stock_after=stock_despues,
        unit_cost=body.unit_cost if body.type == TipoMovimientoInsumo.ENTRADA else None,
        note=body.note,
        admin_user_id=user.id,
    )
    db.add(movimiento)
    await db.commit()
    await db.refresh(movimiento)
    await db.refresh(insumo)
    await audit_service.registrar(
        db,
        admin_user_id=user.id,
        action=f"movimiento_{body.type.value.lower()}",
        module="insumos",
        entity_id=insumo.id,
        details=f"{insumo.name}: {body.type.value} {cantidad} {insumo.unit} (stock {stock_antes} → {stock_despues})",
    )
    return {
        "ok": True,
        "data": {
            "movimiento": MovementOut.model_validate(movimiento),
            "insumo": SupplyOut.model_validate(insumo),
        },
    }


@router.post("/conteo")
async def conteo_fisico(
    body: ConteoRequest,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(VER_Y_MOVER),
):
    """Conteo físico en lote: genera AJUSTE solo para los insumos cuyo conteo difiere."""
    ids = [linea.supply_id for linea in body.lineas]
    if len(ids) != len(set(ids)):
        raise error_negocio("Hay insumos repetidos en el conteo")

    result = await db.execute(select(Supply).where(Supply.id.in_(ids)))
    insumos = {s.id: s for s in result.scalars().all()}
    faltantes = set(ids) - set(insumos)
    if faltantes:
        raise error_negocio(f"Insumos inexistentes en el conteo: {sorted(faltantes)}")

    nota = body.note or "Conteo físico"
    ajustados = []
    sin_cambio = 0
    for linea in body.lineas:
        insumo = insumos[linea.supply_id]
        stock_antes = Decimal(insumo.current_stock)
        if linea.counted == stock_antes:
            sin_cambio += 1
            continue
        insumo.current_stock = linea.counted
        db.add(
            SupplyMovement(
                supply_id=insumo.id,
                type=TipoMovimientoInsumo.AJUSTE,
                quantity=linea.counted,
                stock_before=stock_antes,
                stock_after=linea.counted,
                note=nota,
                admin_user_id=user.id,
            )
        )
        ajustados.append({"supply_id": insumo.id, "name": insumo.name, "antes": str(stock_antes), "despues": str(linea.counted)})

    await db.commit()
    await audit_service.registrar(
        db,
        admin_user_id=user.id,
        action="conteo_fisico",
        module="insumos",
        entity_id=None,
        details=f"{len(ajustados)} ajustados, {sin_cambio} sin cambio",
    )
    return {"ok": True, "data": {"ajustados": ajustados, "sin_cambio": sin_cambio}}


@router.get("/{insumo_id}/movimientos")
async def historial(
    insumo_id: int,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    _user=Depends(VER_Y_MOVER),
):
    insumo = await db.get(Supply, insumo_id)
    if insumo is None:
        raise error_negocio("Insumo no encontrado", status_code=404)

    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    total = await db.scalar(
        select(func.count()).select_from(SupplyMovement).where(SupplyMovement.supply_id == insumo_id)
    )
    result = await db.execute(
        select(SupplyMovement, AdminUser.full_name)
        .outerjoin(AdminUser, SupplyMovement.admin_user_id == AdminUser.id)
        .where(SupplyMovement.supply_id == insumo_id)
        .order_by(SupplyMovement.created_at.desc(), SupplyMovement.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    filas = result.all()
    data = []
    for mov, nombre_usuario in filas:
        item = MovementOut.model_validate(mov).model_dump()
        item["usuario"] = nombre_usuario
        data.append(item)

    return {"ok": True, "data": data, "total": total, "page": page, "page_size": page_size}
