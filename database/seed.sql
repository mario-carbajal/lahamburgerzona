-- La Hamburguezona Database Seed Data
-- MySQL Database Seed Data

USE lahamburguezona;

-- Insert default menu items
INSERT INTO menu_items (name, description, price, image, category, rating, prep_time, is_popular, is_spicy, ingredients) VALUES
('Monstruo Clásico', 'Hamburguesa con carne 100% res, queso cheddar, lechuga, tomate, cebolla y nuestra salsa especial.', 180.00, '/images/burgers/monstruo-clasico.jpg', 'monstruo-clasico', 4.9, 12, TRUE, FALSE, JSON_ARRAY('Carne de res', 'Queso cheddar', 'Lechuga', 'Tomate', 'Cebolla', 'Salsa especial')),
('Zona BBQ', 'Deliciosa hamburguesa con carne ahumada, bacon crujiente, cebolla caramelizada y salsa BBQ casera.', 220.00, '/images/burgers/zona-bbq.jpg', 'zona-sabor', 4.8, 15, TRUE, FALSE, JSON_ARRAY('Carne ahumada', 'Bacon', 'Cebolla caramelizada', 'Salsa BBQ', 'Queso gouda')),
('Monstruo Picante', 'Para los valientes: carne de res, jalapeños, queso pepper jack, salsa picante y cebolla morada.', 200.00, '/images/burgers/monstruo-picante.jpg', 'monstruo-clasico', 4.7, 13, FALSE, TRUE, JSON_ARRAY('Carne de res', 'Jalapeños', 'Queso pepper jack', 'Salsa picante', 'Cebolla morada')),
('Zona Hawaiana', 'Exótica combinación con piña asada, jamón, queso suizo y salsa teriyaki.', 240.00, '/images/burgers/zona-hawaiana.jpg', 'zona-sabor', 4.6, 16, FALSE, FALSE, JSON_ARRAY('Carne de res', 'Piña asada', 'Jamón', 'Queso suizo', 'Salsa teriyaki')),
('Combo Monstruo', 'Monstruo Clásico + Papas deluxe + Bebida de 500ml', 280.00, '/images/combos/combo-monstruo.jpg', 'combos-brutales', 4.9, 15, TRUE, FALSE, JSON_ARRAY('Hamburguesa Monstruo Clásico', 'Papas deluxe', 'Bebida 500ml')),
('Combo Zona', 'Zona BBQ + Papas deluxe + Bebida de 500ml', 320.00, '/images/combos/combo-zona.jpg', 'combos-brutales', 4.8, 18, TRUE, FALSE, JSON_ARRAY('Hamburguesa Zona BBQ', 'Papas deluxe', 'Bebida 500ml')),
('Coca-Cola', 'Refrescante Coca-Cola de 500ml', 35.00, '/images/drinks/coca-cola.jpg', 'bebidas', 4.5, 1, TRUE, FALSE, JSON_ARRAY('Coca-Cola')),
('Agua Natural', 'Agua purificada de 500ml', 25.00, '/images/drinks/agua-natural.jpg', 'bebidas', 4.3, 1, FALSE, FALSE, JSON_ARRAY('Agua purificada')),
('Papas Deluxe', 'Papas fritas crujientes con sal marina y especias especiales', 80.00, '/images/extras/papas-deluxe.jpg', 'extras', 4.6, 8, TRUE, FALSE, JSON_ARRAY('Papas', 'Sal marina', 'Especias especiales')),
('Aros de Cebolla', 'Aros de cebolla empanizados y fritos hasta el punto perfecto', 90.00, '/images/extras/aros-cebolla.jpg', 'extras', 4.4, 10, FALSE, FALSE, JSON_ARRAY('Cebolla', 'Harina', 'Huevo', 'Pan molido'));

-- Insert default hero images
INSERT INTO hero_images (title, subtitle, description, image_url, cta_text, cta_link, is_active, sort_order) VALUES
('¡Sabor que conquista!', 'Bienvenido a', 'Descubre el sabor auténtico de las mejores hamburguesas de la ciudad. Ingredientes frescos, preparación artesanal y un sabor que te conquistará desde el primer bocado.', '/images/hero-bg.jpg', '¡Ordena Ahora!', '/pedidos', TRUE, 1);

-- Insert some sample customers
INSERT INTO customers (name, email, phone, address, total_orders, total_spent) VALUES
('Juan Pérez', 'juan.perez@email.com', '5551234567', 'Calle Principal 123, Col. Centro', 3, 540.00),
('María García', 'maria.garcia@email.com', '5552345678', 'Av. Reforma 456, Col. Juárez', 2, 360.00),
('Carlos López', 'carlos.lopez@email.com', '5553456789', 'Calle Insurgentes 789, Col. Roma', 1, 180.00);

-- Insert some sample reviews
INSERT INTO reviews (customer_name, customer_email, menu_item_id, rating, comment, status) VALUES
('Juan Pérez', 'juan.perez@email.com', 1, 5, 'Excelente hamburguesa, muy sabrosa y bien preparada. La recomiendo totalmente.', 'approved'),
('María García', 'maria.garcia@email.com', 1, 4, 'Muy buena hamburguesa, solo le faltó un poco más de salsa.', 'approved'),
('Carlos López', 'carlos.lopez@email.com', 2, 5, 'La Zona BBQ es increíble, perfecta para cuando tienes mucha hambre.', 'approved'),
('Ana Martínez', 'ana.martinez@email.com', 2, 4, 'La Zona BBQ está muy buena, el bacon le da un sabor especial.', 'approved'),
('Luis Rodríguez', 'luis.rodriguez@email.com', 9, 5, 'Las papas deluxe están perfectas, doradas y crujientes.', 'approved');
