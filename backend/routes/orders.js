const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Simulación de base de datos en memoria (en producción usar PostgreSQL)
let orders = [];
let orderIdCounter = 1;

// GET /api/orders - Obtener todas las órdenes (admin)
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let filteredOrders = orders;

    if (status) {
      filteredOrders = orders.filter(order => order.status === status);
    }

    const paginatedOrders = filteredOrders.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: paginatedOrders,
      total: filteredOrders.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: filteredOrders.length > parseInt(offset) + parseInt(limit)
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

// GET /api/orders/:id - Obtener orden específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = orders.find(order => order.id === parseInt(id));

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      data: order
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
  body('items.*.id').notEmpty().withMessage('ID del item es requerido'),
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

    const { customer, items, notes, paymentMethod } = req.body;

    // Calcular totales
    let subtotal = 0;
    const processedItems = items.map(item => {
      // En producción, obtener precio de la base de datos
      const itemPrice = getItemPrice(item.id);
      const total = itemPrice * item.quantity;
      subtotal += total;
      
      return {
        ...item,
        price: itemPrice,
        total: total
      };
    });

    const deliveryFee = subtotal >= 200 ? 0 : 30;
    const tax = subtotal * 0.16;
    const total = subtotal + deliveryFee + tax;

    // Crear orden
    const order = {
      id: orderIdCounter++,
      customer,
      items: processedItems,
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      subtotal,
      deliveryFee,
      tax,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.push(order);

    // En producción, aquí se enviaría la orden por WhatsApp o email
    await sendOrderNotification(order);

    res.status(201).json({
      success: true,
      data: order,
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
router.put('/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    .withMessage('Estado inválido')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido',
        details: errors.array()
      });
    }

    const orderIndex = orders.findIndex(order => order.id === parseInt(id));
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    if (notes) {
      orders[orderIndex].statusNotes = notes;
    }

    // En producción, notificar al cliente del cambio de estado
    await notifyOrderStatusChange(orders[orderIndex]);

    res.json({
      success: true,
      data: orders[orderIndex],
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
    const customerOrders = orders.filter(order => 
      order.customer.phone === phone
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: customerOrders,
      total: customerOrders.length
    });
  } catch (error) {
    console.error('Error getting customer orders:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/orders/:id - Cancelar orden
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderIndex = orders.findIndex(order => order.id === parseInt(id));

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    const order = orders[orderIndex];
    
    // Solo permitir cancelar órdenes pendientes o confirmadas
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'No se puede cancelar una orden en este estado'
      });
    }

    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    order.cancelledAt = new Date().toISOString();

    // En producción, notificar cancelación
    await notifyOrderCancellation(order);

    res.json({
      success: true,
      data: order,
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

// Funciones auxiliares (simulación)
function getItemPrice(itemId) {
  // En producción, obtener de la base de datos
  const prices = {
    '1': 180, '2': 240, '3': 220, '4': 200, '5': 210,
    '6': 280, '7': 350, '8': 35, '9': 65, '10': 25,
    '11': 45, '12': 55, '13': 75
  };
  return prices[itemId] || 0;
}

async function sendOrderNotification(order) {
  // Simular envío de notificación
  console.log(`📱 Notificación enviada para orden #${order.id}`);
  
  // En producción:
  // - Enviar mensaje por WhatsApp
  // - Enviar email de confirmación
  // - Notificar al restaurante
}

async function notifyOrderStatusChange(order) {
  // Simular notificación de cambio de estado
  console.log(`📱 Cliente notificado: Orden #${order.id} - ${order.status}`);
  
  // En producción:
  // - Enviar mensaje por WhatsApp al cliente
  // - Actualizar sistema de tracking
}

async function notifyOrderCancellation(order) {
  // Simular notificación de cancelación
  console.log(`📱 Orden #${order.id} cancelada`);
  
  // En producción:
  // - Enviar mensaje por WhatsApp al cliente
  // - Procesar reembolso si aplica
}

module.exports = router;

