#!/bin/bash

# La Hamburguezona Deployment Script for Hostinger VPS
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="lahamburguezona"
DOMAIN="${DOMAIN:-lahamburguezona.com}"
EMAIL="${EMAIL:-admin@lahamburguezona.com}"
BACKUP_DIR="/opt/backups"

echo -e "${BLUE}🍔 La Hamburguezona Deployment Script${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install required packages
echo -e "${YELLOW}Installing required packages...${NC}"
apt install -y \
    curl \
    wget \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    postgresql \
    postgresql-contrib \
    redis-server \
    docker.io \
    docker-compose \
    ufw \
    fail2ban \
    htop \
    unzip

# Start and enable services
systemctl start docker
systemctl enable docker
systemctl start postgresql
systemctl enable postgresql
systemctl start redis-server
systemctl enable redis-server
systemctl start nginx
systemctl enable nginx

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
echo -e "${YELLOW}Configuring fail2ban...${NC}"
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl restart fail2ban
systemctl enable fail2ban

# Create project directory
echo -e "${YELLOW}Setting up project directory...${NC}"
mkdir -p /opt/$PROJECT_NAME
cd /opt/$PROJECT_NAME

# Clone repository (if not already present)
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone https://github.com/your-username/la-hamburguezona.git .
fi

# Create environment file
echo -e "${YELLOW}Creating environment configuration...${NC}"
cat > .env << EOF
# Database
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Site Configuration
SITE_URL=https://$DOMAIN
NODE_ENV=production

# Email (configure with your SMTP settings)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=$EMAIL
EMAIL_PASS=your_app_password

# WhatsApp (optional)
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_ID=your_phone_id
EOF

# Set up SSL certificate
echo -e "${YELLOW}Setting up SSL certificate...${NC}"
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
else
    echo -e "${GREEN}✅ SSL certificate already exists${NC}"
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup script
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_NAME="lahamburguezona"

# Backup database
pg_dump -h localhost -U postgres lahamburguezona > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/$PROJECT_NAME/backend/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/backup.sh

# Add backup to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup.sh") | crontab -

# Create systemd service for the application
cat > /etc/systemd/system/$PROJECT_NAME.service << EOF
[Unit]
Description=La Hamburguezona Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/$PROJECT_NAME/deployment
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
systemctl daemon-reload
systemctl enable $PROJECT_NAME

# Build and start the application
echo -e "${YELLOW}Building and starting the application...${NC}"
cd /opt/$PROJECT_NAME/deployment
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 30

# Check service health
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

# Setup log rotation
cat > /etc/logrotate.d/$PROJECT_NAME << EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF

# Create monitoring script
cat > /opt/monitor.sh << 'EOF'
#!/bin/bash
PROJECT_NAME="lahamburguezona"
LOG_FILE="/var/log/$PROJECT_NAME-monitor.log"

check_service() {
    local service_name=$1
    local url=$2
    
    if curl -f $url > /dev/null 2>&1; then
        echo "$(date): $service_name is healthy" >> $LOG_FILE
    else
        echo "$(date): $service_name is DOWN - restarting..." >> $LOG_FILE
        systemctl restart $PROJECT_NAME
    fi
}

check_service "Frontend" "http://localhost"
check_service "Backend" "http://localhost/api/health"
EOF

chmod +x /opt/monitor.sh

# Add monitoring to crontab (check every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/monitor.sh") | crontab -

# Display final information
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${YELLOW}Domain: https://$DOMAIN${NC}"
echo -e "${YELLOW}Admin Panel: https://$DOMAIN/admin${NC}"
echo -e "${YELLOW}API Health: https://$DOMAIN/api/health${NC}"
echo ""
echo -e "${BLUE}Default admin credentials:${NC}"
echo -e "${YELLOW}Email: admin@lahamburguezona.com${NC}"
echo -e "${YELLOW}Password: admin123${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "${YELLOW}Check status: systemctl status $PROJECT_NAME${NC}"
echo -e "${YELLOW}View logs: docker-compose -f /opt/$PROJECT_NAME/deployment/docker-compose.yml logs${NC}"
echo -e "${YELLOW}Restart: systemctl restart $PROJECT_NAME${NC}"
echo -e "${YELLOW}Update: cd /opt/$PROJECT_NAME && git pull && systemctl restart $PROJECT_NAME${NC}"
echo ""
echo -e "${BLUE}Backup location: $BACKUP_DIR${NC}"
echo -e "${BLUE}Environment file: /opt/$PROJECT_NAME/.env${NC}"
echo -e "${BLUE}SSL certificates auto-renewal is enabled${NC}"

