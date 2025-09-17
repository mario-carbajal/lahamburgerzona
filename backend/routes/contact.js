const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Simulación de base de datos en memoria (en producción usar PostgreSQL)
let messages = [];
let messageIdCounter = 1;

// GET /api/contact - Obtener mensajes de contacto (admin)
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let filteredMessages = messages;

    if (status) {
      filteredMessages = messages.filter(msg => msg.status === status);
    }

    const paginatedMessages = filteredMessages.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: paginatedMessages,
      total: filteredMessages.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: filteredMessages.length > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting contact messages:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/contact - Enviar mensaje de contacto
router.post('/', [
  body('name').notEmpty().withMessage('Nombre es requerido'),
  body('email').isEmail().withMessage('Email válido es requerido'),
  body('subject').notEmpty().withMessage('Asunto es requerido'),
  body('message').notEmpty().withMessage('Mensaje es requerido'),
  body('phone').optional().isMobilePhone('es-MX').withMessage('Teléfono inválido')
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

    const { name, email, phone, subject, message } = req.body;

    // Crear mensaje
    const contactMessage = {
      id: messageIdCounter++,
      name,
      email,
      phone: phone || null,
      subject,
      message,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    messages.push(contactMessage);

    // Enviar confirmación por email
    await sendContactConfirmation(contactMessage);

    // Notificar al equipo
    await notifyTeam(contactMessage);

    res.status(201).json({
      success: true,
      data: contactMessage,
      message: 'Mensaje enviado exitosamente'
    });
  } catch (error) {
    console.error('Error sending contact message:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/contact/:id/status - Actualizar estado del mensaje
router.put('/:id/status', [
  body('status').isIn(['new', 'read', 'replied', 'archived'])
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

    const messageIndex = messages.findIndex(msg => msg.id === parseInt(id));
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Mensaje no encontrado'
      });
    }

    messages[messageIndex].status = status;
    messages[messageIndex].updatedAt = new Date().toISOString();
    if (notes) {
      messages[messageIndex].adminNotes = notes;
    }

    res.json({
      success: true,
      data: messages[messageIndex],
      message: 'Estado actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/contact/:id - Obtener mensaje específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const message = messages.find(msg => msg.id === parseInt(id));

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Mensaje no encontrado'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error getting contact message:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/contact/subscribe - Suscribirse al newsletter
router.post('/subscribe', [
  body('email').isEmail().withMessage('Email válido es requerido'),
  body('name').optional().isLength({ min: 2 }).withMessage('Nombre debe tener al menos 2 caracteres')
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

    const { email, name } = req.body;

    // En producción, guardar en base de datos
    console.log(`📧 Nueva suscripción al newsletter: ${email} (${name || 'Sin nombre'})`);

    // Enviar email de bienvenida
    await sendWelcomeEmail(email, name);

    res.json({
      success: true,
      message: 'Te has suscrito exitosamente al newsletter'
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/contact/info - Obtener información de contacto
router.get('/info', async (req, res) => {
  try {
    const contactInfo = {
      phone: '+52 555-0123',
      email: 'info@lahamburguezona.com',
      address: 'Av. Principal 123, Col. Centro, Ciudad de México',
      hours: {
        monday: '11:00 AM - 10:00 PM',
        tuesday: '11:00 AM - 10:00 PM',
        wednesday: '11:00 AM - 10:00 PM',
        thursday: '11:00 AM - 10:00 PM',
        friday: '11:00 AM - 11:00 PM',
        saturday: '11:00 AM - 11:00 PM',
        sunday: '12:00 PM - 9:00 PM'
      },
      social: {
        facebook: 'https://facebook.com/lahamburguezona',
        instagram: 'https://instagram.com/lahamburguezona',
        twitter: 'https://twitter.com/lahamburguezona',
        whatsapp: 'https://wa.me/525550123'
      },
      delivery: {
        available: true,
        minimumOrder: 200,
        deliveryFee: 30,
        freeDeliveryThreshold: 200,
        estimatedTime: '15-30 minutos'
      }
    };

    res.json({
      success: true,
      data: contactInfo
    });
  } catch (error) {
    console.error('Error getting contact info:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Funciones auxiliares
async function sendContactConfirmation(message) {
  // Simular envío de email de confirmación
  console.log(`📧 Email de confirmación enviado a: ${message.email}`);
  
  // En producción:
  // - Enviar email usando nodemailer
  // - Template de confirmación
  // - Incluir información de contacto
}

async function notifyTeam(message) {
  // Simular notificación al equipo
  console.log(`📱 Nuevo mensaje de contacto de: ${message.name} (${message.email})`);
  console.log(`📝 Asunto: ${message.subject}`);
  
  // En producción:
  // - Enviar notificación por Slack/Discord
  // - Enviar email al equipo
  // - Crear ticket en sistema de soporte
}

async function sendWelcomeEmail(email, name) {
  // Simular envío de email de bienvenida
  console.log(`📧 Email de bienvenida enviado a: ${email}`);
  
  // En producción:
  // - Enviar email usando nodemailer
  // - Template de bienvenida
  // - Incluir ofertas especiales
}

module.exports = router;

