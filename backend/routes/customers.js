const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database-mysql');
const jwt = require('jsonwebtoken');

// Funciones auxiliares para obtener etiqueta y color de status
const getStatusLabel = (status) => {
  const statusLabels = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmado',
    'preparing': 'Preparando',
    'ready': 'Listo',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado'
  };
  return statusLabels[status] || status;
};

const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'confirmed': 'bg-blue-100 text-blue-800',
    'preparing': 'bg-orange-100 text-orange-800',
    'ready': 'bg-green-100 text-green-800',
    'delivered': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }
    req.user = user;
    next();
  });
};

// GET /api/customers - Obtener todos los clientes (admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, status, limit = 50, offset = 0, sort = 'name', order = 'ASC' } = req.query;
    
    let query = `
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.email = o.customer_email
    `;
    
    const conditions = [];
    const params = [];
    
    // Filtro de búsqueda
    if (search) {
      conditions.push('(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Agrupar por cliente
    query += ' GROUP BY c.id';
    
    // Ordenar
    const validSortFields = ['name', 'email', 'total_orders', 'total_spent', 'created_at', 'last_order_date'];
    const validOrders = ['ASC', 'DESC'];
    
    if (validSortFields.includes(sort) && validOrders.includes(order.toUpperCase())) {
      query += ` ORDER BY ${sort} ${order.toUpperCase()}`;
    } else {
      query += ' ORDER BY c.name ASC';
    }
    
    // Limitar resultados
    query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const customers = await executeQuery(query, params);
    
    // Formatear datos
    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      totalOrders: parseInt(customer.total_orders),
      totalSpent: parseFloat(customer.total_spent),
      lastOrder: customer.last_order_date,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      status: customer.total_orders > 0 ? 'active' : 'inactive'
    }));
    
    res.json({
      success: true,
      data: formattedCustomers,
      pagination: {
        total: customers.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/customers/:id - Obtener cliente específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await executeQuery(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    
    if (customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    // Obtener estadísticas del cliente
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        MAX(created_at) as last_order_date
      FROM orders 
      WHERE customer_email = ?
    `, [customer[0].email]);
    
    const customerData = {
      ...customer[0],
      totalOrders: parseInt(stats[0].total_orders),
      totalSpent: parseFloat(stats[0].total_spent),
      lastOrder: stats[0].last_order_date,
      status: stats[0].total_orders > 0 ? 'active' : 'inactive'
    };
    
    res.json({
      success: true,
      data: customerData
    });
    
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/customers/:id/orders - Obtener historial detallado de pedidos del cliente
router.get('/:id/orders', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Fetching orders for customer ${id}`);
    
    // Obtener información del cliente
    const customer = await executeQuery(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    
    if (customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    const customerData = customer[0];
    console.log('Customer found:', customerData.name, customerData.email);
    
    // Obtener pedidos del cliente sin LIMIT/OFFSET primero
    const orders = await executeQuery(`
      SELECT * FROM orders 
      WHERE customer_email = ? 
      ORDER BY created_at DESC
    `, [customerData.email]);
    
    console.log(`Found ${orders.length} orders for customer`);
    
    // Simplificar respuesta - solo información básica
    const ordersWithItems = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      deliveryAddress: order.delivery_address,
      totalAmount: parseFloat(order.total_amount),
      status: order.status,
      notes: order.notes,
      itemCount: 0,
      items: [],
      subtotal: parseFloat(order.total_amount),
      deliveryFee: 0,
      tax: 0,
      statusLabel: getStatusLabel(order.status),
      statusColor: getStatusColor(order.status),
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));
    
    // Obtener estadísticas del cliente
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        AVG(total_amount) as avg_order_value,
        MAX(created_at) as last_order_date,
        MIN(created_at) as first_order_date
      FROM orders 
      WHERE customer_email = ?
    `, [customerData.email]);
    
    const customerStats = stats[0];
    console.log('Customer stats:', customerStats);
    
    const responseData = {
      customer: {
        id: customerData.id,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address
      },
      orders: ordersWithItems,
      stats: {
        totalOrders: parseInt(customerStats.total_orders),
        totalSpent: parseFloat(customerStats.total_spent),
        avgOrderValue: parseFloat(customerStats.avg_order_value || 0),
        lastOrderDate: customerStats.last_order_date,
        firstOrderDate: customerStats.first_order_date
      },
      pagination: {
        total: orders.length,
        limit: orders.length,
        offset: 0,
        hasMore: false
      }
    };
    
    console.log('Response data prepared, sending response');
    
    res.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/customers - Crear nuevo cliente
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('phone').notEmpty().withMessage('El teléfono es requerido'),
  body('address').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { name, email, phone, address } = req.body;
    
    // Verificar si el email ya existe
    const existingCustomer = await executeQuery(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );
    
    if (existingCustomer.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con este email'
      });
    }
    
    // Crear cliente
    const result = await executeQuery(`
      INSERT INTO customers (name, email, phone, address)
      VALUES (?, ?, ?, ?)
    `, [name, email, phone, address || null]);
    
    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: {
        id: result.insertId,
        name,
        email,
        phone,
        address
      }
    });
    
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/customers/:id - Actualizar cliente
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('phone').optional().notEmpty().withMessage('El teléfono no puede estar vacío'),
  body('address').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    
    // Verificar que el cliente existe
    const existingCustomer = await executeQuery(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    
    if (existingCustomer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    // Si se está cambiando el email, verificar que no exista otro cliente con ese email
    if (email && email !== existingCustomer[0].email) {
      const emailExists = await executeQuery(
        'SELECT id FROM customers WHERE email = ? AND id != ?',
        [email, id]
      );
      
      if (emailExists.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro cliente con este email'
        });
      }
    }
    
    // Actualizar cliente
    const updateFields = [];
    const updateValues = [];
    
    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    await executeQuery(`
      UPDATE customers 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/customers/:id - Eliminar cliente
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el cliente existe
    const customer = await executeQuery(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    
    if (customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    // Verificar si tiene pedidos asociados
    const orders = await executeQuery(
      'SELECT COUNT(*) as count FROM orders WHERE customer_email = ?',
      [customer[0].email]
    );
    
    if (orders[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un cliente que tiene pedidos asociados'
      });
    }
    
    // Eliminar cliente
    await executeQuery('DELETE FROM customers WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/customers/stats/overview - Obtener estadísticas generales de clientes
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.id IN (
          SELECT DISTINCT customer_email FROM orders
        ) THEN 1 END) as active_customers,
        AVG(c.total_orders) as avg_orders_per_customer,
        SUM(c.total_spent) as total_revenue
      FROM customers c
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
    
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/customers/check-email/:email - Verificar si un email ya existe (público)
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }
    
    const customer = await executeQuery(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );
    
    if (customer.length > 0) {
      res.json({
        success: true,
        exists: true,
        message: 'Email ya registrado'
      });
    } else {
      res.json({
        success: true,
        exists: false,
        message: 'Email disponible'
      });
    }
    
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/customers/verify - Verificar datos de usuario existente (público)
router.post('/verify', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }
    
    const customer = await executeQuery(
      'SELECT id, name, phone, address FROM customers WHERE email = ?',
      [email]
    );
    
    if (customer.length > 0) {
      // Verificar que el nombre coincida (case insensitive)
      if (customer[0].name.toLowerCase().trim() === name.toLowerCase().trim()) {
        res.json({
          success: true,
          verified: true,
          message: 'Datos verificados correctamente',
          data: {
            id: customer[0].id,
            name: customer[0].name,
            email: email,
            phone: customer[0].phone,
            address: customer[0].address
          }
        });
      } else {
        res.json({
          success: false,
          verified: false,
          message: 'El nombre no coincide con el registrado'
        });
      }
    } else {
      res.json({
        success: false,
        verified: false,
        message: 'Email no encontrado'
      });
    }
    
  } catch (error) {
    console.error('Error verifying customer:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
