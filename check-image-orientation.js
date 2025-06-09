const fetch = require('node-fetch');

// Function to check if image is landscape or portrait
async function checkImageOrientation(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { success: false, error: `Failed to fetch image: ${response.statusText}` };
    }
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function() {
        const isLandscape = img.width > img.height;
        resolve({
          success: true,
          url: imageUrl,
          width: img.width,
          height: img.height,
          isLandscape: isLandscape,
          isPortrait: !isLandscape
        });
      };
      img.onerror = function() {
        resolve({ success: false, error: 'Failed to load image', url: imageUrl });
      };
      img.src = URL.createObjectURL(response.blob());
    });
  } catch (error) {
    return { success: false, error: error.message, url: imageUrl };
  }
}

// Import the shows from our data
const fs = require('fs');
const path = require('path');

// This script will run from the project root
const showsPath = path.join(__dirname, 'shows.json');

fs.readFile(showsPath, 'utf8', async (err, data) => {
  if (err) {
    console.error('Error reading shows.json:', err);
    return;
  }
  
  try {
    const shows = JSON.parse(data);
    console.log(`Found ${shows.length} shows in shows.json`);
    
    const landscapeImages = [];
    const portraitImages = [];
    const failedChecks = [];
    
    for (const show of shows) {
      if (show.imageUrl) {
        const result = await checkImageOrientation(show.imageUrl);
        if (result.success) {
          if (result.isLandscape) {
            landscapeImages.push({
              id: show.id,
              name: show.name,
              imageUrl: show.imageUrl,
              width: result.width,
              height: result.height
            });
          } else {
            portraitImages.push({
              id: show.id,
              name: show.name,
              imageUrl: show.imageUrl,
              width: result.width,
              height: result.height
            });
          }
        } else {
          failedChecks.push({
            id: show.id,
            name: show.name,
            imageUrl: show.imageUrl,
            error: result.error
          });
        }
      }
    }
    
    console.log(`\nFound ${landscapeImages.length} shows with landscape images:`);
    landscapeImages.forEach(show => {
      console.log(`- ID: ${show.id}, Name: ${show.name}, Dimensions: ${show.width}x${show.height}`);
    });
    
    console.log(`\nFound ${portraitImages.length} shows with portrait images.`);
    
    console.log(`\n${failedChecks.length} images failed to check:`);
    failedChecks.forEach(show => {
      console.log(`- ID: ${show.id}, Name: ${show.name}, Error: ${show.error}`);
    });
    
    // Save results to file
    fs.writeFileSync('landscape-shows.json', JSON.stringify(landscapeImages, null, 2));
    console.log('\nSaved landscape show list to landscape-shows.json');
  } catch (error) {
    console.error('Error processing shows:', error);
  }
});