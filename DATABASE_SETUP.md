# Configuración de Bases de Datos MySQL para HeroUI POS System

## 📋 Resumen de Configuración

Este proyecto está configurado para conectarse a múltiples bases de datos MySQL:

### 🔗 Conexiones Configuradas

| Base de Datos | Host | Puerto | Usuario | Base de Datos |
|---------------|------|--------|---------|---------------|
| **POS Principal** | 149.56.13.205 | 3307 | admin | siscontr_pos37 |
| **Contabilidad** | localhost | 3306 | siscontr_contable | siscontr_contable |
| **Ventas** | 149.56.13.205 | 3307 | admin | siscontr_ventas |
| **Cosurca** | 149.56.13.205 | 3307 | admin | siscontr_cosurca |

## 🚀 Pasos de Configuración

### 1. Instalar Dependencias

```bash
npm install mysql2 prisma @prisma/client --legacy-peer-deps
```

### 2. Configurar Variables de Entorno

Copia el archivo `env.example` a `.env.local`:

```bash
cp env.example .env.local
```

### 3. Crear la Base de Datos Principal

Ejecuta el script SQL para crear las tablas:

```bash
# Conectarse a MySQL y ejecutar el script
mysql -h 149.56.13.205 -P 3307 -u admin -p siscontr_pos37 < database-schema.sql
```

O ejecuta el script manualmente en tu cliente MySQL.

### 4. Probar las Conexiones

```bash
node scripts/test-database.js
```

### 5. Generar el Cliente de Prisma

```bash
npx prisma generate
```

### 6. Ejecutar Migraciones (si usas Prisma)

```bash
npx prisma db push
```

## 📁 Estructura de Archivos

```
lib/
├── database.ts              # Configuración de conexiones MySQL
├── product-service.ts       # Servicio para productos
└── table-service.ts         # Servicio para mesas

prisma/
└── schema.prisma           # Schema de Prisma

scripts/
└── test-database.js        # Script de prueba de conexiones

database-schema.sql         # Script SQL para crear tablas
env.example                 # Variables de entorno de ejemplo
```

## 🔧 Configuración Detallada

### Variables de Entorno Principales

```env
# Base de datos principal POS
DATABASE_URL="mysql://admin:Siscontri+2024*@149.56.13.205:3307/siscontr_pos37"

# Base de datos de contabilidad
DATABASE_CONTABLE_URL="mysql://siscontr_contable:Contable*2021@localhost:3306/siscontr_contable"

# Configuración MySQL
MYSQL_HOST="149.56.13.205"
MYSQL_PORT="3307"
MYSQL_USER="admin"
MYSQL_PASSWORD="Siscontri+2024*"
MYSQL_DATABASE="siscontr_pos37"
```

### Configuración de Pool de Conexiones

```javascript
const poolConfig = {
  min: 2,           // Conexiones mínimas
  max: 10,          // Conexiones máximas
  acquire: 30000,   // Tiempo de adquisición (ms)
  idle: 10000       // Tiempo de inactividad (ms)
}
```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

1. **products** - Productos del menú
2. **tables** - Mesas del restaurante
3. **table_orders** - Órdenes de mesa
4. **online_orders** - Órdenes online
5. **waiters** - Meseros
6. **kitchen_orders** - Órdenes de cocina
7. **audit_log** - Log de auditoría

### Vistas Útiles

- `active_orders` - Órdenes activas
- `kitchen_pending_orders` - Órdenes pendientes de cocina

### Procedimientos Almacenados

- `GetTableOrders(tableId)` - Obtener órdenes de una mesa
- `GetProductsByCategory(categoryName)` - Productos por categoría
- `UpdateTableStatus(tableId, newStatus)` - Actualizar estado de mesa

## 🔍 Verificación de Conexiones

### Script de Prueba

```bash
node scripts/test-database.js
```

### Salida Esperada

```
🚀 Iniciando pruebas de conexión a bases de datos...

🔍 Probando conexión a pos...
   Host: 149.56.13.205:3307
   Database: siscontr_pos37
✅ Conexión exitosa a pos
✅ Query de prueba exitosa: {"test":1}

📊 Resumen de resultados:
========================
pos        : ✅ CONECTADO
contable   : ✅ CONECTADO
ventas     : ✅ CONECTADO
cosurca    : ✅ CONECTADO

🎉 ¡Todas las conexiones son exitosas!
```

## 🛠️ Uso en el Código

### Importar Configuración

```typescript
import { posPool, contablePool, testConnections } from '@/lib/database'
```

### Ejecutar Queries

```typescript
import { executePosQuery } from '@/lib/database'

// Obtener productos
const products = await executePosQuery('SELECT * FROM products WHERE isActive = 1')

// Insertar producto
const result = await executePosQuery(
  'INSERT INTO products (name, price, category) VALUES (?, ?, ?)',
  ['Nuevo Producto', 10.99, 'food']
)
```

### Usar Servicios

```typescript
import { ProductService } from '@/lib/product-service'
import { TableService } from '@/lib/table-service'

// Obtener todos los productos
const products = await ProductService.getAllProducts()

// Obtener mesas por estado
const occupiedTables = await TableService.getTablesByStatus('occupied')
```

## 🔒 Seguridad

### Recomendaciones

1. **Variables de Entorno**: Nunca commits credenciales en el código
2. **SSL**: Habilitar SSL para conexiones remotas
3. **Pool de Conexiones**: Configurar límites apropiados
4. **Auditoría**: Usar los triggers de auditoría incluidos

### Configuración SSL (Opcional)

```env
MYSQL_SSL_ENABLED=true
MYSQL_SSL_CA="/path/to/ca-cert.pem"
MYSQL_SSL_CERT="/path/to/client-cert.pem"
MYSQL_SSL_KEY="/path/to/client-key.pem"
```

## 🚨 Troubleshooting

### Errores Comunes

1. **ECONNREFUSED**: Verificar host y puerto
2. **ER_ACCESS_DENIED_ERROR**: Verificar usuario y contraseña
3. **ER_BAD_DB_ERROR**: Verificar que la base de datos existe
4. **ETIMEDOUT**: Verificar conectividad de red

### Comandos de Diagnóstico

```bash
# Probar conectividad
telnet 149.56.13.205 3307

# Verificar variables de entorno
node -e "console.log(process.env.DATABASE_URL)"

# Probar conexión directa
mysql -h 149.56.13.205 -P 3307 -u admin -p
```

## 📞 Soporte

Si tienes problemas con la configuración:

1. Verifica que las credenciales sean correctas
2. Asegúrate de que los puertos estén abiertos
3. Ejecuta el script de prueba de conexiones
4. Revisa los logs de error de MySQL

---

**Nota**: Esta configuración está adaptada de los parámetros Java proporcionados para funcionar con Node.js y MySQL2. 