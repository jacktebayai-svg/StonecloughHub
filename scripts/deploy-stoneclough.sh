#!/bin/bash

# One-click deployment script for stoneclough.uk
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🏗️ Stoneclough Hub - Custom Domain Deployment"
echo "=============================================="
echo "Deploying to: stoneclough.uk"
echo ""

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

# Check if running as root (for server setup)
if [ "$EUID" -eq 0 ]; then
    log_warning "Running as root. This script will set up the server environment."
    SERVER_SETUP=true
else
    log_info "Running as regular user. Server setup will be skipped."
    SERVER_SETUP=false
fi

# Update environment variables for production
log_info "Configuring environment for stoneclough.uk..."

# Create production environment file
cat > .env.production << EOF
# Production Environment for stoneclough.uk
NODE_ENV=production
PORT=5000
APP_URL=https://stoneclough.uk

# Database - Update with your actual Supabase credentials
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:5432/postgres

# Supabase Authentication - Update with your actual credentials
SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_KEY=[YOUR_SERVICE_KEY]

# Client-side environment variables
VITE_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Email Configuration (Optional - configure if you want email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis Cache (Optional)
REDIS_URL=redis://localhost:6379

# Session Secret (Generate a random string)
SESSION_SECRET=$(openssl rand -base64 32)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
EOF

log_success "Production environment template created (.env.production)"

if [ "$SERVER_SETUP" = true ]; then
    log_info "Setting up server environment..."
    
    # Update system
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    
    # Install required software
    log_info "Installing required software..."
    apt install -y nginx nodejs npm postgresql-client redis-tools certbot python3-certbot-nginx git curl htop
    
    # Install Node.js 18+ if not already installed
    if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 18 ]]; then
        log_info "Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install PM2 globally
    log_info "Installing PM2..."
    npm install -g pm2
    
    # Create deploy user if it doesn't exist
    if ! id "deploy" &>/dev/null; then
        log_info "Creating deploy user..."
        adduser --disabled-password --gecos "" deploy
        usermod -aG sudo deploy
        
        # Set up SSH for deploy user
        mkdir -p /home/deploy/.ssh
        cp /root/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
        chown -R deploy:deploy /home/deploy/.ssh
        chmod 700 /home/deploy/.ssh
        chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
    fi
    
    log_success "Server environment set up"
fi

# Check and prompt for environment variables
log_info "Environment configuration required..."
if [ ! -f ".env" ]; then
    log_warning "No .env file found. Please configure your environment:"
    echo ""
    echo "1. Copy .env.production to .env:"
    echo "   cp .env.production .env"
    echo ""
    echo "2. Edit .env and update the following:"
    echo "   - DATABASE_URL (your Supabase database URL)"
    echo "   - SUPABASE_URL (your Supabase project URL)"
    echo "   - SUPABASE_ANON_KEY (your Supabase anon key)"
    echo "   - SUPABASE_SERVICE_KEY (your Supabase service key)"
    echo "   - Email settings (if you want email notifications)"
    echo ""
    read -p "Press Enter after you've configured .env file..."
fi

# Load environment variables
if [ -f ".env" ]; then
    source .env
    log_success "Environment variables loaded"
else
    log_error "No .env file found. Please create it and try again."
    exit 1
fi

# Install dependencies
log_info "Installing Node.js dependencies..."
npm ci --only=production

# Build the application
log_info "Building the application..."
npm run build

log_success "Application built successfully"

# Set up directories
log_info "Setting up application directories..."
mkdir -p uploads/{images,documents,temp}
mkdir -p scraped_data
mkdir -p logs

# Set correct permissions
chmod 755 uploads scraped_data logs

log_success "Directories created and permissions set"

