# La Hamburguezona 🍔

Sitio web moderno para el negocio de hamburguesas "La Hamburguezona" con Next.js y Node.js, incluyendo sistema completo de pedidos online y panel administrativo.

## 🚀 Características

### Frontend (Next.js + TailwindCSS)
- **Diseño Responsive**: Optimizado para móvil, tablet y desktop
- **Colores Temáticos**: Paleta cálida (rojo, naranja, negro) de La Hamburguezona
- **Páginas Principales**:
  - 🏠 **Home**: Hero dinámico, hamburguesas estrella, testimonios
  - 🍔 **Menú**: Categorías dinámicas con filtros y búsqueda
  - 🛒 **Pedidos**: Sistema de carrito completo con validaciones
  - 📸 **Galería**: Galería de imágenes del restaurante
  - 📍 **Contacto**: Información de ubicación, WhatsApp y redes sociales
  - ⭐ **Opiniones**: Sistema de reseñas de clientes
  - ℹ️ **Nosotros**: Historia y filosofía de la marca

### Sistema de Pedidos Online
- **Carrito de Compras**: Gestión completa con React Context + LocalStorage
- **Cálculo de Totales**: Desglose correcto de IVA (16%) según normativa mexicana
- **Validaciones**: Formularios con validación de teléfono y email
- **Integración WhatsApp**: Envío automático de pedidos con formato profesional
- **Página de Confirmación**: Ticket digital con código QR para seguimiento
- **Envío Gratis**: Automático en pedidos mayores a $200

### Panel Administrativo
- **Dashboard**: Estadísticas de pedidos y ventas
- **Gestión de Menú**: CRUD completo para productos con subida de imágenes
- **Gestión de Pedidos**: Visualización, actualización de estados y cancelación
- **Gestión de Reseñas**: Aprobación y moderación de comentarios
- **Autenticación**: Sistema seguro con JWT
- **Estados de Pedidos**: Pending, Confirmed, Preparing, Ready, Delivered, Cancelled

### Backend (Node.js + Express)
- **API RESTful**: Endpoints completos para todas las funcionalidades
- **Base de Datos**: MySQL con tablas optimizadas
- **Middleware**: CORS, Helmet, Rate Limiting, Compresión
- **Subida de Archivos**: Multer para gestión de imágenes
- **Notificaciones**: Servicio integrado para WhatsApp
- **Validaciones**: Express-validator para datos de entrada

## 📁 Estructura del Proyecto

```
la-hamburguezona/
├── frontend/                    # Next.js Frontend
│   ├── pages/                  # Páginas de la aplicación
│   │   ├── index.tsx           # Homepage con hero dinámico
│   │   ├── menu.tsx            # Menú con filtros y búsqueda
│   │   ├── pedidos.tsx         # Sistema de pedidos online
│   │   ├── confirmacion-pedido.tsx # Página de confirmación con QR
│   │   ├── galeria.tsx         # Galería de imágenes
│   │   ├── contacto.tsx        # Información de contacto
│   │   ├── opiniones.tsx       # Reseñas de clientes
│   │   ├── nosotros.tsx        # Historia de la empresa
│   │   └── admin/              # Panel administrativo
│   │       ├── login.tsx       # Autenticación admin
│   │       ├── menu.tsx        # Gestión de productos
│   │       ├── orders.tsx      # Gestión de pedidos
│   │       └── reviews.tsx     # Gestión de reseñas
│   ├── components/             # Componentes reutilizables
│   ├── context/               # React Context (Carrito)
│   ├── services/              # Servicios API
│   └── styles/                # Estilos globales
├── backend/                   # Node.js Backend
│   ├── routes/                # Rutas de la API
│   │   ├── menu.js            # CRUD del menú
│   │   ├── orders.js          # Gestión de pedidos
│   │   ├── reviews.js         # Sistema de reseñas
│   │   └── auth.js            # Autenticación admin
│   ├── config/                # Configuración
│   │   └── database-mysql.js  # Conexión a MySQL
│   ├── services/              # Servicios del backend
│   │   └── notificationService.js # WhatsApp notifications
│   ├── uploads/               # Archivos subidos (imágenes)
│   └── server.js              # Servidor principal
├── database/                  # Scripts de base de datos
│   └── schema.sql             # Esquema MySQL
└── docs/                     # Documentación
    ├── api.md                 # Documentación de API
    └── deployment.md          # Guía de despliegue
```

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd la-hamburguezona
   ```

2. **Instalar dependencias del backend**
   ```bash
   cd backend
   npm install
   ```

3. **Instalar dependencias del frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configurar base de datos MySQL**
   - Crear base de datos `lahamburguezona`
   - Ejecutar el esquema desde `database/schema.sql`
   - Configurar credenciales en `backend/config/database-mysql.js`

5. **Ejecutar en desarrollo**
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## 🌐 URLs de Desarrollo

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **Panel Admin**: http://localhost:3001/admin
- **API Health Check**: http://localhost:5000/api/health

## 🔧 Tecnologías Utilizadas

### Frontend
- **Next.js 14**: Framework React con SSR/SSG
- **TailwindCSS**: Framework de CSS utilitario
- **React Context API**: Gestión de estado global (carrito)
- **QRCode.js**: Generación de códigos QR
- **Lucide React**: Iconografía moderna

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web minimalista
- **MySQL2**: Cliente de base de datos MySQL
- **JWT**: Autenticación con tokens
- **Multer**: Manejo de archivos multipart
- **Express-validator**: Validación de datos
- **CORS, Helmet**: Seguridad y middleware

### Base de Datos
- **MySQL**: Base de datos relacional
- **Tablas principales**:
  - `menu_items`: Productos del menú
  - `orders`: Pedidos de clientes
  - `order_items`: Items de cada pedido
  - `reviews`: Reseñas de clientes
  - `admin_users`: Usuarios administrativos

## 📱 Funcionalidades Destacadas

### Sistema de Pedidos
- ✅ **Carrito persistente** con LocalStorage
- ✅ **Cálculo automático** de totales con IVA desglosado
- ✅ **Validación de formularios** en tiempo real
- ✅ **Integración WhatsApp** con mensajes formateados
- ✅ **Ticket digital** con código QR para seguimiento
- ✅ **Estados de pedido** con historial completo

### Panel Administrativo
- ✅ **Dashboard** con métricas en tiempo real
- ✅ **CRUD completo** para productos del menú
- ✅ **Gestión de pedidos** con actualización de estados
- ✅ **Subida de imágenes** con preview en tiempo real
- ✅ **Sistema de autenticación** seguro
- ✅ **Responsive design** para móvil y desktop

### Optimizaciones
- ✅ **Lazy loading** de imágenes
- ✅ **Compresión** de respuestas del servidor
- ✅ **Rate limiting** para prevenir abuso
- ✅ **Validación** de datos en frontend y backend
- ✅ **Manejo de errores** con mensajes user-friendly

## 🚀 Deployment

Configurado para desplegar en VPS con Hostinger usando:
- **PM2**: Gestor de procesos Node.js
- **Nginx**: Proxy reverso y servidor web
- **MySQL**: Base de datos en servidor
- **SSL**: Certificados HTTPS automáticos

## 📋 Próximas Mejoras

- [ ] **Pago online** con Stripe/PayPal
- [ ] **Notificaciones push** para cambios de estado
- [ ] **App móvil** con React Native
- [ ] **Sistema de puntos** para clientes frecuentes
- [ ] **Integración** con sistemas de delivery
- [ ] **Analytics** avanzado de ventas

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

