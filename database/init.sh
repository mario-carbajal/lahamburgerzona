#!/bin/bash

# La Hamburguezona Database Initialization Script
# This script creates the database and runs the schema and seed files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="lahamburguezona"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo -e "${BLUE}🍔 La Hamburguezona Database Initialization${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
    echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
    echo -e "${RED}Please make sure PostgreSQL is installed and running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Create database if it doesn't exist
echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists or creation failed${NC}"
}

echo -e "${GREEN}✅ Database '$DB_NAME' is ready${NC}"

# Run schema
echo -e "${YELLOW}Running database schema...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema created successfully${NC}"
else
    echo -e "${RED}❌ Schema creation failed${NC}"
    exit 1
fi

# Run seed data
echo -e "${YELLOW}Inserting seed data...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f seed.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed data inserted successfully${NC}"
else
    echo -e "${RED}❌ Seed data insertion failed${NC}"
    exit 1
fi

# Display summary
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}🎉 Database initialization completed successfully!${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${YELLOW}Database: $DB_NAME${NC}"
echo -e "${YELLOW}Host: $DB_HOST:$DB_PORT${NC}"
echo -e "${YELLOW}User: $DB_USER${NC}"
echo ""
echo -e "${BLUE}Default admin credentials:${NC}"
echo -e "${YELLOW}Email: admin@lahamburguezona.com${NC}"
echo -e "${YELLOW}Password: admin123${NC}"
echo ""
echo -e "${BLUE}You can now start the backend server!${NC}"
echo -e "${YELLOW}Run: cd backend && npm run dev${NC}"

