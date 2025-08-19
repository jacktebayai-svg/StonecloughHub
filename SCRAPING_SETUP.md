# Setting Up Real Data Scraping

The current deployment uses mock data for serverless compatibility. Here's how to enable real scraping:

## Option 1: Local Development with Real Scraping

### Prerequisites
1. PostgreSQL database running
2. Supabase project configured
3. Environment variables set

### Steps

1. **Update the routes to use real scraping:**
```bash
# Edit api/index.ts to import from '../server/routes' instead of serverless-routes
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
# Add your real Supabase credentials:
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
DATABASE_URL=your_database_connection_string
```

3. **Run database migrations:**
```bash
npm run db:migrate
```

4. **Start local development:**
```bash
npm run dev
```

5. **Trigger data scraping:**
```bash
# Visit: http://localhost:5173/api/admin/scrape
# Or use curl:
curl -X POST http://localhost:5173/api/admin/scrape
```

## Option 2: Deploy with Real Database

### For Railway/Render/Digital Ocean Deployment:

1. **Create production database**
2. **Set environment variables on hosting platform**
3. **Deploy with real routes instead of mock routes**

### Database Schema
The scraper will populate these tables:
- `council_data` - Planning applications, meetings, spending
- `businesses` - Local business directory
- `users` - User accounts and profiles
- `forum_discussions` - Community discussions
- `blog_articles` - News and articles
- `surveys` - Community surveys

## Current Mock Data Sources

The serverless version includes realistic mock data:

### Council Data
- Planning applications (approvals, rejections, pending)
- Council meetings and agendas
- Public spending records

### Business Directory
- Local businesses with categories
- Contact information and verification status
- Search and filtering capabilities

### Community Features
- Forum discussions with replies
- Blog articles and news
- Community surveys and polling

## Scraping Targets

The real scraper targets:
- **Bolton Council Planning Portal**: Planning applications and decisions
- **Bolton Council Meetings**: Committee meetings and minutes
- **Open Data Portal**: Financial transparency data
- **Local Business Directories**: Chamber of Commerce, Yellow Pages
- **Community Forums**: Local Facebook groups, Nextdoor (with permissions)

## Stealth Features

The scraper includes advanced stealth capabilities:
- Random user agent rotation
- Intelligent delay patterns (2-8 seconds)
- Break intervals (30-90 seconds every 50-100 requests)
- Session resets (5-10 minute breaks after 20-30 minutes)
- Exponential backoff on failures
- Request depth limiting

## Data Processing

Scraped data is:
1. **Cleaned and normalized**
2. **Validated against schemas**
3. **Stored in structured database**
4. **Made available via REST API**
5. **Cached for performance**

## Legal Compliance

The scraper follows best practices:
- Respects robots.txt files
- Uses reasonable delay intervals
- Only scrapes publicly available data
- Includes proper attribution
- Follows data protection guidelines

## Monitoring

Built-in monitoring includes:
- Request success/failure rates
- Response time tracking
- Data quality metrics
- Error logging and alerting
- Usage statistics

---

**Note**: The current live deployment at https://stoneclough-hub.vercel.app uses mock data but provides full functionality for testing and demonstration purposes.
