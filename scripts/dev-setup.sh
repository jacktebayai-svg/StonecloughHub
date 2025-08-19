#!/bin/bash

# Development setup script for Stoneclough Hub
# This script sets up the development environment and starts all services

set -e  # Exit on any error

echo "🛠️ Stoneclough Hub Development Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_warning ".env file not found!"
    if [ -f ".env.example" ]; then
        log_info "Copying .env.example to .env..."
        cp .env.example .env
        log_warning "Please update .env with your actual configuration values"
        log_info "Opening .env file for editing..."
        ${EDITOR:-nano} .env
    else
        log_error "No .env.example file found!"
        exit 1
    fi
fi

# Load environment variables
source .env

log_success "Environment variables loaded"

# Install dependencies
log_info "Installing dependencies..."
npm install

log_success "Dependencies installed"

# Create necessary directories
log_info "Setting up directories..."
mkdir -p uploads/{images,documents,temp}
mkdir -p scraped_data
mkdir -p logs

log_success "Directories created"

# Check if Docker is available for services
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    log_info "Docker detected. Starting services..."
    
    # Start database and redis services
    docker-compose up -d postgres redis mailhog
    
    log_info "Waiting for services to be ready..."
    sleep 10
    
    log_success "Services started"
else
    log_warning "Docker not available. Make sure PostgreSQL and Redis are running manually."
    log_info "PostgreSQL should be running on ${DATABASE_URL}"
    log_info "Redis should be running on ${REDIS_URL:-redis://localhost:6379}"
fi

# Wait for database to be ready
log_info "Checking database connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if npm run db:check 2>/dev/null; then
        log_success "Database connection established"
        break
    else
        log_info "Attempt $attempt/$max_attempts: Waiting for database..."
        sleep 2
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    log_error "Could not connect to database after $max_attempts attempts"
    exit 1
fi

# Run migrations
log_info "Running database migrations..."
npm run db:migrate

# Seed database
log_info "Seeding database..."
npm run db:seed

log_success "Database setup completed"

# Build the application
log_info "Building application..."
npm run build

log_success "Application built"

# Start the development server
log_info "Starting development server..."

echo ""
echo "🎉 Development Environment Ready!"
echo "================================"
echo ""
echo "📍 Application: http://localhost:${PORT:-5000}"
echo "🏥 Health Check: http://localhost:${PORT:-5000}/health"
echo "📊 Admin Panel: http://localhost:${PORT:-5000}/admin"
echo "📧 Email Testing: http://localhost:8025 (Mailhog)"
echo "🗄️ Database: PostgreSQL on port 5432"
echo "🔄 Cache: Redis on port 6379"
echo ""
echo "🔧 Development Commands:"
echo "  • Start dev server: npm run dev"
echo "  • Run tests: npm test"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop services: docker-compose down"
echo ""

# Ask if user wants to start the dev server immediately
read -p "Would you like to start the development server now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Starting development server with hot reload..."
    npm run dev
else
    log_info "Development environment is ready!"
    log_info "Run 'npm run dev' to start the development server"
fi
