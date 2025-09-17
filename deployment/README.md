# La Hamburguezona - Deployment Guide

Esta guía te ayudará a desplegar La Hamburguezona en un VPS de Hostinger.

## 🚀 Requisitos Previos

- VPS de Hostinger con Ubuntu 20.04+ o similar
- Dominio configurado apuntando a tu VPS
- Acceso SSH al servidor
- Usuario con privilegios sudo

## 📋 Instalación Automática

### Opción 1: Script Automatizado (Recomendado)

```bash
# Conectarse al VPS
ssh root@tu-servidor.com

# Descargar y ejecutar el script de deployment
wget https://raw.githubusercontent.com/tu-usuario/la-hamburguezona/main/deployment/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### Opción 2: Instalación Manual

#### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y curl wget git nginx postgresql redis-server docker.io docker-compose
```

#### 2. Configurar Base de Datos

```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear base de datos
CREATE DATABASE lahamburguezona;
CREATE USER lahamburguezona_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE lahamburguezona TO lahamburguezona_user;
\q
```

#### 3. Configurar SSL

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

#### 4. Desplegar Aplicación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/la-hamburguezona.git
cd la-hamburguezona/deployment

# Configurar variables de entorno
cp .env.example .env
nano .env

# Iniciar servicios
docker-compose up -d
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la carpeta `deployment/`:

```env
# Database
DB_PASSWORD=tu_password_seguro
JWT_SECRET=tu_jwt_secret_muy_largo

# Site Configuration
SITE_URL=https://tu-dominio.com
NODE_ENV=production

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu_app_password

# WhatsApp (opcional)
WHATSAPP_TOKEN=tu_whatsapp_token
WHATSAPP_PHONE_ID=tu_phone_id
```

### Configuración de Nginx

El archivo `nginx.conf` está preconfigurado con:
- Redirección HTTP a HTTPS
- Compresión gzip
- Rate limiting
- Headers de seguridad
- Caching de archivos estáticos

## 🔧 Comandos Útiles

### Gestión de Servicios

```bash
# Ver estado de los servicios
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Actualizar aplicación
git pull
docker-compose build --no-cache
docker-compose up -d
```

### Base de Datos

```bash
# Hacer backup
pg_dump -h localhost -U postgres lahamburguezona > backup.sql

# Restaurar backup
psql -h localhost -U postgres lahamburguezona < backup.sql

# Acceder a la base de datos
docker exec -it lahamburguezona_db psql -U postgres -d lahamburguezona
```

### Monitoreo

```bash
# Ver uso de recursos
htop
docker stats

# Ver logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Ver logs de la aplicación
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔒 Seguridad

### Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Fail2Ban

```bash
# Instalar y configurar Fail2Ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Backups Automáticos

Los backups se ejecutan automáticamente cada día a las 2:00 AM:
- Base de datos PostgreSQL
- Archivos de uploads
- Se mantienen los últimos 7 días

## 📊 Monitoreo y Mantenimiento

### Health Checks

- **Frontend**: `https://tu-dominio.com`
- **Backend**: `https://tu-dominio.com/api/health`
- **Base de datos**: Verificado por Docker

### Logs Importantes

- **Nginx**: `/var/log/nginx/`
- **Aplicación**: `docker-compose logs`
- **Sistema**: `/var/log/syslog`

### Actualizaciones

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Actualizar aplicación
cd /opt/lahamburguezona
git pull
docker-compose build --no-cache
docker-compose up -d
```

## 🆘 Solución de Problemas

### Problemas Comunes

1. **Servicio no inicia**
   ```bash
   docker-compose logs [servicio]
   systemctl status lahamburguezona
   ```

2. **Error de base de datos**
   ```bash
   docker exec -it lahamburguezona_db psql -U postgres -l
   ```

3. **Problemas de SSL**
   ```bash
   sudo certbot renew --dry-run
   ```

4. **Espacio en disco**
   ```bash
   df -h
   docker system prune -a
   ```

### Contacto de Soporte

- **Email**: soporte@lahamburguezona.com
- **WhatsApp**: +52 555-0123
- **Documentación**: [GitHub Wiki](https://github.com/tu-usuario/la-hamburguezona/wiki)

## 📈 Optimización

### Rendimiento

- Usar CDN para imágenes estáticas
- Habilitar Redis para caching
- Optimizar imágenes antes de subirlas
- Configurar compression en Nginx

### Escalabilidad

- Usar múltiples instancias con load balancer
- Separar base de datos en servidor dedicado
- Implementar microservicios para funciones específicas

## 🔄 CI/CD

Para automatizar deployments:

```bash
# Configurar webhook de GitHub
# Crear script de deployment automático
# Configurar tests automatizados
```

## 📝 Notas Adicionales

- El sistema está configurado para auto-renovar certificados SSL
- Los backups se almacenan en `/opt/backups/`
- El monitoreo se ejecuta cada 5 minutos
- Todas las contraseñas deben ser cambiadas en producción

¡Tu sitio de La Hamburguezona estará listo para conquistar el mundo! 🍔

