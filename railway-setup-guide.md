# Railway Setup for TV Tantrum Deployment

## After GitHub Upload Complete

### Phase 2: Railway Connection

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select: `ledhaseeb/tv-tantrum-catalog`
   - Railway detects Node.js automatically

2. **Add PostgreSQL Database**
   - In Railway dashboard: "Add Service" → "Database" → "PostgreSQL"
   - Copy the `DATABASE_URL` from Variables tab

3. **Set Environment Variables**
   ```
   DATABASE_URL=<from Railway PostgreSQL service>
   SESSION_SECRET=tvtantrum_production_secret_2024_railway
   NODE_ENV=production
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_GOOGLE_ADSENSE_ID=ca-pub-1980242774753631
   PORT=${{ PORT }}
   ```

### Phase 3: Database Setup

Run these commands in Railway's database console:

```sql
-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Create index for session cleanup
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
```

### Phase 4: Import TV Shows Data

Your 302 TV shows will need to be imported. The schema is already defined in your uploaded code.

### Phase 5: Custom Domain

1. **In Railway Settings → Domains**
   - Add custom domain: `tvtantrum.com`
   - Update DNS A record as instructed
   - SSL certificate auto-generates

### Phase 6: Verification

Check these endpoints after deployment:
- Health check: `https://tvtantrum.com/api/health`
- TV shows: `https://tvtantrum.com/api/tv-shows`
- Admin panel: `https://tvtantrum.com/tvtantrum-admin-secure-access-2024`

### Performance Monitoring

Your app includes built-in monitoring:
- Performance stats: `/api/performance-stats`
- Cache management: `/api/cache/clear`
- Real-time metrics in Railway dashboard

Railway handles scaling automatically for your viral traffic launch.