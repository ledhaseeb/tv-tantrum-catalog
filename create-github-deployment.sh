#!/bin/bash

# Create GitHub deployment batches with proper directory structure
echo "Creating complete GitHub deployment batches..."

# Clean up existing batches
rm -rf /tmp/github-deploy
mkdir -p /tmp/github-deploy

# Get total file count for batch sizing
TOTAL_FILES=$(find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './attached_assets/*' -not -path './downloads/*' -not -path '/tmp/*' | wc -l)
echo "Total files to deploy: $TOTAL_FILES"

# Batch 1: Core deployment configuration (priority files)
echo "Creating Batch 1: Core configuration..."
mkdir -p /tmp/github-deploy/batch-1
cp package.json /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp package-lock.json /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp railway.toml /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp Dockerfile /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp tsconfig.json /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp vite.config.ts /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp tailwind.config.ts /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp postcss.config.js /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp components.json /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp drizzle.config.ts /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp data-migration-script.sql /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp README.md /tmp/github-deploy/batch-1/ 2>/dev/null || true
cp .env /tmp/github-deploy/batch-1/ 2>/dev/null || true

# Batch 2: Server backend
echo "Creating Batch 2: Server backend..."
mkdir -p /tmp/github-deploy/batch-2
cp -r server /tmp/github-deploy/batch-2/ 2>/dev/null || true

# Batch 3: Shared schemas and migrations
echo "Creating Batch 3: Shared schemas..."
mkdir -p /tmp/github-deploy/batch-3
cp -r shared /tmp/github-deploy/batch-3/ 2>/dev/null || true
cp -r migrations /tmp/github-deploy/batch-3/ 2>/dev/null || true

# Batch 4: Client application core
echo "Creating Batch 4: Client core..."
mkdir -p /tmp/github-deploy/batch-4/client
cp -r client/src /tmp/github-deploy/batch-4/client/ 2>/dev/null || true
cp client/index.html /tmp/github-deploy/batch-4/client/ 2>/dev/null || true

# Batch 5: Public assets (excluding images)
echo "Creating Batch 5: Public assets..."
mkdir -p /tmp/github-deploy/batch-5/client/public
find client/public -type f -not -path "*/images/*" -not -path "*/research/*" | head -100 | while read file; do
  mkdir -p "/tmp/github-deploy/batch-5/$(dirname "$file")"
  cp "$file" "/tmp/github-deploy/batch-5/$file" 2>/dev/null || true
done

# Batch 6: TV show images part 1
echo "Creating Batch 6: TV show images (part 1)..."
mkdir -p /tmp/github-deploy/batch-6/client/public/images
find client/public/images -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" | head -100 | while read file; do
  mkdir -p "/tmp/github-deploy/batch-6/$(dirname "$file")"
  cp "$file" "/tmp/github-deploy/batch-6/$file" 2>/dev/null || true
done

# Batch 7: TV show images part 2
echo "Creating Batch 7: TV show images (part 2)..."
mkdir -p /tmp/github-deploy/batch-7/client/public/images
find client/public/images -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" | tail -n +101 | head -100 | while read file; do
  mkdir -p "/tmp/github-deploy/batch-7/$(dirname "$file")"
  cp "$file" "/tmp/github-deploy/batch-7/$file" 2>/dev/null || true
done

# Batch 8: Research images and remaining assets
echo "Creating Batch 8: Research images..."
mkdir -p /tmp/github-deploy/batch-8/client/public
cp -r client/public/research /tmp/github-deploy/batch-8/client/public/ 2>/dev/null || true

# Count files in each batch
echo ""
echo "Batch Summary:"
echo "=============="
for i in {1..8}; do
  if [ -d "/tmp/github-deploy/batch-$i" ]; then
    file_count=$(find "/tmp/github-deploy/batch-$i" -type f | wc -l)
    dir_count=$(find "/tmp/github-deploy/batch-$i" -type d | wc -l)
    size=$(du -sh "/tmp/github-deploy/batch-$i" | cut -f1)
    echo "Batch $i: $file_count files, $dir_count directories, $size total"
  fi
done

echo ""
echo "GitHub deployment batches created in /tmp/github-deploy/"
echo "Ready for upload to: https://github.com/ledhaseeb/tv-tantrum-catalog"