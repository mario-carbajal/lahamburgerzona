# La Hamburguezona 🍔

Sitio web moderno para el negocio de hamburguesas "La Hamburguezona" con Next.js y Node.js.

## 🚀 Características

- **Frontend**: Next.js con TailwindCSS
- **Backend**: Node.js con Express
- **Base de datos**: PostgreSQL
- **Diseño**: Responsive con colores cálidos (rojo, naranja, negro)
- **Funcionalidades**:
  - Menú interactivo con categorías
  - Sistema de pedidos en línea
  - Galería de fotos
  - Reseñas de clientes
  - Integración futura con WhatsApp

## 📁 Estructura del Proyecto

```
la-hamburguezona/
├── frontend/          # Next.js frontend
├── backend/           # Node.js API
├── database/          # Scripts de base de datos
├── public/            # Assets compartidos
└── docs/             # Documentación
```

## 🛠️ Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm run install:all
   ```

3. Configurar variables de entorno:
   - Copiar `.env.example` a `.env` en frontend y backend
   - Configurar PostgreSQL

4. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

## 🌐 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🚀 Deployment

Configurado para desplegar en VPS con Hostinger usando PM2 y Nginx.

