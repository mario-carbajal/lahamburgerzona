const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Cambiar si tienes contraseña
  database: 'lahamburguezona'
};

async function insertAdminUser() {
  let connection;
  
  try {
    console.log('🔧 Conectando a la base de datos...');
    
    // Crear conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');

    // Verificar si ya existe un usuario admin
    const [existingAdmin] = await connection.execute(
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

    console.log('🔐 Encriptando contraseña...');
    // Encriptar contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(adminData.password, saltRounds);

    console.log('👤 Insertando usuario administrador...');
    // Crear usuario administrador
    const [result] = await connection.execute(`
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
    console.log('🌐 Credenciales para login:');
    console.log(`   URL: http://localhost:3000/admin/login`);
    console.log(`   Usuario: ${adminData.username}`);
    console.log(`   Contraseña: [HIDDEN]`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('');
      console.log('💡 Solución:');
      console.log('   1. Verifica que MySQL esté corriendo');
      console.log('   2. Verifica las credenciales en dbConfig');
      console.log('   3. Asegúrate de que la base de datos "lahamburguezona" existe');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  insertAdminUser().then(() => {
    console.log('🎯 Script completado');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Error en script:', error);
    process.exit(1);
  });
}

module.exports = { insertAdminUser };
