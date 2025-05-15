# Custom Data Handling Documentation

## Overview

This document explains the system for handling custom show details and images in TV Tantrum. The custom data handling system is designed to solve the following challenges:

1. **Performance Bottlenecks**: Loading and applying custom data during server startup caused significant delays
2. **Database Load**: Processing 300+ shows on every restart placed unnecessary load on the database
3. **Scaling Issues**: As the catalog grows, startup performance would continue to degrade

## Solution: Pre-processing Script

The new approach separates custom data application from server startup by using a pre-processing script:

- **File**: `apply-custom-data.mjs`
- **Purpose**: Directly updates the database with custom details and images outside the server startup process
- **Benefits**: 
  - Server starts much faster
  - Database connection is more stable
  - Better separation of concerns
  - Improved maintainability

## How It Works

### 1. Custom Data Files

Two JSON files store custom data:

- `customShowDetailsMap.json`: Maps show IDs to their custom details (stimulation metrics, etc.)
- `customImageMap.json`: Maps show IDs to their custom image URLs

### 2. Pre-processing Script

The `apply-custom-data.mjs` script:

- Connects to the database using the same configuration as the server
- Loads custom details and images from their respective JSON files
- Processes updates in batches to reduce database load
- Maps data keys from camelCase to snake_case to match database schema
- Converts JavaScript arrays to PostgreSQL array format
- Properly rounds stimulation scores to whole numbers
- Handles errors gracefully and provides detailed logs

### 3. Server Integration

Server startup is modified to:

- Skip custom data loading by default (configurable with environment variables)
- Display a message indicating how to apply custom data manually
- Process faster with fewer database operations

## Usage

### Running the Script

```
node apply-custom-data.mjs
```

This directly updates the database with all custom data and can be run:
- After initial database setup
- After any changes to the custom data files
- When you want to refresh the database with custom details

### Environment Variables

Two optional environment variables can control the behavior:

- `SKIP_CUSTOM_DETAILS`: Set to "true" to skip loading custom details during server startup
- `SKIP_CUSTOM_IMAGES`: Set to "true" to skip loading custom images during server startup

By default, both are now set to "true" for optimal performance.

## Data Preservation System

The custom data handling approach preserves these important details:

1. **Stimulation Scores**: Always stored as whole numbers, never decimals
2. **Image URLs**: Proper portrait-style images are preserved 
3. **Show Names**: Official branding names are maintained
4. **Themes**: Array of themes with proper encoding
5. **Rating Metrics**: All sensory/stimulation metrics from the original source

## Maintenance

When adding new shows or updating existing ones:

1. Update the appropriate JSON file with the custom details/images
2. Run the pre-processing script to apply changes to the database
3. The server will use the updated database values on the next startup

## Troubleshooting

If you encounter issues:

1. Check the console output of the pre-processing script for specific errors
2. Verify database connection settings match between script and server
3. Ensure the JSON files have valid formats
4. For schema changes, update the field mapping in the script