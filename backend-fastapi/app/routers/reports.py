from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/api/reports", tags=["reports"])


async def _row(db: AsyncSession, sql: str) -> dict:
    result = await db.execute(text(sql))
    row = result.mappings().first()
    return dict(row) if row else {}


async def _rows(db: AsyncSession, sql: str) -> list[dict]:
    result = await db.execute(text(sql))
    return [dict(r) for r in result.mappings().all()]


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db), _user: AdminUser = Depends(get_current_user)):
    orders_stats = await _row(
        db,
        """
        SELECT
            COUNT(*) as total_orders,
            COUNT(*) FILTER (WHERE status = 'delivered') as completed_orders,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
            COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
            COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) as delivered_revenue,
            COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) as total_revenue,
            COALESCE(AVG(total_amount) FILTER (WHERE status = 'delivered'), 0) as avg_order_value,
            COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = CURRENT_DATE), 0) as today_revenue,
            COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as today_orders
        FROM orders
        """,
    )
    customers_stats = await _row(
        db,
        """
        SELECT
            COUNT(*) as total_customers,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_customers_month,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_customers_week
        FROM customers
        """,
    )
    menu_stats = await _row(
        db,
        """
        SELECT
            COUNT(*) as total_items,
            COUNT(*) FILTER (WHERE is_active) as active_items,
            COUNT(*) FILTER (WHERE is_popular) as popular_items
        FROM menu_items
        """,
    )
    reviews_stats = await _row(
        db,
        """
        SELECT
            COUNT(*) as total_reviews,
            COALESCE(AVG(rating), 0) as avg_rating,
            COUNT(*) FILTER (WHERE rating >= 4) as positive_reviews
        FROM reviews
        """,
    )
    sales_by_category = await _rows(
        db,
        """
        SELECT mi.category, COUNT(oi.id) as items_sold, COALESCE(SUM(oi.total_price), 0) as revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'delivered'
        GROUP BY mi.category
        ORDER BY revenue DESC
        """,
    )
    weekly_sales = await _rows(
        db,
        """
        SELECT
            created_at::date as date,
            COUNT(*) as orders_count,
            COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) as revenue,
            COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY created_at::date
        ORDER BY date ASC
        """,
    )
    top_products = await _rows(
        db,
        """
        SELECT mi.name, mi.category, SUM(oi.quantity) as total_sold,
            COALESCE(SUM(oi.total_price) FILTER (WHERE o.status != 'cancelled'), 0) as revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        GROUP BY mi.id, mi.name, mi.category
        ORDER BY total_sold DESC
        LIMIT 10
        """,
    )
    comparativa = await _row(
        db,
        """
        SELECT
            COALESCE(SUM(total_amount) FILTER (
                WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '7 days'
            ), 0) as ventas_semana_actual,
            COALESCE(SUM(total_amount) FILTER (
                WHERE status != 'cancelled'
                AND created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'
            ), 0) as ventas_semana_anterior,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as pedidos_semana_actual,
            COUNT(*) FILTER (
                WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'
            ) as pedidos_semana_anterior,
            COALESCE(SUM(total_amount) FILTER (
                WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '30 days'
            ), 0) as ventas_mes_actual,
            COALESCE(SUM(total_amount) FILTER (
                WHERE status != 'cancelled'
                AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'
            ), 0) as ventas_mes_anterior
        FROM orders
        """,
    )

    def cambio_pct(actual, anterior) -> float | None:
        actual, anterior = float(actual or 0), float(anterior or 0)
        if anterior == 0:
            return None if actual == 0 else 100.0
        return round((actual - anterior) / anterior * 100, 1)

    comparativa["cambio_ventas_semana_pct"] = cambio_pct(
        comparativa["ventas_semana_actual"], comparativa["ventas_semana_anterior"]
    )
    comparativa["cambio_pedidos_semana_pct"] = cambio_pct(
        comparativa["pedidos_semana_actual"], comparativa["pedidos_semana_anterior"]
    )
    comparativa["cambio_ventas_mes_pct"] = cambio_pct(
        comparativa["ventas_mes_actual"], comparativa["ventas_mes_anterior"]
    )

    return {
        "ok": True,
        "data": {
            "orders": orders_stats,
            "revenue": {
                "total_revenue": orders_stats.get("total_revenue"),
                "delivered_revenue": orders_stats.get("delivered_revenue"),
                "avg_order_value": orders_stats.get("avg_order_value"),
            },
            "customers": customers_stats,
            "menu": menu_stats,
            "reviews": reviews_stats,
            "sales_by_category": sales_by_category,
            "weekly_sales": weekly_sales,
            "top_products": top_products,
            "comparativa": comparativa,
        },
    }


