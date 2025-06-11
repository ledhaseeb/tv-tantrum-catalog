#!/bin/bash
# Create GitHub upload batches (max 100 files each)
# For TV Tantrum deployment

echo "📦 Creating GitHub Upload Batches (100 files max each)"
echo "====================================================="

# Clean and create batch directories
rm -rf /tmp/github-batches
mkdir -p /tmp/github-batches

# Batch 1: Core Configuration Files (Root)
echo "📋 Batch 1: Configuration Files"
mkdir -p /tmp/github-batches/batch-1
cp package.json /tmp/github-batches/batch-1/
cp railway.toml /tmp/github-batches/batch-1/
cp Dockerfile /tmp/github-batches/batch-1/
cp .dockerignore /tmp/github-batches/batch-1/
cp README.md /tmp/github-batches/batch-1/
cp .gitignore /tmp/github-batches/batch-1/
cp drizzle.config.ts /tmp/github-batches/batch-1/
cp vite.config.ts /tmp/github-batches/batch-1/
cp tailwind.config.ts /tmp/github-batches/batch-1/
cp tsconfig.json /tmp/github-batches/batch-1/
cp postcss.config.js /tmp/github-batches/batch-1/
cp components.json /tmp/github-batches/batch-1/
echo "Files in batch 1: $(find /tmp/github-batches/batch-1 -type f | wc -l)"

# Batch 2: Server Directory
echo "📋 Batch 2: Server Backend"
mkdir -p /tmp/github-batches/batch-2/server
cp -r server/* /tmp/github-batches/batch-2/server/
echo "Files in batch 2: $(find /tmp/github-batches/batch-2 -type f | wc -l)"

# Batch 3: Shared Directory + Client Core
echo "📋 Batch 3: Shared Schemas + Client Core"
mkdir -p /tmp/github-batches/batch-3/shared
mkdir -p /tmp/github-batches/batch-3/client
cp -r shared/* /tmp/github-batches/batch-3/shared/
cp client/index.html /tmp/github-batches/batch-3/client/
cp client/env.d.ts /tmp/github-batches/batch-3/client/
cp client/src/main.tsx /tmp/github-batches/batch-3/client/src/
cp client/src/index.css /tmp/github-batches/batch-3/client/src/
cp -r client/src/lib /tmp/github-batches/batch-3/client/src/
echo "Files in batch 3: $(find /tmp/github-batches/batch-3 -type f | wc -l)"

# Batch 4: Client Components (Part 1)
echo "📋 Batch 4: Client Components (Part 1)"
mkdir -p /tmp/github-batches/batch-4/client/src
cp -r client/src/components /tmp/github-batches/batch-4/client/src/
echo "Files in batch 4: $(find /tmp/github-batches/batch-4 -type f | wc -l)"

# Batch 5: Client Pages + Hooks
echo "📋 Batch 5: Client Pages + Hooks"
mkdir -p /tmp/github-batches/batch-5/client/src
cp -r client/src/pages /tmp/github-batches/batch-5/client/src/
cp -r client/src/hooks /tmp/github-batches/batch-5/client/src/
cp -r client/src/assets /tmp/github-batches/batch-5/client/src/
cp client/src/App*.tsx /tmp/github-batches/batch-5/client/src/
echo "Files in batch 5: $(find /tmp/github-batches/batch-5 -type f | wc -l)"

# Batch 6: Public Assets (Essential only)
echo "📋 Batch 6: Essential Public Assets"
mkdir -p /tmp/github-batches/batch-6/public
cp public/robots.txt /tmp/github-batches/batch-6/public/ 2>/dev/null || echo "robots.txt not found"
cp public/favicon.ico /tmp/github-batches/batch-6/public/ 2>/dev/null || echo "favicon.ico not found"
cp -r public/images /tmp/github-batches/batch-6/public/ 2>/dev/null || echo "images directory not found"
echo "Files in batch 6: $(find /tmp/github-batches/batch-6 -type f | wc -l)"

echo ""
echo "✅ Upload batches created:"
echo "📁 /tmp/github-batches/batch-1 (Config files)"
echo "📁 /tmp/github-batches/batch-2 (Server backend)"
echo "📁 /tmp/github-batches/batch-3 (Shared + Client core)"
echo "📁 /tmp/github-batches/batch-4 (Client components)"
echo "📁 /tmp/github-batches/batch-5 (Client pages + hooks)"
echo "📁 /tmp/github-batches/batch-6 (Public assets)"

# Create upload instructions
cat > /tmp/github-batches/UPLOAD_ORDER.md << EOF
# GitHub Upload Order for TV Tantrum

Upload batches in this exact order:

## Batch 1: Configuration (UPLOAD FIRST)
- Essential config files for Railway deployment
- Contains package.json, railway.toml, Dockerfile
- Files: $(find /tmp/github-batches/batch-1 -type f | wc -l)

## Batch 2: Server Backend  
- Express server with all API routes
- Database connections and storage
- Files: $(find /tmp/github-batches/batch-2 -type f | wc -l)

## Batch 3: Shared + Client Core
- TypeScript schemas and main client files
- Core React setup
- Files: $(find /tmp/github-batches/batch-3 -type f | wc -l)

## Batch 4: Client Components
- React UI components
- TV show display components
- Files: $(find /tmp/github-batches/batch-4 -type f | wc -l)

## Batch 5: Client Pages + Hooks
- React pages and custom hooks
- App routing components
- Files: $(find /tmp/github-batches/batch-5 -type f | wc -l)

## Batch 6: Public Assets
- Static files and images
- Files: $(find /tmp/github-batches/batch-6 -type f | wc -l)

After uploading Batch 1, Railway can start deployment.
Complete functionality available after all batches uploaded.
EOF

echo "📄 Upload instructions saved to /tmp/github-batches/UPLOAD_ORDER.md"