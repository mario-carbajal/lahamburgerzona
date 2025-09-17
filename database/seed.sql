-- La Hamburguezona Database Seed Data
-- Insert sample data for development and testing

-- Insert categories
INSERT INTO categories (name, description, image_url, display_order) VALUES
('Monstruo Clásico', 'Nuestras hamburguesas tradicionales con sabor auténtico', '/images/categories/monstruo-clasico.jpg', 1),
('Zona Sabor', 'Hamburguesas con sabores únicos y especiales', '/images/categories/zona-sabor.jpg', 2),
('Combos Brutales', 'Para los más hambrientos, hamburguesas XXL', '/images/categories/combos-brutales.jpg', 3),
('Bebidas', 'Refrescos, malteadas y bebidas frescas', '/images/categories/bebidas.jpg', 4),
('Extras', 'Acompañamientos perfectos para tu hamburguesa', '/images/categories/extras.jpg', 5);

-- Insert ingredients
INSERT INTO ingredients (name, is_allergen, allergen_type) VALUES
-- Proteins
('Carne de res 100%', false, null),
('Pechuga de pollo', false, null),
('Bacon', false, null),

-- Cheeses
('Queso cheddar', true, 'lacteos'),
('Queso gouda', true, 'lacteos'),
('Queso pepper jack', true, 'lacteos'),
('Queso feta', true, 'lacteos'),

-- Vegetables
('Lechuga fresca', false, null),
('Tomate', false, null),
('Cebolla morada', false, null),
('Cebolla caramelizada', false, null),
('Jalapeños frescos', false, null),
('Tomate seco', false, null),
('Aceitunas negras', false, null),

-- Sauces and condiments
('Salsa especial', false, null),
('Salsa BBQ casera', false, null),
('Salsa picante', false, null),
('Pesto de albahaca', false, null),

-- Bread
('Pan artesanal', true, 'gluten'),
('Pan artesanal XXL', true, 'gluten'),

-- Drinks ingredients
('Refresco de cola', false, null),
('Leche entera', true, 'lacteos'),
('Helado de vainilla', true, 'lacteos'),
('Crema batida', true, 'lacteos'),
('Sirope de vainilla', false, null),
('Cereza', false, null),
('Agua purificada', false, null),
('Fruta natural', false, null),
('Azúcar', false, null),
('Hielo', false, null),

-- Extras ingredients
('Papas frescas', false, null),
('Aceite vegetal', false, null),
('Sal marina', false, null),
('Especias', false, null),
('Cebolla fresca', false, null),
('Harina', true, 'gluten'),
('Huevo', true, 'huevo'),
('Pan molido', true, 'gluten');

-- Insert menu items
INSERT INTO menu_items (category_id, name, description, price, image_url, rating, prep_time, is_popular, is_spicy, is_vegetarian, display_order) VALUES
-- Monstruo Clásico
((SELECT id FROM categories WHERE name = 'Monstruo Clásico'), 'Monstruo Clásico', 'Nuestra hamburguesa estrella con carne 100% res, queso cheddar, lechuga, tomate, cebolla y nuestra salsa especial.', 180.00, '/images/burgers/monstruo-clasico.jpg', 4.9, 12, true, false, false, 1),
((SELECT id FROM categories WHERE name = 'Monstruo Clásico'), 'Monstruo Doble', 'Doble carne, doble queso, doble sabor. Para los más hambrientos.', 240.00, '/images/burgers/monstruo-doble.jpg', 4.8, 15, false, false, false, 2),

-- Zona Sabor
((SELECT id FROM categories WHERE name = 'Zona Sabor'), 'Zona BBQ', 'Deliciosa hamburguesa con carne ahumada, bacon crujiente, cebolla caramelizada y salsa BBQ casera.', 220.00, '/images/burgers/zona-bbq.jpg', 4.8, 15, true, false, false, 1),
((SELECT id FROM categories WHERE name = 'Zona Sabor'), 'Zona Picante', 'Para los amantes del picante: jalapeños, salsa picante, queso pepper jack y nuestra salsa especial.', 200.00, '/images/burgers/zona-picante.jpg', 4.7, 13, false, true, false, 2),
((SELECT id FROM categories WHERE name = 'Zona Sabor'), 'Zona Mediterránea', 'Sabor mediterráneo con queso feta, tomate seco, aceitunas y pesto de albahaca.', 210.00, '/images/burgers/zona-mediterranea.jpg', 4.6, 14, false, false, false, 3),

