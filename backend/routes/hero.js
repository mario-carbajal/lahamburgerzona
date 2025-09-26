const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database-mysql');
const jwt = require('jsonwebtoken');

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

  jwt.verify(token, process.env.JWT_SECRET || 'admin-secret-key', (err, user) => {
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

// GET /api/hero - Obtener todas las imágenes hero activas
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT * FROM hero_images 
      WHERE is_active = 1 
      ORDER BY sort_order ASC, created_at ASC
    `;
    
    const heroImages = await executeQuery(query);
    
    res.json({
      success: true,
      data: heroImages.map(image => ({
        id: image.id.toString(),
        title: image.title,
        subtitle: image.subtitle,
        description: image.description,
        imageUrl: image.image_url,
        ctaText: image.cta_text,
        ctaLink: image.cta_link,
        isActive: Boolean(image.is_active),
        sortOrder: image.sort_order,
        createdAt: image.created_at,
        updatedAt: image.updated_at
      }))
    });
  } catch (error) {
    console.error('Error getting hero images:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las imágenes del hero'
    });
  }
});

// GET /api/hero/admin/all - Obtener todas las imágenes hero (incluye inactivas) - Solo admin
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM hero_images 
      ORDER BY sort_order ASC, created_at ASC
    `;
    
    const heroImages = await executeQuery(query);
    
    res.json({
      success: true,
      data: heroImages.map(image => ({
        id: image.id.toString(),
        title: image.title,
        subtitle: image.subtitle,
        description: image.description,
        imageUrl: image.image_url,
        ctaText: image.cta_text,
        ctaLink: image.cta_link,
        isActive: Boolean(image.is_active),
        sortOrder: image.sort_order,
        createdAt: image.created_at,
        updatedAt: image.updated_at
      }))
    });
  } catch (error) {
    console.error('Error getting all hero images:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener todas las imágenes del hero'
    });
  }
});

// POST /api/hero/admin - Crear nueva imagen hero - Solo admin
router.post('/admin', authenticateToken, async (req, res) => {
  try {
    const { title, subtitle, description, imageUrl, ctaText, ctaLink, isActive, sortOrder } = req.body;

    // Validaciones básicas
    if (!title || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: title, imageUrl'
      });
    }

    const query = `
      INSERT INTO hero_images (
        title, subtitle, description, image_url, cta_text, cta_link, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      title,
      subtitle || null,
      description || null,
      imageUrl,
      ctaText || '¡Ordena Ahora!',
      ctaLink || '/pedidos',
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      sortOrder || 0
    ];

    const result = await executeQuery(query, params);

    if (result.insertId) {
      // Obtener la imagen hero recién creada
      const newHeroImage = await executeQuery('SELECT * FROM hero_images WHERE id = ?', [result.insertId]);

      if (newHeroImage.length > 0) {
        const image = newHeroImage[0];
        const formattedImage = {
          id: image.id.toString(),
          title: image.title,
          subtitle: image.subtitle,
          description: image.description,
          imageUrl: image.image_url,
          ctaText: image.cta_text,
          ctaLink: image.cta_link,
          isActive: Boolean(image.is_active),
          sortOrder: image.sort_order,
          createdAt: image.created_at,
          updatedAt: image.updated_at
        };

        res.status(201).json({
          success: true,
          message: 'Imagen hero creada correctamente',
          data: formattedImage
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Error al recuperar la imagen hero creada'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al crear la imagen hero'
      });
    }
  } catch (error) {
    console.error('Error creating hero image:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/hero/admin/:id - Actualizar imagen hero - Solo admin
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, imageUrl, ctaText, ctaLink, isActive, sortOrder } = req.body;

    // Validaciones básicas
    if (!title || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: title, imageUrl'
      });
    }

    const query = `
      UPDATE hero_images SET
        title = ?, subtitle = ?, description = ?, image_url = ?,
        cta_text = ?, cta_link = ?, is_active = ?, sort_order = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      title,
      subtitle || null,
      description || null,
      imageUrl,
      ctaText || '¡Ordena Ahora!',
      ctaLink || '/pedidos',
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      sortOrder || 0,
      id
    ];

    const result = await executeQuery(query, params);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'Imagen hero actualizada correctamente'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Imagen hero no encontrada'
      });
    }
  } catch (error) {
    console.error('Error updating hero image:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/hero/admin/:id - Eliminar imagen hero - Solo admin
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery('DELETE FROM hero_images WHERE id = ?', [id]);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'Imagen hero eliminada correctamente'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Imagen hero no encontrada'
      });
    }
  } catch (error) {
    console.error('Error deleting hero image:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/hero/admin/:id/toggle - Alternar estado activo/inactivo - Solo admin
router.put('/admin/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el estado actual
    const [currentImage] = await executeQuery('SELECT is_active FROM hero_images WHERE id = ?', [id]);
    
    if (currentImage.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Imagen hero no encontrada'
      });
    }

    const newStatus = currentImage.is_active ? 0 : 1;

    const result = await executeQuery(
      'UPDATE hero_images SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, id]
    );

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'Estado de imagen hero actualizado correctamente',
        data: {
          isActive: Boolean(newStatus)
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al actualizar el estado'
      });
    }
  } catch (error) {
    console.error('Error toggling hero image status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
