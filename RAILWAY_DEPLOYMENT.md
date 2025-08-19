# Railway Deployment Guide for Stoneclough Hub

This guide will walk you through deploying the Stoneclough Hub application and its scraping services to Railway.

## 📋 Prerequisites

- [Railway Account](https://railway.app/) (free tier available)
- Git repository with your code
- Supabase project (for database and authentication)
- Google OAuth credentials
- Railway CLI (optional but recommended)

## 🚀 Quick Deployment

### Option 1: Deploy from GitHub (Recommended)

1. **Connect Repository to Railway**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository containing the Stoneclough Hub code

2. **Configure Services**
   Railway will automatically detect your `railway.toml` and create two services:
   - **Web Service**: Main application
   - **Scraper Service**: Background scraping service

### Option 2: Deploy using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project in your app directory
cd StonecloughHub
railway init

# Deploy
railway up
```

## 🔧 Environment Configuration

After deployment, configure the following environment variables in the Railway dashboard:

### 1. Database Configuration

**Option A: Use Supabase (Recommended)**
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

**Option B: Use Railway PostgreSQL Add-on**
- Go to your project dashboard
- Click "Add Service" → "Database" → "PostgreSQL"
- Railway will automatically set `DATABASE_URL`

### 2. Supabase Configuration
```env
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-ROLE-KEY]
VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 3. Authentication
```env
GOOGLE_CLIENT_ID=[YOUR-GOOGLE-CLIENT-ID]
GOOGLE_CLIENT_SECRET=[YOUR-GOOGLE-CLIENT-SECRET]
SESSION_SECRET=[RANDOM-64-CHAR-STRING]
```

Generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Application Configuration
```env
NODE_ENV=production
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
PORT=3000
```

## 🕷️ Scraper Service Configuration

The scraper service runs as a separate deployment with the following environment variables:

```env
SCRAPER_MODE=true
SCRAPER_INTERVAL=21600000
SCRAPER_CONCURRENCY=5
SCRAPER_TIMEOUT=30000
```

### Scheduling Options

**Option 1: Railway Cron Jobs (Recommended)**
The `railway.toml` configuration includes a cron schedule that runs every 6 hours:
```toml
[services.scraper.cron]
schedule = "0 */6 * * *"
```

**Option 2: Manual Triggers**
You can manually trigger the scraper via the API:
```bash
curl -X POST https://your-app.railway.app/api/admin/scrape
```

## 🔍 Setting Environment Variables

### Via Railway Dashboard
1. Go to your project dashboard
2. Select the service (web or scraper)
3. Click on "Variables" tab
4. Add each environment variable

### Via Railway CLI
```bash
# Set variables for web service
railway variables set DATABASE_URL="your-database-url"
railway variables set SUPABASE_URL="your-supabase-url"

# Set variables for scraper service (switch service first)
railway service use scraper
railway variables set SCRAPER_MODE="true"
```

## 📦 Database Setup

### 1. Run Migrations
After deployment, initialize the database:

```bash
# Using Railway CLI
railway run npm run db:migrate

# Or via API endpoint
curl -X POST https://your-app.railway.app/api/admin/seed
```

### 2. Seed Initial Data
```bash
# Using Railway CLI
railway run npm run db:seed

# Or it will auto-seed on first startup if no data exists
```

## 🏗️ Build Configuration

Railway automatically uses the build commands defined in `package.json`:

- **Web Service**: `npm run railway:build`
- **Scraper Service**: `npm run scraper:build`

### Custom Build Commands
If needed, you can override build commands in Railway dashboard:
- Build Command: `npm run railway:build`
- Start Command: `npm run railway:start`

## 📊 Monitoring & Logs

### Health Checks
The application includes health check endpoints:
- **Main app**: `https://your-app.railway.app/health`
- **API status**: `https://your-app.railway.app/api/admin/scraper/status`

### Viewing Logs
```bash
# View web service logs
railway logs --service web

# View scraper service logs
railway logs --service scraper

# Follow logs in real-time
railway logs --follow
```

## 🔧 Troubleshooting

### Common Issues

**1. Build Failures**
- Check that all dependencies are in `package.json`
- Ensure TypeScript compiles without errors: `npm run check`
- Verify build script works locally: `npm run railway:build`

**2. Database Connection Issues**
- Verify `DATABASE_URL` is correctly formatted
- Check Supabase connection limits
- Ensure database is accessible from Railway

**3. Environment Variable Issues**
- Double-check all required variables are set
- Verify URLs don't have trailing slashes
- Ensure secrets are properly encoded

**4. Scraper Not Running**
- Check scraper service logs: `railway logs --service scraper`
- Verify cron schedule is configured
- Test scraper manually: `curl -X POST /api/admin/scrape`

### Debug Commands
```bash
# Check service status
railway status

# View environment variables
railway variables

# Connect to service shell
railway shell

# Run database commands
railway run npm run db:push
```

## 🔄 Updates & Redeployment

### Automatic Deployments
Railway automatically redeploys when you push to your connected Git branch.

### Manual Deployment
```bash
# Using Railway CLI
railway up

# Or trigger from dashboard
# Go to Deployments → Trigger Deploy
```

### Rolling Back
```bash
# List recent deployments
railway deployments

# Rollback to specific deployment
railway rollback [deployment-id]
```

## 💰 Cost Optimization

### Railway Pricing
- **Free Tier**: $0/month - 500 hours of usage
- **Pro Tier**: $5/month - Unlimited usage

### Cost-Saving Tips
1. **Use sleep mode** for non-critical services
2. **Optimize cron frequency** for scraper
3. **Monitor resource usage** in dashboard
4. **Use shared databases** when possible

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit secrets to Git
   - Use Railway's built-in secret management
   - Rotate secrets regularly

2. **Database Security**
   - Use connection pooling
   - Enable SSL connections
   - Regular backups (Supabase handles this)

3. **API Security**
   - Implement rate limiting
   - Use HTTPS only
   - Validate all inputs

## 📱 Domain Configuration

### Custom Domain
1. Go to Settings → Domains in Railway dashboard
2. Add your custom domain
3. Configure DNS records as shown
4. SSL certificates are automatically provisioned

### Environment URLs
- Production: `https://your-app.railway.app`
- Custom domain: `https://your-domain.com`

## 🤝 Support

### Getting Help
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway GitHub Issues](https://github.com/railwayapp/railway/issues)

### Application-Specific Issues
- Check application logs first
- Test locally with production environment
- Review health check endpoints
- Monitor database performance

---

## 🎯 Next Steps After Deployment

1. ✅ Verify health checks are passing
2. ✅ Test scraper functionality
3. ✅ Configure monitoring alerts
4. ✅ Set up custom domain (optional)
5. ✅ Configure backups
6. ✅ Set up CI/CD pipeline improvements

Your Stoneclough Hub application should now be running on Railway! 🚀
