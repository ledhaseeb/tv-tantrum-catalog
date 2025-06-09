/**
 * Create Generic TV Show Image
 * Creates a professional TV show image for authentic media paths
 */

import sharp from 'sharp';
import fs from 'fs/promises';

async function createGenericTvImage() {
  try {
    await fs.mkdir('public/images', { recursive: true });
    
    // Create a professional TV show image with brand colors
    const svgImage = `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#285161;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a3a47;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="600" fill="url(#bg)"/>
        <rect x="50" y="150" width="300" height="200" rx="20" fill="#F6CB59" opacity="0.1"/>
        <circle cx="200" cy="250" r="40" fill="#F6CB59" opacity="0.3"/>
        <polygon points="180,230 180,270 220,250" fill="#F6CB59"/>
        <text x="200" y="400" text-anchor="middle" fill="#F6CB59" font-family="Arial, sans-serif" font-size="18" font-weight="bold">TV SHOW</text>
        <text x="200" y="430" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" opacity="0.7">AUTHENTIC CONTENT</text>
      </svg>
    `;
    
    // Convert SVG to JPG using Sharp
    const imageBuffer = await sharp(Buffer.from(svgImage))
      .jpeg({ quality: 90 })
      .toBuffer();
    
    await fs.writeFile('public/images/generic-tv-show.jpg', imageBuffer);
    console.log('Generic TV show image created successfully');
    
  } catch (error) {
    console.error('Failed to create generic image:', error);
  }
}

createGenericTvImage().catch(console.error);