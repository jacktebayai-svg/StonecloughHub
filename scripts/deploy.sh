#!/bin/bash

# Stoneclough Hub Deployment Script
# This script sets up the complete production environment

set -e  # Exit on any error

echo "🚀 Stoneclough Hub Production Deployment Script"
echo "==============================================="

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
    log_error ".env file not found!"
    log_info "Please create a .env file based on .env.example"
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
required_vars=(
    "DATABASE_URL"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Required environment variable $var is not set!"
        exit 1
    fi
done

log_success "Environment variables validated"

# Install dependencies
log_info "Installing dependencies..."
npm ci --only=production

# Build the application
log_info "Building the application..."
npm run build

log_success "Application built successfully"

# Set up directories
log_info "Setting up directories..."
mkdir -p uploads/{images,documents,temp}
mkdir -p scraped_data
chmod 755 uploads scraped_data

log_success "Directories created and permissions set"

# Database operations
log_info "Running database migrations..."
npm run db:migrate

log_info "Seeding database with initial data..."
npm run db:seed

log_success "Database setup completed"

# Start services in production mode
log_info "Starting Stoneclough Hub in production mode..."

if command -v pm2 &> /dev/null; then
    log_info "Using PM2 for process management..."
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'stoneclough-hub',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: '${PORT:-5000}'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: '${PORT:-5000}'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.outerr.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=4096',
    restart_delay: 4000
  }]
};
EOF

    # Create logs directory
    mkdir -p logs

    # Start with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    log_success "Application started with PM2"
    
    echo ""
    echo "📊 PM2 Status:"
    pm2 status
    
else
    log_warning "PM2 not found. Starting with npm..."
    npm start &
    log_info "Application started in background (PID: $!)"
fi

# Health check
log_info "Performing health check..."
sleep 5

if curl -f "http://localhost:${PORT:-5000}/health" > /dev/null 2>&1; then
    log_success "Health check passed!"
else
    log_error "Health check failed!"
    log_info "Check the application logs for details"
    exit 1
fi

# Final instructions
echo ""
echo "🎉 Stoneclough Hub Deployment Complete!"
echo "========================================"
echo ""
echo "📍 Application URL: ${APP_URL:-http://localhost:${PORT:-5000}}"
echo "🏥 Health Check: ${APP_URL:-http://localhost:${PORT:-5000}}/health"
echo "📊 Admin Panel: ${APP_URL:-http://localhost:${PORT:-5000}}/admin"
echo "📧 Email Testing: http://localhost:8025 (if using Mailhog)"
echo ""
echo "📋 Useful Commands:"
echo "  • Check status: npm run status"
echo "  • View logs: npm run logs"
echo "  • Restart: npm run restart"
echo "  • Stop: npm run stop"
echo ""
echo "🔧 Configuration:"
echo "  • Environment: $(echo ${NODE_ENV:-development})"
echo "  • Port: $(echo ${PORT:-5000})"
echo "  • Database: Connected"
echo "  • Cache: Redis $(if [ -n "$REDIS_URL" ]; then echo "Connected"; else echo "Not configured"; fi)"
echo "  • Email: $(if [ -n "$SMTP_HOST" ]; then echo "$SMTP_HOST"; else echo "Not configured"; fi)"
echo ""

if [ "$NODE_ENV" = "production" ]; then
    log_warning "Production deployment completed!"
    log_info "Make sure to:"
    log_info "  • Set up SSL certificates"
    log_info "  • Configure firewall rules"
    log_info "  • Set up monitoring and alerting"
    log_info "  • Configure automated backups"
    log_info "  • Review security settings"
else
    log_info "Development deployment completed!"
    log_info "Access the application at ${APP_URL:-http://localhost:${PORT:-5000}}"
fi

echo ""
log_success "Deployment script finished successfully!"
