# Deployment Guide for stoneclough.uk

This guide will help you deploy the Stoneclough Hub to your custom domain `stoneclough.uk`.

## 🚀 Deployment Options

### Option 1: VPS/Cloud Server (Recommended)
**Best for**: Full control, custom domain, SSL certificates
**Services**: DigitalOcean, Linode, Vultr, AWS EC2, Google Cloud

### Option 2: Vercel with Custom Domain
**Best for**: Easy deployment, automatic scaling, serverless
**Limitations**: May need external database

### Option 3: Railway with Custom Domain
**Best for**: Simple deployment with database included
**Good for**: Quick setup with built-in PostgreSQL

## 📋 Pre-Deployment Checklist

- [ ] Domain `stoneclough.uk` purchased and accessible
- [ ] DNS management access (Cloudflare, domain registrar, etc.)
- [ ] Server/hosting platform chosen
- [ ] SSL certificate plan (Let's Encrypt recommended)
- [ ] Database setup (Supabase recommended)
- [ ] Email service configured (optional)

## 🌐 Option 1: VPS/Cloud Server Deployment

### Step 1: Server Setup

1. **Create a server** (Ubuntu 22.04 LTS recommended)
   - Minimum: 2GB RAM, 2 CPU cores, 20GB SSD
   - Recommended: 4GB RAM, 2 CPU cores, 40GB SSD

2. **Initial server configuration**:
   ```bash
   # Connect to your server
   ssh root@your-server-ip
   
   # Update system
   apt update && apt upgrade -y
   
   # Install required software
   apt install -y nginx nodejs npm postgresql redis-server certbot python3-certbot-nginx git curl
   
   # Install PM2 globally
   npm install -g pm2
   
   # Create a deploy user
   adduser deploy
   usermod -aG sudo deploy
   su - deploy
   ```

### Step 2: Domain Configuration

1. **Point your domain to the server**:
   ```
   A record: @ → your-server-ip
   A record: www → your-server-ip
   ```

2. **Verify DNS propagation**:
   ```bash
   dig stoneclough.uk
   dig www.stoneclough.uk
   ```

### Step 3: Deploy the Application

1. **Clone and setup the project**:
   ```bash
   cd /home/deploy
   git clone https://github.com/your-username/StonecloughHub.git
   cd StonecloughHub
   
   # Make scripts executable
   chmod +x scripts/*.sh
   
   # Copy and configure environment
   cp .env.example .env
   nano .env  # Configure your environment variables
   ```

2. **Configure environment variables**:
   ```bash
   # Edit .env file
   NODE_ENV=production
   PORT=5000
   APP_URL=https://stoneclough.uk
   
   # Database (Supabase recommended)
   DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
   
   # Supabase Auth
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   
   # Optional: Email configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

3. **Run the deployment script**:
   ```bash
   npm run deploy
   ```

### Step 4: Nginx Configuration

1. **Update Nginx configuration for your domain**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/stoneclough.uk
   sudo nano /etc/nginx/sites-available/stoneclough.uk
   ```

2. **Update server names in the config**:
   ```nginx
   server_name stoneclough.uk www.stoneclough.uk;
   ```

3. **Enable the site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/stoneclough.uk /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Step 5: SSL Certificate (Let's Encrypt)

1. **Install SSL certificate**:
   ```bash
   sudo certbot --nginx -d stoneclough.uk -d www.stoneclough.uk
   ```

2. **Verify auto-renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```

### Step 6: Final Configuration

1. **Update firewall**:
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

2. **Configure automatic deployment** (optional):
   ```bash
   # Set up GitHub webhook for auto-deployment
   pm2 install pm2-auto-pull
   ```

3. **Test the deployment**:
   ```bash
   curl -I https://stoneclough.uk/health
   ```

## 🔄 Option 2: Vercel Deployment

### Step 1: Prepare for Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

### Step 2: Configure Environment Variables

1. **Set up environment variables in Vercel dashboard**:
   - Go to your project settings
   - Add all environment variables from `.env.example`
   - Update `APP_URL` to `https://stoneclough.uk`

### Step 3: Deploy

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Configure custom domain**:
   - Go to Vercel dashboard → Project → Domains
   - Add `stoneclough.uk` and `www.stoneclough.uk`
   - Follow DNS configuration instructions

## 🚂 Option 3: Railway Deployment

### Step 1: Railway Setup

1. **Connect GitHub repository** to Railway
2. **Configure environment variables** in Railway dashboard
3. **Deploy automatically**

### Step 2: Custom Domain

1. **Add custom domain** in Railway project settings
2. **Configure DNS records** as instructed by Railway

## 📧 Email Configuration (Optional)

### Using Gmail SMTP:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate app password in Google Account settings
```

### Using Mailgun:
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.stoneclough.uk
SMTP_PASS=your-mailgun-password
```

## 🔍 Post-Deployment Verification

1. **Test all endpoints**:
   ```bash
   curl https://stoneclough.uk/health
   curl https://stoneclough.uk/api/health
   ```

2. **Check SSL certificate**:
   ```bash
   curl -I https://stoneclough.uk
   ```

3. **Verify database connection**:
   ```bash
   npm run db:check
   ```

4. **Test authentication**:
   - Visit https://stoneclough.uk
   - Try user registration/login
   - Check forum functionality

## 🔧 Maintenance Commands

```bash
# Check application status
npm run status

# View logs
npm run logs

# Restart application
npm run restart

# Update application
cd /home/deploy/StonecloughHub
git pull origin main
npm run build
pm2 restart stoneclough-hub

# Backup database (if using PostgreSQL locally)
pg_dump stoneclough_hub > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🚨 Troubleshooting

### Common Issues:

1. **SSL Certificate Issues**:
   ```bash
   sudo certbot renew
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Application Won't Start**:
   ```bash
   npm run logs
   pm2 logs stoneclough-hub
   ```

3. **Database Connection Issues**:
   ```bash
   npm run db:check
   # Check DATABASE_URL in .env
   ```

4. **Domain Not Resolving**:
   ```bash
   dig stoneclough.uk
   nslookup stoneclough.uk
   ```

## 📊 Monitoring Setup

### Basic Monitoring:
```bash
# Install htop for system monitoring
sudo apt install htop

# Monitor application with PM2
pm2 monit
```

### Advanced Monitoring (Optional):
- Set up Uptime Robot for website monitoring
- Configure log aggregation with LogTail
- Set up performance monitoring with New Relic

## 🔐 Security Checklist

- [ ] SSL certificate installed and working
- [ ] Firewall configured (UFW)
- [ ] Strong passwords for all accounts
- [ ] Regular backups configured
- [ ] Security headers enabled in Nginx
- [ ] Rate limiting configured
- [ ] Keep system and dependencies updated

## 📈 Performance Optimization

1. **Enable Gzip compression** (already in nginx.conf)
2. **Configure caching headers** for static assets
3. **Set up Redis** for session storage and caching
4. **Monitor and optimize** database queries
5. **Use CDN** for static assets (Cloudflare)

## 🎉 Go Live!

Once deployed, your Stoneclough Hub will be available at:
- **Main site**: https://stoneclough.uk
- **Admin panel**: https://stoneclough.uk/admin
- **API health**: https://stoneclough.uk/health

Congratulations! Your community platform is now live and ready for the Stoneclough community! 🎊
