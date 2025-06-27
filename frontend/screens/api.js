// API helper for backend integration
const BASE_URL = 'https://demo-bl6p.onrender.com';

// Helper to upload a file (PDF) and get JSON response
async function uploadFile(endpoint, fileUri, extraFields = {}) {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: 'statement.pdf',
    type: 'application/pdf',
  });
  // Add any extra fields if needed
  Object.entries(extraFields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Server error');
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Analyze generic statement
export async function analyzeStatement(fileUri) {
  return uploadFile('/analyze', fileUri);
}

// Analyze PhonePe statement
export async function analyzePhonePe(fileUri) {
  return uploadFile('/analyze-phonepe', fileUri);
}

// Analyze Kotak statement
export async function analyzeKotak(fileUri) {
  return uploadFile('/analyze-kotak', fileUri);
}

// Unlock password-protected PDF
export async function unlockPDF(fileUri, password) {
  return uploadFile('/unlock-pdf', fileUri, { password });
} 