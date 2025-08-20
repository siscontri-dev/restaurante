-- Script SQL para crear las tablas del sistema POS
-- Base de datos: siscontr_pos37

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS siscontr_pos37 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE siscontr_pos37;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_id INT NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_business_id (business_id),
    INDEX idx_active (isActive)
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
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
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_business_id (business_id),
    INDEX idx_category_id (category_id),
    INDEX idx_sku (sku),
    INDEX idx_preparation_area (preparationArea),
    INDEX idx_active (isActive)
);

-- Tabla de mesas
CREATE TABLE IF NOT EXISTS tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number INT UNIQUE NOT NULL,
    x INT DEFAULT 0,
    y INT DEFAULT 0,
    width INT DEFAULT 120,
    height INT DEFAULT 80,
    seats INT DEFAULT 4,
    status ENUM('available', 'occupied', 'reserved', 'needs-cleaning') DEFAULT 'available',
    shape ENUM('rectangle', 'circle') DEFAULT 'rectangle',
    assignedWaiter VARCHAR(100) NULL,
    section VARCHAR(100) NULL,
    location VARCHAR(100) NULL,
    notes TEXT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_number (number),
    INDEX idx_status (status),
    INDEX idx_section (section),
    INDEX idx_active (isActive)
);

-- Tabla de órdenes de mesa
CREATE TABLE IF NOT EXISTS table_orders (
    id VARCHAR(50) PRIMARY KEY,
    tableId INT NOT NULL,
    items JSON NOT NULL, -- Array de productos con cantidad
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'completed', 'cancelled', 'split') DEFAULT 'active',
    orderType ENUM('dine-in', 'online', 'presencial') DEFAULT 'dine-in',
    waiter VARCHAR(100) NULL,
    customerInfo JSON NULL, -- Información del cliente
    bills JSON NULL, -- Array de facturas divididas
    splitMode BOOLEAN DEFAULT FALSE,
    printedAreas JSON NULL, -- Áreas donde se imprimió la comanda
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tableId) REFERENCES tables(id) ON DELETE CASCADE,
    INDEX idx_table_id (tableId),
    INDEX idx_status (status),
    INDEX idx_order_type (orderType),
    INDEX idx_created_at (createdAt)
);

-- Tabla de órdenes online
CREATE TABLE IF NOT EXISTS online_orders (
    id VARCHAR(50) PRIMARY KEY,
    customerName VARCHAR(255) NOT NULL,
    customerPhone VARCHAR(50) NOT NULL,
    customerAddress TEXT NULL,
    items JSON NOT NULL, -- Array de productos con cantidad
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'delivered', 'cancelled') DEFAULT 'pending',
    notes TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_customer_phone (customerPhone),
    INDEX idx_created_at (createdAt)
);

-- Tabla de meseros
CREATE TABLE IF NOT EXISTS waiters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (isActive)
);

-- Tabla de órdenes de cocina
CREATE TABLE IF NOT EXISTS kitchen_orders (
    id VARCHAR(50) PRIMARY KEY,
    tableId INT NULL,
    orderId VARCHAR(50) NOT NULL,
    items JSON NOT NULL, -- Productos para preparar
    area ENUM('kitchen', 'cafeteria', 'bar') NOT NULL,
    status ENUM('pending', 'preparing', 'ready', 'delivered') DEFAULT 'pending',
    priority INT DEFAULT 1,
    notes TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tableId) REFERENCES tables(id) ON DELETE SET NULL,
    INDEX idx_table_id (tableId),
    INDEX idx_area (area),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (createdAt)
);

-- Insertar datos de ejemplo para categorías (business_id = 165)
INSERT INTO categories (name, business_id) VALUES
('Comidas', 165),
('Bebidas', 165),
('Postres', 165),
('BENDICION', 165),
('FERRETERÍA', 165)
ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP;

-- Insertar datos de ejemplo para productos (business_id = 165)
INSERT INTO products (name, business_id, category_id, sku, price, image, preparationArea) VALUES
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
ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP;

