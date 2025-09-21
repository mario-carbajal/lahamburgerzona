const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Database configuration
const { testConnection, initializeDatabase } = require('./config/database-mysql');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://lahamburguezona.com', 'https://www.lahamburguezona.com']
    : true, // Permitir cualquier origen en desarrollo
  credentials: true
}));

// Rate limiting - Configuración más permisiva para desarrollo
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs (aumentado para desarrollo)
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  skip: (req) => {
    // Saltar rate limiting en desarrollo para localhost
    return process.env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
  }
});
app.use('/api/', limiter);

// Disable caching for API responses to avoid 304 issues in dev
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Permitir cualquier origen en desarrollo
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin-users', require('./routes/admin-users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/hero', require('./routes/hero'));

// Endpoint temporal para crear usuario admin inicial
app.post('/api/setup/create-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { executeQuery } = require('./config/database-mysql');

    // Verificar si ya existe un usuario admin
    const existingAdmin = await executeQuery(
      'SELECT id FROM admin_users WHERE role = "ADMIN" LIMIT 1'
    );

    if (existingAdmin.length > 0) {
      return res.json({
        success: true,
        message: 'Ya existe un usuario administrador en el sistema'
      });
    }

    // Datos del administrador inicial
    const adminData = {
      username: 'admin',
      email: 'admin@lahamburguezona.com',
      password: 'admin123',
      role: 'ADMIN',
      full_name: 'Administrador Principal',
      phone: '+52 555-0123'
    };

    // Encriptar contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(adminData.password, saltRounds);

    // Crear usuario administrador
    const result = await executeQuery(`
      INSERT INTO admin_users (username, email, password_hash, role, full_name, phone, is_active)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `, [
      adminData.username,
      adminData.email,
      password_hash,
      adminData.role,
      adminData.full_name,
      adminData.phone
    ]);

    res.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      data: {
        id: result.insertId,
        username: adminData.username,
        email: adminData.email,
        role: adminData.role,
        credentials: {
          username: adminData.username,
          password: adminData.password
        }
      }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});





// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Test orders endpoint
app.get('/api/orders-test', (req, res) => {
  res.json({
    success: true,
    message: 'Orders route is working'
  });
});

