# StonecloughHub Deployment Guide

This guide covers deploying StonecloughHub to Vercel with Supabase as the PostgreSQL database.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **Google Cloud Console**: For OAuth credentials (optional)

## 1. Database Setup (Supabase)

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Set a strong database password
4. Wait for the project to be provisioned

### Get Database URL

1. In your Supabase dashboard, go to Settings > Database
2. Copy the **Connection string** under "Connection pooling"
3. Replace `[YOUR-PASSWORD]` with your database password
4. The URL format should be: `postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`

### Enable Row Level Security (Optional but Recommended)

1. Go to Authentication > Settings
2. Enable "Row Level Security" for better data protection

## 2. Environment Variables Setup

Copy the `.env.example` file to create your environment configuration:

```bash
cp .env.example .env.production
```

Fill in the following variables:

### Database
- `DATABASE_URL`: Your Supabase connection string from step 1

### Supabase (if using Supabase Auth features)
- `SUPABASE_URL`: Your Supabase project URL (https://[project-id].supabase.co)
- `SUPABASE_ANON_KEY`: Your Supabase anon key (from Settings > API)
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (from Settings > API)

### Authentication
- `SESSION_SECRET`: A strong random string (32+ characters)
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret

### Application
- `APP_URL`: Your production domain (e.g., https://yourdomain.vercel.app)

## 3. Google OAuth Setup (Optional)

If you want to enable Google OAuth login:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Add `[YOUR-DOMAIN]/api/auth/google/callback` to authorized redirect URIs
7. Copy the Client ID and Client Secret

## 4. Database Migration and Seeding

After deploying, you'll need to set up your database:

### Option A: Local Setup First (Recommended)

1. Install dependencies: `npm install`
2. Set up local environment with your Supabase credentials
3. Run migrations: `npm run db:migrate`
4. Seed the database: `npm run db:seed`

### Option B: Deploy Scripts

The migration and seeding scripts are included and can be run in production if needed:
- Migration script: `scripts/migrate.ts`
- Seed script: `scripts/seed.ts`

## 5. Vercel Deployment

### Method 1: Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### Method 2: Vercel CLI

1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

### Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add all variables from your `.env.production` file
4. Make sure to set them for "Production" environment

Required variables:
- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV` (set to "production")
- `APP_URL`
- `GOOGLE_CLIENT_ID` (if using Google OAuth)
- `GOOGLE_CLIENT_SECRET` (if using Google OAuth)

## 6. Post-Deployment Setup

### Verify Database Connection

1. Check Vercel function logs for any database connection errors
2. Verify that migrations ran successfully

### Create Admin User

If you need an admin user, you can create one through the seeding script or manually in Supabase:

1. Go to Supabase > Table Editor
2. Find the `users` table
3. Create a new user with `role: 'admin'`

### Test Authentication

1. Try registering a new user
2. Test Google OAuth (if configured)
3. Verify user sessions work correctly

## 7. Monitoring and Maintenance

### Logs
- Check Vercel function logs for errors
- Monitor Supabase dashboard for database performance

### Updates
- Database migrations should be run before deploying new versions
- Monitor for breaking changes in dependencies

### Backups
- Supabase automatically backs up your database
- Consider exporting critical data periodically

## Troubleshooting

### Common Issues

1. **Database Connection Timeout**
   - Verify DATABASE_URL is correct
   - Check if Supabase project is active
   - Ensure connection pooling is enabled

2. **Authentication Errors**
   - Verify SESSION_SECRET is set
   - Check Google OAuth redirect URLs
   - Ensure cookies are working (secure flag in production)

3. **Build Errors**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review TypeScript compilation errors

4. **API Routes Not Working**
   - Verify Vercel routing configuration
   - Check function timeout settings
   - Review serverless function limits

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Documentation](https://expressjs.com)

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **Database Security**: Enable Row Level Security in Supabase
3. **HTTPS**: Always use HTTPS in production (Vercel provides this)
4. **Session Security**: Use strong session secrets and secure cookies
5. **Input Validation**: Ensure all user inputs are validated (implemented with Zod)

## Performance Optimization

1. **Database Indexing**: Add indexes for frequently queried columns
2. **Connection Pooling**: Enabled by default in production configuration
3. **Caching**: Consider adding Redis for session storage in high-traffic scenarios
4. **CDN**: Vercel automatically provides CDN for static assets

---

For additional help or questions, please refer to the project documentation or create an issue in the repository.
