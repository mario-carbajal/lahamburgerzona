const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database-mysql');
const notificationService = require('../services/notificationService');

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

// Función para generar número de orden único
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${year}${month}${day}${random}`;
}

// Función para calcular tiempo estimado de entrega
function calculateEstimatedDeliveryTime(prepTime = 15) {
  const now = new Date();
  const estimatedMinutes = prepTime + 15; // 15 minutos adicionales para entrega
  now.setMinutes(now.getMinutes() + estimatedMinutes);
  return now;
}

// GET /api/orders - Obtener todas las órdenes (admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, sort = 'created_at', order = 'DESC' } = req.query;
    
    // Consulta simple que funciona con la estructura actual
    let query = 'SELECT * FROM orders';
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const orders = await executeQuery(query, params);
    
    // Obtener total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM orders';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countParams = status ? [status] : [];
    const [{ total }] = await executeQuery(countQuery, countParams);
    
    // Obtener items para cada orden
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        try {
          const items = await executeQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
          return {
            id: order.id,
            orderNumber: order.order_number,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            customerEmail: order.customer_email,
            deliveryAddress: order.delivery_address,
            deliveryInstructions: order.delivery_instructions || null,
            paymentMethod: order.payment_method || 'cash',
            paymentStatus: order.payment_status || 'pending',
            subtotal: parseFloat(order.subtotal || order.total_amount || 0),
            deliveryFee: parseFloat(order.delivery_fee || 0),
            tax: parseFloat(order.tax || 0),
            totalAmount: parseFloat(order.total_amount),
            status: order.status,
            estimatedDeliveryTime: order.estimated_delivery_time,
            actualDeliveryTime: order.actual_delivery_time,
            notes: order.notes,
            statusNotes: order.status_notes,
            cancelledAt: order.cancelled_at,
            cancellationReason: order.cancellation_reason,
            itemCount: items.length,
            itemsSummary: items.map(item => 
              item.menu_item_name || `Item ${item.menu_item_id || item.id}`
            ).join(', '),
            items: items,
            createdAt: order.created_at,
            updatedAt: order.updated_at
          };
        } catch (itemError) {
          console.error(`Error getting items for order ${order.id}:`, itemError);
          return {
            id: order.id,
            orderNumber: order.order_number,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            totalAmount: parseFloat(order.total_amount),
            status: order.status,
            itemCount: 0,
            itemsSummary: 'Sin items',
            items: [],
            createdAt: order.created_at,
            updatedAt: order.updated_at
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: ordersWithItems,
      total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/orders/:id - Obtener orden específica con items
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener orden
    const orderQuery = 'SELECT * FROM orders WHERE id = ?';
    const orders = await executeQuery(orderQuery, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }
    
    const order = orders[0];
    
    // Obtener items de la orden
    const itemsQuery = `
      SELECT oi.*, mi.name, mi.description, mi.image
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `;
    const items = await executeQuery(itemsQuery, [id]);
    
    // Obtener historial de estados
    const historyQuery = `
      SELECT * FROM order_status_history
      WHERE order_id = ?
      ORDER BY changed_at ASC
    `;
    const statusHistory = await executeQuery(historyQuery, [id]);
    
    res.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerEmail: order.customer_email,
        deliveryAddress: order.delivery_address,
        deliveryInstructions: order.delivery_instructions,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        subtotal: parseFloat(order.subtotal),
        deliveryFee: parseFloat(order.delivery_fee),
        tax: parseFloat(order.tax),
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        estimatedDeliveryTime: order.estimated_delivery_time,
        actualDeliveryTime: order.actual_delivery_time,
        notes: order.notes,
        statusNotes: order.status_notes,
        cancelledAt: order.cancelled_at,
        cancellationReason: order.cancellation_reason,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: items.map(item => ({
          id: item.id,
          menuItemId: item.menu_item_id,
          name: item.menu_item_name,
          description: item.description,
          image: item.image,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price),
          specialInstructions: item.special_instructions
        })),
        statusHistory: statusHistory.map(history => ({
          id: history.id,
          status: history.status,
          notes: history.notes,
          changedBy: history.changed_by,
          changedAt: history.changed_at
        }))
      }
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/orders - Crear nueva orden
router.post('/', [
  body('customer.name').notEmpty().withMessage('Nombre del cliente es requerido'),
  body('customer.phone').notEmpty().withMessage('Teléfono del cliente es requerido'),
  body('customer.address').notEmpty().withMessage('Dirección de entrega es requerida'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un item'),
  body('items.*.menuItemId').notEmpty().withMessage('ID del item es requerido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos de validación incorrectos',
        details: errors.array()
      });
    }

    const { customer, items, notes, paymentMethod = 'cash', deliveryInstructions } = req.body;

    // Obtener precios de los items desde la base de datos
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItemsQuery = 'SELECT id, name, price FROM menu_items WHERE id IN (?) AND is_active = 1';
    const menuItems = await executeQuery(menuItemsQuery, [menuItemIds]);
    
    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Algunos items no están disponibles'
      });
    }

    // Crear mapa de precios
    const priceMap = {};
    menuItems.forEach(item => {
      priceMap[item.id] = { price: parseFloat(item.price), name: item.name };
    });

    // Calcular totales
    let subtotal = 0;
    const processedItems = items.map(item => {
      const menuItem = priceMap[item.menuItemId];
      const unitPrice = menuItem.price;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      
      return {
        ...item,
        unitPrice,
        totalPrice,
        menuItemName: menuItem.name
      };
    });

    const deliveryFee = subtotal >= 200 ? 0 : 30;
    const tax = subtotal * 0.16;
    const totalAmount = subtotal + deliveryFee + tax;

    // Generar número de orden único
    const orderNumber = generateOrderNumber();
    
    // Calcular tiempo estimado de entrega
    const estimatedDeliveryTime = calculateEstimatedDeliveryTime();

    // Crear orden en la base de datos
    const orderQuery = `
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_email,
        delivery_address, delivery_instructions, payment_method,
        subtotal, delivery_fee, tax, total_amount, status,
        estimated_delivery_time, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const orderParams = [
      orderNumber,
      customer.name,
      customer.phone,
      customer.email || null,
      customer.address,
      deliveryInstructions || null,
      paymentMethod,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      'pending',
      estimatedDeliveryTime,
      notes || null
    ];

    const orderResult = await executeQuery(orderQuery, orderParams);
    const orderId = orderResult.insertId;

    // Insertar items de la orden
    const itemQuery = `
      INSERT INTO order_items (
        order_id, menu_item_id, menu_item_name, quantity,
        unit_price, total_price, special_instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const item of processedItems) {
      await executeQuery(itemQuery, [
        orderId,
        item.menuItemId,
        item.menuItemName,
        item.quantity,
        item.unitPrice,
        item.totalPrice,
        item.specialInstructions || null
      ]);
    }

    // Insertar estado inicial en el historial
    await executeQuery(
      'INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, ?, ?)',
      [orderId, 'pending', 'system']
    );

    // Obtener la orden completa creada
    const createdOrder = await executeQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    const orderItems = await executeQuery('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    // Enviar notificaciones
    await notificationService.notifyNewOrder({
      id: orderId,
      orderNumber,
      customer,
      totalAmount,
      estimatedDeliveryTime
    });

    res.status(201).json({
      success: true,
      data: {
        id: orderId,
        orderNumber,
        customer,
        items: orderItems.map(item => ({
          id: item.id,
          menuItemId: item.menu_item_id,
          name: item.menu_item_name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price),
          specialInstructions: item.special_instructions
        })),
        subtotal,
        deliveryFee,
        tax,
        totalAmount,
        status: 'pending',
        estimatedDeliveryTime,
        notes: notes || null,
        createdAt: createdOrder[0].created_at
      },
      message: 'Orden creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/orders/:id/status - Actualizar estado de la orden
router.put('/:id/status', adminAuth, [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    .withMessage('Estado inválido')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, changedBy = 'admin' } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido',
        details: errors.array()
      });
    }

    // Verificar que la orden existe
    const orderExists = await executeQuery('SELECT * FROM orders WHERE id = ?', [id]);
    if (orderExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    const order = orderExists[0];

    // Validar transición de estado
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `No se puede cambiar de ${order.status} a ${status}`
      });
    }

    // Actualizar orden
    let updateQuery = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP';
    let updateParams = [status];

    if (status === 'cancelled') {
      updateQuery += ', cancelled_at = CURRENT_TIMESTAMP';
      if (notes) {
        updateQuery += ', cancellation_reason = ?';
        updateParams.push(notes);
      }
    } else if (status === 'delivered') {
      updateQuery += ', actual_delivery_time = CURRENT_TIMESTAMP';
    }

    if (status !== 'cancelled' && notes) {
      updateQuery += ', status_notes = ?';
      updateParams.push(notes);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await executeQuery(updateQuery, updateParams);

    // Insertar en historial
    await executeQuery(
      'INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, ?, ?, ?)',
      [id, status, notes || null, changedBy]
    );

    // Obtener orden actualizada
    const updatedOrder = await executeQuery('SELECT * FROM orders WHERE id = ?', [id]);

    // Enviar notificación al cliente
    await notificationService.notifyStatusChange({
      id,
      orderNumber: order.order_number,
      status,
      customerPhone: order.customer_phone,
      notes
    });

    res.json({
      success: true,
      data: updatedOrder[0],
      message: 'Estado actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/orders/customer/:phone - Obtener órdenes por teléfono
router.get('/customer/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    const orders = await executeQuery(`
      SELECT o.*, 
             COUNT(oi.id) as item_count,
             GROUP_CONCAT(oi.menu_item_name) as items_summary
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_phone = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [phone]);

    res.json({
      success: true,
      data: orders.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        itemCount: order.item_count,
        itemsSummary: order.items_summary,
        createdAt: order.created_at,
        estimatedDeliveryTime: order.estimated_delivery_time
      })),
      total: orders.length
    });
  } catch (error) {
    console.error('Error getting customer orders:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/orders/stats/summary - Obtener estadísticas de pedidos
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let dateCondition = '';
    const params = [];
    
    switch (period) {
      case 'today':
        dateCondition = 'DATE(created_at) = CURDATE()';
        break;
      case 'week':
        dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
        break;
      case 'month':
        dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        break;
      case 'year':
        dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
        COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders
      ${dateCondition ? 'WHERE ' + dateCondition : ''}
    `;

    const [stats] = await executeQuery(statsQuery, params);

    res.json({
      success: true,
      data: {
        totalOrders: parseInt(stats.total_orders) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        averageOrderValue: parseFloat(stats.average_order_value) || 0,
        statusBreakdown: {
          pending: parseInt(stats.pending_orders) || 0,
          confirmed: parseInt(stats.confirmed_orders) || 0,
          preparing: parseInt(stats.preparing_orders) || 0,
          ready: parseInt(stats.ready_orders) || 0,
          delivered: parseInt(stats.delivered_orders) || 0,
          cancelled: parseInt(stats.cancelled_orders) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/orders/:id - Cancelar orden
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const orderExists = await executeQuery('SELECT * FROM orders WHERE id = ?', [id]);
    if (orderExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    const order = orderExists[0];
    
    // Solo permitir cancelar órdenes pendientes o confirmadas
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'No se puede cancelar una orden en este estado'
      });
    }

    // Actualizar orden
    await executeQuery(
      'UPDATE orders SET status = ?, cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', reason || 'Cancelado por el administrador', id]
    );

    // Insertar en historial
    await executeQuery(
      'INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, ?, ?, ?)',
      [id, 'cancelled', reason || 'Cancelado por el administrador', 'admin']
    );

    // Notificar cancelación
    await notificationService.notifyCancellation({
      id,
      orderNumber: order.order_number,
      customerPhone: order.customer_phone,
      reason: reason || 'Cancelado por el administrador'
    });

    res.json({
      success: true,
      message: 'Orden cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/orders/send-message - Enviar mensaje personalizado por WhatsApp
router.post('/send-message', adminAuth, [
  body('phone').notEmpty().withMessage('Número de teléfono es requerido'),
  body('message').notEmpty().withMessage('Mensaje es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos de validación incorrectos',
        details: errors.array()
      });
    }

    const { phone, message } = req.body;
    
    const result = await notificationService.sendCustomMessage(phone, message);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Mensaje enviado exitosamente',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending custom message:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/orders/send-daily-report - Enviar reporte diario
router.post('/send-daily-report', adminAuth, async (req, res) => {
  try {
    const { date } = req.body;
    
    let dateCondition = '';
    let params = [];
    
    if (date) {
      dateCondition = 'DATE(created_at) = ?';
      params.push(date);
    } else {
      dateCondition = 'DATE(created_at) = CURDATE()';
    }
    
    // Obtener órdenes del día
    const orders = await executeQuery(`
      SELECT order_number, total_amount, status, created_at
      FROM orders
      WHERE ${dateCondition}
      ORDER BY created_at DESC
    `, params);
    
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
    
    const period = date ? new Date(date).toLocaleDateString('es-MX') : 'Hoy';
    
    const result = await notificationService.sendDailyReport(orders, totalRevenue, period);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Reporte diario enviado exitosamente',
        data: {
          period,
          totalOrders: orders.length,
          totalRevenue,
          averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending daily report:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/orders/test - Endpoint de prueba para verificar base de datos
router.get('/test', adminAuth, async (req, res) => {
  try {
    // Verificar si la tabla orders existe
    const tableCheck = await executeQuery('SHOW TABLES LIKE "orders"');
    
    if (tableCheck.length === 0) {
      return res.json({
        success: false,
        error: 'Tabla orders no existe'
      });
    }
    
    // Contar registros
    const countResult = await executeQuery('SELECT COUNT(*) as count FROM orders');
    const count = countResult[0].count;
    
    // Obtener una muestra de datos
    const sampleData = await executeQuery('SELECT * FROM orders LIMIT 3');
    
    // Verificar estructura de la tabla
    const structure = await executeQuery('DESCRIBE orders');
    
    res.json({
      success: true,
      data: {
        tableExists: true,
        recordCount: count,
        sampleData: sampleData,
        structure: structure
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// GET /api/orders/simple - Endpoint simple para debuggear
router.get('/simple', adminAuth, async (req, res) => {
  try {
    const orders = await executeQuery('SELECT * FROM orders LIMIT 5');
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error in simple endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;