# 📊 Documentación de Operaciones de Base de Datos - Sistema POS Restaurante

## 📋 Índice
1. [Configuración de Base de Datos](#configuración-de-base-de-datos)
2. [Operaciones CRUD por Entidad](#operaciones-crud-por-entidad)
3. [Consultas y Vistas](#consultas-y-vistas)
4. [Procedimientos Almacenados](#procedimientos-almacenados)
5. [Triggers y Auditoría](#triggers-y-auditoría)
6. [Transacciones y Pagos](#transacciones-y-pagos)
7. [Servicios y Helpers](#servicios-y-helpers)

---

## 🔧 Configuración de Base de Datos

### Bases de Datos Configuradas

| Base de Datos | Host | Puerto | Usuario | Propósito |
|---------------|------|--------|---------|-----------|
| **siscontr_pos37** | 148.113.218.187 | 3306 | admin | Base de datos principal POS |
| **siscontr_contable** | localhost | 3306 | siscontr_contable | Contabilidad |
| **siscontr_ventas** | 149.56.13.205 | 3307 | admin | Ventas |
| **siscontr_cosurca** | 149.56.13.205 | 3307 | admin | Cosurca |

### Configuración de Pool de Conexiones
```javascript
const poolConfig = {
  min: 2,           // Conexiones mínimas
  max: 10,          // Conexiones máximas
  acquire: 30000,   // Tiempo de adquisición (ms)
  idle: 10000       // Tiempo de inactividad (ms)
}
```

---

## 🗄️ Operaciones CRUD por Entidad

### 1. PRODUCTOS (products)

#### **CREATE - Crear Producto**
```sql
-- Operación principal
INSERT INTO products (name, sku, image, product_description, business_id, not_for_selling, order_area_id)
VALUES (?, ?, ?, ?, ?, ?, ?)

-- Crear variación del producto
INSERT INTO product_variations (product_id, name, is_dummy)
VALUES (?, 'DUMMY', 1)

-- Crear precio de la variación
INSERT INTO variations (product_id, product_variation_id, sell_price_inc_tax)
VALUES (?, ?, ?)
```

#### **READ - Consultar Productos**
```sql
-- Obtener productos con paginación
SELECT DISTINCT 
  p.id, p.name, p.sku, p.category_id, c.name as category_name,
  v.sell_price_inc_tax, p.image, p.product_description, 
  p.business_id, p.not_for_selling, p.order_area_id
FROM products p
LEFT JOIN variations v ON p.id = v.product_id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.business_id = ?
ORDER BY p.id DESC
LIMIT ? OFFSET ?

-- Obtener productos por business_id (para ventas)
SELECT DISTINCT 
  p.id, p.name, p.sku, v.sell_price_inc_tax, p.image, 
  p.product_description, p.business_id, p.not_for_selling, p.order_area_id
FROM products p
LEFT JOIN variations v ON p.id = v.product_id
WHERE p.business_id = ? AND p.not_for_selling = 1 AND p.is_inactive = 0
ORDER BY p.id DESC
LIMIT ? OFFSET ?

-- Obtener producto por ID
SELECT * FROM products WHERE id = ?
```

#### **UPDATE - Actualizar Producto**
```sql
-- Actualizar información del producto
UPDATE products 
SET name = COALESCE(?, name),
    sku = COALESCE(?, sku),
    image = COALESCE(?, image),
    product_description = COALESCE(?, product_description),
    not_for_selling = COALESCE(?, not_for_selling),
    order_area_id = COALESCE(?, order_area_id)
WHERE id = ?

-- Actualizar precio de la variación
UPDATE variations SET sell_price_inc_tax = ? WHERE product_id = ?
```

#### **DELETE - Eliminar Producto**
```sql
-- Eliminar variaciones
DELETE v FROM variations v
JOIN product_variations pv ON pv.id = v.product_variation_id
WHERE v.product_id = ?

-- Eliminar product_variations
DELETE FROM product_variations WHERE product_id = ?

-- Eliminar producto
DELETE FROM products WHERE id = ?
```

### 2. MESAS (tables)

#### **CREATE - Crear Mesa**
```sql
INSERT INTO tables (number, x, y, width, height, seats, status, shape, 
                   assignedWaiter, section, location, notes, isActive, createdAt, updatedAt)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
```

#### **READ - Consultar Mesas**
```sql
-- Obtener todas las mesas
SELECT id, number, x, y, width, height, seats, status, shape,
       assignedWaiter, section, location, notes, isActive, createdAt, updatedAt
FROM tables
WHERE isActive = 1
ORDER BY number

-- Obtener mesa por ID
SELECT id, number, x, y, width, height, seats, status, shape,
       assignedWaiter, section, location, notes, isActive, createdAt, updatedAt
FROM tables
WHERE id = ?
```

#### **UPDATE - Actualizar Mesa**
```sql
UPDATE tables
SET number = ?, x = ?, y = ?, width = ?, height = ?, seats = ?,
    status = ?, shape = ?, assignedWaiter = ?, section = ?, 
    location = ?, notes = ?, updatedAt = NOW()
WHERE id = ?
```

#### **DELETE - Eliminar Mesa (Soft Delete)**
```sql
UPDATE tables
SET isActive = 0, updatedAt = NOW()
WHERE id = ?
```

### 3. ÓRDENES DE MESA (table_orders)

#### **CREATE - Crear Orden**
```sql
INSERT INTO table_orders (tableId, items, total, status, orderType, waiter,
                         customerInfo, bills, splitMode, printedAreas, createdAt, updatedAt)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
```

#### **READ - Consultar Órdenes**
```sql
-- Obtener órdenes de una mesa
SELECT id, tableId, items, total, status, orderType, waiter,
       customerInfo, bills, splitMode, printedAreas, createdAt, updatedAt
FROM table_orders
WHERE tableId = ? AND status IN ('active', 'split')
ORDER BY createdAt DESC
```

#### **UPDATE - Actualizar Orden**
```sql
UPDATE table_orders
SET items = ?, total = ?, status = ?, orderType = ?, waiter = ?,
    customerInfo = ?, bills = ?, splitMode = ?, printedAreas = ?, updatedAt = NOW()
WHERE id = ?
```

### 4. RECETAS (mfg_recipes)

#### **CREATE - Crear Receta**
```sql
INSERT INTO mfg_recipes (
  product_id, variation_id, instructions, waste_percent, 
  ingredients_cost, extra_cost, production_cost_type, 
  total_quantity, final_price, sub_unit_id, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())

-- Crear ingredientes de la receta
INSERT INTO mfg_recipe_ingredients (
  recipe_id, ingredient_id, quantity, unit_id, created_at, updated_at
) VALUES (?, ?, ?, ?, NOW(), NOW())
```

#### **READ - Consultar Recetas**
```sql
-- Obtener todas las recetas
SELECT r.*, p.name AS product_name
FROM mfg_recipes r
JOIN products p ON r.product_id = p.id
ORDER BY r.created_at DESC

-- Obtener recetas por fecha
SELECT r.*, p.name AS product_name
FROM mfg_recipes r
JOIN products p ON r.product_id = p.id
WHERE DATE(r.created_at) >= ?
ORDER BY r.created_at DESC

-- Obtener receta por ID
SELECT * FROM mfg_recipes WHERE id = ?
```

#### **UPDATE - Actualizar Receta**
```sql
UPDATE mfg_recipes 
SET name = ?, product_id = ?, instructions = ?, cost = ?, waste = ?, updated_at = NOW() 
WHERE id = ?
```

#### **DELETE - Eliminar Receta**
```sql
DELETE FROM mfg_recipes WHERE id = ?
```

### 5. GRUPOS DE INGREDIENTES (mfg_ingredient_groups)

#### **CREATE - Crear Grupo**
```sql
INSERT INTO mfg_ingredient_groups (name, description, created_at, updated_at)
VALUES (?, ?, NOW(), NOW())
```

#### **READ - Consultar Grupos**
```sql
-- Obtener todos los grupos
SELECT * FROM mfg_ingredient_groups ORDER BY name ASC

-- Obtener grupo por ID
SELECT * FROM mfg_ingredient_groups WHERE id = ?
```

#### **UPDATE - Actualizar Grupo**
```sql
UPDATE mfg_ingredient_groups 
SET name = ?, description = ?, updated_at = NOW() 
WHERE id = ?
```

#### **DELETE - Eliminar Grupo**
```sql
DELETE FROM mfg_ingredient_groups WHERE id = ?
```

### 6. CLIENTES (contacts)

#### **READ - Consultar Clientes**
```sql
-- Obtener clientes por business_id
SELECT 
  c.id,
  COALESCE(NULLIF(TRIM(c.name), ''), c.supplier_business_name) as name,
  c.supplier_business_name, 
  c.contact_id 
FROM contacts c 
WHERE c.business_id = ?

-- Obtener cliente por defecto
SELECT 
  c.id,
  COALESCE(NULLIF(TRIM(c.name), ''), c.supplier_business_name) as name,
  c.supplier_business_name, 
  c.contact_id 
FROM contacts c 
WHERE c.business_id = ? AND c.is_default = 1
```

### 7. TRANSACCIONES (transactions)

#### **CREATE - Crear Transacción**
```sql
INSERT INTO transactions (
  business_id, location_id, type, status, payment_status,
  contact_id, number, invoice_no, transaction_date, final_total,
  created_by, created_at, updated_at, resolution, prefix,
  res_table_id, essentials_duration
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

-- Crear líneas de venta
INSERT INTO transaction_sell_lines (
  transaction_id, product_id, variation_id, quantity, unit_price,
  unit_price_inc_tax, item_tax, tax_id, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

### 8. PAGOS (transaction_payments)

#### **CREATE - Crear Pago**
```sql
INSERT INTO transaction_payments (transaction_id, method, amount) 
VALUES (?, ?, ?)
```

### 9. ÁREAS DE ORDEN (order_areas)

#### **CREATE - Crear Área**
```sql
INSERT INTO order_areas (name, business_location_id) VALUES (?, ?)
```

#### **READ - Consultar Áreas**
```sql
SELECT id, name FROM order_areas
```

#### **UPDATE - Actualizar Área**
```sql
UPDATE order_areas SET name = ? WHERE id = ?
```

#### **DELETE - Eliminar Área**
```sql
DELETE FROM order_areas WHERE id = ?
```

### 10. UNIDADES (units)

#### **READ - Consultar Unidades**
```sql
SELECT id, actual_name FROM units WHERE id IN (?, ?, ...)
```

---

## 🔍 Consultas y Vistas

### Vistas Creadas

#### **active_orders**
```sql
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
WHERE to.status IN ('active', 'split')
```

#### **kitchen_pending_orders**
```sql
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
ORDER BY ko.priority DESC, ko.createdAt ASC
```

### Consultas Especializadas

#### **Productos por Categoría**
```sql
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.business_id = ?
```

#### **Categorías con Productos**
```sql
SELECT DISTINCT c.id, c.name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.business_id = ?
```

#### **Órdenes de Cocina Pendientes**
```sql
SELECT 
    ko.id, ko.tableId, t.number as tableNumber, ko.items,
    ko.area, ko.status, ko.priority, ko.createdAt
FROM kitchen_orders ko
LEFT JOIN tables t ON ko.tableId = t.id
WHERE ko.status IN ('pending', 'preparing')
ORDER BY ko.priority DESC, ko.createdAt ASC
```

---

## 📋 Procedimientos Almacenados

### **GetTableOrders(tableId)**
```sql
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
DELIMITER ;
```

### **GetProductsByCategory(categoryName)**
```sql
DELIMITER //
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
DELIMITER ;
```

### **UpdateTableStatus(tableId, newStatus)**
```sql
DELIMITER //
CREATE PROCEDURE UpdateTableStatus(IN tableId INT, IN newStatus VARCHAR(50))
BEGIN
    UPDATE tables 
    SET status = newStatus, updatedAt = NOW()
    WHERE id = tableId;
END //
DELIMITER ;
```

---

## 🔔 Triggers y Auditoría

### Tabla de Auditoría
```sql
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
)
```

### Triggers de Auditoría

#### **audit_products_update**
```sql
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
DELIMITER ;
```

#### **audit_tables_update**
```sql
DELIMITER //
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
```

---

## 💰 Transacciones y Pagos

### Flujo de Transacción Completa

#### **1. Crear Transacción Principal**
```sql
INSERT INTO transactions (
  business_id, location_id, type, status, payment_status,
  contact_id, number, invoice_no, transaction_date, final_total,
  created_by, created_at, updated_at, resolution, prefix,
  res_table_id, essentials_duration
) VALUES (?, ?, 'sell', 'final', 'paid', ?, ?, ?, ?, ?, ?, ?, ?, 'POSE', 'POSE', ?, 0)
```

#### **2. Crear Líneas de Venta**
```sql
INSERT INTO transaction_sell_lines (
  transaction_id, product_id, variation_id, quantity, unit_price,
  unit_price_inc_tax, item_tax, tax_id, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

#### **3. Crear Pagos**
```sql
INSERT INTO transaction_payments (transaction_id, method, amount) 
VALUES (?, ?, ?)
```

### Consultas de Transacciones

#### **Obtener Transacciones por Mesa**
```sql
SELECT * FROM transactions 
WHERE res_table_id = ? AND type = 'sell'
ORDER BY created_at DESC
```

#### **Obtener Pagos de Transacción**
```sql
SELECT * FROM transaction_payments 
WHERE transaction_id = ?
```

---

## 🛠️ Servicios y Helpers

### Funciones Helper Principales

#### **executePosQuery(query, params)**
```javascript
// Ejecuta queries en la base de datos principal POS
export async function executePosQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await posPool.execute(query, params)
    return rows
  } catch (error) {
    console.error('Error ejecutando query POS:', error)
    throw error
  }
}
```

#### **executeContableQuery(query, params)**
```javascript
// Ejecuta queries en la base de datos de contabilidad
export async function executeContableQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await contablePool.execute(query, params)
    return rows
  } catch (error) {
    console.error('Error ejecutando query Contable:', error)
    throw error
  }
}
```

#### **executeVentasQuery(query, params)**
```javascript
// Ejecuta queries en la base de datos de ventas
export async function executeVentasQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await ventasPool.execute(query, params)
    return rows
  } catch (error) {
    console.error('Error ejecutando query Ventas:', error)
    throw error
  }
}
```

#### **executeCosurcaQuery(query, params)**
```javascript
// Ejecuta queries en la base de datos cosurca
export async function executeCosurcaQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await cosurcaPool.execute(query, params)
    return rows
  } catch (error) {
    console.error('Error ejecutando query Cosurca:', error)
    throw error
  }
}
```

### Servicios Principales

#### **ProductService**
- `getProducts(businessId, page, pageSize)` - Obtener productos con paginación
- `getProductsByBusinessId(businessId, limit, offset)` - Obtener productos por negocio
- `createProduct(data)` - Crear producto con transacción
- `updateProduct(id, data)` - Actualizar producto
- `deleteProduct(id)` - Eliminar producto con transacción
- `getProductById(id)` - Obtener producto por ID

#### **TableService**
- `getAllTables()` - Obtener todas las mesas
- `getTableById(id)` - Obtener mesa por ID
- `createTable(table)` - Crear nueva mesa
- `updateTable(id, updates)` - Actualizar mesa
- `deleteTable(id)` - Eliminar mesa (soft delete)
- `getTableOrders(tableId)` - Obtener órdenes de mesa
- `createTableOrder(tableId, order)` - Crear orden de mesa
- `updateTableOrder(orderId, updates)` - Actualizar orden de mesa

#### **RecipeService**
- `getAllRecipes()` - Obtener todas las recetas
- `getRecipesByDate(date)` - Obtener recetas por fecha
- `createRecipe(data)` - Crear receta con ingredientes
- `getRecipeById(id)` - Obtener receta por ID
- `updateRecipe(id, data)` - Actualizar receta
- `deleteRecipe(id)` - Eliminar receta

#### **IngredientGroupService**
- `getAllIngredientGroups()` - Obtener todos los grupos
- `createIngredientGroup(data)` - Crear grupo
- `getIngredientGroupById(id)` - Obtener grupo por ID
- `updateIngredientGroup(id, data)` - Actualizar grupo
- `deleteIngredientGroup(id)` - Eliminar grupo

---

## 📊 Estadísticas y Métricas

### Consultas de Estadísticas

#### **Productos por Categoría**
```sql
SELECT 
    c.name as category,
    COUNT(p.id) as product_count,
    AVG(v.sell_price_inc_tax) as avg_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN variations v ON p.id = v.product_id
WHERE c.business_id = ?
GROUP BY c.id, c.name
```

#### **Órdenes por Estado**
```sql
SELECT 
    status,
    COUNT(*) as order_count,
    SUM(total) as total_amount
FROM table_orders
WHERE DATE(createdAt) = CURDATE()
GROUP BY status
```

#### **Ventas por Día**
```sql
SELECT 
    DATE(transaction_date) as sale_date,
    COUNT(*) as transaction_count,
    SUM(final_total) as total_sales
FROM transactions
WHERE type = 'sell' AND status = 'final'
GROUP BY DATE(transaction_date)
ORDER BY sale_date DESC
```

---

## 🔒 Seguridad y Validación

### Validaciones de Entrada
- Verificación de tokens JWT para autenticación
- Validación de business_id en todas las operaciones
- Sanitización de parámetros SQL
- Validación de tipos de datos

### Manejo de Errores
- Rollback automático en transacciones fallidas
- Logging detallado de errores
- Respuestas de error estructuradas
- Timeout en conexiones de base de datos

---

## 📝 Notas Importantes

1. **Transacciones**: Todas las operaciones críticas usan transacciones para garantizar consistencia
2. **Soft Deletes**: Las eliminaciones son principalmente soft deletes (isActive = 0)
3. **Auditoría**: Cambios importantes se registran en la tabla audit_log
4. **Índices**: Se han creado índices optimizados para consultas frecuentes
5. **Timezone**: Las fechas se manejan en zona horaria de Bogotá (UTC-5)
6. **Pool de Conexiones**: Se utiliza pool de conexiones para optimizar rendimiento

---

*Documentación generada automáticamente basada en el análisis del código del sistema POS Restaurante* 