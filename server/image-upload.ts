import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';

// Create all required image directories
const imageDir = './public/uploads';
const optimizedImageDir = './public/uploads/optimized';
const primaryImageDir = './public/media/tv-shows'; // Primary directory for TV show images

// Create directories if they don't exist
[imageDir, optimizedImageDir, primaryImageDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imageDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `show-image-${uniqueSuffix}${ext}`);
  }
});

// File filter to ensure only images are uploaded
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Initialize multer upload
export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

/**
 * Optimize an uploaded image for web use
 * @param filePath Path to the original uploaded file
 * @returns Path to the optimized image
 */
export async function optimizeImage(filePath: string): Promise<string> {
  const ext = path.extname(filePath);
  const filename = path.basename(filePath, ext);
  const optimizedFileName = `${filename}-optimized.jpg`;
  const optimizedPath = path.join(optimizedImageDir, optimizedFileName);
  const primaryMediaPath = path.join(primaryImageDir, optimizedFileName);
  
  try {
    // Get image dimensions first to determine appropriate sizing
    const metadata = await sharp(filePath).metadata();
    
    // Standardize to portrait format - target a 3:4 aspect ratio (portrait)
    // Width: If width > 600px, resize to 600px width
    // Height: Automatically calculated to maintain aspect ratio, but aim for portrait orientation
    
    // Default values if metadata isn't available
    const originalWidth = metadata.width || 800;
    const originalHeight = metadata.height || 600;
    
    // Target portrait sizes
    let targetWidth: number;
    let targetHeight: number;

    // If the original is already portrait or square, maintain aspect ratio but limit max dimensions
    if (originalHeight >= originalWidth) {
      // It's already portrait or square, so we'll just resize keeping the aspect ratio
      targetWidth = Math.min(originalWidth, 600); // Max width of 600px
      targetHeight = Math.round((targetWidth / originalWidth) * originalHeight);

      // Ensure height doesn't exceed 900px (for very tall images)
      if (targetHeight > 900) {
        targetHeight = 900;
        targetWidth = Math.round((targetHeight / originalHeight) * originalWidth);
      }
    } else {
      // It's landscape, so we need to constrain height more aggressively
      // Target a 3:4 aspect ratio (width:height) for portrait orientation
      targetHeight = Math.min(originalHeight, 800); // Max height of 800px
      targetWidth = Math.min(originalWidth, Math.round(targetHeight * 0.75)); // Ensure width is about 75% of height
    }

    // Generate optimized image buffer
    const imageBuffer = await sharp(filePath)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .jpeg({ quality: 85, progressive: true }) // Good balance of quality and file size
      .toBuffer();
    
    // Save to both locations
    await Promise.all([
      fs.promises.writeFile(optimizedPath, imageBuffer),
      fs.promises.writeFile(primaryMediaPath, imageBuffer)
    ]);
    
    console.log(`Image optimized: ${optimizedPath} (${targetWidth}x${targetHeight})`);
    console.log(`Also saved to primary media directory: ${primaryMediaPath}`);
    
    // The URL path is now media/tv-shows for consistent image access
    return `/media/tv-shows/${optimizedFileName}`;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Fallback to traditional path if there's an error
    try {
      // Still try to save to the old location as a fallback
      await sharp(filePath)
        .resize(600, 800, { fit: 'inside' })
        .jpeg({ quality: 85 })
        .toFile(optimizedPath);
      
      return `/uploads/optimized/${path.basename(optimizedPath)}`;
    } catch {
      // If that also fails, just return the original
      return `/uploads/${path.basename(filePath)}`;
    }
  }
}

// Error handler middleware for multer
export const uploadErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large',
        message: 'File size should not exceed 5MB' 
      });
    }
    return res.status(400).json({ 
      error: err.code,
      message: err.message 
    });
  }
  
  if (err) {
    return res.status(400).json({ 
      error: 'Invalid upload',
      message: err.message 
    });
  }
  
  next();
};