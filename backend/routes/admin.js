const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database-mysql');

// Middleware de autenticación administrativa (simple para desarrollo)
const adminAuth = (req, res, next) => {
  // TODO: Implementar autenticación real con JWT
  const adminToken = req.headers.authorization;
  
  // Para desarrollo, aceptar tanto el token dummy como el token real
  if (!adminToken || (adminToken !== 'Bearer admin-token' && adminToken !== 'Bearer dummy-admin-token')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado'
    });
  }
  
  next();
};

// Dashboard - Estadísticas generales
router.get('/dashboard', adminAuth, (req, res) => {
  try {
    const stats = {
      totalOrders: 1247,
      totalRevenue: 45680,
      totalCustomers: 892,
      averageRating: 4.8,
      pendingOrders: 23,
      totalProducts: 45,
      newMessages: 12,
      monthlyGrowth: 15.3,
      recentOrders: [
        {
          id: 'ORD-001',
          customer: 'María González',
          items: 3,
          total: 540,
          status: 'pending',
          time: '10 min ago'
        },
        {
          id: 'ORD-002',
          customer: 'Carlos Ruiz',
          items: 2,
          total: 380,
          status: 'preparing',
          time: '25 min ago'
        }
      ]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard'
    });
  }
});

// Obtener todos los pedidos
router.get('/orders', adminAuth, (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // TODO: Implementar filtros reales y paginación
    const orders = [
      {
        id: 'ORD-001',
        customer: {
          name: 'María González',
          phone: '+52 555-0123',
          address: 'Calle Principal 123, Colonia Centro'
        },
        items: [
          { name: 'Monstruo Clásico', quantity: 2, price: 180 },
          { name: 'Papas Fritas', quantity: 1, price: 45 }
        ],
        total: 405,
        status: 'pending',
        paymentMethod: 'whatsapp',
        notes: 'Sin cebolla en una hamburguesa',
        createdAt: '2025-09-16T19:30:00Z',
        estimatedDelivery: '2025-09-16T20:00:00Z'
      },
      {
        id: 'ORD-002',
        customer: {
          name: 'Carlos Ruiz',
          phone: '+52 555-0456',
          address: 'Avenida Juárez 456, Colonia Norte'
        },
        items: [
          { name: 'Zona BBQ', quantity: 1, price: 220 },
          { name: 'Refresco 500ml', quantity: 2, price: 35 }
        ],
        total: 290,
        status: 'preparing',
        paymentMethod: 'cash',
        createdAt: '2025-09-16T19:15:00Z',
        estimatedDelivery: '2025-09-16T19:45:00Z'
      }
    ];

    let filteredOrders = orders;
    if (status && status !== 'all') {
      filteredOrders = orders.filter(order => order.status === status);
    }

    res.json({
      success: true,
      data: {
        orders: filteredOrders,
        total: filteredOrders.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos'
    });
  }
});

// Actualizar estado de pedido
router.put('/orders/:id/status', adminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de pedido inválido'
      });
    }

    // TODO: Implementar actualización real en base de datos
    res.json({
      success: true,
      message: 'Estado del pedido actualizado correctamente',
      data: {
        orderId: id,
        newStatus: status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del pedido'
    });
  }
});

