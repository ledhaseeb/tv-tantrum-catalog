import { Express } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

// Configure multer storage for research files
const researchStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'research');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  }
});

// Create multer upload middleware
const researchUpload = multer({ 
  storage: researchStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Setup upload routes
export function setupUploadRoutes(app: Express) {
  // Research image upload endpoint
  app.post('/api/upload', researchUpload.single('file'), (req, res) => {
    try {
      console.log('Research file upload request received');
      
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Return URL to uploaded file
      const fileUrl = `/research/${req.file.filename}`;
      console.log(`File uploaded successfully to ${fileUrl}`);
      
      return res.json({ url: fileUrl });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}