import { NextRequest, NextResponse } from 'next/server';
import config from '../../config';

/**
 * Maximum number of retries for API calls
 */
const MAX_RETRIES = 2;

/**
 * Handles the analysis of Canara Bank statements
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let retries = 0;
  let lastError: Error | null = null;

  console.log("API route handler triggered for analyze-canara");

  while (retries <= MAX_RETRIES) {
    try {
      // Extract form data from the request
      const formData = await request.formData();

      // Validate file exists in form data
      const file = formData.get('file');
      if (!file) {
        console.error('No file found in request');
        return NextResponse.json(
          { error: 'No file provided. Please select a PDF file.' },
          { status: 400 }
        );
      }

      console.log(`File received: ${(file as any).name}, size: ${(file as any).size} bytes`);

      // Make sure we're using the complete backend URL with explicit http/https protocol
      const backendUrl = `${config.backendUrl}/analyze-canara`;
      console.log(`[Attempt ${retries + 1}] Sending request to backend URL:`, backendUrl);

      // Set a reasonable timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout (statements can be large)

      // Create a new FormData to ensure proper file transfer
      const backendFormData = new FormData();
      backendFormData.append('file', file);

      // Send the request to the backend with explicit headers
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: backendFormData,
        signal: controller.signal,
        // Don't set Content-Type header, let the browser set it with the boundary parameter for multipart/form-data
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      console.log(`Backend response status: ${response.status}`);

      // Check for empty response
      if (!response.body) {
        console.error('Empty response received from backend');
        throw new Error('Empty response from backend server');
      }

      // Parse the response
      let data;
      try {
        data = await response.json();
        console.log('Response data structure:', Object.keys(data));
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid response format from backend');
      }

      // If response is not OK, handle specific error cases
      if (!response.ok) {
        console.error(`Backend returned error (${response.status}):`, data);

        // Check for specific error types
        if (data.details && data.details.includes('password')) {
          return NextResponse.json(
            { error: 'This PDF is password-protected. Please unlock it before uploading.' },
            { status: 400 }
          );
        }

        if (data.details && data.details.includes('No transactions found')) {
          return NextResponse.json(
            { error: 'No transactions could be found in this PDF. Please ensure this is a valid Canara Bank statement.' },
            { status: 400 }
          );
        }

        // General error with details from backend
        return NextResponse.json(
          {
            error: 'Failed to analyze statement',
            details: data.details || data.error || 'Unknown error'
          },
          { status: response.status }
        );
      }

      // Validate the data has the expected structure
      if (!data || !data.transactions || data.transactions.length === 0) {
        console.error('Invalid or empty transaction data received', data);
        return NextResponse.json(
          { error: 'No transactions found in the statement', details: 'The parser could not identify any transactions in this document' },
          { status: 400 }
        );
      }

      // Success! Return the data
      console.log('Analysis successful, found', data.transactions.length, 'transactions');
      return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
      lastError = error;
      console.error(`Error analyzing Canara statement (attempt ${retries + 1}):`, error);

      // If it's a timeout or network error, retry
      if (error.name === 'AbortError' || error.message?.includes('network') || error.message?.includes('fetch')) {
        retries++;
        if (retries <= MAX_RETRIES) {
          console.log(`Retrying... (${retries}/${MAX_RETRIES})`);
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }

  // If we get here, all retries failed or a non-retryable error occurred
  return NextResponse.json(
    {
      error: 'Failed to connect to analysis service',
      details: lastError?.message || 'Check your network connection and try again.'
    },
    { status: 500 }
  );
} 