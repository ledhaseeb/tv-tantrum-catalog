#!/bin/bash

# Create minimal deployment package for Railway
echo "Creating minimal TV Tantrum deployment package..."

rm -rf tv-tantrum-deploy
mkdir -p tv-tantrum-deploy

# Core files only
cp package.json tv-tantrum-deploy/
cp package-lock.json tv-tantrum-deploy/
cp railway.toml tv-tantrum-deploy/
cp Dockerfile tv-tantrum-deploy/
cp tsconfig.json tv-tantrum-deploy/
cp vite.config.ts tv-tantrum-deploy/
cp tailwind.config.ts tv-tantrum-deploy/
cp postcss.config.js tv-tantrum-deploy/
cp components.json tv-tantrum-deploy/
cp drizzle.config.ts tv-tantrum-deploy/
cp data-migration-script.sql tv-tantrum-deploy/
cp README.md tv-tantrum-deploy/

# Server (compress to single files where possible)
cp -r server tv-tantrum-deploy/

# Shared schemas
cp -r shared tv-tantrum-deploy/

# Migrations
cp -r migrations tv-tantrum-deploy/

# Client source only (no public assets initially)
mkdir -p tv-tantrum-deploy/client
cp -r client/src tv-tantrum-deploy/client/
cp client/index.html tv-tantrum-deploy/client/

# Essential public files only
mkdir -p tv-tantrum-deploy/client/public
cp client/public/*.ico tv-tantrum-deploy/client/public/ 2>/dev/null || true
cp client/public/*.png tv-tantrum-deploy/client/public/ 2>/dev/null || true

# Research images (most critical)
cp -r client/public/research tv-tantrum-deploy/client/public/

echo "Minimal package created: $(du -sh tv-tantrum-deploy | cut -f1)"
echo "Files: $(find tv-tantrum-deploy -type f | wc -l)"

# Create deployable archive
cd tv-tantrum-deploy && tar -czf ../tv-tantrum-minimal.tar.gz .
cd ..
echo "Deployment archive: $(du -sh tv-tantrum-minimal.tar.gz | cut -f1)"