@router.get("/ventas")
async def ventas(db: AsyncSession = Depends(get_db), _user: AdminUser = Depends(get_current_user)):
    performance = await _row(
        db,
        """
        SELECT
            COUNT(*) as total_orders,
            COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) as total_revenue,
            COALESCE(AVG(total_amount) FILTER (WHERE status != 'cancelled'), 0) as avg_order_value,
            COALESCE(MAX(total_amount) FILTER (WHERE status != 'cancelled'), 0) as max_order_value,
            COALESCE(MIN(total_amount) FILTER (WHERE status != 'cancelled'), 0) as min_order_value,
            COUNT(*) FILTER (WHERE status = 'delivered') as successful_orders,
            COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
            ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as success_rate
        FROM orders
        """,
    )
    sales_by_category = await _rows(
        db,
        """
        SELECT mi.category, COUNT(oi.id) as items_sold, COALESCE(SUM(oi.total_price), 0) as revenue,
            COALESCE(AVG(oi.quantity), 0) as avg_quantity_per_order
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'delivered'
        GROUP BY mi.category
        ORDER BY revenue DESC
        """,
    )
    return {"ok": True, "data": {"performance": performance, "sales_by_category": sales_by_category}}


@router.get("/clientes")
async def clientes(db: AsyncSession = Depends(get_db), _user: AdminUser = Depends(get_current_user)):
    stats = await _row(
        db,
        """
        SELECT
            COUNT(*) as total_customers,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_customers_month,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_customers_week,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as new_customers_today
        FROM customers
        """,
    )
    top_customers = await _rows(
        db,
        """
        SELECT c.id, c.name, c.email, c.phone,
            COUNT(o.id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_spent,
            COALESCE(AVG(o.total_amount), 0) as avg_order_value,
            MAX(o.created_at) as last_order_date
        FROM customers c
        LEFT JOIN orders o ON c.email = o.customer_email
        GROUP BY c.id, c.name, c.email, c.phone
        HAVING COUNT(o.id) > 0
        ORDER BY total_spent DESC
        LIMIT 20
        """,
    )
    segmentation = await _rows(
        db,
        """
        SELECT
            CASE
                WHEN total_spent >= 1000 THEN 'VIP (>1000)'
                WHEN total_spent >= 500 THEN 'Alto valor (500-999)'
                WHEN total_spent >= 200 THEN 'Medio valor (200-499)'
                ELSE 'Bajo valor (<200)'
            END as segment,
            COUNT(*) as customer_count,
            COALESCE(SUM(total_spent), 0) as total_revenue
        FROM (
            SELECT c.id, COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM customers c
            LEFT JOIN orders o ON c.email = o.customer_email AND o.status = 'delivered'
            GROUP BY c.id
        ) customer_totals
        GROUP BY segment
        ORDER BY total_revenue DESC
        """,
    )
    return {
        "ok": True,
        "data": {"stats": stats, "top_customers": top_customers, "segmentation": segmentation},
    }


@router.get("/productos")
async def productos(db: AsyncSession = Depends(get_db), _user: AdminUser = Depends(get_current_user)):
    top_selling = await _rows(
        db,
        """
        SELECT mi.id, mi.name, mi.category, mi.price, mi.is_active, mi.is_popular,
            COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
            COALESCE(SUM(oi.total_price), 0) as total_revenue
        FROM menu_items mi
        LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
        GROUP BY mi.id, mi.name, mi.category, mi.price, mi.is_active, mi.is_popular
        ORDER BY total_quantity_sold DESC
        LIMIT 20
        """,
    )
    category_performance = await _rows(
        db,
        """
        SELECT category, COUNT(*) as total_items,
            COUNT(*) FILTER (WHERE is_active) as active_items,
            COALESCE(AVG(price), 0) as avg_price
        FROM menu_items
        GROUP BY category
        ORDER BY total_items DESC
        """,
    )
    no_sales = await _rows(
        db,
        """
        SELECT mi.id, mi.name, mi.category, mi.price, mi.created_at
        FROM menu_items mi
        LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
        WHERE oi.id IS NULL
        ORDER BY mi.created_at DESC
        LIMIT 10
        """,
    )
    return {
        "ok": True,
        "data": {
            "top_selling_products": top_selling,
            "category_performance": category_performance,
            "products_no_sales": no_sales,
        },
    }