# Database setup (if configured)
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" != *"[YOUR"* ]]; then
    log_info "Setting up database..."
    
    # Test database connection
    if npm run db:check; then
        log_success "Database connection verified"
        
        # Run migrations
        log_info "Running database migrations..."
        npm run db:migrate
        
        # Seed database
        log_info "Seeding database with initial data..."
        npm run db:seed
        
        log_success "Database setup completed"
    else
        log_warning "Database connection failed. Please check your DATABASE_URL"
    fi
else
    log_warning "Database URL not configured. Skipping database setup."
fi

if [ "$SERVER_SETUP" = true ]; then
    # Configure Nginx
    log_info "Configuring Nginx for stoneclough.uk..."
    
    # Copy nginx configuration
    cp nginx.conf /etc/nginx/sites-available/stoneclough.uk
    
    # Create symbolic link to enable site
    ln -sf /etc/nginx/sites-available/stoneclough.uk /etc/nginx/sites-enabled/
    
    # Remove default nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    if nginx -t; then
        log_success "Nginx configuration is valid"
        systemctl reload nginx
    else
        log_error "Nginx configuration error. Please check the configuration."
        exit 1
    fi
    
    # Configure firewall
    log_info "Configuring firewall..."
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw --force enable
    
    log_success "Firewall configured"
fi

# Start the application with PM2
log_info "Starting Stoneclough Hub with PM2..."

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
      PORT: '5000'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: '5000'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.outerr.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=4096',
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads']
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Set up PM2 startup
if [ "$SERVER_SETUP" = true ]; then
    pm2 startup
    log_info "PM2 startup script generated. Please run the command above."
fi

log_success "Application started with PM2"

# Health check
log_info "Performing health check..."
sleep 10

if curl -f "http://localhost:5000/health" > /dev/null 2>&1; then
    log_success "Application health check passed!"
else
    log_warning "Health check failed. The application might still be starting..."
fi

# SSL Certificate setup (if running as root)
if [ "$SERVER_SETUP" = true ]; then
    log_info "Setting up SSL certificate..."
    echo ""
    log_warning "Important: Make sure your domain stoneclough.uk points to this server's IP address"
    echo "DNS records needed:"
    echo "  A record: stoneclough.uk → $(curl -s ifconfig.me)"
    echo "  A record: www.stoneclough.uk → $(curl -s ifconfig.me)"
    echo ""
    
    read -p "Have you configured the DNS records? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Installing SSL certificate with Let's Encrypt..."
        
        if certbot --nginx -d stoneclough.uk -d www.stoneclough.uk --non-interactive --agree-tos --email admin@stoneclough.uk; then
            log_success "SSL certificate installed successfully!"
            
            # Enable HTTPS redirect in nginx config
            sed -i 's/# return 301 https:/return 301 https:/' /etc/nginx/sites-available/stoneclough.uk
            systemctl reload nginx
            
            log_success "HTTPS redirect enabled"
        else
            log_warning "SSL certificate installation failed. You can try again later with:"
            log_info "sudo certbot --nginx -d stoneclough.uk -d www.stoneclough.uk"
        fi
    else
        log_info "SSL certificate setup skipped. Configure DNS first, then run:"
        log_info "sudo certbot --nginx -d stoneclough.uk -d www.stoneclough.uk"
    fi
fi

# Final status report
echo ""
echo "🎉 Stoneclough Hub Deployment Complete!"
echo "======================================="
echo ""
echo "🌐 Your site will be available at:"
if [ "$SERVER_SETUP" = true ] && command -v certbot &> /dev/null; then
    echo "   https://stoneclough.uk (primary)"
    echo "   https://www.stoneclough.uk (redirect)"
else
    echo "   http://stoneclough.uk (after DNS configuration)"
    echo "   http://www.stoneclough.uk"
fi
echo ""
echo "📊 Application Status:"
echo "   • Health Check: http://localhost:5000/health"
echo "   • Admin Panel: /admin"
echo "   • API Status: /api/health"
echo ""
echo "🔧 Management Commands:"
echo "   • Check status: npm run status"
echo "   • View logs: npm run logs"
echo "   • Restart: npm run restart"
echo "   • Stop: npm run stop"
echo ""
echo "📋 Next Steps:"
if [ "$SERVER_SETUP" = true ]; then
    echo "   1. ✅ Server configured"
    echo "   2. ✅ Application deployed"
    echo "   3. ✅ Nginx configured"
    if command -v certbot &> /dev/null && [ -f /etc/letsencrypt/live/stoneclough.uk/cert.pem ]; then
        echo "   4. ✅ SSL certificate installed"
    else
        echo "   4. ⏳ Configure DNS and install SSL certificate"
    fi
    echo "   5. 🎯 Your site is ready!"
else
    echo "   1. Configure your server with root access"
    echo "   2. Set up domain DNS records"
    echo "   3. Install SSL certificate"
    echo "   4. Configure monitoring and backups"
fi
echo ""

# Show PM2 status
echo "📈 PM2 Application Status:"
pm2 status

echo ""
log_success "Deployment script completed!"
echo ""
echo "🏠 Welcome to Stoneclough Hub - Connecting the Community!"
echo "Built with ❤️ for the residents of Stoneclough"
