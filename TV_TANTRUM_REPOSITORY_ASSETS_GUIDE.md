# TV Tantrum Repository Assets Guide

## Complete Repository Duplication Requirements

### Files Already Exported (✅ Available)
- **repomix-output.xml** - Complete source code (1.6M chars, 361k tokens)
- All TypeScript/JavaScript files
- React components and pages  
- Server routes and database logic
- Configuration files (package.json, tsconfig, etc.)
- Documentation and utility scripts

### Essential Assets for Full Duplication

#### 1. Media Assets (404MB total)
**Location: `tv-tantrum-assets/`**

- `attached_assets/` (Screenshots, product images)
- `custom-images/` (Custom TV show images)  
- `media/` (Show media files)
- Image files: *.png, *.jpg, *.jpeg, *.gif, *.webp

#### 2. Database Structure
**Location: `tv-tantrum-assets/migrations/`**

- Database migration files
- Schema definitions
- Initial data setup

#### 3. Configuration Data
**Files available for download:**

- `customImageMap.json` (19KB) - Maps custom images to shows
- `customShowDetailsMap.json` (290KB) - Custom show metadata
- `tvshow_sensory_data.csv` (91KB) - Sensory details for shows

#### 4. Raw Data
**Location: `tv-tantrum-assets/data/`**

- CSV exports
- Research data
- Show metadata

## What Can Be Regenerated (Not Critical)

- `node_modules/` - Run `npm install`
- `dist/` and `build/` - Run build commands
- `.git/` - Initialize new repository
- Temporary files and caches

## Repository Recreation Steps

1. **Extract source code** from `repomix-output.xml`
2. **Download assets** from `tv-tantrum-assets/` folder
3. **Run setup commands:**
   ```bash
   npm install
   npm run db:push
   npm run dev
   ```
4. **Import media assets** to appropriate directories
5. **Configure environment variables** (database, API keys)

## Current Asset Summary

**Available in tv-tantrum-assets/ folder:**
- Total size: 404MB
- attached_assets/ (product images and screenshots)
- custom-images/ (6,392 custom show images)
- media/ (show media files)
- migrations/ (database schema)
- data/ (raw data files)
- customImageMap.json (image mappings)
- customShowDetailsMap.json (show metadata)
- tvshow_sensory_data.csv (sensory data)

## Download Recommendations

**Priority 1 (Essential):**
- repomix-output.xml (source code)
- migrations/ (database structure)
- customImageMap.json
- customShowDetailsMap.json

**Priority 2 (Visual Content):**
- custom-images/ (for show display)
- attached_assets/ (documentation images)

**Priority 3 (Optional):**
- media/ (additional media files)
- data/ (raw data for analysis)