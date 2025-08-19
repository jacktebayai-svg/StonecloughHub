# Quick Deploy to stoneclough.uk 🚀

This guide provides the fastest way to get your Stoneclough Hub live on `stoneclough.uk`.

## 🎯 Choose Your Deployment Method

### Method 1: VPS/Cloud Server (Full Control) ⭐ **RECOMMENDED**
**Best for**: Complete control, custom domain, SSL certificates  
**Cost**: ~$5-20/month  
**Setup time**: 15-30 minutes

### Method 2: Vercel (Serverless)
**Best for**: Quick deployment, automatic scaling  
**Cost**: Free tier available  
**Setup time**: 5-10 minutes

### Method 3: Railway (Simple)
**Best for**: Database included, simple setup  
**Cost**: ~$5-10/month  
**Setup time**: 10-15 minutes

---

## 🏗️ Method 1: VPS/Cloud Server Deployment

### Prerequisites
- A VPS/cloud server (Ubuntu 22.04 recommended)
- Domain `stoneclough.uk` pointing to your server IP
- SSH access to your server

### Step 1: Get a Server
Choose a provider:
- **DigitalOcean** (recommended): $6/month droplet
- **Linode**: $5/month Nanode
- **Vultr**: $6/month instance
- **Hetzner**: €4.15/month VPS

**Minimum specs**: 2GB RAM, 1 CPU, 25GB SSD

### Step 2: Point Your Domain
In your domain registrar (or Cloudflare), add these DNS records:
```
A record: stoneclough.uk → YOUR_SERVER_IP
A record: www.stoneclough.uk → YOUR_SERVER_IP
```

### Step 3: One-Click Deployment
```bash
# SSH to your server as root
ssh root@your-server-ip

# Clone the project
git clone https://github.com/your-username/StonecloughHub.git
cd StonecloughHub

# Run the one-click deployment
./scripts/deploy-stoneclough.sh
```

The script will:
1. ✅ Set up the server environment
2. ✅ Install all dependencies
3. ✅ Configure Nginx
4. ✅ Build and start the application
5. ✅ Set up SSL certificate
6. ✅ Configure firewall

**That's it!** Your site will be live at `https://stoneclough.uk`

---

## 🚀 Method 2: Vercel Deployment

### Step 1: Prepare Your Environment
1. Create a [Supabase](https://supabase.com) project
2. Note down your:
   - Database URL
   - Supabase URL
   - Anon Key
   - Service Key

### Step 2: Deploy to Vercel
1. **Fork this repository** on GitHub
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables (see below)

### Step 3: Configure Environment Variables in Vercel
Add these in your Vercel project settings:

```env
NODE_ENV=production
APP_URL=https://stoneclough.uk
DATABASE_URL=your-supabase-database-url
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 4: Add Custom Domain
1. In Vercel dashboard → Domains
2. Add `stoneclough.uk` and `www.stoneclough.uk`
3. Follow DNS configuration instructions

**Done!** Your site will be live at `https://stoneclough.uk`

---

## 🚂 Method 3: Railway Deployment

### Step 1: Setup Railway
1. **Connect to Railway**:
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Add PostgreSQL service (optional)

### Step 2: Configure Environment
Add these environment variables in Railway:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://stoneclough.uk
DATABASE_URL=your-database-url
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Step 3: Add Custom Domain
1. In Railway project → Settings → Domains
2. Add `stoneclough.uk`
3. Configure DNS as instructed

**Live!** Your site is now at `https://stoneclough.uk`

---

## 📋 Environment Variables Guide

### Required (All Methods)
```env
NODE_ENV=production
APP_URL=https://stoneclough.uk
DATABASE_URL=postgresql://user:pass@host:port/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Client-side (For frontend)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Optional (Email notifications)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🗄️ Database Setup (Supabase)

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Get your credentials**:
   - Project URL
   - Anon key  
   - Service role key
   - Database URL
3. **Authentication setup** (optional):
   - Enable email authentication
   - Configure OAuth providers
   - Set up email templates

---

## ✅ Post-Deployment Checklist

### Verify Your Deployment
- [ ] Site loads at `https://stoneclough.uk`
- [ ] Health check: `https://stoneclough.uk/health`
- [ ] User registration works
- [ ] Forum posts can be created
- [ ] Admin panel accessible at `/admin`

### Security & Performance
- [ ] SSL certificate active (green padlock)
- [ ] Site speed test passed
- [ ] Security headers configured
- [ ] Database backups enabled

### Community Setup
- [ ] Create admin account
- [ ] Add initial forum categories
- [ ] Post welcome message
- [ ] Configure email notifications
- [ ] Add local business listings

---

## 🔧 Management Commands

After deployment, use these commands to manage your site:

```bash
# Check application status
npm run status

# View logs
npm run logs

# Restart application
npm run restart

# Update to latest version
git pull
npm run build
npm run restart

# Database operations
npm run db:migrate  # Run migrations
npm run db:seed    # Seed with sample data
```

---

## 🆘 Troubleshooting

### Common Issues

**Site not loading?**
- Check DNS propagation: `dig stoneclough.uk`
- Verify server IP is correct
- Check firewall rules

**SSL certificate issues?**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

**Database connection failed?**
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Test connection: `npm run db:check`

**Application errors?**
```bash
# Check logs
npm run logs
pm2 logs stoneclough-hub

# Restart application
npm run restart
```

### Getting Help
- Check the logs first: `npm run logs`
- Review the deployment guide: `DEPLOYMENT_GUIDE.md`
- Check server resources: `htop`
- Test database: `npm run db:check`

---

## 🎉 Success!

Your Stoneclough Hub should now be live at:

🌐 **https://stoneclough.uk**

### Features Available:
- ✅ Community forum with real-time updates
- ✅ Local business directory
- ✅ News and blog posts
- ✅ Council meeting information
- ✅ Community surveys
- ✅ User profiles and skills sharing
- ✅ Admin panel for content management
- ✅ Mobile-responsive design
- ✅ Email notifications (if configured)

### Next Steps:
1. **Create your admin account**
2. **Invite community members**
3. **Add local businesses**  
4. **Post welcome content**
5. **Share the site with residents**

**Welcome to your new community platform!** 🏠❤️

---

*Built with love for the Stoneclough community* 💚
