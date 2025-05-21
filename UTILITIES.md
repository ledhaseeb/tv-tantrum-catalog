# TV Tantrum Utilities

This document provides an overview of the consolidated utility scripts that have been created to streamline maintenance and updates to the TV Tantrum application.

## Overview

We've consolidated multiple overlapping scripts into a few core utilities to make the codebase more maintainable:

1. **Image Optimizer** - Handles optimization of images for better SEO and performance
2. **API Data Updater** - Updates TV show data from OMDb and YouTube APIs
3. **Image Manager** - Handles mapping, restoration, and consolidation of images
4. **Data Manager** - Consolidates TV show data from multiple sources and updates sensory details

## Image Optimizer (`image-optimizer.js`)

Consolidated from:
- optimize-custom-images.js
- optimize-seo-images.js

This utility optimizes images for better SEO and performance:

```bash
# Run image optimization
node image-optimizer.js
```

Functions:
- `optimizeAllImages()` - Optimizes all images in the database
- `optimizeImage(filePath, showId)` - Optimizes a single image
- `getImage(imageUrl, showId)` - Downloads or copies an image from URL or local path
- `updateShowImage(showId, optimizedUrl)` - Updates a show's image URL in the database

## API Data Updater (`api-data-updater.js`)

Consolidated from:
- update-api-data.js
- update-all-shows-api-data.js
- update-youtube-metadata.js

This utility updates TV show data from OMDb and YouTube APIs:

```bash
# Run full API data update 
node api-data-updater.js

# Run YouTube-only update
node api-data-updater.js --youtube
```

Functions:
- `updateAllShowsApiData()` - Updates all shows with data from OMDb and YouTube APIs
- `updateYouTubeShows()` - Updates only YouTube shows/channels
- `updateShowWithApiData(show)` - Updates a single show with API data

## Image Manager (`image-manager.js`)

Consolidated from:
- map-custom-images.js
- update-custom-images.js
- restore-custom-images.js
- consolidate-images.js

This utility manages image mappings, restoration, and consolidation:

```bash
# Map custom images to TV shows
node image-manager.js --map

# Restore custom images from backup
node image-manager.js --restore

# Consolidate images into a single directory
node image-manager.js --consolidate
```

Functions:
- `mapCustomImages()` - Maps custom images to TV shows
- `restoreCustomImages()` - Restores custom images from backup
- `consolidateImages()` - Consolidates images into a single directory
- `loadCustomImageMap()` - Loads the custom image map from file
- `saveCustomImageMap()` - Saves the custom image map to file

## Data Manager (`data-manager.js`)

Consolidated from:
- consolidate-tv-data.js
- update-sensory-details.js
- update-show-metrics.js

This utility manages TV show data:

```bash
# Consolidate TV show data from multiple sources
node data-manager.js --consolidate

# Update sensory details for TV shows
node data-manager.js --sensory
```

Functions:
- `consolidateTvData()` - Consolidates TV show data from multiple sources
- `updateSensoryDetails()` - Updates sensory details for TV shows
- `loadCustomShowDetails()` - Loads custom show details from file
- `saveCustomShowDetails()` - Saves custom show details to file
- `updateTvShow(id, details)` - Updates a TV show's details in the database

## Usage Examples

### Updating TV Show Data

To completely refresh the TV show data from all sources:

1. Consolidate data from multiple sources:
   ```bash
   node data-manager.js --consolidate
   ```

2. Update with latest API data:
   ```bash
   node api-data-updater.js
   ```

3. Optimize all images:
   ```bash
   node image-optimizer.js
   ```

### Managing Custom Images

To ensure custom images are correctly applied:

1. Map any new custom images:
   ```bash
   node image-manager.js --map
   ```

2. Restore custom images if they've been overwritten:
   ```bash
   node image-manager.js --restore
   ```

## Maintenance Tips

- Run these utilities in the order listed for optimal results
- Always back up data files before running major updates
- The utility scripts maintain consistency with existing data structures
- All utilities export their functions for use in other modules

## Benefits of Consolidation

- Reduced code duplication
- More maintainable codebase
- Consistent error handling
- Better performance through optimized operations
- Clear documentation and usage instructions