#!/bin/bash
# Deploy changes from Replit to GitHub to Railway
# Usage: ./deploy-changes.sh "commit message"

echo "🚀 TV Tantrum Deployment Script"
echo "================================"

# Check if commit message provided
if [ -z "$1" ]; then
    echo "❌ Please provide a commit message"
    echo "Usage: ./deploy-changes.sh 'your commit message'"
    exit 1
fi

COMMIT_MSG="$1"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "📦 Creating deployment package..."

# Create temporary deployment directory
mkdir -p /tmp/tv-tantrum-deploy
cd /tmp/tv-tantrum-deploy

# Copy essential files (exclude large assets and local files)
echo "📋 Copying project files..."
rsync -av --exclude='node_modules' \
          --exclude='dist' \
          --exclude='attached_assets' \
          --exclude='postgres' \
          --exclude='.git' \
          --exclude='*.log' \
          /home/runner/workspace/ ./

# Create deployment info
echo "🔍 Deployment Info:"
echo "Timestamp: $TIMESTAMP"
echo "Commit: $COMMIT_MSG"
echo "Files: $(find . -type f | wc -l)"

echo ""
echo "📤 Ready to upload to GitHub!"
echo "1. Download this folder: /tmp/tv-tantrum-deploy"
echo "2. Go to: https://github.com/ledhaseeb/tv-tantrum-catalog"
echo "3. Upload files with commit message: '$COMMIT_MSG'"
echo "4. Railway will auto-deploy in 3-5 minutes"

# Create upload instructions
cat > UPLOAD_INSTRUCTIONS.txt << EOF
TV Tantrum Deployment - $TIMESTAMP

Commit Message: $COMMIT_MSG

Upload Steps:
1. Go to https://github.com/ledhaseeb/tv-tantrum-catalog
2. Click "Add file" > "Upload files"
3. Drag all files from this folder
4. Commit message: $COMMIT_MSG
5. Click "Commit changes"

Railway will automatically deploy the changes.
EOF

echo "✅ Deployment package ready at /tmp/tv-tantrum-deploy"
echo "📄 Instructions saved to UPLOAD_INSTRUCTIONS.txt"