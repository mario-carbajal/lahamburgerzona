# 🚀 Guía de Deployment - La Hamburguezona

Esta guía te ayudará a desplegar la aplicación La Hamburguezona en un VPS de Hostinger.

## 📋 Requisitos Previos

### En el VPS (Hostinger)
- Ubuntu 20.04 LTS o superior
- Docker y Docker Compose instalados
- MySQL 8.0 o superior
- Dominio configurado (opcional, pero recomendado)
- Certificado SSL (Let's Encrypt recomendado)

### En tu máquina local
- Git
- Docker y Docker Compose (para testing local)
- MySQL 8.0 o superior

## 🛠️ Instalación en el VPS

### 1. Conectarse al VPS
```bash
ssh root@tu-vps-ip
```

### 2. Instalar Docker y Docker Compose
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Agregar usuario al grupo docker
usermod -aG docker $USER
```

### 3. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/la-hamburguezona.git
cd la-hamburguezona
```

### 4. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp backend/env.example .env

# Editar variables
nano .env
```

Configura las siguientes variables:
```env
# Database Configuration
DB_PASSWORD=tu-password-segura

# Security Configuration
JWT_SECRET=tu-jwt-secret-super-seguro

# CORS Configuration
FRONTEND_URL=https://tu-dominio.com
```

### 5. Configurar SSL (Let's Encrypt)
```bash
# Instalar Certbot
apt install certbot -y

# Generar certificados
certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Copiar certificados a la carpeta nginx
cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem nginx/ssl/key.pem
```

### 6. Desplegar la aplicación
```bash
# Hacer ejecutable el script
chmod +x deploy.sh

# Ejecutar deployment
./deploy.sh production
```

## 🔧 Configuración de Dominio

### 1. Configurar DNS
En el panel de Hostinger, configura los siguientes registros DNS:
```
A     @      tu-vps-ip
A     www    tu-vps-ip
```

### 2. Actualizar nginx.conf
Edita el archivo `nginx/nginx.conf` y cambia:
```nginx
server_name lahamburguezona.com www.lahamburguezona.com;
```
Por tu dominio:
```nginx
server_name tu-dominio.com www.tu-dominio.com;
```

## 📊 Monitoreo y Mantenimiento

### Ver logs de la aplicación
```bash
docker-compose logs -f app
```

### Ver logs de nginx
```bash
docker-compose logs -f nginx
```

### Reiniciar servicios
```bash
docker-compose restart
```

### Actualizar la aplicación
```bash
git pull origin main
./deploy.sh production
```

### Backup de la base de datos
```bash
docker-compose exec mysql mysqldump -u root -p lahamburguezona > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup
```bash
docker-compose exec -T mysql mysql -u root -p lahamburguezona < backup_archivo.sql
```

## 🔒 Seguridad

### Firewall (UFW)
```bash
# Instalar UFW
apt install ufw -y

# Configurar reglas
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Actualizar certificados SSL
```bash
# Crear script de renovación
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

## 🐛 Troubleshooting

### Problemas comunes

1. **Error de conexión a la base de datos**
   ```bash
   docker-compose logs mysql
   ```

2. **Error de permisos en archivos**
   ```bash
   chown -R 1001:1001 uploads/
   chown -R 1001:1001 logs/
   ```

3. **Servicios no inician**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

4. **Error de SSL**
   ```bash
   # Verificar certificados
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   ```

### Comandos útiles

```bash
# Ver estado de contenedores
docker-compose ps

# Acceder a contenedor de la app
docker-compose exec app sh

# Acceder a base de datos
docker-compose exec mysql mysql -u root -p lahamburguezona

# Limpiar contenedores y volúmenes
docker-compose down -v
docker system prune -a
```

## 📱 Acceso a la aplicación

Una vez desplegada, la aplicación estará disponible en:

- **Sitio web**: `https://tu-dominio.com`
- **Panel admin**: `https://tu-dominio.com/admin/login`
- **API**: `https://tu-dominio.com/api/health`

### Credenciales por defecto
- Usuario: `admin`
- Contraseña: `admin123`

**⚠️ IMPORTANTE**: Cambia estas credenciales en producción.

## 🚀 Optimizaciones de Producción

### 1. Configurar PM2
```bash
# Instalar PM2
npm install -g pm2

# Usar PM2 para gestión de procesos
pm2 start ecosystem.config.js
```

### 2. Configurar Redis para caché
```bash
# Redis ya está incluido en docker-compose.yml
# Configurar en la aplicación para mejorar performance
```

### 3. Configurar backup automático
```bash
# Crear script de backup diario
echo "0 2 * * * /ruta/al/script/backup.sh" | crontab -
```

## 📞 Soporte

Si tienes problemas con el deployment:

1. Revisa los logs: `docker-compose logs`
2. Verifica la configuración de red
3. Asegúrate de que todos los puertos estén abiertos
4. Contacta al soporte técnico si es necesario

---

¡Feliz deployment! 🎉