@router.get("/cocina")
async def cocina(db: AsyncSession = Depends(get_db), _user: AdminUser = Depends(get_current_user)):
    stats = await _row(
        db,
        """
        SELECT
            COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
            COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
            COUNT(*) FILTER (WHERE status = 'preparing') as in_progress_orders,
            COUNT(*) FILTER (WHERE status = 'ready' AND created_at::date = CURRENT_DATE) as completed_today,
            COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) FILTER (WHERE status = 'delivered'), 0) as avg_prep_time
        FROM orders
        WHERE status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered')
        """,
    )
    return {"ok": True, "data": stats}


@router.get("/entregas")
async def entregas(db: AsyncSession = Depends(get_db), _user: AdminUser = Depends(get_current_user)):
    stats = await _row(
        db,
        """
        SELECT
            COUNT(*) FILTER (WHERE status = 'ready') as ready_orders,
            COUNT(*) FILTER (WHERE status = 'delivered' AND created_at::date = CURRENT_DATE) as delivered_today,
            COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) FILTER (WHERE status = 'delivered'), 0) as avg_delivery_time
        FROM orders
        WHERE status IN ('ready', 'delivered')
        """,
    )
    return {"ok": True, "data": stats}


@router.get("/caja")
async def caja(db: AsyncSession = Depends(get_db), _user: AdminUser = Depends(get_current_user)):
    stats = await _row(
        db,
        """
        SELECT
            COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = CURRENT_DATE AND status != 'cancelled'), 0) as today_revenue,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
            COUNT(*) FILTER (WHERE status = 'delivered' AND created_at::date = CURRENT_DATE) as completed_payments,
            COALESCE(AVG(total_amount) FILTER (WHERE status != 'cancelled'), 0) as avg_order_value
        FROM orders
        """,
    )
    return {"ok": True, "data": stats}


@router.get("/insumos")
async def insumos(
    dias: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
):
    """Consumo, mermas y compras de insumos en el período (valuados al costo actual)."""
    # `dias` es un int validado por FastAPI; es seguro interpolarlo en el INTERVAL
    por_insumo = await _rows(
        db,
        f"""
        SELECT
            s.id, s.name, s.unit, s.cost_per_unit,
            COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'SALIDA'), 0) as consumo,
            COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'MERMA'), 0) as merma,
            COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'ENTRADA'), 0) as entradas,
            ROUND(COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'SALIDA'), 0) * s.cost_per_unit, 2) as consumo_valor,
            ROUND(COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'MERMA'), 0) * s.cost_per_unit, 2) as merma_valor,
            ROUND(COALESCE(SUM(m.quantity * m.unit_cost) FILTER (WHERE m.type = 'ENTRADA' AND m.unit_cost IS NOT NULL), 0), 2) as compras_valor
        FROM supplies s
        JOIN supply_movements m ON m.supply_id = s.id
        WHERE m.created_at >= NOW() - INTERVAL '{dias} days'
        GROUP BY s.id, s.name, s.unit, s.cost_per_unit
        ORDER BY consumo_valor DESC
        """,
    )
    totales = {
        "consumo_valor": round(sum(float(r["consumo_valor"]) for r in por_insumo), 2),
        "merma_valor": round(sum(float(r["merma_valor"]) for r in por_insumo), 2),
        "compras_valor": round(sum(float(r["compras_valor"]) for r in por_insumo), 2),
    }
    base = totales["consumo_valor"] + totales["merma_valor"]
    # % del valor que se fue a la basura respecto a todo lo que salió de inventario
    totales["merma_pct"] = round(totales["merma_valor"] / base * 100, 1) if base > 0 else 0.0

    valor_inventario = await _row(
        db,
        "SELECT ROUND(COALESCE(SUM(current_stock * cost_per_unit), 0), 2) as valor FROM supplies WHERE is_active",
    )
    totales["inventario_actual_valor"] = float(valor_inventario.get("valor", 0))

    return {"ok": True, "data": {"dias": dias, "por_insumo": por_insumo, "totales": totales}}
