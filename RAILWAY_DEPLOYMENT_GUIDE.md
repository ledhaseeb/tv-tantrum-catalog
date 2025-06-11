# TV Tantrum Railway Deployment Guide

## GitHub Repository
https://github.com/ledhaseeb/tv-tantrum-catalog

## Deployment Process

### Step 1: Upload Batches to GitHub
Upload batches in order (1-8) to your GitHub repository:

1. **Batch 1** (13 files): Core configuration files
   - railway.toml, Dockerfile, package.json
   - Essential deployment configuration

2. **Batch 2** (14 files): Server backend
   - Complete Express server with API routes
   - Database schema and authentication

3. **Batch 3** (23 files): Core client application
   - React components and routing
   - Main application structure

4. **Batch 4** (85 files): UI Components
   - Shadcn components and styling
   - Interactive elements

5. **Batch 5-7** (300 files): Static assets
   - TV show images and thumbnails
   - Platform logos and icons

6. **Batch 8** (16 files): Research images
   - All 45 authentic research visualizations
   - Supporting data insights

### Step 2: Railway Auto-Deploy Configuration

Railway will automatically:
- Detect your Node.js application
- Use the provided Dockerfile for containerization
- Set up PostgreSQL database from DATABASE_URL
- Deploy to tvtantrum.com domain
- Enable health checks and monitoring

### Step 3: Environment Variables Required

Set these in Railway dashboard:
```
DATABASE_URL=<postgresql_connection_string>
VITE_GA_MEASUREMENT_ID=<google_analytics_id>
VITE_GOOGLE_ADSENSE_ID=<google_adsense_id>
```

### Step 4: Database Migration

After deployment, run the migration script:
```sql
-- Execute data-migration-script.sql in Railway PostgreSQL
-- This populates your 302 authentic TV shows
```

### Step 5: DNS Configuration

Point tvtantrum.com to Railway:
- Add CNAME record pointing to your Railway deployment
- Railway handles SSL certificates automatically

## Post-Deployment Verification

1. Health check endpoint: `/api/health`
2. API functionality: `/api/tv-shows`
3. Research images: `/research/[filename]`
4. Admin panel: `/admin`
5. Google Analytics tracking active

## Performance Optimization

- CDN enabled for static assets
- Database connection pooling configured
- Caching layers implemented
- Optimized for viral traffic handling

## Monitoring & Analytics

- Railway performance metrics
- Google Analytics page tracking
- Error logging and alerting
- Database performance monitoring

Your 5,000-person waitlist will have access to the complete TV catalog with authentic data and research insights.