// Obtener todos los productos del menú
router.get('/menu', adminAuth, (req, res) => {
  try {
    const { category, active } = req.query;
    
    // TODO: Implementar filtros reales
    const menuItems = [
      {
        id: '1',
        name: 'Monstruo Clásico',
        description: 'Nuestra hamburguesa estrella con carne 100% res, queso cheddar, lechuga, tomate, cebolla y nuestra salsa especial.',
        price: 180,
        image: '/images/burgers/monstruo-clasico.jpg',
        category: 'Monstruo Clásico',
        rating: 4.9,
        prepTime: 12,
        isPopular: true,
        isActive: true,
        ingredients: ['Carne de res', 'Queso cheddar', 'Lechuga', 'Tomate', 'Cebolla', 'Salsa especial'],
        createdAt: '2025-09-01T00:00:00Z',
        updatedAt: '2025-09-16T00:00:00Z'
      },
      {
        id: '2',
        name: 'Zona BBQ',
        description: 'Deliciosa hamburguesa con carne ahumada, bacon crujiente, cebolla caramelizada y salsa BBQ casera.',
        price: 220,
        image: '/images/burgers/zona-bbq.jpg',
        category: 'Zona Sabor',
        rating: 4.8,
        prepTime: 15,
        isActive: true,
        ingredients: ['Carne ahumada', 'Bacon', 'Cebolla caramelizada', 'Salsa BBQ', 'Queso gouda'],
        createdAt: '2025-09-01T00:00:00Z',
        updatedAt: '2025-09-16T00:00:00Z'
      }
    ];

    let filteredItems = menuItems;
    if (category && category !== 'all') {
      filteredItems = menuItems.filter(item => item.category === category);
    }
    if (active !== undefined) {
      const isActive = active === 'true';
      filteredItems = filteredItems.filter(item => item.isActive === isActive);
    }

    res.json({
      success: true,
      data: {
        items: filteredItems,
        total: filteredItems.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos del menú'
    });
  }
});

// Crear nuevo producto
router.post('/menu', adminAuth, (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      category,
      prepTime,
      ingredients,
      isSpicy,
      isPopular,
      isActive = true
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    // TODO: Implementar creación real en base de datos
    const newItem = {
      id: Date.now().toString(),
      name,
      description,
      price: parseFloat(price),
      image: image || '/images/default-burger.jpg',
      category,
      rating: 0,
      prepTime: parseInt(prepTime) || 15,
      isSpicy: Boolean(isSpicy),
      isPopular: Boolean(isPopular),
      isActive: Boolean(isActive),
      ingredients: Array.isArray(ingredients) ? ingredients : ingredients.split(',').map(i => i.trim()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Producto creado correctamente',
      data: newItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear producto'
    });
  }
});

// Actualizar producto
router.put('/menu/:id', adminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // TODO: Implementar actualización real en base de datos
    res.json({
      success: true,
      message: 'Producto actualizado correctamente',
      data: {
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto'
    });
  }
});

// Eliminar producto
router.delete('/menu/:id', adminAuth, (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implementar eliminación real en base de datos
    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto'
    });
  }
});

// Obtener reseñas
router.get('/reviews', adminAuth, (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // TODO: Implementar filtros reales
    const reviews = [
      {
        id: '1',
        customerName: 'María González',
        rating: 5,
        comment: 'Las mejores hamburguesas de la ciudad. El sabor es increíble y la atención es excelente.',
        status: 'approved',
        createdAt: '2025-09-15T10:30:00Z',
        productId: '1',
        productName: 'Monstruo Clásico'
      },
      {
        id: '2',
        customerName: 'Carlos Ruiz',
        rating: 4,
        comment: 'Muy buena calidad, pero la entrega tardó un poco más de lo esperado.',
        status: 'pending',
        createdAt: '2025-09-16T14:20:00Z',
        productId: '2',
        productName: 'Zona BBQ'
      }
    ];

    let filteredReviews = reviews;
    if (status && status !== 'all') {
      filteredReviews = reviews.filter(review => review.status === status);
    }

    res.json({
      success: true,
      data: {
        reviews: filteredReviews,
        total: filteredReviews.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener reseñas'
    });
  }
});

// Actualizar estado de reseña
router.put('/reviews/:id/status', adminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de reseña inválido'
      });
    }

    // TODO: Implementar actualización real
    res.json({
      success: true,
      message: 'Estado de la reseña actualizado correctamente',
      data: {
        reviewId: id,
        newStatus: status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de la reseña'
    });
  }
});

