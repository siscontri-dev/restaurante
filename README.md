# 🍽️ HeroUI POS System

Sistema completo de punto de venta para restaurantes con tienda online integrada.

## 🚀 Características Principales

### 🏪 Sistema POS
- **Gestión de mesas** con drag & drop
- **Pedidos por mesa** con división de cuentas
- **Impresión por áreas** (cocina, bar, postres)
- **Pagos QR** y efectivo para pedidos presenciales

### 🌐 Tienda Online
- **Catálogo de productos** responsive
- **Carrito de compras** persistente
- **Checkout diferenciado** (online vs presencial)
- **Integración Wompi** para pagos online

### 👨‍🍳 Panel de Cocina
- **Tickets de pedidos** organizados
- **Estados de preparación** (pendiente, preparando, listo)
- **Separación por áreas** de cocina

### 📊 Dashboard Administrativo
- **Gestión de mesas** con simulación de BD
- **Administración de personal**
- **Configuración de productos**
- **Configuración del sitio web**

## 🛠️ Stack Tecnológico

- **Node.js 22 LTS** - Runtime de JavaScript
- **Next.js 14** - Framework React con App Router
- **React 18** - Biblioteca de UI con TypeScript
- **Tailwind CSS** - Framework de estilos
- **shadcn/ui** - Componentes de UI
- **Lucide React** - Iconos

## 📋 Requisitos del Sistema

- **Node.js**: >= 22.0.0 (LTS recomendado)
- **npm**: >= 10.0.0
- **Navegador moderno** con soporte ES2022

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
\`\`\`bash
git clone <repository-url>
cd pos-system
\`\`\`

### 2. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 3. Ejecutar en desarrollo
\`\`\`bash
npm run dev
\`\`\`

### 4. Abrir en el navegador
\`\`\`
http://localhost:3000
\`\`\`

## 📁 Estructura del Proyecto

\`\`\`
pos-system/
├── app/
│   ├── pos/                 # Sistema POS principal
│   ├── web/                 # Tienda online
│   ├── kitchen/             # Panel de cocina
│   ├── dashboard/           # Panel administrativo
│   ├── context/             # Contextos de React
│   ├── components/          # Componentes reutilizables
│   └── data/               # Datos y configuración
├── components/ui/           # Componentes shadcn/ui
├── public/                  # Archivos estáticos
└── package.json
\`\`\`

## 🔄 Flujos de Trabajo

### Pedido Presencial (POS)
1. **Seleccionar mesa** → Agregar productos → Checkout
2. **Método de pago**: QR Code o Efectivo
3. **Envío a cocina** → Preparación → Entrega

### Pedido Online
1. **Navegar catálogo** → Agregar al carrito → Checkout
2. **Datos del cliente** + Dirección de entrega
3. **Pago Wompi** o Contra entrega
4. **Procesamiento** → Preparación → Entrega

### Gestión Administrativa
1. **Dashboard** → Configuración de mesas/productos
2. **Panel de cocina** → Gestión de pedidos
3. **Reportes** → Análisis de ventas

## 💾 Simulación de Base de Datos

El sistema incluye una simulación completa de base de datos usando localStorage:

- **Operaciones CRUD** para mesas, pedidos y productos
- **Relaciones** entre entidades
- **Metadatos** y timestamps automáticos
- **Logs de debugging** en consola

## 🔧 Scripts Disponibles

\`\`\`bash
npm run dev      # Desarrollo
npm run build    # Construcción para producción
npm run start    # Servidor de producción
npm run lint     # Linting del código
\`\`\`

## 🌟 Características Avanzadas

- **Responsive Design** - Funciona en desktop, tablet y móvil
- **PWA Ready** - Instalable como aplicación
- **TypeScript** - Tipado estático para mejor desarrollo
- **Accesibilidad** - Cumple estándares WCAG
- **SEO Optimizado** - Meta tags y estructura semántica

## 🔮 Próximas Funcionalidades

- [ ] Base de datos real (PostgreSQL/MongoDB)
- [ ] Autenticación de usuarios
- [ ] Notificaciones push
- [ ] Impresión térmica
- [ ] Reportes avanzados
- [ ] API REST completa
- [ ] Aplicación móvil (React Native)

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para la industria gastronómica**
