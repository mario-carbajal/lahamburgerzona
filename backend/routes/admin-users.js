const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { executeQuery } = require('../config/database-mysql');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'admin-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de ADMIN' });
  }
  next();
};

// POST /api/admin-users/login - Iniciar sesión
router.post('/login', [
  body('username').notEmpty().withMessage('Usuario es requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;

    // Buscar usuario
    const users = await executeQuery(
      'SELECT * FROM admin_users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Actualizar último login
    await executeQuery(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        full_name: user.full_name
      },
      process.env.JWT_SECRET || 'admin-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          phone: user.phone,
          last_login: user.last_login
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/admin-users/profile - Obtener perfil del usuario actual
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await executeQuery(
      'SELECT id, username, email, role, full_name, phone, last_login, created_at FROM admin_users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/admin-users - Obtener todos los usuarios (solo ADMIN)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        id, username, email, role, full_name, phone, 
        is_active, last_login, created_at, updated_at
      FROM admin_users
    `;

    if (role) {
      query += ` WHERE role = '${role}'`;
    }

    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const users = await executeQuery(query);

    // Obtener total de usuarios
    let countQuery = 'SELECT COUNT(*) as total FROM admin_users';
    
    if (role) {
      countQuery += ` WHERE role = '${role}'`;
    }

    const countResult = await executeQuery(countQuery);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// POST /api/admin-users - Crear nuevo usuario (solo ADMIN)
router.post('/', authenticateToken, requireAdmin, [
  body('username').isLength({ min: 3 }).withMessage('Usuario debe tener al menos 3 caracteres'),
  body('email').isEmail().withMessage('Email válido es requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('role').isIn(['ADMIN', 'COCINA', 'REPARTIDOR', 'CAJA']).withMessage('Rol inválido'),
  body('full_name').notEmpty().withMessage('Nombre completo es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, role, full_name, phone } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await executeQuery(
      'SELECT id FROM admin_users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Usuario o email ya existe' });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const result = await executeQuery(`
      INSERT INTO admin_users (username, email, password_hash, role, full_name, phone, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [username, email, password_hash, role, full_name, phone, req.user.id]);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: result.insertId,
        username,
        email,
        role,
        full_name,
        phone
      }
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// PUT /api/admin-users/:id - Actualizar usuario (solo ADMIN)
router.put('/:id', authenticateToken, requireAdmin, [
  body('email').optional().isEmail().withMessage('Email válido es requerido'),
  body('role').optional().isIn(['ADMIN', 'COCINA', 'REPARTIDOR', 'CAJA']).withMessage('Rol inválido'),
  body('full_name').optional().notEmpty().withMessage('Nombre completo es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { email, role, full_name, phone, is_active } = req.body;

    // Verificar si el usuario existe
    const existingUser = await executeQuery(
      'SELECT id FROM admin_users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Construir query de actualización
    const updateFields = [];
    const params = [];

    if (email) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (role) {
      updateFields.push('role = ?');
      params.push(role);
    }
    if (full_name) {
      updateFields.push('full_name = ?');
      params.push(full_name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE admin_users SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// DELETE /api/admin-users/:id - Eliminar usuario (solo ADMIN)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar el propio usuario
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes eliminar tu propio usuario' });
    }

    // Verificar si el usuario existe
    const existingUser = await executeQuery(
      'SELECT id FROM admin_users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Eliminar usuario
    await executeQuery('DELETE FROM admin_users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// POST /api/admin-users/:id/reset-password - Resetear contraseña (solo ADMIN)
router.post('/:id/reset-password', authenticateToken, requireAdmin, [
  body('new_password').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { new_password } = req.body;

    // Verificar si el usuario existe
    const existingUser = await executeQuery(
      'SELECT id FROM admin_users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Encriptar nueva contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    // Actualizar contraseña
    await executeQuery(
      'UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [password_hash, id]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/admin-users/verify-token - Verificar si el token es válido
router.get('/verify-token', authenticateToken, async (req, res) => {
  try {
    // Si llegamos aquí, el token es válido (authenticateToken ya lo verificó)
    res.json({
      success: true,
      message: 'Token válido',
      user: req.user
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/admin-users/refresh-token - Refrescar token
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    // Generar nuevo token
    const newToken = jwt.sign(
      { id: req.user.id, username: req.user.username, role: req.user.role },
      process.env.JWT_SECRET || 'admin-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Token refrescado exitosamente',
      data: { token: newToken }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
