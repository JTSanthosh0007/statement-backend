import { NextRequest, NextResponse } from 'next/server';
import config from '../../config';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the request to the actual backend
    const backendUrl = `${config.backendUrl}/analyze`;
    
    console.log(`Forwarding request to backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });

    // Get response data
    const data = await response.json();
    
    // Return the backend response with the same status
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error proxying request to backend:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to analysis service',
        details: error.message
      },
      { status: 500 }
    );
  }
} 