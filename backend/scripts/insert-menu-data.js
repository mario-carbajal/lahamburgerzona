const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lahamburguezona',
  port: process.env.DB_PORT || 3306,
};

// Datos del menú estático que estaban en el frontend
const menuItems = [
  // Monstruo Clásico
  {
    name: 'Monstruo Doble',
    description: 'Doble carne, doble queso, doble sabor. Para los más hambrientos.',
    price: 240,
    image: '/images/burgers/monstruo-doble.jpg',
    category: 'Monstruo Clásico',
    rating: 4.8,
    prep_time: 15,
    is_popular: false,
    is_spicy: false,
    ingredients: ['Doble carne', 'Doble queso cheddar', 'Lechuga', 'Tomate', 'Cebolla', 'Salsa especial']
  },
  
  // Zona Sabor
  {
    name: 'Zona BBQ',
    description: 'Deliciosa hamburguesa con carne ahumada, bacon crujiente, cebolla caramelizada y salsa BBQ casera.',
    price: 220,
    image: '/images/burgers/zona-bbq.jpg',
    category: 'Zona Sabor',
    rating: 4.8,
    prep_time: 15,
    is_popular: false,
    is_spicy: false,
    ingredients: ['Carne ahumada', 'Bacon', 'Cebolla caramelizada', 'Salsa BBQ', 'Queso gouda']
  },
  {
    name: 'Zona Picante',
    description: 'Para los amantes del picante: jalapeños, salsa picante, queso pepper jack y nuestra salsa especial.',
    price: 200,
    image: '/images/burgers/zona-picante.jpg',
    category: 'Zona Sabor',
    rating: 4.7,
    prep_time: 13,
    is_popular: false,
    is_spicy: true,
    ingredients: ['Carne de res', 'Jalapeños', 'Salsa picante', 'Queso pepper jack', 'Lechuga', 'Tomate']
  },
  {
    name: 'Zona Mediterránea',
    description: 'Sabor mediterráneo con queso feta, tomate seco, aceitunas y pesto de albahaca.',
    price: 210,
    image: '/images/burgers/zona-mediterranea.jpg',
    category: 'Zona Sabor',
    rating: 4.6,
    prep_time: 14,
    is_popular: false,
    is_spicy: false,
    ingredients: ['Carne de res', 'Queso feta', 'Tomate seco', 'Aceitunas', 'Pesto de albahaca', 'Lechuga']
  },
  
  // Combos Brutales
  {
    name: 'Brutal Doble',
    description: 'Para los más hambrientos: doble carne, doble queso, doble sabor. Una experiencia brutal de sabor.',
    price: 280,
    image: '/images/burgers/brutal-doble.jpg',
    category: 'Combos Brutales',
    rating: 4.7,
    prep_time: 18,
    is_popular: true,
    is_spicy: false,
    ingredients: ['Doble carne', 'Doble queso', 'Bacon', 'Lechuga', 'Tomate', 'Salsa especial']
  },
  {
    name: 'Brutal Triple',
    description: 'El combo más brutal: triple carne, triple queso, triple todo. Solo para valientes.',
    price: 350,
    image: '/images/burgers/brutal-triple.jpg',
    category: 'Combos Brutales',
    rating: 4.5,
    prep_time: 20,
    is_popular: false,
    is_spicy: false,
    ingredients: ['Triple carne', 'Triple queso', 'Doble bacon', 'Lechuga', 'Tomate', 'Cebolla', 'Salsa especial']
  },
  
  // Bebidas
  {
    name: 'Malteada de Vainilla',
    description: 'Cremosa malteada de vainilla con topping de crema batida.',
    price: 65,
    image: '/images/drinks/malteada-vainilla.jpg',
    category: 'Bebidas',
    rating: 4.5,
    prep_time: 5,
    is_popular: false,
    is_spicy: false,
    ingredients: ['Leche', 'Helado de vainilla', 'Crema batida', 'Sirope de vainilla']
  },
  {
    name: 'Agua Fresca',
    description: 'Agua fresca de jamaica, horchata o limón.',
    price: 25,
    image: '/images/drinks/agua-fresca.jpg',
    category: 'Bebidas',
    rating: 4.2,
    prep_time: 3,
    is_popular: false,
    is_spicy: false,
    ingredients: ['Agua', 'Fruta natural', 'Azúcar']
  },
  
  // Extras
  {
    name: 'Papas Fritas',
    description: 'Papas fritas doradas y crujientes, perfectas para acompañar tu hamburguesa.',
    price: 45,
    image: '/images/extras/papas-fritas.jpg',
    category: 'Extras',
    rating: 4.3,
    prep_time: 8,
    is_popular: false,
    is_spicy: false,
    ingredients: ['Papas', 'Aceite', 'Sal']
  },
  {
    name: 'Aros de Cebolla',
    description: 'Aros de cebolla empanizados y fritos hasta quedar dorados.',
    price: 55,
    image: '/images/extras/aros-cebolla.jpg',
    category: 'Extras',
    rating: 4.4,
    prep_time: 10,
    is_popular: false,
    is_spicy: false,
    ingredients: ['Cebolla', 'Harina', 'Huevo', 'Pan molido']
  },
  {
    name: 'Nuggets de Pollo',
    description: 'Tiernos nuggets de pollo empanizados, crujientes por fuera y jugosos por dentro.',
    price: 75,
    image: '/images/extras/nuggets-pollo.jpg',
    category: 'Extras',
    rating: 4.6,
    prep_time: 12,
    is_popular: false,
    is_spicy: false,
    ingredients: ['Pechuga de pollo', 'Harina', 'Huevo', 'Pan molido', 'Especias']
  }
];

async function insertMenuItems() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');
    
    console.log('📝 Insertando items del menú...');
    
    for (const item of menuItems) {
      // Verificar si el item ya existe
      const [existing] = await connection.execute(
        'SELECT id FROM menu_items WHERE name = ?',
        [item.name]
      );
      
      if (existing.length > 0) {
        console.log(`⚠️  Item "${item.name}" ya existe, omitiendo...`);
        continue;
      }
      
      // Insertar el nuevo item
      await connection.execute(`
        INSERT INTO menu_items (
          name, description, price, image, category, rating, prep_time, 
          is_popular, is_spicy, ingredients, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.name,
        item.description,
        item.price,
        item.image,
        item.category,
        item.rating,
        item.prep_time,
        item.is_popular,
        item.is_spicy,
        JSON.stringify(item.ingredients),
        true // is_active
      ]);
      
      console.log(`✅ Insertado: ${item.name}`);
    }
    
    console.log('🎉 Todos los items del menú han sido insertados correctamente');
    
    // Mostrar resumen
    const [summary] = await connection.execute('SELECT category, COUNT(*) as count FROM menu_items GROUP BY category');
    console.log('\n📊 Resumen por categoría:');
    summary.forEach(row => {
      console.log(`  ${row.category}: ${row.count} items`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
insertMenuItems();
