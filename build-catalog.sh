#!/bin/bash

echo "Building TV Tantrum Catalog Version..."

# Step 1: Run migration to create catalog database structure
echo "Step 1: Setting up catalog database..."
node migrate-to-catalog.js

# Step 2: Install required dependencies
echo "Step 2: Installing dependencies..."
npm install express-session

# Step 3: Build the React application
echo "Step 3: Building React application..."
cd client && npm run build && cd ..

# Step 4: Start the catalog server
echo "Step 4: Starting catalog server..."
echo "TV Tantrum Catalog is ready to launch!"
echo "The catalog maintains all original filtering functionality while removing user features."
echo ""
echo "Features preserved:"
echo "- Home page with featured content"
echo "- Browse page with full filtering (age, stimulation score, themes)"
echo "- Compare page for side-by-side comparison"
echo "- About page"
echo "- Research summaries (read-only)"
echo "- Admin panel (password protected)"
echo ""
echo "Features removed:"
echo "- User registration/authentication"
echo "- Reviews and ratings"
echo "- Favorites"
echo "- Gamification features"
echo "- Social interactions"
echo ""
echo "To start the catalog server, run:"
echo "node server/catalog-index.ts"