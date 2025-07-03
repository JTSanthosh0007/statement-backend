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

      // Set the backend URL
      const backendUrl = `${config.backendUrl}/analyze-canara`;
      console.log(`[Attempt ${retries + 1}] Sending request to backend URL:`, backendUrl);

      // Set a reasonable timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      // Send the request to the backend
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Parse the response
      const data = await response.json();

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

      // Success! Return the data
      console.log('Analysis successful');
      return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
      lastError = error;
      console.error(`Error analyzing Canara statement (attempt ${retries + 1}):`, error);

      // If it's a timeout or network error, retry
      if (error.name === 'AbortError' || error.message?.includes('network')) {
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