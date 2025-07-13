import { NextRequest, NextResponse } from 'next/server';
import config from '../../config';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Check if this is a PhonePe statement by examining the file name
    const file = formData.get('file') as File;
    let backendUrl = `${config.backendUrl}/analyze`;
    
    if (file && file.name.toLowerCase().includes('phonepe')) {
      // This is a PhonePe statement, use the PhonePe endpoint
      backendUrl = `${config.backendUrl}/analyze-phonepe`;
      console.log(`Detected PhonePe statement, redirecting to: ${backendUrl}`);
    } else {
      console.log(`Forwarding request to backend: ${backendUrl}`);
    }
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });

    // Get response data
    const data = await response.json();
    
    // Return the backend response with the same status
    return NextResponse.json(data, { status: response.status });
    
  } catch (error: any) {
    console.error('Error proxying request to backend:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to analysis service',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
} 