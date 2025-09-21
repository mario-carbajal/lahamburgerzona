const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database-mysql');

async function createAdminUser() {
  try {
    console.log('🔧 Creando usuario administrador inicial...');

    // Verificar si ya existe un usuario admin
    const existingAdmin = await executeQuery(
      'SELECT id FROM admin_users WHERE role = "ADMIN" LIMIT 1'
    );

    if (existingAdmin.length > 0) {
      console.log('✅ Ya existe un usuario administrador en el sistema');
      return;
    }

    // Datos del administrador inicial
    const adminData = {
      username: 'admin',
      email: 'admin@lahamburguezona.com',
      password: 'admin123', // Cambiar en producción
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

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Usuario: ${adminData.username}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Contraseña: [HIDDEN]`);
    console.log(`   Rol: ${adminData.role}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminUser().then(() => {
    console.log('🎯 Script completado');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Error en script:', error);
    process.exit(1);
  });
}

module.exports = { createAdminUser };
