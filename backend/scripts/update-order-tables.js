const mysql = require('mysql2/promise');

async function updateOrderTables() {
  let connection;
  
  try {
    // Conectar a la base de datos usando la misma configuración que el servidor
    const config = {
      host: 'localhost',
      user: 'root',
      password: '', // Sin contraseña para desarrollo local
      database: 'lahamburguezona',
      port: 3306,
      charset: 'utf8mb4',
      timezone: 'Z'
    };
    
    connection = await mysql.createConnection(config);

    console.log('🔗 Conectado a la base de datos MySQL');

    // Verificar si la tabla order_items existe y tiene las columnas correctas
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'lahamburguezona' 
      AND TABLE_NAME = 'order_items'
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Columnas existentes en order_items:', existingColumns);

    // Agregar columnas faltantes
    if (!existingColumns.includes('menu_item_name')) {
      console.log('➕ Agregando columna menu_item_name...');
      await connection.execute(`
        ALTER TABLE order_items 
        ADD COLUMN menu_item_name VARCHAR(255) NOT NULL DEFAULT ''
      `);
      console.log('✅ Columna menu_item_name agregada');
    }

    if (!existingColumns.includes('unit_price')) {
      console.log('➕ Agregando columna unit_price...');
      await connection.execute(`
        ALTER TABLE order_items 
        ADD COLUMN unit_price DECIMAL(10,2) NOT NULL DEFAULT 0
      `);
      console.log('✅ Columna unit_price agregada');
    }

    if (!existingColumns.includes('total_price')) {
      console.log('➕ Agregando columna total_price...');
      await connection.execute(`
        ALTER TABLE order_items 
        ADD COLUMN total_price DECIMAL(10,2) NOT NULL DEFAULT 0
      `);
      console.log('✅ Columna total_price agregada');
    }

    if (!existingColumns.includes('special_instructions')) {
      console.log('➕ Agregando columna special_instructions...');
      await connection.execute(`
        ALTER TABLE order_items 
        ADD COLUMN special_instructions TEXT
      `);
      console.log('✅ Columna special_instructions agregada');
    }

    // Verificar si la tabla order_status_history existe
    const [historyExists] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'lahamburguezona' 
      AND TABLE_NAME = 'order_status_history'
    `);

    if (historyExists[0].count === 0) {
      console.log('➕ Creando tabla order_status_history...');
      await connection.execute(`
        CREATE TABLE order_status_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          status VARCHAR(50) NOT NULL,
          notes TEXT,
          changed_by VARCHAR(100),
          changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabla order_status_history creada');
    }

    // Actualizar columnas de la tabla orders si faltan
    const [orderColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'lahamburguezona' 
      AND TABLE_NAME = 'orders'
    `);

    const existingOrderColumns = orderColumns.map(col => col.COLUMN_NAME);
    console.log('📋 Columnas existentes en orders:', existingOrderColumns);

    // Agregar columnas faltantes en orders
    const newOrderColumns = [
      { name: 'delivery_instructions', type: 'TEXT' },
      { name: 'payment_method', type: 'VARCHAR(50) DEFAULT "cash"' },
      { name: 'payment_status', type: 'VARCHAR(50) DEFAULT "pending"' },
      { name: 'subtotal', type: 'DECIMAL(10,2) NOT NULL DEFAULT 0' },
      { name: 'delivery_fee', type: 'DECIMAL(10,2) DEFAULT 0' },
      { name: 'tax', type: 'DECIMAL(10,2) DEFAULT 0' },
      { name: 'estimated_delivery_time', type: 'TIMESTAMP NULL' },
      { name: 'actual_delivery_time', type: 'TIMESTAMP NULL' },
      { name: 'status_notes', type: 'TEXT' },
      { name: 'cancelled_at', type: 'TIMESTAMP NULL' },
      { name: 'cancellation_reason', type: 'TEXT' }
    ];

    for (const column of newOrderColumns) {
      if (!existingOrderColumns.includes(column.name)) {
        console.log(`➕ Agregando columna ${column.name}...`);
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN ${column.name} ${column.type}
        `);
        console.log(`✅ Columna ${column.name} agregada`);
      }
    }

    console.log('🎉 Base de datos actualizada exitosamente');

  } catch (error) {
    console.error('❌ Error actualizando la base de datos:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateOrderTables();
}

module.exports = updateOrderTables;
