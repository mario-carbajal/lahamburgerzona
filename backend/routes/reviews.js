const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Simulación de base de datos en memoria (en producción usar PostgreSQL)
let reviews = [];
let reviewIdCounter = 1;

// GET /api/reviews - Obtener todas las reseñas
router.get('/', async (req, res) => {
  try {
    const { 
      itemId, 
      rating, 
      verified, 
      sort = 'recent', 
      limit = 20, 
      offset = 0 
    } = req.query;

    let filteredReviews = reviews;

    // Filtrar por item específico
    if (itemId) {
      filteredReviews = filteredReviews.filter(review => review.itemId === itemId);
    }

    // Filtrar por calificación
    if (rating) {
      filteredReviews = filteredReviews.filter(review => review.rating === parseInt(rating));
    }

    // Filtrar por verificación
    if (verified !== undefined) {
      const isVerified = verified === 'true';
      filteredReviews = filteredReviews.filter(review => review.verified === isVerified);
    }

    // Ordenar
    switch (sort) {
      case 'recent':
        filteredReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filteredReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'rating':
        filteredReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'helpful':
        filteredReviews.sort((a, b) => b.helpful - a.helpful);
        break;
    }

    // Paginación
    const paginatedReviews = filteredReviews.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    // Calcular estadísticas
    const stats = {
      total: filteredReviews.length,
      average: filteredReviews.length > 0 
        ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length).toFixed(1)
        : 0,
      distribution: {
        5: filteredReviews.filter(r => r.rating === 5).length,
        4: filteredReviews.filter(r => r.rating === 4).length,
        3: filteredReviews.filter(r => r.rating === 3).length,
        2: filteredReviews.filter(r => r.rating === 2).length,
        1: filteredReviews.filter(r => r.rating === 1).length
      }
    };

    res.json({
      success: true,
      data: paginatedReviews,
      stats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: filteredReviews.length > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reviews/:id - Obtener reseña específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const review = reviews.find(review => review.id === parseInt(id));

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Reseña no encontrada'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error getting review:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/reviews - Crear nueva reseña
router.post('/', [
  body('customerName').notEmpty().withMessage('Nombre del cliente es requerido'),
  body('customerEmail').isEmail().withMessage('Email válido es requerido'),
  body('itemId').notEmpty().withMessage('ID del item es requerido'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Calificación debe ser entre 1 y 5'),
  body('comment').notEmpty().withMessage('Comentario es requerido')
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

    const { customerName, customerEmail, itemId, rating, comment, customerPhone } = req.body;

    // Verificar que el item existe
    const itemExists = await checkItemExists(itemId);
    if (!itemExists) {
      return res.status(400).json({
        success: false,
        error: 'El item especificado no existe'
      });
    }

    // Verificar que el cliente no haya dejado una reseña reciente para este item
    const recentReview = reviews.find(review => 
      review.customerEmail === customerEmail && 
      review.itemId === itemId &&
      new Date(review.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas
    );

    if (recentReview) {
      return res.status(400).json({
        success: false,
        error: 'Ya has dejado una reseña para este item recientemente'
      });
    }

    // Crear reseña
    const review = {
      id: reviewIdCounter++,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      itemId,
      rating,
      comment,
      helpful: 0,
      verified: false, // Se verifica manualmente o por compra
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reviews.push(review);

    // En producción, aquí se podría:
    // - Enviar email de confirmación
    // - Notificar al restaurante
    // - Verificar automáticamente si hay una compra asociada

    res.status(201).json({
      success: true,
      data: review,
      message: 'Reseña creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/reviews/:id/helpful - Marcar reseña como útil
router.post('/:id/helpful', async (req, res) => {
  try {
    const { id } = req.params;
    const reviewIndex = reviews.findIndex(review => review.id === parseInt(id));

    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Reseña no encontrada'
      });
    }

    reviews[reviewIndex].helpful += 1;
    reviews[reviewIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: reviews[reviewIndex],
      message: 'Reseña marcada como útil'
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/reviews/:id - Actualizar reseña
router.put('/:id', [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Calificación debe ser entre 1 y 5'),
  body('comment').optional().notEmpty().withMessage('Comentario no puede estar vacío')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos de validación incorrectos',
        details: errors.array()
      });
    }

    const reviewIndex = reviews.findIndex(review => review.id === parseInt(id));
    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Reseña no encontrada'
      });
    }

    // Actualizar campos si se proporcionan
    if (rating !== undefined) {
      reviews[reviewIndex].rating = rating;
    }
    if (comment !== undefined) {
      reviews[reviewIndex].comment = comment;
    }
    
    reviews[reviewIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: reviews[reviewIndex],
      message: 'Reseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/reviews/:id - Eliminar reseña
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reviewIndex = reviews.findIndex(review => review.id === parseInt(id));

    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Reseña no encontrada'
      });
    }

    const deletedReview = reviews.splice(reviewIndex, 1)[0];

    res.json({
      success: true,
      data: deletedReview,
      message: 'Reseña eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reviews/stats/overview - Obtener estadísticas generales
router.get('/stats/overview', async (req, res) => {
  try {
    const { itemId } = req.query;
    let reviewsToAnalyze = reviews;

    if (itemId) {
      reviewsToAnalyze = reviews.filter(review => review.itemId === itemId);
    }

    if (reviewsToAnalyze.length === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          average: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          verified: 0,
          helpful: 0
        }
      });
    }

    const stats = {
      total: reviewsToAnalyze.length,
      average: (reviewsToAnalyze.reduce((sum, r) => sum + r.rating, 0) / reviewsToAnalyze.length).toFixed(1),
      distribution: {
        5: reviewsToAnalyze.filter(r => r.rating === 5).length,
        4: reviewsToAnalyze.filter(r => r.rating === 4).length,
        3: reviewsToAnalyze.filter(r => r.rating === 3).length,
        2: reviewsToAnalyze.filter(r => r.rating === 2).length,
        1: reviewsToAnalyze.filter(r => r.rating === 1).length
      },
      verified: reviewsToAnalyze.filter(r => r.verified).length,
      helpful: reviewsToAnalyze.reduce((sum, r) => sum + r.helpful, 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting review stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Funciones auxiliares
async function checkItemExists(itemId) {
  // En producción, verificar en la base de datos
  const validItems = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
  return validItems.includes(itemId);
}

module.exports = router;

