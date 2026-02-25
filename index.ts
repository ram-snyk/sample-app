import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';

export const app = express();

// Fix: Disable X-Powered-By header
app.disable('x-powered-by');

const upload = multer({ dest: 'uploads/' });

// Fix: Add rate limiting for expensive operations
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many download requests, please try again later.'
});

app.use(express.static('public'));

// Fix: Sanitize output to prevent XSS
app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.json({ message: 'File uploaded', filename: req.file.filename });
});

// Fix: Add rate limiting and path traversal protection
app.get('/download/:filename', downloadLimiter, (req, res) => {
  const filename = req.params.filename;
  
  // Fix: Validate filename to prevent path traversal
  const sanitizedFilename = path.basename(filename);
  
  // Additional check: ensure no path traversal characters
  if (filename !== sanitizedFilename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadsDir, sanitizedFilename);
  
  // Ensure the resolved path is within the uploads directory
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadsDir = path.resolve(uploadsDir);
  
  if (!resolvedPath.startsWith(resolvedUploadsDir)) {
    return res.status(400).json({ error: 'Invalid file path' });
  }
  
  // Check if file exists before streaming
  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const fileStream = fs.createReadStream(resolvedPath);
  fileStream.on('error', () => {
    res.status(404).json({ error: 'File not found' });
  });
  fileStream.pipe(res);
});

// Start the server 
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});