-- Combos Brutales
((SELECT id FROM categories WHERE name = 'Combos Brutales'), 'Brutal Doble', 'Para los más hambrientos: doble carne, doble queso, doble sabor. Una experiencia brutal de sabor.', 280.00, '/images/burgers/brutal-doble.jpg', 4.7, 18, true, false, false, 1),
((SELECT id FROM categories WHERE name = 'Combos Brutales'), 'Brutal Triple', 'El combo más brutal: triple carne, triple queso, triple todo. Solo para valientes.', 350.00, '/images/burgers/brutal-triple.jpg', 4.5, 20, false, false, false, 2),

-- Bebidas
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Refresco 500ml', 'Coca-Cola, Sprite, Fanta o Agua de sabor.', 35.00, '/images/drinks/refresco.jpg', 4.0, 2, false, false, true, 1),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Malteada de Vainilla', 'Cremosa malteada de vainilla con topping de crema batida.', 65.00, '/images/drinks/malteada-vainilla.jpg', 4.5, 5, true, false, true, 2),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Agua Fresca', 'Agua fresca de jamaica, horchata o limón.', 25.00, '/images/drinks/agua-fresca.jpg', 4.2, 3, false, false, true, 3),

-- Extras
((SELECT id FROM categories WHERE name = 'Extras'), 'Papas Fritas', 'Papas fritas doradas y crujientes, perfectas para acompañar tu hamburguesa.', 45.00, '/images/extras/papas-fritas.jpg', 4.3, 8, true, false, true, 1),
((SELECT id FROM categories WHERE name = 'Extras'), 'Aros de Cebolla', 'Aros de cebolla empanizados y fritos hasta quedar dorados.', 55.00, '/images/extras/aros-cebolla.jpg', 4.4, 10, false, false, true, 2),
((SELECT id FROM categories WHERE name = 'Extras'), 'Nuggets de Pollo', 'Tiernos nuggets de pollo empanizados, crujientes por fuera y jugosos por dentro.', 75.00, '/images/extras/nuggets-pollo.jpg', 4.6, 12, false, false, false, 3);

-- Insert nutrition information
INSERT INTO nutrition_info (menu_item_id, calories, protein, carbs, fat, fiber, sodium) VALUES
-- Monstruo Clásico
((SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), 650, 35.0, 45.0, 38.0, 3.0, 1200.0),
((SELECT id FROM menu_items WHERE name = 'Monstruo Doble'), 890, 58.0, 45.0, 56.0, 3.0, 1800.0),

-- Zona Sabor
((SELECT id FROM menu_items WHERE name = 'Zona BBQ'), 780, 42.0, 48.0, 45.0, 4.0, 1500.0),
((SELECT id FROM menu_items WHERE name = 'Zona Picante'), 720, 38.0, 46.0, 42.0, 3.0, 1400.0),
((SELECT id FROM menu_items WHERE name = 'Zona Mediterránea'), 680, 36.0, 44.0, 40.0, 5.0, 1300.0),

-- Combos Brutales
((SELECT id FROM menu_items WHERE name = 'Brutal Doble'), 1100, 68.0, 52.0, 72.0, 4.0, 2200.0),
((SELECT id FROM menu_items WHERE name = 'Brutal Triple'), 1450, 89.0, 55.0, 95.0, 4.0, 2800.0),

-- Bebidas
((SELECT id FROM menu_items WHERE name = 'Refresco 500ml'), 200, 0.0, 52.0, 0.0, 0.0, 20.0),
((SELECT id FROM menu_items WHERE name = 'Malteada de Vainilla'), 450, 12.0, 58.0, 18.0, 0.0, 150.0),
((SELECT id FROM menu_items WHERE name = 'Agua Fresca'), 120, 0.0, 30.0, 0.0, 0.0, 5.0),

-- Extras
((SELECT id FROM menu_items WHERE name = 'Papas Fritas'), 320, 4.0, 38.0, 16.0, 4.0, 600.0),
((SELECT id FROM menu_items WHERE name = 'Aros de Cebolla'), 280, 6.0, 32.0, 14.0, 2.0, 400.0),
((SELECT id FROM menu_items WHERE name = 'Nuggets de Pollo'), 380, 22.0, 28.0, 18.0, 2.0, 800.0);

-- Insert menu item ingredients relationships
-- Monstruo Clásico ingredients
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id) VALUES
((SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), (SELECT id FROM ingredients WHERE name = 'Carne de res 100%')),
((SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), (SELECT id FROM ingredients WHERE name = 'Queso cheddar')),
((SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), (SELECT id FROM ingredients WHERE name = 'Lechuga fresca')),
((SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), (SELECT id FROM ingredients WHERE name = 'Tomate')),
((SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), (SELECT id FROM ingredients WHERE name = 'Cebolla morada')),
((SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), (SELECT id FROM ingredients WHERE name = 'Salsa especial')),
((SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), (SELECT id FROM ingredients WHERE name = 'Pan artesanal'));

