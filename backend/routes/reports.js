const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database-mysql');

// Middleware de autenticación administrativa
const adminAuth = (req, res, next) => {
  const adminToken = req.headers.authorization;
  
  if (!adminToken || (adminToken !== 'Bearer admin-token' && adminToken !== 'Bearer dummy-admin-token')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado'
    });
  }
  
  next();
};

// GET /api/reports/dashboard - Estadísticas generales del dashboard
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    console.log('Generando reportes del dashboard...');
    
    // Obtener estadísticas de pedidos
    const ordersStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount END), 0) as delivered_revenue,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'delivered' THEN total_amount END), 0) as avg_order_value,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount END), 0) as today_revenue,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders
      FROM orders
    `);

    // Obtener estadísticas de clientes
    const customersStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_customers_month,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_customers_week
      FROM customers
    `);

    // Obtener estadísticas de menú
    const menuStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_items,
        COUNT(CASE WHEN is_popular = 1 THEN 1 END) as popular_items
      FROM menu_items
    `);

    // Obtener estadísticas de reseñas
    const reviewsStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews
      FROM reviews
    `);

    // Obtener ventas por categoría
    const salesByCategory = await executeQuery(`
      SELECT 
        mi.category,
        COUNT(oi.id) as items_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
      GROUP BY mi.category
      ORDER BY revenue DESC
    `);

    // Obtener ventas por día de la última semana
    const weeklySales = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE status = 'delivered' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Obtener productos más vendidos
    const topProducts = await executeQuery(`
      SELECT 
        mi.name,
        mi.category,
        SUM(oi.quantity) as total_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
      GROUP BY mi.id, mi.name, mi.category
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    const dashboardData = {
      orders: {
        total_orders: ordersStats[0].total_orders,
        completed_orders: ordersStats[0].completed_orders,
        pending_orders: ordersStats[0].pending_orders,
        cancelled_orders: ordersStats[0].cancelled_orders,
        today_orders: ordersStats[0].today_orders,
        today_revenue: parseFloat(ordersStats[0].today_revenue)
      },
      revenue: {
        total_revenue: parseFloat(ordersStats[0].total_revenue),
        delivered_revenue: parseFloat(ordersStats[0].delivered_revenue),
        avg_order_value: parseFloat(ordersStats[0].avg_order_value)
      },
      customers: customersStats[0],
      menu: menuStats[0],
      reviews: reviewsStats[0],
      salesByCategory,
      weeklySales,
      topProducts
    };

    console.log('Dashboard data generated successfully');
    
    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error generating dashboard reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/sales - Reporte de ventas
router.get('/sales', adminAuth, async (req, res) => {
  try {
    console.log('Generando reporte de ventas...');
    
    // Métricas de rendimiento básicas
    const performanceMetrics = await executeQuery(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as avg_order_value,
        COALESCE(MAX(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as max_order_value,
        COALESCE(MIN(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as min_order_value,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as successful_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        ROUND((COUNT(CASE WHEN status = 'delivered' THEN 1 END) / COUNT(*)) * 100, 2) as success_rate
      FROM orders
    `);

    // Ventas por categoría
    const salesByCategory = await executeQuery(`
      SELECT 
        mi.category,
        COUNT(oi.id) as items_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
        COALESCE(AVG(oi.quantity), 0) as avg_quantity_per_order
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
      GROUP BY mi.category
      ORDER BY revenue DESC
    `);

    const salesReport = {
      performanceMetrics: performanceMetrics[0],
      salesByCategory
    };

    console.log('Sales report generated successfully');
    
    res.json({
      success: true,
      data: salesReport
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/customers - Reporte de clientes
router.get('/customers', adminAuth, async (req, res) => {
  try {
    console.log('Generando reporte de clientes...');
    
    // Estadísticas generales de clientes
    const customerStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_customers_month,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_customers_week,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as new_customers_today
      FROM customers
    `);

    // Clientes más activos (por número de pedidos)
    const topCustomers = await executeQuery(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.email = o.customer_email
      GROUP BY c.id, c.name, c.email, c.phone
      HAVING total_orders > 0
      ORDER BY total_spent DESC
      LIMIT 20
    `);

    // Registro de nuevos clientes por mes
    const newCustomersByMonth = await executeQuery(`
      SELECT 
        YEAR(created_at) as year,
        MONTH(created_at) as month,
        COUNT(*) as new_customers
      FROM customers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year DESC, month DESC
    `);

    // Segmentación de clientes por valor
    const customerSegmentation = await executeQuery(`
      SELECT 
        CASE 
          WHEN total_spent >= 1000 THEN 'VIP (>$1000)'
          WHEN total_spent >= 500 THEN 'Alto Valor ($500-$999)'
          WHEN total_spent >= 200 THEN 'Medio Valor ($200-$499)'
          ELSE 'Bajo Valor (<$200)'
        END as segment,
        COUNT(*) as customer_count,
        COALESCE(SUM(total_spent), 0) as total_revenue
      FROM (
        SELECT 
          c.id,
          COALESCE(SUM(o.total_amount), 0) as total_spent
        FROM customers c
        LEFT JOIN orders o ON c.email = o.customer_email AND o.status = 'delivered'
        GROUP BY c.id
      ) customer_totals
      GROUP BY segment
      ORDER BY total_revenue DESC
    `);

    const customerReport = {
      stats: customerStats[0],
      topCustomers,
      newCustomersByMonth,
      segmentation: customerSegmentation
    };

    console.log('Customer report generated successfully');
    
    res.json({
      success: true,
      data: customerReport
    });

  } catch (error) {
    console.error('Error generating customer report:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/products - Reporte de productos
router.get('/products', adminAuth, async (req, res) => {
  try {
    console.log('Generando reporte de productos...');
    
    // Productos básicos
    const topSellingProducts = await executeQuery(`
      SELECT 
        mi.id,
        mi.name,
        mi.category,
        mi.price,
        mi.is_active,
        mi.is_popular,
        COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
      FROM menu_items mi
      LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
      GROUP BY mi.id, mi.name, mi.category, mi.price, mi.is_active, mi.is_popular
      ORDER BY total_quantity_sold DESC
      LIMIT 20
    `);

    // Rendimiento por categoría básico
    const categoryPerformance = await executeQuery(`
      SELECT 
        category,
        COUNT(*) as total_items,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_items,
        COALESCE(AVG(price), 0) as avg_price
      FROM menu_items
      GROUP BY category
      ORDER BY total_items DESC
    `);

    // Productos sin ventas
    const productsNoSales = await executeQuery(`
      SELECT 
        mi.id,
        mi.name,
        mi.category,
        mi.price,
        mi.created_at
      FROM menu_items mi
      LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
      WHERE oi.id IS NULL
      ORDER BY mi.created_at DESC
      LIMIT 10
    `);

    const productReport = {
      topSellingProducts,
      categoryPerformance,
      productsNoSales
    };

    console.log('Product report generated successfully');
    
    res.json({
      success: true,
      data: productReport
    });

  } catch (error) {
    console.error('Error generating product report:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