// Test database endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    
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
    
    // Verificar estructura
    const structure = await executeQuery('DESCRIBE orders');
    
    res.json({
      success: true,
      data: {
        tableExists: true,
        recordCount: count,
        structure: structure
      }
    });
  } catch (error) {
    console.error('Error in db-test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create test order endpoint
app.post('/api/create-test-order', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    
    // Crear una orden de prueba
    const orderNumber = `ORD${Date.now().toString().slice(-6)}`;
    
    const result = await executeQuery(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_email,
        delivery_address, total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      'María González',
      '+52 555-0123',
      'maria@test.com',
      'Calle 123, Colonia Centro, Ciudad de México',
      405.00,
      'pending',
      'Orden de prueba creada automáticamente'
    ]);
    
    const orderId = result.insertId;
    
    // Crear items de prueba si la tabla order_items existe
    try {
      await executeQuery(`
        INSERT INTO order_items (
          order_id, menu_item_id, quantity, price
        ) VALUES (?, ?, ?, ?)
      `, [orderId, 1, 2, 180.00]);
      
      await executeQuery(`
        INSERT INTO order_items (
          order_id, menu_item_id, quantity, price
        ) VALUES (?, ?, ?, ?)
      `, [orderId, 10, 1, 45.00]);
    } catch (itemError) {
      console.log('No se pudieron crear items (tabla puede no existir):', itemError.message);
    }
    
    res.json({
      success: true,
      message: 'Orden de prueba creada exitosamente',
      data: {
        orderId: orderId,
        orderNumber: orderNumber
      }
    });
  } catch (error) {
    console.error('Error creating test order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple endpoint to create orders (without complex validation)
app.post('/api/orders-create', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    const { customer, items } = req.body;
    
    console.log('Creating order with data:', req.body);
    
    // Validación básica
    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        error: 'Información del cliente incompleta'
      });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe incluir al menos un item'
      });
    }
    
    // Calcular total usando precios reales de la base de datos
    let totalAmount = 0;
    for (const item of items) {
      const menuItem = await executeQuery(
        'SELECT name, price FROM menu_items WHERE id = ?',
        [item.menuItemId]
      );
      
      if (menuItem.length > 0) {
        const menuItemData = menuItem[0];
        totalAmount += menuItemData.price * item.quantity;
      } else {
        return res.status(400).json({
          success: false,
          error: `Item con ID ${item.menuItemId} no encontrado`
        });
      }
    }
    
    console.log('💰 Calculated total:', totalAmount);
    
    // CREAR O ACTUALIZAR CLIENTE AUTOMÁTICAMENTE
    let customerId = null;
    if (customer.email) {
      try {
        // Verificar si el cliente ya existe por email
        const existingCustomer = await executeQuery(
          'SELECT id FROM customers WHERE email = ?',
          [customer.email]
        );
        
        if (existingCustomer.length > 0) {
          // Cliente existe, obtener su ID
          customerId = existingCustomer[0].id;
          console.log(`📧 Cliente existente encontrado: ID ${customerId}`);
          
          // Actualizar información del cliente si ha cambiado
          await executeQuery(`
            UPDATE customers 
            SET name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [customer.name, customer.phone, customer.address, customerId]);
          
        } else {
          // Crear nuevo cliente
          const customerResult = await executeQuery(`
            INSERT INTO customers (name, email, phone, address, total_orders, total_spent, last_order_date)
            VALUES (?, ?, ?, ?, 0, 0, NULL)
          `, [customer.name, customer.email, customer.phone, customer.address]);
          
          customerId = customerResult.insertId;
          console.log(`👤 Nuevo cliente creado: ID ${customerId}, Email: ${customer.email}`);
        }
      } catch (customerError) {
        console.error('Error creating/updating customer:', customerError.message);
        // Continuar con la orden aunque falle la creación del cliente
      }
    }
    
    // Generar número de orden
    const orderNumber = `ORD${Date.now().toString().slice(-6)}`;
    
    // Crear orden básica
    const result = await executeQuery(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_email,
        delivery_address, total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      customer.name,
      customer.phone,
      customer.email || null,
      customer.address,
      totalAmount,
      'pending',
      'Orden creada desde frontend'
    ]);
    
    const orderId = result.insertId;
    
    console.log('Order created with ID:', orderId);
    
    // Guardar items del pedido en order_items (usando precios reales)
    for (const item of items) {
      try {
        const menuItem = await executeQuery(
          'SELECT name, price FROM menu_items WHERE id = ?',
          [item.menuItemId]
        );
        
        if (menuItem.length > 0) {
          const menuItemData = menuItem[0];
          await executeQuery(`
            INSERT INTO order_items (
              order_id, menu_item_id, quantity, price
            ) VALUES (?, ?, ?, ?)
          `, [
            orderId,
            item.menuItemId,
            item.quantity,
            menuItemData.price // Precio real del item
          ]);
          
          console.log(`Item saved: ${menuItemData.name} x${item.quantity} = $${menuItemData.price}`);
        }
      } catch (itemError) {
        console.error(`Error saving item ${item.menuItemId}:`, itemError.message);
        // Continuar con el siguiente item
      }
    }
    
    console.log('All order items saved successfully');
    
    res.json({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        orderId: orderId,
        orderNumber: orderNumber,
        totalAmount: totalAmount
      }
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to create a simple order
app.post('/api/create-test-order', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    
    // Crear una orden de prueba
    const orderNumber = `ORD${Date.now().toString().slice(-6)}`;
    
    const result = await executeQuery(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_email,
        delivery_address, total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      'María González',
      '+52 555-0123',
      'maria@test.com',
      'Calle 123, Colonia Centro, Ciudad de México',
      405.00,
      'pending',
      'Orden de prueba creada automáticamente'
    ]);
    
    const orderId = result.insertId;
    
    // Crear items de prueba si la tabla order_items existe
    try {
      await executeQuery(`
        INSERT INTO order_items (
          order_id, menu_item_id, quantity, price
        ) VALUES (?, ?, ?, ?)
      `, [orderId, 1, 2, 180.00]);
      
      await executeQuery(`
        INSERT INTO order_items (
          order_id, menu_item_id, quantity, price
        ) VALUES (?, ?, ?, ?)
      `, [orderId, 10, 1, 45.00]);
    } catch (itemError) {
      console.log('No se pudieron crear items (tabla puede no existir):', itemError.message);
    }
    
    res.json({
      success: true,
      message: 'Orden de prueba creada exitosamente',
      data: {
        orderId: orderId,
        orderNumber: orderNumber
      }
    });
  } catch (error) {
    console.error('Error creating test order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para actualizar el status de pedidos
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    const orderId = req.params.id;
    const { status } = req.body;

    console.log(`Updating order ${orderId} status to:`, status);

    // Validar que el status sea válido
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido'
      });
    }

    // Verificar que el pedido existe
    const orders = await executeQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    // Actualizar el status de la orden
    await executeQuery(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    );

    res.json({
      success: true,
      message: 'Status actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para cancelar pedidos
app.put('/api/orders/:id/cancel', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    const orderId = req.params.id;
    const { reason } = req.body;
    
    console.log('Cancelling order:', orderId, 'with reason:', reason);
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El motivo de cancelación es requerido'
      });
    }
    
    // Verificar que el pedido existe
    const orders = await executeQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }
    
    const order = orders[0];
    
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'El pedido ya está cancelado'
      });
    }
    
    // Actualizar el pedido a cancelado
    await executeQuery(`
      UPDATE orders 
      SET status = 'cancelled', 
          notes = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [`Pedido cancelado. Motivo: ${reason.trim()}`, orderId]);
    
    console.log('Order cancelled successfully');
    
    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      data: {
        orderId: orderId,
        orderNumber: order.order_number,
        status: 'cancelled',
        cancellationReason: reason.trim(),
        cancelledAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple orders endpoint that works with current structure
app.get('/api/orders-simple', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    
    const orders = await executeQuery('SELECT * FROM orders ORDER BY created_at DESC');
    
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
            totalAmount: parseFloat(order.total_amount),
            status: order.status,
            notes: order.notes,
            itemCount: items.length,
            itemsSummary: items.map(item => `Item ${item.menu_item_id} x${item.quantity}`).join(', '),
            items: items.map(item => ({
              id: item.id,
              menuItemId: item.menu_item_id,
              name: `Item ${item.menu_item_id}`,
              quantity: item.quantity,
              unitPrice: parseFloat(item.price || 0),
              totalPrice: parseFloat(item.price || 0) * item.quantity
            })),
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
      total: orders.length
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'La Hamburguezona API',
    version: '1.0.0',
    endpoints: {
      menu: '/api/menu',
      orders: '/api/orders',
      customers: '/api/customers',
      reviews: '/api/reviews',
      contact: '/api/contact',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe en esta API`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El formato del ID no es válido'
    });
  }
  
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Test endpoint para verificar estructura de tabla order_items
app.get('/api/test-table-structure', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    
    // Verificar si la tabla order_items existe
    const tableExists = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'order_items'
    `);
    
    if (tableExists[0].count === 0) {
      return res.json({
        success: false,
        message: 'La tabla order_items no existe'
      });
    }
    
    // Obtener estructura de la tabla
    const tableStructure = await executeQuery(`
      DESCRIBE order_items
    `);
    
    res.json({
      success: true,
      message: 'Estructura de tabla order_items',
      structure: tableStructure
    });
    
  } catch (error) {
    console.error('Error checking table structure:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint para debug del problema de items
app.post('/api/orders-create-debug', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    const { customer, items } = req.body;
    
    console.log('DEBUG: Creating order with data:', req.body);
    
    // Validación básica
    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        error: 'Información del cliente incompleta'
      });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe incluir al menos un item'
      });
    }
    
    // Calcular total simple
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += 200 * item.quantity; // Precio fijo simple
    }
    
    console.log('DEBUG: Calculated total:', totalAmount);
    
    // Generar número de orden
    const orderNumber = `ORD${Date.now().toString().slice(-6)}`;
    
    // Crear orden básica
    const result = await executeQuery(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_email,
        delivery_address, total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      customer.name,
      customer.phone,
      customer.email || null,
      customer.address,
      totalAmount,
      'pending',
      'Orden creada desde frontend'
    ]);
    
    const orderId = result.insertId;
    
    console.log('DEBUG: Order created with ID:', orderId);
    
    // Guardar items del pedido en order_items
    for (const item of items) {
      await executeQuery(`
        INSERT INTO order_items (
          order_id, menu_item_id, quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        orderId,
        item.menuItemId,
        item.quantity,
        200, // Precio fijo
        200 * item.quantity // Total fijo
      ]);
      
      console.log(`DEBUG: Item saved: ID ${item.menuItemId} x${item.quantity} = $${200 * item.quantity}`);
    }
    
    console.log('DEBUG: All order items saved successfully');
    
    res.json({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        orderId: orderId,
        orderNumber: orderNumber,
        totalAmount: totalAmount
      }
    });
    
  } catch (error) {
    console.error('DEBUG: Error creating order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to mark some orders as delivered for dashboard testing
app.post('/api/test/mark-orders-delivered', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    
    // Marcar algunos pedidos como entregados para pruebas
    const result = await executeQuery(`
      UPDATE orders 
      SET status = 'delivered', updated_at = CURRENT_TIMESTAMP 
      WHERE status != 'delivered' 
      LIMIT 5
    `);
    
    console.log(`✅ ${result.affectedRows} pedidos marcados como entregados`);
    
    res.json({
      success: true,
      message: `${result.affectedRows} pedidos marcados como entregados`,
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('Error marking orders as delivered:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to create sample weekly sales data
app.post('/api/test/create-weekly-sales', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database-mysql');
    
    // Crear algunos pedidos de prueba con fechas de la última semana
    const today = new Date();
    const orders = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Crear 1-3 pedidos por día
      const ordersPerDay = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < ordersPerDay; j++) {
        const orderId = `TEST${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${j + 1}`;
        const totalAmount = Math.floor(Math.random() * 500) + 100; // Entre $100 y $600
        
        orders.push({
          id: orderId,
          customer_name: `Cliente Test ${i}-${j}`,
          customer_email: `test${i}${j}@example.com`,
          customer_phone: '555-0123',
          total_amount: totalAmount,
          status: 'delivered',
          created_at: date.toISOString().slice(0, 19).replace('T', ' ')
        });
      }
    }
    
    // Insertar los pedidos de prueba
    for (const order of orders) {
      try {
        await executeQuery(`
          INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          order.id,
          order.customer_name,
          order.customer_email,
          order.customer_phone,
          order.total_amount,
          order.status,
          order.created_at,
          order.created_at
        ]);
      } catch (insertError) {
        // Ignorar errores de duplicados
        console.log(`Pedido ${order.id} ya existe o error:`, insertError.message);
      }
    }
    
    console.log(`✅ ${orders.length} pedidos de prueba creados para la última semana`);
    
    res.json({
      success: true,
      message: `${orders.length} pedidos de prueba creados para la última semana`,
      ordersCreated: orders.length
    });
    
  } catch (error) {
    console.error('Error creating weekly sales data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize database tables
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🍔 La Hamburguezona API corriendo en puerto ${PORT}`);
      console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Base de datos: MySQL conectada`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