-- Zona BBQ ingredients
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id) VALUES
((SELECT id FROM menu_items WHERE name = 'Zona BBQ'), (SELECT id FROM ingredients WHERE name = 'Carne de res 100%')),
((SELECT id FROM menu_items WHERE name = 'Zona BBQ'), (SELECT id FROM ingredients WHERE name = 'Bacon')),
((SELECT id FROM menu_items WHERE name = 'Zona BBQ'), (SELECT id FROM ingredients WHERE name = 'Cebolla caramelizada')),
((SELECT id FROM menu_items WHERE name = 'Zona BBQ'), (SELECT id FROM ingredients WHERE name = 'Salsa BBQ casera')),
((SELECT id FROM menu_items WHERE name = 'Zona BBQ'), (SELECT id FROM ingredients WHERE name = 'Queso gouda')),
((SELECT id FROM menu_items WHERE name = 'Zona BBQ'), (SELECT id FROM ingredients WHERE name = 'Lechuga fresca')),
((SELECT id FROM menu_items WHERE name = 'Zona BBQ'), (SELECT id FROM ingredients WHERE name = 'Pan artesanal'));

-- Insert combos
INSERT INTO combos (name, description, price, original_price, image_url, is_popular) VALUES
('Combo Monstruo', 'Monstruo Clásico + Papas Fritas + Refresco', 220.00, 260.00, '/images/combos/combo-monstruo.jpg', true),
('Combo Brutal', 'Brutal Doble + Aros de Cebolla + Malteada', 350.00, 400.00, '/images/combos/combo-brutal.jpg', false);

-- Insert combo items
INSERT INTO combo_items (combo_id, menu_item_id, quantity) VALUES
-- Combo Monstruo
((SELECT id FROM combos WHERE name = 'Combo Monstruo'), (SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), 1),
((SELECT id FROM combos WHERE name = 'Combo Monstruo'), (SELECT id FROM menu_items WHERE name = 'Papas Fritas'), 1),
((SELECT id FROM combos WHERE name = 'Combo Monstruo'), (SELECT id FROM menu_items WHERE name = 'Refresco 500ml'), 1),

-- Combo Brutal
((SELECT id FROM combos WHERE name = 'Combo Brutal'), (SELECT id FROM menu_items WHERE name = 'Brutal Doble'), 1),
((SELECT id FROM combos WHERE name = 'Combo Brutal'), (SELECT id FROM menu_items WHERE name = 'Aros de Cebolla'), 1),
((SELECT id FROM combos WHERE name = 'Combo Brutal'), (SELECT id FROM menu_items WHERE name = 'Malteada de Vainilla'), 1);

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, birth_date, total_orders, total_spent) VALUES
('María González', 'maria.gonzalez@email.com', '+525551234567', 'Calle Flores 123, Col. Centro, CDMX', '1985-03-15', 5, 1250.00),
('Carlos Ruiz', 'carlos.ruiz@email.com', '+525551234568', 'Av. Reforma 456, Col. Juárez, CDMX', '1990-07-22', 3, 680.00),
('Ana Martínez', 'ana.martinez@email.com', '+525551234569', 'Calle Insurgentes 789, Col. Roma, CDMX', '1988-11-08', 7, 1890.00),
('Luis Pérez', 'luis.perez@email.com', '+525551234570', 'Calle Álvaro Obregón 321, Col. Condesa, CDMX', '1992-01-30', 2, 450.00),
('Sofia Herrera', 'sofia.herrera@email.com', '+525551234571', 'Av. Insurgentes Sur 654, Col. Del Valle, CDMX', '1995-09-12', 4, 920.00);

-- Insert sample reviews
INSERT INTO reviews (customer_id, menu_item_id, customer_name, customer_email, rating, comment, helpful_count, verified) VALUES
((SELECT id FROM customers WHERE name = 'María González'), (SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), 'María González', 'maria.gonzalez@email.com', 5, 'Las mejores hamburguesas de la ciudad. El sabor es increíble y la atención es excelente. Siempre llego aquí cuando tengo antojo de algo delicioso.', 12, true),
((SELECT id FROM customers WHERE name = 'Carlos Ruiz'), (SELECT id FROM menu_items WHERE name = 'Zona BBQ'), 'Carlos Ruiz', 'carlos.ruiz@email.com', 5, 'Siempre pido aquí. La rapidez en la entrega y la calidad de los ingredientes es insuperable. El servicio al cliente es de primera.', 8, true),
((SELECT id FROM customers WHERE name = 'Ana Martínez'), (SELECT id FROM menu_items WHERE name = 'Monstruo Clásico'), 'Ana Martínez', 'ana.martinez@email.com', 4, 'El Monstruo Clásico es mi favorita. Cada bocado es una explosión de sabor. Solo le pongo 4 estrellas porque a veces tardan un poco más en entregar.', 15, true),
((SELECT id FROM customers WHERE name = 'Luis Pérez'), (SELECT id FROM menu_items WHERE name = 'Brutal Doble'), 'Luis Pérez', 'luis.perez@email.com', 5, 'Increíble experiencia. Las papas fritas están perfectas y las hamburguesas son deliciosas. Definitivamente volveré.', 6, false),
((SELECT id FROM customers WHERE name = 'Sofia Herrera'), (SELECT id FROM menu_items WHERE name = 'Zona Picante'), 'Sofia Herrera', 'sofia.herrera@email.com', 5, 'Pedí por primera vez y quedé encantada. La presentación es perfecta y el sabor es excepcional. ¡Recomendado al 100%!', 9, true);

