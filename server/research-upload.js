// Simple file upload handler for research images
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), 'public', 'research');
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  }
});

// Create upload middleware
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Export the function to set up routes
module.exports = function setupResearchUpload(app) {
  app.post('/api/upload', upload.single('file'), (req, res) => {
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
  
  console.log('Research file upload endpoint registered');
};