# Railway Direct Deployment Solution

## Railway CLI Method (Recommended)

### Setup
1. Install Railway CLI on your local machine:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Create new Railway project or link existing:
   ```bash
   railway new tv-tantrum-catalog
   # OR link existing project
   railway link
   ```

### Direct Deployment
1. Download entire project from Replit as ZIP
2. Extract locally
3. Deploy directly:
   ```bash
   railway up
   ```

This bypasses GitHub entirely and deploys your complete TV catalog with all files in one operation.

## Alternative: Replit to Railway Integration

### Using Replit's Built-in Deploy
1. In Replit, go to Deploy tab
2. Select Railway as provider
3. Connect accounts
4. Deploy directly from Replit workspace

### Using Railway's GitHub Integration with Compressed Assets
1. Upload only code files to GitHub (ignore file limit)
2. Compress images to base64 in database
3. Store large assets in Railway's persistent volumes
4. Deploy code via GitHub, assets separately

## Environment Variables for Railway
```
DATABASE_URL=[Railway PostgreSQL URL]
VITE_GA_MEASUREMENT_ID=[Your Google Analytics ID]
VITE_GOOGLE_ADSENSE_ID=[Your AdSense ID]
NODE_ENV=production
```

## Custom Domain Setup
- Point tvtantrum.com CNAME to Railway deployment
- Railway handles SSL automatically
- DNS propagation ~15 minutes

Your complete TV Tantrum catalog with 302 shows and 45 research images deploys without file upload restrictions.