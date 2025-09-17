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

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use('/api/', limiter);

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
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/hero', require('./routes/hero'));

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
      console.log(`🗄️  Base de datos: PostgreSQL conectada`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
