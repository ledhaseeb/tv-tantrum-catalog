# TV Tantrum - Children's Media Discovery Platform

A gamified web platform revolutionizing children's media discovery through an intelligent content recommendation system. Features 302 authentic TV shows with stimulation ratings to help parents find appropriate content.

## Production Deployment (Railway)

### Quick Deploy to Railway

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository

2. **Add PostgreSQL Database**
   - In Railway dashboard: "Add Service" → "Database" → "PostgreSQL"
   - Copy the DATABASE_URL from the database service

3. **Set Environment Variables**
   ```
   DATABASE_URL=<from Railway PostgreSQL service>
   SESSION_SECRET=<generate secure 32+ character string>
   NODE_ENV=production
   VITE_GA_MEASUREMENT_ID=<your Google Analytics measurement ID>
   VITE_GOOGLE_ADSENSE_ID=ca-pub-1980242774753631
   ORIGINAL_DATABASE_URL=<legacy database URL for image proxy>
   ```

4. **Deploy & Configure Domain**
   - Railway auto-deploys on every push
   - Add custom domain in Railway settings
   - Update DNS records as instructed

### Database Migration

Run these commands to set up the database schema:
```bash
npm run db:push
```

Then import your TV shows data using the provided SQL export files.

### Local Development

```bash
npm install
npm run dev
```

The app runs on port 5000 by default.

### Features

- **302 Authentic TV Shows** with detailed metadata
- **Stimulation Rating System** (1-5 scale) for content appropriateness
- **Admin Panel** for content management
- **Performance Optimized** for viral traffic with caching
- **Google Analytics & AdSense** integration
- **Responsive Design** for all devices

### Performance Monitoring

- Health check: `GET /api/health`
- Performance stats: `GET /api/performance-stats`
- Cache management: `POST /api/cache/clear`

Built for scalability with 2,000+ concurrent user capacity.