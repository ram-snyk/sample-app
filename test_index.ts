import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
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
app.use(express.json());

// Existing Local Upload
app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Fix: Sanitize output to prevent XSS
  res.json({ message: 'File uploaded', filename: req.file.filename });
});

// Fix: Validate URL to prevent SSRF
app.get('/fetch-remote', async (req, res) => {
  const targetUrl = req.query.url as string;

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL parameter is required.' });
  }

  try {
    // Fix: Validate URL to prevent SSRF attacks
    const url = new URL(targetUrl);
    
    // Block private/internal IP ranges and localhost
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '169.254.169.254', // AWS metadata
      '::1'
    ];
    
    const hostname = url.hostname.toLowerCase();
    
    // Check for blocked hosts
    if (blockedHosts.includes(hostname)) {
      return res.status(400).json({ error: 'Access to this URL is not allowed.' });
    }
    
    // Check for private IP ranges
    if (hostname.startsWith('10.') || 
        hostname.startsWith('192.168.') || 
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return res.status(400).json({ error: 'Access to private IP ranges is not allowed.' });
    }
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return res.status(400).json({ error: 'Only HTTP and HTTPS protocols are allowed.' });
    }

    const response = await axios.get(targetUrl, {
      timeout: 5000,
      maxRedirects: 5
    });
    
    // Fix: Use JSON response to prevent XSS
    res.json({ data: response.data });
  } catch (error) {
    // Fix: Sanitize error message to prevent XSS
    res.status(500).json({ error: 'Error fetching URL' });
  }
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
app.listen(3001, () => {
  console.log('Server listening on port 3001');
});