-- Insertar datos de ejemplo para mesas
INSERT INTO tables (number, x, y, width, height, seats, status, shape, section, location) VALUES
(1, 100, 100, 120, 80, 4, 'available', 'rectangle', 'Principal', 'Ventana'),
(2, 300, 100, 120, 80, 4, 'available', 'rectangle', 'Principal', 'Centro'),
(3, 500, 100, 100, 100, 6, 'available', 'circle', 'VIP', 'Esquina'),
(4, 100, 250, 120, 80, 4, 'available', 'rectangle', 'Principal', 'Pared'),
(5, 300, 250, 160, 80, 6, 'available', 'rectangle', 'Familiar', 'Centro'),
(6, 500, 250, 100, 100, 4, 'available', 'circle', 'Terraza', 'Exterior')
ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP;

-- Insertar datos de ejemplo para meseros
INSERT INTO waiters (name, code) VALUES
('Juan Pérez', 'WAITER001'),
('María García', 'WAITER002'),
('Carlos López', 'WAITER003')
ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP;

-- Crear vistas útiles
CREATE OR REPLACE VIEW active_orders AS
SELECT 
    to.id,
    to.tableId,
    t.number as tableNumber,
    to.items,
    to.total,
    to.status,
    to.orderType,
    to.waiter,
    to.createdAt
FROM table_orders to
JOIN tables t ON to.tableId = t.id
WHERE to.status IN ('active', 'split');

CREATE OR REPLACE VIEW kitchen_pending_orders AS
SELECT 
    ko.id,
    ko.tableId,
    t.number as tableNumber,
    ko.items,
    ko.area,
    ko.status,
    ko.priority,
    ko.createdAt
FROM kitchen_orders ko
LEFT JOIN tables t ON ko.tableId = t.id
WHERE ko.status IN ('pending', 'preparing')
ORDER BY ko.priority DESC, ko.createdAt ASC;

-- Crear procedimientos almacenados útiles
DELIMITER //

CREATE PROCEDURE GetTableOrders(IN tableId INT)
BEGIN
    SELECT 
        to.id,
        to.items,
        to.total,
        to.status,
        to.orderType,
        to.waiter,
        to.customerInfo,
        to.bills,
        to.splitMode,
        to.printedAreas,
        to.createdAt,
        to.updatedAt
    FROM table_orders to
    WHERE to.tableId = tableId AND to.status IN ('active', 'split')
    ORDER BY to.createdAt DESC;
END //

CREATE PROCEDURE GetProductsByCategory(IN categoryName VARCHAR(100))
BEGIN
    SELECT 
        id,
        name,
        price,
        image,
        category,
        preparationArea
    FROM products
    WHERE isActive = 1 AND category = categoryName
    ORDER BY name;
END //

CREATE PROCEDURE UpdateTableStatus(IN tableId INT, IN newStatus VARCHAR(50))
BEGIN
    UPDATE tables 
    SET status = newStatus, updatedAt = NOW()
    WHERE id = tableId;
END //

DELIMITER ;

-- Crear triggers para auditoría
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    user_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_name (table_name),
    INDEX idx_action (action),
    INDEX idx_record_id (record_id),
    INDEX idx_created_at (created_at)
);

DELIMITER //

CREATE TRIGGER audit_products_update
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, record_id, old_values, new_values)
    VALUES ('products', 'UPDATE', NEW.id, JSON_OBJECT(
        'name', OLD.name,
        'price', OLD.price,
        'category', OLD.category,
        'preparationArea', OLD.preparationArea
    ), JSON_OBJECT(
        'name', NEW.name,
        'price', NEW.price,
        'category', NEW.category,
        'preparationArea', NEW.preparationArea
    ));
END //

CREATE TRIGGER audit_tables_update
AFTER UPDATE ON tables
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, record_id, old_values, new_values)
    VALUES ('tables', 'UPDATE', NEW.id, JSON_OBJECT(
        'number', OLD.number,
        'status', OLD.status,
        'assignedWaiter', OLD.assignedWaiter
    ), JSON_OBJECT(
        'number', NEW.number,
        'status', NEW.status,
        'assignedWaiter', NEW.assignedWaiter
    ));
END //

DELIMITER ;

-- Mostrar mensaje de éxito
SELECT 'Base de datos siscontr_pos37 creada exitosamente con todas las tablas y datos de ejemplo' as message; 