// Obtener clientes
router.get('/customers', adminAuth, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // TODO: Implementar obtención real de clientes
    const customers = [
      {
        id: '1',
        name: 'María González',
        email: 'maria@email.com',
        phone: '+52 555-0123',
        totalOrders: 15,
        totalSpent: 2450,
        lastOrder: '2025-09-16T19:30:00Z',
        createdAt: '2025-08-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Carlos Ruiz',
        email: 'carlos@email.com',
        phone: '+52 555-0456',
        totalOrders: 8,
        totalSpent: 1680,
        lastOrder: '2025-09-16T19:15:00Z',
        createdAt: '2025-08-15T00:00:00Z'
      }
    ];

    res.json({
      success: true,
      data: {
        customers,
        total: customers.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes'
    });
  }
});

// Obtener reportes
router.get('/reports', adminAuth, (req, res) => {
  try {
    const { type, period = 'month' } = req.query;
    
    // TODO: Implementar reportes reales
    const reports = {
      sales: {
        total: 45680,
        growth: 15.3,
        period: 'Este mes',
        daily: [
          { date: '2025-09-01', amount: 1200 },
          { date: '2025-09-02', amount: 1450 },
          { date: '2025-09-03', amount: 1100 }
        ]
      },
      orders: {
        total: 1247,
        growth: 12.5,
        period: 'Este mes',
        byStatus: {
          pending: 23,
          preparing: 15,
          delivered: 1180,
          cancelled: 29
        }
      },
      products: {
        topSelling: [
          { name: 'Monstruo Clásico', sales: 245 },
          { name: 'Zona BBQ', sales: 189 },
          { name: 'Brutal Doble', sales: 156 }
        ]
      }
    };

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener reportes'
    });
  }
});

// Configuración - Obtener todas las configuraciones
router.get('/settings', adminAuth, async (req, res) => {
  try {
    const settings = await executeQuery('SELECT setting_key, setting_value FROM settings');
    
    // Convertir array de settings a objeto
    const settingsObject = {};
    settings.forEach(setting => {
      try {
        settingsObject[setting.setting_key] = JSON.parse(setting.setting_value);
      } catch (e) {
        settingsObject[setting.setting_key] = setting.setting_value;
      }
    });

    // Configuración por defecto si no existe
    const defaultSettings = {
      general: {
        name: 'La Hamburguezona',
        description: '¡Sabor que conquista!',
        logo: '/logo.png',
        address: 'Calle Principal 123, Ciudad de México',
        phone: '+52 555-0123',
        email: 'contacto@lahamburguezona.com',
        website: 'https://lahamburguezona.com'
      },
      business: {
        openingHours: {
          monday: { open: '09:00', close: '22:00', closed: false },
          tuesday: { open: '09:00', close: '22:00', closed: false },
          wednesday: { open: '09:00', close: '22:00', closed: false },
          thursday: { open: '09:00', close: '22:00', closed: false },
          friday: { open: '09:00', close: '23:00', closed: false },
          saturday: { open: '10:00', close: '23:00', closed: false },
          sunday: { open: '10:00', close: '21:00', closed: false }
        },
        deliveryZone: 'Ciudad de México y alrededores',
        deliveryFee: 30,
        minimumOrder: 200,
        averagePrepTime: 15
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        newOrderAlerts: true,
        lowStockAlerts: true
      },
      security: {
        adminPassword: '',
        sessionTimeout: 60,
        twoFactorAuth: false,
        ipWhitelist: []
      }
    };

    // Combinar configuración por defecto con la guardada
    const finalSettings = { ...defaultSettings, ...settingsObject };

    res.json({
      success: true,
      data: finalSettings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración'
    });
  }
});

// Configuración - Guardar configuración
router.put('/settings', adminAuth, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Configuración requerida'
      });
    }

    // Guardar cada sección de configuración
    for (const [section, value] of Object.entries(settings)) {
      const settingValue = JSON.stringify(value);
      
      await executeQuery(`
        INSERT INTO settings (setting_key, setting_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `, [section, settingValue]);
    }

    res.json({
      success: true,
      message: 'Configuración guardada correctamente'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar configuración'
    });
  }
});

module.exports = router;

