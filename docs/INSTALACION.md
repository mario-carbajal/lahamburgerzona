# 🍔 La Hamburguezona - Guía de Instalación

Esta guía te ayudará a instalar y configurar La Hamburguezona en tu entorno local para desarrollo.

## 📋 Requisitos Previos

### Software Necesario

- **Node.js** (v18 o superior)
- **npm** (v8 o superior)
- **MySQL** (v8.0 o superior)
- **Git**

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar MySQL
mysql --version

# Verificar Git
git --version
```

## 🚀 Instalación Rápida

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/la-hamburguezona.git
cd la-hamburguezona
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias de todos los proyectos
npm run install:all
```

### 3. Configurar Base de Datos

```bash
# Crear base de datos MySQL
mysql -u root -p -e "CREATE DATABASE lahamburguezona;"

# Ejecutar scripts de base de datos
cd database
chmod +x init.sh
./init.sh
```

### 4. Configurar Variables de Entorno

#### Backend (.env)
```bash
cd backend
cp env.example .env
```

Editar `.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lahamburguezona
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_jwt_secret_muy_largo
```

#### Frontend (.env.local)
```bash
cd frontend
cp env.example .env.local
```

Editar `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Iniciar la Aplicación

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto iniciará:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 🔧 Instalación Detallada

### Configuración de PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear usuario
sudo -u postgres createuser --interactive
sudo -u postgres createdb lahamburguezona
```

#### macOS (con Homebrew)
```bash
brew install postgresql
brew services start postgresql

# Crear base de datos
createdb lahamburguezona
```

#### Windows
1. Descargar PostgreSQL desde [postgresql.org](https://www.postgresql.org/download/windows/)
2. Instalar con pgAdmin
3. Crear base de datos `lahamburguezona`

### Configuración Manual de la Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE lahamburguezona;

# Crear usuario (opcional)
CREATE USER lahamburguezona_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE lahamburguezona TO lahamburguezona_user;

# Salir
\q
```

### Ejecutar Scripts de Base de Datos

```bash
# Esquema de base de datos
psql -U postgres -d lahamburguezona -f database/schema.sql

# Datos de ejemplo
psql -U postgres -d lahamburguezona -f database/seed.sql
```

## 🛠️ Comandos de Desarrollo

### Scripts Disponibles

```bash
# Desarrollo (frontend + backend)
npm run dev

# Solo frontend
npm run dev:frontend

# Solo backend
npm run dev:backend

# Build de producción
npm run build

# Iniciar en producción
npm run start

# Instalar todas las dependencias
npm run install:all
```

### Comandos del Backend

```bash
cd backend

# Desarrollo
npm run dev

# Producción
npm start

# Migrar base de datos
npm run migrate

# Tests
npm test
```

### Comandos del Frontend

```bash
cd frontend

# Desarrollo
npm run dev

# Build
npm run build

# Iniciar build
npm run start

# Linting
npm run lint
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U postgres -d lahamburguezona -c "SELECT 1;"
```

#### 2. Puerto en Uso

```bash
# Verificar puertos en uso
lsof -i :3000
lsof -i :5000

# Matar proceso si es necesario
kill -9 PID
```

#### 3. Dependencias No Instaladas

```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### 4. Errores de Permisos

```bash
# Dar permisos de ejecución
chmod +x database/init.sh

# En Linux/macOS, verificar permisos de PostgreSQL
sudo chown postgres:postgres /var/lib/postgresql/data
```

### Logs y Debugging

#### Ver Logs del Backend
```bash
cd backend
npm run dev
# Los logs aparecerán en la consola
```

#### Ver Logs del Frontend
```bash
cd frontend
npm run dev
# Abrir http://localhost:3000
# Abrir DevTools (F12) para ver errores
```

#### Logs de Base de Datos
```bash
# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 📊 Verificar Instalación

### 1. Verificar Frontend
- Abrir http://localhost:3000
- Debe mostrar la página de inicio de La Hamburguezona

### 2. Verificar Backend
- Abrir http://localhost:5000/api/health
- Debe devolver: `{"status":"OK"}`

### 3. Verificar Base de Datos
```bash
psql -U postgres -d lahamburguezona -c "SELECT COUNT(*) FROM menu_items;"
# Debe devolver el número de items del menú
```

### 4. Verificar API
```bash
curl http://localhost:5000/api/menu
# Debe devolver el menú en formato JSON
```

## 🎯 Próximos Pasos

Una vez que la instalación esté completa:

1. **Explorar el código**: Revisar la estructura del proyecto
2. **Modificar datos**: Editar `frontend/data/menu.json` para personalizar el menú
3. **Personalizar diseño**: Modificar colores en `frontend/tailwind.config.js`
4. **Agregar funcionalidades**: Implementar nuevas características
5. **Configurar producción**: Seguir la guía de deployment

## 📚 Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Express](https://expressjs.com/)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación de TailwindCSS](https://tailwindcss.com/docs)

## 🆘 Soporte

Si encuentras problemas:

1. Revisar esta guía paso a paso
2. Verificar los logs de error
3. Buscar en [Issues de GitHub](https://github.com/tu-usuario/la-hamburguezona/issues)
4. Crear un nuevo issue con detalles del problema

¡Disfruta desarrollando con La Hamburguezona! 🍔

