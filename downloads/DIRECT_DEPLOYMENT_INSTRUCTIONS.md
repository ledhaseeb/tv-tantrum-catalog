# TV Tantrum Direct Railway Deployment

## Single Archive Solution

**Download:** `tv-tantrum-minimal.tar.gz` (5.5MB)

This archive contains your complete TV Tantrum catalog ready for Railway deployment, bypassing GitHub's file upload limitations entirely.

## Deployment Methods

### Method 1: Railway CLI (Recommended)
```bash
# Download and extract locally
tar -xzf tv-tantrum-minimal.tar.gz
cd tv-tantrum-deploy

# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

### Method 2: Railway Dashboard Upload
1. Login to Railway dashboard
2. Create new project
3. Upload the extracted folder contents directly
4. Railway auto-detects Node.js application
5. Deploys using included Dockerfile

### Method 3: Docker Hub Integration
```bash
# Build and push Docker image
docker build -t tv-tantrum-catalog .
docker tag tv-tantrum-catalog your-username/tv-tantrum
docker push your-username/tv-tantrum

# Deploy from Railway dashboard using Docker image
```

## Environment Variables Required
Set these in Railway dashboard:
- `DATABASE_URL` (Railway provides PostgreSQL)
- `VITE_GA_MEASUREMENT_ID` 
- `VITE_GOOGLE_ADSENSE_ID`

## What's Included
- Complete Express server with 302 TV shows API
- React application with catalog interface
- All 45 authentic research visualizations
- Database schemas and migration scripts
- Production-ready Docker configuration
- Railway deployment configuration

## Domain Setup
Point tvtantrum.com CNAME to your Railway deployment URL. SSL certificates are automatically provisioned.

**Deployment Time:** ~10 minutes from download to live site