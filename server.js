const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { shouldBlockRequest, CONFIG } = require('./user_agent_config');

const app = express();
const port = process.env.PORT || 5000;

// User-Agent blocking middleware
const userAgentMiddleware = (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    
    // Check if request should be blocked
    const { shouldBlock, message, statusCode } = shouldBlockRequest(userAgent);
    
    if (shouldBlock) {
        if (CONFIG.logBlockedRequests) {
            console.warn(`Request blocked. User-Agent: ${userAgent}`);
        }
        
        return res.status(statusCode).json({
            error: statusCode === 403 ? 'Forbidden' : 'Not Found',
            message: message
        });
    }
    
    // Continue with the request if it's allowed
    next();
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(userAgentMiddleware);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Routes
app.post('/api/analyze-statement', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);

    // Process the PDF data here
    // This is a placeholder for your actual PDF processing logic
    const analysis = {
      transactions: [],
      totalSpent: 0,
      totalReceived: 0,
      categoryBreakdown: {}
    };

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json(analysis);
  } catch (error) {
    console.error('Error processing statement:', error);
    res.status(500).json({ error: 'Failed to process statement' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 