-- Insert sample contact messages
INSERT INTO contact_messages (name, email, phone, subject, message, status) VALUES
('Roberto Silva', 'roberto.silva@email.com', '+525551234572', 'Consulta sobre pedido', 'Hola, quería preguntar sobre el tiempo de entrega a mi zona. Vivo en Polanco y me interesa hacer un pedido.', 'new'),
('Elena Vargas', 'elena.vargas@email.com', '+525551234573', 'Sugerencia', 'Me encanta su comida, pero sería genial si pudieran agregar opciones vegetarianas al menú.', 'read'),
('Miguel Torres', 'miguel.torres@email.com', '+525551234574', 'Reclamo', 'Mi pedido llegó frío y sin algunos ingredientes. ¿Pueden ayudarme?', 'replied'),
('Carmen López', 'carmen.lopez@email.com', '+525551234575', 'Oportunidad de trabajo', 'Hola, soy chef y me interesa trabajar con ustedes. ¿Tienen vacantes disponibles?', 'new');

-- Insert sample newsletter subscribers
INSERT INTO newsletter_subscribers (email, name) VALUES
('cliente1@email.com', 'Cliente Frecuente'),
('cliente2@email.com', 'Amante de Hamburguesas'),
('cliente3@email.com', 'Foodie Local'),
('cliente4@email.com', 'Fan de La Hamburguezona');

-- Insert sample promotions
INSERT INTO promotions (title, description, discount_type, discount_value, minimum_order, valid_from, valid_until, usage_limit, is_active) VALUES
('Descuento de Bienvenida', '20% de descuento en tu primera orden', 'percentage', 20.00, 150.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 100, true),
('Envío Gratis', 'Envío gratis en pedidos mayores a $200', 'free_delivery', 30.00, 200.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', NULL, true),
('Combo Especial', '$50 pesos de descuento en combos', 'fixed', 50.00, 250.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 days', 50, true);

-- Update system settings with additional configuration
INSERT INTO system_settings (setting_key, setting_value, description, data_type, is_public) VALUES
('restaurant_hours', '{"monday":"11:00 AM - 10:00 PM","tuesday":"11:00 AM - 10:00 PM","wednesday":"11:00 AM - 10:00 PM","thursday":"11:00 AM - 10:00 PM","friday":"11:00 AM - 11:00 PM","saturday":"11:00 AM - 11:00 PM","sunday":"12:00 PM - 9:00 PM"}', 'Restaurant operating hours', 'json', true),
('social_media', '{"facebook":"https://facebook.com/lahamburguezona","instagram":"https://instagram.com/lahamburguezona","twitter":"https://twitter.com/lahamburguezona","whatsapp":"https://wa.me/525550123"}', 'Social media links', 'json', true),
('delivery_zones', '["Centro","Roma","Condesa","Polanco","Del Valle","Juárez"]', 'Available delivery zones', 'json', true),
('payment_methods', '["cash","card","whatsapp","online"]', 'Accepted payment methods', 'json', true),
('min_order_amount', '50', 'Minimum order amount', 'number', true),
('max_delivery_time', '45', 'Maximum delivery time in minutes', 'number', true);

-- Insert sample staff user
INSERT INTO users (name, email, password, role) VALUES
('Chef Principal', 'chef@lahamburguezona.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff');

COMMENT ON TABLE users IS 'System users (admin and staff)';
COMMENT ON TABLE categories IS 'Menu categories';
COMMENT ON TABLE menu_items IS 'Individual menu items';
COMMENT ON TABLE ingredients IS 'Available ingredients';
COMMENT ON TABLE customers IS 'Customer information';
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON TABLE reviews IS 'Customer reviews and ratings';
COMMENT ON TABLE contact_messages IS 'Contact form messages';
COMMENT ON TABLE newsletter_subscribers IS 'Newsletter subscription list';
COMMENT ON TABLE promotions IS 'Active promotions and discounts';
COMMENT ON TABLE system_settings IS 'System configuration settings';

