// Configure API endpoints
const config = {
  // Your Render backend URL
  backendUrl: 'https://statement-analyzer-backend.onrender.com',
  // Local proxy API paths
  apiPaths: {
    analyzeStatement: '/api/analyze-statement',
    analyzeKotak: '/api/analyze-kotak-statement',
    analyzePhonepe: '/api/analyze-phonepe',
    unlockPdf: '/api/unlock-pdf'
  }
};

export default config; 