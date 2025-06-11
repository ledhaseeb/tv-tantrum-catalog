# TV Tantrum Development to Production Workflow

## Current Setup
- **Development**: Replit (with Git restrictions)
- **Repository**: https://github.com/ledhaseeb/tv-tantrum-catalog
- **Production**: Railway (auto-deploys from GitHub)

## Option 1: Replit Export Method (Recommended)

### When You Make Changes in Replit:

1. **Test Changes Locally**
   ```bash
   npm run dev
   ```
   Verify everything works in your Replit environment

2. **Create Deployment Package**
   ```bash
   ./deploy-changes.sh "your change description"
   ```
   This creates a clean package at `/tmp/tv-tantrum-deploy`

3. **Upload to GitHub**
   - Download the deployment package from `/tmp/tv-tantrum-deploy`
   - Go to https://github.com/ledhaseeb/tv-tantrum-catalog
   - Click "Add file" → "Upload files"
   - Drag all files from the package
   - Commit with your change description
   - Railway auto-deploys in 3-5 minutes

## Option 2: Individual File Updates (For Small Changes)

### For Single File Changes:
1. Make changes in Replit
2. Copy the modified file content
3. Go to GitHub → navigate to the file
4. Click "Edit" → paste new content
5. Commit changes → Railway deploys automatically

## Option 3: Railway CLI (Advanced)

### Setup Railway CLI on Local Machine:
```bash
npm install -g @railway/cli
railway login
railway link [your-project-id]
```

### Deploy from Local:
```bash
railway up
```

## Change Types & Methods

### Small UI Changes
- **Method**: Individual file updates (Option 2)
- **Time**: 2-3 minutes to production

### Feature Additions  
- **Method**: Replit export (Option 1)
- **Time**: 5-10 minutes to production

### Database Schema Changes
- **Method**: Replit export + migration
- **Time**: 10-15 minutes to production
- **Note**: Run `npm run db:push` in Railway after deployment

## Automated Deployment Flow

```
Replit Changes → GitHub Push → Railway Auto-Deploy → Live at tvtantrum.com
     (2 min)       (2 min)         (3-5 min)           (Total: 7-12 min)
```

## Rollback Process

### If Issues After Deployment:
1. Go to GitHub → "Commits"
2. Find last working commit
3. Click "Revert this commit"
4. Railway automatically deploys the previous version

### Railway Dashboard Rollback:
1. Go to Railway project dashboard
2. Click "Deployments" 
3. Select previous deployment
4. Click "Redeploy"

## Development Best Practices

### Before Each Deployment:
- Test thoroughly in Replit development environment
- Check console for errors
- Verify database queries work
- Test admin functionality

### Commit Message Format:
- `feat: add new TV show filtering`
- `fix: resolve admin panel login issue`
- `perf: optimize image loading for viral traffic`
- `style: update homepage layout`

## Emergency Hotfixes

### For Critical Issues:
1. Make fix in Replit
2. Use individual file update method (fastest)
3. Monitor Railway deployment logs
4. Verify fix on tvtantrum.com

This workflow ensures you can rapidly deploy changes while maintaining the stability needed for your viral traffic launch.