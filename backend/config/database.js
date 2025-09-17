const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lahamburguezona',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(-1);
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100) NOT NULL,
        rating DECIMAL(3,2) DEFAULT 0,
        prep_time INTEGER DEFAULT 0,
        is_spicy BOOLEAN DEFAULT FALSE,
        is_popular BOOLEAN DEFAULT FALSE,
        ingredients TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255),
        delivery_address TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        menu_item_id INTEGER REFERENCES menu_items(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        comment TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        last_order_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'contact',
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin user if it doesn't exist
    const adminExists = await client.query('SELECT id FROM admin_users WHERE username = $1', ['admin']);
    if (adminExists.rows.length === 0) {
      // In production, use proper password hashing (bcrypt)
      await client.query(`
        INSERT INTO admin_users (username, email, password_hash, role) 
        VALUES ($1, $2, $3, $4)
      `, ['admin', 'admin@lahamburguezona.com', 'admin123', 'admin']);
      console.log('✅ Default admin user created');
    }

    // Insert default menu items if they don't exist
    const menuExists = await client.query('SELECT id FROM menu_items LIMIT 1');
    if (menuExists.rows.length === 0) {
      const defaultMenuItems = [
        {
          name: 'Monstruo Clásico',
          description: 'Nuestra hamburguesa estrella con carne 100% res, queso cheddar, lechuga, tomate, cebolla y nuestra salsa especial.',
          price: 180,
          image: '/images/burgers/monstruo-clasico.jpg',
          category: 'Monstruo Clásico',
          rating: 4.9,
          prep_time: 12,
          is_popular: true,
          ingredients: ['Carne de res', 'Queso cheddar', 'Lechuga', 'Tomate', 'Cebolla', 'Salsa especial']
        },
        {
          name: 'Zona BBQ',
          description: 'Deliciosa hamburguesa con carne ahumada, bacon crujiente, cebolla caramelizada y salsa BBQ casera.',
          price: 220,
          image: '/images/burgers/zona-bbq.jpg',
          category: 'Zona Sabor',
          rating: 4.8,
          prep_time: 15,
          ingredients: ['Carne ahumada', 'Bacon', 'Cebolla caramelizada', 'Salsa BBQ', 'Queso gouda']
        },
        {
          name: 'Refresco 500ml',
          description: 'Coca-Cola, Sprite, Fanta o Agua de sabor.',
          price: 35,
          image: '/images/drinks/refresco.jpg',
          category: 'Bebidas',
          rating: 4.0,
          prep_time: 2,
          ingredients: ['Refresco de cola', 'Hielo']
        }
      ];

      for (const item of defaultMenuItems) {
        await client.query(`
          INSERT INTO menu_items (name, description, price, image, category, rating, prep_time, is_popular, ingredients)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [item.name, item.description, item.price, item.image, item.category, item.rating, item.prep_time, item.is_popular, item.ingredients]);
      }
      console.log('✅ Default menu items created');
    }

    client.release();
    console.log('✅ Database tables initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
