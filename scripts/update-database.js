const mysql = require('mysql2/promise');

async function updateDatabase() {
  const connection = await mysql.createConnection({
    host: '149.56.13.205',
    port: 3307,
    user: 'admin',
    password: 'Siscontri+2024*',
    database: 'siscontr_pos37'
  });

  try {
    console.log('Conectando a la base de datos...');

    // Crear tabla categories si no existe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        business_id INT NOT NULL,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_business_id (business_id),
        INDEX idx_active (isActive)
      )
    `);
    console.log('✅ Tabla categories creada/verificada');

    // Crear tabla products con la nueva estructura (sin foreign key por ahora)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products_new (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        business_id INT NOT NULL,
        category_id INT NOT NULL,
        sku VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500) NULL,
        preparationArea ENUM('kitchen', 'cafeteria', 'bar') DEFAULT 'kitchen',
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_business_id (business_id),
        INDEX idx_category_id (category_id),
        INDEX idx_sku (sku),
        INDEX idx_preparation_area (preparationArea),
        INDEX idx_active (isActive)
      )
    `);
    console.log('✅ Tabla products_new creada');

    // Insertar categorías de ejemplo (business_id = 165)
    await connection.execute(`
      INSERT INTO categories (name, business_id) VALUES
      ('Comidas', 165),
      ('Bebidas', 165),
      ('Postres', 165),
      ('BENDICION', 165),
      ('FERRETERÍA', 165)
      ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP
    `);
    console.log('✅ Categorías insertadas');

    // Insertar productos de ejemplo (business_id = 165)
    await connection.execute(`
      INSERT INTO products_new (name, business_id, category_id, sku, price, image, preparationArea) VALUES
      ('Cheeseburger', 165, 1, 'BURG001', 8.99, '/classic-beef-burger.png', 'kitchen'),
      ('Pepperoni Pizza', 165, 1, 'PIZZA001', 12.99, '/delicious-pizza.png', 'kitchen'),
      ('Caesar Salad', 165, 1, 'SALAD001', 7.99, '/vibrant-mixed-salad.png', 'kitchen'),
      ('Chicken Wings', 165, 1, 'WING001', 9.99, '/crispy-chicken-wings.png', 'kitchen'),
      ('French Fries', 165, 1, 'FRIES001', 3.99, '/crispy-french-fries.png', 'kitchen'),
      ('Coca Cola', 165, 2, 'SODA001', 2.49, '/refreshing-cola.png', 'bar'),
      ('Iced Tea', 165, 2, 'TEA001', 2.99, '/iced-tea.png', 'bar'),
      ('Orange Juice', 165, 2, 'JUICE001', 3.49, '/glass-of-orange-juice.png', 'bar'),
      ('Latte', 165, 2, 'COFFEE001', 4.49, '/latte-coffee.png', 'cafeteria'),
      ('Bottled Water', 165, 2, 'WATER001', 1.99, '/bottled-water.png', 'bar'),
      ('Chocolate Cake', 165, 3, 'CAKE001', 5.99, '/chocolate-cake-slice.png', 'cafeteria'),
      ('Cheesecake', 165, 3, 'CAKE002', 6.49, '/cheesecake-slice.png', 'cafeteria'),
      ('Ice Cream', 165, 3, 'ICE001', 4.99, '/ice-cream-sundae.png', 'cafeteria'),
      ('Apple Pie', 165, 3, 'PIE001', 5.49, '/apple-pie-slice.png', 'cafeteria'),
      ('Brownie', 165, 3, 'BROW001', 3.99, '/chocolate-brownie.png', 'cafeteria')
      ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP
    `);
    console.log('✅ Productos insertados');

    // Verificar que todo funciona
    const [categories] = await connection.execute(`
      SELECT DISTINCT c.id, c.name
      FROM products_new p
      JOIN categories c ON p.category_id = c.id
      WHERE p.business_id = 165
    `);
    console.log('✅ Categorías encontradas:', categories);

    console.log('🎉 Base de datos actualizada exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

updateDatabase(); 