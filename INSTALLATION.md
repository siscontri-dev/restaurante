# 📦 Guía de Instalación - Node.js 22

## 🎯 Instalación de Node.js 22 LTS

### Windows
1. Descargar desde: https://nodejs.org/es/download
2. Ejecutar el instalador `.msi`
3. Seguir el asistente de instalación
4. Verificar instalación:
\`\`\`bash
node -v  # Debería mostrar v22.16.0
npm -v   # Debería mostrar 10.x.x
\`\`\`

### macOS
\`\`\`bash
# Con Homebrew
brew install node@22

# O descargar desde nodejs.org
\`\`\`

### Linux (Ubuntu/Debian)
\`\`\`bash
# Usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar
node -v
npm -v
\`\`\`

## 🚀 Configuración del Proyecto

### 1. Clonar y configurar
\`\`\`bash
git clone <repository-url>
cd pos-system
\`\`\`

### 2. Usar Node.js 22 (si tienes nvm)
\`\`\`bash
nvm use 22
# o
nvm install 22.16.0
nvm use 22.16.0
\`\`\`

### 3. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 4. Ejecutar en desarrollo
\`\`\`bash
npm run dev
\`\`\`

## ✅ Verificación de Compatibilidad

El proyecto está optimizado para:
- **Node.js**: 22.16.0 LTS
- **npm**: 10.x.x
- **Next.js**: 14.2.x
- **React**: 18.3.x

## 🔧 Solución de Problemas

### Error de versión de Node.js
\`\`\`bash
# Verificar versión actual
node -v

# Si es menor a 22.0.0, actualizar
npm install -g n
n 22.16.0
\`\`\`

### Problemas con dependencias
\`\`\`bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
\`\`\`

### Puerto ocupado
\`\`\`bash
# Cambiar puerto por defecto
npm run dev -- -p 3001
