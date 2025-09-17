#!/bin/bash

# Deployment script for La Hamburguezona
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="lahamburguezona"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs/nginx
mkdir -p uploads
mkdir -p nginx/ssl

# Set environment variables
if [ "$ENVIRONMENT" = "production" ]; then
    export NODE_ENV=production
    export DB_PASSWORD=${DB_PASSWORD:-changeme123}
    export JWT_SECRET=${JWT_SECRET:-your-super-secret-jwt-key}
else
    export NODE_ENV=staging
    export DB_PASSWORD=${DB_PASSWORD:-staging123}
    export JWT_SECRET=${JWT_SECRET:-staging-jwt-key}
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running successfully!"
    
    # Show service status
    echo "📊 Service Status:"
    docker-compose ps
    
    # Show logs
    echo "📝 Recent logs:"
    docker-compose logs --tail=20
    
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Application should be available at: http://localhost"
    echo "🔧 Admin panel: http://localhost/admin/login"
    echo "📊 Health check: http://localhost/api/health"
    
else
    echo "❌ Some services failed to start. Checking logs..."
    docker-compose logs
    exit 1
fi

# Optional: Run database migrations
echo "🗄️  Running database initialization..."
docker-compose exec app node -e "
const { initializeDatabase } = require('./config/database');
initializeDatabase().then(() => {
    console.log('✅ Database initialized successfully');
    process.exit(0);
}).catch(err => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
});
"

echo "✨ Deployment process completed!"
