import { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Set up storage for our uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export function setupDirectUpload(app: Express) {
  // Make sure upload directory exists
  const uploadDir = path.join(__dirname, '../public/research');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Simple file upload endpoint for research images
  app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
    try {
      // Check if we got a file
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = req.file.originalname.replace(/\s+/g, '-');
      const filename = `${timestamp}-${originalName}`;
      
      // Save to research directory
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      // Return URL to the file
      const fileUrl = `/research/${filename}`;
      
      console.log(`File uploaded successfully: ${fileUrl}`);
      return res.json({ url: fileUrl });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}