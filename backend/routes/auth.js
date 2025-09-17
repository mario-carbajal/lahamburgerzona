const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simulación de base de datos en memoria (en producción usar PostgreSQL)
let users = [];
let userIdCounter = 1;

// POST /api/auth/register - Registrar nuevo usuario (admin)
router.post('/register', [
  body('name').notEmpty().withMessage('Nombre es requerido'),
  body('email').isEmail().withMessage('Email válido es requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('role').optional().isIn(['admin', 'staff']).withMessage('Rol inválido')
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

    const { name, email, password, role = 'staff' } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya existe'
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = {
      id: userIdCounter++,
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(user);

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remover contraseña de la respuesta
    const userResponse = { ...user };
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Usuario registrado exitosamente'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', [
  body('email').isEmail().withMessage('Email válido es requerido'),
  body('password').notEmpty().withMessage('Contraseña es requerida')
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

    const { email, password } = req.body;

    // Buscar usuario
    const user = users.find(u => u.email === email && u.isActive);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remover contraseña de la respuesta
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Inicio de sesión exitoso'
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', async (req, res) => {
  try {
    // En producción, invalidar token en base de datos
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Remover contraseña de la respuesta
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/auth/profile - Actualizar perfil
router.put('/profile', authenticateToken, [
  body('name').optional().isLength({ min: 2 }).withMessage('Nombre debe tener al menos 2 caracteres'),
  body('email').optional().isEmail().withMessage('Email válido es requerido')
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

    const { name, email } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== users[userIndex].email) {
      const existingUser = users.find(u => u.email === email && u.id !== req.user.userId);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está en uso'
        });
      }
    }

    // Actualizar campos si se proporcionan
    if (name !== undefined) {
      users[userIndex].name = name;
    }
    if (email !== undefined) {
      users[userIndex].email = email;
    }
    
    users[userIndex].updatedAt = new Date().toISOString();

    // Remover contraseña de la respuesta
    const userResponse = { ...users[userIndex] };
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse,
      message: 'Perfil actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Contraseña actual es requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres')
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

    const { currentPassword, newPassword } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[userIndex].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    users[userIndex].password = hashedNewPassword;
    users[userIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido'
      });
    }
    req.user = user;
    next();
  });
}

// Middleware de autorización
function authorizeRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
}

module.exports = router;

