# TV Tantrum Custom Data Handling

This document explains how custom data is managed in the TV Tantrum application. Custom data includes show details and images that need to be preserved from external data sources.

## Background

The application maintains two important JSON files:

1. `customShowDetailsMap.json` - Contains custom show details like stimulation scores, themes, descriptions, etc.
2. `customImageMap.json` - Contains custom image URLs for shows

These files are updated when:
- Changes are made through the admin dashboard
- The `update-show-metrics.js` script is run

## Performance Optimization

For better SEO and application performance, custom data is no longer loaded during server startup. Instead, the data is applied directly to the database using a separate script.

## How to Update Custom Data

### Step 1: Generate/Update Custom Data

You can generate or update custom data in one of two ways:

1. **Using the Admin Dashboard**
   - Log in as an admin
   - Edit shows through the admin interface
   - Changes will be saved to the customShowDetailsMap.json and customImageMap.json files

2. **Using the update-show-metrics.js script**
   - Run: `node update-show-metrics.js`
   - This script processes the data from tvshow_sensory_data.csv and updates customShowDetailsMap.json

### Step 2: Apply Custom Data to Database

After generating or updating custom data, apply it to the database:

```bash
node apply-custom-data.js
```

This script:
- Processes data from customShowDetailsMap.json and customImageMap.json
- Directly updates the database with this information
- Uses batch processing for efficiency
- Provides progress information during the update

## Key Benefits

- **Fast Server Startup**: The server no longer needs to process custom data during startup
- **Better SEO Performance**: Pages load faster since they don't wait for custom data processing
- **Scalability**: As the number of shows increases, this approach scales much better
- **Robustness**: Database updates are more reliable and can handle errors gracefully

## Best Practices

1. Run the `apply-custom-data.js` script after any significant updates to customShowDetailsMap.json or customImageMap.json
2. For large data updates, run the script during off-peak hours
3. Check the console output for any errors during the update process

## Workflow Summary

1. Update show details via admin dashboard or `update-show-metrics.js`
2. Run `apply-custom-data.js` to update the database
3. Restart the server if needed (though this isn't typically necessary)

This approach ensures the database always has the latest custom data without slowing down server startup.