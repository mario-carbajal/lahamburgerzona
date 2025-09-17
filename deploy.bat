@echo off
REM Deployment script for La Hamburguezona on Windows
REM Usage: deploy.bat [production|staging]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

echo 🚀 Starting deployment for %ENVIRONMENT% environment...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "logs\nginx" mkdir logs\nginx
if not exist "uploads" mkdir uploads
if not exist "nginx\ssl" mkdir nginx\ssl

REM Set environment variables
if "%ENVIRONMENT%"=="production" (
    set NODE_ENV=production
    set DB_PASSWORD=changeme123
    set JWT_SECRET=your-super-secret-jwt-key
) else (
    set NODE_ENV=staging
    set DB_PASSWORD=staging123
    set JWT_SECRET=staging-jwt-key
)

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose down --remove-orphans

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service health...
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    echo ❌ Some services failed to start. Checking logs...
    docker-compose logs
    exit /b 1
) else (
    echo ✅ Services are running successfully!
    
    REM Show service status
    echo 📊 Service Status:
    docker-compose ps
    
    REM Show logs
    echo 📝 Recent logs:
    docker-compose logs --tail=20
    
    echo 🎉 Deployment completed successfully!
    echo 🌐 Application should be available at: http://localhost
    echo 🔧 Admin panel: http://localhost/admin/login
    echo 📊 Health check: http://localhost/api/health
)

echo ✨ Deployment process completed!
pause
