#!/bin/bash
# Create GitHub upload batches (max 100 files each)
# TV Tantrum production deployment

echo "Creating GitHub upload batches..."
rm -rf /tmp/github-upload-batches
mkdir -p /tmp/github-upload-batches

# Batch 1: Core Configuration (CRITICAL - Upload First)
echo "Batch 1: Configuration files"
mkdir -p /tmp/github-upload-batches/batch-1
cp package.json /tmp/github-upload-batches/batch-1/
cp railway.toml /tmp/github-upload-batches/batch-1/
cp Dockerfile /tmp/github-upload-batches/batch-1/
cp .dockerignore /tmp/github-upload-batches/batch-1/
cp README.md /tmp/github-upload-batches/batch-1/
cp .gitignore /tmp/github-upload-batches/batch-1/
cp drizzle.config.ts /tmp/github-upload-batches/batch-1/
cp vite.config.ts /tmp/github-upload-batches/batch-1/
cp tailwind.config.ts /tmp/github-upload-batches/batch-1/
cp tsconfig.json /tmp/github-upload-batches/batch-1/
cp postcss.config.js /tmp/github-upload-batches/batch-1/
cp components.json /tmp/github-upload-batches/batch-1/
cp data-migration-script.sql /tmp/github-upload-batches/batch-1/
count1=$(find /tmp/github-upload-batches/batch-1 -type f | wc -l)
echo "Files in batch 1: $count1"

# Batch 2: Server Backend
echo "Batch 2: Server backend"
mkdir -p /tmp/github-upload-batches/batch-2
cp -r server /tmp/github-upload-batches/batch-2/
count2=$(find /tmp/github-upload-batches/batch-2 -type f | wc -l)
echo "Files in batch 2: $count2"

# Batch 3: Shared + Client Core
echo "Batch 3: Shared schemas + Client core"
mkdir -p /tmp/github-upload-batches/batch-3
cp -r shared /tmp/github-upload-batches/batch-3/
mkdir -p /tmp/github-upload-batches/batch-3/client/src
cp client/index.html /tmp/github-upload-batches/batch-3/client/
cp client/env.d.ts /tmp/github-upload-batches/batch-3/client/
cp client/src/main.tsx /tmp/github-upload-batches/batch-3/client/src/
cp client/src/index.css /tmp/github-upload-batches/batch-3/client/src/
cp -r client/src/lib /tmp/github-upload-batches/batch-3/client/src/ 2>/dev/null || true
cp -r client/src/assets /tmp/github-upload-batches/batch-3/client/src/ 2>/dev/null || true
cp client/src/App*.tsx /tmp/github-upload-batches/batch-3/client/src/ 2>/dev/null || true
count3=$(find /tmp/github-upload-batches/batch-3 -type f | wc -l)
echo "Files in batch 3: $count3"

# Split client components if too many files
client_components_count=$(find client/src/components -type f 2>/dev/null | wc -l)
if [ "$client_components_count" -gt 80 ]; then
    # Batch 4: Client Components Part 1
    echo "Batch 4: Client components (Part 1)"
    mkdir -p /tmp/github-upload-batches/batch-4/client/src/components
    find client/src/components -name "*.tsx" | head -60 | while read file; do
        rel_path=${file#client/src/components/}
        mkdir -p "/tmp/github-upload-batches/batch-4/client/src/components/$(dirname "$rel_path")"
        cp "$file" "/tmp/github-upload-batches/batch-4/client/src/components/$rel_path"
    done
    count4=$(find /tmp/github-upload-batches/batch-4 -type f | wc -l)
    echo "Files in batch 4: $count4"
    
    # Batch 5: Client Components Part 2 + Hooks
    echo "Batch 5: Client components (Part 2) + hooks"
    mkdir -p /tmp/github-upload-batches/batch-5/client/src
    find client/src/components -name "*.tsx" | tail -n +61 | while read file; do
        rel_path=${file#client/src/components/}
        mkdir -p "/tmp/github-upload-batches/batch-5/client/src/components/$(dirname "$rel_path")"
        cp "$file" "/tmp/github-upload-batches/batch-5/client/src/components/$rel_path"
    done
    cp -r client/src/hooks /tmp/github-upload-batches/batch-5/client/src/ 2>/dev/null || true
    count5=$(find /tmp/github-upload-batches/batch-5 -type f | wc -l)
    echo "Files in batch 5: $count5"
    
    # Batch 6: Client Pages
    echo "Batch 6: Client pages"
    mkdir -p /tmp/github-upload-batches/batch-6/client/src
    cp -r client/src/pages /tmp/github-upload-batches/batch-6/client/src/ 2>/dev/null || true
    count6=$(find /tmp/github-upload-batches/batch-6 -type f | wc -l)
    echo "Files in batch 6: $count6"
else
    # Batch 4: All Client Components + Hooks + Pages
    echo "Batch 4: All client components, hooks, and pages"
    mkdir -p /tmp/github-upload-batches/batch-4/client/src
    cp -r client/src/components /tmp/github-upload-batches/batch-4/client/src/ 2>/dev/null || true
    cp -r client/src/hooks /tmp/github-upload-batches/batch-4/client/src/ 2>/dev/null || true
    cp -r client/src/pages /tmp/github-upload-batches/batch-4/client/src/ 2>/dev/null || true
    count4=$(find /tmp/github-upload-batches/batch-4 -type f | wc -l)
    echo "Files in batch 4: $count4"
fi

# Batch for remaining public assets (if any)
public_count=$(find client/public -type f 2>/dev/null | wc -l)
if [ "$public_count" -gt 0 ]; then
    batch_num=$(ls /tmp/github-upload-batches/ | grep "batch-" | wc -l)
    next_batch=$((batch_num + 1))
    echo "Batch $next_batch: Public assets"
    mkdir -p /tmp/github-upload-batches/batch-$next_batch
    cp -r client/public /tmp/github-upload-batches/batch-$next_batch/client/ 2>/dev/null || true
    count_public=$(find /tmp/github-upload-batches/batch-$next_batch -type f | wc -l)
    echo "Files in batch $next_batch: $count_public"
fi

echo ""
echo "Upload batches created in /tmp/github-upload-batches/"
ls -la /tmp/github-upload-batches/

# Create upload instructions
cat > /tmp/github-upload-batches/UPLOAD_ORDER.txt << EOF
TV Tantrum GitHub Upload Instructions
====================================

Upload batches in this EXACT order to your repository:
https://github.com/ledhaseeb/tv-tantrum-catalog

1. BATCH 1 (UPLOAD FIRST - CRITICAL)
   - Contains package.json, railway.toml, Dockerfile
   - Railway can start deployment after this batch
   - Essential configuration files

2. BATCH 2
   - Server backend with all APIs
   - Database connections and storage

3. BATCH 3
   - Shared schemas and client core files
   - Basic React setup

4. BATCH 4 (and 5, 6 if they exist)
   - React components, hooks, and pages
   - Complete frontend functionality

Upload Method:
1. Go to https://github.com/ledhaseeb/tv-tantrum-catalog
2. Click "Add file" > "Upload files"
3. Drag all files from batch folder
4. Commit with message: "TV Tantrum production batch X"
5. Repeat for next batch

After Batch 1: Railway can begin deployment
After All Batches: Full functionality available
EOF

echo ""
echo "Instructions saved to: /tmp/github-upload-batches/UPLOAD_ORDER.txt"