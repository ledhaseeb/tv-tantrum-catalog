import sharp from 'sharp';

async function convertAvifToJpg() {
  try {
    await sharp('attached_assets/the enchanted world of brambly hedge.avif')
      .jpeg({ quality: 90 })
      .toFile('./client/public/custom-images/the-enchanted-world-of-brambly-hedge.jpg');
    console.log('Conversion successful');
  } catch (error) {
    console.error('Error converting image:', error);
  }
}

convertAvifToJpg();