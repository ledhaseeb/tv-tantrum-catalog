import { Express, Request, Response } from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup memory storage for file uploads
const storage = multer.memoryStorage();

// Setup multer
const uploadMiddleware = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export function registerUploadRoutes(app: Express) {
  // File upload endpoint for research images and other files
  app.post("/api/upload", uploadMiddleware.single('file'), async (req: Request, res: Response) => {
    try {
      console.log("Handling file upload request");
      
      // Check if file was uploaded
      if (!req.file) {
        console.log("No file found in request");
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get the folder from the form data or use default
      const folder = req.body.folder || 'uploads';
      
      // Generate a unique filename
      const uniqueFilename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      
      // Save the file to the public folder with the unique name
      const targetDir = path.join(__dirname, '../public', folder);
      const targetPath = path.join(targetDir, uniqueFilename);
      
      // Ensure directory exists
      if (!fs.existsSync(targetDir)) {
        console.log(`Creating directory: ${targetDir}`);
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Write the file to disk
      fs.writeFileSync(targetPath, req.file.buffer);
      
      // Return the public URL
      const fileUrl = `/${folder}/${uniqueFilename}`;
      console.log(`File uploaded successfully: ${fileUrl}`);
      
      res.status(200).json({ 
        url: fileUrl,
        message: "File uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
}