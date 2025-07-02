import { NextRequest, NextResponse } from 'next/server';
import config from '../../config';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the incoming form data
    const incomingFormData = await request.formData();
    
    // Rebuild a new FormData to forward
    const formData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      formData.append(key, value);
    }

    const backendUrl = `${config.backendUrl}/analyze-phonepe`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      // Do NOT forward headers, let fetch set the correct Content-Type for FormData
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, return a generic error
      return NextResponse.json(
        { error: 'Backend did not return valid JSON', details: await response.text() },
        { status: 500 }
      );
    }
    
    // Return the backend response with the same status
    return NextResponse.json(data, { status: response.status });
    
  } catch (error: any) {
    console.error('Error proxying PhonePe request to backend:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to PhonePe analysis service',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
} 