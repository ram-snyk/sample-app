import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import axios from 'axios'; // Import axios to perform the SSRF-vulnerable fetch

export const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.json()); // To parse JSON bodies if needed

// Existing Local Upload
app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send(`File uploaded: ${req.file.filename}`);
});

// --- ADDED SSRF VULNERABILITY ---
// This endpoint takes a 'url' query parameter and fetches it from the server.
// Attackers can use this to scan internal ports or access cloud metadata.
app.get('/fetch-remote', async (req, res) => {
  const targetUrl = req.query.url; 

  if (!targetUrl) {
    return res.status(400).send('URL parameter is required.');
  }

  try {
    // VULNERABILITY: No validation on 'targetUrl'
    // An attacker could pass http://localhost:3000 or http://169.254.169.254
    const response = await axios.get(targetUrl);
    res.send(response.data);
  } catch (error) {
    // Fix: Use JSON response to prevent XSS and avoid exposing sensitive error details
    res.status(500).json({ error: 'Failed to fetch the requested URL' });
  }
});

// Existing Download (Potential Path Traversal if not careful)
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(process.cwd(), 'uploads', req.params.filename);
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', () => {
    res.status(404).send('File not found');
  });
  fileStream.pipe(res);
});

// Start the server 
app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
