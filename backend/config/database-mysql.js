const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lahamburguezona',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
let pool;

// Test database connection
const testConnection = async () => {
  try {
    // First, try to connect without specifying database to create it if needed
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    const tempConnection = await mysql.createConnection(tempConfig);
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempConnection.end();

    // Now create the pool with the database
    pool = mysql.createPool(dbConfig);
    
    // Test the connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL Database connection failed:', err.message);
    throw err;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create tables if they don't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100) NOT NULL,
        rating DECIMAL(3,2) DEFAULT 0,
        prep_time INT DEFAULT 0,
        is_spicy BOOLEAN DEFAULT FALSE,
        is_popular BOOLEAN DEFAULT FALSE,
        ingredients JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255),
        delivery_address TEXT NOT NULL,
        delivery_instructions TEXT,
        payment_method VARCHAR(50) DEFAULT 'cash',
        payment_status VARCHAR(50) DEFAULT 'pending',
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        tax DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        estimated_delivery_time TIMESTAMP NULL,
        actual_delivery_time TIMESTAMP NULL,
        notes TEXT,
        status_notes TEXT,
        cancelled_at TIMESTAMP NULL,
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        menu_item_id INT,
        menu_item_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        changed_by VARCHAR(100),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        menu_item_id INT,
        rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        comment TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        total_orders INT DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        last_order_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'COCINA', 'REPARTIDOR', 'CAJA') NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT NULL,
        FOREIGN KEY (created_by) REFERENCES admin_users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'contact',
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS hero_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        cta_text VARCHAR(100) DEFAULT '¡Ordena Ahora!',
        cta_link VARCHAR(255) DEFAULT '/pedidos',
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insert default admin user if it doesn't exist
    const [adminExists] = await connection.execute('SELECT id FROM admin_users WHERE username = ?', ['admin']);
    if (adminExists.length === 0) {
      // In production, use proper password hashing (bcrypt)
      await connection.execute(`
        INSERT INTO admin_users (username, email, password_hash, role) 
        VALUES (?, ?, ?, ?)
      `, ['admin', 'admin@lahamburguezona.com', 'admin123', 'admin']);
      console.log('✅ Default admin user created');
    }

    // Insert default menu items if they don't exist
    const [menuExists] = await connection.execute('SELECT id FROM menu_items LIMIT 1');
    if (menuExists.length === 0) {
      console.log('Creating default menu items...');
      
      // Insert first menu item
      await connection.execute(`
        INSERT INTO menu_items (name, description, price, image, category, rating, prep_time, is_popular, ingredients)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Monstruo Clásico',
        'Nuestra hamburguesa estrella con carne 100% res, queso cheddar, lechuga, tomate, cebolla y nuestra salsa especial.',
        180,
        '/images/burgers/monstruo-clasico.jpg',
        'Monstruo Clásico',
        4.9,
        12,
        true,
        JSON.stringify(['Carne de res', 'Queso cheddar', 'Lechuga', 'Tomate', 'Cebolla', 'Salsa especial'])
      ]);
      
      // Insert second menu item
      await connection.execute(`
        INSERT INTO menu_items (name, description, price, image, category, rating, prep_time, is_popular, ingredients)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Zona BBQ',
        'Deliciosa hamburguesa con carne ahumada, bacon crujiente, cebolla caramelizada y salsa BBQ casera.',
        220,
        '/images/burgers/zona-bbq.jpg',
        'Zona Sabor',
        4.8,
        15,
        false,
        JSON.stringify(['Carne ahumada', 'Bacon', 'Cebolla caramelizada', 'Salsa BBQ', 'Queso gouda'])
      ]);
      
      // Insert third menu item
      await connection.execute(`
        INSERT INTO menu_items (name, description, price, image, category, rating, prep_time, is_popular, ingredients)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Refresco 500ml',
        'Coca-Cola, Sprite, Fanta o Agua de sabor.',
        35,
        '/images/drinks/refresco.jpg',
        'Bebidas',
        4.0,
        2,
        false,
        JSON.stringify(['Refresco de cola', 'Hielo'])
      ]);
      
      console.log('✅ Default menu items created');
    }

    // Insert default hero images if they don't exist
    const [heroExists] = await connection.execute('SELECT id FROM hero_images LIMIT 1');
    if (heroExists.length === 0) {
      console.log('Creating default hero images...');
      
      await connection.execute(`
        INSERT INTO hero_images (title, subtitle, description, image_url, cta_text, cta_link, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        '¡Sabor que conquista!',
        'Bienvenido a',
        'Descubre el sabor auténtico de las mejores hamburguesas de la ciudad. Ingredientes frescos, preparación artesanal y un sabor que te conquistará desde el primer bocado.',
        '/images/hero-bg.jpg',
        '¡Ordena Ahora!',
        '/pedidos',
        true,
        1
      ]);
      
      console.log('✅ Default hero images created');
    }

    connection.release();
    console.log('✅ MySQL Database tables initialized successfully');
  } catch (err) {
    console.error('❌ MySQL Database initialization failed:', err.message);
    throw err;
  }
};

// Get database connection
const getConnection = async () => {
  if (!pool) {
    await testConnection();
  }
  return pool.getConnection();
};

// Execute query
const executeQuery = async (query, params = []) => {
  try {
    if (!pool) {
      await testConnection();
    }
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  getConnection,
  executeQuery
};
