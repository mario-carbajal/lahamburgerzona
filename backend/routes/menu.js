const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database-mysql');
const menuData = require('../data/menu.json');

// GET /api/menu - Obtener todo el menú
router.get('/', async (req, res) => {
  try {
    console.log('Menu endpoint called');
    
    // Construir la consulta SQL simple
    const query = 'SELECT * FROM menu_items WHERE is_active = 1';
    console.log('Executing query:', query);
    
    const items = await executeQuery(query);
    console.log('Query results:', items);
    console.log('Items length:', items.length);

    // Formatear los datos para que coincidan con la estructura esperada
    const formattedItems = items.map(item => ({
      id: item.id.toString(),
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      image: item.image,
      category: item.category,
      rating: parseFloat(item.rating),
      prepTime: item.prep_time,
      isPopular: Boolean(item.is_popular),
      isSpicy: Boolean(item.is_spicy),
      isVegetarian: false, // Por defecto, se puede agregar este campo a la DB
      isActive: Boolean(item.is_active),
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : (item.ingredients ? JSON.parse(item.ingredients) : []),
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    console.log('Formatted items:', formattedItems);

    res.json({
      success: true,
      data: {
        categories: menuData.categories,
        items: formattedItems,
        combos: menuData.combos
      },
      total: formattedItems.length
    });
  } catch (error) {
    console.error('Error getting menu:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/menu/categories - Obtener categorías
router.get('/categories', async (req, res) => {
  try {
    res.json({
      success: true,
      data: menuData.categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/menu/items - Obtener items del menú
router.get('/items', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, vegetarian, spicy, popular } = req.query;
    let items = menuData.items;

    // Filtrar por categoría
    if (category) {
      items = items.filter(item => item.category === category);
    }

    // Búsqueda por nombre o descripción
    if (search) {
      const searchTerm = search.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm))
      );
    }

    // Filtrar por rango de precio
    if (minPrice) {
      items = items.filter(item => item.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      items = items.filter(item => item.price <= parseInt(maxPrice));
    }

    // Filtrar por tipo
    if (vegetarian === 'true') {
      items = items.filter(item => item.isVegetarian);
    }

    if (spicy === 'true') {
      items = items.filter(item => item.isSpicy);
    }

    if (popular === 'true') {
      items = items.filter(item => item.isPopular);
    }

    res.json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (error) {
    console.error('Error getting menu items:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/menu/items/:id - Obtener item específico
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = menuData.items.find(item => item.id === id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item no encontrado'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error getting menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/menu/combos - Obtener combos
router.get('/combos', async (req, res) => {
  try {
    const { popular } = req.query;
    let combos = menuData.combos;

    if (popular === 'true') {
      combos = combos.filter(combo => combo.isPopular);
    }

    res.json({
      success: true,
      data: combos,
      total: combos.length
    });
  } catch (error) {
    console.error('Error getting combos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/menu/search - Buscar en el menú
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro de búsqueda requerido'
      });
    }

    const searchTerm = query.toLowerCase();
    const results = menuData.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm)) ||
      item.category.toLowerCase().includes(searchTerm)
    );

    res.json({
      success: true,
      data: results,
      total: results.length,
      query: query
    });
  } catch (error) {
    console.error('Error searching menu:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/menu/featured - Obtener items destacados
router.get('/featured', async (req, res) => {
  try {
    const featuredItems = menuData.items.filter(item => item.isPopular);
    
    res.json({
      success: true,
      data: featuredItems,
      total: featuredItems.length
    });
  } catch (error) {
    console.error('Error getting featured items:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ADMIN ROUTES - Estas rutas requieren autenticación de admin

// GET /api/menu/admin/all - Obtener todos los items (incluyendo inactivos) para admin
router.get('/admin/all', async (req, res) => {
  try {
    const query = 'SELECT * FROM menu_items ORDER BY category, name';
    const items = await executeQuery(query);

    // Formatear los datos
    const formattedItems = items.map(item => ({
      id: item.id.toString(),
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      image: item.image,
      category: item.category,
      rating: parseFloat(item.rating),
      prepTime: item.prep_time,
      isPopular: Boolean(item.is_popular),
      isSpicy: Boolean(item.is_spicy),
      isActive: Boolean(item.is_active),
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : (item.ingredients ? JSON.parse(item.ingredients) : []),
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    res.json({
      success: true,
      data: formattedItems,
      total: formattedItems.length
    });
  } catch (error) {
    console.error('Error getting all menu items:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/menu/admin/:id/status - Actualizar estado activo/inactivo
router.put('/admin/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'El campo isActive debe ser un booleano'
      });
    }

    const query = 'UPDATE menu_items SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await executeQuery(query, [isActive ? 1 : 0, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Item ${isActive ? 'activado' : 'desactivado'} correctamente`
    });
  } catch (error) {
    console.error('Error updating menu item status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/menu/admin/:id - Actualizar item del menú
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, rating, prepTime, isPopular, isSpicy, isActive, ingredients } = req.body;

    console.log('Updating menu item:', { id, name, image, category });

    // Validaciones básicas
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos'
      });
    }

    const query = `
      UPDATE menu_items 
      SET name = ?, description = ?, price = ?, image = ?, category = ?, 
          rating = ?, prep_time = ?, is_popular = ?, is_spicy = ?, 
          is_active = ?, ingredients = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      name,
      description,
      parseFloat(price),
      image || null,
      category,
      parseFloat(rating) || 0,
      parseInt(prepTime) || 0,
      isPopular ? 1 : 0,
      isSpicy ? 1 : 0,
      isActive ? 1 : 0,
      JSON.stringify(ingredients || []),
      id
    ];

    const result = await executeQuery(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Item actualizado correctamente'
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/menu/admin/:id - Eliminar item del menú
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM menu_items WHERE id = ?';
    const result = await executeQuery(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Item eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/menu/admin - Crear nuevo item del menú
router.post('/admin', async (req, res) => {
  try {
    const { name, description, price, image, category, rating, prepTime, isPopular, isSpicy, isActive, ingredients } = req.body;

    // Validaciones básicas
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: name, description, price, category'
      });
    }

    // Validar que el precio sea un número positivo
    if (isNaN(price) || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El precio debe ser un número positivo'
      });
    }

    const query = `
      INSERT INTO menu_items (
        name, description, price, image, category, rating, prep_time, 
        is_popular, is_spicy, is_active, ingredients
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      name,
      description,
      parseFloat(price),
      image || null,
      category,
      parseFloat(rating) || 0,
      parseInt(prepTime) || 0,
      isPopular ? 1 : 0,
      isSpicy ? 1 : 0,
      isActive !== undefined ? (isActive ? 1 : 0) : 1, // Por defecto activo
      JSON.stringify(ingredients || [])
    ];

    const result = await executeQuery(query, params);

    if (result.insertId) {
      // Obtener el item recién creado
      const newItem = await executeQuery('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
      
      if (newItem.length > 0) {
        const item = newItem[0];
        const formattedItem = {
          id: item.id.toString(),
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          image: item.image,
          category: item.category,
          rating: parseFloat(item.rating),
          prepTime: item.prep_time,
          isPopular: Boolean(item.is_popular),
          isSpicy: Boolean(item.is_spicy),
          isActive: Boolean(item.is_active),
          ingredients: Array.isArray(item.ingredients) ? item.ingredients : (item.ingredients ? JSON.parse(item.ingredients) : []),
          createdAt: item.created_at,
          updatedAt: item.updated_at
        };

        res.status(201).json({
          success: true,
          message: 'Producto creado correctamente',
          data: formattedItem
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Error al recuperar el producto creado'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al crear el producto'
      });
    }
  } catch (error) {
    console.error('Error creating menu item:', error);
    
    // Manejar errores específicos de MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un producto con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;

